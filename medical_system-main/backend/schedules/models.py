# from django.db import models

# class ScheduleCommon(models.Model):
#     title = models.CharField(max_length=200, verbose_name="일정명")
#     datetime = models.DateTimeField(verbose_name="일시")
#     end_datetime = models.DateTimeField(null=True, blank=True, verbose_name="종료 일시")
#     description = models.TextField(blank=True, verbose_name="설명")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         verbose_name = "전체 일정"
#         verbose_name_plural = "전체 일정들"
#         ordering = ['datetime']
#         db_table = "schedule_common"
    
#     def __str__(self):
#         return f"{self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"

# class ScheduleRIS(models.Model):
#     title = models.CharField(max_length=200, verbose_name="일정명")
#     datetime = models.DateTimeField(verbose_name="일시")
#     end_datetime = models.DateTimeField(null=True, blank=True, verbose_name="종료 일시")
#     description = models.TextField(blank=True, verbose_name="설명")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         verbose_name = "부서 일정"
#         verbose_name_plural = "부서 일정들"
#         ordering = ['datetime']
#         db_table = "schedule_ris"
    
#     def __str__(self):
#         return f"{self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"



# # === 검사실 모델 추가 ===
# class ExamRoom(models.Model):
#     ROOM_TYPE_CHOICES = [
#         ('CR', 'CR (X-ray)'),
#         ('CT', 'CT (Computed Tomography)'),
#         ('MR', 'MR (MRI)'),
#         ('US', 'US (Ultrasound)'),
#         ('NM', 'NM (Nuclear Medicine)'),
#         ('PT', 'PT (PET Scan)'),
#         ('DX', 'DX (Digital Radiography)'),
#         ('XA', 'XA (Angiography)'),
#         ('MG', 'MG (Mammography)'),
#     ]
    
#     room_id = models.CharField(max_length=20, unique=True, verbose_name="검사실 ID")
#     name = models.CharField(max_length=50, verbose_name="검사실명")
#     room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, verbose_name="검사실 유형")
#     is_active = models.BooleanField(default=True, verbose_name="사용 여부")
#     description = models.TextField(blank=True, verbose_name="설명")
#     created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
#     class Meta:
#         verbose_name = "검사실"
#         verbose_name_plural = "검사실들"
#         db_table = "exam_rooms"
#         ordering = ['room_id']
    
#     def __str__(self):
#         return f"{self.name} ({self.room_type})"
    

# class PersonalSchedule(models.Model):
#     SCHEDULE_TYPE_CHOICES = [
#         ('일반', '일반 일정'),
#         ('검사', '검사 일정'),
#     ]
    
#     doctor = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, verbose_name="담당의사")
#     title = models.CharField(max_length=200, verbose_name="일정명")
#     datetime = models.DateTimeField(verbose_name="일시")
#     end_datetime = models.DateTimeField(null=True, blank=True, verbose_name="종료 일시")
#     description = models.TextField(blank=True, verbose_name="설명")
#     is_completed = models.BooleanField(default=False, verbose_name="완료 여부")
    
#     # 새 필드들
#     schedule_type = models.CharField(max_length=10, choices=SCHEDULE_TYPE_CHOICES, default='일반', verbose_name="일정 유형")
#     study_request = models.ForeignKey('worklists.StudyRequest', null=True, blank=True, on_delete=models.CASCADE, verbose_name="연결된 검사 요청")
#     exam_room = models.ForeignKey(ExamRoom, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="검사실")
    
#     created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
#     class Meta:
#         verbose_name = "개인 일정"
#         verbose_name_plural = "개인 일정들"
#         ordering = ['datetime']
#         db_table = "schedule_personal"
    
#     def __str__(self):
#         if self.schedule_type == '검사' and self.study_request:
#             return f"{self.doctor.name}: {self.study_request.patient_name} {self.study_request.modality} 검사"
#         return f"{self.doctor.name}: {self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"
    
#     class Meta:
#         verbose_name = "개인 일정"
#         verbose_name_plural = "개인 일정들"
#         ordering = ['datetime']
#         db_table = "schedule_personal"
    
#     def __str__(self):
#         return f"{self.doctor.name}: {self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"

from django.db import models

class ScheduleCommon(models.Model):
    title = models.CharField(max_length=200, verbose_name="일정명")
    datetime = models.DateTimeField(verbose_name="일시")
    end_datetime = models.DateTimeField(null=True, blank=True, verbose_name="종료 일시")
    description = models.TextField(blank=True, verbose_name="설명")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "전체 일정"
        verbose_name_plural = "전체 일정들"
        ordering = ['datetime']
        db_table = "schedule_common"
    
    def __str__(self):
        return f"{self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"

class ScheduleRIS(models.Model):
    title = models.CharField(max_length=200, verbose_name="일정명")
    datetime = models.DateTimeField(verbose_name="일시")
    end_datetime = models.DateTimeField(null=True, blank=True, verbose_name="종료 일시")
    description = models.TextField(blank=True, verbose_name="설명")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "부서 일정"
        verbose_name_plural = "부서 일정들"
        ordering = ['datetime']
        db_table = "schedule_ris"
    
    def __str__(self):
        return f"{self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"

# === 검사실 모델 추가 ===
class ExamRoom(models.Model):
    ROOM_TYPE_CHOICES = [
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
    
    room_id = models.CharField(max_length=20, unique=True, verbose_name="검사실 ID")
    name = models.CharField(max_length=50, verbose_name="검사실명")
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, verbose_name="검사실 유형")
    is_active = models.BooleanField(default=True, verbose_name="사용 여부")
    description = models.TextField(blank=True, verbose_name="설명")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = "검사실"
        verbose_name_plural = "검사실들"
        db_table = "exam_rooms"
        ordering = ['room_id']
    
    def __str__(self):
        return f"{self.name} ({self.room_type})"

class PersonalSchedule(models.Model):
    SCHEDULE_TYPE_CHOICES = [
        ('일반', '일반 일정'),
        ('검사', '검사 일정'),
    ]
    
    doctor = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, verbose_name="담당의사")
    title = models.CharField(max_length=200, verbose_name="일정명")
    datetime = models.DateTimeField(verbose_name="일시")
    end_datetime = models.DateTimeField(null=True, blank=True, verbose_name="종료 일시")
    description = models.TextField(blank=True, verbose_name="설명")
    is_completed = models.BooleanField(default=False, verbose_name="완료 여부")
    
    # 새 필드들
    schedule_type = models.CharField(max_length=10, choices=SCHEDULE_TYPE_CHOICES, default='일반', verbose_name="일정 유형")
    study_request = models.ForeignKey('worklists.StudyRequest', null=True, blank=True, on_delete=models.CASCADE, verbose_name="연결된 검사 요청")
    exam_room = models.ForeignKey(ExamRoom, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="검사실")
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = "개인 일정"
        verbose_name_plural = "개인 일정들"
        ordering = ['datetime']
        db_table = "schedule_personal"
    
    def __str__(self):
        if self.schedule_type == '검사' and self.study_request:
            return f"{self.doctor.name}: {self.study_request.patient_name} {self.study_request.modality} 검사"
        return f"{self.doctor.name}: {self.title} ({self.datetime.strftime('%Y-%m-%d %H:%M')})"