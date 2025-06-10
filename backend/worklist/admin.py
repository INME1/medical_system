# worklist/admin.py

from django.contrib import admin
from .models import StudyRequest

@admin.register(StudyRequest)
class StudyRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'patient_id', 'patient_name', 'modality', 
        'study_status', 'report_status', 'request_datetime', 'requesting_physician'
    ]
    
    list_filter = [
        'modality', 'study_status', 'report_status', 'sex'
    ]
    
    search_fields = [
        'patient_id', 'patient_name', 'requesting_physician'
    ]
    
    readonly_fields = [
        'id', 'request_datetime'  # 자동 생성 필드는 읽기 전용
    ]
    
    fieldsets = (
    ('분석 요청 정보 (요청의가 입력)', {
        'fields': (
            'patient_id', 'patient_name', 'birth_date', 'sex',
            'body_part', 'modality',
            'requesting_physician', 'request_datetime'
        )
    }),
    ('영상 판독 정보 (영상의가 입력)', {
        'fields': (
            'scheduled_exam_datetime',
            'interpreting_physician',
            'study_uid',
            'accession_number',
            'study_status',
            'report_status',
            
        ),
        'description': '영상의가 입력하는 필드입니다.'
    }),
)
    
    ordering = ['-request_datetime']     # 최신순 정렬