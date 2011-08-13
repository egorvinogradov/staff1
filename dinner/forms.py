# coding: utf-8
from django.forms import ModelForm, FileField
import models as m

class MenuForm(ModelForm):
    source = FileField()

    class Meta:
        model = m.Menu
        fields = ('source',)
