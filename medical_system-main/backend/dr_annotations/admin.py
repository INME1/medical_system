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
        'label',
        'shape_type',  # 새 필드
        'coordinates_display',  # 새 필드
        'doctor_display',
        'created_at'
    ]
    
    # 필터 옵션
    list_filter = [
        'shape_type',  # 새 필터
        'instance_number',  # 👈 인스턴스별 필터 추가
        'doctor_name',
        'doctor_id',
        'label',
        'created_at',
        'patient_id',
    ]
    
    # 검색 가능한 필드
    search_fields = [
        'patient_id',
        'study_uid',
        'series_uid',
        'instance_uid',  # 👈 인스턴스 검색 추가
        'label',
        'doctor_name',
        'doctor_id',
        'dr_text'
    ]
    
    # 읽기 전용 필드
    readonly_fields = [
        'created_at', 
        'updated_at',
        'calculated_area',  # 새 필드
        'calculated_length'  # 새 필드
    ]
    
    # 상세 페이지 필드 그룹화
    fieldsets = (
        ('환자 정보', {
            'fields': ('patient_id', 'study_uid', 'series_uid', 'instance_uid', 'instance_number')
        }),
        ('판독의 정보', {
            'fields': ('doctor_id', 'doctor_name'),
            'description': '워크리스트에서 자동으로 가져온 판독의 정보'
        }),
        ('어노테이션 정보', {
            'fields': ('label', 'shape_type', 'coordinates', 'dr_text')
        }),
        ('계산된 값', {
            'fields': ('calculated_area', 'calculated_length'),
            'classes': ('collapse',),
            'description': '좌표를 기반으로 자동 계산된 값들'
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
    actions = ['delete_selected', 'export_to_csv']
    
    # 정렬 기본값 설정
    ordering = ['-created_at', 'patient_id']
    
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
    
    def coordinates_display(self, obj):
        """좌표를 읽기 쉽게 표시"""
        if obj.coordinates and isinstance(obj.coordinates, list):
            if obj.shape_type == 'rectangle':
                # [x, y, width, height]
                if len(obj.coordinates) == 4:
                    return f"({obj.coordinates[0]}, {obj.coordinates[1]}) {obj.coordinates[2]}×{obj.coordinates[3]}"
            elif obj.shape_type == 'circle':
                # [centerX, centerY, radius]
                if len(obj.coordinates) == 3:
                    return f"({obj.coordinates[0]}, {obj.coordinates[1]}) r={obj.coordinates[2]}"
            elif obj.shape_type == 'line':
                # [x1, y1, x2, y2]
                if len(obj.coordinates) == 4:
                    return f"({obj.coordinates[0]}, {obj.coordinates[1]}) → ({obj.coordinates[2]}, {obj.coordinates[3]})"
        return str(obj.coordinates)
    coordinates_display.short_description = '좌표'
    
    def doctor_display(self, obj):
        """판독의 ID와 이름을 함께 표시"""
        return f"{obj.doctor_id} - {obj.doctor_name}"
    doctor_display.short_description = '판독의 (ID - 이름)'
    doctor_display.admin_order_field = 'doctor_name'
    
    def calculated_area(self, obj):
        """계산된 면적 표시"""
        if obj.shape_type == 'rectangle':
            # [x, y, width, height]
            coords = obj.coordinates
            if len(coords) == 4:
                area = coords[2] * coords[3]
                return f"{area:.2f} px²"
        elif obj.shape_type == 'circle':
            # [centerX, centerY, radius]
            coords = obj.coordinates
            if len(coords) == 3:
                import math
                area = math.pi * (coords[2] ** 2)
                return f"{area:.2f} px²"
        return "해당없음"
    calculated_area.short_description = '면적'
    
    def calculated_length(self, obj):
        """계산된 길이 표시"""
        if obj.shape_type == 'line':
            # [x1, y1, x2, y2]
            coords = obj.coordinates
            if len(coords) == 4:
                import math
                dx = coords[2] - coords[0]
                dy = coords[3] - coords[1]
                length = math.sqrt(dx*dx + dy*dy)
                return f"{length:.2f} px"
        return "해당없음"
    calculated_length.short_description = '길이'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related()
    
    def changelist_view(self, request, extra_context=None):
        """목록 페이지에 통계 추가"""
        extra_context = extra_context or {}
        
        # 판독의별 어노테이션 수 통계
        from django.db.models import Count
        doctor_stats = (AnnotationResult.objects
                       .values('doctor_name', 'doctor_id')
                       .annotate(count=Count('id'))
                       .order_by('-count'))
        
        # 도형별 통계
        shape_stats = (AnnotationResult.objects
                      .values('shape_type')
                      .annotate(count=Count('id'))
                      .order_by('-count'))
        
        extra_context['doctor_stats'] = doctor_stats[:5]
        extra_context['shape_stats'] = shape_stats
        
        return super().changelist_view(request, extra_context)
    
    def export_to_csv(self, request, queryset):
        """CSV 내보내기 액션"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="annotations.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', '환자ID', 'Study UID', '라벨', '도형종류', 
            '좌표', '판독의ID', '판독의명', '메모', '생성일시'
        ])
        
        for annotation in queryset:
            writer.writerow([
                annotation.id,
                annotation.patient_id,
                annotation.study_uid,
                annotation.label,
                annotation.get_shape_type_display(),
                str(annotation.coordinates),
                annotation.doctor_id,
                annotation.doctor_name,
                annotation.dr_text or '',
                annotation.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    export_to_csv.short_description = "선택된 어노테이션을 CSV로 내보내기"