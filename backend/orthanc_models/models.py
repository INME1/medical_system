# backend/orthanc_models/models.py

from django.db import models

class Resources(models.Model):
    """Orthanc 리소스 모델"""
    internalId = models.AutoField(primary_key=True)
    resourceType = models.IntegerField()  # 0: Patient, 1: Study, 2: Series, 3: Instance
    publicId = models.CharField(max_length=255)
    parentId = models.IntegerField(null=True, blank=True)
    
    dicom_tags = models.ManyToManyField(
        'MainDicomTags',
        through='ResourceTags',
        related_name='resources'
    )
    metadata = models.ManyToManyField(
        'Metadata',
        through='ResourceMetadata',
        related_name='resources'
    )

    class Meta:
        managed = False
        db_table = 'Resources'
        app_label = 'orthanc_models'

    def __str__(self):
        return f"{self.get_resource_type_display()} - {self.publicId}"

    def get_resource_type_display(self):
        resource_types = {
            0: 'Patient',
            1: 'Study',
            2: 'Series',
            3: 'Instance'
        }
        return resource_types.get(self.resourceType, 'Unknown')

    @classmethod
    def get_patient_resources(cls):
        """환자 타입의 리소스만 조회"""
        return cls.objects.filter(resourceType=0)  # 0 = Patient type

    def get_studies(self):
        """해당 환자의 모든 검사(Study) 조회"""
        return Resources.objects.filter(
            resourceType=1,  # 1 = Study type
            parentId=self.internalId
        )

    def get_series(self):
        """해당 환자의 모든 시리즈(Series) 조회"""
        return Resources.objects.filter(
            resourceType=2,  # 2 = Series type
            parentId__in=self.get_studies().values_list('internalId', flat=True)
        )

    def get_instances(self):
        """해당 환자의 모든 인스턴스(Instance) 조회"""
        return Resources.objects.filter(
            resourceType=3,  # 3 = Instance type
            parentId__in=self.get_series().values_list('internalId', flat=True)
        )

class ResourceTags(models.Model):
    """Resources와 MainDicomTags 간의 관계 테이블"""
    resource = models.ForeignKey(Resources, on_delete=models.CASCADE)
    tag = models.ForeignKey('MainDicomTags', on_delete=models.CASCADE)

    class Meta:
        managed = False
        db_table = 'ResourceTags'
        app_label = 'orthanc_models'

class ResourceMetadata(models.Model):
    """Resources와 Metadata 간의 관계 테이블"""
    resource = models.ForeignKey(Resources, on_delete=models.CASCADE)
    metadata = models.ForeignKey('Metadata', on_delete=models.CASCADE)

    class Meta:
        managed = False
        db_table = 'ResourceMetadata'
        app_label = 'orthanc_models'

class MainDicomTags(models.Model):
    id = models.AutoField(primary_key=True)
    tagGroup = models.IntegerField()
    tagElement = models.IntegerField()
    value = models.TextField()

    class Meta:
        managed = False
        db_table = 'MainDicomTags'
        app_label = 'orthanc_models'

class DicomIdentifiers(models.Model):
    id = models.AutoField(primary_key=True)
    tagGroup = models.IntegerField()
    tagElement = models.IntegerField()
    value = models.TextField()

    class Meta:
        managed = False
        db_table = 'DicomIdentifiers'
        app_label = 'orthanc_models'

class Metadata(models.Model):
    id = models.AutoField(primary_key=True)
    type = models.IntegerField()
    value = models.TextField()

    class Meta:
        managed = False
        db_table = 'Metadata'
        app_label = 'orthanc_models'