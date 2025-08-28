import requests
import logging

logger = logging.getLogger(__name__)

def get_patient_info_from_pacs(study_uid):
    """
    PACS에서 Study UID로 환자 정보를 가져오는 함수
    
    Args:
        study_uid (str): Study Instance UID
        
    Returns:
        dict: 환자 정보 (patient_id, patient_name, study_info 등)
    """
    pacs_url = "http://35.225.63.41:8042"
    
    try:
        # 1. 모든 스터디 목록 가져오기
        studies_response = requests.get(f"{pacs_url}/studies", timeout=70)
        studies_response.raise_for_status()
        studies = studies_response.json()
        
        # 2. 각 스터디를 확인해서 해당 Study UID 찾기
        for study_id in studies:
            try:
                study_response = requests.get(f"{pacs_url}/studies/{study_id}", timeout=70)
                study_response.raise_for_status()
                study_data = study_response.json()
                
                # Study UID 매칭 확인
                pacs_study_uid = study_data.get('MainDicomTags', {}).get('StudyInstanceUID')
                if pacs_study_uid == study_uid:
                    # 환자 정보 추출
                    patient_tags = study_data.get('PatientMainDicomTags', {})
                    main_tags = study_data.get('MainDicomTags', {})
                    
                    patient_info = {
                        'patient_id': patient_tags.get('PatientID', 'UNKNOWN'),
                        'patient_name': patient_tags.get('PatientName', 'UNKNOWN'),
                        'patient_birth_date': patient_tags.get('PatientBirthDate', ''),
                        'patient_sex': patient_tags.get('PatientSex', ''),
                        'study_date': main_tags.get('StudyDate', ''),
                        'study_time': main_tags.get('StudyTime', ''),
                        'accession_number': main_tags.get('AccessionNumber', ''),
                        'study_id': main_tags.get('StudyID', ''),
                        'pacs_study_id': study_id,  # PACS 내부 ID
                        'study_instance_uid': study_uid
                    }
                    
                    logger.info(f"PACS에서 환자 정보 찾음: {patient_info['patient_id']}")
                    return patient_info
                    
            except requests.RequestException as e:
                logger.warning(f"스터디 {study_id} 조회 실패: {e}")
                continue
        
        # 해당 Study UID를 찾지 못한 경우
        logger.error(f"PACS에서 Study UID {study_uid}를 찾을 수 없습니다.")
        return None
        
    except requests.RequestException as e:
        logger.error(f"PACS 연결 실패: {e}")
        return None
    except Exception as e:
        logger.error(f"환자 정보 조회 중 오류: {e}")
        return None

def get_series_info_from_pacs(study_uid):
    """
    PACS에서 스터디의 시리즈 정보를 가져오는 함수
    
    Args:
        study_uid (str): Study Instance UID
        
    Returns:
        list: 시리즈 정보 리스트
    """
    pacs_url = "http://35.225.63.41:8042"
    
    try:
        # 먼저 환자 정보를 가져와서 PACS 스터디 ID 얻기
        patient_info = get_patient_info_from_pacs(study_uid)
        if not patient_info:
            return []
        
        pacs_study_id = patient_info['pacs_study_id']
        
        # 스터디 상세 정보에서 시리즈 목록 가져오기
        study_response = requests.get(f"{pacs_url}/studies/{pacs_study_id}", timeout=70)
        study_response.raise_for_status()
        study_data = study_response.json()
        
        series_list = study_data.get('Series', [])
        series_info_list = []
        
        for series_id in series_list:
            try:
                series_response = requests.get(f"{pacs_url}/series/{series_id}", timeout=80)
                series_response.raise_for_status()
                series_data = series_response.json()
                
                series_tags = series_data.get('MainDicomTags', {})
                series_info = {
                    'series_instance_uid': series_tags.get('SeriesInstanceUID'),
                    'series_number': series_tags.get('SeriesNumber'),
                    'modality': series_tags.get('Modality'),
                    'series_description': series_tags.get('SeriesDescription', ''),
                    'pacs_series_id': series_id,
                    'instances': series_data.get('Instances', [])
                }
                
                series_info_list.append(series_info)
                
            except requests.RequestException as e:
                logger.warning(f"시리즈 {series_id} 조회 실패: {e}")
                continue
        
        return series_info_list
        
    except Exception as e:
        logger.error(f"시리즈 정보 조회 중 오류: {e}")
        return []

def test_pacs_connection():
    """PACS 연결 테스트"""
    try:
        response = requests.get("http://35.225.63.41:8042/studies", timeout=70)
        response.raise_for_status()
        studies = response.json()
        print(f"✅ PACS 연결 성공! 스터디 수: {len(studies)}")
        return True
    except Exception as e:
        print(f"❌ PACS 연결 실패: {e}")
        return False

