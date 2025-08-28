# backend/medical_integration/dicom_patient_mapper.py (완전 수정된 버전)

import logging
import pydicom
from datetime import datetime
from django.db import transaction
from .models import PatientMapping
from .openmrs_api import OpenMRSAPI
from .orthanc_api import OrthancAPI

logger = logging.getLogger('medical_integration')

class DicomPatientMapper:
    """DICOM과 OpenMRS 환자 자동 매핑 클래스 - patient_identifier 기반 수정"""
    
    def __init__(self):
        self.openmrs_api = OpenMRSAPI()
        self.orthanc_api = OrthancAPI()
    
    def extract_patient_info_from_dicom(self, dicom_data):
        """DICOM 파일에서 환자 정보 추출 - bytes 처리 개선"""
        try:
            # bytes 데이터인 경우 임시 파일로 저장 후 읽기
            if isinstance(dicom_data, bytes):
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(suffix='.dcm', delete=False) as temp_file:
                    temp_file.write(dicom_data)
                    temp_file_path = temp_file.name
                
                try:
                    ds = pydicom.dcmread(temp_file_path, force=True)
                finally:
                    # 임시 파일 정리
                    try:
                        os.unlink(temp_file_path)
                    except:
                        pass
            else:
                # 파일 경로나 file-like 객체인 경우
                ds = pydicom.dcmread(dicom_data, force=True)
            
            patient_info = {
                # 🔥 핵심: DICOM Patient ID는 OpenMRS의 patient_identifier.identifier와 매핑
                'patient_identifier': getattr(ds, 'PatientID', ''),  # P003, DCM001 등
                'patient_name': str(getattr(ds, 'PatientName', '')),
                'patient_birth_date': getattr(ds, 'PatientBirthDate', ''),
                'patient_sex': getattr(ds, 'PatientSex', ''),
                'study_instance_uid': getattr(ds, 'StudyInstanceUID', ''),
                'study_date': getattr(ds, 'StudyDate', ''),
                'modality': getattr(ds, 'Modality', ''),
                'study_description': getattr(ds, 'StudyDescription', ''),
                'accession_number': getattr(ds, 'AccessionNumber', '')
            }
            
            # 환자 이름 포맷 정리 (DICOM 표준: Last^First^Middle)
            if patient_info['patient_name']:
                name_parts = str(patient_info['patient_name']).split('^')
                if len(name_parts) >= 2:
                    patient_info['family_name'] = name_parts[0].strip()
                    patient_info['given_name'] = name_parts[1].strip()
                    patient_info['formatted_name'] = f"{patient_info['given_name']} {patient_info['family_name']}"
                else:
                    patient_info['formatted_name'] = patient_info['patient_name']
            
            # 생년월일 포맷 변환 (YYYYMMDD -> YYYY-MM-DD)
            if patient_info['patient_birth_date'] and len(patient_info['patient_birth_date']) == 8:
                date_str = patient_info['patient_birth_date']
                patient_info['formatted_birth_date'] = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            
            logger.info(f"DICOM에서 추출된 환자 정보: {patient_info}")
            return patient_info
            
        except Exception as e:
            logger.error(f"DICOM 환자 정보 추출 실패: {e}")
            return None
    
    def find_matching_openmrs_patient_by_identifier(self, dicom_patient_info):
        """🔥 수정: patient_identifier.identifier로 OpenMRS 환자 찾기"""
        try:
            dicom_patient_identifier = dicom_patient_info.get('patient_identifier', '').strip()
            
            if not dicom_patient_identifier:
                logger.warning("DICOM Patient ID가 없습니다")
                return None
            
            logger.info(f"🔍 DICOM Patient Identifier로 검색: {dicom_patient_identifier}")
            
            # 🔥 수정: OpenMRS에서 patient_identifier.identifier로 검색
            patients = self.openmrs_api.search_patients(dicom_patient_identifier)
            
            if not patients or not patients.get('results'):
                logger.warning(f"Patient Identifier '{dicom_patient_identifier}'로 환자를 찾을 수 없음")
                return None
            
            # 🔥 추가 검증: identifier가 정확히 일치하는 환자 찾기
            for patient in patients['results']:
                identifiers = patient.get('identifiers', [])
                for identifier_info in identifiers:
                    if identifier_info.get('identifier') == dicom_patient_identifier:
                        logger.info(f"✅ Patient Identifier 정확 매칭: {dicom_patient_identifier} -> {patient.get('display')}")
                        
                        # 🔥 추가 검증: 생년월일, 성별 확인
                        if self._validate_patient_match_enhanced(patient, dicom_patient_info):
                            logger.info(f"✅ 추가 검증 통과: {patient.get('display')}")
                            return patient
                        else:
                            logger.warning(f"⚠️ Patient Identifier는 일치하지만 추가 정보 불일치: {patient.get('display')}")
                            # identifier 일치는 가장 신뢰할만하므로 경고만 하고 반환
                            return patient
            
            # identifier 완전 일치하는 환자가 없으면 첫 번째 결과 반환
            logger.info(f"🔸 Patient Identifier 부분 매칭: {patients['results'][0].get('display')}")
            return patients['results'][0]
            
        except Exception as e:
            logger.error(f"Patient Identifier 검색 실패: {e}")
            return None
    
    def find_matching_openmrs_patient(self, dicom_patient_info):
        """🔥 수정: patient_identifier 우선 매칭 후 이름 매칭"""
        try:
            # 1️⃣ 우선순위: Patient Identifier로 검색
            patient = self.find_matching_openmrs_patient_by_identifier(dicom_patient_info)
            if patient:
                return patient
            
            # 2️⃣ 대안: 환자 이름으로 검색 (기존 로직)
            logger.info("Patient Identifier 매칭 실패, 이름으로 검색 시도")
            
            if dicom_patient_info.get('formatted_name'):
                logger.info(f"환자 이름으로 검색 시도: {dicom_patient_info['formatted_name']}")
                patients = self.openmrs_api.search_patients(dicom_patient_info['formatted_name'])
                if patients and patients.get('results'):
                    for patient in patients['results']:
                        if self._validate_patient_match_enhanced(patient, dicom_patient_info):
                            logger.info(f"✅ 이름 + 추가정보 매칭 성공: {dicom_patient_info['formatted_name']}")
                            return patient
            
            # 3️⃣ 마지막 시도: 성으로 검색
            if dicom_patient_info.get('family_name'):
                logger.info(f"성으로 검색 시도: {dicom_patient_info['family_name']}")
                patients = self.openmrs_api.search_patients(dicom_patient_info['family_name'])
                if patients and patients.get('results'):
                    for patient in patients['results']:
                        if self._validate_patient_match_enhanced(patient, dicom_patient_info):
                            logger.info(f"✅ 성 + 추가정보 매칭 성공: {dicom_patient_info['family_name']}")
                            return patient
            
            logger.warning(f"매칭되는 OpenMRS 환자를 찾을 수 없음: {dicom_patient_info}")
            return None
            
        except Exception as e:
            logger.error(f"OpenMRS 환자 검색 실패: {e}")
            return None
        
    def _validate_patient_match_enhanced(self, openmrs_patient, dicom_patient_info):
        """개선된 환자 정보 매칭 검증 - patient_identifier 중심"""
        try:
            match_score = 0
            total_checks = 0
            
            logger.debug(f"매칭 검증 시작: OpenMRS={openmrs_patient.get('display')}, DICOM={dicom_patient_info.get('patient_identifier')}")
            
            # 🔥 1. Patient Identifier 일치 확인 (최고 가중치)
            dicom_patient_identifier = dicom_patient_info.get('patient_identifier', '').strip()
            if dicom_patient_identifier:
                total_checks += 5  # Patient Identifier는 가중치 5
                identifiers = openmrs_patient.get('identifiers', [])
                for identifier in identifiers:
                    if identifier.get('identifier') == dicom_patient_identifier:
                        match_score += 5
                        logger.debug(f"  ✅ Patient Identifier 정확 일치: {dicom_patient_identifier}")
                        break
                else:
                    logger.debug(f"  ❌ Patient Identifier 불일치: DICOM={dicom_patient_identifier}")
            
            # 🔥 2. 생년월일 비교 (중요)
            if dicom_patient_info.get('formatted_birth_date'):
                total_checks += 3  # 생년월일은 가중치 3
                openmrs_birth_date = openmrs_patient.get('person', {}).get('birthdate', '')
                if openmrs_birth_date:
                    openmrs_date = openmrs_birth_date.split('T')[0] if 'T' in openmrs_birth_date else openmrs_birth_date
                    dicom_date = dicom_patient_info['formatted_birth_date']
                    
                    if openmrs_date == dicom_date:
                        match_score += 3
                        logger.debug(f"  ✅ 생년월일 일치: {openmrs_date}")
                    else:
                        logger.debug(f"  ❌ 생년월일 불일치: OpenMRS={openmrs_date}, DICOM={dicom_date}")
            
            # 🔥 3. 성별 비교
            if dicom_patient_info.get('patient_sex'):
                total_checks += 2  # 성별은 가중치 2
                openmrs_gender = openmrs_patient.get('person', {}).get('gender')
                dicom_sex = dicom_patient_info['patient_sex']
                
                if openmrs_gender and openmrs_gender == dicom_sex:
                    match_score += 2
                    logger.debug(f"  ✅ 성별 일치: {openmrs_gender}")
                else:
                    logger.debug(f"  ❌ 성별 불일치: OpenMRS={openmrs_gender}, DICOM={dicom_sex}")
            
            # 🔥 4. 이름 유사도 비교
            if dicom_patient_info.get('formatted_name'):
                total_checks += 1  # 이름은 가중치 1 (identifier보다 낮음)
                openmrs_display = openmrs_patient.get('display', '').lower().replace(' ', '')
                dicom_name = dicom_patient_info['formatted_name'].lower().replace(' ', '')
                
                if dicom_name in openmrs_display or openmrs_display in dicom_name:
                    match_score += 1
                    logger.debug(f"  ✅ 이름 유사: {openmrs_display} ~ {dicom_name}")
                else:
                    logger.debug(f"  ❌ 이름 불일치: {openmrs_display} vs {dicom_name}")
            
            # 🔥 5. 매칭 점수 계산
            if total_checks == 0:
                logger.debug("  ❌ 검증할 정보가 없음")
                return False
            
            match_percentage = (match_score / total_checks) * 100
            logger.debug(f"  📊 매칭 점수: {match_score}/{total_checks} ({match_percentage:.1f}%)")
            
            # 🔥 Patient Identifier가 일치하면 70% 이상, 아니면 80% 이상 요구
            threshold = 70 if dicom_patient_identifier and any(
                id_info.get('identifier') == dicom_patient_identifier 
                for id_info in openmrs_patient.get('identifiers', [])
            ) else 80
            
            is_match = match_percentage >= threshold
            
            if is_match:
                logger.info(f"  ✅ 환자 매칭 성공 ({match_percentage:.1f}% >= {threshold}%)")
            else:
                logger.debug(f"  ❌ 환자 매칭 실패 ({match_percentage:.1f}% < {threshold}%)")
            
            return is_match
            
        except Exception as e:
            logger.error(f"환자 정보 검증 실패: {e}")
            return False
        
    def create_or_update_mapping(self, orthanc_patient_id, openmrs_patient_uuid, dicom_info=None):
        """환자 매핑 생성 또는 업데이트 - patient_identifier 정보 포함"""
        try:
            with transaction.atomic():
                # 기존 매핑 확인
                existing_mapping = PatientMapping.objects.filter(
                    orthanc_patient_id=orthanc_patient_id,
                    is_active=True
                ).first()
                
                if existing_mapping:
                    # 기존 매핑 업데이트
                    if existing_mapping.openmrs_patient_uuid != openmrs_patient_uuid:
                        existing_mapping.openmrs_patient_uuid = openmrs_patient_uuid
                        
                        # 🔥 patient_identifier 정보 추가
                        if dicom_info:
                            mapping_criteria = {
                                'dicom_patient_identifier': dicom_info.get('patient_identifier'),
                                'matched_by_identifier': True,
                                'dicom_patient_name': dicom_info.get('formatted_name'),
                                'mapping_method': 'patient_identifier_based'
                            }
                            existing_mapping.set_mapping_criteria(mapping_criteria)
                        
                        existing_mapping.update_sync_time('SYNCED')
                        logger.info(f"기존 매핑 업데이트: {existing_mapping}")
                    return existing_mapping
                else:
                    # 새 매핑 생성
                    mapping_criteria = {}
                    if dicom_info:
                        mapping_criteria = {
                            'dicom_patient_identifier': dicom_info.get('patient_identifier'),
                            'matched_by_identifier': bool(dicom_info.get('patient_identifier')),
                            'dicom_patient_name': dicom_info.get('formatted_name'),
                            'dicom_birth_date': dicom_info.get('formatted_birth_date'),
                            'dicom_sex': dicom_info.get('patient_sex'),
                            'mapping_method': 'patient_identifier_based'
                        }
                    
                    new_mapping = PatientMapping.objects.create(
                        orthanc_patient_id=orthanc_patient_id,
                        openmrs_patient_uuid=openmrs_patient_uuid,
                        mapping_type='AUTO',
                        sync_status='AUTO_MAPPED',
                        mapping_criteria=mapping_criteria,
                        created_by='dicom_auto_mapper'
                    )
                    logger.info(f"새 환자 매핑 생성: {new_mapping}")
                    return new_mapping
                    
        except Exception as e:
            logger.error(f"환자 매핑 생성/업데이트 실패: {e}")
            return None
    
    def _evaluate_mapping_quality(self, dicom_patient_info, matched_patient):
        """🔥 추가: 매핑 품질 평가 메서드"""
        try:
            logger.debug("매핑 품질 평가 시작")
            
            quality_factors = {
                'patient_identifier_match': False,
                'birth_date_match': False,
                'gender_match': False,
                'name_similarity': 0.0
            }
            
            confidence_score = 0.0
            
            # 1. Patient Identifier 매칭 확인 (가장 중요 - 50점)
            dicom_identifier = dicom_patient_info.get('patient_identifier', '').strip()
            if dicom_identifier:
                matched_identifiers = matched_patient.get('identifiers', [])
                for id_info in matched_identifiers:
                    if id_info.get('identifier') == dicom_identifier:
                        quality_factors['patient_identifier_match'] = True
                        confidence_score += 0.5
                        logger.debug(f"  ✅ Patient Identifier 매칭: +50점")
                        break
            
            # 2. 생년월일 매칭 확인 (30점)
            dicom_birth_date = dicom_patient_info.get('formatted_birth_date')
            if dicom_birth_date:
                openmrs_birth_date = matched_patient.get('person', {}).get('birthdate', '')
                if openmrs_birth_date:
                    openmrs_date = openmrs_birth_date.split('T')[0] if 'T' in openmrs_birth_date else openmrs_birth_date
                    if openmrs_date == dicom_birth_date:
                        quality_factors['birth_date_match'] = True
                        confidence_score += 0.3
                        logger.debug(f"  ✅ 생년월일 매칭: +30점")
            
            # 3. 성별 매칭 확인 (10점)
            dicom_sex = dicom_patient_info.get('patient_sex')
            if dicom_sex:
                openmrs_gender = matched_patient.get('person', {}).get('gender')
                if openmrs_gender == dicom_sex:
                    quality_factors['gender_match'] = True
                    confidence_score += 0.1
                    logger.debug(f"  ✅ 성별 매칭: +10점")
            
            # 4. 이름 유사도 확인 (10점)
            dicom_name = dicom_patient_info.get('formatted_name', '').lower().replace(' ', '')
            openmrs_name = matched_patient.get('display', '').lower().replace(' ', '')
            
            if dicom_name and openmrs_name:
                # 간단한 유사도 계산
                if dicom_name == openmrs_name:
                    name_similarity = 1.0
                elif dicom_name in openmrs_name or openmrs_name in dicom_name:
                    name_similarity = 0.8
                else:
                    # 공통 문자 비율 계산
                    common_chars = set(dicom_name) & set(openmrs_name)
                    total_chars = set(dicom_name) | set(openmrs_name)
                    name_similarity = len(common_chars) / len(total_chars) if total_chars else 0
                
                quality_factors['name_similarity'] = name_similarity
                confidence_score += 0.1 * name_similarity
                logger.debug(f"  📝 이름 유사도: {name_similarity:.2f} (+{0.1 * name_similarity:.1f}점)")
            
            # 최종 점수 정규화 (0.0 - 1.0)
            confidence_score = min(confidence_score, 1.0)
            
            criteria = {
                'patient_identifier_matched': quality_factors['patient_identifier_match'],
                'birth_date_matched': quality_factors['birth_date_match'],
                'gender_matched': quality_factors['gender_match'],
                'name_similarity_score': quality_factors['name_similarity'],
                'dicom_patient_identifier': dicom_patient_info.get('patient_identifier'),
                'dicom_patient_name': dicom_patient_info.get('formatted_name'),
                'openmrs_patient_display': matched_patient.get('display'),
                'evaluation_timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"매핑 품질 평가 완료: 신뢰도 {confidence_score:.3f}")
            
            return {
                'confidence_score': confidence_score,
                'criteria': criteria,
                'quality_factors': quality_factors
            }
            
        except Exception as e:
            logger.error(f"매핑 품질 평가 실패: {e}")
            return {
                'confidence_score': 0.5,  # 기본값
                'criteria': {},
                'quality_factors': {}
            }
    
    def _validate_patient_match(self, openmrs_patient, dicom_patient_info):
        """기존 환자 정보 매칭 검증 (호환성 유지)"""
        return self._validate_patient_match_enhanced(openmrs_patient, dicom_patient_info)
    
    def process_dicom_upload(self, dicom_data, orthanc_upload_result):
        """DICOM 업로드 후 자동 매핑 처리 (개선된 버전)"""
        try:
            logger.info("🔥 개선된 DICOM 자동 매핑 처리 시작")
            
            # 1. DICOM에서 환자 정보 추출
            dicom_patient_info = self.extract_patient_info_from_dicom(dicom_data)
            if not dicom_patient_info:
                logger.error("DICOM 환자 정보 추출 실패")
                return {
                    'success': False,
                    'message': 'DICOM 환자 정보를 읽을 수 없습니다',
                    'error_type': 'dicom_parse_error'
                }
            
            logger.info(f"추출된 DICOM 환자 정보: {dicom_patient_info}")
            
            # 2. Orthanc에서 Patient ID 가져오기
            orthanc_patient_id = orthanc_upload_result.get('ParentPatient')
            if not orthanc_patient_id:
                logger.error("Orthanc Patient ID를 찾을 수 없음")
                return {
                    'success': False,
                    'message': 'Orthanc Patient ID를 찾을 수 없습니다',
                    'error_type': 'orthanc_patient_id_missing'
                }
            
            logger.info(f"Orthanc Patient ID: {orthanc_patient_id}")
            
            # 3. 기존 매핑 확인
            existing_mapping = PatientMapping.objects.filter(
                orthanc_patient_id=orthanc_patient_id,
                is_active=True
            ).first()
            
            if existing_mapping:
                logger.info(f"기존 매핑 발견: {existing_mapping}")
                return {
                    'success': True,
                    'message': '기존 매핑을 사용합니다',
                    'mapping': {
                        'mapping_id': existing_mapping.mapping_id,
                        'orthanc_patient_id': existing_mapping.orthanc_patient_id,
                        'openmrs_patient_uuid': existing_mapping.openmrs_patient_uuid,
                        'status': 'existing'
                    },
                    'dicom_info': dicom_patient_info
                }
            
            # 4. OpenMRS에서 매칭되는 환자 찾기
            matching_patient = self.find_matching_openmrs_patient(dicom_patient_info)
            
            if not matching_patient:
                logger.warning("매칭되는 OpenMRS 환자를 찾을 수 없음")
                
                # 🔥 개선: 매칭 실패 시 상세 정보 제공
                return {
                    'success': False,
                    'message': '매칭되는 환자를 찾을 수 없습니다',
                    'dicom_info': dicom_patient_info,
                    'orthanc_patient_id': orthanc_patient_id,
                    'requires_manual_mapping': True,
                    'suggested_search_terms': [
                        dicom_patient_info.get('patient_identifier', ''),
                        dicom_patient_info.get('formatted_name', ''),
                        dicom_patient_info.get('family_name', ''),
                        dicom_patient_info.get('given_name', '')
                    ],
                    'error_type': 'no_matching_patient'
                }
            
            logger.info(f"매칭된 OpenMRS 환자: {matching_patient.get('display')} ({matching_patient.get('uuid')})")
            
            # 5. 매핑 생성
            mapping = self.create_or_update_mapping(
                orthanc_patient_id=orthanc_patient_id,
                openmrs_patient_uuid=matching_patient['uuid'],
                dicom_info=dicom_patient_info
            )
            
            if mapping:
                logger.info(f"🎉 DICOM 자동 매핑 성공: {mapping}")
                
                # 🔥 매핑 품질 평가
                mapping_quality = self._evaluate_mapping_quality(dicom_patient_info, matching_patient)
                
                return {
                    'success': True,
                    'message': '환자 자동 매핑 완료',
                    'mapping': {
                        'mapping_id': mapping.mapping_id,
                        'orthanc_patient_id': mapping.orthanc_patient_id,
                        'openmrs_patient_uuid': mapping.openmrs_patient_uuid,
                        'confidence_score': mapping_quality.get('confidence_score', 0.8),
                        'mapping_criteria': mapping_quality.get('criteria', {}),
                        'status': 'new'
                    },
                    'matched_patient': {
                        'uuid': matching_patient['uuid'],
                        'display': matching_patient.get('display'),
                        'identifiers': matching_patient.get('identifiers', [])
                    },
                    'dicom_info': dicom_patient_info,
                    'quality_assessment': mapping_quality
                }
            else:
                logger.error("매핑 생성 실패")
                return {
                    'success': False,
                    'message': '매핑 생성에 실패했습니다',
                    'dicom_info': dicom_patient_info,
                    'matched_patient': matching_patient,
                    'error_type': 'mapping_creation_failed'
                }
                
        except Exception as e:
            logger.error(f"DICOM 자동 매핑 처리 실패: {e}")
            import traceback
            logger.error(f"상세 오류: {traceback.format_exc()}")
            
            return {
                'success': False,
                'message': f'자동 매핑 처리 중 오류: {str(e)}',
                'error': str(e),
                'error_type': 'system_error'
            }