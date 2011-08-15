# coding: utf-8
from django.forms import ModelForm
import models as m

class MenuForm(ModelForm):
    class Meta:
        model = m.Menu
        fields = ('source',)
