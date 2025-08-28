# views.py (Django DRF) - SOAP 형식으로 수정
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.db import transaction
from django.shortcuts import get_object_or_404
from dr_reports.models import DrReport
import os
import whisper
import google.generativeai as genai
import datetime

# Whisper 모델 로딩 (서버 시작 시 1회)
whisper_model = whisper.load_model("small")

# Gemini 설정
genai.configure(api_key="AIzaSyCstFaoQkLtW396t2t1rSkC_UuHweQjIbw")
gemini_model = genai.GenerativeModel("models/learnlm-2.0-flash-experimental")

# SOAP 형식 보정 함수
def gemini_correct_soap(text, patient_id, study_uid):
    prompt = f"""
다음은 흉부 엑스레이 음성 판독 결과입니다.
이를 SOAP (Subjective, Objective, Assessment, Plan) 형식의 전문적인 의료 판독 소견으로 정리해 주세요.

환자 정보:
- 환자 ID: {patient_id}
- Study UID: {study_uid}
- 판독 날짜: {datetime.date.today()}

입력된 음성 텍스트: {text}

아래 SOAP 형식으로 정리해 주세요:

**S (Subjective - 주관적 소견):**
환자가 호소하는 증상이나 병력 관련 내용

**O (Objective - 객관적 소견):**
영상에서 관찰되는 구체적인 소견들
- 심장 크기 및 형태
- 폐 실질 소견
- 흉막 소견
- 종격동 소견
- 골격계 소견

**A (Assessment - 평가/진단):**
영상 소견을 바탕으로 한 진단적 평가

**P (Plan - 계획):**
추가 검사나 추적 관찰 권고사항

각 항목별로 명확하게 구분하여 작성하고, 의료 전문 용어를 사용하여 정확하고 간결하게 표현해 주세요.
"""
    response = gemini_model.generate_content(prompt)
    return response.text.strip()

@api_view(['POST'])
@parser_classes([MultiPartParser])
def stt_upload(request):
    audio_file = request.FILES.get('audio')
    patient_id = request.POST.get('patient_id', 'Unknown')
    study_uid = request.POST.get('study_uid', 'Unknown')

    if not audio_file:
        return Response({"status": "error", "message": "audio file missing"}, status=400)

    audio_path = default_storage.save(f'temp/{audio_file.name}', audio_file)
    abs_path = default_storage.path(audio_path)

    try:
        result = whisper_model.transcribe(abs_path)
        original = result['text']
        
        # SOAP 형식으로 보정
        soap_formatted = gemini_correct_soap(original, patient_id, study_uid)

        # DrReport에 저장 (있으면 업데이트, 없으면 생성)
        with transaction.atomic():
            report, created = DrReport.objects.update_or_create(
                study_uid=study_uid,
                defaults={
                    'patient_id': patient_id,
                    'dr_report': soap_formatted,
                    'report_status': 'draft'
                }
            )

    finally:
        os.remove(abs_path)

    return Response({
        "status": "success",
        "original_text": original,
        "corrected_text": soap_formatted,
        "report_id": report.id,
        "created": created,
    })