# 예시: run in Django shell or management command
from lis_cdss.models import CDSSResult
from lis_cdss.inference.model_registry import get_model
from lis_cdss.inference.blood_inference import align_input_to_model_features, get_alias_map, load_cdss_model_and_background
from lis_cdss.inference.shap_manual import get_manual_contributions
from lis_cdss.inference.input_samples import SAMPLE_DICTS
import pandas as pd
from django.core.management.base import BaseCommand

# ✅ 중복 제거된 샘플 목록
sample_ids = CDSSResult.objects.values_list("sample_id", flat=True).distinct()

for sample_id in sample_ids:
    results = CDSSResult.objects.filter(sample_id=sample_id)
    if not results.exists():
        continue

    first = results.first()
    test_type = first.test_type
    model = get_model(get_alias_map().get(test_type, test_type))
    if not model:
        continue

    values = {r.component_name: r.value for r in results}
    try:
        values = {k: float(v) for k, v in values.items()}
    except:
        continue

    bg_path = f"lis_cdss/inference/{test_type.lower()}_background.csv"
    try:
        background_df = pd.read_csv(bg_path)
    except:
        continue

    shap_data = get_manual_contributions(model, values, background_df)

    # ✅ 하나의 결과에만 SHAP 값 저장
    first.shap_values = shap_data
    first.save()

class Command(BaseCommand):
    help = 'Run SHAP contribution calculations for all CDSS models'

    def handle(self, *args, **options):
        print("✅ SHAP 계산 시작")

        models = load_cdss_model_and_background()  # 사전 로딩된 모델+BG들
        for disease_name, (model, bg_df) in models.items():
            print(f"\n🔍 질병 모델: {disease_name}")
            inputs = SAMPLE_DICTS.get(disease_name)
            if not inputs:
                print("⚠️ 입력값 없음")
                continue

            for idx, input_dict in enumerate(inputs):
                try:
                    print(f"\n➡️ 샘플 {idx+1}: {input_dict}")
                    shap_data = get_manual_contributions(model, input_dict, bg_df)
                except Exception as e:
                    print(f"❌ {disease_name} - 샘플 {idx+1} SHAP 오류: {e}")