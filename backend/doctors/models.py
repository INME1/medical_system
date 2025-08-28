from django.db import models

class Doctor(models.Model):
    name = models.CharField(max_length=100, verbose_name="이름")
    department = models.CharField(max_length=100, default="영상의학과", verbose_name="진료과")
    medical_id = models.CharField(max_length=50, unique=True, verbose_name="의료진식별번호")
    role = models.CharField(max_length=50, default="의사", verbose_name="역할")
    status = models.CharField(
        max_length=20, 
        choices=[('온라인', '온라인'), ('자리비움', '자리비움')],
        default='온라인',
        verbose_name="상태"
    )
    email = models.EmailField(blank=True, verbose_name="이메일")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "의사"
        verbose_name_plural = "의사들"
        db_table = "doctors"
    
    def __str__(self):
        return f"{self.name} ({self.role})"