from django.contrib import admin
from .models import StudyRequest

@admin.register(StudyRequest)
class StudyRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'patient_id', 'patient_name', 'modality', 
        'study_status', 'report_status', 'request_datetime', 'requesting_physician',
        'assigned_room', 'assigned_radiologist'  # 🆕 스케줄 정보 추가
    ]
    
    list_filter = [
        'modality', 'study_status', 'report_status', 'sex', 
        'assigned_room', 'assigned_radiologist', 'priority'  # 🆕 필터 추가
    ]
    
    search_fields = [
        'patient_id', 'patient_name', 'requesting_physician',
        'interpreting_physician'  # 🆕 판독의 검색 추가
    ]
    
    readonly_fields = [
        'id', 'request_datetime', 'created_at', 'updated_at',
        'interpreting_physician'  # 🆕 판독의는 드래그앤드롭에서만 지정, 읽기 전용
    ]
    
    fieldsets = (
        ('환자 기본 정보', {
            'fields': (
                'patient_id', 'patient_name', 'birth_date', 'sex'
            )
        }),
        ('검사 요청 정보 (요청의가 입력)', {
            'fields': (
                'body_part', 'modality', 'requesting_physician', 
                'request_datetime', 'priority', 'notes'
            )
        }),
        ('스케줄링 정보 (드래그앤드롭으로 배정)', {
            'fields': (
                'assigned_room', 'assigned_radiologist',
                'scheduled_exam_datetime', 'scheduled_end_time', 
                'estimated_duration'
            ),
            'description': '검사실과 배정 판독의(영상전문의)를 배정하는 정보입니다.'
        }),
        ('검사 진행 정보', {
            'fields': (
                'study_status', 'report_status',
                'actual_start_time', 'actual_end_time'
            ),
            'description': '검사 진행 상황을 나타냅니다.'
        }),
        ('영상 판독 정보 (드래그앤드롭시 자동 입력)', {
            'fields': (
                'interpreting_physician', 'study_uid', 'accession_number'
            ),
            'description': '판독의는 드래그앤드롭 배정시 자동으로 입력됩니다. study_uid와 accession_number는 필요시 수동 입력 가능합니다.'
        }),
        ('시스템 정보', {
            'fields': (
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',),  # 기본적으로 접어둠
        }),
    )
    
    ordering = ['-request_datetime']  # 최신순 정렬
    
    # 🆕 액션 추가
    actions = ['mark_as_waiting', 'mark_as_exam_ready', 'mark_as_in_progress']
    
    def mark_as_waiting(self, request, queryset):
        queryset.update(study_status='대기')
        self.message_user(request, f"{queryset.count()}개 항목을 '대기' 상태로 변경했습니다.")
    mark_as_waiting.short_description = "선택된 항목을 '대기' 상태로 변경"
    
    def mark_as_exam_ready(self, request, queryset):
        queryset.update(study_status='검사대기')
        self.message_user(request, f"{queryset.count()}개 항목을 '검사대기' 상태로 변경했습니다.")
    mark_as_exam_ready.short_description = "선택된 항목을 '검사대기' 상태로 변경"
    
    def mark_as_in_progress(self, request, queryset):
        queryset.update(study_status='검사중')
        self.message_user(request, f"{queryset.count()}개 항목을 '검사중' 상태로 변경했습니다.")
    mark_as_in_progress.short_description = "선택된 항목을 '검사중' 상태로 변경"