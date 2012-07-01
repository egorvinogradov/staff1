from django.conf import settings
from django.conf.urls.defaults import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin

import dinner.urls
import app_auth.urls

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^', 				include(dinner.urls)),
    url(r'^accounts/', 		include('social_auth.urls')),
    url(r'^accounts/base/', include('django.contrib.auth.urls')),
    url(r'^admin/', 		include(admin.site.urls)),
    url(r'^auth/', 			include(app_auth.urls)),
)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
