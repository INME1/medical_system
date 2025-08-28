# backend/main_page_function/models.py

from django.db import models
from django.utils import timezone

class Notice(models.Model):
    """공지사항 모델"""
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
    created_by = models.CharField(max_length=100, verbose_name='작성자')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='작성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')
    start_date = models.DateTimeField(default=timezone.now, verbose_name='시작일')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='종료일')
    views = models.IntegerField(default=0, verbose_name='조회수')  # 조회수 필드 추가
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = '공지사항'
        verbose_name_plural = '공지사항'
    
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


class DoctorStats(models.Model):
    """의사별 통계 캐시 모델"""
    doctor_id = models.CharField(max_length=100, verbose_name='의사 ID')
    doctor_name = models.CharField(max_length=100, verbose_name='의사 이름')
    department = models.CharField(max_length=100, verbose_name='진료과')
    today_patients = models.IntegerField(default=0, verbose_name='오늘 진료 환자 수')
    waiting_patients = models.IntegerField(default=0, verbose_name='대기 환자 수')
    total_appointments = models.IntegerField(default=0, verbose_name='총 예약 수')
    status = models.CharField(
        max_length=20,
        choices=[
            ('online', '온라인'),
            ('busy', '진료중'),
            ('break', '휴식'),
            ('offline', '오프라인'),
        ],
        default='online',
        verbose_name='상태'
    )
    last_updated = models.DateTimeField(auto_now=True, verbose_name='마지막 업데이트')
    
    class Meta:
        unique_together = ['doctor_id']
        verbose_name = '의사 통계'
        verbose_name_plural = '의사 통계'
    
    def __str__(self):
        return f"{self.doctor_name} ({self.department}) - {self.today_patients}명"