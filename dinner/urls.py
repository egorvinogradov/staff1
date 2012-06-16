import views

from tastypie.api import Api
from dinner.api import DayResource, OrderDayItemResource, FavoriteDishResource
from django.conf.urls.defaults import patterns, url, include

v1_api = Api(api_name='v1')
v1_api.register(DayResource())
v1_api.register(OrderDayItemResource())
v1_api.register(FavoriteDishResource())

urlpatterns = patterns('',
    url(r'^$', views.index),
    url(r'^api/', include(v1_api.urls)),
)
