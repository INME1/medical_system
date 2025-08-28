import joblib
import os
import pandas as pd
import traceback
from lis_cdss.inference.model_registry import load_model, get_model

# test_type → 실제 모델명 매핑
ALIAS_TO_MODEL = {
    "CBC": "ASTHMA",
    "CRP": "PNEUMONIA",
    "NT-proBNP": "CHF",
    "D-Dimer": "PE",
    "ABGA": "COPD"
}

# 패널명 → 사용 피처 매핑
panelComponents = {
    "CBC": ['WBC', 'Neutrophils', 'Lymphocytes', 'Eosinophils', 'Hemoglobin', 'Platelet Count'],
    "ABGA": ['pCO2', 'pO2', 'pH'],
    "D-Dimer": ['D-Dimer'],
    "NT-proBNP": ['NT-proBNP']
}

def get_alias_map():
    return ALIAS_TO_MODEL

def align_input_to_model_features(values, model):
    """
    values: 원본 dict (ex: {'D-Dimer': '1.24'})
    model: 로드된 모델 (XGBoost, Sklearn 등)
    """
    aligned = {}
    model_features = list(getattr(model, "feature_names_in_", []))

    for feat in model_features:
        # 하이픈 포함/미포함 모두 매칭 시도
        match_keys = [k for k in values.keys() if k.replace("-", "") == feat.replace("-", "")]
        if match_keys:
            raw_val = values[match_keys[0]]
            try:
                aligned[feat] = float(raw_val)
            except:
                aligned[feat] = None
        else:
            aligned[feat] = None  # 누락된 피처는 None
    return aligned


def load_models():
    base = os.path.dirname(os.path.abspath(__file__))

    model_map = {
        "ASTHMA": "asthma_ensemble_model.pkl",
        "COPD": "xgb_copd_model.pkl",
        "PE": "xgb_pe_model_balanced.pkl",
        "CHF": "model_chf_cbc.pkl"
    }

    for key, filename in model_map.items():
        path = os.path.join(base, filename)
        try:
            model = joblib.load(os.path.join(base, filename))
            load_model(key, model)
            print(f"✅ {key} 모델 로딩 완료")
        except Exception as e:
            print(f"❌ {key} 모델 로딩 실패:", e)

def run_blood_model(test_type, values):
    alias_map = get_alias_map()
    mapped = alias_map.get(test_type, test_type) 
    model = get_model(mapped)

    if not model:
        raise ValueError(f"❌ {mapped} 모델이 등록되어 있지 않습니다.")
    
    # ✅ 모델의 feature 명 기준으로 입력값 align (하이픈 유지 포함)
    values = align_input_to_model_features(values, model)

    try:
        df = pd.DataFrame([values])

        # ✅ 파생변수 생성
        try:
            if all(col in df.columns for col in ["Eosinophils", "WBC"]):
                df["Eosinophil_Ratio"] = df["Eosinophils"] / df["WBC"]
            if all(col in df.columns for col in ["Neutrophils", "Lymphocytes"]):
                df["Neutrophil_to_Lymphocyte"] = df["Neutrophils"] / df["Lymphocytes"]
            if all(col in df.columns for col in ["Platelet Count", "WBC"]):
                df["Platelet_to_WBC"] = df["Platelet Count"] / df["WBC"]
        except Exception as e:
            print(f"⚠️ 파생변수 생성 중 오류 발생: {e}")

        # ✅ 모델 학습 피처 정렬
        expected_features = model.feature_names_in_
        df = df.reindex(columns=expected_features)
        df = df.drop(columns=["SUBJECT_ID"], errors="ignore")

        # ✅ 결측치 확인
        if df.isnull().any().any():
            raise ValueError(f"❌ 누락된 feature가 있습니다: {df.columns[df.isnull().any()].tolist()}")

        # ✅ 예측
        prob = model.predict_proba(df)[0][1]
        pred = int(prob >= 0.5)

        print(f"✅ 예측 성공 | test_type={test_type}, pred={pred}, prob={prob:.4f}")
        return pred, prob

    except Exception as e:
        print("❌ run_blood_model 예외 발생:")
        traceback.print_exc()
        raise ValueError(f"❌ 예측 실패: {str(e)}")

from lis_cdss.inference.background_registry import register_background  # 꼭 import!

def load_cdss_model_and_background():
    base = os.path.dirname(os.path.abspath(__file__))

    model_map = {
        "ASTHMA": ("asthma_ensemble_model.pkl", "cbc_background.csv"),
        "COPD": ("xgb_copd_model.pkl", "cbc_background.csv"),
        "PE": ("xgb_pe_model_balanced.pkl", "abga_background.csv"),
        "CHF": ("model_chf_cbc.pkl", "nt-probnp_background.csv"),
    }

    results = {}
    for key, (model_file, bg_file) in model_map.items():
        try:
            model_path = os.path.join(base, model_file)
            bg_path = os.path.join(base, bg_file)

            model = joblib.load(model_path)
            background_df = pd.read_csv(bg_path)

            load_model(key, model)  # 모델 등록
            register_background(key, background_df)  # 🔥 배경값도 등록

            results[key] = (model, background_df)
            print(f"✅ {key} 모델 + 배경값 로딩 완료")
        except Exception as e:
            print(f"❌ {key} 모델 로딩 실패:", e)

    return results
