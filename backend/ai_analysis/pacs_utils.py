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
    pacs_url = "http://localhost:8042"
    
    try:
        # 1. 모든 스터디 목록 가져오기
        studies_response = requests.get(f"{pacs_url}/studies", timeout=10)
        studies_response.raise_for_status()
        studies = studies_response.json()
        
        # 2. 각 스터디를 확인해서 해당 Study UID 찾기
        for study_id in studies:
            try:
                study_response = requests.get(f"{pacs_url}/studies/{study_id}", timeout=10)
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
    pacs_url = "http://localhost:8042"
    
    try:
        # 먼저 환자 정보를 가져와서 PACS 스터디 ID 얻기
        patient_info = get_patient_info_from_pacs(study_uid)
        if not patient_info:
            return []
        
        pacs_study_id = patient_info['pacs_study_id']
        
        # 스터디 상세 정보에서 시리즈 목록 가져오기
        study_response = requests.get(f"{pacs_url}/studies/{pacs_study_id}", timeout=10)
        study_response.raise_for_status()
        study_data = study_response.json()
        
        series_list = study_data.get('Series', [])
        series_info_list = []
        
        for series_id in series_list:
            try:
                series_response = requests.get(f"{pacs_url}/series/{series_id}", timeout=10)
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
        response = requests.get("http://localhost:8042/studies", timeout=5)
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
    study_uid = "1.2.276.0.7230010.3.1.2.948861420.9340.1748700703.257"
    print(f"\n환자 정보 조회 테스트: {study_uid}")
    patient_info = get_patient_info_from_pacs(study_uid)
    
    if patient_info:
        print("✅ 환자 정보 조회 성공!")
        for key, value in patient_info.items():
            print(f"  {key}: {value}")
    else:
        print("❌ 환자 정보 조회 실패")