#coding: utf-8
from dinner.models import Dish
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save

class Office(models.Model):
    id      = models.AutoField(primary_key=True)
    title   = models.CharField(max_length=64, verbose_name=u'Название')
    address = models.TextField(verbose_name=u'адрес')

    def __unicode__(self):
        return self.title

    class Meta(object):
        verbose_name = u'офис'
        verbose_name_plural = u'офисы'

class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name='profile')
    office = models.ForeignKey(Office, verbose_name=u"офис", null=True)
    favorite_dishes = models.ManyToManyField(Dish)


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
