from django.db import models

from django.db import models
from django.utils import timezone
import uuid

class SoapDiagnosis(models.Model):
    """SOAP 형식 진단 정보 저장 모델 - OpenMRS Obs 기반"""
    
    SOAP_TYPE_CHOICES = [
        ('S', 'Subjective - 주관적 정보'),
        ('O', 'Objective - 객관적 정보'), 
        ('A', 'Assessment - 평가/진단'),
        ('P', 'Plan - 치료계획'),
    ]
    
    DIAGNOSIS_TYPE_CHOICES = [
        ('PRIMARY', '주진단'),
        ('SECONDARY', '부진단'),
        ('PROVISIONAL', '잠정진단'),
        ('DIFFERENTIAL', '감별진단'),
    ]
    
    # 기본 식별자
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_uuid = models.CharField(max_length=38, db_index=True, help_text="OpenMRS Patient UUID")
    encounter_uuid = models.CharField(max_length=38, db_index=True, help_text="OpenMRS Encounter UUID")
    
    # SOAP 분류
    soap_type = models.CharField(max_length=1, choices=SOAP_TYPE_CHOICES)
    sequence_number = models.IntegerField(default=1, help_text="같은 SOAP 타입 내 순서")
    
    # 진단 정보
    diagnosis_type = models.CharField(max_length=20, choices=DIAGNOSIS_TYPE_CHOICES, null=True, blank=True)
    icd10_code = models.CharField(max_length=10, null=True, blank=True, help_text="ICD-10 코드")
    icd10_name = models.CharField(max_length=255, null=True, blank=True, help_text="ICD-10 진단명")
    
    # 상세 내용
    content = models.TextField(help_text="SOAP 상세 내용")
    clinical_notes = models.TextField(null=True, blank=True, help_text="임상 메모")
    
    # OpenMRS 연동 정보
    concept_uuid = models.CharField(max_length=38, null=True, blank=True, help_text="OpenMRS Concept UUID")
    obs_uuid = models.CharField(max_length=38, null=True, blank=True, help_text="저장된 OpenMRS Obs UUID")
    
    # 의료영상 연동
    study_instance_uid = models.CharField(max_length=255, null=True, blank=True, help_text="DICOM Study UID")
    series_instance_uid = models.CharField(max_length=255, null=True, blank=True, help_text="DICOM Series UID")
    image_annotations = models.JSONField(null=True, blank=True, help_text="영상 주석 정보")
    
    # 메타데이터
    doctor_uuid = models.CharField(max_length=38, help_text="진단한 의사 UUID")
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        # 🔥 이 부분이 중요! managed = True (기본값)으로 설정
        managed = True  # 명시적으로 설정
        db_table = 'soap_diagnosis'
        ordering = ['created_date', 'soap_type', 'sequence_number']
        indexes = [
            models.Index(fields=['patient_uuid', 'encounter_uuid'], name='idx_soap_patient_encounter'),
            models.Index(fields=['icd10_code'], name='idx_soap_icd10'),
            models.Index(fields=['soap_type', 'sequence_number'], name='idx_soap_type_seq'),
            models.Index(fields=['doctor_uuid'], name='idx_soap_doctor'),
            models.Index(fields=['created_date'], name='idx_soap_created'),
        ]
        verbose_name = 'SOAP 진단'
        verbose_name_plural = 'SOAP 진단 목록'
    
    def __str__(self):
        return f"{self.get_soap_type_display()}: {self.icd10_name or self.content[:50]}"

    def save_to_openmrs(self):
        """OpenMRS Obs로 저장"""
        try:
            from medical_integration.openmrs_api import OpenMRSAPI
            
            api = OpenMRSAPI()
            
            # SOAP 타입별 Concept UUID 매핑
            soap_concepts = {
                'S': '160531AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',  # Subjective
                'O': '160532AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',  # Objective  
                'A': '159395AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',  # Assessment
                'P': '160533AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',  # Plan
            }
            
            obs_data = {
                'concept': soap_concepts.get(self.soap_type),
                'person': self.patient_uuid,
                'encounter': self.encounter_uuid,
                'value': self.content,
                'obsDatetime': self.created_date.isoformat(),
            }
            
            # ICD-10 코드가 있는 경우 추가 정보 저장
            if self.icd10_code:
                obs_data['comment'] = f"ICD-10: {self.icd10_code} - {self.icd10_name}"
            
            result = api.create_obs(obs_data)
            if result and 'uuid' in result:
                self.obs_uuid = result['uuid']
                self.save(update_fields=['obs_uuid'])
                return True
        except Exception as e:
            print(f"OpenMRS 저장 실패: {e}")
            return False
        
        return False

