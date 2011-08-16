from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
import team.urls
import dinner.urls

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),

    (r'^accounts/', include('socialauth.urls')),

    #(r'^', include(team.urls)),
    (r'^', include(dinner.urls)),
)
