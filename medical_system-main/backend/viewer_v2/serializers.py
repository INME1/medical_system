# backend/viewer_v2/serializers.py

from rest_framework import serializers
from datetime import datetime
from typing import Dict, List, Optional

class PatientSerializer(serializers.Serializer):
    """환자 정보 시리얼라이저"""
    uuid = serializers.CharField(max_length=255, help_text="Orthanc 환자 UUID")
    patient_id = serializers.CharField(max_length=100, help_text="환자 ID")
    patient_name = serializers.CharField(max_length=255, allow_blank=True, help_text="환자명")
    patient_birth_date = serializers.CharField(max_length=10, allow_blank=True, help_text="생년월일 (YYYYMMDD)")
    patient_sex = serializers.CharField(max_length=10, allow_blank=True, help_text="성별")
    studies_count = serializers.IntegerField(default=0, help_text="스터디 개수")
    
    def validate_patient_birth_date(self, value):
        """생년월일 형식 검증"""
        if value and len(value) == 8 and value.isdigit():
            try:
                datetime.strptime(value, '%Y%m%d')
                return value
            except ValueError:
                raise serializers.ValidationError("생년월일은 YYYYMMDD 형식이어야 합니다.")
        return value
    
    def validate_patient_sex(self, value):
        """성별 형식 검증"""
        if value and value.upper() not in ['M', 'F', 'O', 'MALE', 'FEMALE', 'OTHER']:
            raise serializers.ValidationError("성별은 M, F, O 중 하나여야 합니다.")
        return value.upper() if value else value

class StudySerializer(serializers.Serializer):
    """스터디 정보 시리얼라이저 (DICOMweb 형식)"""
    study_instance_uid = serializers.SerializerMethodField(help_text="스터디 인스턴스 UID")
    study_id = serializers.SerializerMethodField(help_text="스터디 ID")
    study_date = serializers.SerializerMethodField(help_text="스터디 날짜")
    study_time = serializers.SerializerMethodField(help_text="스터디 시간")
    study_description = serializers.SerializerMethodField(help_text="스터디 설명")
    accession_number = serializers.SerializerMethodField(help_text="접수 번호")
    modalities_in_study = serializers.SerializerMethodField(help_text="스터디 내 모달리티")
    referring_physician_name = serializers.SerializerMethodField(help_text="의뢰 의사명")
    patient_name = serializers.SerializerMethodField(help_text="환자명")
    patient_id = serializers.SerializerMethodField(help_text="환자 ID")
    patient_birth_date = serializers.SerializerMethodField(help_text="환자 생년월일")
    patient_sex = serializers.SerializerMethodField(help_text="환자 성별")
    number_of_study_related_series = serializers.SerializerMethodField(help_text="관련 시리즈 수")
    number_of_study_related_instances = serializers.SerializerMethodField(help_text="관련 인스턴스 수")
    
    def get_study_instance_uid(self, obj):
        return self._get_dicom_value(obj, '0020000D')
    
    def get_study_id(self, obj):
        return self._get_dicom_value(obj, '00200010')
    
    def get_study_date(self, obj):
        return self._get_dicom_value(obj, '00080020')
    
    def get_study_time(self, obj):
        return self._get_dicom_value(obj, '00080030')
    
    def get_study_description(self, obj):
        return self._get_dicom_value(obj, '00081030')
    
    def get_accession_number(self, obj):
        return self._get_dicom_value(obj, '00080050')
    
    def get_modalities_in_study(self, obj):
        return self._get_dicom_value(obj, '00080061')
    
    def get_referring_physician_name(self, obj):
        return self._get_dicom_value(obj, '00080090')
    
    def get_patient_name(self, obj):
        return self._get_dicom_value(obj, '00100010')
    
    def get_patient_id(self, obj):
        return self._get_dicom_value(obj, '00100020')
    
    def get_patient_birth_date(self, obj):
        return self._get_dicom_value(obj, '00100030')
    
    def get_patient_sex(self, obj):
        return self._get_dicom_value(obj, '00100040')
    
    def get_number_of_study_related_series(self, obj):
        return self._get_dicom_value(obj, '00201206')
    
    def get_number_of_study_related_instances(self, obj):
        return self._get_dicom_value(obj, '00201208')
    
    def _get_dicom_value(self, obj, tag):
        """DICOMweb 형식에서 값 추출"""
        if isinstance(obj, dict) and tag in obj:
            value_obj = obj[tag]
            if isinstance(value_obj, dict) and 'Value' in value_obj:
                values = value_obj['Value']
                if isinstance(values, list) and len(values) > 0:
                    return values[0]
        return ""

