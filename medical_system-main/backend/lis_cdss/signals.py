# lis_cdss/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from lis_cdss.models import CDSSResult as LISCDSSResult
from medical_integration.models import PatientMapping
import requests
import logging

logger = logging.getLogger(__name__)

def generate_explanation(results: dict, panel: str) -> str:
    panel = panel.upper()
    if panel == 'PNEUMONIA':
        crp = results.get('CRP')
        if crp is not None and crp > 5.0:
            return f"CRP 수치({crp})가 5.0을 초과하여 폐렴 가능성이 있습니다."
    elif panel == 'CHF':
        bnp = results.get('NT-proBNP')
        if bnp is not None and bnp > 125:
            return f"NT-proBNP 수치({bnp})가 125를 초과하여 심부전 가능성이 있습니다."
    elif panel == 'PE':
        d_dimer = results.get('D-Dimer')
        if d_dimer is not None and d_dimer > 0.5:
            return f"D-Dimer 수치({d_dimer})가 0.5를 초과하여 폐색전증 가능성이 있습니다."
    elif panel == 'COPD':
        pco2 = results.get('pCO2')
        if pco2 is not None and pco2 > 45:
            return f"pCO₂ 수치({pco2})가 45를 초과하여 COPD 가능성이 있습니다."
    elif panel == 'ASTHMA':
        eos = results.get('Eosinophils')
        if eos is not None and eos > 300:
            return f"Eosinophil 수치({eos})가 300을 초과하여 천식 가능성이 있습니다."
    return "검사 수치에 기반한 이상 소견이 탐지되었습니다."

@receiver(post_save, sender=LISCDSSResult)
def send_cdss_result_to_emr(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        sample = instance.sample
        patient_id = sample.patient_id.patient_identifier  # sample이 patient 연결 필드 갖고 있다고 가정
        panel = instance.test_type

        # 동일 샘플 + 동일 패널에 해당하는 CDSSResult들 모두 취합
        all_results = LISCDSSResult.objects.filter(sample=sample, test_type=panel)
        results_dict = {
            r.component_name: float(r.value) if r.value.replace('.', '', 1).isdigit() else r.value
            for r in all_results
        }

        explanation = generate_explanation(results_dict, panel)

        payload = {
            "patient_id": patient_id,
            "panel": panel,
            "prediction": instance.prediction,
            "results": results_dict,
            "explanation": explanation
        }

        EMR_URL = "http://localhost:8000/api/integration/receive_cdss_result/"
        logger.info(f"📤 EMR로 CDSS 결과 전송 시작: {payload}")
        response = requests.post(EMR_URL, json=payload)
        response.raise_for_status()
        logger.info(f"✅ EMR 응답 수신: {response.status_code} - {response.text}")

    except Exception as e:
        logger.error(f"❌ EMR 전송 실패: {str(e)}")
