# backend/medical_integration/openmrs_api.py (수정된 버전)

import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
import logging

logger = logging.getLogger('medical_integration')

class OpenMRSAPI:
    """OpenMRS API 통합 클래스 - patient_identifier 기반 수정"""
    
    def __init__(self):
        self.base_url = f"http://{settings.EXTERNAL_SERVICES['openmrs']['host']}:{settings.EXTERNAL_SERVICES['openmrs']['port']}/openmrs"
        self.api_url = f"{self.base_url}/ws/rest/v1"
        self.username = settings.EXTERNAL_SERVICES['openmrs']['username']
        self.password = settings.EXTERNAL_SERVICES['openmrs']['password']
        self.auth = HTTPBasicAuth(self.username, self.password)
        
        # 캐시된 식별자 및 위치 정보
        self._identifier_types = None
        self._locations = None
    
    def get_session(self):
        """현재 세션 정보 조회"""
        try:
            response = requests.get(
                f"{self.api_url}/session",
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"OpenMRS 세션 조회 실패: {e}")
            return None
    
    def get_identifier_types(self):
        """사용 가능한 식별자 타입 조회"""
        if self._identifier_types is None:
            try:
                response = requests.get(
                    f"{self.api_url}/patientidentifiertype",
                    auth=self.auth,
                    timeout=10
                )
                response.raise_for_status()
                self._identifier_types = response.json().get('results', [])
            except Exception as e:
                logger.error(f"식별자 타입 조회 실패: {e}")
                self._identifier_types = []
        return self._identifier_types
    
    def get_locations(self):
        """사용 가능한 위치 조회"""
        if self._locations is None:
            try:
                response = requests.get(
                    f"{self.api_url}/location",
                    auth=self.auth,
                    timeout=10
                )
                response.raise_for_status()
                self._locations = response.json().get('results', [])
            except Exception as e:
                logger.error(f"위치 조회 실패: {e}")
                self._locations = []
        return self._locations
    
    def get_default_identifier_type(self):
        """기본 식별자 타입 가져오기"""
        identifier_types = self.get_identifier_types()
        if identifier_types:
            return identifier_types[0].get('uuid')
        return None
    
    def get_default_location(self):
        """기본 위치 가져오기"""
        locations = self.get_locations()
        if locations:
            return locations[0].get('uuid')
        return None
    
    def create_patient_with_identifier(self, patient_data, custom_identifier=None):
        """🔥 수정: 사용자 지정 identifier로 환자 생성"""
        try:
            logger.info(f"환자 생성 요청 (사용자 지정 identifier): {patient_data}")
            
            # 🔥 핵심 수정: custom_identifier를 patient_identifier로 사용
            if custom_identifier:
                patient_identifier = custom_identifier.strip()
                logger.info(f"사용자 지정 Patient Identifier 사용: {patient_identifier}")
            else:
                # identifier가 없으면 자동 생성
                patient_identifier = self.generate_unique_identifier()
                logger.info(f"자동 생성된 Patient Identifier: {patient_identifier}")
            
            # 🔥 중복 확인 (선택사항)
            if self.check_identifier_exists(patient_identifier):
                logger.warning(f"Patient Identifier 중복 감지: {patient_identifier}")
                # 중복이어도 OpenMRS가 처리하도록 진행
            
            # 환자 데이터 구성
            openmrs_patient_data = {
                'person': {
                    'names': [{
                        'givenName': patient_data['givenName'],
                        'familyName': patient_data['familyName'],
                        'middleName': patient_data.get('middleName', ''),
                        'preferred': True
                    }],
                    'gender': patient_data['gender'],
                    'birthdate': patient_data['birthdate']
                }
            }
            
            # 주소 정보 추가
            if 'address' in patient_data and any(patient_data['address'].values()):
                openmrs_patient_data['person']['addresses'] = [{
                    'address1': patient_data['address'].get('address1', ''),
                    'address2': patient_data['address'].get('address2', ''),
                    'cityVillage': patient_data['address'].get('cityVillage', ''),
                    'stateProvince': patient_data['address'].get('stateProvince', ''),
                    'country': patient_data['address'].get('country', ''),
                    'postalCode': patient_data['address'].get('postalCode', ''),
                    'preferred': True
                }]
            
            # 🔥 핵심: Patient Identifier 정보 추가
            identifier_type = self.get_default_identifier_type()
            location = self.get_default_location()
            
            if identifier_type and location:
                openmrs_patient_data['identifiers'] = [{
                    'identifier': patient_identifier,  # 🔥 사용자 지정 또는 자동 생성된 식별자
                    'identifierType': identifier_type,
                    'location': location,
                    'preferred': True
                }]
                logger.info(f"Patient Identifier 설정: {patient_identifier}")
            else:
                logger.warning("기본 식별자 타입 또는 위치를 찾을 수 없음 - identifier 없이 생성")
            
            logger.info(f"OpenMRS로 전송할 데이터: {openmrs_patient_data}")
            
            # 환자 생성
            result = self.create_patient(openmrs_patient_data)
            
            if result:
                # 🔥 결과에 patient_identifier 정보 추가
                result['custom_patient_identifier'] = patient_identifier
                logger.info(f"환자 생성 성공 - Patient Identifier: {patient_identifier}")
            
            return result
            
        except Exception as e:
            logger.error(f"사용자 지정 identifier 환자 생성 실패: {e}")
            return None
    
    def create_patient(self, patient_data):
        """기본 환자 생성 메서드"""
        try:
            logger.info(f"환자 생성 요청: {patient_data}")
            
            response = requests.post(
                f"{self.api_url}/patient",
                json=patient_data,
                auth=self.auth,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            logger.info(f"OpenMRS 응답 상태: {response.status_code}")
            logger.info(f"OpenMRS 응답 내용: {response.text}")
            
            response.raise_for_status()
            result = response.json()
            
            # 자동 생성된 식별자 로깅
            if 'identifiers' in result:
                auto_identifiers = [id_info.get('identifier') for id_info in result['identifiers']]
                logger.info(f"생성된 식별자들: {auto_identifiers}")
            
            return result
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP 오류 - 상태코드: {e.response.status_code}")
            logger.error(f"HTTP 오류 - 응답 내용: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"환자 생성 실패: {e}")
            return None
    
    def search_patients_by_identifier(self, identifier):
        """🔥 추가: patient_identifier.identifier로 환자 검색"""
        try:
            logger.info(f"Patient Identifier로 검색: {identifier}")
            
            # OpenMRS에서 identifier로 검색
            response = requests.get(
                f"{self.api_url}/patient",
                params={
                    'identifier': identifier,
                    'v': 'default'
                },
                auth=self.auth,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Patient Identifier 검색 결과: {len(data.get('results', []))}명")
            return data
            
        except Exception as e:
            logger.error(f"Patient Identifier 검색 실패: {e}")
            return None
    
    def search_patients(self, query):
        """환자 검색 - identifier 우선 검색"""
        try:
            # 🔥 1차: identifier로 정확한 검색 시도
            identifier_results = self.search_patients_by_identifier(query)
            if identifier_results and identifier_results.get('results'):
                logger.info(f"Patient Identifier 검색 성공: {len(identifier_results['results'])}명")
                return identifier_results
            
            # 🔥 2차: 일반 검색 (이름 등)
            logger.info(f"일반 검색으로 fallback: {query}")
            response = requests.get(
                f"{self.api_url}/patient",
                params={
                    'q': query,
                    'v': 'default'
                },
                auth=self.auth,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"일반 검색 결과: {len(data.get('results', []))}명")
            return data
            
        except Exception as e:
            logger.error(f"환자 검색 실패 (검색어: '{query}'): {e}")
            return None
    
    def get_patient(self, patient_uuid):
        """환자 UUID로 환자 정보 조회"""
        try:
            response = requests.get(
                f"{self.api_url}/patient/{patient_uuid}?v=full",
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"환자 정보 조회 실패 (UUID: {patient_uuid}): {e}")
            return None
    
    def get_encounters(self, patient_uuid):
        """환자의 모든 진료 내역 조회"""
        try:
            response = requests.get(
                f"{self.api_url}/encounter?patient={patient_uuid}&v=full",
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"진료 내역 조회 실패 (환자 UUID: {patient_uuid}): {e}")
            return None
    
    def test_connection(self):
        """연결 테스트"""
        try:
            session_info = self.get_session()
            return session_info is not None and 'user' in session_info
        except Exception as e:
            logger.error(f"OpenMRS 연결 테스트 실패: {e}")
            return False
        
    def check_identifier_exists(self, identifier):
        """🔥 수정: patient_identifier.identifier 중복 체크"""
        try:
            results = self.search_patients_by_identifier(identifier)
            if results and results.get('results'):
                # 정확히 일치하는 identifier가 있는지 확인
                for patient in results['results']:
                    identifiers = patient.get('identifiers', [])
                    for id_info in identifiers:
                        if id_info.get('identifier') == identifier:
                            logger.info(f"Patient Identifier 중복 발견: {identifier}")
                            return True
                return False
            return False
        except Exception as e:
            logger.error(f"Patient Identifier 중복 체크 실패: {e}")
            return False
    
    def generate_unique_identifier(self, max_attempts=5):
        """고유한 patient identifier 생성 (중복 체크 포함)"""
        import uuid
        from datetime import datetime
        
        for attempt in range(max_attempts):
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            unique_suffix = str(uuid.uuid4())[:8].upper()
            identifier = f"AUTO{timestamp}{unique_suffix}"
            
            # 중복 체크
            if not self.check_identifier_exists(identifier):
                logger.info(f"고유 Patient Identifier 생성 성공: {identifier} (시도 {attempt + 1}회)")
                return identifier
            
            logger.warning(f"Patient Identifier 중복 발견: {identifier}, 재시도...")
        
        # 최대 시도 후에도 실패하면 UUID만 사용
        fallback_id = f"UUID{str(uuid.uuid4()).replace('-', '')[:12].upper()}"
        logger.warning(f"고유 Patient Identifier 생성을 위해 fallback 사용: {fallback_id}")
        return fallback_id
    
    def get_patient_by_identifier(self, identifier):
        """🔥 추가: Patient Identifier로 단일 환자 조회"""
        try:
            results = self.search_patients_by_identifier(identifier)
            if results and results.get('results'):
                # 정확히 일치하는 identifier를 가진 환자 찾기
                for patient in results['results']:
                    identifiers = patient.get('identifiers', [])
                    for id_info in identifiers:
                        if id_info.get('identifier') == identifier:
                            logger.info(f"Patient Identifier로 환자 발견: {identifier} -> {patient.get('display')}")
                            return patient
                
                # 정확히 일치하는게 없으면 첫 번째 결과 반환
                logger.info(f"Patient Identifier 부분 매칭: {identifier}")
                return results['results'][0]
            
            logger.warning(f"Patient Identifier로 환자를 찾을 수 없음: {identifier}")
            return None
            
        except Exception as e:
            logger.error(f"Patient Identifier 환자 조회 실패: {e}")
            return None


