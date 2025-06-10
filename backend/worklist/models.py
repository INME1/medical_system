# worklist/models.py

from django.db import models
from django.utils import timezone

class StudyRequest(models.Model):
    # 1. id - AutoField PK (Django 자동 생성)
    
    # 2-5. 환자 정보 (React에서 입력)
    patient_id = models.CharField(max_length=20)        
    patient_name = models.CharField(max_length=100)     
    birth_date = models.DateField()                     
    sex = models.CharField(max_length=1, choices=[('M', '남성'), ('F', '여성')])  
    
    # 6-7. 검사 정보 (React에서 입력)
    body_part = models.CharField(max_length=50)         
    modality = models.CharField(max_length=20, choices=[  
        ('CR', 'CR (X-ray)'),
        ('CT', 'CT (Computed Tomography)'),
        ('MR', 'MR (MRI)'),
        ('US', 'US (Ultrasound)'),
        ('NM', 'NM (Nuclear Medicine)'),
        ('PT', 'PT (PET Scan)'),
        ('DX', 'DX (Digital Radiography)'),
        ('XA', 'XA (Angiography)'),
        ('MG', 'MG (Mammography)'),
    ])
    
    # 8. 요청 일시 (버튼 누르는 시간 자동 생성)
    request_datetime = models.DateTimeField(auto_now_add=True)  
    
    # 9. 요청 의사 (React에서 입력)
    requesting_physician = models.CharField(max_length=100)  
    
    # 10. 예약된 검사 시간 (나중에 입력)
    scheduled_exam_datetime = models.DateTimeField(null=True, blank=True)  
    
    # 11. 판독 의사 (나중에 입력)
    interpreting_physician = models.CharField(max_length=100, null=True, blank=True)  
    
    # 12. DICOM Study UID (나중에 입력)
    study_uid = models.CharField(max_length=100, null=True, blank=True)  
    
    # 13. 접수 번호 (나중에 입력)
    accession_number = models.CharField(max_length=100, null=True, blank=True)  
    
    # 14. 검사 상태 (기본값: requested)
    study_status = models.CharField(  
        max_length=20,
        choices=[
            ("requested", "Requested"), 
            ("in_progress", "In Progress"), 
            ("completed", "Completed")
        ],
        default="requested"
    )
    
    # 15. 리포트 상태 (기본값: requested)
    report_status = models.CharField(  
        max_length=20,
        choices=[
            ("requested", "Requested"), 
            ("in_progress", "In Progress"), 
            ("completed", "Completed")
        ],
        default="requested"
    )

    class Meta:
        ordering = ['-id']  # 최신순 정렬

    def __str__(self):
        return f"{self.patient_id} - {self.modality} - {self.study_status}"