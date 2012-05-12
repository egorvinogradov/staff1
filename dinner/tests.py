#coding: utf-8

from django.utils.unittest.case import TestCase
from providers import fusion_hleb_sol
from utils import import_menu

class ProviderXlsParseTestCase(TestCase):

    def test_parse_helobsl(self):
        self.do_parse('dinner/fixtures/hlebsol.xls')

    def test_parse_fusion(self):
        self.do_parse('dinner/fixtures/fusion.xls')

    def do_parse(self, filename):
        data = list(fusion_hleb_sol.process(filename))

        for row in data:
            self.assertTrue(len(row) == 3)

            self.assertTrue(row[0] is not None)
            self.assertTrue(row[1] is not None)
            self.assertTrue(row[2] is not None)

            dish = row[2]

            self.assertTrue(dish['title'] is not None)
            self.assertTrue(isinstance(dish['price'], float))

    def test_import_menu(self):

        cnt_imported_dishes, cnt_imported_day_dishes = import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol.xls'
        )

        self.assertTrue(cnt_imported_dishes != 0)
        self.assertTrue(cnt_imported_day_dishes != 0)