class SeriesSerializer(serializers.Serializer):
    """시리즈 정보 시리얼라이저 (DICOMweb 형식)"""
    series_instance_uid = serializers.SerializerMethodField(help_text="시리즈 인스턴스 UID")
    series_number = serializers.SerializerMethodField(help_text="시리즈 번호")
    series_description = serializers.SerializerMethodField(help_text="시리즈 설명")
    modality = serializers.SerializerMethodField(help_text="모달리티")
    series_date = serializers.SerializerMethodField(help_text="시리즈 날짜")
    series_time = serializers.SerializerMethodField(help_text="시리즈 시간")
    laterality = serializers.SerializerMethodField(help_text="좌우 구분")
    body_part_examined = serializers.SerializerMethodField(help_text="검사 부위")
    protocol_name = serializers.SerializerMethodField(help_text="프로토콜명")
    number_of_series_related_instances = serializers.SerializerMethodField(help_text="관련 인스턴스 수")
    
    def get_series_instance_uid(self, obj):
        return self._get_dicom_value(obj, '0020000E')
    
    def get_series_number(self, obj):
        return self._get_dicom_value(obj, '00200011')
    
    def get_series_description(self, obj):
        return self._get_dicom_value(obj, '0008103E')
    
    def get_modality(self, obj):
        return self._get_dicom_value(obj, '00080060')
    
    def get_series_date(self, obj):
        return self._get_dicom_value(obj, '00080021')
    
    def get_series_time(self, obj):
        return self._get_dicom_value(obj, '00080031')
    
    def get_laterality(self, obj):
        return self._get_dicom_value(obj, '00200060')
    
    def get_body_part_examined(self, obj):
        return self._get_dicom_value(obj, '00180015')
    
    def get_protocol_name(self, obj):
        return self._get_dicom_value(obj, '00181030')
    
    def get_number_of_series_related_instances(self, obj):
        return self._get_dicom_value(obj, '00201209')
    
    def _get_dicom_value(self, obj, tag):
        """DICOMweb 형식에서 값 추출"""
        if isinstance(obj, dict) and tag in obj:
            value_obj = obj[tag]
            if isinstance(value_obj, dict) and 'Value' in value_obj:
                values = value_obj['Value']
                if isinstance(values, list) and len(values) > 0:
                    return values[0]
        return ""

class InstanceSerializer(serializers.Serializer):
    """인스턴스 정보 시리얼라이저 (DICOMweb 형식)"""
    sop_instance_uid = serializers.SerializerMethodField(help_text="SOP 인스턴스 UID")
    sop_class_uid = serializers.SerializerMethodField(help_text="SOP 클래스 UID")
    instance_number = serializers.SerializerMethodField(help_text="인스턴스 번호")
    number_of_frames = serializers.SerializerMethodField(help_text="프레임 수")
    rows = serializers.SerializerMethodField(help_text="행 수")
    columns = serializers.SerializerMethodField(help_text="열 수")
    bits_allocated = serializers.SerializerMethodField(help_text="할당된 비트")
    bits_stored = serializers.SerializerMethodField(help_text="저장된 비트")
    high_bit = serializers.SerializerMethodField(help_text="상위 비트")
    pixel_representation = serializers.SerializerMethodField(help_text="픽셀 표현")
    
    def get_sop_instance_uid(self, obj):
        return self._get_dicom_value(obj, '00080018')
    
    def get_sop_class_uid(self, obj):
        return self._get_dicom_value(obj, '00080016')
    
    def get_instance_number(self, obj):
        return self._get_dicom_value(obj, '00200013')
    
    def get_number_of_frames(self, obj):
        return self._get_dicom_value(obj, '00280008')
    
    def get_rows(self, obj):
        return self._get_dicom_value(obj, '00280010')
    
    def get_columns(self, obj):
        return self._get_dicom_value(obj, '00280011')
    
    def get_bits_allocated(self, obj):
        return self._get_dicom_value(obj, '00280100')
    
    def get_bits_stored(self, obj):
        return self._get_dicom_value(obj, '00280101')
    
    def get_high_bit(self, obj):
        return self._get_dicom_value(obj, '00280102')
    
    def get_pixel_representation(self, obj):
        return self._get_dicom_value(obj, '00280103')
    
    def _get_dicom_value(self, obj, tag):
        """DICOMweb 형식에서 값 추출"""
        if isinstance(obj, dict) and tag in obj:
            value_obj = obj[tag]
            if isinstance(value_obj, dict) and 'Value' in value_obj:
                values = value_obj['Value']
                if isinstance(values, list) and len(values) > 0:
                    return values[0]
        return ""

