# coding: utf-8
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.views.generic.simple import direct_to_template

@login_required
def index(request):
    return direct_to_template(request, 'staff/index.html')

def auth(request):
    return direct_to_template(request, 'staff/auth.html', { 'redirect': settings.LOGIN_URL })
