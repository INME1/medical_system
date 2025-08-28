from django.db import models
from django.utils import timezone


class NoticeBaseModel(models.Model):
    """공지사항 기본 모델 (추상 클래스)"""
    NOTICE_TYPES = [
        ('important', '중요'),
        ('update', '업데이트'),
        ('maintenance', '점검'),
        ('general', '일반'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='제목')
    content = models.TextField(verbose_name='내용')
    notice_type = models.CharField(
        max_length=20, 
        choices=NOTICE_TYPES, 
        default='general',
        verbose_name='공지 유형'
    )
    is_active = models.BooleanField(default=True, verbose_name='활성화')
    is_pinned = models.BooleanField(default=False, verbose_name='상단 고정')
    created_by = models.CharField(max_length=100, default='admin', verbose_name='작성자')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='작성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')
    start_date = models.DateTimeField(default=timezone.now, verbose_name='시작일')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='종료일')
    views = models.IntegerField(default=0, verbose_name='조회수')
    
    class Meta:
        abstract = True  # 🔧 추상 클래스로 설정
        ordering = ['-is_pinned', 'notice_type', '-created_at']  # 🔧 notice_type으로 정렬
    
    def __str__(self):
        return f"[{self.get_notice_type_display()}] {self.title}"
    
    def is_valid(self):
        """현재 시간에 유효한 공지인지 확인"""
        now = timezone.now()
        if self.end_date and now > self.end_date:
            return False
        return self.is_active and now >= self.start_date
    
    def increment_views(self):
        """조회수 증가"""
        self.views += 1
        self.save(update_fields=['views'])


class NoticeCommon(NoticeBaseModel):
    """시스템 공지사항"""
    
    class Meta:
        verbose_name = "시스템 공지사항"
        verbose_name_plural = "시스템 공지사항들"
        ordering = ['-is_pinned', 'notice_type', '-created_at']  # 🔧 notice_type으로 정렬
        db_table = "notice_common"
    
    def __str__(self):
        prefix = "[시스템] "
        if self.notice_type == 'important':  # 🔧 notice_type으로 확인
            prefix += "[중요] "
        return f"{prefix}{self.title}"


class NoticeRIS(NoticeBaseModel):
    """영상의학과 공지사항"""
    
    # RIS 전용 필드 추가 가능
    target_department = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name='대상 부서'
    )
    
    class Meta:
        verbose_name = "영상의학과 공지사항"
        verbose_name_plural = "영상의학과 공지사항들"
        ordering = ['-is_pinned', 'notice_type', '-created_at']  # 🔧 notice_type으로 정렬
        db_table = "notice_ris"
    
    def __str__(self):
        prefix = "[영상의학과] "  # 🔧 prefix 변수 정의
        if self.notice_type == 'important':  # 🔧 notice_type으로 확인
            prefix += "[중요] "
        if self.target_department:
            prefix += f"[{self.target_department}] "
        return f"{prefix}{self.title}"


# 매니저 클래스 추가 (선택사항)
class ActiveNoticeManager(models.Manager):
    """활성화된 공지사항만 조회하는 매니저"""
    def get_queryset(self):
        now = timezone.now()
        return super().get_queryset().filter(
            is_active=True,
            start_date__lte=now
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gt=now)
        )
    
    def important_notices(self):
        """중요 공지사항만 조회"""
        return self.get_queryset().filter(notice_type='important')  # 🔧 notice_type으로 확인
    
    def pinned_notices(self):
        """상단 고정 공지사항만 조회"""
        return self.get_queryset().filter(is_pinned=True)

