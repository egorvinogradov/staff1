from tastypie.api import Api
from dinner.api import DayResource, OrderDayItemResource, FavoriteDishResource
from django.conf.urls.defaults import patterns, url, include
import views

v1_api = Api(api_name='v1')
v1_api.register(DayResource())
v1_api.register(OrderDayItemResource())
v1_api.register(FavoriteDishResource())


urlpatterns = patterns('',
    (r'^api/', include(v1_api.urls)),
    url(r'^$', views.reserve),
    url(r'^order/(\d+)/$', views.order_view),
)
