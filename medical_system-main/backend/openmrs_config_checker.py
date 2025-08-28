#!/usr/bin/env python3
# openmrs_config_checker.py - OpenMRS 설정 확인 및 수정

import requests
import json
from requests.auth import HTTPBasicAuth

class OpenMRSConfigChecker:
    def __init__(self):
        self.base_url = "http://localhost:8082/openmrs"
        self.api_url = f"{self.base_url}/ws/rest/v1"
        self.auth = HTTPBasicAuth("admin", "Admin123")
        
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

    def check_identifier_types(self):
        """식별자 유형 확인"""
        print("🏷️ 식별자 유형 확인...")
        try:
            response = self.session.get(f"{self.api_url}/patientidentifiertype", timeout=10)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                print(f"   ✅ 사용 가능한 식별자 유형: {len(results)}개")
                
                for i, id_type in enumerate(results):
                    retired = id_type.get('retired', False)
                    required = id_type.get('required', False)
                    status = "⚠️ 사용불가" if retired else "✅ 사용가능"
                    req_text = "필수" if required else "선택"
                    
                    print(f"     {i+1}. {id_type.get('display')} [{status}] [{req_text}]")
                    print(f"        UUID: {id_type.get('uuid')}")
                    print(f"        설명: {id_type.get('description', 'N/A')}")
                    print()
                
                # 기본 식별자 유형 찾기
                default_types = [t for t in results if not t.get('retired', False)]
                if default_types:
                    recommended = default_types[0]
                    print(f"   🎯 추천 식별자 유형:")
                    print(f"      이름: {recommended.get('display')}")
                    print(f"      UUID: {recommended.get('uuid')}")
                    return recommended.get('uuid')
                else:
                    print("   ❌ 사용 가능한 식별자 유형이 없습니다")
                    return None
            else:
                print(f"   ❌ 응답 오류: {response.status_code}")
                return None
        except Exception as e:
            print(f"   ❌ 오류: {e}")
            return None

    def check_locations(self):
        """위치 정보 확인"""
        print("📍 위치 정보 확인...")
        try:
            response = self.session.get(f"{self.api_url}/location", timeout=10)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                print(f"   ✅ 사용 가능한 위치: {len(results)}개")
                
                for i, location in enumerate(results):
                    retired = location.get('retired', False)
                    status = "⚠️ 사용불가" if retired else "✅ 사용가능"
                    
                    print(f"     {i+1}. {location.get('display')} [{status}]")
                    print(f"        UUID: {location.get('uuid')}")
                    print(f"        주소: {location.get('address1', 'N/A')}")
                    print()
                
                # 기본 위치 찾기
                default_locations = [l for l in results if not l.get('retired', False)]
                if default_locations:
                    recommended = default_locations[0]
                    print(f"   🎯 추천 위치:")
                    print(f"      이름: {recommended.get('display')}")
                    print(f"      UUID: {recommended.get('uuid')}")
                    return recommended.get('uuid')
                else:
                    print("   ❌ 사용 가능한 위치가 없습니다")
                    return None
            else:
                print(f"   ❌ 응답 오류: {response.status_code}")
                return None
        except Exception as e:
            print(f"   ❌ 오류: {e}")
            return None

    def test_patient_creation_with_correct_uuids(self, identifier_uuid, location_uuid):
        """올바른 UUID로 환자 생성 테스트"""
        print(f"\n👶 올바른 UUID로 환자 생성 테스트...")
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        patient_data = {
            'person': {
                'names': [
                    {
                        'givenName': '테스트',
                        'familyName': '환자',
                        'middleName': timestamp[-4:],  # 고유성을 위해
                        'preferred': True
                    }
                ],
                'gender': 'M',
                'birthdate': '1990-01-01',
                'birthdateEstimated': False
            },
            'identifiers': [
                {
                    'identifier': f'TEST{timestamp}',
                    'identifierType': identifier_uuid,
                    'location': location_uuid,
                    'preferred': True
                }
            ]
        }
        
        print(f"   📤 전송 데이터:")
        print(f"      식별자 UUID: {identifier_uuid}")
        print(f"      위치 UUID: {location_uuid}")
        print(f"      환자번호: TEST{timestamp}")
        
        try:
            response = self.session.post(
                f"{self.api_url}/patient",
                json=patient_data,
                timeout=30
            )
            
            print(f"   📥 응답 상태: {response.status_code}")
            
            if response.status_code == 201:
                result = response.json()
                print(f"   ✅ 환자 생성 성공!")
                print(f"      환자 UUID: {result.get('uuid')}")
                print(f"      환자 정보: {result.get('display')}")
                return result
            else:
                print(f"   ❌ 환자 생성 실패")
                print(f"   응답 내용: {response.text[:500]}...")
                return None
                
        except Exception as e:
            print(f"   ❌ 요청 실패: {e}")
            return None

    def run_full_check(self):
        """전체 검사 및 테스트 실행"""
        print("=" * 60)
        print("🏥 OpenMRS 설정 확인 및 환자 생성 테스트")
        print("=" * 60)
        
        # 1. 식별자 유형 확인
        identifier_uuid = self.check_identifier_types()
        
        print()
        
        # 2. 위치 정보 확인
        location_uuid = self.check_locations()
        
        # 3. 환자 생성 테스트
        if identifier_uuid and location_uuid:
            result = self.test_patient_creation_with_correct_uuids(identifier_uuid, location_uuid)
            
            if result:
                print(f"\n🎉 OpenMRS 환자 생성이 정상적으로 작동합니다!")
                print(f"\n📋 Django 코드에 사용할 UUID:")
                print(f"   식별자 유형 UUID: '{identifier_uuid}'")
                print(f"   위치 UUID: '{location_uuid}'")
                
                return {
                    'identifier_type_uuid': identifier_uuid,
                    'location_uuid': location_uuid,
                    'success': True
                }
            else:
                print(f"\n⚠️ 환자 생성에 여전히 문제가 있습니다.")
                return {'success': False}
        else:
            print(f"\n❌ 필요한 설정 정보를 찾을 수 없습니다.")
            print(f"   OpenMRS 초기 설정이 필요할 수 있습니다.")
            return {'success': False}


if __name__ == "__main__":
    checker = OpenMRSConfigChecker()
    result = checker.run_full_check()
    
    if result.get('success'):
        print(f"\n🔧 다음 단계:")
        print(f"1. Django views.py에서 UUID 값 업데이트")
        print(f"2. 환자 등록 폼에서 다시 테스트")
        print(f"3. 성공시 하드코딩된 UUID를 환경 설정으로 이동")
    else:
        print(f"\n🚨 문제 해결이 필요합니다:")
        print(f"1. OpenMRS 웹 인터페이스에서 기본 설정 확인")
        print(f"2. 식별자 유형 및 위치 설정")
        print(f"3. OpenMRS 서버 로그 확인")