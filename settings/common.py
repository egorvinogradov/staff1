# Django settings for staff project.
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Denis', 'denis@ostrovok.ru'),
    # ('Your Name', 'your_email@example.com'),
    ('Yasha', 'jjay@ostrovok.ru'),
    ('dkr', 'dkr@ostrovok.ru'),
    )

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'staff_test_3',                      # Or path to database file if using sqlite3.
        'USER': 'postgres',                       # Not used with sqlite3.
        'PASSWORD': '2minutes2midnight',                  # Not used with sqlite3.
        'HOST': 'dev4-db.ostrovok.ru',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
        'OPTIONS': {
            'autocommit': False,
            }
    }
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Moscow'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'ru-ru'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ROOT + '/static/'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = '/static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "http://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = '/static/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
# Put strings here, like "/home/html/static" or "C:/www/django/static".
# Always use forward slashes, even on Windows.
# Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    #    'django.contrib.staticfiles.finders.DefaultStorageFinder',
    )

AUTH_PROFILE_MODULE = 'staff.UserProfile'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'lhut*arex%a$%z*masg72c$mq4x#e9r6a+b61m3eyvmj(!i!r8'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    #     'django.template.loaders.eggs.Loader',
    )

MIDDLEWARE_CLASSES = (
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django_openid_consumer.middleware.OpenIDMiddleware',
    )

ROOT_URLCONF = 'urls'

DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': False,
    'EXTRA_SIGNALS': [],
    'HIDE_DJANGO_SQL': False,
    'TAG': 'div',
    }

INTERNAL_IPS = (
    '188.254.43.246',  '89.221.51.34', # office
    '178.140.56.36', '80.250.237.100',
    '95.84.198.12', '89.179.244.26', '95.31.16.175',
    )


TEMPLATE_DIRS = (
    ROOT + '/templates/',
    )

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    #'django.contrib.staticfiles',
    'django.contrib.admin',
    'social_auth',
    'debug_toolbar',
    'team',
    'dinner',
    'staff',
    'south',
    'tastypie',
    'django_nose',
    )

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
            },
        }
}

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.core.context_processors.media",
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.request",
    "social_auth.context_processors.social_auth_by_type_backends",
    )

SOCIAL_AUTH_ENABLED_BACKENDS = ('ostrovok',)
LOGIN_REDIRECT_URL = '/'
LOGIN_URL = '/accounts/login/ostrovok/'

AUTHENTICATION_BACKENDS = (
    'team.auth_backends.OstrovokBackend',
    'django.contrib.auth.backends.ModelBackend',
    )

MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'
SOCIAL_AUTH_ASSOCIATE_BY_MAIL = True
SOCIAL_AUTH_IMPORT_BACKENDS = (
    'team.auth_backends',
    )
LOGIN_ERROR_URL = '/auth-error/'

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

UPLOAD_TO = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/static/data/'
LANGUAGES = ()