class StudyDetailSerializer(serializers.Serializer):
    """스터디 상세 정보 시리얼라이저"""
    study_info = StudySerializer(help_text="스터디 기본 정보")
    patient_info = PatientSerializer(required=False, help_text="환자 정보")
    series_list = SeriesSerializer(many=True, required=False, help_text="시리즈 목록")
    series_count = serializers.IntegerField(default=0, help_text="시리즈 개수")
    instances_count = serializers.IntegerField(default=0, help_text="인스턴스 개수")

class SeriesDetailSerializer(serializers.Serializer):
    """시리즈 상세 정보 시리얼라이저"""
    series_info = SeriesSerializer(help_text="시리즈 기본 정보")
    instances_list = InstanceSerializer(many=True, required=False, help_text="인스턴스 목록")
    instances_count = serializers.IntegerField(default=0, help_text="인스턴스 개수")

class SearchParamsSerializer(serializers.Serializer):
    """검색 파라미터 시리얼라이저"""
    PatientID = serializers.CharField(required=False, help_text="환자 ID")
    PatientName = serializers.CharField(required=False, help_text="환자명")
    StudyDate = serializers.CharField(required=False, help_text="스터디 날짜 (YYYYMMDD)")
    StudyTime = serializers.CharField(required=False, help_text="스터디 시간")
    StudyDescription = serializers.CharField(required=False, help_text="스터디 설명")
    AccessionNumber = serializers.CharField(required=False, help_text="접수 번호")
    ModalitiesInStudy = serializers.CharField(required=False, help_text="모달리티")
    ReferringPhysicianName = serializers.CharField(required=False, help_text="의뢰 의사명")
    StudyInstanceUID = serializers.CharField(required=False, help_text="스터디 인스턴스 UID")
    SeriesInstanceUID = serializers.CharField(required=False, help_text="시리즈 인스턴스 UID")
    SOPInstanceUID = serializers.CharField(required=False, help_text="SOP 인스턴스 UID")
    
    def validate_StudyDate(self, value):
        """스터디 날짜 형식 검증"""
        if value:
            # YYYYMMDD 형식 확인
            if len(value) == 8 and value.isdigit():
                try:
                    datetime.strptime(value, '%Y%m%d')
                    return value
                except ValueError:
                    raise serializers.ValidationError("스터디 날짜는 YYYYMMDD 형식이어야 합니다.")
            # YYYY-MM-DD 형식도 허용
            elif len(value) == 10 and value.count('-') == 2:
                try:
                    datetime.strptime(value, '%Y-%m-%d')
                    return value.replace('-', '')  # YYYYMMDD로 변환
                except ValueError:
                    raise serializers.ValidationError("스터디 날짜는 YYYY-MM-DD 또는 YYYYMMDD 형식이어야 합니다.")
            else:
                raise serializers.ValidationError("스터디 날짜는 YYYY-MM-DD 또는 YYYYMMDD 형식이어야 합니다.")
        return value

