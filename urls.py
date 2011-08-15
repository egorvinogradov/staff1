from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
import team.urls
import dinner.urls

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),

    (r'^accounts/', include('socialauth.urls')),
    (r'^signin/$', 'socialauth.views.signin_complete'),

    (r'^', include(team.urls)),
    (r'^dinner/', include(dinner.urls)),
)
