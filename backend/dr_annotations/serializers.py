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
            'series_uid',
            'instance_uid',
            'instance_number',
            'doctor_id',
            'doctor_name',
            'label',
            'shape_type',
            'coordinates',
            'dr_text',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_coordinates(self, value):
        """도형별 좌표 유효성 검사"""
        if not isinstance(value, list):
            raise serializers.ValidationError("coordinates는 리스트 형태여야 합니다.")
        
        # shape_type에 따라 다른 검증 로직 적용
        shape_type = self.initial_data.get('shape_type')
        
        if shape_type == 'rectangle':
            # 사각형: [x, y, width, height]
            if len(value) != 4:
                raise serializers.ValidationError("사각형은 [x, y, width, height] 형태의 4개 좌표여야 합니다.")
            try:
                coords = [float(x) for x in value]
                if coords[2] <= 0 or coords[3] <= 0:
                    raise serializers.ValidationError("width와 height는 0보다 커야 합니다.")
            except (ValueError, TypeError):
                raise serializers.ValidationError("좌표는 모두 숫자여야 합니다.")
                
        elif shape_type == 'circle':
            # 원형: [centerX, centerY, radius]
            if len(value) != 3:
                raise serializers.ValidationError("원형은 [centerX, centerY, radius] 형태의 3개 좌표여야 합니다.")
            try:
                coords = [float(x) for x in value]
                if coords[2] <= 0:
                    raise serializers.ValidationError("radius는 0보다 커야 합니다.")
            except (ValueError, TypeError):
                raise serializers.ValidationError("좌표는 모두 숫자여야 합니다.")
                
        elif shape_type == 'line':
            # 길이측정: [x1, y1, x2, y2]
            if len(value) != 4:
                raise serializers.ValidationError("선분은 [x1, y1, x2, y2] 형태의 4개 좌표여야 합니다.")
            try:
                coords = [float(x) for x in value]
                # 시작점과 끝점이 같으면 안됨
                if coords[0] == coords[2] and coords[1] == coords[3]:
                    raise serializers.ValidationError("시작점과 끝점이 동일할 수 없습니다.")
            except (ValueError, TypeError):
                raise serializers.ValidationError("좌표는 모두 숫자여야 합니다.")
        else:
            raise serializers.ValidationError("지원하지 않는 shape_type입니다.")
        
        return value
    
    def validate_shape_type(self, value):
        """shape_type 유효성 검사"""
        valid_types = ['rectangle', 'circle', 'line']
        if value not in valid_types:
            raise serializers.ValidationError(f"shape_type은 {valid_types} 중 하나여야 합니다.")
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
    series_uid = serializers.CharField(max_length=255, required=False, allow_blank=True)
    instance_uid = serializers.CharField(max_length=255, required=False, allow_blank=True)
    instance_number = serializers.IntegerField(required=False, allow_null=True)
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
            required_fields = ['label', 'shape_type', 'coordinates']
            for field in required_fields:
                if field not in annotation:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번에 '{field}' 필드가 필요합니다.")
            
            # shape_type 검사
            shape_type = annotation.get('shape_type')
            if shape_type not in ['rectangle', 'circle', 'line']:
                raise serializers.ValidationError(f"어노테이션 {i+1}번의 shape_type이 올바르지 않습니다.")
            
            # coordinates 검사
            coordinates = annotation.get('coordinates')
            if not isinstance(coordinates, list):
                raise serializers.ValidationError(f"어노테이션 {i+1}번의 coordinates는 리스트여야 합니다.")
            
            # 도형별 coordinates 검증
            try:
                if shape_type == 'rectangle' and len(coordinates) != 4:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번: 사각형은 4개 좌표가 필요합니다.")
                elif shape_type == 'circle' and len(coordinates) != 3:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번: 원형은 3개 좌표가 필요합니다.")
                elif shape_type == 'line' and len(coordinates) != 4:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번: 선분은 4개 좌표가 필요합니다.")
                
                # 숫자 검증
                coords = [float(x) for x in coordinates]
                
                # 추가 검증
                if shape_type == 'rectangle' and (coords[2] <= 0 or coords[3] <= 0):
                    raise serializers.ValidationError(f"어노테이션 {i+1}번: 사각형의 width, height는 0보다 커야 합니다.")
                elif shape_type == 'circle' and coords[2] <= 0:
                    raise serializers.ValidationError(f"어노테이션 {i+1}번: 원형의 radius는 0보다 커야 합니다.")
                elif shape_type == 'line' and (coords[0] == coords[2] and coords[1] == coords[3]):
                    raise serializers.ValidationError(f"어노테이션 {i+1}번: 선분의 시작점과 끝점이 동일할 수 없습니다.")
                    
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"어노테이션 {i+1}번의 coordinates는 모두 숫자여야 합니다.")
            
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
            'shape_type',
            'coordinates',
            'series_uid',
            'instance_number',
            'dr_text',
            'doctor_name',
            'created_at'
        ]

class AnnotationResultDetailSerializer(serializers.ModelSerializer):
    """어노테이션 상세 조회용 시리얼라이저 (계산된 값 포함)"""
    
    # 계산된 필드들 추가
    area = serializers.SerializerMethodField()
    length = serializers.SerializerMethodField()
    
    class Meta:
        model = AnnotationResult
        fields = [
            'id',
            'patient_id',
            'study_uid',
            'series_uid',
            'instance_uid',
            'instance_number',
            'doctor_id',
            'doctor_name',
            'label',
            'shape_type',
            'coordinates',
            'dr_text',
            'area',       # 계산된 면적
            'length',     # 계산된 길이
            'created_at',
            'updated_at'
        ]
    
    def get_area(self, obj):
        """면적 계산 (사각형, 원형만)"""
        if obj.shape_type == 'rectangle':
            # [x, y, width, height]
            coords = obj.coordinates
            if len(coords) == 4:
                return coords[2] * coords[3]  # width * height
        elif obj.shape_type == 'circle':
            # [centerX, centerY, radius]
            coords = obj.coordinates
            if len(coords) == 3:
                import math
                return math.pi * (coords[2] ** 2)  # π * r²
        return None
    
    def get_length(self, obj):
        """길이 계산 (선분만)"""
        if obj.shape_type == 'line':
            # [x1, y1, x2, y2]
            coords = obj.coordinates
            if len(coords) == 4:
                import math
                dx = coords[2] - coords[0]
                dy = coords[3] - coords[1]
                return math.sqrt(dx*dx + dy*dy)
        return None