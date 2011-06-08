# coding: utf-8
from django.utils import simplejson
from django.core.management.base import NoArgsCommand
from django.conf import settings
from yammer_oauth.yammer import Yammer, YammerError
from django.contrib.auth.models import User

class Command(NoArgsCommand):
    help = "Sync with yammer"
    def handle_noargs(self, **options):
        yammer = Yammer(**settings.YAMMER_API)
        r  = yammer.get_users()
        yammer.close()

        for info in r:
            email = [entry['address'] for entry in info['contact']['email_addresses'] if entry['type'] == 'primary'][0]
            login = email.split('@', 1)[0]

            try:
                user = User.objects.get(username__exact=login)
            except User.DoesNotExist:
                user = User.objects.create_user(login, email, None)

            name_parts = info['full_name'].split(' ', 1)
            user.first_name, user.last_name = name_parts + ([''] * (2-len(name_parts)))
            user.save()
