import os
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

########################################
# 기본 경로 및 시크릿 설정
########################################
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-your-secret-key-here')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = [
    'localhost', '127.0.0.1', '0.0.0.0', '35.225.63.41', '*'
]

########################################
# 애플리케이션 정의
########################################
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'corsheaders',
    'rest_framework',
]

LOCAL_APPS = [
    'medical_integration',
    'openmrs_models',
    'orthanc_models',
    'worklist',
    'accounts',
    'orders',
    'orders_emr',
    'samples',
    'tests',
    'ocs.apps.OcsConfig',
    'lis_cdss',
    'webhook_handler',
    'ai_analysis',
    'common',
    'dr_annotations',
    'dr_reports',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # 'ocs.middleware.APILoggingMiddleware', ###
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

########################################
# 데이터베이스 설정
########################################
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('MARIADB_DATABASE', 'medical_platform'),
        'USER': os.getenv('MARIADB_USER', 'root'),
        'PASSWORD': os.getenv('MARIADB_PASSWORD', 'rootpassword'),
        'HOST': os.getenv('MARIADB_HOST', '127.0.0.1'),
        'PORT': os.getenv('MARIADB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    },
    'openmrs': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('OPENMRS_DATABASE', 'openmrs'),
        'USER': os.getenv('OPENMRS_USER', 'openmrs'),
        'PASSWORD': os.getenv('OPENMRS_PASSWORD', 'Admin123'),
        'HOST': os.getenv('OPENMRS_HOST', '127.0.0.1'),
        'PORT': os.getenv('OPENMRS_PORT', '3307'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    },
    'orthanc': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('ORTHANC_DATABASE', 'orthanc'),
        'USER': os.getenv('ORTHANC_USER', 'orthanc'),
        'PASSWORD': os.getenv('ORTHANC_PASSWORD', 'orthanc'),
        'HOST': os.getenv('ORTHANC_HOST', '127.0.0.1'),
        'PORT': os.getenv('ORTHANC_PORT', '5432'),
    },
}

DATABASE_ROUTERS = ['db_router.DatabaseRouter']

########################################
# 정적 및 미디어 파일
########################################
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

########################################
# 인증 및 언어 설정
########################################
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

########################################
# REST Framework
########################################
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser'
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

########################################
# CORS 설정
########################################
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://35.225.63.41:3000",
    "http://0.0.0.0:3000",
    "http://35.225.63.41:8000",
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt', 'origin',
    'user-agent', 'x-csrftoken', 'x-requested-with',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://35.225.63.41:3000",
    "http://35.225.63.41:8000",
]

########################################
# 외부 서비스 / PACS / 기타
########################################
AI_MODELS_DIR = BASE_DIR / 'ai_models'
DEFAULT_DOCTOR_ID = "DR001"
DEFAULT_DOCTOR_NAME = "김영상"

PACS_CONFIG = {
    'BASE_URL': os.getenv('ORTHANC_URL', 'http://localhost:8042'),
    'HOST': os.getenv('ORTHANC_HOST', 'localhost'),
    'PORT': int(os.getenv('ORTHANC_PORT', '8042')),
    'USERNAME': os.getenv('ORTHANC_USERNAME', 'orthanc'),
    'PASSWORD': os.getenv('ORTHANC_PASSWORD', 'orthanc'),
    'PROTOCOL': os.getenv('ORTHANC_PROTOCOL', 'http'),
    'TIMEOUT': int(os.getenv('ORTHANC_TIMEOUT', '30')),
    'MAX_RETRIES': int(os.getenv('ORTHANC_MAX_RETRIES', '3')),
}
ORTHANC_URL = PACS_CONFIG['BASE_URL']
ORTHANC_USERNAME = PACS_CONFIG['USERNAME']
ORTHANC_PASSWORD = PACS_CONFIG['PASSWORD']

EXTERNAL_SERVICES = {
    'openmrs': {
        'host': '35.225.63.41',
        'port': '8082',
        'username': 'admin',
        'password': 'Admin123',
    },
    'orthanc': {
        'host': '35.225.63.41',
        'port': '8042',
        'username': 'orthanc',
        'password': 'orthanc',
    },
}
# ─── MongoDB 로깅용 설정 ==저에오 OCS───
MONGO_URI = os.getenv(
    'MONGO_URI',
    'mongodb://ocs_user:ocs_pass@127.0.0.1:27017/?authSource=ocslog')
DB_NAME          = os.getenv('DB_NAME',         'ocslog')
COLLECTION_NAME  = os.getenv('COLLECTION_NAME', 'logs')

########################################
# 로깅 설정
########################################
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'medical_integration.log',
            'maxBytes': 1024*1024*15,
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'medical_integration': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

os.makedirs(BASE_DIR / 'logs', exist_ok=True)
