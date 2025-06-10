import os
import sys

def patch_dicom_mapper():
    """DicomPatientMapper 파일 패치"""
    
    # 파일 경로
    mapper_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 
        'medical_integration', 
        'dicom_patient_mapper.py'
    )
    
    if not os.path.exists(mapper_file):
        print(f"❌ 파일을 찾을 수 없습니다: {mapper_file}")
        return False
    
    # 백업 생성
    backup_file = mapper_file + '.backup'
    
    try:
        # 원본 파일 읽기
        with open(mapper_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 백업 저장
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 백업 생성: {backup_file}")
        
        # 기존 함수 찾기 및 교체
        old_function_start = "def extract_patient_info_from_dicom(self, dicom_data):"
        
        if old_function_start not in content:
            print("❌ 대상 함수를 찾을 수 없습니다")
            return False
        
        # 새 함수 코드
        new_function = '''def extract_patient_info_from_dicom(self, dicom_data):
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
            return None'''
        
        # 기존 함수의 끝을 찾기 (다음 def 또는 class까지)
        lines = content.split('\n')
        start_idx = -1
        end_idx = -1
        
        for i, line in enumerate(lines):
            if old_function_start in line:
                start_idx = i
            elif start_idx != -1 and (line.strip().startswith('def ') or line.strip().startswith('class ')) and not line.strip().startswith('def _'):
                end_idx = i
                break
        
        if start_idx == -1:
            print("❌ 함수 시작점을 찾을 수 없습니다")
            return False
        
        if end_idx == -1:
            end_idx = len(lines)
        
        # 함수 교체
        new_lines = lines[:start_idx] + [new_function] + lines[end_idx:]
        new_content = '\n'.join(new_lines)
        
        # 수정된 파일 저장
        with open(mapper_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ 파일 패치 완료: {mapper_file}")
        print("✅ 이제 다시 테스트를 실행하세요!")
        
        return True
        
    except Exception as e:
        print(f"❌ 패치 실패: {e}")
        return False

if __name__ == "__main__":
    print("🔧 DicomPatientMapper bytes 파싱 문제 수정 패치")
    print("=" * 50)
    
    if patch_dicom_mapper():
        print("\n🎉 패치 완료! 이제 테스트를 다시 실행하세요:")
        print("python scripts/fixed_dicom_test.py")
    else:
        print("\n❌ 패치 실패")