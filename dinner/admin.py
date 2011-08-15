# coding: utf-8
from django.contrib import admin
from django.http import HttpResponse
from django.views.generic.simple import direct_to_template
import os
import models as m
import forms as f
import pyExcelerator as xls
from django.db.transaction import commit_on_success
from datetime import datetime
from itertools import count
from tempfile import NamedTemporaryFile

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

    def change_view(self, request, object_id, extra_context=None):
        menu = m.Menu.objects.get(pk=object_id)

        if request.GET.get('xls'):
            return self.xls_view(request, menu)

        orders = m.Order.objects.filter(user=request.user, menu=menu)\
            .extra(select = {
                'num_items': '(select sum("count") from {0} where {0}.order_id={1}.id)'
                    .format(m.OrderDayItem._meta.db_table, m.Order._meta.db_table),
                'num_days': '(select count(distinct {2}.day_id) from {0}, {2} where {0}.order_id={1}.id and {2}.id={0}.dish_id)'
                    .format(m.OrderDayItem._meta.db_table, m.Order._meta.db_table, m.Dish._meta.db_table),
            })

        return direct_to_template(request, 'dinner/report.html', {
            'orders': orders,
        })

    def xls_view(self, request, menu):
        f = menu.source.file
        workbook = xls.Workbook()
        for sheet_name, values in xls.parse_xls(f, 'cp1251'):
            sheet = workbook.add_sheet(sheet_name)
            for r, c in values.keys():
                sheet.write(r, c, values[(r, c)])

        dest = NamedTemporaryFile()
        workbook.save(dest.name)
        dest.seek(0)
        content = dest.read()
        dest.close()
#            day = m.Day(day=(_parse_day(sheet_name) - menu.week).days, week=menu)
#            group = None
#            for row_idx in count(2):
#                if not (row_idx, 0) in values:
#                    break
#                elif group is None or not ( (row_idx, 1) in values ):
#                    pass
#                else:
#                    dish = m.Dish(day=day, group=group, title=values[(row_idx, 1)])
#                    values[(row_idx, 1)] = '111'


        resp = HttpResponse(content, content_type='application/x-msexcel')
        resp['Content-Disposition'] = 'attachment; filename=' + (os.path.basename(menu.source.name)[:-4] + '-filled.xls')
        return resp

admin.site.register(m.Menu, MenuAdmin)
