from rest_framework import serializers
from .models import AnnotationResult

class AnnotationResultSerializer(serializers.ModelSerializer):
    """어노테이션 결과 시리얼라이저"""
    
    class Meta:
        model = AnnotationResult
        fields = [
            'id',
            'patient_id',
            'study_uid',
            'series_uid',  # 👈 추가
            'instance_uid',  # 👈 추가
            'instance_number',  # 👈 추가
            'doctor_id',
            'doctor_name',
            'label',
            'bbox',
            'dr_text',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_bbox(self, value):
        """바운딩박스 유효성 검사"""
        if not isinstance(value, list):
            raise serializers.ValidationError("bbox는 리스트 형태여야 합니다.")
        
        if len(value) != 4:
            raise serializers.ValidationError("bbox는 [x1, y1, x2, y2] 형태의 4개 좌표여야 합니다.")
        
        try:
            # 모든 값이 숫자인지 확인
            bbox_nums = [float(x) for x in value]
            
            # x1 < x2, y1 < y2 검사
            if bbox_nums[0] >= bbox_nums[2]:
                raise serializers.ValidationError("x1은 x2보다 작아야 합니다.")
            if bbox_nums[1] >= bbox_nums[3]:
                raise serializers.ValidationError("y1은 y2보다 작아야 합니다.")
                
        except (ValueError, TypeError):
            raise serializers.ValidationError("bbox 좌표는 모두 숫자여야 합니다.")
        
        return value
    
    def validate_label(self, value):
        """라벨 유효성 검사"""
        if not value or not value.strip():
            raise serializers.ValidationError("라벨은 비어있을 수 없습니다.")
        return value.strip()
    
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

class AnnotationResultCreateSerializer(serializers.Serializer):
    """어노테이션 일괄 생성용 시리얼라이저"""
    
    study_uid = serializers.CharField(max_length=255)
    patient_id = serializers.CharField(max_length=100)
    series_uid = serializers.CharField(max_length=255, required=False, allow_blank=True)  # 👈 추가
    instance_uid = serializers.CharField(max_length=255, required=False, allow_blank=True)  # 👈 추가
    instance_number = serializers.IntegerField(required=False, allow_null=True)  # 👈 추가
    annotations = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        help_text="어노테이션 리스트"
    )
    
    def validate_annotations(self, value):
        """어노테이션 리스트 유효성 검사"""
        if not value:
            raise serializers.ValidationError("최소 하나의 어노테이션이 필요합니다.")
        
        for i, annotation in enumerate(value):
            # 필수 필드 확인
            required_fields = ['label', 'bbox']
            for field in required_fields:
                if field not in annotation:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번에 '{field}' 필드가 필요합니다.")
            
            # bbox 검사
            bbox = annotation.get('bbox')
            if not isinstance(bbox, list) or len(bbox) != 4:
                raise serializers.ValidationError(f"어노테이션 {i+1}번의 bbox는 [x1, y1, x2, y2] 형태여야 합니다.")
            
            try:
                bbox_nums = [float(x) for x in bbox]
                if bbox_nums[0] >= bbox_nums[2] or bbox_nums[1] >= bbox_nums[3]:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번의 bbox 좌표가 올바르지 않습니다.")
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"어노테이션 {i+1}번의 bbox 좌표는 모두 숫자여야 합니다.")
            
            # label 검사
            label = annotation.get('label')
            if not label or not str(label).strip():
                raise serializers.ValidationError(f"어노테이션 {i+1}번의 라벨이 비어있습니다.")
        
        return value

class AnnotationResultListSerializer(serializers.ModelSerializer):
    """어노테이션 목록 조회용 시리얼라이저 (간단한 정보만)"""
    
    class Meta:
        model = AnnotationResult
        fields = [
            'id',
            'label',
            'bbox', 
            'series_uid',  # 👈 추가
            'instance_number',  # 👈 추가
            'dr_text',
            'created_at'
        ]