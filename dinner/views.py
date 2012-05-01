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

    user_authenticated = request.user.is_authenticated()
    user_authenticated = user_authenticated or UserSocialAuth.objects.filter(user=request.user, provider='ostrovok').exists()

    if not user_authenticated:
        messages.add_message(
            request=request,
            level=messages.INFO,
            message=u'Страница доступна только для пользователей mail.ostrovok.ru с заполненным именем')
        return direct_to_template(request, 'base.html')

    if not request.user.get_profile().office:
        return direct_to_template(request, 'staff/config.html', {'offices': Office.objects.all()})

    return direct_to_template(request, 'bb_dinner/reserve.html')


@login_required
def order_view(request, order_pk):
    order = get_object_or_404(m.Order, pk=order_pk)
    items = m.OrderDayItem.objects\
        .filter(order=order, count__gt=0)\
        .select_related('order', 'dish')\
        .order_by('dish__day__pk', 'dish__pk')

    days = group_by_materialize(groupby(list(items), lambda i: i.dish.day))
    return direct_to_template(
        request,
        'dinner/order_view.html',
            {'order': order, 'days': days, }
    )
