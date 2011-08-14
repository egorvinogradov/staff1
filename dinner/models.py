#coding: utf-8
from django.db import models
from django.contrib.auth.models import User

WEEK_DAYS = (u'Пн', u'Вт', u'Ср', u'Чт', u'Пт', u'Сб', u'Вс',)

class Menu(models.Model):
    week = models.DateField(unique=True, primary_key=True)

    def __unicode__(self):
        return u'Меню на неделю с ' + unicode(self.week)

class Day(models.Model):
    week = models.ForeignKey(Menu)
    day = models.PositiveIntegerField()

    def __unicode__(self):
        return WEEK_DAYS[self.day]

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

class Order(models.Model):
    user = models.ForeignKey(User)
    menu = models.ForeignKey(Menu)

    class Meta:
        unique_together = (('user', 'menu'),)

class OrderDayItem(models.Model):
    order = models.ForeignKey(Order, verbose_name=u'День')
    dish = models.ForeignKey(Dish, verbose_name=u'Блюдо')
    count = models.PositiveSmallIntegerField(default=1, verbose_name=u'Кол-во')

    class Meta:
        unique_together = (('order', 'dish'),)