class SystemInfoSerializer(serializers.Serializer):
    """시스템 정보 시리얼라이저"""
    Name = serializers.CharField(help_text="시스템 이름")
    Version = serializers.CharField(help_text="버전")
    DatabaseVersion = serializers.CharField(required=False, help_text="데이터베이스 버전")
    DicomAet = serializers.CharField(required=False, help_text="DICOM AET")
    DicomPort = serializers.IntegerField(required=False, help_text="DICOM 포트")
    HttpPort = serializers.IntegerField(required=False, help_text="HTTP 포트")
    StorageAreaPlugin = serializers.CharField(required=False, help_text="스토리지 플러그인")
    DatabaseBackendPlugin = serializers.CharField(required=False, help_text="데이터베이스 백엔드 플러그인")

class StatisticsSerializer(serializers.Serializer):
    """통계 정보 시리얼라이저"""
    CountPatients = serializers.IntegerField(help_text="환자 수")
    CountStudies = serializers.IntegerField(help_text="스터디 수")
    CountSeries = serializers.IntegerField(help_text="시리즈 수")
    CountInstances = serializers.IntegerField(help_text="인스턴스 수")
    TotalDiskSize = serializers.CharField(help_text="총 디스크 사용량")
    TotalDiskSizeMB = serializers.IntegerField(help_text="총 디스크 사용량 (MB)")
    TotalUncompressedSize = serializers.CharField(required=False, help_text="총 압축 해제 크기")
    TotalUncompressedSizeMB = serializers.IntegerField(required=False, help_text="총 압축 해제 크기 (MB)")

class ConnectionTestSerializer(serializers.Serializer):
    """연결 테스트 시리얼라이저"""
    orthanc_connection = serializers.BooleanField(help_text="Orthanc 연결 상태")
    dicomweb_connection = serializers.BooleanField(help_text="DICOMweb 연결 상태")
    system_info = SystemInfoSerializer(required=False, help_text="시스템 정보")
    error_messages = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="오류 메시지 목록"
    )

class DicomWebTestSerializer(serializers.Serializer):
    """DICOMweb 테스트 시리얼라이저"""
    qido_studies = serializers.BooleanField(help_text="QIDO-RS Studies 테스트")
    qido_series = serializers.BooleanField(help_text="QIDO-RS Series 테스트")
    qido_instances = serializers.BooleanField(help_text="QIDO-RS Instances 테스트")
    wado_rendered = serializers.BooleanField(help_text="WADO-RS 렌더링 테스트")
    error_messages = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="오류 메시지 목록"
    )

class DebugPatientDataSerializer(serializers.Serializer):
    """환자 데이터 디버깅 시리얼라이저"""
    patient_id = serializers.CharField(help_text="환자 ID")
    patient_found = serializers.BooleanField(help_text="환자 발견 여부")
    patient_data = PatientSerializer(required=False, help_text="환자 데이터")
    studies_count = serializers.IntegerField(help_text="스터디 개수")
    studies_data = StudySerializer(many=True, required=False, help_text="스터디 데이터 (최대 5개)")
    error_messages = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="오류 메시지 목록"
    )

class DebugStudyDataSerializer(serializers.Serializer):
    """스터디 데이터 디버깅 시리얼라이저"""
    study_uid = serializers.CharField(help_text="스터디 UID")
    study_found = serializers.BooleanField(help_text="스터디 발견 여부")
    study_data = StudySerializer(required=False, help_text="스터디 데이터")
    series_count = serializers.IntegerField(help_text="시리즈 개수")
    series_data = SeriesSerializer(many=True, required=False, help_text="시리즈 데이터 (최대 3개)")
    error_messages = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="오류 메시지 목록"
    )

class ErrorResponseSerializer(serializers.Serializer):
    """에러 응답 시리얼라이저"""
    error = serializers.CharField(help_text="에러 메시지")
    details = serializers.CharField(required=False, help_text="에러 상세 정보")
    timestamp = serializers.DateTimeField(default=datetime.now, help_text="에러 발생 시간")
    
class SuccessResponseSerializer(serializers.Serializer):
    """성공 응답 시리얼라이저"""
    message = serializers.CharField(help_text="성공 메시지")
    data = serializers.JSONField(required=False, help_text="응답 데이터")
    timestamp = serializers.DateTimeField(default=datetime.now, help_text="응답 시간")

# ===================================================================
# ViewSet용 시리얼라이저들 (DRF ViewSet을 사용할 경우)
# ===================================================================

