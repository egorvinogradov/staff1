from django.conf.urls.defaults import patterns, url
import views

urlpatterns = patterns('',
    url(r'^add-git-key$', views.add_git_key),
)
