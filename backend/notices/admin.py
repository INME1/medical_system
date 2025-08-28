from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import NoticeCommon, NoticeRIS


class BaseNoticeAdmin(admin.ModelAdmin):
    """공통 Notice Admin 기능"""
    
    list_display = [
        'title', 'notice_type_badge', 'is_active_badge', 'is_pinned_badge', 
        'created_by', 'created_at', 'validity_status', 'view_count'
    ]
    
    list_filter = [
        'notice_type', 'is_active', 'is_pinned', 'created_at', 'start_date'
    ]
    
    search_fields = [
        'title', 'content', 'created_by'
    ]
    
    readonly_fields = ['created_at', 'updated_at', 'views']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'content', 'notice_type', 'created_by')
        }),
        ('표시 설정', {
            'fields': ('is_active', 'is_pinned', 'start_date', 'end_date'),
            'description': '공지사항의 표시 여부와 기간을 설정합니다.'
        }),
        ('통계', {
            'fields': ('views', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-is_pinned', '-created_at']
    
    actions = ['make_active', 'make_inactive', 'pin_notices', 'unpin_notices', 'mark_important', 'mark_general']
    
    def notice_type_badge(self, obj):
        colors = {
            'important': '#e74c3c',
            'update': '#3498db', 
            'maintenance': '#f39c12',
            'general': '#95a5a6'
        }
        color = colors.get(obj.notice_type, '#95a5a6')
        
        # 중요 공지면 아이콘 추가
        icon = '🚨 ' if obj.notice_type == 'important' else ''
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">{}{}</span>',
            color,
            icon,
            obj.get_notice_type_display()
        )
    notice_type_badge.short_description = '유형'
    
    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: #2ecc71;">✓ 활성</span>')
        return format_html('<span style="color: #e74c3c;">✗ 비활성</span>')
    is_active_badge.short_description = '상태'
    
    def is_pinned_badge(self, obj):
        if obj.is_pinned:
            return format_html('<span style="color: #f39c12;">📌 고정</span>')
        return format_html('<span style="color: #95a5a6;">일반</span>')
    is_pinned_badge.short_description = '고정'
    
    def validity_status(self, obj):
        if obj.is_valid():
            return format_html('<span style="color: #2ecc71;">✓ 유효</span>')
        return format_html('<span style="color: #e74c3c;">✗ 만료</span>')
    validity_status.short_description = '유효성'
    
    def view_count(self, obj):
        return f"{obj.views}회"
    view_count.short_description = '조회수'
    
    # 대량 작업
    def make_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated}개의 공지사항을 활성화했습니다.')
    make_active.short_description = '선택된 공지사항을 활성화'
    
    def make_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated}개의 공지사항을 비활성화했습니다.')
    make_inactive.short_description = '선택된 공지사항을 비활성화'
    
    def pin_notices(self, request, queryset):
        updated = queryset.update(is_pinned=True)
        self.message_user(request, f'{updated}개의 공지사항을 상단에 고정했습니다.')
    pin_notices.short_description = '선택된 공지사항을 상단 고정'
    
    def unpin_notices(self, request, queryset):
        updated = queryset.update(is_pinned=False)
        self.message_user(request, f'{updated}개의 공지사항 고정을 해제했습니다.')
    unpin_notices.short_description = '선택된 공지사항 고정 해제'
    
    def mark_important(self, request, queryset):
        updated = queryset.update(notice_type='important')
        self.message_user(request, f'{updated}개의 공지사항을 중요로 변경했습니다.')
    mark_important.short_description = '선택된 공지사항을 중요 공지로 변경'
    
    def mark_general(self, request, queryset):
        updated = queryset.update(notice_type='general')
        self.message_user(request, f'{updated}개의 공지사항을 일반으로 변경했습니다.')
    mark_general.short_description = '선택된 공지사항을 일반 공지로 변경'


@admin.register(NoticeCommon)
class NoticeCommonAdmin(BaseNoticeAdmin):
    """시스템 공지사항 Admin"""
    
    def get_queryset(self, request):
        """시스템 공지사항만 조회"""
        return super().get_queryset(request)
    
    class Meta:
        verbose_name = "시스템 공지사항"
        verbose_name_plural = "시스템 공지사항들"


@admin.register(NoticeRIS)
class NoticeRISAdmin(BaseNoticeAdmin):
    """영상의학과 공지사항 Admin"""
    
    # RIS 전용 필드 추가
    list_display = BaseNoticeAdmin.list_display + ['target_department']
    list_filter = BaseNoticeAdmin.list_filter + ['target_department']
    search_fields = BaseNoticeAdmin.search_fields + ['target_department']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'content', 'notice_type', 'created_by', 'target_department')
        }),
        ('표시 설정', {
            'fields': ('is_active', 'is_pinned', 'start_date', 'end_date'),
            'description': '공지사항의 표시 여부와 기간을 설정합니다.'
        }),
        ('통계', {
            'fields': ('views', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """영상의학과 공지사항만 조회"""
        return super().get_queryset(request)
    
    class Meta:
        verbose_name = "영상의학과 공지사항"
        verbose_name_plural = "영상의학과 공지사항들"