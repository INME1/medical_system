from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import TestResult
import requests

@receiver(post_save, sender=TestResult)
def send_to_cdss_on_result_save(sender, instance, created, **kwargs):
    if not created:
        return  # 새로 생성된 경우에만 CDSS로 전송

    data = {
        "sample_id": instance.sample.id,
        "test_type": instance.test_type,
        "component_name": instance.component_name,
        "value": instance.result_value,
        "unit": instance.result_unit,
        "verified_by": instance.verified_by,
        "verified_date": instance.verified_date.isoformat(),
    }

    try:
        response = requests.post("http://35.225.63.41:8000/api/predict/", json=data, timeout=5)
        response.raise_for_status()
        print("✅ CDSS 연동 성공")
    except requests.RequestException as e:
        print(f"❌ CDSS 연동 실패: {e}")
