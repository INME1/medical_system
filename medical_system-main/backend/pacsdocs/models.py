# from django.db import models
# from django.utils import timezone
# from worklists.models import StudyRequest

# class DocumentType(models.Model):
#     """서류 종류 마스터 테이블"""
    
#     code = models.CharField(
#         max_length=20, 
#         unique=True, 
#         verbose_name="서류 코드",
#         help_text="예: consent, report, export, consultation, certificate"
#     )
#     name = models.CharField(
#         max_length=50, 
#         verbose_name="서류명",
#         help_text="예: 조영제 동의서, 판독 결과지"
#     )
#     requires_signature = models.BooleanField(
#         default=False,
#         verbose_name="서명 필요",
#         help_text="True: 서명+스캔 필요, False: 바로 발급"
#     )
#     is_active = models.BooleanField(
#         default=True,
#         verbose_name="사용 여부"
#     )
#     sort_order = models.IntegerField(
#         default=0,
#         verbose_name="정렬 순서"
#     )
#     description = models.TextField(
#         blank=True,
#         verbose_name="설명"
#     )
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

#     class Meta:
#         ordering = ['sort_order', 'code']
#         verbose_name = "서류 종류"
#         verbose_name_plural = "서류 종류"

#     def __str__(self):
#         return f"{self.name} ({self.code})"


# class DocumentRequest(models.Model):
#     """개별 서류 요청"""
    
#     STATUS_CHOICES = [
#         ('pending', '대기'),
#         ('selected', '선택됨'),
#         ('generated', '생성됨'),
#         ('signature_waiting', '서명대기'),
#         ('scan_waiting', '스캔대기'),
#         ('completed', '완료'),
#         ('cancelled', '취소'),
#     ]
    
#     study_request = models.ForeignKey(
#         StudyRequest,
#         on_delete=models.CASCADE,
#         related_name='document_requests',
#         verbose_name="검사 요청"
#     )
#     document_type = models.ForeignKey(
#         DocumentType,
#         on_delete=models.CASCADE,
#         related_name='document_requests',
#         verbose_name="서류 종류"
#     )
#     status = models.CharField(
#         max_length=20,
#         choices=STATUS_CHOICES,
#         default='pending',
#         verbose_name="상태"
#     )
    
#     # 시간 정보
#     requested_at = models.DateTimeField(
#         auto_now_add=True,
#         verbose_name="요청 일시"
#     )
#     generated_at = models.DateTimeField(
#         null=True, blank=True,
#         verbose_name="생성 일시"
#     )
#     completed_at = models.DateTimeField(
#         null=True, blank=True,
#         verbose_name="완료 일시"
#     )
    
#     # 파일 관련
#     generated_file_path = models.CharField(
#         max_length=500,
#         null=True, blank=True,
#         verbose_name="생성된 파일 경로"
#     )
#     scanned_file_path = models.CharField(
#         max_length=500,
#         null=True, blank=True,
#         verbose_name="스캔된 파일 경로"
#     )
    
#     # 처리자 정보
#     processed_by = models.CharField(
#         max_length=100,
#         null=True, blank=True,
#         verbose_name="처리자"
#     )
    
#     # 추가 정보
#     notes = models.TextField(
#         blank=True,
#         verbose_name="비고"
#     )
    
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

#     class Meta:
#         ordering = ['-created_at']
#         verbose_name = "서류 요청"
#         verbose_name_plural = "서류 요청"
#         # 동일한 검사에 동일한 서류 종류는 한 번만 요청 가능
#         unique_together = ['study_request', 'document_type']

#     def __str__(self):
#         return f"{self.study_request.patient_name} - {self.document_type.name} ({self.get_status_display()})"
    
#     # 상태 변경 메서드들
#     def mark_selected(self, processed_by=None):
#         """선택됨으로 상태 변경"""
#         self.status = 'selected'
#         self.processed_by = processed_by
#         self.save()
    
#     def mark_generated(self, file_path=None, processed_by=None):
#         """생성됨으로 상태 변경"""
#         self.status = 'generated'
#         self.generated_at = timezone.now()
#         if file_path:
#             self.generated_file_path = file_path
#         if processed_by:
#             self.processed_by = processed_by
#         self.save()
    
#     def mark_signature_waiting(self, processed_by=None):
#         """서명대기로 상태 변경 (동의서 등)"""
#         self.status = 'signature_waiting'
#         self.generated_at = timezone.now()
#         if processed_by:
#             self.processed_by = processed_by
#         self.save()
    
