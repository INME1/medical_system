# pacsdocs/serializers.py

from rest_framework import serializers
from .models import DocumentType, DocumentRequest, DocumentTemplate
from worklists.models import StudyRequest

class DocumentTypeSerializer(serializers.ModelSerializer):
    """서류 종류 시리얼라이저"""
    
    class Meta:
        model = DocumentType
        fields = [
            'id', 'code', 'name', 'requires_signature', 
            'is_active', 'sort_order', 'description'
        ]


class DocumentRequestSerializer(serializers.ModelSerializer):
    """서류 요청 시리얼라이저"""
    
    document_type = DocumentTypeSerializer(read_only=True)
    document_type_id = serializers.IntegerField(write_only=True)
    
    # 워크리스트 호환 필드명 사용 ✅
    patientName = serializers.CharField(source='study_request.patient_name', read_only=True)
    patientId = serializers.CharField(source='study_request.patient_id', read_only=True)
    modality = serializers.CharField(source='study_request.modality', read_only=True)
    examPart = serializers.CharField(source='study_request.body_part', read_only=True)
    
    class Meta:
        model = DocumentRequest
        fields = [
            'id', 'study_request', 'document_type', 'document_type_id',
            'status', 'requested_at', 'generated_at', 'completed_at',
            'generated_file_path', 'scanned_file_path', 'processed_by', 'notes',
            # 워크리스트 호환 필드명 ✅
            'patientName', 'patientId', 'modality', 'examPart'
        ]
        read_only_fields = ['requested_at', 'generated_at', 'completed_at']
    
    def create(self, validated_data):
        """서류 요청 생성"""
        document_type_id = validated_data.pop('document_type_id')
        document_type = DocumentType.objects.get(id=document_type_id)
        validated_data['document_type'] = document_type
        return super().create(validated_data)


class StudyDocumentsSerializer(serializers.ModelSerializer):
    """🔥 검사별 서류 목록용 시리얼라이저 - 워크리스트 필드명 호환"""
    
    documents = serializers.SerializerMethodField()
    
    # 🔥 워크리스트와 동일한 필드명 사용
    patientId = serializers.CharField(source='patient_id')
    patientName = serializers.CharField(source='patient_name')
    birthDate = serializers.CharField(source='birth_date')  # 날짜 형식 맞춤
    examPart = serializers.CharField(source='body_part')
    reportingDoctor = serializers.CharField(source='interpreting_physician')
    
    # 🔥 수정: 검사일시는 scheduled_exam_datetime 사용
    examDateTime = serializers.SerializerMethodField()
    # 🔥 추가: 요청일시도 별도로 제공
    requestDateTime = serializers.SerializerMethodField()
    
    examStatus = serializers.CharField(source='study_status')
    
    class Meta:
        model = StudyRequest
        fields = [
            # 🔥 워크리스트 호환 필드명
            'id', 'patientId', 'patientName', 'birthDate',
            'examPart', 'modality', 'reportingDoctor', 
            'examDateTime', 'requestDateTime', 'priority', 'examStatus',
            'documents'
        ]
    
    def get_examDateTime(self, obj):
        """🔥 실제 검사일시 반환 (scheduled_exam_datetime 우선)"""
        # 1순위: 예약된 검사 시간
        if obj.scheduled_exam_datetime:
            return self._format_korean_datetime(obj.scheduled_exam_datetime)
        
        # 2순위: 실제 시작된 검사 시간
        elif obj.actual_start_time:
            return self._format_korean_datetime(obj.actual_start_time)
        
        # 3순위: 요청 시간 (fallback)
        elif obj.request_datetime:
            return self._format_korean_datetime(obj.request_datetime)
        
        return 'N/A'
    
    def get_requestDateTime(self, obj):
        """🔥 요청일시 반환"""
        if obj.request_datetime:
            return self._format_korean_datetime(obj.request_datetime)
        return 'N/A'
    
    def get_documents(self, obj):
        """해당 검사의 모든 서류 요청 반환"""
        document_requests = obj.document_requests.all().order_by('document_type__sort_order')
        return DocumentRequestSerializer(document_requests, many=True).data
    
    def to_representation(self, instance):
        """🔥 날짜 형식을 워크리스트와 동일하게 변환"""
        ret = super().to_representation(instance)
        
        # 날짜 형식 변환 (Django → 워크리스트 형식)
        if instance.birth_date:
            ret['birthDate'] = instance.birth_date.strftime('%Y/%m/%d')
        
        return ret
    
    def _format_korean_datetime(self, dt):
        """날짜시간을 한국어 형식으로 변환"""
        if not dt:
            return 'N/A'
            
        try:
            import pytz
            from django.utils import timezone as django_timezone
            
            # UTC를 KST로 변환
            kst = pytz.timezone('Asia/Seoul')
            if dt.tzinfo is None:
                dt = django_timezone.make_aware(dt, kst)
            else:
                dt = dt.astimezone(kst)
            
            # 한국어 형식으로 변환 "2025. 6. 27. 오전 3:52"
            hour = dt.hour
            minute = dt.minute
            ampm = '오전' if hour < 12 else '오후'
            display_hour = hour if hour <= 12 else hour - 12
            display_hour = 12 if display_hour == 0 else display_hour
            
            return f"{dt.year}. {dt.month}. {dt.day}. {ampm} {display_hour}:{minute:02d}"
            
        except Exception as e:
            # 변환 실패시 기본 형식 반환
            return dt.strftime('%Y-%m-%d %H:%M') if dt else 'N/A'

