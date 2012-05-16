#coding: utf-8
from django.contrib.auth.models import User

from django.utils.unittest.case import TestCase
from providers import fusion_hleb_sol
from tastypie.test import ResourceTestCase
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


class DayResourceTest(ResourceTestCase):
    def setUp(self):
        super(DayResourceTest, self).setUp()

        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol.xls'
        )

        import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/fusion.xls'
        )

        self.day_url = '/api/v1/day/'
        self.order_url = '/api/v1/order/'

        self.username = 'testuser'
        self.password = 'testpassword'

        self.user = User.objects.create_user(self.username, 'test@test.ru', self.password)

        self.api_client.client.login(username=self.username, password=self.password)


    def get_credentials(self):
        return self.create_basic(username=self.username, password=self.password)


    def test_day_view(self):
        resp = self.api_client.get(self.day_url, format='json', authentication=self.get_credentials())
        self.assertValidJSONResponse(resp)


    def test_reserve_data(self):
        resp = self.api_client.get(self.day_url, format='json', authentication=self.get_credentials())
        objects = self.deserialize(resp)['objects']

        self.assertTrue(len(objects) != 0)

        post_data = {}

        for data in objects:
            date = data['date']
            post_data[date] = {
                'dishes': {}
            }
            for provider, categories in data['providers'].items():
                for category in categories:
                    for dish in data['providers'][provider][category]:
                        dish_id = dish['id']
                        post_data[date]['dishes'][dish_id] =  1

        resp = self.api_client.post(self.order_url, format='json', data=post_data, authentication=self.get_credentials())
        #self.assertTrue(False, resp)
        self.assertHttpCreated(resp)