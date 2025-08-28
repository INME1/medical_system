# /home/medical_system/backend/pacsdocs/apps.py
from django.apps import AppConfig

class PacsdocsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pacsdocs'
    verbose_name = 'PACS 서류관리'
    
    def ready(self):
        """앱이 준비되면 시그널 등록"""
        try:
            import pacsdocs.signals  # ✅ 이 줄이 중요!
            print("✅ PACS Docs signals registered successfully")
        except ImportError as e:
            print(f"❌ Failed to import pacsdocs.signals: {e}")