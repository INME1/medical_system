# management/commands/fix_patient_display_names.py
from django.core.management.base import BaseCommand
from medical_integration.models import PatientMapping
from medical_integration.openmrs_api import OpenMRSAPI

class Command(BaseCommand):
    help = '빈 display 값을 OpenMRS에서 다시 불러와 갱신합니다.'

    def handle(self, *args, **kwargs):
        api = OpenMRSAPI()
        count = 0
        for m in PatientMapping.objects.filter(display__isnull=True):
            try:
                patient = api.get_patient(m.openmrs_patient_uuid)
                person = patient.get('person', {})
                name = person.get('preferredName', {})
                full_name = f"{name.get('givenName', '').strip()} {name.get('familyName', '').strip()}".strip()
                if full_name:
                    m.display = full_name
                    m.save(update_fields=['display'])
                    count += 1
            except Exception as e:
                self.stderr.write(f"⚠️ 실패: {m.patient_identifier} -> {e}")
        self.stdout.write(f"✅ {count}명의 display 이름 갱신 완료.")
