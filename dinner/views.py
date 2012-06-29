# coding: utf-8
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.generic.simple import direct_to_template
from social_auth.models import UserSocialAuth

@login_required
def index(request):
    user_authenticated =    request.user.is_authenticated() or \
                            UserSocialAuth.objects.filter(
                                user    = request.user, 
                                provider= 'ostrovok'
                            ).exists()

    if not user_authenticated:
        messages.add_message(
            request  = request,        
            level    = messages.INFO,
            messages = u'Страница доступна только для пользователей mail.ostrovok.ru с заполненным именем'
        )

        return direct_to_template(request, 'base.html')

    #if not request.user.get_profile().office:
    #    return direct_to_template(request, 'staff/config.html', {'offices': Office.objects.all()})

    return direct_to_template(request, 'bb_dinner/main.html')

