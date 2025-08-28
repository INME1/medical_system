# backend/medical_integration/fhir_api.py

import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
import logging

logger = logging.getLogger('medical_integration')

class FhirAPI:
    """OpenMRS FHIR API 통합 클래스"""
    
    def __init__(self):
        self.base_url = f"http://{settings.EXTERNAL_SERVICES['openmrs']['host']}:{settings.EXTERNAL_SERVICES['openmrs']['port']}/openmrs"
        self.api_url = f"{self.base_url}/ws/fhir2/R4"  # FHIR R4 API 엔드포인트
        self.username = settings.EXTERNAL_SERVICES['openmrs']['username']
        self.password = settings.EXTERNAL_SERVICES['openmrs']['password']
        self.auth = HTTPBasicAuth(self.username, self.password)
    
    def get(self, endpoint):
        """일반 GET 요청"""
        try:
            # endpoint가 /로 시작하면 제거
            if endpoint.startswith('/'):
                endpoint = endpoint[1:]
                
            response = requests.get(
                f"{self.api_url}/{endpoint}",
                auth=self.auth,
                headers={'Accept': 'application/fhir+json'}  # FHIR JSON 형식 요청
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"FHIR GET 요청 실패 (endpoint: {endpoint}): {e}")
            return None
    
    def post(self, endpoint, data):
        """일반 POST 요청"""
        try:
            # endpoint가 /로 시작하면 제거
            if endpoint.startswith('/'):
                endpoint = endpoint[1:]
                
            response = requests.post(
                f"{self.api_url}/{endpoint}",
                json=data,
                auth=self.auth,
                headers={
                    'Content-Type': 'application/fhir+json',
                    'Accept': 'application/fhir+json'
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"FHIR POST 요청 실패 (endpoint: {endpoint}): {e}")
            return None
    
    def search_patients(self, query):
        """환자 검색 (FHIR)"""
        # FHIR Patient 리소스에서 이름 또는 식별자로 검색
        return self.get(f"Patient?name={query}&identifier={query}&_summary=true")
    
    def get_patient(self, uuid):
        """환자 UUID로 환자 정보 조회 (FHIR)"""
        # FHIR Patient 리소스 조회
        return self.get(f"Patient/{uuid}")
    
    def create_patient(self, patient_data):
        """새 환자 생성 (FHIR)"""
        # FHIR Patient 리소스 생성
        return self.post("Patient", patient_data)
    
    def get_patient_encounters(self, uuid):
        """환자의 모든 진료 내역 조회 (FHIR)"""
        # FHIR Encounter 리소스에서 환자별 조회
        return self.get(f"Encounter?patient={uuid}")
    
    def get_encounter(self, uuid):
        """진료 기록 UUID로 상세 정보 조회 (FHIR)"""
        # FHIR Encounter 리소스 조회
        return self.get(f"Encounter/{uuid}")
    
    def create_encounter(self, encounter_data):
        """새 진료 기록 생성 (FHIR)"""
        # FHIR Encounter 리소스 생성
        return self.post("Encounter", encounter_data)
    
    def get_patient_observations(self, patient_uuid):
        """환자의 모든 관찰 조회 (FHIR)"""
        # FHIR Observation 리소스에서 환자별 조회
        return self.get(f"Observation?patient={patient_uuid}")
    
    def get_patient_conditions(self, patient_uuid):
        """환자의 모든 상태/질환 조회 (FHIR)"""
        # FHIR Condition 리소스에서 환자별 조회
        return self.get(f"Condition?patient={patient_uuid}")