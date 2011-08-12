from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver

class Menu(models.Model):
	week = models.DateField(unique=True, primary_key=True)

class Day(models.Model):
	week = models.ForeignKey(Menu)
	day = models.PositiveIntegerField()

class Group(models.Model):
	title = models.CharField(max_length=100)

class Dish(models.Model):
	day = models.ForeignKey(Day)
	group = models.ForeignKey(Group)
	title = models.CharField(max_length=200)

@receiver(pre_save, sender=Menu)
def menu_upload(sender, instance, **kwargs):
    raise Exception(instance.__dict__)
    f = self.cleaned_data['source']
    first_sheet = False
    for sheet_name, values in xls.parse_xls(f, 'cp1251'):
        if not first_sheet:
            first_sheet = True
            menu = self._create_menu(sheet_name)
        day = self._create_day(menu, sheet_name)
        group = None
        for row_idx in count(2):
            if not (row_idx, 0) in values:
                break
            elif group is None or not ( (row_idx, 1) in values ):
                group = self._get_group(values[(row_idx, 0)])
            else:
                dish = m.Dish(day=day, group=group, title=values[(row_idx, 1)])
                dish.save()
