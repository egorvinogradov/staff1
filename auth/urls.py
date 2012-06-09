import views
from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('',
    #url(r'^$', views.index),
    url(r'^auth-error/$', views.auth),
    url(r'^config/$', views.config),
)