class QidoStudiesRequestSerializer(serializers.Serializer):
    """QIDO-RS Studies 요청 시리얼라이저"""
    limit = serializers.IntegerField(required=False, min_value=1, max_value=1000, default=50, help_text="최대 결과 수")
    offset = serializers.IntegerField(required=False, min_value=0, default=0, help_text="오프셋")
    
    # DICOM 검색 필드들
    PatientID = serializers.CharField(required=False, help_text="환자 ID")
    PatientName = serializers.CharField(required=False, help_text="환자명")
    StudyDate = serializers.CharField(required=False, help_text="스터디 날짜")
    StudyTime = serializers.CharField(required=False, help_text="스터디 시간")
    AccessionNumber = serializers.CharField(required=False, help_text="접수 번호")
    StudyInstanceUID = serializers.CharField(required=False, help_text="스터디 인스턴스 UID")
    StudyID = serializers.CharField(required=False, help_text="스터디 ID")
    StudyDescription = serializers.CharField(required=False, help_text="스터디 설명")
    ModalitiesInStudy = serializers.CharField(required=False, help_text="모달리티")
    ReferringPhysicianName = serializers.CharField(required=False, help_text="의뢰 의사명")

class QidoSeriesRequestSerializer(serializers.Serializer):
    """QIDO-RS Series 요청 시리얼라이저"""
    limit = serializers.IntegerField(required=False, min_value=1, max_value=1000, default=100, help_text="최대 결과 수")
    offset = serializers.IntegerField(required=False, min_value=0, default=0, help_text="오프셋")
    
    # DICOM 검색 필드들
    SeriesInstanceUID = serializers.CharField(required=False, help_text="시리즈 인스턴스 UID")
    SeriesNumber = serializers.CharField(required=False, help_text="시리즈 번호")
    SeriesDescription = serializers.CharField(required=False, help_text="시리즈 설명")
    Modality = serializers.CharField(required=False, help_text="모달리티")
    SeriesDate = serializers.CharField(required=False, help_text="시리즈 날짜")
    SeriesTime = serializers.CharField(required=False, help_text="시리즈 시간")
    BodyPartExamined = serializers.CharField(required=False, help_text="검사 부위")
    ProtocolName = serializers.CharField(required=False, help_text="프로토콜명")

class QidoInstancesRequestSerializer(serializers.Serializer):
    """QIDO-RS Instances 요청 시리얼라이저"""
    limit = serializers.IntegerField(required=False, min_value=1, max_value=1000, default=200, help_text="최대 결과 수")
    offset = serializers.IntegerField(required=False, min_value=0, default=0, help_text="오프셋")
    
    # DICOM 검색 필드들
    SOPInstanceUID = serializers.CharField(required=False, help_text="SOP 인스턴스 UID")
    SOPClassUID = serializers.CharField(required=False, help_text="SOP 클래스 UID")
    InstanceNumber = serializers.CharField(required=False, help_text="인스턴스 번호")

class WadoRenderedRequestSerializer(serializers.Serializer):
    """WADO-RS 렌더링 요청 시리얼라이저"""
    viewport = serializers.CharField(required=False, help_text="뷰포트 크기 (예: 512,512)")
    quality = serializers.IntegerField(required=False, min_value=1, max_value=100, default=90, help_text="이미지 품질 (1-100)")
    contentType = serializers.CharField(required=False, default='image/png', help_text="콘텐츠 타입")
    
    def validate_viewport(self, value):
        """뷰포트 형식 검증"""
        if value:
            try:
                parts = value.split(',')
                if len(parts) == 2:
                    width, height = int(parts[0]), int(parts[1])
                    if width > 0 and height > 0 and width <= 4096 and height <= 4096:
                        return value
                raise ValueError()
            except (ValueError, IndexError):
                raise serializers.ValidationError("뷰포트는 'width,height' 형식이어야 합니다 (예: 512,512)")
        return value
    
    def validate_contentType(self, value):
        """콘텐츠 타입 검증"""
        allowed_types = ['image/png', 'image/jpeg', 'image/gif']
        if value and value not in allowed_types:
            raise serializers.ValidationError(f"콘텐츠 타입은 {', '.join(allowed_types)} 중 하나여야 합니다.")
        return value