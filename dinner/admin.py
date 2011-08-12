# coding: utf-8
from django.contrib import admin
import models as m
import forms as f

class MenuAdmin(admin.ModelAdmin):
    form = f.MenuForm

admin.site.register(m.Menu, MenuAdmin)
admin.site.register(m.Group)
admin.site.register(m.Dish)
