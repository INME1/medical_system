# backend/openmrs_models/obs_models.py

from django.db import models
from .models import Person, Patient, Encounter  # 기존 모델 import

class ConceptClass(models.Model):
    """Concept 분류 (Diagnosis, Drug, Finding, Procedure 등)"""
    concept_class_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=255, null=True, blank=True)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    retired = models.BooleanField(default=False)
    retired_by = models.IntegerField(null=True, blank=True)
    date_retired = models.DateTimeField(null=True, blank=True)
    retire_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'concept_class'
        app_label = 'openmrs_models'

    def __str__(self):
        return self.name

class ConceptDatatype(models.Model):
    """Concept 데이터 타입 (Text, Numeric, Boolean, Coded 등)"""
    concept_datatype_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    hl7_abbreviation = models.CharField(max_length=3, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    retired = models.BooleanField(default=False)
    retired_by = models.IntegerField(null=True, blank=True)
    date_retired = models.DateTimeField(null=True, blank=True)
    retire_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'concept_datatype'
        app_label = 'openmrs_models'

    def __str__(self):
        return self.name

class Concept(models.Model):
    """OpenMRS Concept 테이블 - 모든 의료 개념의 기본"""
    concept_id = models.AutoField(primary_key=True)
    retired = models.BooleanField(default=False)
    short_name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    form_text = models.TextField(null=True, blank=True)
    
    # 🔥 ForeignKey 관계로 수정
    datatype = models.ForeignKey(
        ConceptDatatype, 
        on_delete=models.CASCADE, 
        db_column='datatype_id',
        related_name='concepts'
    )
    concept_class = models.ForeignKey(
        ConceptClass, 
        on_delete=models.CASCADE, 
        db_column='class_id',
        related_name='concepts'
    )
    
    is_set = models.BooleanField(default=False)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    version = models.CharField(max_length=50, null=True, blank=True)
    changed_by = models.IntegerField(null=True, blank=True)
    date_changed = models.DateTimeField(null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'concept'
        app_label = 'openmrs_models'

    def __str__(self):
        return self.short_name or f"Concept {self.concept_id}"

    def get_preferred_name(self, locale='en'):
        """선호 이름 가져오기"""
        preferred_name = self.names.filter(
            locale=locale, 
            locale_preferred=True
        ).first()
        return preferred_name.name if preferred_name else self.short_name

    def is_diagnosis(self):
        """진단 관련 Concept인지 확인"""
        return self.concept_class.name in ['Diagnosis', 'Finding', 'Symptom']

    def is_drug(self):
        """약물 관련 Concept인지 확인"""
        return self.concept_class.name in ['Drug', 'Medication']


class ConceptName(models.Model):
    """Concept 이름 (다국어 지원)"""
    concept_name_id = models.AutoField(primary_key=True)
    concept = models.ForeignKey(
        Concept, 
        on_delete=models.CASCADE, 
        related_name='names',
        db_column='concept_id'
    )
    name = models.CharField(max_length=255)
    locale = models.CharField(max_length=50, default='en')
    locale_preferred = models.BooleanField(default=False)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    concept_name_type = models.CharField(max_length=50, null=True, blank=True)  # FULLY_SPECIFIED, SHORT, SYNONYM
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'concept_name'
        app_label = 'openmrs_models'

    def __str__(self):
        return f"{self.name} ({self.locale})"

class Obs(models.Model):
    """OpenMRS Obs 테이블 - 핵심 관찰 데이터"""
    obs_id = models.AutoField(primary_key=True)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='observations')
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='observations')
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, null=True, blank=True, related_name='observations')
    
    # 주문/처방 관련
    order_id = models.IntegerField(null=True, blank=True)
    
    # 시간 및 위치
    obs_datetime = models.DateTimeField()
    location_id = models.IntegerField(null=True, blank=True)
    
    # 그룹화
    obs_group_id = models.IntegerField(null=True, blank=True)
    value_group_id = models.IntegerField(null=True, blank=True)
    
    # Accession Number (영상의학과에서 중요)
    accession_number = models.CharField(max_length=255, null=True, blank=True)
    
    # 다양한 데이터 타입 값들
    value_boolean = models.BooleanField(null=True, blank=True)
    value_coded = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='coded_observations', null=True, blank=True)
    value_coded_name_id = models.IntegerField(null=True, blank=True)
    value_drug = models.IntegerField(null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)
    value_numeric = models.DecimalField(max_digits=25, decimal_places=10, null=True, blank=True)
    value_modifier = models.CharField(max_length=2, null=True, blank=True)
    value_text = models.TextField(null=True, blank=True)
    value_complex = models.TextField(null=True, blank=True)
    
    # 추가 정보
    comments = models.TextField(null=True, blank=True)
    
    # 메타데이터
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)
    previous_version = models.IntegerField(null=True, blank=True)
    form_namespace_and_path = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=16, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'obs'
        app_label = 'openmrs_models'
        indexes = [
            models.Index(fields=['person', 'concept']),
            models.Index(fields=['obs_datetime']),
            models.Index(fields=['encounter']),
            models.Index(fields=['concept', 'value_coded']),
        ]

    def __str__(self):
        return f"{self.person} - {self.concept} ({self.obs_datetime})"
    
    def get_display_value(self):
        """Obs 값을 표시용으로 포맷팅"""
        if self.value_numeric is not None:
            return f"{self.value_numeric}"
        elif self.value_text:
            return self.value_text
        elif self.value_boolean is not None:
            return "예" if self.value_boolean else "아니오"
        elif self.value_datetime:
            return self.value_datetime.strftime('%Y-%m-%d %H:%M')
        elif self.value_coded:
            return str(self.value_coded)
        else:
            return "값 없음"
    
    def get_concept_name(self, locale='ko'):
        """Concept 이름을 특정 언어로 가져오기"""
        try:
            concept_name = self.concept.names.filter(
                locale=locale, 
                locale_preferred=True
            ).first()
            
            if concept_name:
                return concept_name.name
            
            # 선호 locale이 없으면 영어로 fallback
            concept_name = self.concept.names.filter(
                locale='en', 
                locale_preferred=True
            ).first()
            
            return concept_name.name if concept_name else self.concept.short_name
            
        except:
            return self.concept.short_name or f"Concept {self.concept.concept_id}"
    
    def is_radiology_related(self):
        """영상의학과 관련 Obs인지 확인"""
        radiology_concepts = [5497, 5498, 5499, 5500, 5501, 5502, 5503, 5504, 5505, 5506]
        return self.concept_id in radiology_concepts
    
    def get_priority_level(self):
        """우선순위 레벨 반환"""
        if self.concept_id == 5506:  # Study Priority
            priority_map = {
                'URGENT': 'urgent',
                'HIGH': 'high', 
                'NORMAL': 'normal',
                'ROUTINE': 'normal',
                'LOW': 'low'
            }
            return priority_map.get(self.value_text, 'normal')
        return 'normal'
    
    def extract_modality(self):
        """Obs에서 Modality 추출"""
        modality_map = {
            5497: 'CR',      # Chest X-Ray Order
            5498: 'CT',      # CT Scan Order  
            5499: 'MR',      # MRI Order
            5500: 'US',      # Ultrasound Order
            5501: 'MG',      # Mammography Order
        }
        return modality_map.get(self.concept_id, 'OT')
    
    def extract_body_part(self):
        """Obs에서 검사 부위 추출"""
        if self.value_text:
            text_lower = self.value_text.lower()
            body_parts = {
                'chest': 'CHEST',
                'abdomen': 'ABDOMEN', 
                'pelvis': 'PELVIS',
                'head': 'HEAD',
                'brain': 'HEAD',
                'spine': 'SPINE',
                'extremity': 'EXTREMITY',
                'arm': 'EXTREMITY',
                'leg': 'EXTREMITY',
                'hand': 'EXTREMITY',
                'foot': 'EXTREMITY'
            }
            
            for key, value in body_parts.items():
                if key in text_lower:
                    return value
        
        # Concept별 기본 부위
        default_parts = {
            5497: 'CHEST',    # Chest X-Ray
            5498: 'ABDOMEN',  # CT Scan (기본값)
            5499: 'HEAD',     # MRI (기본값)
            5500: 'ABDOMEN',  # Ultrasound (기본값)
            5501: 'BREAST',   # Mammography
        }
        
        return default_parts.get(self.concept_id, 'UNKNOWN')

