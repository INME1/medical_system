# 간단한 버전
from django.contrib import admin
from .models import AIAnalysisResult

@admin.register(AIAnalysisResult)
class AIAnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['patient_id', 'label', 'confidence_score', 'created_at']
    list_filter = ['label', 'modality', 'model_name']
    search_fields = ['patient_id', 'study_uid']