# openmrs_models/serializers.py - SOAP 진단 시리얼라이저

from rest_framework import serializers
from soap.models import SoapDiagnosis, PatientVisitHistory, DiagnosisImageMapping
from django.utils import timezone

class DiagnosisImageMappingSerializer(serializers.ModelSerializer):
    """진단-영상 매핑 시리얼라이저"""
    
    class Meta:
        model = DiagnosisImageMapping
        fields = [
            'uuid', 'study_instance_uid', 'series_instance_uid', 
            'sop_instance_uid', 'orthanc_study_id', 'orthanc_series_id',
            'annotations', 'roi_coordinates', 'created_date', 'is_active'
        ]
        read_only_fields = ['uuid', 'created_date']


class SoapDiagnosisSerializer(serializers.ModelSerializer):
    """SOAP 진단 정보 시리얼라이저"""
    
    image_mappings = DiagnosisImageMappingSerializer(many=True, read_only=True)
    soap_type_display = serializers.CharField(source='get_soap_type_display', read_only=True)
    diagnosis_type_display = serializers.CharField(source='get_diagnosis_type_display', read_only=True)
    
    # 추가 영상 정보 필드
    study_images = serializers.SerializerMethodField()
    
    class Meta:
        model = SoapDiagnosis
        fields = [
            'uuid', 'patient_uuid', 'encounter_uuid', 'soap_type', 'soap_type_display',
            'sequence_number', 'diagnosis_type', 'diagnosis_type_display', 
            'icd10_code', 'icd10_name', 'content', 'clinical_notes',
            'concept_uuid', 'obs_uuid', 'study_instance_uid', 'series_instance_uid',
            'image_annotations', 'doctor_uuid', 'created_date', 'last_modified',
            'is_active', 'image_mappings', 'study_images'
        ]
        read_only_fields = ['uuid', 'obs_uuid', 'created_date', 'last_modified']
    
    def get_study_images(self, obj):
        """연관된 DICOM 영상 정보 조회"""
        if not obj.study_instance_uid:
            return []
        
        try:
            from medical_integration.orthanc_api import OrthancAPI
            orthanc_api = OrthancAPI()
            
            # Study 정보 조회
            study_info = orthanc_api.get_study_by_uid(obj.study_instance_uid)
            if study_info:
                return {
                    'study_id': study_info.get('ID'),
                    'patient_name': study_info.get('PatientName'),
                    'study_date': study_info.get('StudyDate'),
                    'modality': study_info.get('MainDicomTags', {}).get('Modality'),
                    'series_count': len(study_info.get('Series', []))
                }
        except Exception as e:
            print(f"영상 정보 조회 실패: {e}")
        
        return None
    
    def create(self, validated_data):
        """SOAP 진단 생성 시 자동 OpenMRS 저장"""
        soap_diagnosis = super().create(validated_data)
        
        # OpenMRS에 자동 저장 시도
        try:
            soap_diagnosis.save_to_openmrs()
        except Exception as e:
            print(f"OpenMRS 자동 저장 실패: {e}")
        
        return soap_diagnosis
    
    def validate(self, data):
        """데이터 유효성 검증"""
        # ICD-10 코드 형식 검증
        if data.get('icd10_code'):
            icd10_code = data['icd10_code'].upper()
            if not icd10_code.replace('.', '').replace('-', '').isalnum():
                raise serializers.ValidationError({
                    'icd10_code': 'ICD-10 코드 형식이 올바르지 않습니다.'
                })
            data['icd10_code'] = icd10_code
        
        # Assessment 타입인 경우 진단 정보 필수
        if data.get('soap_type') == 'A':
            if not data.get('icd10_code') and not data.get('content'):
                raise serializers.ValidationError({
                    'content': 'Assessment는 진단 내용 또는 ICD-10 코드가 필요합니다.'
                })
        
        return data


