from django.contrib import admin
from .models import AnnotationResult

@admin.register(AnnotationResult)
class AnnotationResultAdmin(admin.ModelAdmin):
    # 목록 페이지에서 보여줄 필드들
    list_display = [
        'id', 
        'patient_id', 
        'study_uid_short', 
        'series_uid_short',
        'instance_number',
        'label',  # 라벨명 표시
        'bbox_display',  # 바운딩박스 위치
        'doctor_name', 
        'created_at'
    ]
    
    # 필터 옵션
    list_filter = [
        'doctor_name',
        'label',
        'created_at',
    ]
    
    # 검색 가능한 필드
    search_fields = [
        'patient_id',
        'study_uid',
        'series_uid',
        'instance_uid',
        'label',
        'doctor_name',
        'dr_text'
    ]
    
    # 읽기 전용 필드
    readonly_fields = [
        'created_at', 
        'updated_at'
    ]
    
    # 상세 페이지 필드 그룹화
    fieldsets = (
        ('환자 정보', {
            'fields': ('patient_id', 'study_uid', 'series_uid', 'instance_uid', 'instance_number')
        }),
        ('판독의 정보', {
            'fields': ('doctor_id', 'doctor_name')
        }),
        ('어노테이션 정보', {
            'fields': ('label', 'bbox', 'dr_text')
        }),
        ('타임스탬프', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # 페이지당 표시할 항목 수
    list_per_page = 25
    
    # 날짜 계층 구조
    date_hierarchy = 'created_at'
    
    # 액션
    actions = ['delete_selected']
    
    def study_uid_short(self, obj):
        """Study UID를 짧게 표시"""
        return obj.study_uid[:30] + '...' if len(obj.study_uid) > 30 else obj.study_uid
    study_uid_short.short_description = 'Study UID'
    
    def series_uid_short(self, obj):
        """Series UID를 짧게 표시"""
        if obj.series_uid:
            return obj.series_uid[:25] + '...' if len(obj.series_uid) > 25 else obj.series_uid
        return '-'
    series_uid_short.short_description = 'Series UID'
    
    def bbox_display(self, obj):
        """바운딩박스를 읽기 쉽게 표시"""
        if obj.bbox and isinstance(obj.bbox, list) and len(obj.bbox) == 4:
            return f"[{obj.bbox[0]}, {obj.bbox[1]}, {obj.bbox[2]}, {obj.bbox[3]}]"
        return str(obj.bbox)
    bbox_display.short_description = 'BBox'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related()