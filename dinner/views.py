# coding: utf-8
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.transaction import commit_on_success
from django.http import HttpResponseRedirect, HttpResponse
from django.views.generic.simple import direct_to_template
from social_auth.models import UserSocialAuth
from dinner import DINNER_MANAGER, forms
import models as m
from datetime import datetime
from itertools import groupby
from datetime import timedelta
from utils import group_by_materialize

@login_required
@commit_on_success
def reserve(request):
    if not request.user.first_name \
            or not request.user.last_name \
            or not UserSocialAuth.objects.filter(user=request.user, provider='ostrovok').exists():
        messages.add_message(request, messages.INFO, u'страница доступна только для пользователей@ostrovok.ru и заполненным именем')
        return direct_to_template(request, 'base.html')


    is_office_manager = request.user.groups.filter(pk=DINNER_MANAGER).exists()

    delegation_form = None
    if is_office_manager:
        delegation_form = forms.DelegatedOrderForm(request.GET)

    order_user = request.user
    if delegation_form.is_valid() and delegation_form.cleaned_data['user']:
        order_user = delegation_form.cleaned_data['user']

    if request.method == 'POST':
        menu = m.Menu.objects.get(pk=request.POST['menu'])

        order = m.Order.objects.get(user=order_user, menu=menu)

        for key, value in request.POST.items():
            if key.startswith('dish#') and value:
                dish_id = int(key[5:])
                try:
                    item = m.OrderDayItem.objects.get(order=order, dish__id=dish_id)
                    item.count = int(value)
                    item.save()
                except m.OrderDayItem.DoesNotExist:
                    if int(value):
                        m.OrderDayItem(order=order, dish_id=dish_id, count=int(value)).save()

        return HttpResponseRedirect(request.get_full_path())

    try:
        menu = m.Menu.objects.get(week__gt = datetime.now() - timedelta(3))
    except m.Menu.DoesNotExist:
        return HttpResponse(u'новое меню ещё не загружено')

    order = m.Order.objects.get_or_create(user=order_user, menu=menu)[0]
    ordered_items = dict(m.OrderDayItem.objects.filter(order=order, dish__day__week=menu).values_list('dish__pk', 'count'))

    dishes = m.Dish.objects.filter(day__week=menu).select_related().order_by('pk')

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