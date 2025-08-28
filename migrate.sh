#!/bin/bash
echo "🗄️ 데이터베이스 마이그레이션을 실행합니다..."

cd ~/medical-platform/backend
source venv/bin/activate

# Django 마이그레이션
echo "Django 마이그레이션 실행 중..."
python manage.py makemigrations
python manage.py migrate

# OpenMRS 데이터베이스 마이그레이션 (있는 경우)
python manage.py migrate --database=openmrs 2>/dev/null || echo "OpenMRS 마이그레이션 스킵"

echo "✅ 마이그레이션 완료!"
deactivate
