# backend/scripts/fixed_dicom_test.py
"""
수정된 DICOM 더미 데이터 생성 및 매핑 테스트
bytes 파싱 문제 해결
"""

import os
import sys
import django
import pydicom
from io import BytesIO
from datetime import datetime
import random
import tempfile

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from medical_integration.orthanc_api import OrthancAPI
from medical_integration.dicom_patient_mapper import DicomPatientMapper

def create_simple_dicom(patient_id, patient_name="Test^Patient", modality="CR"):
    """간단한 DICOM 파일 생성"""
    
    ds = pydicom.Dataset()
    
    # 필수 태그들
    ds.SOPClassUID = "1.2.840.10008.5.1.4.1.1.1"  # CR Image Storage
    ds.SOPInstanceUID = f"1.2.826.0.1.3680043.8.498.{datetime.now().strftime('%Y%m%d%H%M%S')}.{random.randint(1000,9999)}"
    
    # 환자 정보 - 핵심은 PatientID
    ds.PatientID = patient_id  # 🔥 React에서 등록한 patient_identifier와 매칭
    ds.PatientName = patient_name
    ds.PatientBirthDate = "19900101"
    ds.PatientSex = "M"
    
    # Study 정보
    ds.StudyInstanceUID = f"1.2.826.0.1.3680043.8.498.{datetime.now().strftime('%Y%m%d%H%M%S')}"
    ds.StudyDate = datetime.now().strftime('%Y%m%d')
    ds.StudyTime = datetime.now().strftime('%H%M%S')
    ds.StudyDescription = f"{modality} Study"
    ds.AccessionNumber = f"ACC{datetime.now().strftime('%H%M%S')}"  # 16자 제한
    
    # Series 정보
    ds.SeriesInstanceUID = f"1.2.826.0.1.3680043.8.498.{datetime.now().strftime('%Y%m%d%H%M%S')}.1"
    ds.SeriesNumber = "1"
    ds.Modality = modality
    
    # Instance 정보
    ds.InstanceNumber = "1"
    
    # 최소한의 이미지 정보
    ds.Rows = 256
    ds.Columns = 256
    ds.BitsAllocated = 8
    ds.BitsStored = 8
    ds.HighBit = 7
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    
    # 더미 픽셀 데이터
    pixel_data = bytes([128] * (256 * 256))
    ds.PixelData = pixel_data
    
    # File Meta
    ds.file_meta = pydicom.Dataset()
    ds.file_meta.MediaStorageSOPClassUID = ds.SOPClassUID
    ds.file_meta.MediaStorageSOPInstanceUID = ds.SOPInstanceUID
    ds.file_meta.TransferSyntaxUID = pydicom.uid.ExplicitVRLittleEndian
    
    return ds

def dicom_to_bytes(ds):
    """DICOM을 바이트로 변환 (임시 파일 사용)"""
    with tempfile.NamedTemporaryFile(suffix='.dcm', delete=False) as temp_file:
        ds.save_as(temp_file.name, enforce_file_format=True)
        temp_file_path = temp_file.name
    
    try:
        with open(temp_file_path, 'rb') as f:
            dicom_bytes = f.read()
        return dicom_bytes
    finally:
        # 임시 파일 삭제
        try:
            os.unlink(temp_file_path)
        except:
            pass

