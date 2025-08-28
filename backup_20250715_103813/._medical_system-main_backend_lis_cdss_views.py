# views.py (CDSS 결과 및 시각화 관련 백엔드 전체 코드)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import CDSSResult
from .serializers import CDSSResultSerializer
from openmrs_models.models import Person
from samples.models import Sample
from lis_cdss.inference.blood_inference import run_blood_model, get_alias_map, align_input_to_model_features
from lis_cdss.inference.model_registry import get_model
from lis_cdss.inference.shap_manual import get_manual_contributions
from lis_cdss.inference.explanation import generate_explanation
from lis_cdss.inference.background_registry import get_background_df
from openmrs_models.models import Patient, PatientIdentifier
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncWeek
from django.utils import timezone
from django.utils.timezone import localtime
from collections import defaultdict
from datetime import timedelta
import traceback
import numpy as np
from uuid import UUID
import pandas as pd
import shap
import requests
import joblib
from datetime import datetime

# ✅ 최근 결과 리스트 조회
@api_view(['GET'])
def get_cdss_results(request):
    results = CDSSResult.objects.all().order_by('-id')[:30]
    serializer = CDSSResultSerializer(results, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# ✅ 단일 샘플 결과 + 예측 포함
@api_view(['GET'])
def get_cdss_result_by_sample(request, sample_id):
    try:
        results = CDSSResult.objects.filter(sample__id=sample_id)
        if not results.exists():
            return Response({'error': '샘플 결과 없음'}, status=404)
        
        first = results.first()
        if first is None:
            return Response({'error': '결과가 유효하지 않음'}, status=500)

        serializer = CDSSResultSerializer(results, many=True)
        first = results.first()

        return Response({
            "sample": sample_id,
            "test_type": getattr(first, 'test_type', 'UNKNOWN'),
            "prediction": getattr(first, 'prediction', None),
            "prediction_prob": getattr(first, 'prediction_prob', None),
            "results": serializer.data,
            "shap_data": getattr(first, 'shap_data', None),
        })

    except Exception as e:
        print("❌ get_cdss_result_by_sample 에러:", e)
        return Response({'error': str(e)}, status=500)

    except Exception as e:
        print("❌ CDSS 분석 오류:", str(e))
        return Response({'error': str(e)}, status=500)
    
# ✅ 단일 결과 수신
@api_view(['POST'])
def receive_test_result(request):
    serializer = CDSSResultSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ 전체 삭제
@api_view(['DELETE'])
def delete_cdss_result(request, sample_id):
    try:
        results = CDSSResult.objects.filter(sample__id=sample_id)
        if results.exists():
            results.delete()
            return Response({'message': 'CDSS 결과 삭제 완료'}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': '해당 샘플의 결과가 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ 검사 항목별 개별 등록 → 전체 결과 갱신 및 SHAP 생성 포함

def normalize_component_name(raw_name):
    """
    예: 'Sample 3 - 혈액 - LFT - ALP' → 'ALP'
    """
    if not raw_name:
        return None
    parts = raw_name.strip().split(" - ")
    # 마지막 항목을 반환 (대부분 검사 항목이 마지막)
    return parts[-1].strip()

def generate_explanation(results: dict, panel: str) -> str:
    """
    검사 결과 dict와 패널명을 받아 rule 기반 explanation 생성
    """
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

@api_view(['POST'])
def receive_model_result(request):
    try:
        sample_id = request.data.get("sample")
        test_type = request.data.get("test_type")
        values = request.data.get("values")
        verified_by = request.data.get("verified_by", 1)
        verified_date = request.data.get("verified_date") or timezone.now()
        patient_uuid = request.data.get("patient_id")

        print("\n📥 CDSS 요청 수신 완료")
        print("📌 Sample ID:", sample_id)
        print("📌 Test type:", test_type)
        print("📌 입력값 keys:", list(values.keys()) if values else "❌ 없음")

        # ✅ 예측 수행
        prediction, probability = run_blood_model(test_type, values)
        print(f"✅ 예측 완료 → prediction={prediction}, prob={probability:.4f}")

        # ✅ SHAP-like 기여도 계산
        shap_data = {}
        try:
            mapped_type = get_alias_map().get(test_type, test_type)
            background_path = f"lis_cdss/inference/{test_type.lower()}_background.csv"
            background_df = pd.read_csv(background_path)
            print("📊 background_df 로드 성공:", background_df.shape)
            
            model = get_model(mapped_type)
            if model is None:
                raise ValueError(f"❌ SHAP 계산용 모델이 존재하지 않습니다: {mapped_type}")

            shap_data = get_manual_contributions(
                model=model,
                input_dict=values,
                background_df=background_df
            )
            print("✅ SHAP 기여도 계산 완료")
        except Exception as e:
            print("❌ SHAP 기여도 생성 실패:", e)
            shap_data = {}

        # ✅ unit 매핑
        unit_mapping = {
            "WBC": "10^3/uL", "Neutrophils": "%", "Lymphocytes": "%",
            "Eosinophils": "%", "Hemoglobin": "g/dL", "Platelet Count": "10^3/uL",
            "CRP": "mg/L", "NT-proBNP": "pg/mL", "D-dimer": "ng/mL FEU",
            "pCO2": "mmHg", "pO2": "mmHg", "pH": "-", "HCO3": "mmol/L", "O2_sat": "%"
        }

        # ✅ 결과 저장
        result_instances = []
        for component, value in values.items():
            data = {
                "sample": sample_id,
                "test_type": test_type,
                "component_name": component,
                "value": value,
                "unit": unit_mapping.get(component, "unknown"),
                "prediction": prediction,
                "prediction_prob": probability,
                "verified_by": verified_by,
                "verified_date": verified_date,
                "shap_values": shap_data if shap_data else None
            }

            existing = CDSSResult.objects.filter(
                sample=sample_id, test_type=test_type, component_name=component
            ).first()

            serializer = CDSSResultSerializer(instance=existing, data=data)
            if serializer.is_valid():
                result = serializer.save(shap_values=shap_data)
                result_instances.append(result)
            else:
                print(f"❌ 저장 실패 for {component}: {serializer.errors}")

        # ✅ EMR 전송 시도
        try:
            sample = Sample.objects.get(id=sample_id)

            # 수정: patient UUID로부터 Patient 객체 조회
            patient_uuid = sample.patient_id
            print("🔗 EMR 전송용 patient_uuid:", patient_uuid)
            
            # Step 1: person 테이블에서 uuid로 person_id 찾기
            person_obj = Person.objects.using('openmrs').filter(uuid=patient_uuid).first()
            if not person_obj:
                raise ValueError(f"❌ person 테이블에서 uuid={patient_uuid}를 찾을 수 없음")
            
            person_id = person_obj.person_id

            patient_obj = Patient.objects.using('openmrs').filter(patient_id=person_id).first()
            if not patient_obj:
                raise ValueError(f"❌ patient 테이블에서 person_id={person_id}를 찾을 수 없음")

            # Step 2: 해당 PK로 PatientIdentifier 찾기
            identifier_obj = PatientIdentifier.objects.using('openmrs').filter(
                patient_id=person_id, voided=0
            ).first()
            if  not identifier_obj:
                raise ValueError(f"❌ 식별자가 없습니다: patient_id={person_id}")

            identifier_value = identifier_obj.identifier
            print(f"✅ EMR 전송용 식별자: {identifier_value}")

            explanation = generate_explanation(values, test_type)
            payload = {
                "patient_id": identifier_value,
                "prediction": "abnormal" if prediction == 1 else "normal",
                "test_type": test_type,
                "results": values,
                "explanation": explanation
            }

            EMR_URL = "http://35.225.63.41:8000/api/integration/receive_cdss_result/"
            print("📤 EMR 전송 payload:", payload)

            emr_response = requests.post(EMR_URL, json=payload)
            emr_response.raise_for_status()
            print("✅ EMR 전송 성공")

        except Exception as emr_error:
            print("❌ EMR 전송 실패:", emr_error)

        return Response({
            "sample": sample_id,
            "test_type": test_type,
            "prediction": prediction,
            "probability": probability,
            "shap_data": shap_data,
            "results": [
                {"component_name": r.component_name, "value": r.value, "unit": r.unit}
                for r in result_instances
            ]
        }, status=201)

    except Exception as e:
        print("❌ receive_model_result 전체 예외:", e)
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

# ✅ 슬라이더 기반 전체 시뮬레이션 입력 처리 (시각화용)
@api_view(['POST'])
def receive_full_sample(request):
    try:
        sample_id = request.data.get("sample")
        test_type = request.data.get("test_type")
        components = request.data.get("components", [])

        # 🔧 1. 입력값 정제
        input_dict = {
            comp["component_name"]: float(comp["value"])
            for comp in components
            if comp["value"] not in [None, "", "NaN"]
        }

        # 🔧 2. 모델 불러오기 (alias 포함)
        alias_map = get_alias_map()
        model_key = alias_map.get(test_type, test_type)
        model = get_model(model_key)
        if not model:
            raise ValueError(f"❌ {model_key} 모델이 등록되어 있지 않습니다.")

        # 🔧 3. 입력값 align
        aligned_input = align_input_to_model_features(input_dict, model)
        df = pd.DataFrame([aligned_input])

        # 🔧 4. 파생 변수 생성 (CBC 관련)
        try:
            if all(k in df.columns for k in ["Eosinophils", "WBC"]):
                df["Eosinophil_Ratio"] = df["Eosinophils"] / df["WBC"]
            if all(k in df.columns for k in ["Neutrophils", "Lymphocytes"]):
                df["Neutrophil_to_Lymphocyte"] = df["Neutrophils"] / df["Lymphocytes"]
            if all(k in df.columns for k in ["Platelet Count", "WBC"]):
                df["Platelet_to_WBC"] = df["Platelet Count"] / df["WBC"]
        except Exception as e:
            print(f"⚠️ 파생변수 생성 오류: {e}")

        df = df.reindex(columns=model.feature_names_in_)
        df = df.drop(columns=["SUBJECT_ID"], errors="ignore")

        if df.isnull().any().any():
            raise ValueError(f"❌ 누락된 feature 존재: {df.columns[df.isnull().any()].tolist()}")

        # 🔧 5. 예측
        prob = model.predict_proba(df)[0][1]
        pred = int(prob >= 0.5)

        # 🔧 6. SHAP 계산
        background_df = get_background_df(model_key)
        shap_contrib = get_manual_contributions(model, input_dict, background_df)
        contrib_result = {
            "features": list(shap_contrib.keys()),
            "contributions": list(shap_contrib.values())
        }

        return Response({
            "sample": sample_id,
            "test_type": test_type,
            "prediction": pred,
            "prediction_prob": prob,
            "shap_data": contrib_result
        }, status=200)

    except Exception as e:
        print("❌ receive_full_sample 예외:", e)
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)   
        
@api_view(['GET'])
def test_type_counts(request):
    # test_type별로 몇 건씩 검사했는지 집계
    counts = (
        CDSSResult.objects
        .values('test_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response(counts)

@api_view(['GET'])
def test_result_ratios(request):
    try:
        results = (
            CDSSResult.objects
            .values('test_type')
            .annotate(
                normal=Count('id', filter=Q(prediction=0)),
                abnormal=Count('id', filter=Q(prediction=1))
            )
        )

        data = {
            item['test_type']: {
                'normal': item['normal'],
                'abnormal': item['abnormal']
            }
            for item in results
        }

        return Response(data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def weekly_abnormal_trend(request):
    """
    주차별 이상 판정 건수 반환
    (예: {'week': '2025-06-30 ~ 2025-07-06', 'abnormal_count': 5})
    """
    results = (
        CDSSResult.objects
        .filter(prediction=1)
        .annotate(week=TruncWeek("verified_date"))
        .values("week")
        .annotate(abnormal_count=Count("id"))
        .order_by("week")
    )

    data = [
        {
            "week": f"{localtime(r['week']).date()} ~ {(localtime(r['week']) + timedelta(days=6)).date()}",
            "abnormal_count": r["abnormal_count"]
        }
        for r in results
    ]

    return Response(data)