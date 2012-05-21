#coding:utf-8
from dinner.providers import fusion_hleb_sol
from dinner.utils import import_menu

from django.core.management.base import BaseCommand

def download_latest_hlebsol():
    from pbs import wget, mv, rm

    rm('dinner/fixtures/hlebsol.xls')
    wget('http://hleb-sol.biz/templates/2.xls')
    mv('2.xls', 'dinner/fixtures/hlebsol.xls')


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol.xls'
        )

