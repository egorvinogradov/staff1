# coding: utf-8
from django.contrib import admin
from django.db.models.aggregates import Sum
from django.views.generic.simple import direct_to_template
import operator
import models as m
import forms as f
import pyExcelerator as xls
from django.db.transaction import commit_on_success
from datetime import datetime
from itertools import count, groupby
from utils import group_by_materialize

def _parse_day(s):
    return datetime.strptime(s.split(' ')[0], '%d.%m.%y').date()

def _create_day(menu, day):
    e = m.Day(day=(_parse_day(day) - menu.week).days, week=menu)
    e.save()
    return e

def _get_group(title):
    return m.Group.objects.get_or_create(title=title)[0]

class MenuAdmin(admin.ModelAdmin):
    form = f.MenuForm

    @commit_on_success
    def save_model(self, request, menu, form, change):
        first_sheet = False
        f = form.cleaned_data['source'].file
        for sheet_name, values in xls.parse_xls(f, 'cp1251'):
            if not first_sheet:
                first_sheet = True
                menu.week = form.cleaned_data['week'] = _parse_day(sheet_name)
                super(MenuAdmin, self).save_model(request, menu, form, change)
            day = _create_day(menu, sheet_name)
            group = None
            for row_idx in count(2):
                if not (row_idx, 0) in values:
                    break
                elif group is None or not ( (row_idx, 1) in values ):
                    group = _get_group(values[(row_idx, 0)])
                else:
                    kwargs = dict(
                        index=values[(row_idx, 0)],
                        title=values[(row_idx, 1)],
                        weight=values[(row_idx, 2)] if (row_idx, 2) in values else None,
                        price=values[(row_idx, 3)],
                    )

                    dish = m.Dish(
                        day=day,
                        group=group,
                        **kwargs
                    )
                    dish.save()

    def change_view(self, request, object_id, extra_context=None):
        menu = m.Menu.objects.get(pk=object_id)

        if request.GET.get('r', None) == 'summary':
            return self.summary_view(request, menu)
        elif request.GET.get('r', None) == 'personal':
            return self.personal_view(request, menu)

        orders = m.Order.objects.filter(menu=menu)\
            .extra(select = {
                'num_items': '(select sum("count") from {0} where {0}.order_id={1}.id)'
                    .format(m.OrderDayItem._meta.db_table, m.Order._meta.db_table),
                'num_days': '(select count(distinct {2}.day_id) from {0}, {2} where {0}.order_id={1}.id and {2}.id={0}.dish_id)'
                    .format(m.OrderDayItem._meta.db_table, m.Order._meta.db_table, m.Dish._meta.db_table),
            })

        return direct_to_template(request, 'dinner/report.html', {
            'orders': orders,
        })

    def summary_view(self, request, menu):
        items = m.OrderDayItem.objects\
            .filter(order__menu = menu)\
            .values('dish__index', 'dish__title', 'dish__weight', 'dish__price', 'dish__group', 'dish__day')\
            .annotate(Sum('count'))\
            .order_by('dish')

        for i in items:
            i['cost'] = i['count__sum'] * i['dish__price']

        days = []
        for day, seq in groupby(list(items), operator.itemgetter('dish__day')):
            seq = list(seq)
            days.append((
                seq,
                unicode(m.Day.objects.get(pk=day)),
                sum(map(operator.itemgetter('cost'), seq)),
            ))

        return direct_to_template(request, 'dinner/report_summary.html', {
            'menu': menu,
            'days': days,
        })

    def personal_view(self, request, menu):
        items = m.OrderDayItem.objects\
            .filter(order__menu = menu)\
            .select_related('order', 'dish')\
            .order_by('dish')

        days = []
        for day, seq in groupby(list(items), lambda i: i.dish.day):
            seq = list(seq)
            days.append((
                unicode(m.Day.objects.get(pk=day.pk)),
                group_by_materialize(groupby(seq, lambda i: i.order.user)),
            ))

        return direct_to_template(request, 'dinner/report_personal.html', {
            'menu': menu,
            'days': days,
        })

admin.site.register(m.Menu, MenuAdmin)
