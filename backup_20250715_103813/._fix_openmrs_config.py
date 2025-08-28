#!/usr/bin/env python3
import os
import re

def fix_openmrs_urls():
    """127.0.0.1:8082를 35.225.63.41:8082로 수정"""
    
    # 수정할 패턴들
    patterns = [
        (r'127\.0\.0\.1:8082', '35.225.63.41:8082'),
        (r'localhost:8082', '35.225.63.41:8082'),
        (r'http://127\.0\.0\.1:8082', 'http://35.225.63.41:8082'),
        (r'http://localhost:8082', 'http://35.225.63.41:8082')
    ]
    
    # Python 파일들 찾기
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    modified = False
                    for old_pattern, new_pattern in patterns:
                        if re.search(old_pattern, content):
                            print(f"수정 중: {filepath}")
                            content = re.sub(old_pattern, new_pattern, content)
                            modified = True
                    
                    if modified:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"✅ 수정 완료: {filepath}")
                        
                except Exception as e:
                    print(f"❌ {filepath} 수정 실패: {e}")

if __name__ == "__main__":
    fix_openmrs_urls()
