import pandas as pd
import shap
import numpy as np

def get_manual_contributions(model, input_dict, background_df):
    print("✅ SHAP 계산 시작")

    # ✅ 정규화 함수
    def normalize(s):
        return str(s).replace("-", "").replace("_", "").strip().lower()

    # ✅ key alias 매핑 (입력값 보정)
    key_alias_map = {
        "neutrophil%": "Neutrophils",
        "lymphocyte%": "Lymphocytes",
        "eosinophil%": "Eosinophils",
        "platelet": "Platelet Count",
        "ddimer": "D-Dimer",
        "ntprobnp": "NT-proBNP",
    }

    # ✅ Step 1: alias 적용 및 normalize
    input_dict = {key_alias_map.get(normalize(k), k): v for k, v in input_dict.items()}
    input_dict = {normalize(k): v for k, v in input_dict.items()}
    input_df = pd.DataFrame([input_dict])

    # ✅ Step 2: background 컬럼 정규화
    background_df.columns = [normalize(c) for c in background_df.columns]

    # ✅ Step 3: 파생 변수 생성 (CBC 기반)
    try:
        if all(col in input_df.columns for col in ["eosinophils", "wbc"]):
            input_df["eosinophilratio"] = input_df["eosinophils"] / input_df["wbc"]
        if all(col in input_df.columns for col in ["neutrophils", "lymphocytes"]):
            input_df["neutrophiltolymphocyte"] = input_df["neutrophils"] / input_df["lymphocytes"]
        if all(col in input_df.columns for col in ["plateletcount", "wbc"]):
            input_df["platelettowbc"] = input_df["plateletcount"] / input_df["wbc"]
    except Exception as e:
        print(f"⚠️ 파생변수 생성 오류: {e}")

    # ✅ Step 4: 모델 feature 정규화
    model_features_raw = list(getattr(model, "feature_names_in_", []))
    model_features_norm = [normalize(f) for f in model_features_raw]
    model_norm_to_raw = dict(zip(model_features_norm, model_features_raw))

    print(f"📌 모델 feature_names_in_: {model_features_raw}")
    print(f"📌 input_df.columns: {list(input_df.columns)}")

    # ✅ Step 5: 공통 피처 확인
    common_norm = [f for f in model_features_norm if f in input_df.columns]
    if not common_norm:
        raise ValueError("❌ SHAP 계산 실패: 모델과 입력값 간 공통된 피처 없음")
    print(f"📌 공통된 features: {common_norm}")

    # ✅ Step 6: 원래 feature 이름으로 정렬된 입력/배경값 생성
    aligned_df = pd.DataFrame(columns=model_features_raw)
    for norm_feat, raw_feat in model_norm_to_raw.items():
        if norm_feat in input_df.columns:
            aligned_df[raw_feat] = input_df[norm_feat]
        elif norm_feat in background_df.columns:
            aligned_df[raw_feat] = background_df[norm_feat]
        else:
            aligned_df[raw_feat] = np.nan
    aligned_df = aligned_df.fillna(background_df.mean(numeric_only=True))

    aligned_background = pd.DataFrame(columns=model_features_raw)
    for norm_feat, raw_feat in model_norm_to_raw.items():
        if norm_feat in background_df.columns:
            aligned_background[raw_feat] = background_df[norm_feat]
        else:
            aligned_background[raw_feat] = np.nan
    aligned_background = aligned_background.fillna(background_df.mean(numeric_only=True))

    # ✅ Step 7: SHAP 계산
    try:
        explainer = shap.Explainer(model.predict, aligned_background)
        shap_values = explainer(aligned_df)
    except Exception as e:
        raise ValueError(f"❌ SHAP 계산 중 오류 발생: {e}")

    # ✅ Step 8: 결과 반환
    shap_dict = dict(zip(model_features_raw, shap_values.values[0]))
    print(f"✅ SHAP 기여도 계산 성공: {shap_dict}")
    return shap_dict
