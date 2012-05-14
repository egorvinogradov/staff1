#coding:utf-8
from dinner.providers import fusion_hleb_sol
from dinner.utils import import_menu

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol.xls'
        )

        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Фьюжн',
            path='dinner/fixtures/fusion.xls'
        )


