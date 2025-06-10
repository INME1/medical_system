# backend/medical_integration/orthanc_api.py (업데이트)

import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
import logging
import tempfile
import os

logger = logging.getLogger('medical_integration')

class OrthancAPI:
    """Orthanc API 통합 클래스 (DICOM 업로드 기능 추가)"""
    
    def __init__(self):
        self.base_url = f"http://{settings.EXTERNAL_SERVICES['orthanc']['host']}:{settings.EXTERNAL_SERVICES['orthanc']['port']}"
        self.username = settings.EXTERNAL_SERVICES['orthanc']['username']
        self.password = settings.EXTERNAL_SERVICES['orthanc']['password']
        self.auth = HTTPBasicAuth(self.username, self.password)
    
    def get(self, endpoint):
        """일반 GET 요청"""
        try:
            if endpoint.startswith('/'):
                endpoint = endpoint[1:]
                
            response = requests.get(
                f"{self.base_url}/{endpoint}",
                auth=self.auth,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Orthanc GET 요청 실패 (endpoint: {endpoint}): {e}")
            return None
        except Exception as e:
            logger.error(f"Orthanc GET 요청 처리 중 오류 (endpoint: {endpoint}): {e}")
            return None
    
    def post(self, endpoint, data=None, files=None, content_type=None):
        """일반 POST 요청 (DICOM 업로드 지원)"""
        try:
            if endpoint.startswith('/'):
                endpoint = endpoint[1:]
            
            headers = {}
            if content_type:
                headers['Content-Type'] = content_type
            
            response = requests.post(
                f"{self.base_url}/{endpoint}",
                data=data,
                files=files,
                json=data if not files and not content_type else None,
                auth=self.auth,
                headers=headers,
                timeout=60  # DICOM 업로드는 시간이 오래 걸릴 수 있음
            )
            response.raise_for_status()
            
            # 응답이 JSON인 경우만 파싱
            content_type = response.headers.get('Content-Type', '')
            if 'application/json' in content_type:
                return response.json()
            else:
                return response.content
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Orthanc POST 요청 실패 (endpoint: {endpoint}): {e}")
            return None
        except Exception as e:
            logger.error(f"Orthanc POST 요청 처리 중 오류 (endpoint: {endpoint}): {e}")
            return None
    
    def upload_dicom(self, dicom_data):
        """DICOM 파일을 Orthanc에 업로드"""
        try:
            logger.info("Orthanc에 DICOM 업로드 시작")
            
            # DICOM 데이터가 바이트가 아닌 경우 변환
            if not isinstance(dicom_data, bytes):
                if hasattr(dicom_data, 'read'):
                    dicom_data = dicom_data.read()
                else:
                    logger.error("올바르지 않은 DICOM 데이터 형식")
                    return None
            
            # Orthanc instances API로 업로드
            response = requests.post(
                f"{self.base_url}/instances",
                data=dicom_data,
                auth=self.auth,
                headers={'Content-Type': 'application/dicom'},
                timeout=120
            )
            
            logger.info(f"Orthanc 업로드 응답 상태: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"DICOM 업로드 성공: {result}")
                return result
            else:
                logger.error(f"DICOM 업로드 실패: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"DICOM 업로드 중 오류: {e}")
            return None
    
    def upload_dicom_file(self, file_path):
        """파일 경로로 DICOM 업로드"""
        try:
            with open(file_path, 'rb') as f:
                dicom_data = f.read()
            return self.upload_dicom(dicom_data)
        except Exception as e:
            logger.error(f"DICOM 파일 업로드 실패: {e}")
            return None
    
    def get_patients(self):
        """모든 환자 ID 목록 조회"""
        return self.get("patients")
    
    def get_patient(self, patient_id):
        """환자 ID로 환자 정보 조회"""
        return self.get(f"patients/{patient_id}")
    
    def get_patient_studies(self, patient_id):
        """환자 ID로 모든 Study 조회"""
        return self.get(f"patients/{patient_id}/studies")
    
    def get_study(self, study_id):
        """Study ID로 Study 정보 조회"""
        return self.get(f"studies/{study_id}")
    
    def get_study_series(self, study_id):
        """Study ID로 모든 Series 조회"""
        return self.get(f"studies/{study_id}/series")
    
    def get_series(self, series_id):
        """Series ID로 Series 정보 조회"""
        return self.get(f"series/{series_id}")
    
    def get_series_instances(self, series_id):
        """Series ID로 모든 Instance 조회"""
        return self.get(f"series/{series_id}/instances")
    
    def get_instance(self, instance_id):
        """Instance ID로 Instance 정보 조회"""
        return self.get(f"instances/{instance_id}")
    
    def get_instance_tags(self, instance_id):
        """Instance ID로 DICOM 태그 조회"""
        return self.get(f"instances/{instance_id}/tags")
    
    def get_instance_preview(self, instance_id):
        """Instance ID로 미리보기 이미지 가져오기"""
        try:
            response = requests.get(
                f"{self.base_url}/instances/{instance_id}/preview",
                auth=self.auth,
                timeout=30
            )
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"인스턴스 미리보기 가져오기 실패 (instance_id: {instance_id}): {e}")
            return None
        except Exception as e:
            logger.error(f"인스턴스 미리보기 처리 중 오류 (instance_id: {instance_id}): {e}")
            return None
    
    def get_instance_file(self, instance_id):
        """Instance ID로 DICOM 파일 다운로드"""
        try:
            response = requests.get(
                f"{self.base_url}/instances/{instance_id}/file",
                auth=self.auth,
                timeout=60
            )
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"DICOM 파일 다운로드 실패 (instance_id: {instance_id}): {e}")
            return None
    
    def search_patients_by_name(self, patient_name):
        """환자 이름으로 검색"""
        try:
            all_patients = self.get_patients()
            if not all_patients:
                return []
            
            matching_patients = []
            for patient_id in all_patients:
                patient_info = self.get_patient(patient_id)
                if patient_info and 'MainDicomTags' in patient_info:
                    patient_name_in_dicom = patient_info['MainDicomTags'].get('PatientName', '')
                    if patient_name.lower() in patient_name_in_dicom.lower():
                        matching_patients.append({
                            'patient_id': patient_id,
                            'patient_info': patient_info
                        })
            
            return matching_patients
        except Exception as e:
            logger.error(f"환자 이름 검색 실패 (name: {patient_name}): {e}")
            return []
    
    def search_studies_by_patient_id(self, patient_id):
        """환자 ID로 Study 검색 (상세 정보 포함)"""
        try:
            studies = self.get_patient_studies(patient_id)
            if not studies:
                return []
            
            study_details = []
            for study_id in studies:
                study_info = self.get_study(study_id)
                if study_info:
                    study_details.append({
                        'study_id': study_id,
                        'study_instance_uid': study_info.get('MainDicomTags', {}).get('StudyInstanceUID'),
                        'study_date': study_info.get('MainDicomTags', {}).get('StudyDate'),
                        'study_time': study_info.get('MainDicomTags', {}).get('StudyTime'),
                        'study_description': study_info.get('MainDicomTags', {}).get('StudyDescription'),
                        'modality': study_info.get('MainDicomTags', {}).get('Modality'),
                        'accession_number': study_info.get('MainDicomTags', {}).get('AccessionNumber'),
                        'patient_name': study_info.get('PatientMainDicomTags', {}).get('PatientName'),
                        'patient_id_dicom': study_info.get('PatientMainDicomTags', {}).get('PatientID'),
                        'series_count': len(study_info.get('Series', [])),
                        'last_update': study_info.get('LastUpdate')
                    })
            
            return study_details
        except Exception as e:
            logger.error(f"환자 Study 검색 실패 (patient_id: {patient_id}): {e}")
            return []
    
    def get_study_with_series_and_instances(self, study_id):
        """Study의 모든 Series와 Instance 정보 조회"""
        try:
            study_info = self.get_study(study_id)
            if not study_info:
                return None
            
            # Series 정보 추가
            series_list = []
            for series_id in study_info.get('Series', []):
                series_info = self.get_series(series_id)
                if series_info:
                    # Instance 정보 추가
                    instances = []
                    for instance_id in series_info.get('Instances', []):
                        instance_info = self.get_instance(instance_id)
                        if instance_info:
                            instances.append({
                                'instance_id': instance_id,
                                'instance_info': instance_info
                            })
                    
                    series_list.append({
                        'series_id': series_id,
                        'series_info': series_info,
                        'instances': instances
                    })
            
            study_info['series_details'] = series_list
            return study_info
            
        except Exception as e:
            logger.error(f"Study 상세 정보 조회 실패 (study_id: {study_id}): {e}")
            return None
    
    def delete_patient(self, patient_id):
        """환자 데이터 삭제"""
        try:
            response = requests.delete(
                f"{self.base_url}/patients/{patient_id}",
                auth=self.auth,
                timeout=30
            )
            response.raise_for_status()
            logger.info(f"환자 삭제 성공: {patient_id}")
            return True
        except Exception as e:
            logger.error(f"환자 삭제 실패 (patient_id: {patient_id}): {e}")
            return False
    
    def delete_study(self, study_id):
        """Study 데이터 삭제"""
        try:
            response = requests.delete(
                f"{self.base_url}/studies/{study_id}",
                auth=self.auth,
                timeout=30
            )
            response.raise_for_status()
            logger.info(f"Study 삭제 성공: {study_id}")
            return True
        except Exception as e:
            logger.error(f"Study 삭제 실패 (study_id: {study_id}): {e}")
            return False
    
    def test_connection(self):
        """Orthanc 서버 연결 테스트"""
        try:
            response = requests.get(
                f"{self.base_url}/system",
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            system_info = response.json()
            logger.info(f"Orthanc 연결 성공: {system_info.get('Name', 'Unknown')} "
                       f"버전 {system_info.get('Version', 'Unknown')}")
            return True
        except Exception as e:
            logger.error(f"Orthanc 연결 실패: {e}")
            return False\
    
    def upload_dicom(self, dicom_data):
     try:
        import logging
        logger = logging.getLogger('medical_integration')
        
        logger.info("Orthanc에 DICOM 업로드 시작")
        
        # dicom_data가 bytes인지 확인
        if not isinstance(dicom_data, bytes):
            logger.error(f"DICOM 데이터가 bytes 타입이 아닙니다: {type(dicom_data)}")
            return None
        
        response = requests.post(
            f"{self.base_url}/instances",
            data=dicom_data,  # JSON이 아닌 raw binary data
            auth=self.auth,
            headers={'Content-Type': 'application/dicom'},  # DICOM 전용 content-type
            timeout=60
        )
        
        logger.info(f"Orthanc 업로드 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"DICOM 업로드 성공: {result}")
            return result
        else:
            logger.error(f"DICOM 업로드 실패: HTTP {response.status_code}")
            logger.error(f"응답 내용: {response.text}")
            return None
            
     except Exception as e:
        logger.error(f"DICOM 업로드 중 오류: {e}")
        return None

    def process_dicom_with_mapping(self, dicom_bytes, patient_uuid):
        """DICOM 업로드 후 자동 매핑 처리 (수정된 버전)"""
        try:
            import tempfile
            import pydicom
            from .models import PatientMapping
            import logging
            
            logger = logging.getLogger('medical_integration')
            logger.info("DICOM 업로드 후 자동 매핑 처리 시작")
            
            # 🔥 수정: 임시 파일을 통해 pydicom으로 읽기
            with tempfile.NamedTemporaryFile(suffix='.dcm', delete=False) as temp_file:
                temp_file.write(dicom_bytes)
                temp_file_path = temp_file.name
            
            try:
                # 임시 파일에서 DICOM 읽기
                dicom_ds = pydicom.dcmread(temp_file_path)
                
                # DICOM에서 환자 정보 추출
                patient_info = {
                    'patient_name': str(dicom_ds.get('PatientName', '')),
                    'patient_id': str(dicom_ds.get('PatientID', '')),
                    'patient_birth_date': str(dicom_ds.get('PatientBirthDate', '')),
                    'patient_sex': str(dicom_ds.get('PatientSex', '')),
                    'study_instance_uid': str(dicom_ds.get('StudyInstanceUID', ''))
                }
                
                logger.info(f"DICOM 환자 정보 추출 성공: {patient_info}")
                
            except Exception as e:
                logger.error(f"DICOM 환자 정보 추출 실패: {e}")
                patient_info = None
            finally:
                # 임시 파일 삭제
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
            
            if not patient_info:
                logger.error("DICOM 환자 정보 추출 실패")
                return None
            
            # Orthanc에 업로드
            upload_result = self.upload_dicom(dicom_bytes)
            
            if not upload_result:
                logger.error("Orthanc 업로드 실패")
                return None
            
            # 자동 매핑 생성
            orthanc_patient_id = upload_result.get('ParentPatient')
            
            if orthanc_patient_id and patient_uuid:
                try:
                    mapping, created = PatientMapping.objects.get_or_create(
                        orthanc_patient_id=orthanc_patient_id,
                        openmrs_patient_uuid=patient_uuid,
                        defaults={'sync_status': 'SYNCED'}
                    )
                    
                    if created:
                        logger.info(f"새 환자 매핑 생성: {mapping}")
                    else:
                        logger.info(f"기존 매핑 사용: {mapping}")
                        
                except Exception as e:
                    logger.error(f"환자 매핑 생성 실패: {e}")
            
            return {
                'upload_result': upload_result,
                'patient_info': patient_info,
                'mapping_created': created if 'created' in locals() else False
            }
            
        except Exception as e:
            logger.error(f"DICOM 처리 및 매핑 실패: {e}")
            return None