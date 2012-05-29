from django.conf import settings
from django.conf.urls.defaults import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin

import team.urls
import dinner.urls
import staff.urls

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),

    url(r'^accounts/', include('social_auth.urls')),
    url(r'^accounts/base/', include('django.contrib.auth.urls')),

    (r'^staff/', include(staff.urls)),
    (r'^', include(team.urls)),
    (r'^', include(dinner.urls)),
)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