# Create your models here.
class PatientVisitHistory(models.Model):
    """환자 내원 이력 모델"""
    
    VISIT_STATUS_CHOICES = [
        ('SCHEDULED', '예약됨'),
        ('ARRIVED', '도착'),
        ('IN_PROGRESS', '진료중'),
        ('COMPLETED', '완료'),
        ('CANCELLED', '취소'),
        ('NO_SHOW', '미출석'),
    ]
    
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_uuid = models.CharField(max_length=38, db_index=True)
    visit_uuid = models.CharField(max_length=38, null=True, blank=True, help_text="OpenMRS Visit UUID")
    encounter_uuid = models.CharField(max_length=38, null=True, blank=True, help_text="OpenMRS Encounter UUID")
    
    # 방문 정보
    visit_date = models.DateTimeField(default=timezone.now)
    visit_type = models.CharField(max_length=50, default='OUTPATIENT')
    status = models.CharField(max_length=20, choices=VISIT_STATUS_CHOICES, default='SCHEDULED')
    
    # 진료 정보
    chief_complaint = models.TextField(null=True, blank=True, help_text="주요 증상")
    department = models.CharField(max_length=100, null=True, blank=True)
    doctor_uuid = models.CharField(max_length=38, null=True, blank=True)
    
    # 진단 요약
    primary_diagnosis = models.CharField(max_length=255, null=True, blank=True)
    secondary_diagnoses = models.JSONField(null=True, blank=True)
    
    # 처방 정보
    prescriptions = models.JSONField(null=True, blank=True)
    procedures = models.JSONField(null=True, blank=True)
    
    # 영상 검사
    imaging_studies = models.JSONField(null=True, blank=True, help_text="연관된 영상 검사 목록")
    
    # 메타데이터
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True  # 명시적으로 설정
        db_table = 'medical_platform_patient_visit_history'
        # app_label = 'openmrs_models'  # 명시적으로 앱 지정
        ordering = ['-visit_date']
        indexes = [
            models.Index(fields=['patient_uuid'], name='idx_visit_patient'),
            models.Index(fields=['visit_date'], name='idx_visit_date'),
            models.Index(fields=['encounter_uuid'], name='idx_visit_encounter'),
            models.Index(fields=['doctor_uuid'], name='idx_visit_doctor'),
        ]
        verbose_name = '환자 내원 이력'
        verbose_name_plural = '환자 내원 이력 목록'
    
    def __str__(self):
        return f"Visit {self.visit_date.strftime('%Y-%m-%d')} - {self.primary_diagnosis or 'No diagnosis'}"
    
    def get_soap_diagnoses(self):
        """해당 방문의 모든 SOAP 진단 정보 조회"""
        return SoapDiagnosis.objects.filter(
            patient_uuid=self.patient_uuid,
            encounter_uuid=self.encounter_uuid,
            is_active=True
        ).order_by('soap_type', 'sequence_number')
    
    def get_diagnoses_by_soap_type(self, soap_type):
        """특정 SOAP 타입의 진단 정보만 조회"""
        return self.get_soap_diagnoses().filter(soap_type=soap_type)


class DiagnosisImageMapping(models.Model):
    """진단과 의료영상 매핑 모델"""
    
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    soap_diagnosis = models.ForeignKey(
        SoapDiagnosis, 
        on_delete=models.CASCADE, 
        related_name='image_mappings',
        db_column='soap_diagnosis_id'  # 외래키 컬럼명 명시
    )
    
    # DICOM 정보
    study_instance_uid = models.CharField(max_length=255, db_index=True)
    series_instance_uid = models.CharField(max_length=255, null=True, blank=True)
    sop_instance_uid = models.CharField(max_length=255, null=True, blank=True)
    
    # Orthanc 정보
    orthanc_study_id = models.CharField(max_length=255, null=True, blank=True)
    orthanc_series_id = models.CharField(max_length=255, null=True, blank=True)
    orthanc_instance_id = models.CharField(max_length=255, null=True, blank=True)
    
    # 주석 정보
    annotations = models.JSONField(null=True, blank=True, help_text="영상 주석 및 마킹")
    roi_coordinates = models.JSONField(null=True, blank=True, help_text="관심 영역 좌표")
    
    # 메타데이터
    created_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        managed = True  # 명시적으로 설정
        db_table = 'diagnosis_image_mapping'
        app_label = 'openmrs_models'  # 명시적으로 앱 지정
        unique_together = [['soap_diagnosis', 'study_instance_uid', 'series_instance_uid']]
        indexes = [
            models.Index(fields=['soap_diagnosis'], name='idx_mapping_soap'),
            models.Index(fields=['study_instance_uid'], name='idx_mapping_study'),
            models.Index(fields=['orthanc_study_id'], name='idx_mapping_orthanc'),
        ]
        verbose_name = '진단-영상 매핑'
        verbose_name_plural = '진단-영상 매핑 목록'
    
    def __str__(self):
        return f"Image mapping for {self.soap_diagnosis}"


