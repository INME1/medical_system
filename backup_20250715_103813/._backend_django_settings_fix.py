import os
import re

# Django settings.py 파일들 찾아서 수정
settings_files = []
for root, dirs, files in os.walk('.'):
    for file in files:
        if file == 'settings.py':
            settings_files.append(os.path.join(root, file))

for settings_file in settings_files:
    try:
        with open(settings_file, 'r') as f:
            content = f.read()
        
        # OpenMRS 설정 추가/수정
        openmrs_config = """
# OpenMRS 설정 (자동 수정됨)
OPENMRS_BASE_URL = 'http://35.225.63.41:8082/openmrs/'
OPENMRS_HOST = '35.225.63.41'
OPENMRS_PORT = 8082
OPENMRS_USERNAME = 'admin'
OPENMRS_PASSWORD = 'Admin123'
"""
        
        # 기존 OpenMRS 설정 제거 후 새로 추가
        content = re.sub(r'OPENMRS_.*?=.*?\n', '', content, flags=re.MULTILINE)
        content += openmrs_config
        
        with open(settings_file, 'w') as f:
            f.write(content)
        
        print(f"✅ {settings_file} 수정 완료")
        
    except Exception as e:
        print(f"❌ {settings_file} 수정 실패: {e}")
