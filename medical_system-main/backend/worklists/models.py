from django.db import models
from django.utils import timezone

class StudyRequest(models.Model):
    # === 성별 선택지 수정 ===
    GENDER_CHOICES = [
        ('M', '남성'),
        ('F', '여성'),
    ]
    
    # === 모달리티 선택지 (기존 유지) ===
    MODALITY_CHOICES = [
        ('CR', 'CR (X-ray)'),
        ('CT', 'CT (Computed Tomography)'),
        ('MR', 'MR (MRI)'),
        ('US', 'US (Ultrasound)'),
        ('NM', 'NM (Nuclear Medicine)'),
        ('PT', 'PT (PET Scan)'),
        ('DX', 'DX (Digital Radiography)'),
        ('XA', 'XA (Angiography)'),
        ('MG', 'MG (Mammography)'),
    ]
    
    # === 상태 흐름에 맞는 선택지로 변경 ===
    EXAM_STATUS_CHOICES = [
        ('대기', '대기'),                    # 1. 요청 등록 (기존 requested)
        ('검사대기', '검사대기'),              # 2. 스케줄링 완료 (노란색 표시)
        ('검사중', '검사중'),                 # 3. 검사 진행중 (기존 in_progress)
        ('검사완료', '검사완료'),              # 4. 검사 완료 (기존 completed)
        ('취소', '취소'),                    # 취소된 경우
    ]
    
    REPORT_STATUS_CHOICES = [
        ('대기', '대기'),                    # 1,2,3단계 (기존 requested)
        ('작성중', '작성중'),                # 4단계 검사완료 후 (기존 in_progress)
        ('작성완료', '작성완료'),             # 5단계 레포트 완료 (기존 completed)
    ]
    
    PRIORITY_CHOICES = [
        ('일반', '일반'),
        ('응급', '응급'),
        ('긴급', '긴급'),
    ]
    
    # === 환자 기본 정보 (기존 유지) ===
    patient_id = models.CharField(max_length=20, verbose_name="환자 ID")
    patient_name = models.CharField(max_length=100, verbose_name="환자명")
    birth_date = models.DateField(verbose_name="생년월일")
    sex = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="성별")
    
    # === 검사 요청 정보 (기존 유지) ===
    body_part = models.CharField(max_length=50, verbose_name="검사 부위")
    modality = models.CharField(max_length=20, choices=MODALITY_CHOICES, verbose_name="검사 장비")
    request_datetime = models.DateTimeField(auto_now_add=True, verbose_name="요청 일시")
    requesting_physician = models.CharField(max_length=100, verbose_name="의뢰의")
    
    # === 우선순위 추가 ===
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='일반', verbose_name="우선순위")
    
    # === 상태 정보 (수정) ===
    study_status = models.CharField(
        max_length=20,
        choices=EXAM_STATUS_CHOICES,
        default='대기',  # requested → 대기로 변경
        verbose_name="검사 상태"
    )
    
    report_status = models.CharField(
        max_length=20,
        choices=REPORT_STATUS_CHOICES,
        default='대기',  # requested → 대기로 변경
        verbose_name="리포트 상태"
    )
    
    # === 스케줄링 정보 추가 (드래그앤드롭시 저장) ===
    assigned_room = models.ForeignKey(
        'schedules.ExamRoom', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        verbose_name="배정 검사실"
    )
    assigned_radiologist = models.ForeignKey(
        'doctors.Doctor', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        verbose_name="배정 판독의(영상전문의)"
    )
    
    # === 시간 정보 (기존 + 추가) ===
    scheduled_exam_datetime = models.DateTimeField(null=True, blank=True, verbose_name="예약 검사 시간")
    scheduled_end_time = models.DateTimeField(null=True, blank=True, verbose_name="예약 종료 시간")
    estimated_duration = models.IntegerField(null=True, blank=True, verbose_name="예상 소요시간(분)")
    
    # 실제 검사 시간 추가
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name="실제 시작 시간")
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name="실제 종료 시간")
    
    # === 기존 필드 유지 ===
    interpreting_physician = models.CharField(max_length=100, null=True, blank=True, verbose_name="판독의")
    study_uid = models.CharField(max_length=100, null=True, blank=True, verbose_name="검사 UID")
    accession_number = models.CharField(max_length=100, null=True, blank=True, verbose_name="접수 번호")
    
    # === 추가 정보 ===
    notes = models.TextField(blank=True, verbose_name="특이사항")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, verbose_name="수정일시")

    class Meta:
        ordering = ['-request_datetime']  # 최신 요청순 정렬
        verbose_name = "검사 요청"
        verbose_name_plural = "검사 요청들"

    def __str__(self):
        return f"{self.patient_name} - {self.body_part} {self.modality} ({self.study_status})"
    
    # === 유틸리티 메서드 ===
    def can_be_scheduled(self):
        """스케줄링 가능한 상태인지 확인"""
        return self.study_status == '대기'
    
    def can_start_exam(self):
        """검사 시작 가능한 상태인지 확인"""
        return self.study_status == '검사대기'
    
    def can_complete_exam(self):
        """검사 완료 가능한 상태인지 확인"""
        return self.study_status == '검사중'
    
    def assign_schedule(self, room, radiologist, start_time, duration):
        """스케줄 배정 (드래그앤드롭시 호출)"""
        from datetime import timedelta
        
        self.assigned_room = room
        self.assigned_radiologist = radiologist
        self.scheduled_exam_datetime = start_time
        self.estimated_duration = duration
        self.scheduled_end_time = start_time + timedelta(minutes=duration)
        self.study_status = '검사대기'  # 상태 변경
        self.interpreting_physician = radiologist.name  # 판독의 이름 저장
        self.save()
        
        # 🆕 배정 판독의(영상전문의)의 개인일정에도 자동으로 추가
        from schedules.models import PersonalSchedule
        
        # 기존 검사 일정이 있다면 삭제 (재배정 시)
        PersonalSchedule.objects.filter(
            study_request=self,
            schedule_type='검사'
        ).delete()
        
        # 새로운 검사 일정 생성
        PersonalSchedule.objects.create(
            doctor=radiologist,
            title=f"{self.patient_name} - {self.body_part} {self.modality} 검사",
            datetime=start_time,
            end_datetime=self.scheduled_end_time,
            description=f"환자ID: {self.patient_id}\n검사실: {room.name}\n예상시간: {duration}분",
            schedule_type='검사',
            study_request=self,
            exam_room=room
        )
    
    def start_exam(self):
        """검사 시작"""
        self.actual_start_time = timezone.now()
        self.study_status = '검사중'
        self.save()
    
    def complete_exam(self):
        """검사 완료"""
        self.actual_end_time = timezone.now()
        self.study_status = '검사완료'
        self.report_status = '작성중'
        self.save()
    
    def complete_report(self):
        """리포트 작성 완료"""
        self.report_status = '작성완료'
        self.save()
    
    def cancel_schedule(self):
        """스케줄 취소 (대기 상태로 되돌리기)"""
        # 연결된 개인일정도 함께 삭제
        from schedules.models import PersonalSchedule
        PersonalSchedule.objects.filter(
            study_request=self,
            schedule_type='검사'
        ).delete()
        
        # 스케줄 정보 초기화
        self.assigned_room = None
        self.assigned_radiologist = None
        self.scheduled_exam_datetime = None
        self.scheduled_end_time = None
        self.estimated_duration = None
        self.interpreting_physician = None
        self.study_status = '대기'
        self.save()