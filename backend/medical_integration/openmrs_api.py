import requests
import logging
import os
from datetime import datetime, timezone
from django.conf import settings
from base64 import b64encode

logger = logging.getLogger(__name__)

class OpenMRSAPI:
    def __init__(self):
        """🔥 URL 파싱 문제 완전 해결"""
        # 환경변수에서 안전하게 로드
        self.api_host = os.getenv('OPENMRS_API_HOST', '127.0.0.1')
        self.api_port = os.getenv('OPENMRS_API_PORT', '8082') 
        self.username = os.getenv('OPENMRS_API_USER', 'admin')
        self.password = os.getenv('OPENMRS_API_PASSWORD', 'Admin123')
        
        self._identifier_types = None
        self._locations = None
        # 🔥 URL 구성 - 이중 http 문제 해결
        # host에 http://가 포함되어 있으면 제거
        clean_host = self.api_host.replace('http://', '').replace('https://', '')
        
        # 올바른 URL 구성
        self.base_url = f"http://{clean_host}:{self.api_port}"
        self.api_url = f"{self.base_url}/openmrs/ws/rest/v1"
        
        # 인증 설정
        self.auth = (self.username, self.password)
        self.auth_header = b64encode(f"{self.username}:{self.password}".encode()).decode()
        
        # 기본 헤더
        self.headers = {
            'Authorization': f'Basic {self.auth_header}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        logger.info(f"🏥 OpenMRS API 초기화 완료")
        logger.info(f"🌐 Base URL: {self.base_url}")
        logger.info(f"🔗 API URL: {self.api_url}")
        logger.info(f"👤 사용자: {self.username}")
        
        # 연결 테스트
        self.test_connection()
    
    
    def generate_unique_identifier(self):
        """🔥 P + 순차 숫자 생성 (중복 없음)"""
        try:
            # 1. DB에서 현재 최대 P 번호 찾기
            from django.db import transaction
            from .models import PatientMapping
            
            with transaction.atomic():
                # P로 시작하는 identifier 중 가장 큰 번호 찾기
                latest_mapping = PatientMapping.objects.filter(
                    patient_identifier__startswith='P',
                    patient_identifier__regex=r'^P[0-9]+$',  # P + 숫자만
                    is_active=True
                ).extra(
                    select={'num_part': 'CAST(SUBSTRING(patient_identifier, 2) AS UNSIGNED)'}
                ).order_by('-num_part').first()
                
                if latest_mapping:
                    try:
                        # P123 → 123 추출 → +1
                        current_number = int(latest_mapping.patient_identifier[1:])
                        next_number = current_number + 1
                        logger.info(f"🔖 현재 최대: {latest_mapping.patient_identifier}, 다음: P{next_number}")
                    except ValueError:
                        next_number = 1
                else:
                    next_number = 1
                    logger.info(f"🔖 첫 번째 환자: P{next_number}")
                
                # 2. 중복 확인 (혹시 모를 상황 대비)
                max_attempts = 10
                for attempt in range(max_attempts):
                    candidate = f"P{next_number + attempt}"
                    
                    # DB에서 중복 확인
                    if not PatientMapping.objects.filter(
                        patient_identifier=candidate, 
                        is_active=True
                    ).exists():
                        
                        # OpenMRS API에서도 중복 확인
                        if not self.check_identifier_exists_simple(candidate):
                            logger.info(f"✅ 고유 identifier 생성: {candidate}")
                            return candidate
                    
                    logger.warning(f"⚠️ {candidate} 중복, 다음 번호 시도...")
                
                # 최대 시도 후에도 실패하면 타임스탬프 기반
                timestamp = datetime.now().strftime("%m%d%H%M")
                fallback = f"P{timestamp}"
                logger.warning(f"🚨 fallback identifier: {fallback}")
                return fallback
                
        except Exception as e:
            logger.error(f"❌ P+숫자 생성 실패: {e}")
            # 최후의 수단
            import random
            emergency = f"P{random.randint(1000, 9999)}"
            logger.error(f"🆘 긴급 identifier: {emergency}")
            return emergency
    
    def create_patient_with_auto_openmrs_id(self, patient_data, custom_identifier=None):
        """🔥 안전 모드 환자 생성"""
        try:
            logger.info(f"🔄 안전 모드 환자 생성 시작...")
            
            # 1. 상세 연결 테스트
            connection_test = self.test_connection_detailed()
            if not connection_test['success']:
                return {
                    'success': False,
                    'error': connection_test['error']
                }
            
            logger.info("✅ 연결 및 메타데이터 테스트 통과")
            
            # 2. 환자 데이터 검증
            required_fields = ['givenName', 'familyName', 'gender', 'birthdate']
            for field in required_fields:
                if not patient_data.get(field):
                    return {
                        'success': False,
                        'error': f'필수 필드 누락: {field}'
                    }
            
            # 3. 식별자 처리
            if custom_identifier and custom_identifier.strip():
                patient_identifier = custom_identifier.strip()
                logger.info(f"🔖 사용자 지정 식별자: {patient_identifier}")
            else:
                patient_identifier = self.generate_unique_identifier()
                logger.info(f"🔖 자동 생성 식별자: {patient_identifier}")
            
            # 4. 메타데이터 가져오기
            identifier_type = self.get_default_identifier_type()
            location = self.get_default_location()
            
            # 🔥 핵심: 메타데이터 검증
            if not identifier_type:
                return {
                    'success': False,
                    'error': 'OpenMRS에서 유효한 식별자 타입을 찾을 수 없습니다. OpenMRS 설정을 확인해주세요.'
                }
                
            if not location:
                return {
                    'success': False,
                    'error': 'OpenMRS에서 유효한 위치를 찾을 수 없습니다. OpenMRS 설정을 확인해주세요.'
                }
            
            # 5. 최소한의 안전한 데이터 구성
            openmrs_patient_data = {
                'person': {
                    'names': [{
                        'givenName': str(patient_data['givenName']).strip(),
                        'familyName': str(patient_data['familyName']).strip(),
                        'preferred': True
                    }],
                    'gender': str(patient_data['gender']).upper(),
                    'birthdate': str(patient_data['birthdate'])
                },
                'identifiers': [{
                    'identifier': patient_identifier,
                    'identifierType': identifier_type,
                    'location': location,
                    'preferred': True
                }]
            }
            
            # middleName 추가 (있는 경우에만)
            if patient_data.get('middleName'):
                openmrs_patient_data['person']['names'][0]['middleName'] = str(patient_data['middleName']).strip()
            
            logger.info(f"📤 최종 전송 데이터: {openmrs_patient_data}")
            
            # 6. 환자 생성 API 호출
            response = requests.post(
                f"{self.api_url}/patient",
                json=openmrs_patient_data,
                auth=self.auth,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout=30
            )
            
            logger.info(f"📥 OpenMRS 응답: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"✅ 환자 생성 성공: {result.get('uuid')}")
                
                return {
                    'success': True,
                    'message': '환자가 성공적으로 생성되었습니다',
                    'patient': {
                        'uuid': result.get('uuid'),
                        'display': result.get('display'),
                        'identifiers': result.get('identifiers', []),
                        'patient_identifier': patient_identifier
                    },
                    'auto_generated': not bool(custom_identifier)
                }
            else:
                # 🔥 상세 에러 로깅
                error_content = response.text
                logger.error(f"❌ 환자 생성 실패: {response.status_code}")
                logger.error(f"❌ 응답 내용 (처음 1000자): {error_content[:1000]}")
                
                # HTML 에러 페이지인 경우 간단한 메시지로 변환
                if 'Internal Server Error' in error_content:
                    error_msg = 'OpenMRS 서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.'
                else:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('error', {}).get('message', '알 수 없는 오류')
                    except:
                        error_msg = f'OpenMRS API 오류 (코드: {response.status_code})'
                
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except requests.exceptions.Timeout:
            logger.error("❌ OpenMRS API 타임아웃")
            return {
                'success': False,
                'error': 'OpenMRS 서버 응답 시간이 초과되었습니다'
            }
        except requests.exceptions.ConnectionError:
            logger.error("❌ OpenMRS 연결 실패")
            return {
                'success': False,
                'error': 'OpenMRS 서버에 연결할 수 없습니다'
            }
        except Exception as e:
            logger.error(f"❌ 예상치 못한 오류: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'예상치 못한 오류가 발생했습니다: {str(e)}'
            }

    def create_patient_with_manual_id(self, patient_data, patient_identifier):
        """🔥 수동 지정 ID로 환자 생성"""
        try:
            logger.info(f"🔄 수동 ID 환자 생성: {patient_identifier}")
            
            # 기본 환자 데이터 준비
            prepared_data = self._prepare_patient_data(patient_data, patient_identifier)
            
            # OpenMRS API 호출
            response = requests.post(
                f"{self.api_url}/patient",
                json=prepared_data,
                auth=self.auth,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                patient_response = response.json()
                logger.info(f"✅ 환자 생성 성공: {patient_identifier}")
                
                return {
                    'success': True,
                    'message': '환자가 성공적으로 생성되었습니다.',
                    'patient': {
                        'uuid': patient_response['uuid'],
                        'display': patient_response.get('display', ''),
                        'identifiers': patient_response.get('identifiers', []),
                        'patient_identifier': patient_identifier
                    }
                }
            else:
                error_msg = self._parse_error_response(response)
                logger.error(f"❌ 환자 생성 실패: {error_msg}")
                return {
                    'success': False,
                    'error': f'환자 생성 실패: {error_msg}'
                }
                
        except Exception as e:
            logger.error(f"❌ 수동 ID 환자 생성 실패: {e}")
            return {
                'success': False,
                'error': f'환자 생성 중 오류: {str(e)}'
            }

    def _generate_patient_identifier(self):
        """🔥 OpenMRS IdGen 서비스를 사용한 ID 생성"""
        try:
            logger.info("🔄 IdGen 서비스로 Patient ID 생성 시도...")
            
            # OpenMRS IdGen 모듈의 기본 엔드포인트들 시도
            idgen_endpoints = [
                f"{self.api_url}/idgen/nextIdentifier",
                f"{self.api_url}/idgen/identifiersource/1/identifier",  # 기본 소스
                f"{self.api_url.replace('/ws/rest/v1', '')}/module/idgen/generateIdentifier.form"
            ]
            
            for endpoint in idgen_endpoints:
                try:
                    logger.info(f"🔄 IdGen 엔드포인트 시도: {endpoint}")
                    
                    response = requests.get(
                        endpoint,
                        auth=self.auth,
                        headers={'Accept': 'application/json'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        # JSON 응답 처리
                        try:
                            data = response.json()
                            if isinstance(data, dict):
                                identifier = data.get('identifier') or data.get('value') or data.get('id')
                            else:
                                identifier = str(data).strip()
                            
                            if identifier and identifier != 'null':
                                logger.info(f"✅ IdGen ID 생성 성공: {identifier}")
                                return identifier
                                
                        except:
                            # 텍스트 응답 처리
                            identifier = response.text.strip().strip('"')
                            if identifier and len(identifier) > 0 and identifier != 'null':
                                logger.info(f"✅ IdGen ID 생성 성공 (텍스트): {identifier}")
                                return identifier
                    
                except Exception as endpoint_error:
                    logger.debug(f"⚠️ IdGen 엔드포인트 실패 ({endpoint}): {endpoint_error}")
                    continue
            
            logger.warning("⚠️ 모든 IdGen 엔드포인트 실패")
            return None
            
        except Exception as e:
            logger.error(f"❌ IdGen 서비스 오류: {e}")
            return None
    
    def _format_openmrs_datetime(self, dt=None):
        """OpenMRS가 요구하는 정확한 datetime 형식으로 변환"""
        if dt is None:
            dt = datetime.now(timezone.utc)
        
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        # 밀리초는 3자리만 유지
        milliseconds = dt.microsecond // 1000
        formatted = dt.strftime('%Y-%m-%dT%H:%M:%S') + f'.{milliseconds:03d}Z'
        
        logger.debug(f"🕐 DateTime 변환: {dt} → {formatted}")
        return formatted
    
    def test_connection(self):
        """기본 연결 테스트"""
        try:
            logger.info(f"🔗 OpenMRS 연결 테스트: {self.api_url}/session")
            
            response = requests.get(
                f"{self.api_url}/session",
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                session_data = response.json()
                logger.info(f"✅ OpenMRS 연결 성공: {session_data.get('user', {}).get('display', 'Unknown')}")
                return True
            else:
                logger.error(f"❌ OpenMRS 연결 실패: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ OpenMRS 연결 실패: {e}")
            return False
    
    def test_connection_detailed(self):
        """🔥 상세한 연결 및 메타데이터 테스트"""
        try:
            logger.info("🔄 OpenMRS 연결 및 메타데이터 테스트 시작...")
            
            # 1. 세션 확인
            session_response = requests.get(
                f"{self.api_url}/session",
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if session_response.status_code != 200:
                logger.error(f"❌ 세션 확인 실패: {session_response.status_code}")
                return {
                    'success': False,
                    'error': f'OpenMRS 인증 실패: {session_response.status_code}',
                    'details': {}
                }
            
            session_info = session_response.json()
            logger.info(f"✅ 세션 확인 성공: {session_info.get('user', {}).get('display', 'Unknown')}")
            
            # 2. 식별자 타입 확인
            identifier_types = self.get_identifier_types()
            if not identifier_types:
                logger.error("❌ 식별자 타입을 찾을 수 없음")
                return {
                    'success': False,
                    'error': 'OpenMRS에서 유효한 식별자 타입을 찾을 수 없습니다',
                    'details': {'session': session_info}
                }
            
            default_id_type = self.get_default_identifier_type()
            logger.info(f"✅ 기본 식별자 타입: {default_id_type}")
            
            # 3. 위치 확인  
            locations = self.get_locations()
            if not locations:
                logger.error("❌ 위치 정보를 찾을 수 없음")
                return {
                    'success': False,
                    'error': 'OpenMRS에서 유효한 위치 정보를 찾을 수 없습니다',
                    'details': {
                        'session': session_info,
                        'identifier_types_count': len(identifier_types)
                    }
                }
            
            default_location = self.get_default_location()
            logger.info(f"✅ 기본 위치: {default_location}")
            
            return {
                'success': True,
                'message': 'OpenMRS 연결 및 메타데이터 확인 완료',
                'details': {
                    'session': session_info,
                    'identifier_types_count': len(identifier_types),
                    'locations_count': len(locations),
                    'default_identifier_type': default_id_type,
                    'default_location': default_location
                }
            }
            
        except Exception as e:
            logger.error(f"❌ OpenMRS 연결 테스트 실패: {e}")
            return {
                'success': False,
                'error': f'OpenMRS 연결 테스트 중 오류: {str(e)}',
                'details': {}
            }
    
    def get_identifier_types(self):
        """식별자 타입 목록 조회 (상세 로깅)"""
        if self._identifier_types is None:
            try:
                logger.info("🔄 식별자 타입 조회 중...")
                response = requests.get(
                    f"{self.api_url}/patientidentifiertype",
                    auth=self.auth,
                    headers={'Accept': 'application/json'},
                    timeout=15
                )
                
                logger.info(f"식별자 타입 API 응답: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    self._identifier_types = data.get('results', [])
                    logger.info(f"✅ 식별자 타입 조회 성공: {len(self._identifier_types)}개")
                    
                    # 🔥 상세 정보 로깅
                    for i, id_type in enumerate(self._identifier_types[:3]):  # 처음 3개만
                        logger.info(f"  [{i}] {id_type.get('display')} (UUID: {id_type.get('uuid')})")
                else:
                    logger.error(f"❌ 식별자 타입 조회 실패: {response.status_code}")
                    logger.error(f"응답 내용: {response.text[:500]}...")
                    self._identifier_types = []
            except Exception as e:
                logger.error(f"❌ 식별자 타입 조회 예외: {e}")
                self._identifier_types = []
        return self._identifier_types
    
    def get_locations(self):
        """위치 목록 조회 (상세 로깅)"""
        if self._locations is None:
            try:
                logger.info("🔄 위치 정보 조회 중...")
                response = requests.get(
                    f"{self.api_url}/location",
                    auth=self.auth,
                    headers={'Accept': 'application/json'},
                    timeout=15
                )
                
                logger.info(f"위치 API 응답: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    self._locations = data.get('results', [])
                    logger.info(f"✅ 위치 조회 성공: {len(self._locations)}개")
                    
                    # 🔥 상세 정보 로깅
                    for i, location in enumerate(self._locations[:3]):  # 처음 3개만
                        logger.info(f"  [{i}] {location.get('display')} (UUID: {location.get('uuid')})")
                else:
                    logger.error(f"❌ 위치 조회 실패: {response.status_code}")
                    logger.error(f"응답 내용: {response.text[:500]}...")
                    self._locations = []
            except Exception as e:
                logger.error(f"❌ 위치 조회 예외: {e}")
                self._locations = []
        return self._locations
    
    def get_default_identifier_type(self):
        """안전한 기본 식별자 타입 선택"""
        identifier_types = self.get_identifier_types()
        if not identifier_types:
            return None
            
        # 우선순위: OpenMRS ID > Old ID > 첫 번째
        for id_type in identifier_types:
            display = id_type.get('display', '').lower()
            if 'openmrs' in display:
                return id_type.get('uuid')
        
        for id_type in identifier_types:
            display = id_type.get('display', '').lower()
            if 'old' in display or 'patient' in display:
                return id_type.get('uuid')
        
        return identifier_types[0].get('uuid')
    
    def get_default_location(self):
        """안전한 기본 위치 선택"""
        locations = self.get_locations()
        if not locations:
            return None
            
        # 우선순위: Registration > Unknown > Default > 첫 번째
        priority_keywords = ['registration', 'unknown', 'default']
        
        for keyword in priority_keywords:
            for location in locations:
                display = location.get('display', '').lower()
                if keyword in display:
                    return location.get('uuid')
        
        return locations[0].get('uuid')
    
    def get_default_encounter_type_uuid(self):
        """기본 Encounter Type UUID 조회"""
        try:
            response = requests.get(
                f"{self.api_url}/encountertype?q=Admission",
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    uuid = data['results'][0]['uuid']
                    logger.info(f"📋 기본 Encounter Type: {uuid}")
                    return uuid
            
            # 기본값 반환
            default_uuid = "61ae96f4-6afe-4351-b6f8-cd4fc383cce1"
            logger.warning(f"⚠️ 기본 Encounter Type 사용: {default_uuid}")
            return default_uuid
            
        except Exception as e:
            logger.error(f"❌ Encounter Type 조회 실패: {e}")
            return "61ae96f4-6afe-4351-b6f8-cd4fc383cce1"
    
    def get_default_location_uuid(self):
        """기본 Location UUID 조회"""
        try:
            location_uuid = self.get_default_location()
            if location_uuid:
                return location_uuid
            
            # 환경변수에서 기본값 가져오기
            default_uuid = os.getenv('DEFAULT_LOCATION_TYPE_UUID', 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e')
            logger.warning(f"⚠️ 기본 Location 사용: {default_uuid}")
            return default_uuid
            
        except Exception as e:
            logger.error(f"❌ Location 조회 실패: {e}")
            return os.getenv('DEFAULT_LOCATION_TYPE_UUID', 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e')
    
    def get_default_provider_uuid(self):
        """기본 Provider UUID 조회"""
        try:
            response = requests.get(
                f"{self.api_url}/provider?q=admin",
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    uuid = data['results'][0]['uuid']
                    logger.info(f"👨‍⚕️ 기본 Provider: {uuid}")
                    return uuid
            
            logger.warning("⚠️ 기본 Provider를 찾을 수 없음")
            return None
            
        except Exception as e:
            logger.error(f"❌ Provider 조회 실패: {e}")
            return None
    
    def get_patient(self, patient_uuid):
        """환자 정보 조회"""
        try:
            logger.info(f"👤 환자 정보 조회: {patient_uuid}")
            
            response = requests.get(
                f"{self.api_url}/patient/{patient_uuid}?v=full",
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                patient_data = response.json()
                logger.info(f"✅ 환자 조회 성공: {patient_data.get('display', 'Unknown')}")
                return patient_data
            else:
                logger.error(f"❌ 환자 조회 실패: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ 환자 조회 예외: {e}")
            return None
    
    def create_encounter(self, encounter_data):
        """🔥 Encounter 생성 - DateTime 형식 자동 처리"""
        try:
            # DateTime 형식 자동 설정
            if not encounter_data.get('encounterDatetime'):
                encounter_data['encounterDatetime'] = self._format_openmrs_datetime()
            
            logger.info(f"🏥 Encounter 생성 데이터: {encounter_data}")
            
            response = requests.post(
                f"{self.api_url}/encounter",
                auth=self.auth,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                json=encounter_data,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"✅ Encounter 생성 성공: {result.get('uuid')}")
                return result
            else:
                logger.error(f"❌ Encounter 생성 실패: HTTP {response.status_code}")
                logger.error(f"응답 내용: {response.text}")
                return {
                    'error': f'HTTP {response.status_code}: {response.text[:200]}'
                }
                
        except Exception as e:
            logger.error(f"❌ Encounter 생성 예외: {e}")
            return {'error': f'Encounter 생성 중 예외: {str(e)}'}
    
    def create_obs(self, obs_data):
        """🔥 Observation 생성"""
        try:
            # DateTime 형식 자동 설정
            if not obs_data.get('obsDatetime'):
                obs_data['obsDatetime'] = self._format_openmrs_datetime()
            
            logger.info(f"📊 Obs 생성 데이터: {obs_data}")
            
            response = requests.post(
                f"{self.api_url}/obs",
                auth=self.auth,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                json=obs_data,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"✅ Obs 생성 성공: {result.get('uuid')}")
                return result
            else:
                logger.error(f"❌ Obs 생성 실패: HTTP {response.status_code}")
                logger.error(f"응답 내용: {response.text}")
                return {
                    'error': f'HTTP {response.status_code}: {response.text[:200]}'
                }
                
        except Exception as e:
            logger.error(f"❌ Obs 생성 예외: {e}")
            return {'error': f'Obs 생성 중 예외: {str(e)}'}
    
    # 기존 메서드들도 유지...
    def search_concepts(self, query, concept_class=None):
        """Concept 검색"""
        try:
            url = f"{self.api_url}/concept?q={query}"
            if concept_class:
                url += f"&conceptClass={concept_class}"
            
            response = requests.get(
                url,
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json().get('results', [])
            return []
            
        except Exception as e:
            logger.error(f"❌ Concept 검색 실패: {e}")
            return []
    
    def get_patient_encounters(self, patient_uuid):
        """환자의 Encounter 목록 조회"""
        try:
            response = requests.get(
                f"{self.api_url}/encounter?patient={patient_uuid}&v=full",
                auth=self.auth,
                headers={'Accept': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json().get('results', [])
            return []
            
        except Exception as e:
            logger.error(f"❌ Patient Encounters 조회 실패: {e}")
            return []
        
        

    def get_patient_clinical_summary(self, patient_uuid, limit=5):
        """환자의 최근 임상 데이터 요약"""
        try:
            encounters = self.get_patient_encounters(patient_uuid)
            
            clinical_data = []
            for encounter in encounters[:limit]:
                encounter_summary = {
                    'encounter_uuid': encounter.get('uuid'),
                    'encounter_datetime': encounter.get('encounterDatetime'),
                    'encounter_type': encounter.get('encounterType', {}).get('display', ''),
                    'location': encounter.get('location', {}).get('display', ''),
                    'provider': encounter.get('provider', {}).get('display', '') if encounter.get('provider') else '',
                    'diagnoses': [],
                    'prescriptions': [],
                    'other_obs': []
                }
                
                # Observations 분류
                for obs in encounter.get('obs', []):
                    concept_display = obs.get('concept', {}).get('display', '')
                    obs_value = obs.get('value') or obs.get('valueText') or obs.get('valueNumeric')
                    
                    if 'diagnosis' in concept_display.lower():
                        encounter_summary['diagnoses'].append({
                            'concept': concept_display,
                            'value': obs_value,
                            'obs_uuid': obs.get('uuid')
                        })
                    elif any(keyword in concept_display.lower() for keyword in ['drug', 'medication', 'dosage', 'frequency']):
                        encounter_summary['prescriptions'].append({
                            'concept': concept_display,
                            'value': obs_value,
                            'obs_uuid': obs.get('uuid')
                        })
                    else:
                        encounter_summary['other_obs'].append({
                            'concept': concept_display,
                            'value': obs_value,
                            'obs_uuid': obs.get('uuid')
                        })
                
                clinical_data.append(encounter_summary)
            
            return clinical_data
            
        except Exception as e:
            logger.error(f"❌ 환자 임상 요약 조회 예외: {e}")
            return []