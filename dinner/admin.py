# coding: utf-8
import StringIO
from django.contrib import admin
from django.contrib.auth.models import User
from django.db.models.aggregates import Sum
from django import forms
from django.http import HttpResponseRedirect, HttpResponse
from django.views.generic.simple import direct_to_template
import operator
import models as m
import forms as f
import pyExcelerator as xls
from django.db.transaction import commit_on_success
from datetime import datetime
from itertools import count, groupby
from utils import group_by_materialize
import csv

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
        else:
            return self.progress_view(request, menu)


    @commit_on_success
    def _transfer_order(self, data, menu):
        donor = m.Order.objects.get(user__pk=data['donor'], menu=menu)
        receiver = m.Order.objects.get_or_create(user__pk=data['for'], menu=menu)[0]

        m.OrderDayItem.objects.filter(order=receiver).delete()
        for donor_item in m.OrderDayItem.objects.filter(order=donor):
            m.OrderDayItem(order=receiver, dish=donor_item.dish, count=donor_item.count).save(force_insert=True)

        receiver.donor = donor.user
        receiver.save()


    def progress_view(self, request, menu):
        if request.method == 'POST':
            self._transfer_order(request.POST, menu)
            return HttpResponseRedirect(request.path)

        orders = m.Order.objects.filter(menu=menu).select_related('user')\
            .extra(select = {
                'num_items': '(select sum("count") from {0} where {0}.order_id={1}.id)'
                    .format(m.OrderDayItem._meta.db_table, m.Order._meta.db_table),
                'num_days': '(select count(distinct {2}.day_id) from {0}, {2} where {0}.order_id={1}.id and {2}.id={0}.dish_id)'
                    .format(m.OrderDayItem._meta.db_table, m.Order._meta.db_table, m.Dish._meta.db_table),
            }).order_by('user__last_name')

        orders = list(orders)
        
        donor_pks = [order.user.pk for order in orders if order.num_items > 0 and not order.donor]
        donor_widget = forms.Select(
            {'class': 'donor'},
            [(u'', u' - выдать меню - ')] + list(User.objects.filter(pk__in = donor_pks).values_list('pk', 'username')),
        ).render('donor', None)


        return direct_to_template(request, 'dinner/report.html', {
            'orders': orders,
            'donor_widget': donor_widget,
        })

    def summary_view(self, request, menu):
        items = m.OrderDayItem.objects\
            .filter(order__menu = menu, count__gt=0)\
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
        csv_encoding = 'cp1251'

        items = m.OrderDayItem.objects\
            .filter(order__menu=menu, count__gt=0)\
            .select_related('order', 'dish')\
            .order_by('order__user__pk', 'dish__day__pk', 'dish__pk')
        items = list(items)
        WEEK_DAYS_SET = set(unicode(i.dish.day) for i in items)
        WEEK_DAYS = tuple(wday for wday in m.WEEK_DAYS if wday in WEEK_DAYS_SET)


        people = []
        for user, seq in groupby(list(items), lambda i: i.order.user):
            seq = list(seq)
            people.append((
                m.User.objects.get(pk=user.pk),
                group_by_materialize(groupby(seq, lambda i: unicode(i.dish.day))),
            ))

        rows = [tuple([u"-"] + list(w.encode(csv_encoding) for w in WEEK_DAYS))]
        for user, days in people:
            days = dict(days)
            cols = [user.get_full_name().encode(csv_encoding)]
            for wday in m.WEEK_DAYS:
                items = days.get(wday, [])
                lines = []
                for i in items:
                    line = i.dish.title
                    if i.count > 1:
                        line += " x" + str(i.count)
                    lines.append(line)
                cols.append(u"\n".join(lines).encode(csv_encoding))
            rows.append(tuple(cols))

        out = StringIO.StringIO()
        f = csv.writer(out)
        for row in rows:
            f.writerow(row)

        out.seek(0)
        resp = HttpResponse(out.read(), 'text/csv', 200, 'text/csv; charset=' + csv_encoding)
        resp['Content-Disposition'] = 'attachment; filename="menu-{0}.csv"'.format(unicode(menu.week))
        return resp

admin.site.register(m.Menu, MenuAdmin)
