from django.db import models

class Notification(models.Model):
    TYPE_CHOICES = [
        ('appointment', '검사 배정'),
        ('result', '판독 결과'),
        ('emergency', '응급 촬영'),
        ('system', '시스템'),
        ('meeting', '회의'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="제목")
    message = models.TextField(verbose_name="메시지")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="알림 타입")
    recipient = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, verbose_name="수신자")
    is_read = models.BooleanField(default=False, verbose_name="읽음 여부")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    
    class Meta:
        verbose_name = "알림"
        verbose_name_plural = "알림들"
        ordering = ['-created_at']
        db_table = "notifications"
    
    def __str__(self):
        return f"{self.title} - {self.recipient.name}"

class Message(models.Model):
    sender = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, related_name='sent_messages', verbose_name="발신자")
    recipient = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, related_name='received_messages', verbose_name="수신자")
    content = models.TextField(verbose_name="메시지 내용")
    is_read = models.BooleanField(default=False, verbose_name="읽음 여부")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="발송일시")
    
    class Meta:
        verbose_name = "메시지"
        verbose_name_plural = "메시지들"
        ordering = ['-created_at']
        db_table = "messages"
    
    def __str__(self):
        return f"{self.sender.name} → {self.recipient.name}: {self.content[:50]}"