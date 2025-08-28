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

    STATUS_CHOICES = [
        ('waiting', '대기 중'),
        ('in_progress', '진료 중'),
        ('complete', '진료 완료'),
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
    
    # 🔥 추가 필드들
    display = models.CharField(max_length=255, null=True, blank=True, help_text="환자 표시명")
    gender = models.CharField(max_length=1, choices=[('M', '남성'), ('F', '여성')], null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    assigned_room = models.IntegerField(null=True, blank=True, default=None, help_text="배정된 진료실 번호")
    
    # 🔥 완료 관련 새 필드 추가
    completion_date = models.DateTimeField(null=True, blank=True, help_text="진료 완료 날짜/시간")
    wait_start_time = models.DateTimeField(null=True, blank=True, help_text="대기 시작 시간")
    treatment_start_time = models.DateTimeField(null=True, blank=True, help_text="진료 시작 시간")
    total_wait_minutes = models.IntegerField(null=True, blank=True, help_text="총 대기 시간(분)")

    class Meta:
        db_table = 'patient_mapping'
        indexes = [
            models.Index(fields=['patient_identifier', 'is_active']),
            models.Index(fields=['created_date', 'mapping_type']),
            models.Index(fields=['openmrs_patient_uuid']),
            models.Index(fields=['status', 'is_active']),  # 🔥 상태 조회 최적화
            models.Index(fields=['assigned_room', 'is_active']),  # 🔥 진료실 조회 최적화
            models.Index(fields=['completion_date']),  # 🔥 완료 일시 조회 최적화
        ]
        ordering = ['-created_date']

    def __str__(self):
        return f"Mapping {self.mapping_id}: {self.display or self.patient_identifier}"

    def save(self, *args, **kwargs):
        # 🔥 자동으로 대기 시작 시간 설정 (처음 생성시)
        if not self.pk and not self.wait_start_time:
            self.wait_start_time = timezone.now()
        
        # 🔥 진료실 배정시 진료 시작 시간 설정
        if self.assigned_room and not self.treatment_start_time:
            self.treatment_start_time = timezone.now()
            self.status = 'in_progress'
        
        # 🔥 진료 완료시 완료 시간 및 총 대기시간 계산
        if self.status == 'complete' and not self.completion_date:
            self.completion_date = timezone.now()
            if self.wait_start_time:
                total_duration = self.completion_date - self.wait_start_time
                self.total_wait_minutes = int(total_duration.total_seconds() / 60)
        
        super().save(*args, **kwargs)

    def get_wait_time_minutes(self):
        """현재까지의 대기 시간 계산 (분 단위)"""
        if self.total_wait_minutes:  # 이미 완료된 경우
            return self.total_wait_minutes
        
        if self.wait_start_time:
            if self.completion_date:  # 완료된 경우
                duration = self.completion_date - self.wait_start_time
            else:  # 아직 진행 중인 경우
                duration = timezone.now() - self.wait_start_time
            return int(duration.total_seconds() / 60)
        
        return 0

    def get_treatment_duration_minutes(self):
        """진료 시간 계산 (분 단위)"""
        if self.treatment_start_time:
            if self.completion_date:
                duration = self.completion_date - self.treatment_start_time
                return int(duration.total_seconds() / 60)
            elif self.assigned_room:  # 아직 진료 중
                duration = timezone.now() - self.treatment_start_time
                return int(duration.total_seconds() / 60)
        return 0

    def get_waiting_only_minutes(self):
        """순수 대기 시간 (진료실 배정 전까지의 시간)"""
        if self.wait_start_time and self.treatment_start_time:
            duration = self.treatment_start_time - self.wait_start_time
            return int(duration.total_seconds() / 60)
        elif self.wait_start_time and not self.treatment_start_time:
            # 아직 배정되지 않은 경우
            duration = timezone.now() - self.wait_start_time
            return int(duration.total_seconds() / 60)
        return 0

    @property
    def age(self):
        """나이 계산"""
        if self.birthdate:
            today = timezone.now().date()
            return today.year - self.birthdate.year - ((today.month, today.day) < (self.birthdate.month, self.birthdate.day))
        return None

    @property
    def is_waiting(self):
        """대기 중인지 확인"""
        return self.is_active and self.status == 'waiting' and not self.assigned_room

    @property
    def is_in_treatment(self):
        """진료 중인지 확인"""
        return self.is_active and self.assigned_room and self.status in ['waiting', 'in_progress']

    @property
    def is_completed(self):
        """완료되었는지 확인"""
        return self.status == 'complete' or not self.is_active

    @classmethod
    def get_today_waiting(cls):
        """오늘 대기 중인 환자들"""
        today = timezone.now().date()
        return cls.objects.filter(
            is_active=True,
            mapping_type='IDENTIFIER_BASED',
            assigned_room__isnull=True,
            created_date__date=today,
            status__in=['waiting']
        ).order_by('created_date')

    @classmethod
    def get_today_assigned(cls):
        """오늘 진료실에 배정된 환자들"""
        today = timezone.now().date()
        return cls.objects.filter(
            is_active=True,
            mapping_type='IDENTIFIER_BASED',
            assigned_room__isnull=False,
            created_date__date=today,
            status__in=['waiting', 'in_progress']
        ).order_by('assigned_room')

    @classmethod
    def get_today_completed(cls):
        """오늘 완료된 환자들"""
        today = timezone.now().date()
        return cls.objects.filter(
            status='complete',
            is_active=False,
            mapping_type='IDENTIFIER_BASED',
            created_date__date=today
        ).order_by('-completion_date')

    @classmethod
    def get_waiting_statistics(cls):
        """오늘의 대기 현황 통계"""
        today = timezone.now().date()
        
        # 현재 대기 중
        waiting_count = cls.objects.filter(
            is_active=True,
            mapping_type='IDENTIFIER_BASED',
            assigned_room__isnull=True,
            created_date__date=today,
            status='waiting'
        ).count()
        
        # 현재 진료 중
        in_treatment_count = cls.objects.filter(
            is_active=True,
            mapping_type='IDENTIFIER_BASED',
            assigned_room__isnull=False,
            created_date__date=today,
            status__in=['waiting', 'in_progress']
        ).count()
        
        # 오늘 완료
        completed_count = cls.objects.filter(
            status='complete',
            mapping_type='IDENTIFIER_BASED',
            created_date__date=today
        ).count()
        
        # 오늘 총 등록
        total_registered = cls.objects.filter(
            mapping_type='IDENTIFIER_BASED',
            created_date__date=today
        ).count()
        
        return {
            'waiting': waiting_count,
            'in_treatment': in_treatment_count,
            'completed': completed_count,
            'total_registered': total_registered,
            'completion_rate': round((completed_count / total_registered * 100), 1) if total_registered > 0 else 0
        }

    def complete_treatment(self):
        """진료 완료 처리"""
        self.status = 'complete'
        self.assigned_room = None
        self.is_active = False
        self.completion_date = timezone.now()
        self.last_sync = timezone.now()
        
        # 총 대기시간 계산
        if self.wait_start_time:
            total_duration = self.completion_date - self.wait_start_time
            self.total_wait_minutes = int(total_duration.total_seconds() / 60)
        
        self.save(update_fields=['status', 'assigned_room', 'is_active', 'completion_date', 'last_sync', 'total_wait_minutes'])
        
        logger.info(f"✅ 진료 완료: {self.display or self.patient_identifier} (총 {self.total_wait_minutes}분)")

    def assign_to_room(self, room_number):
        """진료실 배정"""
        self.assigned_room = room_number
        self.status = 'in_progress'
        self.treatment_start_time = timezone.now()
        self.last_sync = timezone.now()
        
        self.save(update_fields=['assigned_room', 'status', 'treatment_start_time', 'last_sync'])
        
        logger.info(f"✅ 진료실 배정: {self.display or self.patient_identifier} → {room_number}번실")

    def unassign_from_room(self):
        """진료실 배정 해제 (대기 상태로 복귀)"""
        old_room = self.assigned_room
        self.assigned_room = None
        self.status = 'waiting'
        self.treatment_start_time = None  # 진료 시작 시간 초기화
        self.last_sync = timezone.now()
        
        self.save(update_fields=['assigned_room', 'status', 'treatment_start_time', 'last_sync'])
        
        logger.info(f"✅ 배정 해제: {self.display or self.patient_identifier} ({old_room}번실 → 대기)")

    @classmethod
    def create_identifier_based_mapping(cls, orthanc_patient_id, openmrs_patient_uuid, patient_identifier):
        """Patient ID 기반 매핑 생성 (개선된 버전)"""
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

            # 🔥 새로운 필드들 포함하여 매핑 생성
            mapping = cls.objects.create(
                orthanc_patient_id=orthanc_patient_id,
                openmrs_patient_uuid=openmrs_patient_uuid,
                patient_identifier=patient_identifier,
                mapping_type="IDENTIFIER_BASED",
                assigned_room=None,
                sync_status="PENDING",
                display=full_name,
                gender=gender,
                birthdate=birthdate,
                status='waiting',  # 기본 상태: 대기
                wait_start_time=timezone.now(),  # 🔥 대기 시작 시간 자동 설정
                is_active=True
            )

            logger.info(f"✅ 환자 매핑 생성: {full_name} (ID: {patient_identifier})")
            return mapping

        except Exception as e:
            logger.error(f"❌ Patient ID 기반 매핑 생성 실패: {e}")
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
    
class CDSSResult(models.Model):
    patient_mapping = models.ForeignKey(
        PatientMapping,
        on_delete=models.CASCADE,
        related_name='cdss_results',
        help_text='예측 대상이 된 환자 매핑 정보'
    )
    panel = models.CharField(max_length=50)
    prediction = models.CharField(max_length=16)
    explanation = models.TextField(blank=True, null=True)
    results = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    shap_values = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'cdss_result'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient_mapping.patient_identifier} - {self.panel} : {self.prediction}"
