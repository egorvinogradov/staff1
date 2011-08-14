from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
import team.urls
import dinner.urls

admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'staff.views.home', name='home'),
    # url(r'^staff/', include('staff.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    url(r'^admin/', include(admin.site.urls)),

    (r'^accounts/', include('socialauth.urls')),
    (r'^signin/$', 'socialauth.views.signin_complete'),

    (r'^', include(team.urls)),
    (r'^dinner/', include(dinner.urls)),
)