def test_dicom_upload_and_mapping():
    """DICOM 업로드 및 매핑 테스트"""
    
    print("🔥 DICOM 더미 데이터 생성 및 매핑 테스트 (수정된 버전)")
    print("=" * 60)
    
    orthanc_api = OrthancAPI()
    mapper = DicomPatientMapper()
    
    # Orthanc 연결 확인
    if not orthanc_api.test_connection():
        print("❌ Orthanc 연결 실패")
        return
    
    print("✅ Orthanc 연결 성공")
    
    # 테스트할 Patient ID들 (React에서 등록한 환자들)
    test_cases = [
        {"patient_id": "P001", "name": "Smith^John", "modality": "CR"},
        {"patient_id": "P002", "name": "Wilson^Jane", "modality": "CT"}, 
        {"patient_id": "DCM001", "name": "Brown^Michael", "modality": "MR"},
        {"patient_id": "PATIENT123", "name": "Davis^Sarah", "modality": "US"}
    ]
    
    results = []
    
    for case in test_cases:
        print(f"\n📤 테스트: {case['patient_id']} - {case['modality']}")
        
        try:
            # 1. DICOM 생성
            ds = create_simple_dicom(
                patient_id=case['patient_id'],
                patient_name=case['name'], 
                modality=case['modality']
            )
            
            # 2. 바이트로 변환 (임시 파일 사용)
            dicom_bytes = dicom_to_bytes(ds)
            print(f"  📁 DICOM 바이트 생성: {len(dicom_bytes)} bytes")
            
            # 3. 바이트에서 DICOM 정보 추출 테스트
            try:
                with tempfile.NamedTemporaryFile(suffix='.dcm', delete=False) as temp_file:
                    temp_file.write(dicom_bytes)
                    temp_file_path = temp_file.name
                
                # pydicom으로 읽기 테스트
                test_ds = pydicom.dcmread(temp_file_path)
                print(f"  🔍 DICOM 파싱 테스트: PatientID={test_ds.PatientID}, Name={test_ds.PatientName}")
                
                # 임시 파일 삭제
                os.unlink(temp_file_path)
                
            except Exception as e:
                print(f"  ❌ DICOM 파싱 테스트 실패: {e}")
                continue
            
            # 4. Orthanc에 업로드
            upload_result = orthanc_api.upload_dicom(dicom_bytes)
            
            if not upload_result:
                print(f"  ❌ Orthanc 업로드 실패")
                results.append({"patient_id": case['patient_id'], "upload": False, "mapping": False})
                continue
            
            print(f"  ✅ Orthanc 업로드 성공: {upload_result.get('ID')}")
            print(f"     Orthanc Patient ID: {upload_result.get('ParentPatient')}")
            
            # 5. 자동 매핑 시도
            mapping_result = mapper.process_dicom_upload(dicom_bytes, upload_result)
            
            if mapping_result['success']:
                print(f"  ✅ 자동 매핑 성공!")
                if 'mapping' in mapping_result:
                    print(f"     매핑 ID: {mapping_result['mapping']['mapping_id']}")
                    print(f"     신뢰도: {mapping_result['mapping'].get('confidence_score', 'N/A')}")
                results.append({
                    "patient_id": case['patient_id'], 
                    "upload": True, 
                    "mapping": True, 
                    "mapping_id": mapping_result['mapping']['mapping_id']
                })
            else:
                print(f"  ❌ 자동 매핑 실패: {mapping_result.get('message', 'Unknown')}")
                print(f"     오류 타입: {mapping_result.get('error_type', 'Unknown')}")
                
                # 매핑 실패 상세 정보
                if 'dicom_info' in mapping_result:
                    dicom_info = mapping_result['dicom_info']
                    print(f"     추출된 Patient ID: {dicom_info.get('patient_identifier', 'N/A')}")
                    print(f"     추출된 이름: {dicom_info.get('formatted_name', 'N/A')}")
                
                results.append({
                    "patient_id": case['patient_id'], 
                    "upload": True, 
                    "mapping": False, 
                    "error": mapping_result.get('message')
                })
                
        except Exception as e:
            print(f"  ❌ 테스트 실패: {e}")
            results.append({"patient_id": case['patient_id'], "upload": False, "mapping": False, "error": str(e)})
    
    # 결과 요약
    print(f"\n📊 테스트 결과 요약")
    print("=" * 50)
    
    total = len(results)
    successful_uploads = len([r for r in results if r.get('upload')])
    successful_mappings = len([r for r in results if r.get('mapping')])
    
    print(f"총 테스트: {total}")
    print(f"업로드 성공: {successful_uploads}/{total}")
    print(f"매핑 성공: {successful_mappings}/{total}")
    
    print(f"\n📋 상세 결과:")
    for result in results:
        status = "✅" if result.get('mapping') else "❌"
        print(f"  {result['patient_id']}: {status}")
        if result.get('error'):
            print(f"    └─ {result['error']}")
        elif result.get('mapping_id'):
            print(f"    └─ 매핑 ID: {result['mapping_id']}")
    
    # 추가 디버깅 정보
    if successful_mappings == 0:
        print(f"\n🔍 매핑 실패 원인 분석:")
        print("1. React에서 환자 등록했는지 확인")
        print("2. patient_identifier가 정확한지 확인")
        print("3. OpenMRS 연결 상태 확인")

if __name__ == "__main__":
    test_dicom_upload_and_mapping()