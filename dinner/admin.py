# coding: utf-8
from django.contrib import admin
import models as m
import forms as f
import pyExcelerator as xls
from django.db.transaction import commit_on_success
from datetime import datetime
from itertools import count

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
                    dish = m.Dish(day=day, group=group, title=values[(row_idx, 1)])
                    dish.save()

admin.site.register(m.Menu, MenuAdmin)
admin.site.register(m.Group)
admin.site.register(m.Dish)
