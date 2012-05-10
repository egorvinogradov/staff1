#from django.contrib.auth.models import User
#from tastypie.test import ResourceTestCase
#
#class DayResourceTest(ResourceTestCase):
#
#    fixtures = ['dinner/fixtures/data.json']
#
#    def setUp(self):
#        super(DayResourceTest, self).setUp()
#
#        self.username = 'pokemon'
#        self.password = 'pokemon'
#
#        #tryL
#        #    self.user = User.objects.create_user(self.username, 'test123@ostrovok.ru', self.password)
#        #except
#        self.url = '/api/day/?format=json'
#
#
#    def test_get_list_json(self):
#        response = self.api_client.get(self.url, format='json')
#
#        self.assertValidJSONResponse(response)


from django.utils.unittest.case import TestCase
from providers import hleb_sol

class ProviderXlsParseTestCase(TestCase):

    def test_helobsl(self):
        self.do_import('dinner/fixtures/hlebsol.xls')

    def test_import_fusion(self):
        self.do_import('dinner/fixtures/fusion.xls')

    def do_import(self, filename):
        data = list(hleb_sol.process(filename))

        for row in data:
            self.assertTrue(len(row) == 3)

            self.assertTrue(row[0] is not None)
            self.assertTrue(row[1] is not None)
            self.assertTrue(row[2] is not None)

            dish = row[2]

            self.assertTrue(dish['title'] is not None)
            self.assertTrue(isinstance(dish['price'], float))


