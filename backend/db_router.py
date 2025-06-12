class DatabaseRouter:
    """
    다중 데이터베이스 라우팅 클래스
    각 모델을 적절한 데이터베이스로 라우팅
    """
    
    # 각 데이터베이스에 해당하는 앱들
    route_app_labels = {
        'default': ['auth', 'contenttypes', 'sessions', 'admin', 'medical_integration'],
        'openmrs': ['openmrs_models'],  # OpenMRS 관련 모델들
        'orthanc': ['orthanc_models'],  # Orthanc 관련 모델들
    }

    def db_for_read(self, model, **hints):
        """읽기 작업을 위한 데이터베이스 선택"""
        if model._meta.app_label == 'openmrs_models':
            return 'openmrs'
        elif model._meta.app_label == 'orthanc_models':
            return 'orthanc'
        return 'default'

    def db_for_write(self, model, **hints):
        """쓰기 작업을 위한 데이터베이스 선택"""
        if model._meta.app_label == 'openmrs_models':
            return 'openmrs'
        elif model._meta.app_label == 'orthanc_models':
            return 'orthanc'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """관계 허용 여부 결정"""
        db_set = {'default', 'openmrs', 'orthanc'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """마이그레이션 허용 여부 결정"""
        if db == 'openmrs':
            return app_label == 'openmrs_models'
        elif db == 'orthanc':
            return app_label == 'orthanc_models'
        elif db == 'default':
            return app_label in ['auth', 'contenttypes', 'sessions', 'admin', 'medical_integration', 'samples', 'tests', 'orders', 'ocs' , 'lis_cdss','worklist','accounts','ai_analysis','common','dr_annotations','dr_reports']
        return False