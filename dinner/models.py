#coding: utf-8
import datetime
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User

WEEK_DAYS = (u'Понедельник', u'Вторник', u'Среда', u'Четверг', u'Пятница', u'Суббота', u'Воскресенье',)

class Provider(models.Model):
    name = models.CharField(unique=True, max_length=20)

    def __unicode__(self):
        return self.name


class Week(models.Model):
    date = models.DateField(unique=True)
    closed = models.BooleanField(default=False)

    def __unicode__(self):
        return unicode(self.date)


class Menu(models.Model):
    week = models.ForeignKey(Week)
    provider = models.ForeignKey(Provider)
    source = models.FileField(upload_to=settings.UPLOAD_TO)

    def __unicode__(self):
        return u'на неделю с ' + unicode(self.week) + u' by ' + unicode(self.provider)

    class Meta:
        unique_together = (("week", "provider"),)


class Day(models.Model):
    week = models.ForeignKey(Week)
    day = models.PositiveIntegerField()

    @property
    def date(self):
        return self.week.date + datetime.timedelta(days=self.day)

    def __unicode__(self):
        return WEEK_DAYS[self.day]

    class Meta:
        unique_together = [('week', 'day')]


class Group(models.Model):
    title = models.CharField(max_length=100)

    def __unicode__(self):
        return self.title


class Dish(models.Model):
    provider = models.ForeignKey(Provider)
    group = models.ForeignKey(Group)

    index = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    weight = models.CharField(max_length=60, null=True)

    def __unicode__(self):
        return unicode(self.day) + u' — ' + unicode(self.group) + u' — ' + unicode(self.title)


class DishDay(models.Model):
    dish = models.ForeignKey(Dish)
    day = models.ForeignKey(Day)
    price = models.DecimalField(max_digits=20, decimal_places=2)

    class Meta:
        unique_together = (('day', 'dish'),)


class FavoriteDish(models.Model):
    dish = models.ForeignKey(Dish)
    user = models.ForeignKey(User)

    class Meta:
        unique_together = (('dish', 'user'),)


class Order(models.Model):
    user = models.ForeignKey(User)
    week = models.ForeignKey(Week)
    donor = models.ForeignKey(User, null=True, related_name='order_donor_set')

    def __unicode__(self):
        return u'для ' + self.user.username + u' ' + unicode(self.week)

    class Meta:
        unique_together = (('user', 'week'),)


class OrderDayItem(models.Model):
    order = models.ForeignKey(Order, verbose_name=u'День')
    dish_day = models.ForeignKey(DishDay, verbose_name=u'Блюдо')
    count = models.PositiveSmallIntegerField(default=1, verbose_name=u'Кол-во')
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('order', 'dish_day'),)
