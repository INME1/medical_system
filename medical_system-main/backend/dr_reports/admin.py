from django.contrib import admin
from django.utils.html import format_html
from .models import DrReport  # 👈 수정: AnnotationResult → DrReport

@admin.register(DrReport)  # 👈 이미 올바름
class DrReportAdmin(admin.ModelAdmin):
    # 목록 페이지에서 보여줄 필드들
    list_display = [
        'id',
        'patient_id', 
        'study_uid_short',
        'doctor_display',  # 👈 개선: ID와 이름 함께 표시
        'report_status_badge',  # 👈 개선: 상태를 색상 배지로 표시
        'has_content_display',  # 👈 추가: 내용 유무 표시
        'created_at',
        'updated_at'
    ]
    
    # 필터 옵션 (👈 개선: 더 유용한 필터 추가)
    list_filter = [
        'report_status',
        'doctor_name',
        'doctor_id',  # 👈 추가: 의료진식별번호로 필터
        'created_at',
        'updated_at',
    ]
    
    # 검색 가능한 필드
    search_fields = [
        'patient_id',
        'study_uid',
        'doctor_name',
        'doctor_id',  # 👈 추가: 의료진식별번호로 검색
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
            'fields': ('doctor_id', 'doctor_name'),
            'description': '워크리스트에서 자동으로 가져온 판독의 정보'  # 👈 추가: 설명
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
    date_hierarchy = 'created_at'
    
    # 액션 (👈 개선: 유용한 액션 추가)
    actions = ['delete_selected', 'mark_as_completed', 'mark_as_approved']
    
    # 👈 정렬 기본값 설정
    ordering = ['-updated_at', 'patient_id']
    
    def study_uid_short(self, obj):
        """Study UID를 짧게 표시"""
        return obj.study_uid[:30] + '...' if len(obj.study_uid) > 30 else obj.study_uid
    study_uid_short.short_description = 'Study UID'
    
    # 👈 새로 추가: 판독의 정보를 ID와 이름 함께 표시
    def doctor_display(self, obj):
        """판독의 ID와 이름을 함께 표시"""
        return f"{obj.doctor_id} - {obj.doctor_name}"
    doctor_display.short_description = '판독의 (ID - 이름)'
    doctor_display.admin_order_field = 'doctor_name'  # 정렬 가능하게
    
    # 👈 새로 추가: 상태를 색상 배지로 표시
    def report_status_badge(self, obj):
        """레포트 상태를 색상 배지로 표시"""
        color = obj.get_status_color()
        status_display = obj.get_report_status_display()
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, status_display
        )
    report_status_badge.short_description = '상태'
    report_status_badge.admin_order_field = 'report_status'
    
    # 👈 새로 추가: 레포트 내용 유무 표시
    def has_content_display(self, obj):
        """레포트 내용이 있는지 아이콘으로 표시"""
        if obj.dr_report and obj.dr_report.strip():
            return format_html(
                '<span style="color: green; font-size: 16px;" title="내용 있음">✓</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-size: 16px;" title="내용 없음">✗</span>'
            )
    has_content_display.short_description = '내용'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related()
    
    # 👈 추가: 유용한 액션들
    def mark_as_completed(self, request, queryset):
        """선택된 레포트를 완료 상태로 변경"""
        updated = queryset.update(report_status='completed')
        self.message_user(request, f'{updated}개 레포트가 완료 상태로 변경되었습니다.')
    mark_as_completed.short_description = '선택된 레포트를 완료 상태로 변경'
    
    def mark_as_approved(self, request, queryset):
        """선택된 레포트를 승인 상태로 변경"""
        updated = queryset.update(report_status='approved')
        self.message_user(request, f'{updated}개 레포트가 승인 상태로 변경되었습니다.')
    mark_as_approved.short_description = '선택된 레포트를 승인 상태로 변경'
    
    # 👈 추가: 관리자 페이지에서 통계 정보 표시
    def changelist_view(self, request, extra_context=None):
        """목록 페이지에 통계 추가"""
        extra_context = extra_context or {}
        
        # 상태별 통계
        from django.db.models import Count
        status_stats = (DrReport.objects
                       .values('report_status')
                       .annotate(count=Count('id')))
        
        # 판독의별 레포트 수 통계
        doctor_stats = (DrReport.objects
                       .values('doctor_name', 'doctor_id')
                       .annotate(count=Count('id'))
                       .order_by('-count'))
        
        extra_context['status_stats'] = status_stats
        extra_context['doctor_stats'] = doctor_stats[:5]  # 상위 5명
        
        return super().changelist_view(request, extra_context)