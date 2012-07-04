# coding: utf-8
from django.contrib import messages
from django.utils import html
from django.utils import safestring
from social_auth.backends import USERNAME, OpenIDBackend
from social_auth.backends.google import  GoogleAuth

from app_auth.auth_backends.exception import WrongDomain

DOMAIN = '@ostrovok.ru'

class OstrovokBackend(OpenIDBackend):
    name = 'ostrovok'

    def get_user_id(self, details, response):
        """Return user unique id provided by service. For google user email
        is unique enought to flag a single user. Email comes from schema:
        http://axschema.org/contact/email"""

        email = details['email']
        #if not email.lower().endswith(DOMAIN):
        #    raise WrongDomain(email, DOMAIN)

        details[USERNAME] = email.split('@')[0]
        return details['email']

    def authenticate(self, **kwargs):
            return super(OstrovokBackend, self).authenticate(**kwargs)

class OstrovokAuth(GoogleAuth):
    """OpenId process handling"""
    AUTH_BACKEND = OstrovokBackend

    def auth_complete(self, *args, **kwargs):
        try:
            return super(OstrovokAuth, self).auth_complete(*args, **kwargs)
        except WrongDomain as e:
            messages.add_message(
                self.request,
                messages.ERROR,
                safestring.mark_safe(
                    u'Авторизация через аккаунт «{1}» невозможна.<br/>'
                    u'Пожалуйста, <a target="_blank" href="https://mail.google.com/mail/u/0/?logout&hl=ru">разлогиньтесь</a>'
                    u' и используйте для авторизации аккаунт из домена {0}.'.format(e.domain, html.escape(e.email))
                )
            )
            raise ValueError('OpenID authentication failed: %s' %  u'гавно')


# Backend definition
BACKENDS = {
    'ostrovok': OstrovokAuth,
}


