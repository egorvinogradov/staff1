#coding: utf-8
from django.utils.datastructures import SortedDict
from dinner.management.commands.dinner_populate_db import download_latest_hlebsol
from django.contrib.auth.models import User

from django.utils.unittest.case import TestCase
from providers import fusion_hleb_sol
from tastypie.test import ResourceTestCase
from utils import import_menu

imported = False
def stateful_import_menu():
    
    # stateful func to speedup things
    global imported
    if imported:
        return

    import_menu(
            process_function=fusion_hleb_sol.process,
            provider_name=u'Хлеб-Соль',
            path='dinner/fixtures/hlebsol-next.xls'
    )

class ProviderXlsParseTestCase(TestCase):
    
    def setUp(self):
        download_latest_hlebsol()

    def test_parse_helobsl(self):
        self.do_parse('dinner/fixtures/hlebsol-current.xls')

    def test_parse_fusion(self):
        self.do_parse('dinner/fixtures/fusion-current.xls')

    def do_parse(self, filename):
        data = list(fusion_hleb_sol.process(filename))

        for row in data:
            self.assertTrue(len(row) == 3)

            self.assertTrue(row[0] is not None)
            self.assertTrue(row[1] is not None)
            self.assertTrue(row[2] is not None)

            dish = row[2]

            self.assertTrue(dish['name'] is not None)
            self.assertTrue(isinstance(dish['price'], float))

    def test_import_menu(self):
        stateful_import_menu()


class RestApiTest(ResourceTestCase):

    def setUp(self):
        super(RestApiTest, self).setUp()

        download_latest_hlebsol()
        stateful_import_menu()

        self.day_url = '/api/v1/day/'
        self.order_url = '/api/v1/order/'
        self.favorite_url = '/api/v1/favorite/'

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

        self.assertTrue(len(objects) > 1, objects)

        post_data = SortedDict()
        sent_dishes_ids  = []

        date_count = 0
        for data in objects:
            date_count += 1

            date = data['date']
            post_data[date] = {
                'dishes': {},
                'restaurant': None,
                'none': False
            }

            if date_count % 3 == 0:
                post_data[date]['none'] = True
                continue

            if date_count % 2 == 0:
                post_data[date]['restaurant'] = 'luch'
                continue

            count = 0
            for provider, groups in data['providers'].items():
                for group in groups:
                    for dish in data['providers'][provider][group]:
                        if count >= 5:
                            break

                        dish_id = dish['id']
                        post_data[date]['dishes'][dish_id] = 1

                        sent_dishes_ids.append(dish_id)

                        count += 1

        resp = self.api_client.post(self.order_url, format='json', data=post_data, authentication=self.get_credentials())
        self.assertHttpCreated(resp)

        resp = self.api_client.get(self.order_url, format='json', authentication=self.get_credentials())
        objects = self.deserialize(resp)['objects']

        received_dish_ids = []
        for obj in objects:
            for date, data in obj.items():
                for provider, groups in data['dishes'].items():
                    for group in groups:
                        for dish in data['dishes'][provider][group]:
                            received_dish_ids.append(dish['id'])

        self.assertTrue(sorted(received_dish_ids) == sorted(sent_dishes_ids))


    def test_favorites(self):
        resp = self.api_client.get(self.favorite_url, format='json', authentication=self.get_credentials())
        objects = self.deserialize(resp)['objects']
        self.assertTrue(len(objects) != 0)

        ids = []
        for object in objects:
            if object['id'] % 2 == 0:
                ids.append(object['id'])

        resp = self.api_client.post(self.favorite_url, format='json', data={'objects': ids},
            authentication=self.get_credentials())
        self.assertHttpCreated(resp)

        resp = self.api_client.get(self.favorite_url, format='json', authentication=self.get_credentials())
        objects = self.deserialize(resp)['objects']
        created_ids = [o['id'] for o in objects if o['favorite']]

        self.assertEqual(sorted(created_ids), sorted(ids))