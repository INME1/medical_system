from django.apps import AppConfig

class LisCdssConfig(AppConfig):
    name = 'lis_cdss'

    def ready(self):
        import lis_cdss.signals  # 기존 신호 연결 유지

        from lis_cdss.inference.blood_inference import load_models
        load_models()
        
        from lis_cdss.inference.blood_inference import load_cdss_model_and_background
        load_cdss_model_and_background()  # ✅ background_df 레지스트리에 등록

        from lis_cdss.inference.model_registry import get_all_models
        print("✅ CDSS 모델 사전 로딩 완료:", list(get_all_models().keys()))
