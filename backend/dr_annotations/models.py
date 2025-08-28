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