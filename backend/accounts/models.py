import uuid
from django.db import models
from django.contrib.auth.models import User

from django.db import models
from django.contrib.auth.models import User
import uuid

def generate_unique_code():
    return uuid.uuid4().hex[:8]

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('doctor', '의사'),
        ('admin', '관리자'),
        ('receptionist', '접수'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=20, unique=True, editable=False)
    last_auto_login = models.DateTimeField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='receptionist')  # ✅ 직책 필드 추가

    def save(self, *args, **kwargs):
        if not self.code:
            new_code = generate_unique_code()
            while UserProfile.objects.filter(code=new_code).exists():
                new_code = generate_unique_code()
            self.code = new_code
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.username} ({self.get_role_display()})'

# 추후 위치 수정 예정
class Notice(models.Model):
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class LoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    ip_address = models.GenericIPAddressField()
    success = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)