#     def mark_scan_waiting(self, processed_by=None):
#         """스캔대기로 상태 변경"""
#         self.status = 'scan_waiting'
#         if processed_by:
#             self.processed_by = processed_by
#         self.save()
    
#     def mark_completed(self, file_path=None, processed_by=None):
#         """완료로 상태 변경"""
#         self.status = 'completed'
#         self.completed_at = timezone.now()
#         if file_path:
#             if self.document_type.requires_signature:
#                 self.scanned_file_path = file_path
#             else:
#                 self.generated_file_path = file_path
#         if processed_by:
#             self.processed_by = processed_by
#         self.save()
    
#     def mark_cancelled(self, processed_by=None):
#         """취소로 상태 변경"""
#         self.status = 'cancelled'
#         if processed_by:
#             self.processed_by = processed_by
#         self.save()
    
#     # 상태 확인 메서드들
#     def can_be_selected(self):
#         """선택 가능한 상태인지 확인"""
#         return self.status == 'pending'
    
#     def can_be_generated(self):
#         """생성 가능한 상태인지 확인"""
#         return self.status in ['pending', 'selected']
    
#     def can_be_completed(self):
#         """완료 가능한 상태인지 확인"""
#         if self.document_type.requires_signature:
#             return self.status in ['signature_waiting', 'scan_waiting']
#         else:
#             return self.status in ['selected', 'generated']
    
#     @property
#     def requires_signature(self):
#         """서명이 필요한 서류인지"""
#         return self.document_type.requires_signature


# class DocumentTemplate(models.Model):
#     """서류 템플릿 (나중에 확장용)"""
    
#     document_type = models.OneToOneField(
#         DocumentType,
#         on_delete=models.CASCADE,
#         related_name='template',
#         verbose_name="서류 종류"
#     )
#     template_content = models.TextField(
#         verbose_name="템플릿 내용",
#         help_text="HTML 템플릿 또는 마크다운"
#     )
#     is_active = models.BooleanField(
#         default=True,
#         verbose_name="사용 여부"
#     )
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

#     class Meta:
#         verbose_name = "서류 템플릿"
#         verbose_name_plural = "서류 템플릿"

#     def __str__(self):
#         return f"{self.document_type.name} 템플릿"

# models.py에 추가할 내용

from django.db import models
from django.utils import timezone
from worklists.models import StudyRequest

