# coding: utf-8
from django.contrib import messages
from django.utils import html
from django.utils import safestring
from socialauth.auth_backends import OpenIdBackend

DOMAIN = '@ostrovok.ru'

class OpenIdOstrovokBackend(OpenIdBackend):
    def authenticate(self, openid_key, request, provider, user=None):
        try:
            # авторизация только через рабочие адреса (чтобы не было дублей)
            email = request.openid.ax.getSingle('http://axschema.org/contact/email')
            if not email.lower().endswith(DOMAIN):
                # не показывается почему-то
                messages.add_message(
                    request,
                    messages.ERROR,
                    safestring.mark_safe(
                        u'Авторизация через аккаунт «{1}» невозможна.<br/>'
                        u'Пожалуйста, <a target="_blank" href="https://mail.google.com/mail/u/0/?logout&hl=ru">разлогиньтесь</a> и используйте для авторизации аккаунт из домена {0}.'.format(DOMAIN, html.escape(email))
                    )
                )
                #raise Exception('preved')
                return None
        except Exception as e:
            print e
            raise

        return OpenIdBackend.authenticate(self, openid_key, request, provider, user)