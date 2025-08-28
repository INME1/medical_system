# backend/medical_integration/orthanc_api.py
# OrthancAPI 클래스에 누락된 메서드들 추가

import requests
import json
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
import os

logger = logging.getLogger('medical_integration')

class OrthancAPI:
    """Orthanc PACS 서버 API 클라이언트 (SimCLR 호환 버전)"""
    
    def __init__(self):
        """Orthanc API 초기화"""
        # 환경변수에서 설정 로드
        self.base_url = os.getenv('ORTHANC_URL', 'http://localhost:8042')
        self.username = os.getenv('ORTHANC_USERNAME', 'orthanc')
        self.password = os.getenv('ORTHANC_PASSWORD', 'orthanc')
        self.timeout = int(os.getenv('ORTHANC_TIMEOUT', '60'))
        
        # URL 정리 (마지막 슬래시 제거)
        self.base_url = self.base_url.rstrip('/')
        
        # 인증 설정
        self.auth = (self.username, self.password)
        
        # 기본 헤더
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        logger.info(f"OrthancAPI 초기화: {self.base_url}")
        
        # 연결 테스트
        self._test_connection()
    
    def _test_connection(self):
        """Orthanc 서버 연결 테스트"""
        try:
            response = self.get('system')
            if response:
                logger.info(f"✅ Orthanc 연결 성공: {response.get('Name', 'Unknown')}")
                return True
            else:
                logger.warning("⚠️ Orthanc 연결 실패")
                return False
        except Exception as e:
            logger.error(f"❌ Orthanc 연결 오류: {e}")
            return False
    
    def get(self, endpoint: str) -> Optional[Dict]:
        """GET 요청"""
        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.get(
                url, 
                auth=self.auth, 
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"GET {endpoint} 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"GET {endpoint} 오류: {e}")
            return None
    
    def post(self, endpoint: str, data: Dict) -> Optional[Any]:
        """POST 요청"""
        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.post(
                url,
                auth=self.auth,
                headers=self.headers,
                json=data,
                timeout=self.timeout
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                logger.warning(f"POST {endpoint} 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"POST {endpoint} 오류: {e}")
            return None
    
    def get_binary(self, endpoint: str) -> Optional[bytes]:
        """바이너리 데이터 GET 요청 (DICOM 파일용)"""
        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.get(
                url,
                auth=self.auth,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.content
            else:
                logger.warning(f"GET Binary {endpoint} 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"GET Binary {endpoint} 오류: {e}")
            return None
    
    # 🔥 SimCLR에서 필요한 메서드들 추가
    
    def get_study_by_uid(self, study_uid: str) -> Optional[Dict]:
        """Study Instance UID로 Study 정보 조회"""
        try:
            logger.info(f"📋 Study UID로 검색: {study_uid}")
            
            # Orthanc의 find API 사용
            find_result = self.post("tools/find", {
                "Level": "Study",
                "Query": {
                    "StudyInstanceUID": study_uid
                }
            })
            
            if not find_result or len(find_result) == 0:
                logger.warning(f"Study UID {study_uid}를 찾을 수 없음")
                return None
            
            study_id = find_result[0]
            logger.info(f"✅ Study ID 발견: {study_id}")
            
            # Study 상세 정보 조회
            study_info = self.get(f"studies/{study_id}")
            if study_info:
                study_info['ID'] = study_id  # ID 추가
                logger.info(f"📊 Study 정보 로드: {study_info.get('MainDicomTags', {}).get('StudyDescription', 'No Description')}")
            
            return study_info
            
        except Exception as e:
            logger.error(f"Study UID 검색 오류: {e}")
            return None
    
    def get_instance_id_by_uid(self, instance_uid: str) -> Optional[str]:
        """Instance UID로 Instance ID 조회"""
        try:
            find_result = self.post("tools/find", {
                "Level": "Instance",
                "Query": {
                    "SOPInstanceUID": instance_uid
                }
            })
            
            if find_result and len(find_result) > 0:
                return find_result[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Instance UID 검색 오류: {e}")
            return None
    
    def get_study_with_series_and_instances(self, study_id: str) -> Optional[Dict]:
        """Study ID로 Series와 Instance 포함한 상세 정보 조회"""
        try:
            study_info = self.get(f"studies/{study_id}")
            if not study_info:
                return None
            
            # Series 정보 추가
            series_list = []
            for series_id in study_info.get('Series', []):
                series_info = self.get(f"series/{series_id}")
                if series_info:
                    # Instance 정보 추가
                    instances_list = []
                    for instance_id in series_info.get('Instances', []):
                        instance_info = self.get(f"instances/{instance_id}")
                        if instance_info:
                            instance_info['ID'] = instance_id
                            instances_list.append(instance_info)
                    
                    series_info['ID'] = series_id
                    series_info['Instances'] = instances_list
                    series_list.append(series_info)
            
            study_info['Series'] = series_list
            return study_info
            
        except Exception as e:
            logger.error(f"Study 상세 정보 조회 오류: {e}")
            return None
    
    def get_instance_dicom(self, instance_id: str) -> Optional[bytes]:
        """Instance ID로 DICOM 파일 데이터 조회"""
        try:
            logger.info(f"📥 DICOM 파일 다운로드: {instance_id}")
            return self.get_binary(f"instances/{instance_id}/file")
        except Exception as e:
            logger.error(f"DICOM 파일 다운로드 오류: {e}")
            return None
    
    def get_instance_file(self, instance_id: str) -> Optional[bytes]:
        """Instance 파일 데이터 조회 (get_instance_dicom과 동일)"""
        return self.get_instance_dicom(instance_id)
    
    def get_system_info(self) -> Optional[Dict]:
        """Orthanc 시스템 정보 조회"""
        return self.get('system')
    
    def get_instance_preview(self, instance_id: str) -> Optional[bytes]:
        """Instance 미리보기 이미지 조회"""
        try:
            return self.get_binary(f"instances/{instance_id}/preview")
        except Exception as e:
            logger.error(f"Instance 미리보기 오류: {e}")
            return None
    
    # 🔥 기존 프로젝트와의 호환성을 위한 메서드들
    
    def get_studies(self) -> List[str]:
        """모든 Study ID 목록 조회"""
        try:
            studies = self.get('studies')
            return studies if studies else []
        except Exception as e:
            logger.error(f"Studies 목록 조회 오류: {e}")
            return []
    
    def get_study(self, study_id: str) -> Optional[Dict]:
        """Study ID로 Study 정보 조회"""
        return self.get(f"studies/{study_id}")
    
    def get_series(self, series_id: str) -> Optional[Dict]:
        """Series ID로 Series 정보 조회"""
        return self.get(f"series/{series_id}")
    
    def get_instance(self, instance_id: str) -> Optional[Dict]:
        """Instance ID로 Instance 정보 조회"""
        return self.get(f"instances/{instance_id}")
    
    def get_patients(self) -> List[str]:
        """모든 Patient ID 목록 조회"""
        try:
            patients = self.get('patients')
            return patients if patients else []
        except Exception as e:
            logger.error(f"Patients 목록 조회 오류: {e}")
            return []
    
    def get_patient(self, patient_id: str) -> Optional[Dict]:
        """Patient ID로 Patient 정보 조회"""
        return self.get(f"patients/{patient_id}")
    
    def find_studies_by_patient_id(self, patient_id: str) -> List[Dict]:
        """Patient ID로 Study 검색"""
        try:
            find_result = self.post("tools/find", {
                "Level": "Study",
                "Query": {
                    "PatientID": patient_id
                }
            })
            
            studies = []
            if find_result:
                for study_id in find_result:
                    study_info = self.get_study(study_id)
                    if study_info:
                        study_info['ID'] = study_id
                        studies.append(study_info)
            
            return studies
            
        except Exception as e:
            logger.error(f"Patient ID로 Study 검색 오류: {e}")
            return []
    
    def get_study_statistics(self) -> Optional[Dict]:
        """Orthanc 통계 정보 조회"""
        return self.get('statistics')
    
    # 🔥 DICOM Web 관련 메서드 (OHIF 호환성)
    
    def get_dicom_web_studies(self) -> Optional[List]:
        """DICOMweb 형식으로 Studies 조회"""
        try:
            return self.get('dicom-web/studies')
        except Exception as e:
            logger.error(f"DICOMweb Studies 조회 오류: {e}")
            return None
    
    def get_dicom_web_study(self, study_uid: str) -> Optional[Dict]:
        """DICOMweb 형식으로 특정 Study 조회"""
        try:
            return self.get(f'dicom-web/studies/{study_uid}')
        except Exception as e:
            logger.error(f"DICOMweb Study 조회 오류: {e}")
            return None

# 전역 인스턴스
orthanc_api = OrthancAPI()