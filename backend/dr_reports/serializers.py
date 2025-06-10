from rest_framework import serializers
from .models import DrReport

class DrReportSerializer(serializers.ModelSerializer):
    """레포트 기본 시리얼라이저"""
    
    # 상태 표시명 추가
    report_status_display = serializers.CharField(source='get_report_status_display', read_only=True)
    
    class Meta:
        model = DrReport
        fields = [
            'id',
            'patient_id',
            'study_uid',
            'doctor_id', 
            'doctor_name',
            'dr_report',
            'report_status',
            'report_status_display',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_patient_id(self, value):
        """환자 ID 유효성 검사"""
        if not value or not value.strip():
            raise serializers.ValidationError("환자 ID는 비어있을 수 없습니다.")
        return value.strip()
    
    def validate_study_uid(self, value):
        """Study UID 유효성 검사"""
        if not value or not value.strip():
            raise serializers.ValidationError("Study UID는 비어있을 수 없습니다.")
        return value.strip()
    
    def validate_report_status(self, value):
        """레포트 상태 유효성 검사"""
        valid_statuses = ['draft', 'completed', 'approved']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"유효하지 않은 상태입니다. 가능한 값: {valid_statuses}")
        return value

class DrReportCreateSerializer(serializers.Serializer):
    """레포트 생성/업데이트용 시리얼라이저 (React에서 사용)"""
    
    study_uid = serializers.CharField(max_length=255)
    patient_id = serializers.CharField(max_length=100, required=False)
    patient_info = serializers.DictField(required=False, help_text="환자 정보 객체")
    ai_results = serializers.ListField(required=False, help_text="AI 분석 결과")
    annotations = serializers.ListField(required=False, help_text="수동 어노테이션")
    report_content = serializers.CharField(allow_blank=True, required=False, help_text="레포트 내용")
    report_status = serializers.ChoiceField(
        choices=['draft', 'completed', 'approved'], 
        default='draft'
    )
    
    def validate_study_uid(self, value):
        """Study UID 유효성 검사"""
        if not value or not value.strip():
            raise serializers.ValidationError("Study UID는 필수입니다.")
        return value.strip()
    
    def validate_patient_info(self, value):
        """환자 정보 유효성 검사"""
        if value and not isinstance(value, dict):
            raise serializers.ValidationError("환자 정보는 객체 형태여야 합니다.")
        return value
    
    def validate(self, data):
        """전체 데이터 유효성 검사"""
        # patient_id가 없으면 patient_info에서 추출 시도
        if not data.get('patient_id') and data.get('patient_info'):
            patient_info = data['patient_info']
            if isinstance(patient_info, dict) and 'patient_id' in patient_info:
                data['patient_id'] = patient_info['patient_id']
        
        # patient_id가 여전히 없으면 에러
        if not data.get('patient_id'):
            raise serializers.ValidationError("patient_id 또는 patient_info.patient_id가 필요합니다.")
        
        return data

class DrReportListSerializer(serializers.ModelSerializer):
    """레포트 목록 조회용 시리얼라이저 (간단한 정보만)"""
    
    report_status_display = serializers.CharField(source='get_report_status_display', read_only=True)
    report_preview = serializers.SerializerMethodField()
    has_content = serializers.SerializerMethodField()
    
    class Meta:
        model = DrReport
        fields = [
            'id',
            'patient_id',
            'study_uid',
            'doctor_name',
            'report_status',
            'report_status_display', 
            'report_preview',
            'has_content',
            'created_at',
            'updated_at'
        ]
    
    def get_report_preview(self, obj):
        """레포트 내용 미리보기 (50자)"""
        if obj.dr_report:
            preview = obj.dr_report.strip()[:50]
            if len(obj.dr_report.strip()) > 50:
                preview += '...'
            return preview
        return None
    
    def get_has_content(self, obj):
        """레포트 내용이 있는지 여부"""
        return bool(obj.dr_report and obj.dr_report.strip())

class DrReportStatusUpdateSerializer(serializers.Serializer):
    """레포트 상태만 업데이트하는 시리얼라이저"""
    
    report_status = serializers.ChoiceField(choices=['draft', 'completed', 'approved'])
    
    def validate_report_status(self, value):
        """상태 변경 규칙 검사"""
        # 여기에 상태 변경 규칙을 추가할 수 있음
        # 예: approved -> draft 불가 등
        return value

class DrReportSummarySerializer(serializers.Serializer):
    """레포트 통계 요약용 시리얼라이저"""
    
    total_reports = serializers.IntegerField()
    draft_count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    approved_count = serializers.IntegerField()
    recent_reports = DrReportListSerializer(many=True)