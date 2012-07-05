import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('cwiz', 'cyberwizard.ru@gmail.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2', 
        'NAME': 'fast_food',                      
        'USER': 'postgres',                       
        'PASSWORD': 'suprpass616',                  
        'HOST': '78.46.187.179',                      
        'PORT': '',                      
    }
}

TIME_ZONE = 'Europe/Moscow'

LANGUAGE_CODE = 'ru-ru'

SITE_ID = 1

USE_I18N = True

USE_L10N = True

MEDIA_ROOT = ROOT + '/static/'

MEDIA_URL = '/static/'

STATIC_URL = '/static/admin/'

STATICFILES_DIRS = (
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

AUTH_PROFILE_MODULE = 'app_auth.UserProfile'

SECRET_KEY = 'lhut*arex%a$%z*masg72c$mq4x#e9r6a+b61m3eyvmj(!i!r8'

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
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
)

TEMPLATE_DIRS = (
    ROOT + '/templates/',
)

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.staticfiles',

    'debug_toolbar',
    'django_nose',
    'gunicorn',
    'social_auth',
    'south',
    'tastypie',
    
    'dinner',
    'app_auth',    
)

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
    'django.contrib.auth.backends.ModelBackend',
    'app_auth.auth_backends.OstrovokBackend',
    )

MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'
SOCIAL_AUTH_ASSOCIATE_BY_MAIL = True
SOCIAL_AUTH_IMPORT_BACKENDS = (
    'app_auth.auth_backends',
)

LOGIN_ERROR_URL = '/auth-error/'

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

UPLOAD_TO = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/static/data/'
LANGUAGES = ()