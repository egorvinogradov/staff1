#coding: utf-8
from django.db import models

WEEK_DAYS = (u'Пн', u'Вт', u'Ср', u'Чт', u'Пн', u'Сб', u'Вс',)

class Menu(models.Model):
    week = models.DateField(unique=True, primary_key=True)

    def __unicode__(self):
        return u'Меню на неделю с ' + unicode(self.week)

class Day(models.Model):
    week = models.ForeignKey(Menu)
    day = models.PositiveIntegerField()

    def __unicode__(self):
        return unicode(self.week.pk ) + u'+' + unicode(self.day) + u' (' + WEEK_DAYS[self.day] + u')'

class Group(models.Model):
    title = models.CharField(max_length=100)

    def __unicode__(self):
        return self.title

class Dish(models.Model):
    day = models.ForeignKey(Day)
    group = models.ForeignKey(Group)
    title = models.CharField(max_length=200)

    def __unicode__(self):
        return unicode(self.day) + u' — ' + unicode(self.group) + u' — ' + unicode(self.title)