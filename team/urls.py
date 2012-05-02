from django.conf.urls.defaults import patterns, url
import views

urlpatterns = patterns('',
    #url(r'^$', views.index),
    url(r'^auth-error/$', views.auth),
)
