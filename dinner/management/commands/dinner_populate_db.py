#coding:utf-8
import os

from datetime import date, datetime
from django.core.management.base import BaseCommand

from dinner.utils import import_menu
from dinner.providers import fusion_hleb_sol

def download_latest_hlebsol():
    from pbs import wget, mv, rm, cp

    try:
        rm('dinner/fixtures/hlebsol.xls')
    except:
        pass

    if date.today().weekday() < 4:
        wget('-N', '-S', 'http://hleb-sol.biz/templates/1.xls')
        mv('1.xls', 'dinner/fixtures/hlebsol.xls')

    else:
        wget('-N', '-S', 'http://hleb-sol.biz/templates/2.xls')
        mv('2.xls', 'dinner/fixtures/hlebsol.xls')

    cp('dinner/fixtures/hlebsol.xls', 'dinner/fixtures/fusion.xls')


class Command(BaseCommand):
    def handle(self, *args, **kwargs):

        download_latest_hlebsol()

        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol.xls'
        )

        import_menu(
           process_function=fusion_hleb_sol.process,
           provider_name=u'Фьюжн',
           path='dinner/fixtures/hlebsol.xls'
       )
