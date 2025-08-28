from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import DocumentType, DocumentRequest, DocumentTemplate


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = [
        'code', 
        'name', 
        'requires_signature_display', 
        'is_active', 
        'sort_order',
        'request_count',
        'created_at'
    ]
    list_filter = ['requires_signature', 'is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    ordering = ['sort_order', 'code']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('code', 'name', 'description')
        }),
        ('설정', {
            'fields': ('requires_signature', 'is_active', 'sort_order')
        }),
    )
    
    def requires_signature_display(self, obj):
        """서명 필요 여부를 아이콘으로 표시"""
        if obj.requires_signature:
            return format_html(
                '<span style="color: orange;">📝 서명필요</span>'
            )
        else:
            return format_html(
                '<span style="color: green;">📄 바로발급</span>'
            )
    requires_signature_display.short_description = '서명 필요'
    
    def request_count(self, obj):
        """해당 서류 종류의 총 요청 건수"""
        count = obj.document_requests.count()
        if count > 0:
            url = reverse('admin:pacsdocs_documentrequest_changelist') + f'?document_type__id__exact={obj.id}'
            return format_html(
                '<a href="{}" style="color: blue;">{} 건</a>',
                url, count
            )
        return '0 건'
    request_count.short_description = '요청 건수'


@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'patient_info',
        'document_type',
        'status_display',
        'requires_signature_display',
        'upload_status_display',  # 🔥 업로드 상태 추가
        'processed_by',
        'requested_at',
        'completed_at'
    ]
    list_filter = [
        'status',
        'document_type',
        'document_type__requires_signature',
        'requested_at',
        'completed_at',
        'upload_date',  # 🔥 업로드 날짜 필터 추가
    ]
    search_fields = [
        'study_request__patient_name',
        'study_request__patient_id',
        'document_type__name',
        'processed_by',
        'original_filename',  # 🔥 파일명 검색 추가
    ]
    ordering = ['-requested_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('study_request', 'document_type', 'status')
        }),
        ('처리 정보', {
            'fields': ('processed_by', 'notes')
        }),
        ('🔥 파일 업로드 정보', {  # 🔥 새로운 섹션 추가
            'fields': (
                'uploaded_file', 
                'original_filename', 
                'file_size_display', 
                'upload_date'
            ),
            'classes': ('collapse',)
        }),
        ('기존 파일 정보', {
            'fields': ('generated_file_path', 'scanned_file_path'),
            'classes': ('collapse',)
        }),
        ('시간 정보', {
            'fields': ('requested_at', 'generated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = [
        'requested_at', 
        'generated_at', 
        'completed_at',
        'file_size_display',  # 🔥 파일 크기는 읽기 전용
        'upload_date'  # 🔥 업로드 날짜도 읽기 전용
    ]
    
    def patient_info(self, obj):
        """환자 정보 표시"""
        study = obj.study_request
        return format_html(
            '<strong>{}</strong><br>'
            '<small>ID: {}</small><br>'
            '<small>{} {}</small>',
            study.patient_name,
            study.patient_id,
            study.body_part,
            study.modality
        )
    patient_info.short_description = '환자 정보'
    
    def status_display(self, obj):
        """상태를 색깔과 함께 표시"""
        status_colors = {
            'pending': '#gray',
            'selected': '#blue',
            'generated': '#orange',
            'signature_waiting': '#purple',
            'scan_waiting': '#brown',
            'completed': '#green',
            'cancelled': '#red',
        }
        color = status_colors.get(obj.status, '#gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = '상태'
    
    def requires_signature_display(self, obj):
        """서명 필요 여부 표시"""
        if obj.document_type.requires_signature:
            return format_html('<span style="color: orange;">📝</span>')
        else:
            return format_html('<span style="color: green;">📄</span>')
    requires_signature_display.short_description = '서명'
    
    # 🔥 업로드 상태 표시 함수 추가
    def upload_status_display(self, obj):
        """업로드 상태 표시"""
        if hasattr(obj, 'uploaded_file') and obj.uploaded_file:
            file_size = obj.file_size or 0
            file_size_mb = round(file_size / (1024 * 1024), 2) if file_size > 0 else 0
            return format_html(
                '<span style="color: green;">📁 업로드됨</span><br>'
                '<small>{} ({} MB)</small>',
                obj.original_filename or obj.uploaded_file.name,
                file_size_mb
            )
        else:
            return format_html('<span style="color: gray;">❌ 미업로드</span>')
    upload_status_display.short_description = '업로드 상태'
    
    # 🔥 파일 크기 표시 함수 추가
    def file_size_display(self, obj):
        """파일 크기를 MB로 표시"""
        if obj.file_size:
            size_mb = round(obj.file_size / (1024 * 1024), 2)
            return f"{size_mb} MB ({obj.file_size:,} bytes)"
        return "정보 없음"
    file_size_display.short_description = '파일 크기'
    
    # 액션 추가
    actions = ['mark_selected', 'mark_completed', 'mark_cancelled', 'clear_uploads']  # 🔥 업로드 초기화 액션 추가
    
    def mark_selected(self, request, queryset):
        """선택된 서류들을 '선택됨' 상태로 변경"""
        updated = 0
        for doc_request in queryset:
            if hasattr(doc_request, 'can_be_selected') and doc_request.can_be_selected():
                doc_request.mark_selected(processed_by=request.user.username)
                updated += 1
            else:
                # 🔥 메서드가 없는 경우 기본 처리
                doc_request.status = 'selected'
                doc_request.processed_by = request.user.username
                doc_request.save()
                updated += 1
        
        self.message_user(
            request,
            f'{updated}개의 서류를 선택됨 상태로 변경했습니다.'
        )
    mark_selected.short_description = "선택됨으로 변경"
    
    def mark_completed(self, request, queryset):
        """선택된 서류들을 '완료' 상태로 변경"""
        updated = 0
        for doc_request in queryset:
            if hasattr(doc_request, 'can_be_completed') and doc_request.can_be_completed():
                doc_request.mark_completed(processed_by=request.user.username)
                updated += 1
            else:
                # 🔥 메서드가 없는 경우 기본 처리
                doc_request.status = 'completed'
                doc_request.completed_at = timezone.now()
                doc_request.processed_by = request.user.username
                doc_request.save()
                updated += 1
        
        self.message_user(
            request,
            f'{updated}개의 서류를 완료 상태로 변경했습니다.'
        )
    mark_completed.short_description = "완료로 변경"
    
    def mark_cancelled(self, request, queryset):
        """선택된 서류들을 '취소' 상태로 변경"""
        updated = 0
        for doc_request in queryset:
            if hasattr(doc_request, 'mark_cancelled'):
                doc_request.mark_cancelled(processed_by=request.user.username)
            else:
                # 🔥 메서드가 없는 경우 기본 처리
                doc_request.status = 'cancelled'
                doc_request.processed_by = request.user.username
                doc_request.save()
            updated += 1
        
        self.message_user(
            request,
            f'{updated}개의 서류를 취소 상태로 변경했습니다.'
        )
    mark_cancelled.short_description = "취소로 변경"
    
    # 🔥 업로드 파일 초기화 액션 추가
    def clear_uploads(self, request, queryset):
        """선택된 서류들의 업로드 파일 초기화"""
        updated = 0
        for doc_request in queryset:
            if hasattr(doc_request, 'uploaded_file') and doc_request.uploaded_file:
                # 파일 삭제
                doc_request.uploaded_file.delete()
                doc_request.original_filename = None
                doc_request.file_size = None
                doc_request.upload_date = None
                doc_request.save()
                updated += 1
        
        self.message_user(
            request,
            f'{updated}개의 서류에서 업로드 파일을 초기화했습니다.'
        )
    clear_uploads.short_description = "업로드 파일 초기화"


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'document_type',
        'is_active',
        'created_at',
        'updated_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['document_type__name', 'document_type__code']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('document_type', 'is_active')
        }),
        ('템플릿 내용', {
            'fields': ('template_content',),
            'classes': ('wide',)
        }),
    )


# 관련 인라인 추가 (StudyRequest 관리 페이지에서 서류 요청도 함께 보기)
class DocumentRequestInline(admin.TabularInline):
    model = DocumentRequest
    extra = 0
    readonly_fields = ['requested_at', 'generated_at', 'completed_at', 'upload_date']
    fields = [
        'document_type', 
        'status', 
        'processed_by',
        'uploaded_file',  # 🔥 업로드 파일 필드 추가
        'requested_at', 
        'completed_at'
    ]
    
    def has_add_permission(self, request, obj=None):
        """인라인에서는 추가 불가 (별도로 관리)"""
        return False