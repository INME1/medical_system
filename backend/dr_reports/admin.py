from django.contrib import admin
from django.utils.html import format_html
from .models import DrReport

@admin.register(DrReport)
class DrReportAdmin(admin.ModelAdmin):
    # 목록 페이지에서 보여줄 필드들
    list_display = [
        'id', 
        'patient_id', 
        'study_uid_short', 
        'doctor_name',
        'status_badge',
        'report_status',  # list_editable을 위해 추가
        'report_preview',
        'updated_at'
    ]
    
    # 필터 옵션
    list_filter = [
        'report_status',
        'doctor_name',
        'created_at',
        'updated_at',
    ]
    
    # 검색 가능한 필드
    search_fields = [
        'patient_id',
        'study_uid',
        'doctor_name',
        'dr_report'
    ]
    
    # 읽기 전용 필드
    readonly_fields = [
        'created_at', 
        'updated_at'
    ]
    
    # 상세 페이지 필드 그룹화
    fieldsets = (
        ('환자 정보', {
            'fields': ('patient_id', 'study_uid')
        }),
        ('판독의 정보', {
            'fields': ('doctor_id', 'doctor_name')
        }),
        ('레포트 정보', {
            'fields': ('dr_report', 'report_status')
        }),
        ('타임스탬프', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # 페이지당 표시할 항목 수
    list_per_page = 25
    
    # 날짜 계층 구조
    date_hierarchy = 'updated_at'
    
    # 액션
    actions = ['mark_as_completed', 'mark_as_approved', 'mark_as_draft']
    
    def study_uid_short(self, obj):
        """Study UID를 짧게 표시"""
        return obj.study_uid[:30] + '...' if len(obj.study_uid) > 30 else obj.study_uid
    study_uid_short.short_description = 'Study UID'
    
    def status_badge(self, obj):
        """상태를 컬러 배지로 표시"""
        color = obj.get_status_color()
        status_text = obj.get_report_status_display()
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, status_text
        )
    status_badge.short_description = '상태'
    
    def report_preview(self, obj):
        """레포트 내용 미리보기"""
        if obj.dr_report:
            preview = obj.dr_report[:50]
            if len(obj.dr_report) > 50:
                preview += '...'
            return preview
        return '(내용 없음)'
    report_preview.short_description = '레포트 미리보기'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related()
    
    # 커스텀 액션들
    def mark_as_completed(self, request, queryset):
        """선택된 레포트들을 완료 상태로 변경"""
        updated = queryset.update(report_status='completed')
        self.message_user(request, f'{updated}개 레포트가 완료 상태로 변경되었습니다.')
    mark_as_completed.short_description = '선택된 레포트를 완료 상태로 변경'
    
    def mark_as_approved(self, request, queryset):
        """선택된 레포트들을 승인 상태로 변경"""
        updated = queryset.update(report_status='approved')
        self.message_user(request, f'{updated}개 레포트가 승인 상태로 변경되었습니다.')
    mark_as_approved.short_description = '선택된 레포트를 승인 상태로 변경'
    
    def mark_as_draft(self, request, queryset):
        """선택된 레포트들을 초안 상태로 변경"""
        updated = queryset.update(report_status='draft')
        self.message_user(request, f'{updated}개 레포트가 초안 상태로 변경되었습니다.')
    mark_as_draft.short_description = '선택된 레포트를 초안 상태로 변경'
    
    # 목록에서 직접 편집 가능한 필드
    list_editable = ['report_status']
    
    # 상세 페이지에서 레포트 텍스트 영역 크기 조정
    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'dr_report':
            kwargs['widget'] = admin.widgets.AdminTextareaWidget(attrs={'rows': 10, 'cols': 80})
        return super().formfield_for_dbfield(db_field, request, **kwargs)