# coding: utf-8
from pprint import pformat
from django.contrib.auth.decorators import login_required
from django.db.transaction import commit_on_success
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.views.generic.simple import direct_to_template
import models as m
from datetime import datetime
from itertools import groupby
from datetime import timedelta

def _group_by_materialize(seq):
    return [(k, list(v)) for k, v in seq]

@login_required
@commit_on_success
def reserve(request):

    if request.method == 'POST':
        menu = m.Menu.objects.get(pk=request.POST['menu'])
        order = m.Order.objects.get(user=request.user, menu=menu)

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

    menu = m.Menu.objects.get(week__gt = datetime.now() - timedelta(2))

    order = m.Order.objects.get_or_create(user=request.user, menu=menu)[0]
    ordered_items = dict(m.OrderDayItem.objects.filter(order=order, dish__day__week=menu).values_list('dish__pk', 'count'))

    dishes = m.Dish.objects.filter(day__week=menu).select_related().order_by('pk')

    for d in dishes:
        d.count = ordered_items.get(d.pk, 0)

    dishes_by_group = _group_by_materialize(groupby(dishes, lambda i: (i.day, i.group)))
    dishes_by_group_by_day = _group_by_materialize(groupby(dishes_by_group, lambda i: i[0][0]))


    return direct_to_template(request, 'dinner/reserve.html', {
        'menu': menu,
        'dishes_by_group_by_day': dishes_by_group_by_day,
    })