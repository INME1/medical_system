# backend/viewer_v2/dicomweb_views.py

import requests
import json
import logging
from typing import Dict, List, Optional, Any
from requests.auth import HTTPBasicAuth
from datetime import datetime

logger = logging.getLogger('viewer_v2.dicomweb')

class DicomWebAPI:
    """DICOMweb (QIDO-RS/WADO-RS) API 클라이언트"""
    
    def __init__(self):
        # Orthanc 설정
        self.orthanc_host = "35.225.63.41"
        self.orthanc_port = "8042"
        self.orthanc_user = "orthanc"
        self.orthanc_password = "orthanc"
        self.base_url = f"http://{self.orthanc_host}:{self.orthanc_port}"
        self.dicomweb_url = f"{self.base_url}/dicom-web"
        
        # 인증
        self.auth = HTTPBasicAuth(self.orthanc_user, self.orthanc_password)
        
        # 기본 헤더
        self.headers = {
            'Accept': 'application/dicom+json',
            'User-Agent': 'Django-Viewer-V2-DicomWeb/1.0'
        }
        
        logger.info(f"DICOMweb API 초기화: {self.dicomweb_url}")
    
    def _make_request(self, method: str, endpoint: str, params: Dict = None, **kwargs) -> Optional[Any]:
        """HTTP 요청 수행"""
        try:
            url = f"{self.dicomweb_url}/{endpoint.lstrip('/')}"
            
            response = requests.request(
                method=method,
                url=url,
                params=params,
                headers=self.headers,
                auth=self.auth,
                timeout=30,
                **kwargs
            )
            
            logger.info(f"📡 {method} {url} - Status: {response.status_code}")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                
                if 'json' in content_type:
                    return response.json()
                else:
                    return response.content
            elif response.status_code == 204:
                return []  # No Content
            else:
                logger.warning(f"⚠️ HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"❌ HTTP 요청 실패: {e}")
            return None
    
    def _make_orthanc_request(self, endpoint: str, params: Dict = None) -> Optional[Any]:
        """Orthanc 원본 API 요청"""
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            
            response = requests.get(
                url=url,
                params=params,
                auth=self.auth,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠️ Orthanc API {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Orthanc API 요청 실패: {e}")
            return None
    
    def _convert_orthanc_to_dicomweb(self, orthanc_data: Dict, level: str) -> Dict:
        """Orthanc 데이터를 DICOMweb 형식으로 변환"""
        try:
            if level == 'study':
                main_tags = orthanc_data.get('MainDicomTags', {})
                patient_tags = orthanc_data.get('PatientMainDicomTags', {})
                
                return {
                    "00080020": {"Value": [main_tags.get('StudyDate', '')]},
                    "00080030": {"Value": [main_tags.get('StudyTime', '')]},
                    "00080050": {"Value": [main_tags.get('AccessionNumber', '')]},
                    "00080061": {"Value": [main_tags.get('ModalitiesInStudy', '')]},
                    "00080090": {"Value": [main_tags.get('ReferringPhysicianName', '')]},
                    "00081030": {"Value": [main_tags.get('StudyDescription', '')]},
                    "00100010": {"Value": [patient_tags.get('PatientName', '')]},
                    "00100020": {"Value": [patient_tags.get('PatientID', '')]},
                    "00100030": {"Value": [patient_tags.get('PatientBirthDate', '')]},
                    "00100040": {"Value": [patient_tags.get('PatientSex', '')]},
                    "0020000D": {"Value": [main_tags.get('StudyInstanceUID', '')]},
                    "00200010": {"Value": [main_tags.get('StudyID', '')]},
                    "00201206": {"Value": [len(orthanc_data.get('Series', []))]},
                    "00201208": {"Value": [sum(len(s.get('Instances', [])) for s in orthanc_data.get('Series', []) if isinstance(s, dict))]}
                }
            
            elif level == 'series':
                main_tags = orthanc_data.get('MainDicomTags', {})
                
                return {
                    "0008103E": {"Value": [main_tags.get('SeriesDescription', '')]},
                    "00080060": {"Value": [main_tags.get('Modality', '')]},
                    "00200011": {"Value": [main_tags.get('SeriesNumber', '')]},
                    "0020000E": {"Value": [main_tags.get('SeriesInstanceUID', '')]},
                    "00201209": {"Value": [len(orthanc_data.get('Instances', []))]},
                    "00080021": {"Value": [main_tags.get('SeriesDate', '')]},
                    "00080031": {"Value": [main_tags.get('SeriesTime', '')]},
                    "00200060": {"Value": [main_tags.get('Laterality', '')]},
                    "00180015": {"Value": [main_tags.get('BodyPartExamined', '')]},
                    "00181030": {"Value": [main_tags.get('ProtocolName', '')]},
                }
            
            elif level == 'instance':
                main_tags = orthanc_data.get('MainDicomTags', {})
                
                return {
                    "00080018": {"Value": [main_tags.get('SOPInstanceUID', '')]},
                    "00080016": {"Value": [main_tags.get('SOPClassUID', '')]},
                    "00200013": {"Value": [main_tags.get('InstanceNumber', '')]},
                    "00280008": {"Value": [main_tags.get('NumberOfFrames', '1')]},
                    "00280010": {"Value": [main_tags.get('Rows', '')]},
                    "00280011": {"Value": [main_tags.get('Columns', '')]},
                    "00280100": {"Value": [main_tags.get('BitsAllocated', '')]},
                    "00280101": {"Value": [main_tags.get('BitsStored', '')]},
                    "00280102": {"Value": [main_tags.get('HighBit', '')]},
                    "00280103": {"Value": [main_tags.get('PixelRepresentation', '')]},
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"❌ 데이터 변환 실패: {e}")
            return {}
    
    # =================================================================
    # QIDO-RS API (검색 및 조회)
    # =================================================================
    
    def search_studies(self, params: Dict = None) -> Optional[List]:
        """Studies 검색 (QIDO-RS)"""
        try:
            logger.info(f"🔍 Studies 검색: {params}")
            
            # DICOMweb 직접 호출 시도
            studies = self._make_request('GET', 'studies', params)
            
            if studies is not None:
                logger.info(f"✅ DICOMweb으로 {len(studies)}개 Studies 조회")
                return studies
            
            # Fallback: Orthanc API 사용
            logger.info("🔄 Fallback: Orthanc API 사용")
            
            if params and 'PatientID' in params:
                return self._search_studies_by_patient_id(params['PatientID'])
            else:
                return self._get_all_studies_orthanc()
                
        except Exception as e:
            logger.error(f"❌ Studies 검색 실패: {e}")
            return None
    
    def _search_studies_by_patient_id(self, patient_id: str) -> Optional[List]:
        """환자 ID로 Studies 검색 (Orthanc API 사용)"""
        try:
            # Orthanc find API 사용
            find_result = requests.post(
                f"{self.base_url}/tools/find",
                json={
                    "Level": "Study",
                    "Query": {"PatientID": patient_id}
                },
                auth=self.auth,
                timeout=30
            )
            
            if find_result.status_code != 200:
                logger.warning(f"⚠️ Patient ID {patient_id} 검색 실패")
                return []
            
            study_ids = find_result.json()
            studies = []
            
            for study_id in study_ids:
                study_data = self._make_orthanc_request(f"studies/{study_id}")
                if study_data:
                    dicomweb_study = self._convert_orthanc_to_dicomweb(study_data, 'study')
                    studies.append(dicomweb_study)
            
            logger.info(f"✅ 환자 {patient_id}: {len(studies)}개 Studies 발견")
            return studies
            
        except Exception as e:
            logger.error(f"❌ 환자 ID {patient_id} 검색 실패: {e}")
            return []
    
    def _get_all_studies_orthanc(self) -> Optional[List]:
        """모든 Studies 조회 (Orthanc API 사용)"""
        try:
            study_ids = self._make_orthanc_request("studies")
            if not study_ids:
                return []
            
            studies = []
            # 최대 50개로 제한
            for study_id in study_ids[:50]:
                study_data = self._make_orthanc_request(f"studies/{study_id}")
                if study_data:
                    dicomweb_study = self._convert_orthanc_to_dicomweb(study_data, 'study')
                    studies.append(dicomweb_study)
            
            logger.info(f"✅ 전체 Studies: {len(studies)}개 조회")
            return studies
            
        except Exception as e:
            logger.error(f"❌ 전체 Studies 조회 실패: {e}")
            return []
    
    def get_study(self, study_uid: str) -> Optional[Dict]:
        """특정 Study 조회"""
        try:
            # DICOMweb 직접 호출
            study = self._make_request('GET', f'studies/{study_uid}')
            
            if study is not None:
                return study
            
            # Fallback: Orthanc API 사용
            study_data = self._get_study_by_uid_orthanc(study_uid)
            if study_data:
                return self._convert_orthanc_to_dicomweb(study_data, 'study')
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Study {study_uid} 조회 실패: {e}")
            return None
    
    def _get_study_by_uid_orthanc(self, study_uid: str) -> Optional[Dict]:
        """Study UID로 Orthanc에서 Study 조회"""
        try:
            find_result = requests.post(
                f"{self.base_url}/tools/find",
                json={
                    "Level": "Study",
                    "Query": {"StudyInstanceUID": study_uid}
                },
                auth=self.auth,
                timeout=30
            )
            
            if find_result.status_code == 200:
                study_ids = find_result.json()
                if study_ids:
                    return self._make_orthanc_request(f"studies/{study_ids[0]}")
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Study UID {study_uid} 검색 실패: {e}")
            return None
    
    def get_study_metadata(self, study_uid: str) -> Optional[List]:
        """Study 메타데이터 조회"""
        try:
            metadata = self._make_request('GET', f'studies/{study_uid}/metadata')
            return metadata
        except Exception as e:
            logger.error(f"❌ Study {study_uid} 메타데이터 조회 실패: {e}")
            return None
    
    def get_study_series(self, study_uid: str) -> Optional[List]:
        """Study의 Series 목록 조회"""
        try:
            # DICOMweb 직접 호출
            series = self._make_request('GET', f'studies/{study_uid}/series')
            
            if series is not None:
                return series
            
            # Fallback: Orthanc API 사용
            study_data = self._get_study_by_uid_orthanc(study_uid)
            if study_data and 'Series' in study_data:
                series_list = []
                for series_id in study_data['Series']:
                    series_data = self._make_orthanc_request(f"series/{series_id}")
                    if series_data:
                        dicomweb_series = self._convert_orthanc_to_dicomweb(series_data, 'series')
                        series_list.append(dicomweb_series)
                return series_list
            
            return []
            
        except Exception as e:
            logger.error(f"❌ Study {study_uid} Series 조회 실패: {e}")
            return None
    
    def get_series(self, study_uid: str, series_uid: str) -> Optional[Dict]:
        """특정 Series 조회"""
        try:
            series = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}')
            return series
        except Exception as e:
            logger.error(f"❌ Series {series_uid} 조회 실패: {e}")
            return None
    
    def get_series_metadata(self, study_uid: str, series_uid: str) -> Optional[List]:
        """Series 메타데이터 조회"""
        try:
            metadata = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}/metadata')
            return metadata
        except Exception as e:
            logger.error(f"❌ Series {series_uid} 메타데이터 조회 실패: {e}")
            return None
    
    def get_series_instances(self, study_uid: str, series_uid: str) -> Optional[List]:
        """Series의 Instance 목록 조회"""
        try:
            # DICOMweb 직접 호출
            instances = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}/instances')
            
            if instances is not None:
                return instances
            
            # Fallback: Orthanc API 사용
            series_data = self._get_series_by_uid_orthanc(series_uid)
            if series_data and 'Instances' in series_data:
                instances_list = []
                for instance_id in series_data['Instances']:
                    instance_data = self._make_orthanc_request(f"instances/{instance_id}")
                    if instance_data:
                        dicomweb_instance = self._convert_orthanc_to_dicomweb(instance_data, 'instance')
                        instances_list.append(dicomweb_instance)
                return instances_list
            
            return []
            
        except Exception as e:
            logger.error(f"❌ Series {series_uid} Instances 조회 실패: {e}")
            return None
    
    def _get_series_by_uid_orthanc(self, series_uid: str) -> Optional[Dict]:
        """Series UID로 Orthanc에서 Series 조회"""
        try:
            find_result = requests.post(
                f"{self.base_url}/tools/find",
                json={
                    "Level": "Series",
                    "Query": {"SeriesInstanceUID": series_uid}
                },
                auth=self.auth,
                timeout=30
            )
            
            if find_result.status_code == 200:
                series_ids = find_result.json()
                if series_ids:
                    return self._make_orthanc_request(f"series/{series_ids[0]}")
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Series UID {series_uid} 검색 실패: {e}")
            return None
    
    def get_instance(self, study_uid: str, series_uid: str, instance_uid: str) -> Optional[Dict]:
        """특정 Instance 조회"""
        try:
            instance = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}/instances/{instance_uid}')
            return instance
        except Exception as e:
            logger.error(f"❌ Instance {instance_uid} 조회 실패: {e}")
            return None
    
    def get_instance_metadata(self, study_uid: str, series_uid: str, instance_uid: str) -> Optional[List]:
        """Instance 메타데이터 조회"""
        try:
            metadata = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}/instances/{instance_uid}/metadata')
            return metadata
        except Exception as e:
            logger.error(f"❌ Instance {instance_uid} 메타데이터 조회 실패: {e}")
            return None
    
    # =================================================================
    # WADO-RS API (이미지 및 파일)
    # =================================================================
    
    def get_rendered_frame(self, study_uid: str, series_uid: str, instance_uid: str, frame: int) -> Optional[bytes]:
        """렌더링된 프레임 이미지 조회"""
        try:
            # DICOMweb WADO-RS 시도
            image_data = self._make_request('GET', 
                f'studies/{study_uid}/series/{series_uid}/instances/{instance_uid}/frames/{frame}/rendered')
            
            if image_data is not None:
                return image_data
            
            # Fallback: Orthanc preview API
            instance_id = self._get_instance_id_by_uid(instance_uid)
            if instance_id:
                preview_data = requests.get(
                    f"{self.base_url}/instances/{instance_id}/preview",
                    auth=self.auth,
                    timeout=30
                )
                if preview_data.status_code == 200:
                    return preview_data.content
            
            return None
            
        except Exception as e:
            logger.error(f"❌ 프레임 {frame} 렌더링 실패: {e}")
            return None
    
    def get_instance_file(self, study_uid: str, series_uid: str, instance_uid: str) -> Optional[bytes]:
        """DICOM 파일 다운로드"""
        try:
            # DICOMweb WADO-RS 시도
            file_data = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}/instances/{instance_uid}')
            
            if file_data is not None:
                return file_data
            
            # Fallback: Orthanc file API
            instance_id = self._get_instance_id_by_uid(instance_uid)
            if instance_id:
                file_response = requests.get(
                    f"{self.base_url}/instances/{instance_id}/file",
                    auth=self.auth,
                    timeout=30
                )
                if file_response.status_code == 200:
                    return file_response.content
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Instance {instance_uid} 파일 다운로드 실패: {e}")
            return None
    
    def _get_instance_id_by_uid(self, instance_uid: str) -> Optional[str]:
        """Instance UID로 Orthanc Instance ID 조회"""
        try:
            find_result = requests.post(
                f"{self.base_url}/tools/find",
                json={
                    "Level": "Instance",
                    "Query": {"SOPInstanceUID": instance_uid}
                },
                auth=self.auth,
                timeout=30
            )
            
            if find_result.status_code == 200:
                instance_ids = find_result.json()
                if instance_ids:
                    return instance_ids[0]
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Instance UID {instance_uid} 검색 실패: {e}")
            return None
    
    # =================================================================
    # 환자 중심 API
    # =================================================================
    
    def get_all_patients(self) -> Optional[List]:
        """모든 환자 목록 조회"""
        try:
            patients_ids = self._make_orthanc_request("patients")
            if not patients_ids:
                return []
            
            patients = []
            for patient_id in patients_ids[:50]:  # 최대 50명
                patient_data = self._make_orthanc_request(f"patients/{patient_id}")
                if patient_data:
                    patients.append({
                        'uuid': patient_id,
                        'patient_id': patient_data.get('MainDicomTags', {}).get('PatientID', ''),
                        'patient_name': patient_data.get('MainDicomTags', {}).get('PatientName', ''),
                        'patient_birth_date': patient_data.get('MainDicomTags', {}).get('PatientBirthDate', ''),
                        'patient_sex': patient_data.get('MainDicomTags', {}).get('PatientSex', ''),
                        'studies_count': len(patient_data.get('Studies', []))
                    })
            
            return patients
            
        except Exception as e:
            logger.error(f"❌ 환자 목록 조회 실패: {e}")
            return None
    
    def get_patient_by_id(self, patient_id: str) -> Optional[Dict]:
        """환자 ID로 환자 정보 조회"""
        try:
            patients_ids = self._make_orthanc_request("patients")
            if not patients_ids:
                return None
            
            for patient_uuid in patients_ids:
                patient_data = self._make_orthanc_request(f"patients/{patient_uuid}")
                if patient_data:
                    main_tags = patient_data.get('MainDicomTags', {})
                    if main_tags.get('PatientID') == patient_id:
                        return {
                            'uuid': patient_uuid,
                            'patient_id': patient_id,
                            'patient_name': main_tags.get('PatientName', ''),
                            'patient_birth_date': main_tags.get('PatientBirthDate', ''),
                            'patient_sex': main_tags.get('PatientSex', ''),
                            'studies': patient_data.get('Studies', []),
                            'studies_count': len(patient_data.get('Studies', []))
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"❌ 환자 {patient_id} 조회 실패: {e}")
            return None
    
    def get_patient_studies(self, patient_id: str) -> Optional[List]:
        """환자의 Studies 목록 조회"""
        try:
            return self._search_studies_by_patient_id(patient_id)
        except Exception as e:
            logger.error(f"❌ 환자 {patient_id} Studies 조회 실패: {e}")
            return None
    
    def get_patient_study_detail(self, patient_id: str, study_uid: str) -> Optional[Dict]:
        """환자의 특정 Study 상세 정보"""
        try:
            # 환자 검증
            patient = self.get_patient_by_id(patient_id)
            if not patient:
                return None
            
            # Study 조회
            study = self.get_study(study_uid)
            if study:
                # 환자 정보와 Study 정보 결합
                study['patient_info'] = patient
                return study
            
            return None
            
        except Exception as e:
            logger.error(f"❌ 환자 {patient_id} Study {study_uid} 조회 실패: {e}")
            return None
    
    # =================================================================
    # 편의 기능
    # =================================================================
    
    def search_patients(self, params: Dict) -> Optional[List]:
        """환자 검색"""
        try:
            all_patients = self.get_all_patients()
            if not all_patients:
                return []
            
            # 간단한 필터링
            filtered_patients = []
            for patient in all_patients:
                if 'PatientName' in params:
                    if params['PatientName'].lower() not in patient.get('patient_name', '').lower():
                        continue
                if 'PatientID' in params:
                    if params['PatientID'] not in patient.get('patient_id', ''):
                        continue
                
                filtered_patients.append(patient)
            
            return filtered_patients
            
        except Exception as e:
            logger.error(f"❌ 환자 검색 실패: {e}")
            return None
    
    def get_instance_preview(self, instance_uid: str) -> Optional[bytes]:
        """Instance 미리보기 이미지"""
        try:
            instance_id = self._get_instance_id_by_uid(instance_uid)
            if instance_id:
                preview_response = requests.get(
                    f"{self.base_url}/instances/{instance_id}/preview",
                    auth=self.auth,
                    timeout=30
                )
                if preview_response.status_code == 200:
                    return preview_response.content
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Instance {instance_uid} 미리보기 실패: {e}")
            return None
    
    def get_study_thumbnail(self, study_uid: str) -> Optional[bytes]:
        """Study 썸네일 (첫 번째 Instance 미리보기)"""
        try:
            # Study의 첫 번째 Series 조회
            series_list = self.get_study_series(study_uid)
            if not series_list:
                return None
            
            first_series_uid = series_list[0].get('0020000E', {}).get('Value', [''])[0]
            if not first_series_uid:
                return None
            
            # Series의 첫 번째 Instance 조회
            instances_list = self.get_series_instances(study_uid, first_series_uid)
            if not instances_list:
                return None
            
            first_instance_uid = instances_list[0].get('00080018', {}).get('Value', [''])[0]
            if not first_instance_uid:
                return None
            
            # Instance 미리보기 반환
            return self.get_instance_preview(first_instance_uid)
            
        except Exception as e:
            logger.error(f"❌ Study {study_uid} 썸네일 실패: {e}")
            return None
    
    def get_statistics(self) -> Optional[Dict]:
        """Orthanc 통계 정보"""
        try:
            return self._make_orthanc_request("statistics")
        except Exception as e:
            logger.error(f"❌ 통계 조회 실패: {e}")
            return None
    
    def get_system_info(self) -> Optional[Dict]:
        """시스템 정보"""
        try:
            return self._make_orthanc_request("system")
        except Exception as e:
            logger.error(f"❌ 시스템 정보 조회 실패: {e}")
            return None
    
    # =================================================================
    # 테스트 및 디버깅
    # =================================================================
    
    def test_connection(self) -> Dict:
        """연결 테스트"""
        results = {
            'orthanc_connection': False,
            'dicomweb_connection': False,
            'system_info': None,
            'error_messages': []
        }
        
        try:
            # Orthanc 연결 테스트
            system_info = self._make_orthanc_request("system")
            if system_info:
                results['orthanc_connection'] = True
                results['system_info'] = system_info
            else:
                results['error_messages'].append("Orthanc connection failed")
            
            # DICOMweb 연결 테스트
            studies = self._make_request('GET', 'studies')
            if studies is not None:
                results['dicomweb_connection'] = True
            else:
                results['error_messages'].append("DICOMweb connection failed")
                
        except Exception as e:
            results['error_messages'].append(str(e))
        
        return results
    
    def test_dicomweb(self) -> Dict:
        """DICOMweb 기능 테스트"""
        results = {
            'qido_studies': False,
            'qido_series': False,
            'qido_instances': False,
            'wado_rendered': False,
            'error_messages': []
        }
        
        try:
            # QIDO-RS Studies 테스트
            studies = self._make_request('GET', 'studies')
            if studies is not None:
                results['qido_studies'] = True
                
                if len(studies) > 0:
                    study_uid = studies[0].get('0020000D', {}).get('Value', [''])[0]
                    if study_uid:
                        # QIDO-RS Series 테스트
                        series = self._make_request('GET', f'studies/{study_uid}/series')
                        if series is not None:
                            results['qido_series'] = True
                            
                            if len(series) > 0:
                                series_uid = series[0].get('0020000E', {}).get('Value', [''])[0]
                                if series_uid:
                                    # QIDO-RS Instances 테스트
                                    instances = self._make_request('GET', f'studies/{study_uid}/series/{series_uid}/instances')
                                    if instances is not None:
                                        results['qido_instances'] = True
                                        
                                        if len(instances) > 0:
                                            instance_uid = instances[0].get('00080018', {}).get('Value', [''])[0]
                                            if instance_uid:
                                                # WADO-RS 렌더링 테스트
                                                rendered = self._make_request('GET', 
                                                    f'studies/{study_uid}/series/{series_uid}/instances/{instance_uid}/frames/1/rendered')
                                                if rendered is not None:
                                                    results['wado_rendered'] = True
            
        except Exception as e:
            results['error_messages'].append(str(e))
        
        return results
    
    def debug_patient_data(self, patient_id: str) -> Dict:
        """환자 데이터 디버깅"""
        debug_data = {
            'patient_id': patient_id,
            'patient_found': False,
            'patient_data': None,
            'studies_count': 0,
            'studies_data': [],
            'error_messages': []
        }
        
        try:
            # 환자 조회
            patient = self.get_patient_by_id(patient_id)
            if patient:
                debug_data['patient_found'] = True
                debug_data['patient_data'] = patient
                debug_data['studies_count'] = patient.get('studies_count', 0)
                
                # Studies 조회
                studies = self.get_patient_studies(patient_id)
                if studies:
                    debug_data['studies_data'] = studies[:5]  # 최대 5개만
            else:
                debug_data['error_messages'].append(f"Patient {patient_id} not found")
                
        except Exception as e:
            debug_data['error_messages'].append(str(e))
        
        return debug_data
    
    def debug_study_data(self, study_uid: str) -> Dict:
        """Study 데이터 디버깅"""
        debug_data = {
            'study_uid': study_uid,
            'study_found': False,
            'study_data': None,
            'series_count': 0,
            'series_data': [],
            'error_messages': []
        }
        
        try:
            # Study 조회
            study = self.get_study(study_uid)
            if study:
                debug_data['study_found'] = True
                debug_data['study_data'] = study
                
                # Series 조회
                series = self.get_study_series(study_uid)
                if series:
                    debug_data['series_count'] = len(series)
                    debug_data['series_data'] = series[:3]  # 최대 3개만
            else:
                debug_data['error_messages'].append(f"Study {study_uid} not found")
                
        except Exception as e:
            debug_data['error_messages'].append(str(e))
        
        return debug_data