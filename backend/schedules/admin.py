from django.contrib import admin
from .models import ScheduleCommon, ScheduleRIS, PersonalSchedule, ExamRoom

@admin.register(ScheduleCommon)
class ScheduleCommonAdmin(admin.ModelAdmin):
    list_display = ['title', 'datetime', 'created_at']
    list_filter = ['datetime', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['datetime']

@admin.register(ScheduleRIS)
class ScheduleRISAdmin(admin.ModelAdmin):
    list_display = ['title', 'datetime', 'created_at']
    list_filter = ['datetime', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['datetime']

@admin.register(PersonalSchedule)
class PersonalScheduleAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'schedule_type', 'title', 'datetime', 'is_completed', 'created_at']
    list_filter = ['doctor', 'schedule_type', 'datetime', 'is_completed', 'created_at']  # 🆕 schedule_type 필터 추가
    search_fields = ['title', 'description', 'doctor__name']
    ordering = ['datetime']
    
    # 🆕 구분선으로 섹션 나누기
    fieldsets = (
        ('기본 정보', {
            'fields': ('doctor', 'schedule_type')
        }),
        ('일반 일정 정보', {
            'fields': ('title', 'description'),
            'description': '일정 분류가 "일반"일 때 사용하는 필드입니다.'
        }),
        ('검사 일정 정보', {
            'fields': ('study_request', 'exam_room'),
            'description': '일정 분류가 "검사"일 때 자동으로 채워지는 필드입니다.'
        }),
        ('시간 정보', {
            'fields': ('datetime', 'end_datetime', 'is_completed')
        }),
    )
    
    # 🆕 검사 일정은 수정 불가 (자동 생성된 것이므로)
    def get_readonly_fields(self, request, obj=None):
        if obj and obj.schedule_type == '검사':
            return ['schedule_type', 'study_request', 'exam_room', 'title', 'description']
        return []

# 🆕 검사실 Admin 추가
@admin.register(ExamRoom)
class ExamRoomAdmin(admin.ModelAdmin):
    list_display = ['room_id', 'name', 'room_type', 'is_active', 'created_at']
    list_filter = ['room_type', 'is_active', 'created_at']
    search_fields = ['room_id', 'name', 'description']
    ordering = ['room_id']
    
    # 편집 페이지 필드 순서
    fields = ['room_id', 'name', 'room_type', 'is_active', 'description']
    
    # 읽기 전용 필드 (생성 후 수정 불가)
    def get_readonly_fields(self, request, obj=None):
        if obj:  # 수정 시
            return ['room_id']  # room_id는 수정 불가
        return []