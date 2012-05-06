from django.contrib.auth.models import User
from tastypie.test import ResourceTestCase

class DayResourceTest(ResourceTestCase):

    fixtures = ['dinner/fixtures/data.json']

    def setUp(self):
        super(DayResourceTest, self).setUp()

        self.username = 'pokemon'
        self.password = 'pokemon'

        #tryL
        #    self.user = User.objects.create_user(self.username, 'test123@ostrovok.ru', self.password)
        #except
        self.url = '/api/day/?format=json'


    def test_get_list_json(self):
        response = self.api_client.get(self.url, format='json')

        self.assertValidJSONResponse(response)