if __name__ == "__main__":
    # 직접 실행시 테스트
    print("PACS 연결 테스트...")
    test_pacs_connection()
    
    # 실제 환자 정보 조회 테스트
    # study_uid = "1.2.276.0.7230010.3.1.2.948861420.9340.1748700703.257"
    # print(f"\n환자 정보 조회 테스트: {study_uid}")
    # patient_info = get_patient_info_from_pacs(study_uid)
    
    # if patient_info:
    #     print("✅ 환자 정보 조회 성공!")
    #     for key, value in patient_info.items():
    #         print(f"  {key}: {value}")
    # else:
    #     print("❌ 환자 정보 조회 실패")



def get_real_instance_info_from_pacs(study_uid):
    """
    PACS에서 실제 Series/Instance 정보를 가져오는 함수
    Django AI 분석에서 올바른 UID를 사용하기 위함
    
    Args:
        study_uid (str): Study Instance UID
        
    Returns:
        dict: 실제 series_uid, instance_uid, instance_number
    """
    pacs_url = "http://35.225.63.41:8042"
    
    try:
        logger.info(f"🔍 실제 인스턴스 정보 조회 시작: {study_uid}")
        
        # 1. 환자 정보에서 PACS Study ID 가져오기
        patient_info = get_patient_info_from_pacs(study_uid)
        if not patient_info:
            raise Exception(f"Study UID {study_uid}에 대한 환자 정보를 찾을 수 없습니다")
        
        pacs_study_id = patient_info['pacs_study_id']
        logger.info(f"📋 PACS Study ID: {pacs_study_id}")
        
        # 2. Study 상세 정보에서 Series 목록 가져오기
        study_response = requests.get(f"{pacs_url}/studies/{pacs_study_id}", timeout=30)
        study_response.raise_for_status()
        study_data = study_response.json()
        
        series_list = study_data.get('Series', [])
        if not series_list:
            raise Exception("시리즈가 없습니다")
        
        logger.info(f"📁 발견된 시리즈 수: {len(series_list)}")
        
        # 3. 첫 번째 시리즈 정보 가져오기
        first_series_id = series_list[0]
        series_response = requests.get(f"{pacs_url}/series/{first_series_id}", timeout=30)
        series_response.raise_for_status()
        series_data = series_response.json()
        
        series_tags = series_data.get('MainDicomTags', {})
        series_uid = series_tags.get('SeriesInstanceUID')
        
        if not series_uid:
            raise Exception("Series UID를 찾을 수 없습니다")
        
        logger.info(f"📂 Series UID: {series_uid}")
        
        # 4. 시리즈의 Instance 목록 가져오기
        instances_list = series_data.get('Instances', [])
        if not instances_list:
            raise Exception("인스턴스가 없습니다")
        
        logger.info(f"🖼️ 발견된 인스턴스 수: {len(instances_list)}")
        
        # 5. 첫 번째 인스턴스 정보 가져오기
        first_instance_id = instances_list[0]
        instance_response = requests.get(f"{pacs_url}/instances/{first_instance_id}", timeout=30)
        instance_response.raise_for_status()
        instance_data = instance_response.json()
        
        instance_tags = instance_data.get('MainDicomTags', {})
        instance_uid = instance_tags.get('SOPInstanceUID')
        instance_number = int(instance_tags.get('InstanceNumber', 1))
        
        if not instance_uid:
            raise Exception("Instance UID를 찾을 수 없습니다")
        
        result = {
            'series_uid': series_uid,
            'instance_uid': instance_uid,
            'instance_number': instance_number,
            'total_instances': len(instances_list),
            'total_series': len(series_list)
        }
        
        logger.info(f"✅ 실제 인스턴스 정보 조회 완료:")
        logger.info(f"   - Series UID: {series_uid}")
        logger.info(f"   - Instance UID: {instance_uid}")
        logger.info(f"   - Instance Number: {instance_number}")
        logger.info(f"   - 총 인스턴스 수: {len(instances_list)}")
        
        return result
        
    except requests.RequestException as e:
        logger.error(f"❌ PACS 요청 실패: {e}")
        return get_fallback_instance_info(study_uid)
    except Exception as e:
        logger.error(f"❌ 인스턴스 정보 조회 실패: {e}")
        return get_fallback_instance_info(study_uid)

