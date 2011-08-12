# coding: utf-8
from django.forms import ModelForm, FileField
import models as m
import pyExcelerator as xls
from django.db.transaction import commit_on_success
from pprint import pformat
from datetime import datetime
from itertools import islice, count

class MenuForm(ModelForm):
    source = FileField()

    def _parse_day(self, s):
        return datetime.strptime(s.split(' ')[0], '%d.%m.%y').date()

    def _create_menu(self, weekstart):
        e = m.Menu(week=self._parse_day(weekstart))
        e.save()
        return e

    def _create_day(self, menu, day):
        e = m.Day(day=(self._parse_day(day) - menu.week).days, week=menu)
        e.save()
        return e

    def _get_group(self, title):
        return m.Group.objects.get_or_create(title=title)[0]

    class Meta:
        model = m.Menu
        fields = ('source',)
