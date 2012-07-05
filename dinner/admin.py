# coding: utf-8
import csv
import forms as f
import models as m
import operator
import pyExcelerator as xls
import re

from django import forms
from django.contrib import admin
from django.contrib.auth.models import User
from django.db.models.aggregates import Sum, Min, Max
from django.db.transaction import commit_on_success
from django.http import HttpResponseRedirect
from django.views.generic.simple import direct_to_template

from app_auth.models import Office, UserProfile
from datetime import datetime, timedelta
from itertools import count, groupby
from pprint import pformat
from social_auth.models import UserSocialAuth

from dinner.utils import group_by_materialize
from dinner.utils import import_menu
from dinner.providers import fusion_hleb_sol


class MenuAdmin(admin.ModelAdmin):
    form = f.MenuForm
    menu_save_path = '/tmp/latest_menu'

    def handle_file(self, form):
        with open(self.menu_save_path, 'wb+') as destination:
            menu_file = form.cleaned_data['source'].file
            destination.write(menu_file.read())

    @commit_on_success
    def save_model(self, request, menu, form, change):
        # save uploaded file to /tmp/ for parsing
        if not form.is_valid():
            raise ValueError('somewthing wrong with form values')

        self.handle_file(form)
        provider_name = menu.provider.name
        weeks_imported = import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=provider_name,
            path=self.menu_save_path,
        )

        menu.week = weeks_imported[-1]
        menu.save()

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
            m.DishOrderDayItem(
                count=donor_item.count, 
                day=donor_item.day,
                dish_day=donor_item.dish_day, 
                order=receiver, 
            ).save(force_insert=True)

        receiver.donor = donor.user
        receiver.save()

    def fix_profiles(self, orders):
        for o in orders:
            user = o.user
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                user.profile = UserProfile()

    def progress_view(self, request, week):
        if request.method == 'POST':
            self._transfer_order(request.POST, week)
            return HttpResponseRedirect(request.path)

        orders = m.Order.objects.filter(week=week).select_related('user', 'user__profile__office')\
            .extra(select=
                {
                    'num_items': '(select sum("count") from {0} where {0}.order_id={1}.id)'
                        .format(
                            m.DishOrderDayItem._meta.db_table, 
                            m.Order._meta.db_table
                        ),
                    'num_days': '(select count(distinct {2}.day_id) from {0}, {2} where {0}.order_id={1}.id and {2}.id={0}.dish_day_id)'
                        .format(
                            m.DishOrderDayItem._meta.db_table, 
                            m.Order._meta.db_table, 
                            m.DishDay._meta.db_table
                        ),
                }
            ).order_by('user__profile__office__id', 'user__last_name')

        orders = list(orders)
        self.fix_profiles(orders)

        donor_pks = [order.user.pk for order in orders if order.num_items > 0 and not order.donor]
        donor_widget = forms.Select(
            {'class': 'donor'},
            [(u'', u' - выдать меню - ')] + list(User.objects.filter(pk__in=donor_pks).values_list('pk', 'username')),
        ).render('donor', None)

        missing_users  = set(UserSocialAuth.objects.filter(provider='ostrovok').values_list('user__pk', flat=True))
        missing_users -= set(order.user.pk for order in orders)

        for missing_user in User.objects.filter(pk__in=missing_users):
            orders.append(m.Order.objects.get_or_create(user=missing_user, week=week)[0])

        offices = []

        for office, orderseq in groupby(list(orders), lambda o: o.user.profile.office if o.user.profile else None):
            offices.append((office, list(orderseq)))

        return direct_to_template(request, 'dinner/report.html', {
            'offices': offices,
            'donor_widget': donor_widget,
            })


    def summary_view(self, request, week):
        items = m.DishOrderDayItem.objects\
            .filter(order__week=week, count__gt=0)\
            .values(
                'dish_day__day',
                'dish_day__price', 
                
                'dish_day__dish__group', 
                'dish_day__dish__index', 
                'dish_day__dish__pk',
                'dish_day__dish__provider__pk', 
                'dish_day__dish__name', 
                'dish_day__dish__weight',

                'order__user__profile__office__id', 
            )\
            .annotate(Sum('count'))\
            .order_by(
                '-dish_day__dish__provider__pk', 
                'order__user__profile__office__id', 
                'dish_day__day',
                'dish_day__dish__group',
                'dish_day__dish__index',
                'dish_day__dish__name',
                'dish_day__dish__pk',
            )

        for i in items:
            i['cost'] = i['count__sum'] * i['dish_day__price']

        groups = []
        for (provider, office), weekseq in groupby(list(items),
            operator.itemgetter('dish_day__dish__provider__pk', 'order__user__profile__office__id')):
            days = []
            
            for day, seq in groupby(weekseq, operator.itemgetter('dish_day__day')):
                seq = list(seq)
                days.append((
                    seq,
                    unicode(m.Day.objects.get(pk=day)),
                    sum(map(operator.itemgetter('cost'), seq)),
                ))
            
            groups.append((
                m.Provider.objects.get(pk=provider),
                Office.objects.get(id=office) if office else None,
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
            .order_by(
                'order__user__profile__office__id', 
                'order__user__first_name', 
                'order__user__pk', 
                'dish_day__day__pk',
                'dish_day__dish__pk',
            )

        offices = []

        items = list(items)
        self.fix_profiles([i.order for i in items])

        for office, usersseq in groupby(list(items), lambda i: i.order.user.profile.office):
            users = []
            for user, seq in groupby(usersseq, lambda i: i.order.user):
                seq = list(seq)
                users.append((
                    user,
                    group_by_materialize(groupby(seq, lambda i: i.dish_day.day)),
                    ))

            offices.append(( office, users ))

        return direct_to_template(request, 'dinner/report_personal.html', {
            'week': week,
            'offices': offices,
            })


    def taxes_view(self, request, week):
        now = datetime.now()
        date = request.GET.get('date')
        date = datetime.strptime(date, "%m.%Y") if date else now

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

        items = m.DishOrderDayItem.objects.values(
                'dish_day__dish__name', 
                'dish_day__price', 
                'order__user',
            )\
            .annotate(Sum("count"))\
            .order_by(
                'order__user__last_name', 
                'order__user__first_name',
            )\
            .filter(dish_day__day__week__date__gte=first_day)\
            .filter(dish_day__day__week__date__lt=last_day)\
            .filter(count__gt=0)\
            .all()

        users = []
        for user_id, seq in groupby(list(items), operator.itemgetter("order__user")):
            if not user_id: continue
            user = m.User.objects.get(pk=user_id)
            seq = list(seq)
            total = 0
            for menu in seq:
                menu["dish__price_total"] = menu["dish_day__price"] * menu["count__sum"]
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