def get_fallback_instance_info(study_uid):
    """
    PACS 조회 실패 시 기본값 반환
    """
    logger.warning(f"⚠️ PACS 조회 실패, 기본값 사용: {study_uid}")
    
    return {
        'series_uid': f"{study_uid}.1",
        'instance_uid': f"{study_uid}.1.1",
        'instance_number': 1,
        'total_instances': 1,
        'total_series': 1,
        'fallback': True  # 기본값임을 표시
    }

def get_all_instances_info_from_pacs(study_uid):
    """
    PACS에서 모든 인스턴스 정보를 가져오는 함수
    여러 인스턴스에 AI 분석을 적용할 때 사용
    
    Args:
        study_uid (str): Study Instance UID
        
    Returns:
        list: 모든 인스턴스 정보 리스트
    """
    pacs_url = "http://35.225.63.41:8042"
    
    try:
        logger.info(f"🔍 모든 인스턴스 정보 조회 시작: {study_uid}")
        
        # 환자 정보 가져오기
        patient_info = get_patient_info_from_pacs(study_uid)
        if not patient_info:
            return []
        
        pacs_study_id = patient_info['pacs_study_id']
        
        # Study 정보 가져오기
        study_response = requests.get(f"{pacs_url}/studies/{pacs_study_id}", timeout=30)
        study_response.raise_for_status()
        study_data = study_response.json()
        
        series_list = study_data.get('Series', [])
        all_instances = []
        
        # 각 시리즈의 모든 인스턴스 정보 수집
        for series_id in series_list:
            try:
                series_response = requests.get(f"{pacs_url}/series/{series_id}", timeout=30)
                series_response.raise_for_status()
                series_data = series_response.json()
                
                series_tags = series_data.get('MainDicomTags', {})
                series_uid = series_tags.get('SeriesInstanceUID')
                instances_list = series_data.get('Instances', [])
                
                # 각 인스턴스 정보 가져오기
                for instance_id in instances_list:
                    try:
                        instance_response = requests.get(f"{pacs_url}/instances/{instance_id}", timeout=30)
                        instance_response.raise_for_status()
                        instance_data = instance_response.json()
                        
                        instance_tags = instance_data.get('MainDicomTags', {})
                        instance_info = {
                            'series_uid': series_uid,
                            'instance_uid': instance_tags.get('SOPInstanceUID'),
                            'instance_number': int(instance_tags.get('InstanceNumber', len(all_instances) + 1)),
                            'pacs_instance_id': instance_id,
                            'pacs_series_id': series_id
                        }
                        
                        all_instances.append(instance_info)
                        
                    except Exception as e:
                        logger.warning(f"인스턴스 {instance_id} 조회 실패: {e}")
                        continue
                        
            except Exception as e:
                logger.warning(f"시리즈 {series_id} 조회 실패: {e}")
                continue
        
        # 인스턴스 번호로 정렬
        all_instances.sort(key=lambda x: x['instance_number'])
        
        logger.info(f"✅ 모든 인스턴스 정보 조회 완료: {len(all_instances)}개")
        return all_instances
        
    except Exception as e:
        logger.error(f"❌ 모든 인스턴스 정보 조회 실패: {e}")
        return []

def debug_orthanc_studies():
    """
    Orthanc의 모든 스터디 정보를 디버깅용으로 출력
    """
    pacs_url = "http://35.225.63.41:8042"
    
    try:
        studies_response = requests.get(f"{pacs_url}/studies", timeout=30)
        studies_response.raise_for_status()
        studies = studies_response.json()
        
        print(f"🔍 총 {len(studies)}개 스터디 발견")
        
        study_list = []
        for i, study_id in enumerate(studies[:5]):  # 처음 5개만 확인
            try:
                study_response = requests.get(f"{pacs_url}/studies/{study_id}", timeout=30)
                study_response.raise_for_status()
                study_data = study_response.json()
                
                main_tags = study_data.get('MainDicomTags', {})
                patient_tags = study_data.get('PatientMainDicomTags', {})
                
                study_info = {
                    'pacs_id': study_id,
                    'study_uid': main_tags.get('StudyInstanceUID'),
                    'patient_id': patient_tags.get('PatientID'),
                    'patient_name': patient_tags.get('PatientName'),
                    'study_date': main_tags.get('StudyDate'),
                    'series_count': len(study_data.get('Series', []))
                }
                
                study_list.append(study_info)
                print(f"  [{i+1}] {study_info}")
                
            except Exception as e:
                print(f"  [{i+1}] 스터디 {study_id} 조회 실패: {e}")
        
        return study_list
        
    except Exception as e:
        print(f"❌ Orthanc 스터디 목록 조회 실패: {e}")
        return []