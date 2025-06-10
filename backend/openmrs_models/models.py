# # backend/openmrs_models/models.py

from django.db import models

class Person(models.Model):
    """OpenMRS Person 모델"""
    person_id = models.AutoField(primary_key=True)
    gender = models.CharField(max_length=50)
    birthdate = models.DateField(null=True, blank=True)
    birthdate_estimated = models.BooleanField(default=False)
    dead = models.BooleanField(default=False)
    death_date = models.DateField(null=True, blank=True)
    cause_of_death = models.IntegerField(null=True)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    changed_by = models.IntegerField(null=True, blank=True)
    date_changed = models.DateTimeField(null=True, blank=True)
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        db_table = 'person'
        managed = False
        app_label = 'openmrs_models'

    def __str__(self):
        return f"Person {self.person_id} ({self.uuid})"

class PersonName(models.Model):
    """OpenMRS PersonName 모델"""
    person_name_id = models.AutoField(primary_key=True)
    preferred = models.BooleanField(default=False)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    prefix = models.CharField(max_length=50, null=True)
    given_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, null=True, blank=True)
    family_name = models.CharField(max_length=50)
    family_name2 = models.CharField(max_length=50, null=True)
    family_name_suffix = models.CharField(max_length=50, null=True)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    changed_by = models.IntegerField(null=True, blank=True)
    date_changed = models.DateTimeField(null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        db_table = 'person_name'
        managed = False
        app_label = 'openmrs_models'

    def __str__(self):
        return f"{self.given_name} {self.family_name}"

    def get_full_name(self):
        """전체 이름을 반환"""
        name_parts = []
        if self.prefix:
            name_parts.append(self.prefix)
        name_parts.append(self.given_name)
        if self.middle_name:
            name_parts.append(self.middle_name)
        name_parts.append(self.family_name)
        if self.family_name2:
            name_parts.append(self.family_name2)
        if self.family_name_suffix:
            name_parts.append(self.family_name_suffix)
        return ' '.join(name_parts)

class Patient(models.Model):
    """OpenMRS Patient 모델"""
    patient_id = models.OneToOneField(Person, on_delete=models.CASCADE, primary_key=True, db_column='patient_id')
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    changed_by = models.IntegerField(null=True, blank=True)
    date_changed = models.DateTimeField(null=True, blank=True)
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'patient'
        managed = False
        app_label = 'openmrs_models'

    def __str__(self):
        return f"Patient {self.patient_id}"

    def get_active_name(self):
        """환자의 활성화된 이름을 반환"""
        return PersonName.objects.filter(
            person=self.patient_id,
            voided=False,
            preferred=True
        ).first() or PersonName.objects.filter(
            person=self.patient_id,
            voided=False
        ).first()

class PatientIdentifier(models.Model):
    patient_identifier_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.DO_NOTHING)
    identifier = models.CharField(max_length=50)
    identifier_type = models.IntegerField()
    preferred = models.BooleanField(default=False)
    location_id = models.IntegerField(null=True, blank=True)
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'patient_identifier'
        app_label = 'openmrs_models'

class Encounter(models.Model):
    encounter_id = models.AutoField(primary_key=True)
    encounter_type = models.IntegerField()
    patient = models.ForeignKey(Patient, on_delete=models.DO_NOTHING)
    location_id = models.IntegerField(null=True, blank=True)
    form_id = models.IntegerField(null=True, blank=True)
    encounter_datetime = models.DateTimeField()
    creator = models.IntegerField()
    date_created = models.DateTimeField()
    voided = models.BooleanField(default=False)
    voided_by = models.IntegerField(null=True, blank=True)
    date_voided = models.DateTimeField(null=True, blank=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    changed_by = models.IntegerField(null=True, blank=True)
    date_changed = models.DateTimeField(null=True, blank=True)
    visit_id = models.IntegerField(null=True, blank=True)
    uuid = models.CharField(max_length=38, unique=True)

    class Meta:
        managed = False
        db_table = 'encounter'
        app_label = 'openmrs_models'