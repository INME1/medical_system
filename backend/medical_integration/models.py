from django.db import models
from django.utils import timezone
from datetime import datetime
from django.utils.timezone import make_aware
import logging

from .openmrs_api import OpenMRSAPI  # ✅ 반드시 필요

logger = logging.getLogger('medical_integration')


class PatientMapping(models.Model):
    SYNC_STATUS_CHOICES = [
        ('PENDING', '대기중'),
        ('SYNCED', '동기화됨'),
        ('ERROR', '오류'),
        ('AUTO_MAPPED', '자동매핑됨'),
        ('MANUAL_MAPPED', '수동매핑됨'),
        ('IDENTIFIER_MATCHED', 'Patient ID 매칭됨'),
    ]

    MAPPING_TYPE_CHOICES = [
        ('AUTO', '자동'),
        ('MANUAL', '수동'),
        ('BATCH', '일괄'),
        ('IDENTIFIER_BASED', 'Patient ID 기반'),
    ]

    mapping_id = models.AutoField(primary_key=True)
    orthanc_patient_id = models.CharField(max_length=255, db_index=True)
    openmrs_patient_uuid = models.CharField(max_length=38, db_index=True)
    patient_identifier = models.CharField(max_length=255, db_index=True, null=True, blank=True)
    mapping_type = models.CharField(max_length=20, choices=MAPPING_TYPE_CHOICES, default='MANUAL')
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default='PENDING')
    confidence_score = models.FloatField(null=True, blank=True)
    mapping_criteria = models.JSONField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    error_message = models.TextField(null=True, blank=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    assigned_room = models.IntegerField(null=True, blank=True, help_text="진료실 번호")
    display = models.CharField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=1, null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    class Meta:
        db_table = 'patient_mapping'
        unique_together = [('orthanc_patient_id', 'openmrs_patient_uuid')]
        indexes = [
            models.Index(fields=['orthanc_patient_id']),
            models.Index(fields=['openmrs_patient_uuid']),
            models.Index(fields=['patient_identifier']),
            models.Index(fields=['created_date']),
            models.Index(fields=['last_sync']),
            models.Index(fields=['sync_status']),
            models.Index(fields=['mapping_type']),
            models.Index(fields=['confidence_score']),
        ]

    def __str__(self):
        return f"매핑({self.mapping_type}): Orthanc {self.orthanc_patient_id} -> OpenMRS {self.openmrs_patient_uuid} (ID: {self.patient_identifier})"

    def waiting_minutes(self):
        """생성 시간 기준으로 대기 시간을 분 단위로 계산"""
        if not self.created_date:
            return 0
        delta = timezone.now() - self.created_date
        return int(delta.total_seconds() // 60)

    @classmethod
    def get_identifier_based_mappings(cls):
        today_start = make_aware(datetime.combine(datetime.today(), datetime.min.time()))
        return cls.objects.filter(
            mapping_type='IDENTIFIER_BASED',
            is_active=True,
            created_date__gte=today_start
        ).exclude(patient_identifier__isnull=True)

    @classmethod
    def create_identifier_based_mapping(cls, orthanc_patient_id, openmrs_patient_uuid, patient_identifier):
        try:
            api = OpenMRSAPI()
            patient_info = api.get_patient(openmrs_patient_uuid)

            person = patient_info.get('person', {})
            preferred_name = person.get('preferredName', {})
            given = preferred_name.get('givenName', '').strip()
            family = preferred_name.get('familyName', '').strip()
            full_name = f"{given} {family}".strip()

            if not full_name:
                full_name = patient_identifier  # fallback

            gender = person.get('gender')
            birthdate_str = person.get('birthdate')
            birthdate = None
            if birthdate_str:
                birthdate = datetime.strptime(birthdate_str.split('T')[0], '%Y-%m-%d').date()

            mapping = cls.objects.create(
                orthanc_patient_id=orthanc_patient_id,
                openmrs_patient_uuid=openmrs_patient_uuid,
                patient_identifier=patient_identifier,
                mapping_type="IDENTIFIER_BASED",
                sync_status="PENDING",
                is_active=True,
                display=full_name,  # ✅ 핵심: display가 무조건 fallback까지 포함하도록 보장
                gender=gender,
                birthdate=birthdate
            )
            return mapping
        except Exception as e:
            logger.error(f"[IDENTIFIER_BASED] 매핑 생성 실패: {e}")
            return None




class Person(models.Model):
    uuid = models.CharField(max_length=38, primary_key=True)
    gender = models.CharField(max_length=1, null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.uuid}"


class Provider(models.Model):
    uuid = models.CharField(max_length=38, primary_key=True)
    identifier = models.CharField(max_length=255)
    person = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True, related_name='providers')
    retired = models.BooleanField(default=False)

    def __str__(self):
        return self.identifier


class Alert(models.Model):
    ALERT_TYPES = [
        ('SPO2', 'SpO₂ 경고'),
        ('DELAY', '검사 지역'),
        ('AI_ERR', 'AI 판단 오류'),
    ]
    type = models.CharField(max_length=10, choices=ALERT_TYPES, help_text='알림 종류 코드')
    message = models.TextField(help_text='알림 메시지')
    created_at = models.DateTimeField(auto_now_add=True, help_text='알림 생성 시간')
    is_read = models.BooleanField(default=False, help_text='읽음 유무')

    class Meta:
        db_table = 'alert'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.get_type_display()}] {self.message[:20]}…'
