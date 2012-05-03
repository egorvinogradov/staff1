# coding: utf-8
import os
from pprint import pformat
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.transaction import commit_on_success
from django.shortcuts import get_object_or_404, redirect
from django.views.generic.simple import direct_to_template
from social_auth.models import UserSocialAuth
from dinner import DINNER_MANAGER, forms
import models as m
from datetime import datetime
from itertools import groupby
from datetime import timedelta
from utils import group_by_materialize
from staff.models import Office

@login_required
@commit_on_success
def reserve(request):
    if not request.user.first_name \
            or not request.user.last_name \
            or not UserSocialAuth.objects.filter(user=request.user, provider='ostrovok').exists():
        messages.add_message(request, messages.INFO, u'Страница доступна только для пользователей mail@ostrovok.ru с заполненным именем')
        return direct_to_template(request, 'base.html')

    if not request.user.get_profile().office:
        return direct_to_template(request, 'staff/config.html', dict(
            offices = Office.objects.all()
        ))


    is_office_manager = request.user.groups.filter(pk=DINNER_MANAGER).exists()

    delegation_form = None
    if is_office_manager:
        delegation_form = forms.DelegatedOrderForm(request.GET)

    order_user = request.user
    if delegation_form and delegation_form.is_valid() and delegation_form.cleaned_data['user']:
        order_user = delegation_form.cleaned_data['user']

    if request.method == 'POST':
        week = m.Week.objects.get(pk=request.POST['week'])

        order = m.Order.objects.get(user=order_user, week=week)

        if week.closed:
            return redirect('dinner.views.order_view', order.pk)

        updated = False
        for key, value in request.POST.items():
            if key.startswith('dish#') and value:
                dish_id = int(key[5:])
                try:
                    item = m.OrderDayItem.objects.get(order=order, dish__id=dish_id)
                    if item.count != int(value):
                        updated=True
                        item.count = int(value)
                        item.save()

                except m.OrderDayItem.DoesNotExist:
                    if int(value):
                        m.OrderDayItem(order=order, dish_id=dish_id, count=int(value)).save()
        if updated:
            order.donor = None
            order.save()

        return redirect('dinner.views.order_view', order.pk)

    try:
        week = m.Week.objects\
            .filter(date__gt = datetime.now() - timedelta(3))\
            .order_by('-date')\
            .all()[0]
    except m.Week.DoesNotExist, IndexError:
        return direct_to_template(request, 'dinner/empty.html')

    order = m.Order.objects.get_or_create(user=order_user, week=week)[0]

    if week.closed:
        return redirect('dinner.views.order_view', order.pk)

    ordered_items = dict(m.OrderDayItem.objects.filter(order=order, dish__day__week=week).values_list('dish__pk', 'count'))

    dishes = m.Dish.objects.filter(day__week=week).select_related().order_by('day__day', '-provider', 'pk', 'group', 'title')
    if os.path.exists('/home/denis/hbonly'):
        dishes = dishes.filter(provider__pk=1)
    dishes = list(dishes)

    for d in dishes:
        d.count = ordered_items.get(d.pk, 0)

    dishes_by_group = group_by_materialize(groupby(dishes, lambda i: (i.day, i.group)))
    dishes_by_group_by_day = group_by_materialize(groupby(dishes_by_group, lambda i: i[0][0]))


    return direct_to_template(request, 'dinner/reserve.html', {
        'order': order,
        'dishes_by_group_by_day': dishes_by_group_by_day,
        'delegation_form': delegation_form,
        'is_office_manager': is_office_manager,
    })

@login_required
def order_view(request, order_pk):
    order = get_object_or_404(m.Order, pk = order_pk)
    items = m.OrderDayItem.objects\
        .filter(order = order, count__gt = 0)\
        .select_related('order', 'dish')\
        .order_by('dish__day__pk', 'dish__pk')

    days = group_by_materialize(groupby(list(items), lambda i: i.dish.day))
    return direct_to_template(
        request, 
        'dinner/order_view.html', 
        {'order': order, 'days': days,}
    )
