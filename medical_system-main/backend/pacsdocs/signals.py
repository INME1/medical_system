# pacsdocs/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import logging

# worklists 앱의 StudyRequest 모델 import
from worklists.models import StudyRequest
from .models import DocumentType, DocumentRequest

# 로깅 설정
logger = logging.getLogger(__name__)


@receiver(post_save, sender=StudyRequest)
def create_documents_for_study(sender, instance, created, **kwargs):
    """
    StudyRequest가 생성될 때 모달리티에 따라 필요한 서류들을 자동 생성
    """
    if not created:
        # 새로 생성된 경우만 처리 (업데이트 시에는 실행하지 않음)
        return
    
    try:
        # 모달리티별 필요 서류 매핑
        DOCUMENT_MAPPING = {
            # 조영제 필요한 검사들
            'CT': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            'MR': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            'XA': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],  # Angiography
            'NM': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],  # Nuclear Medicine
            'PT': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],  # PET Scan
            
            # 조영제 불필요한 검사들
            'CR': ['report_kor', 'exam_certificate', 'imaging_cd'],  # X-ray
            'DX': ['report_kor', 'exam_certificate', 'imaging_cd'],  # Digital Radiography
            'US': ['report_kor', 'exam_certificate', 'imaging_cd'],  # Ultrasound
            'MG': ['report_kor', 'exam_certificate', 'imaging_cd'],  # Mammography
        }
        
        # 해당 모달리티의 필요 서류 코드 목록 가져오기
        doc_codes = DOCUMENT_MAPPING.get(instance.modality, ['report_kor'])  # 기본값: 판독결과지만
        
        created_documents = []
        skipped_documents = []
        
        for doc_code in doc_codes:
            try:
                # 해당 서류 종류 조회
                document_type = DocumentType.objects.get(code=doc_code, is_active=True)
                
                # 이미 존재하는지 확인 후 생성 (중복 방지)
                document_request, created_doc = DocumentRequest.objects.get_or_create(
                    study_request=instance,
                    document_type=document_type,
                    defaults={
                        'status': 'pending',
                        'processed_by': 'system_auto',
                        'notes': f'자동 생성됨 ({instance.modality} 검사용)'
                    }
                )
                
                if created_doc:
                    created_documents.append(document_type.name)
                    logger.info(f"Created document request: {document_type.name} for study {instance.id}")
                else:
                    logger.info(f"Document request already exists: {document_type.name} for study {instance.id}")
                    
            except DocumentType.DoesNotExist:
                # 해당 서류 종류가 없으면 건너뛰기
                skipped_documents.append(doc_code)
                logger.warning(f"DocumentType '{doc_code}' not found, skipping for study {instance.id}")
                continue
            except Exception as e:
                # 기타 오류 발생 시 로그 남기고 계속 진행
                logger.error(f"Error creating document request '{doc_code}' for study {instance.id}: {str(e)}")
                continue
        
        # 결과 로깅
        if created_documents:
            logger.info(
                f"Auto-created {len(created_documents)} documents for {instance.patient_name} "
                f"({instance.modality}): {', '.join(created_documents)}"
            )
        
        if skipped_documents:
            logger.warning(
                f"Skipped {len(skipped_documents)} documents for {instance.patient_name} "
                f"({instance.modality}): {', '.join(skipped_documents)}"
            )
            
    except Exception as e:
        # 전체적인 오류 처리
        logger.error(f"Failed to auto-create documents for study {instance.id}: {str(e)}")
        # 오류가 발생해도 StudyRequest 생성은 계속 진행되도록 예외를 다시 발생시키지 않음


@receiver(post_save, sender=StudyRequest)
def log_study_creation(sender, instance, created, **kwargs):
    """
    StudyRequest 생성 로깅 (디버깅용)
    """
    if created:
        logger.info(
            f"New StudyRequest created: ID={instance.id}, "
            f"Patient={instance.patient_name}, Modality={instance.modality}, "
            f"BodyPart={instance.body_part}"
        )