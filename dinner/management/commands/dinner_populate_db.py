#coding:utf-8
import os

from datetime import date, datetime
from django.core.management.base import BaseCommand

from dinner.providers import fusion_hleb_sol
from dinner.utils import import_menu

def download_latest_hlebsol():
    from pbs import wget, mv, rm, cp

    wget('-N', '-S', 'http://hleb-sol.biz/templates/1.xls')
    mv('1.xls', 'dinner/fixtures/hlebsol-current.xls')

    wget('-N', '-S', 'http://hleb-sol.biz/templates/2.xls')
    mv('2.xls', 'dinner/fixtures/hlebsol-next.xls')

    cp('dinner/fixtures/hlebsol-current.xls',   'dinner/fixtures/fusion-current.xls')
    cp('dinner/fixtures/hlebsol-next.xls',      'dinner/fixtures/fusion-next.xls')


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        download_latest_hlebsol()
        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol-current.xls'
        )

        import_menu(
           process_function=fusion_hleb_sol.process,
           provider_name=u'Фьюжн',
           path='dinner/fixtures/hlebsol-current.xls'
        )

        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol-next.xls'
        )

        import_menu(
           process_function=fusion_hleb_sol.process,
           provider_name=u'Фьюжн',
           path='dinner/fixtures/hlebsol-next.xls'
        )