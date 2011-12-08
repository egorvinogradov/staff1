# coding: utf-8
from pprint import pformat
from django.contrib import admin
from django.contrib.auth.models import User
from django.db.models.aggregates import Sum
from django import forms
from django.http import HttpResponseRedirect
from django.views.generic.simple import direct_to_template
import operator
import models as m
import forms as f
import pyExcelerator as xls
from django.db.transaction import commit_on_success
from datetime import datetime, timedelta
from itertools import count, groupby
from utils import group_by_materialize
from social_auth.models import UserSocialAuth
import csv

def _parse_day(s):
    return datetime.strptime(s.split(' ')[0], '%d.%m.%y').date()

def _create_day_from_date(week, date):
    e = m.Day(day=(date - week.date).days, week=week)
    e.save()
    return e

def _create_day(week, day):
    return _create_day_from_date(week, _parse_day(day))

def _get_group(title):
    title = title.replace(u'NEW ', '')
    return m.Group.objects.get_or_create(title=title)[0]

def _get_weekobj(date):
    return m.Week.objects.get_or_create(date=date)[0]

class MenuAdmin(admin.ModelAdmin):
    form = f.MenuForm

    @commit_on_success
    def save_model(self, request, menu, form, change):
        if int(menu.provider.pk) == 3:
            return self._process_fusion(menu, form, request, change)
        elif int(menu.provider.pk) == 2:
            return self._process_dobrayatrapeza(menu, form, request, change)
        elif int(menu.provider.pk) == 1:
            return self._process_hlebsol(menu, form, request, change)
        else:
            raise Exception('unsupported provider')

    def _process_dobrayatrapeza(self, menu, form, request, change):
        idx = 1
        provider = m.Provider.objects.get(pk=2)
        f = form.cleaned_data['source'].file
        rows = [line for line in f.read().split("\n")]
        rows = csv.reader(rows)
        f.seek(0)
        first_day = True

        day = None
        group = None

        while True:
            try:
                row = next(rows)
            except StopIteration:
                break
            if len(row) == 1 and row[0].decode('utf-8').strip() == u'МЕНЮ':
                #next day

                day = next(rows)[0].split('  ')[0].strip()
                next(rows) #Наши телефоны
                next(rows) #Наименование,,Вес (гр.),Цена ,Кол-во


                day = unicode(day, 'utf-8')

                day = day.replace(u'октября', u'10')
                day = day.replace(u'ноября', u'11')
                day = day.replace(u'декабря', u'12')
                day = day.replace(u'января', u'1')
                day = day.replace(u'февраля', u'2')
                day = day.replace(u'марта', u'3')
                day = day.replace(u'апреля', u'4')
                day = day.replace(u'мая', u'5')
                day = day.replace(u'июня', u'6')
                day = day.replace(u'июля', u'7')
                day = day.replace(u'августа', u'8')
                day = day.replace(u'сентября', u'9')

                try:
                    day = datetime.strptime(day, '%d %m %Y').date()
                except UnicodeEncodeError:
                    raise Exception('failed to parse day' + day)

                if first_day:
                    first_day=False
                    week = menu.week = form.cleaned_data['week'] = _get_weekobj(day)
                    super(MenuAdmin, self).save_model(request, menu, form, change)

                day = _create_day_from_date(week, day)
            elif len(row) == 1:
                group = row[0].decode('utf-8').rstrip()
                group = _get_group(group) # NEW Бутерброды
            elif len(row) > 3 and not row[0].strip() and not row[1].strip():
                pass #end
            else:
                # Бутерброд с рыбкой,,20/25/10,55.00
                try:
                    title, subtitle, weight, price = row
                except ValueError:
                    raise Exception('failed parsing ' + unicode(pformat(row), 'utf-8'))
                price = float(price.decode('utf-8').replace(u' р.', ''))

                title = title.decode('utf-8').strip()
                subtitle = subtitle.decode('utf-8').strip()

                if title:
                    prev_title = title

                if not title and subtitle:
                    title = prev_title

                if subtitle:
                    title += ' + ' + subtitle
                
                kwargs = dict(
                    index=idx,
                    title=title,
                    weight=weight,
                    price=price,
                )
                idx += 1

                dish = m.Dish(
                    day=day,
                    provider=provider,
                    group=group,
                    **kwargs
                )
                dish.save()

    def _process_fusion(self, menu, form, request, change):
        provider = m.Provider.objects.get(pk=3)
        f = form.cleaned_data['source'].file

        data = []

        rows = list(csv.reader(f)) + ['', '', '']
        i = 0
        index = 0
        group = None
        while i < len(rows):
            row = rows[i]
            row = [v.strip().decode('utf-8') for v in row]
            i += 1

            if not any(row):
                continue
            elif row[1] and not row[0] and (len(row) == 2 or not row[2]):
                group = row[1]
            else:
                weight, title, price = row

                if any(rows[i]) and rows[i][1].strip() and not rows[i][0].strip() and (len(rows[i]) == 2 or not rows[i][2].strip()):
                    title += "\n" + rows[i][1].strip().decode('utf-8')
                    i += 1

                price = float(price.split(' ', 1)[0].replace(',', '.'))
                index += 1
                data.append((group, weight, title, price, index))

        week_date = datetime.now() - timedelta(days=datetime.now().weekday()) + timedelta(days=7)
        week = menu.week = form.cleaned_data['week'] = _get_weekobj(week_date.date())
        super(MenuAdmin, self).save_model(request, menu, form, change)

        for day_num in range(0, 5):
            day = m.Day(day=day_num, week=week)
            day.save()

            for group, weight, title, price, index in data:
                kwargs = dict(
                    index=index,
                    title=title,
                    weight=weight,
                    price=price,
                )

                dish = m.Dish(
                    day=day,
                    provider=provider,
                    group=_get_group(group),
                    **kwargs
                )
                dish.save()



    def _process_hlebsol(self, menu, form, request, change):
        provider = m.Provider.objects.get(pk=1)
        first_sheet = False
        f = form.cleaned_data['source'].file
        for sheet_name, values in xls.parse_xls(f, 'cp1251'):
            if not first_sheet:
                first_sheet = True
                week = menu.week = form.cleaned_data['week'] = _get_weekobj(_parse_day(sheet_name))
                super(MenuAdmin, self).save_model(request, menu, form, change)
            day = _create_day(week, sheet_name)
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
                        provider=provider,
                        group=group,
                        **kwargs
                    )
                    dish.save()

    def change_view(self, request, object_id, extra_context=None):
        return HttpResponseRedirect('/admin/dinner/week/' + str(m.Menu.objects.get(pk=object_id).week.pk) + '/')


