# coding: utf-8
import csv
import re
import operator
import models as m
import forms as f
import pyExcelerator as xls

from pprint import pformat
from django.contrib import admin
from django.contrib.auth.models import User
from django.db.models.aggregates import Sum, Min, Max
from django import forms
from django.http import HttpResponseRedirect
from django.views.generic.simple import direct_to_template
from django.db.transaction import commit_on_success
from datetime import datetime, timedelta
from itertools import count, groupby
from utils import group_by_materialize
from social_auth.models import UserSocialAuth
from auth.models import Office

def _parse_day(s):
    return datetime.strptime(s.split(' ')[0], '%d.%m.%y').date()


def _create_day_from_date(week, date):
    return m.Day.objects.get_or_create(day=(date - week.date).days, week=week)[0]


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
                    first_day = False
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

                kwargs = {
                    'index': idx,
                    'title': title,
                    'weight': weight,
                    'price': price
                }

                idx += 1

                dish = m.Dish(
                    day=day,
                    provider=provider,
                    group=group,
                    **kwargs
                )
                dish.save()

    def _process_fusion_old(self, menu, form, request, change):
        def __save_data(day, data, provider):
            for group, weight, title, price, index in data:
                kwargs = dict(
                    index=index + 1000,
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


        provider = m.Provider.objects.get(pk=3)
        f = form.cleaned_data['source'].file
        # FILE MUST BE RED BEFORE super() call!!!!!
        rows = list(csv.reader(f, dialect='excel')) + ['', '', '']

        week_date = datetime.now() + timedelta(days=7 - datetime.now().weekday())
        week = menu.week = form.cleaned_data['week'] = _get_weekobj(week_date.date())
        super(MenuAdmin, self).save_model(request, menu, form, change)

        days_map = dict((day_name.capitalize(), day_num) for day_num, day_name in enumerate(
            u'понедельник вторник среда четверг пятница суббота воскресенье'.split(' ')))

        data = []

        i = 0
        index = 0
        group = u"Меню от Fusion"
        day = None
        while i < len(rows):
            row = rows[i]
            row = [v.strip().decode('utf-8') for v in row]
            i += 1

            if not any(row):
                continue
            elif re.sub("['\"\s'\d]*", "", row[0]).capitalize() in days_map:
                if not (day is None):
                    #raise Exception(pformat(data).decode('unicode-escape'))
                    __save_data(day, data, provider)
                    data = []
                day_name = re.sub("^['\"]|[\s\"'\d]*$", "", row[0]).capitalize()
                day = m.Day.objects.get_or_create(day=days_map[day_name], week=week)[0]
            #elif len(row)==1 and row[0]:
            #    group = row[0]
            #elif len(row)==2 and not row[0] and row[1]:
            #    group = row[1]
            #elif len(row)==5 and row[0] ==u'выход' or row[0]==u"":
            #    group = row[1]
            elif len(row) == 3 and re.search("\d$", row[2]):
                title, weight, price = row

                if len(rows[i]) == 1 and rows[i][0][0] == '(':
                    title += "\n" + rows[i][0].decode('utf-8')
                    i += 1

                price = float(price.split(' ', 1)[0].replace(',', '.'))
                index += 1
                if not group:
                    raise Exception('no group found yet line#{0}'.format(i))
                data.append((group, weight, title, price, index))
            else:
                continue

        #raise Exception(pformat(data).decode('unicode-escape'))
        __save_data(day, data, provider)

    def _process_fusion(self, *args, **kwargs):
        provider = m.Provider.objects.get(pk=3)
        return self._process_hlebsol(provider=provider, *args, **kwargs)


    def _process_hlebsol(self, menu, form, request, change, provider=None):
        if not provider:
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
    list_display = ('date', 'closed')
    list_editable = ('closed',)

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

        m.DishOrderDayItem.objects.filter(order=receiver).delete()
        for donor_item in m.DishOrderDayItem.objects.filter(order=donor):
            m.DishOrderDayItem(order=receiver, dish=donor_item.dish, count=donor_item.count).save(force_insert=True)

        receiver.donor = donor.user
        receiver.save()


    def progress_view(self, request, week):
        if request.method == 'POST':
            self._transfer_order(request.POST, week)
            return HttpResponseRedirect(request.path)

        orders = m.Order.objects.filter(week=week).select_related('user', 'user__profile__office')\
        .extra(select={
            'num_items': '(select sum("count") from {0} where {0}.order_id={1}.id)'
            .format(m.DishOrderDayItem._meta.db_table, m.Order._meta.db_table),
            'num_days': '(select count(distinct {2}.day_id) from {0}, {2} where {0}.order_id={1}.id and {2}.id={0}.dish_id)'
            .format(m.DishOrderDayItem._meta.db_table, m.Order._meta.db_table, m.Dish._meta.db_table),
            }).order_by('user__profile__office__id', 'user__last_name')

        orders = list(orders)

        donor_pks = [order.user.pk for order in orders if order.num_items > 0 and not order.donor]
        donor_widget = forms.Select(
                {'class': 'donor'},
            [(u'', u' - выдать меню - ')] + list(User.objects.filter(pk__in=donor_pks).values_list('pk', 'username')),
        ).render('donor', None)

        missing_users = set(UserSocialAuth.objects.filter(provider='ostrovok').values_list('user__pk', flat=True))
        missing_users -= set(order.user.pk for order in orders)

        for missing_user in User.objects.filter(pk__in=missing_users):
            orders.append(m.Order.objects.get_or_create(user=missing_user, week=week)[0])

        offices = []
        for office, orderseq in groupby(list(orders), lambda o: o.user.profile.office):
            offices.append((office, list(orderseq)))

        return direct_to_template(request, 'dinner/report.html', {
            'offices': offices,
            'donor_widget': donor_widget,
            })

    def summary_view(self, request, week):
        items = m.DishOrderDayItem.objects\
        .filter(order__week=week, count__gt=0)\
        .values('order__user__profile__office__id', 'dish__provider__pk', 'dish__index', 'dish__title', 'dish__weight',
            'dish__price', 'dish__group', 'dish__day')\
        .annotate(Sum('count'))\
        .order_by('-dish__provider__pk', 'order__user__profile__office__id', 'dish__day', 'dish__group', 'dish__index',
            'dish__title', 'dish__pk')

        for i in items:
            i['cost'] = i['count__sum'] * i['dish__price']

        groups = []
        for (provider, office), weekseq in groupby(list(items),
            operator.itemgetter('dish__provider__pk', 'order__user__profile__office__id')):
            days = []
            for day, seq in groupby(weekseq, operator.itemgetter('dish__day')):
                seq = list(seq)
                days.append((
                    seq,
                    unicode(m.Day.objects.get(pk=day)),
                    sum(map(operator.itemgetter('cost'), seq)),
                    ))
            groups.append((
                m.Provider.objects.get(pk=provider),
                Office.objects.get(id=office),
                days
                ))

        return direct_to_template(request, 'dinner/report_summary.html', {
            'week': week,
            'groups': groups,
            })

    def personal_view(self, request, week):
        items = m.DishOrderDayItem.objects\
        .filter(order__week=week, count__gt=0)\
        .select_related(depth=4)\
        .order_by('order__user__profile__office__id', 'order__user__first_name', 'order__user__pk', 'dish__day__pk',
            'dish__pk')

        offices = []
        for office, usersseq in groupby(list(items), lambda i: i.order.user.get_profile().office):
            users = []
            for user, seq in groupby(usersseq, lambda i: i.order.user):
                seq = list(seq)
                users.append((
                    user,
                    group_by_materialize(groupby(seq, lambda i: i.dish.day)),
                    ))

            offices.append(( office, users ))

        return direct_to_template(request, 'dinner/report_personal.html', {
            'week': week,
            'offices': offices,
            })

    def taxes_view(self, request, week):
        if 'date' in request.GET:
            now = datetime.strptime(request.GET["date"], "%m.%Y")
        else:
            now = datetime.now()

        first_day = datetime(
            year=now.year,
            month=now.month,
            day=1
        )
        last_day = datetime(
            year=now.year if now.month < 12 else now.year + 1,
            month=now.month + 1 if now.month < 12 else 1,
            day=1
        )
        period_caption = "%s - %s" % (first_day.strftime("%d.%m.%Y"), last_day.strftime("%d.%m.%Y"))

        items = m.DishOrderDayItem.objects.values("dish__title", "dish__price", "order__user")\
        .annotate(Sum("count"))\
        .order_by("order__user__last_name", "order__user__first_name")\
        .filter(dish__day__week__date__gte=first_day)\
        .filter(dish__day__week__date__lt=last_day)\
        .filter(count__gt=0)\
        .all()

        users = []
        for user_id, seq in groupby(list(items), operator.itemgetter("order__user")):
            if not user_id: continue
            user = m.User.objects.get(pk=user_id)
            seq = list(seq)
            total = 0
            for menu in seq:
                menu["dish__price_total"] = menu["dish__price"] * menu["count__sum"]
                total += menu["dish__price_total"]

            users.append((
                user,
                seq,
                total
                ))

        min_day = m.Week.objects.aggregate(Min("date"))["date__min"]
        max_day = m.Week.objects.aggregate(Max("date"))["date__max"]
        monthes = []
        while min_day <= max_day:
            next_day = datetime(year=min_day.year, month=min_day.month, day=1)
            monthes.append(next_day.strftime("%m.%Y"))
            min_day = (next_day + timedelta(days=33)).date()

        return direct_to_template(request, 'dinner/report_taxes.html', {
            'week': week,
            'users': users,
            'period_caption': period_caption,
            'current_month': first_day.strftime("%m.%Y"),
            'monthes': monthes
        })

admin.site.register(m.Menu, MenuAdmin)
admin.site.register(m.Week, WeekAdmin)