# class StudyDocumentsSerializer(serializers.ModelSerializer):
#     """🔥 검사별 서류 목록용 시리얼라이저 - 워크리스트 필드명 호환"""
    
#     documents = serializers.SerializerMethodField()
    
#     # 🔥 워크리스트와 동일한 필드명 사용
#     patientId = serializers.CharField(source='patient_id')
#     patientName = serializers.CharField(source='patient_name')
#     birthDate = serializers.CharField(source='birth_date')  # 날짜 형식 맞춤
#     examPart = serializers.CharField(source='body_part')
#     reportingDoctor = serializers.CharField(source='interpreting_physician')
#     requestDateTime = serializers.CharField(source='request_datetime')  # 날짜 형식 맞춤
#     examStatus = serializers.CharField(source='study_status')
    
#     class Meta:
#         model = StudyRequest
#         fields = [
#             # 🔥 워크리스트 호환 필드명
#             'id', 'patientId', 'patientName', 'birthDate',
#             'examPart', 'modality', 'reportingDoctor', 
#             'requestDateTime', 'priority', 'examStatus',
#             'documents'
#         ]
    
#     def get_documents(self, obj):
#         """해당 검사의 모든 서류 요청 반환"""
#         document_requests = obj.document_requests.all().order_by('document_type__sort_order')
#         return DocumentRequestSerializer(document_requests, many=True).data
    
#     def to_representation(self, instance):
#         """🔥 날짜 형식을 워크리스트와 동일하게 변환"""
#         ret = super().to_representation(instance)
        
#         # 날짜 형식 변환 (Django → 워크리스트 형식)
#         if instance.birth_date:
#             ret['birthDate'] = instance.birth_date.strftime('%Y/%m/%d')
        
#         if instance.request_datetime:
#             # "2025. 6. 27. 오전 3:52" 형식으로 변환
#             from django.utils import timezone
#             import pytz
            
#             # UTC를 KST로 변환
#             kst = pytz.timezone('Asia/Seoul')
#             kst_time = instance.request_datetime.astimezone(kst) if instance.request_datetime.tzinfo else kst.localize(instance.request_datetime)
            
#             # 한국어 형식으로 변환
#             hour = kst_time.hour
#             minute = kst_time.minute
#             ampm = '오전' if hour < 12 else '오후'
#             display_hour = hour if hour <= 12 else hour - 12
#             display_hour = 12 if display_hour == 0 else display_hour
            
#             ret['requestDateTime'] = f"{kst_time.year}. {kst_time.month}. {kst_time.day}. {ampm} {display_hour}:{minute:02d}"
        
#         return ret


class DocumentProcessRequestSerializer(serializers.Serializer):
    """서류 일괄 처리 요청용 시리얼라이저"""
    
    document_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="처리할 서류 ID 목록"
    )
    action = serializers.ChoiceField(
        choices=['select', 'generate', 'complete', 'cancel'],
        default='select',
        help_text="수행할 액션"
    )
    processed_by = serializers.CharField(
        max_length=100,
        required=False,
        help_text="처리자 이름"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="처리 비고"
    )


class DocumentStatusUpdateSerializer(serializers.Serializer):
    """개별 서류 상태 변경용 시리얼라이저"""
    
    status = serializers.ChoiceField(
        choices=DocumentRequest.STATUS_CHOICES,
        help_text="변경할 상태"
    )
    processed_by = serializers.CharField(
        max_length=100,
        required=False,
        help_text="처리자 이름"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="처리 비고"
    )
    file_path = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="파일 경로 (생성된 파일 또는 스캔된 파일)"
    )


class DocumentPreviewSerializer(serializers.Serializer):
    """서류 미리보기용 시리얼라이저"""
    
    document_type = serializers.CharField(help_text="서류 종류 코드")
    patient_name = serializers.CharField(help_text="환자명")
    modality = serializers.CharField(help_text="검사 장비")
    body_part = serializers.CharField(help_text="검사 부위")
    
    def to_representation(self, instance):
        """미리보기용 데이터 생성"""
        if isinstance(instance, DocumentRequest):
            study = instance.study_request
            return {
                'document_type': instance.document_type.code,
                'document_name': instance.document_type.name,
                'patient_name': study.patient_name,
                'patient_id': study.patient_id,
                'modality': study.modality,
                'body_part': study.body_part,
                'birth_date': study.birth_date.strftime('%Y-%m-%d') if study.birth_date else None,
                'request_date': study.request_datetime.strftime('%Y-%m-%d') if study.request_datetime else None,
                'requires_signature': instance.document_type.requires_signature
            }
        return super().to_representation(instance)


class DocumentTemplateSerializer(serializers.ModelSerializer):
    """서류 템플릿 시리얼라이저"""
    
    document_type = DocumentTypeSerializer(read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'document_type', 'template_content', 
            'is_active', 'created_at', 'updated_at'
        ]