class WeekAdmin(admin.ModelAdmin):
    def change_view(self, request, object_id, extra_context=None):
        week = m.Week.objects.get(pk=object_id)

        if request.GET.get('r', None) == 'summary':
            return self.summary_view(request, week)
        elif request.GET.get('r', None) == 'personal':
            return self.personal_view(request, week)
        elif request.GET.get('r', None) == 'taxes':
            return self.taxes_view(request, week)
        else:
            return self.progress_view(request, week)

    @commit_on_success
    def _transfer_order(self, data, week):
        donor = m.Order.objects.get(user__pk=data['donor'], week=week)
        receiver = m.Order.objects.get_or_create(user__pk=data['for'], week=week)[0]

        m.OrderDayItem.objects.filter(order=receiver).delete()
        for donor_item in m.OrderDayItem.objects.filter(order=donor):
            m.OrderDayItem(order=receiver, dish=donor_item.dish, count=donor_item.count).save(force_insert=True)

        receiver.donor = donor.user
        receiver.save()


    def progress_view(self, request, week):
        if request.method == 'POST':
            self._transfer_order(request.POST, week)
            return HttpResponseRedirect(request.path)

        orders = m.Order.objects.filter(week=week).select_related('user')\
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

        missing_users = set(UserSocialAuth.objects.filter(provider='ostrovok').values_list('user__pk', flat=True))
        missing_users -= set(order.user.pk for order in orders)

        for missing_user in User.objects.filter(pk__in = missing_users):
            orders.append(m.Order.objects.get_or_create(user=missing_user, week=week)[0])

        return direct_to_template(request, 'dinner/report.html', {
            'orders': orders,
            'donor_widget': donor_widget,
        })

    def summary_view(self, request, week):
        items = m.OrderDayItem.objects\
            .filter(order__week=week, count__gt=0)\
            .values('dish__index', 'dish__title', 'dish__weight', 'dish__price', 'dish__group', 'dish__day')\
            .annotate(Sum('count'))\
            .order_by('dish__day', 'dish__group', 'dish__index', 'dish__title', 'dish__pk')

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
            'week': week,
            'days': days,
        })

    def personal_view(self, request, week):
        items = m.OrderDayItem.objects\
            .filter(order__week=week, count__gt=0)\
            .select_related(depth=2)\
            .order_by('order__user__first_name', 'order__user__pk', 'dish__day__pk', 'dish__pk')

        users = []
        for user, seq in groupby(list(items), lambda i: i.order.user):
            seq = list(seq)
            users.append((
                user,
                group_by_materialize(groupby(seq, lambda i: i.dish.day)),
            ))

        return direct_to_template(request, 'dinner/report_personal.html', {
            'week': week,
            'users': users,
        })

    def taxes_view(self, request, week):
        items = m.OrderDayItem.objects\
            .filter(order__week=week, count__gt=0)\
            .select_related(depth=2)\
            .order_by('order__user__first_name', 'order__user__pk', 'dish__day__pk', 'dish__pk')

        users = []
        for user, seq in groupby(list(items), lambda i: i.order.user):
            seq = list(seq)
            users.append((
                user,
                group_by_materialize(groupby(seq, lambda i: i.dish.day)),
            ))

        for user, days in users:
            for day, seq in days:
                day.cost = sum(i.dish.price*i.count for i in seq)
            user.cost = sum(d.cost for d, seq in days)

        return direct_to_template(request, 'dinner/report_taxes.html', {
            'week': week,
            'users': users,
        })

admin.site.register(m.Menu, MenuAdmin)
admin.site.register(m.Week, WeekAdmin)
