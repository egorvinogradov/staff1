from dinner.api import ReserveDishesResource
from django.conf.urls.defaults import patterns, url, include
import views

day_resource = ReserveDishesResource()

urlpatterns = patterns('',

    (r'^api/', include(day_resource.urls)),

    url(r'^$', views.reserve),
    url(r'^order/(\d+)/$', views.order_view),
)
