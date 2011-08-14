# coding: utf-8
from pprint import pformat
from django.contrib.auth.decorators import login_required
from django.views.generic.simple import direct_to_template
import models as m
from datetime import datetime
from itertools import groupby

def _group_by_materialize(seq):
    return [(k, list(v)) for k, v in seq]

@login_required
def reserve(request):
    menu = m.Menu.objects.get(week__gt = datetime.now())

    order = m.Order.objects.get_or_create(user=request.user, menu=menu)[0]
    #items = m.OrderDayItem.objects.filter(order=order, dish__day__week=menu).select_related().order_by('dish__pk')
    dishes = m.Dish.objects.filter(day__week=menu).select_related().order_by('pk')

    dishes_by_group = _group_by_materialize(groupby(dishes, lambda i: (i.day, i.group)))
    dishes_by_group_by_day = _group_by_materialize(groupby(dishes_by_group, lambda i: i[0][0]))
    #dishes_by_group_by_day = [(key, list(items)) for key, items in groupby(dishes_by_group, lambda i: next(i)[2].pk)]
    #raise Exception(pformat(dishes_by_group[1][2].pk))
    #raise Exception(pformat(list(next(next(dishes_by_group_by_day)[1])[1])))


    return direct_to_template(request, 'dinner/reserve.html', {
        'menu': menu,
        'dishes_by_group_by_day': dishes_by_group_by_day,
    })