class DocumentType(models.Model):
    """서류 종류 마스터 테이블"""
    
    code = models.CharField(
        max_length=20, 
        unique=True, 
        verbose_name="서류 코드",
        help_text="예: consent, report, export, consultation, certificate"
    )
    name = models.CharField(
        max_length=50, 
        verbose_name="서류명",
        help_text="예: 조영제 동의서, 판독 결과지"
    )
    requires_signature = models.BooleanField(
        default=False,
        verbose_name="서명 필요",
        help_text="True: 서명+스캔 필요, False: 바로 발급"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="사용 여부"
    )
    sort_order = models.IntegerField(
        default=0,
        verbose_name="정렬 순서"
    )
    description = models.TextField(
        blank=True,
        verbose_name="설명"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

    class Meta:
        ordering = ['sort_order', 'code']
        verbose_name = "서류 종류"
        verbose_name_plural = "서류 종류"

    def __str__(self):
        return f"{self.name} ({self.code})"


class DocumentRequest(models.Model):
    """개별 서류 요청"""
    
    STATUS_CHOICES = [
        ('pending', '대기'),
        ('selected', '선택됨'),
        ('generated', '생성됨'),
        ('signature_waiting', '서명대기'),
        ('scan_waiting', '스캔대기'),
        ('completed', '완료'),
        ('cancelled', '취소'),
    ]
    
    study_request = models.ForeignKey(
        StudyRequest,
        on_delete=models.CASCADE,
        related_name='document_requests',
        verbose_name="검사 요청"
    )
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name='document_requests',
        verbose_name="서류 종류"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="상태"
    )
    
    # 시간 정보
    requested_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="요청 일시"
    )
    generated_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="생성 일시"
    )
    completed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="완료 일시"
    )
    
    # 🔥 기존 파일 관련 필드들
    generated_file_path = models.CharField(
        max_length=500,
        null=True, blank=True,
        verbose_name="생성된 파일 경로"
    )
    scanned_file_path = models.CharField(
        max_length=500,
        null=True, blank=True,
        verbose_name="스캔된 파일 경로"
    )
    
    # 🔥 새로 추가할 파일 업로드 필드들
    uploaded_file = models.FileField(
        upload_to='documents/uploads/%Y/%m/%d/',
        null=True, blank=True,
        verbose_name="업로드된 파일",
        help_text="환자가 서명한 동의서 스캔 파일"
    )
    original_filename = models.CharField(
        max_length=255,
        null=True, blank=True,
        verbose_name="원본 파일명"
    )
    file_size = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="파일 크기 (바이트)"
    )
    upload_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="업로드 일시"
    )
    
    # 처리자 정보
    processed_by = models.CharField(
        max_length=100,
        null=True, blank=True,
        verbose_name="처리자"
    )
    
    # 추가 정보
    notes = models.TextField(
        blank=True,
        verbose_name="비고"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "서류 요청"
        verbose_name_plural = "서류 요청"
        unique_together = ['study_request', 'document_type']

    def __str__(self):
        return f"{self.study_request.patient_name} - {self.document_type.name} ({self.get_status_display()})"
    
    # 🔥 파일 업로드 관련 메서드 추가
    def mark_uploaded(self, uploaded_file, processed_by=None):
        """파일 업로드 완료로 상태 변경"""
        self.uploaded_file = uploaded_file
        self.original_filename = uploaded_file.name
        self.file_size = uploaded_file.size
        self.upload_date = timezone.now()
        self.status = 'completed'
        self.completed_at = timezone.now()
        if processed_by:
            self.processed_by = processed_by
        self.save()
    
    def has_uploaded_file(self):
        """업로드된 파일이 있는지 확인"""
        return bool(self.uploaded_file)
    
    @property
    def file_url(self):
        """업로드된 파일 URL 반환"""
        if self.uploaded_file:
            return self.uploaded_file.url
        return None
    
    # 기존 상태 변경 메서드들...
    def mark_selected(self, processed_by=None):
        """선택됨으로 상태 변경"""
        self.status = 'selected'
        self.processed_by = processed_by
        self.save()
    
    def mark_generated(self, file_path=None, processed_by=None):
        """생성됨으로 상태 변경"""
        self.status = 'generated'
        self.generated_at = timezone.now()
        if file_path:
            self.generated_file_path = file_path
        if processed_by:
            self.processed_by = processed_by
        self.save()
    
    def mark_signature_waiting(self, processed_by=None):
        """서명대기로 상태 변경 (동의서 등)"""
        self.status = 'signature_waiting'
        self.generated_at = timezone.now()
        if processed_by:
            self.processed_by = processed_by
        self.save()
    
    def mark_scan_waiting(self, processed_by=None):
        """스캔대기로 상태 변경"""
        self.status = 'scan_waiting'
        if processed_by:
            self.processed_by = processed_by
        self.save()
    
    def mark_completed(self, file_path=None, processed_by=None):
        """완료로 상태 변경"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if file_path:
            if self.document_type.requires_signature:
                self.scanned_file_path = file_path
            else:
                self.generated_file_path = file_path
        if processed_by:
            self.processed_by = processed_by
        self.save()
    
    def mark_cancelled(self, processed_by=None):
        """취소로 상태 변경"""
        self.status = 'cancelled'
        if processed_by:
            self.processed_by = processed_by
        self.save()
    
    # 상태 확인 메서드들
    def can_be_selected(self):
        """선택 가능한 상태인지 확인"""
        return self.status == 'pending'
    
    def can_be_generated(self):
        """생성 가능한 상태인지 확인"""
        return self.status in ['pending', 'selected']
    
    def can_be_completed(self):
        """완료 가능한 상태인지 확인"""
        if self.document_type.requires_signature:
            return self.status in ['signature_waiting', 'scan_waiting']
        else:
            return self.status in ['selected', 'generated']
    
    @property
    def requires_signature(self):
        """서명이 필요한 서류인지"""
        return self.document_type.requires_signature


class DocumentTemplate(models.Model):
    """서류 템플릿 (나중에 확장용)"""
    
    document_type = models.OneToOneField(
        DocumentType,
        on_delete=models.CASCADE,
        related_name='template',
        verbose_name="서류 종류"
    )
    template_content = models.TextField(
        verbose_name="템플릿 내용",
        help_text="HTML 템플릿 또는 마크다운"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="사용 여부"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

    class Meta:
        verbose_name = "서류 템플릿"
        verbose_name_plural = "서류 템플릿"

    def __str__(self):
        return f"{self.document_type.name} 템플릿"