class ObsManager(models.Manager):
    """Obs 전용 Manager"""
    
    def radiology_orders(self):
        """영상의학과 처방 관련 Obs만 조회"""
        radiology_concepts = [5497, 5498, 5499, 5500, 5501]  # 처방 관련 concept들
        return self.filter(
            concept_id__in=radiology_concepts,
            voided=False
        ).select_related('person', 'concept', 'encounter')
    
    def for_patient(self, patient_uuid):
        """특정 환자의 Obs 조회"""
        return self.filter(
            person__uuid=patient_uuid,
            voided=False
        ).select_related('person', 'concept', 'encounter')
    
    def clinical_data(self, patient_uuid=None):
        """임상 데이터 (바이탈, 검사결과 등)"""
        clinical_concepts = [
            5085, 5086, 5087, 5088, 5089, 5090,  # 바이탈 사인
            5095, 5096, 5097, 5098,              # 검사 결과
        ]
        
        queryset = self.filter(
            concept_id__in=clinical_concepts,
            voided=False
        ).order_by('-obs_datetime')
        
        if patient_uuid:
            queryset = queryset.filter(person__uuid=patient_uuid)
            
        return queryset.select_related('person', 'concept')
    
    def recent_orders(self, days=7):
        """최근 N일간의 처방들"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.radiology_orders().filter(
            obs_datetime__gte=cutoff_date
        ).order_by('-obs_datetime')

# Obs 모델에 커스텀 Manager 추가

class Drug(models.Model):
    """OpenMRS Drug 테이블 - 약물 정보"""
    drug_id = models.AutoField(primary_key=True)
    concept = models.ForeignKey(
        Concept, 
        on_delete=models.CASCADE, 
        related_name='drugs',
        db_column='concept_id'
    )
    name = models.CharField(max_length=255, null=True, blank=True)
    combination = models.BooleanField(default=False)
    
    # 복용 형태 (tablet, capsule, liquid 등)
    dosage_form = models.ForeignKey(
        Concept, 
        on_delete=models.CASCADE, 
        related_name='dosage_form_drugs',
        null=True, 
        blank=True,
        db_column='dosage_form'
    )
    
    # 용량 정보
    dose_strength = models.CharField(max_length=255, null=True, blank=True)
    maximum_daily_dose = models.FloatField(null=True, blank=True)
    minimum_daily_dose = models.FloatField(null=True, blank=True)
    
    # 투여 경로 (oral, IV, IM 등)
    route = models.ForeignKey(
        Concept, 
        on_delete=models.CASCADE, 
        related_name='route_drugs',
        null=True, 
        blank=True,
        db_column='route'
    )
    
    units = models.CharField(max_length=50, null=True, blank=True)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    retired = models.BooleanField(default=False)
    retired_by = models.IntegerField(null=True, blank=True)
    date_retired = models.DateTimeField(null=True, blank=True)
    retire_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'drug'
        app_label = 'openmrs_models'

    def __str__(self):
        return self.name or f"Drug {self.drug_id}"

    @property
    def strength(self):
        """용량 정보 반환"""
        return self.dose_strength or ''

    @property
    def display_name(self):
        """표시용 이름 (약물명 + 용량)"""
        name = self.name or self.concept.get_preferred_name()
        if self.dose_strength:
            return f"{name} {self.dose_strength}"
        return name

class ConceptWithRelations(models.Model):
    """Concept 모델에 관계 추가된 버전 (임시용)"""
    concept_id = models.AutoField(primary_key=True)
    retired = models.BooleanField(default=False)
    short_name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    form_text = models.TextField(null=True, blank=True)
    datatype = models.ForeignKey(ConceptDatatype, on_delete=models.CASCADE, db_column='datatype_id', null=True, blank=True)
    concept_class = models.ForeignKey(ConceptClass, on_delete=models.CASCADE, db_column='class_id', null=True, blank=True)
    is_set = models.BooleanField(default=False)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    version = models.CharField(max_length=50, null=True, blank=True)
    changed_by = models.IntegerField(null=True, blank=True)
    date_changed = models.DateTimeField(null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'concept'
        app_label = 'openmrs_models'

    def __str__(self):
        return self.short_name or f"Concept {self.concept_id}"

class ConceptManager(models.Manager):
    """Concept 전용 Manager"""
    
    def diagnosis_concepts(self):
        """진단 관련 Concept들"""
        return self.filter(
            concept_class__name__in=['Diagnosis', 'Finding', 'Symptom'],
            retired=False
        )
    
    def drug_concepts(self):
        """약물 관련 Concept들"""
        return self.filter(
            concept_class__name__in=['Drug', 'Medication'],
            retired=False
        )
    
    def search_by_name(self, query):
        """이름으로 검색"""
        return self.filter(
            names__name__icontains=query,
            retired=False
        ).distinct()


class DrugManager(models.Manager):
    """Drug 전용 Manager"""
    
    def active_drugs(self):
        """활성 약물들"""
        return self.filter(retired=False)
    
    def search_by_name(self, query):
        """이름으로 검색"""
        return self.filter(
            models.Q(name__icontains=query) |
            models.Q(concept__names__name__icontains=query),
            retired=False
        ).distinct()


# Manager 추가
Concept.add_to_class('objects', ConceptManager())
Drug.add_to_class('objects', DrugManager())
Obs.add_to_class('objects', ObsManager())