class PatientVisitHistorySerializer(serializers.ModelSerializer):
    """환자 내원이력 시리얼라이저"""
    
    soap_diagnoses = SoapDiagnosisSerializer(source='get_soap_diagnoses', many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # SOAP 타입별 진단 정보
    subjective_notes = serializers.SerializerMethodField()
    objective_findings = serializers.SerializerMethodField()
    assessment_diagnoses = serializers.SerializerMethodField()
    plan_treatments = serializers.SerializerMethodField()
    
    # 통계 정보
    total_diagnoses = serializers.SerializerMethodField()
    imaging_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientVisitHistory
        fields = [
            'uuid', 'patient_uuid', 'visit_uuid', 'encounter_uuid',
            'visit_date', 'visit_type', 'status', 'status_display',
            'chief_complaint', 'department', 'doctor_uuid',
            'primary_diagnosis', 'secondary_diagnoses', 'prescriptions', 'procedures',
            'imaging_studies', 'created_date', 'last_modified',
            'soap_diagnoses', 'subjective_notes', 'objective_findings',
            'assessment_diagnoses', 'plan_treatments', 'total_diagnoses', 'imaging_count'
        ]
        read_only_fields = ['uuid', 'created_date', 'last_modified']
    
    def get_subjective_notes(self, obj):
        """주관적 정보 (S) 조회"""
        return [
            {
                'content': diag.content,
                'sequence': diag.sequence_number,
                'created_date': diag.created_date
            }
            for diag in obj.get_diagnoses_by_soap_type('S')
        ]
    
    def get_objective_findings(self, obj):
        """객관적 소견 (O) 조회"""
        return [
            {
                'content': diag.content,
                'clinical_notes': diag.clinical_notes,
                'sequence': diag.sequence_number,
                'created_date': diag.created_date
            }
            for diag in obj.get_diagnoses_by_soap_type('O')
        ]
    
    def get_assessment_diagnoses(self, obj):
        """진단 평가 (A) 조회"""
        return [
            {
                'icd10_code': diag.icd10_code,
                'icd10_name': diag.icd10_name,
                'diagnosis_type': diag.diagnosis_type,
                'content': diag.content,
                'sequence': diag.sequence_number,
                'created_date': diag.created_date
            }
            for diag in obj.get_diagnoses_by_soap_type('A')
        ]
    
    def get_plan_treatments(self, obj):
        """치료 계획 (P) 조회"""
        return [
            {
                'content': diag.content,
                'clinical_notes': diag.clinical_notes,
                'sequence': diag.sequence_number,
                'created_date': diag.created_date
            }
            for diag in obj.get_diagnoses_by_soap_type('P')
        ]
    
    def get_total_diagnoses(self, obj):
        """총 진단 수"""
        return obj.get_soap_diagnoses().count()
    
    def get_imaging_count(self, obj):
        """연관된 영상 검사 수"""
        return obj.get_soap_diagnoses().exclude(
            study_instance_uid__isnull=True
        ).count()
    

class SoapDiagnosisCreateSerializer(serializers.ModelSerializer):
    """SOAP 진단 생성용 간소화 시리얼라이저"""
    
    # 배치 생성을 위한 필드들
    image_files = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="첨부할 영상 파일 목록"
    )
    
    auto_sequence = serializers.BooleanField(
        default=True,
        help_text="자동 순서 번호 할당"
    )
    
    class Meta:
        model = SoapDiagnosis
        fields = [
            'patient_uuid', 'encounter_uuid', 'soap_type', 'diagnosis_type',
            'icd10_code', 'icd10_name', 'content', 'clinical_notes',
            'study_instance_uid', 'series_instance_uid', 'image_annotations',
            'doctor_uuid', 'image_files', 'auto_sequence'
        ]
    
    def create(self, validated_data):
        """생성 시 자동 처리"""
        image_files = validated_data.pop('image_files', [])
        auto_sequence = validated_data.pop('auto_sequence', True)
        
        # 자동 순서 번호 할당
        if auto_sequence:
            existing_count = SoapDiagnosis.objects.filter(
                patient_uuid=validated_data['patient_uuid'],
                encounter_uuid=validated_data['encounter_uuid'],
                soap_type=validated_data['soap_type'],
                is_active=True
            ).count()
            validated_data['sequence_number'] = existing_count + 1
        
        # SOAP 진단 생성
        soap_diagnosis = super().create(validated_data)
        
        # 영상 파일 연결 처리
        if image_files:
            self._process_image_files(soap_diagnosis, image_files)
        
        # OpenMRS 저장
        soap_diagnosis.save_to_openmrs()
        
        return soap_diagnosis
    
    def _process_image_files(self, soap_diagnosis, image_files):
        """영상 파일 처리 및 매핑 생성"""
        try:
            from medical_integration.orthanc_api import OrthancAPI
            orthanc_api = OrthancAPI()
            
            for file_path in image_files:
                # Orthanc에서 Study UID 조회
                study_info = orthanc_api.search_study_by_filename(file_path)
                if study_info:
                    DiagnosisImageMapping.objects.create(
                        soap_diagnosis=soap_diagnosis,
                        study_instance_uid=study_info.get('StudyInstanceUID'),
                        series_instance_uid=study_info.get('SeriesInstanceUID'),
                        orthanc_study_id=study_info.get('ID')
                    )
        except Exception as e:
            print(f"영상 파일 처리 실패: {e}")