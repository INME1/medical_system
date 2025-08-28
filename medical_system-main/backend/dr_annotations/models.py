# from django.db import models
# from django.conf import settings

# class AnnotationResult(models.Model):
#     # 기본 식별자
#     id = models.AutoField(primary_key=True)
    
#     # 환자 및 스터디 정보
#     patient_id = models.CharField(max_length=100, help_text="환자 ID (AI 분석 결과에서 가져옴)")
#     study_uid = models.CharField(max_length=255, db_index=True, help_text="StudyInstanceUID")
#     series_uid = models.CharField(max_length=255, blank=True, null=True, help_text="SeriesInstanceUID")
#     instance_uid = models.CharField(max_length=255, blank=True, null=True, help_text="InstanceUID (슬라이스 고유 ID)")
#     instance_number = models.IntegerField(blank=True, null=True, help_text="인스턴스 넘버(이미지 인덱스)")
    
#     # 판독의 정보 (기본값 제거, views.py에서 명시적 설정)
#     doctor_id = models.CharField(
#         max_length=50, 
#         help_text="판독의 ID (워크리스트에서 가져옴)"
#     )
#     doctor_name = models.CharField(
#         max_length=100, 
#         help_text="판독의 이름 (워크리스트에서 가져옴)"
#     )
    
#     # 어노테이션 데이터
#     label = models.CharField(max_length=100, help_text="의사가 마킹한 라벨")
#     bbox = models.JSONField(help_text="바운딩박스 좌표 [x1, y1, x2, y2]")
#     dr_text = models.TextField(blank=True, null=True, help_text="선택적 코멘트 (의견, 진단 등)")
    
#     # 타임스탬프
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         db_table = 'dr_annotations'
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['study_uid']),
#             models.Index(fields=['series_uid']),
#             models.Index(fields=['instance_uid']),
#             models.Index(fields=['patient_id']),
#             models.Index(fields=['doctor_id']),
#             models.Index(fields=['created_at']),
#         ]
    
#     def __str__(self):
#         return f"{self.label} - {self.patient_id} ({self.study_uid[:20]}...) - {self.doctor_name}"
    
#     def __repr__(self):
#         return f"<AnnotationResult: {self.id} - {self.label} - {self.doctor_name}>"




# migration 다시 시킴 아래 테이블로
from django.db import models

class AnnotationResult(models.Model):
    # 기본 식별자
    id = models.AutoField(primary_key=True)
    
    # 환자 및 스터디 정보
    patient_id = models.CharField(max_length=100, help_text="환자 ID")
    study_uid = models.CharField(max_length=255, db_index=True, help_text="StudyInstanceUID")
    series_uid = models.CharField(max_length=255, blank=True, null=True, help_text="SeriesInstanceUID")
    instance_uid = models.CharField(max_length=255, blank=True, null=True, help_text="InstanceUID")
    instance_number = models.IntegerField(blank=True, null=True, help_text="Instance Number")
    
    # 판독의 정보
    doctor_id = models.CharField(max_length=50, help_text="판독의 ID")
    doctor_name = models.CharField(max_length=100, help_text="판독의 이름")
    
    # 어노테이션 데이터
    label = models.CharField(max_length=100, help_text="주석 라벨")
    shape_type = models.CharField(
        max_length=20,
        choices=[
            ('rectangle', '사각형'),
            ('circle', '원형'),
            ('line', '길이측정')
        ],
        help_text="도형 종류"
    )
    coordinates = models.JSONField(help_text="도형 좌표 정보")
    dr_text = models.TextField(blank=True, null=True, help_text="의사 의견/메모")
    
    # 타임스탬프
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dr_annotations_annotationresult'  # Django 기본 테이블명 사용
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['study_uid']),
            models.Index(fields=['patient_id']),
            models.Index(fields=['doctor_name']),
            models.Index(fields=['shape_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"[{self.shape_type}] {self.label} - {self.patient_id} ({self.doctor_name})"