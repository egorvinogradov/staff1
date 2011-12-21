#coding: utf-8
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

from models import UserProfile, Office

admin.site.unregister(User)

class UserProfileInline(admin.StackedInline):
    model = UserProfile

class UserProfileAdmin(UserAdmin):
    inlines = [UserProfileInline]

class OfficeAdmin(admin.ModelAdmin):
    pass

admin.site.register(User, UserProfileAdmin)
admin.site.register(Office, OfficeAdmin)
