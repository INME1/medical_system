# pacsdocs/management/commands/create_missing_documents.py

from django.core.management.base import BaseCommand
from django.db import transaction
from worklists.models import StudyRequest
from pacsdocs.models import DocumentType, DocumentRequest


class Command(BaseCommand):
    help = '기존 StudyRequest들에 대해 누락된 DocumentRequest들을 생성합니다.'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제로 생성하지 않고 시뮬레이션만 실행',
        )
        parser.add_argument(
            '--study-id',
            type=int,
            help='특정 StudyRequest ID에 대해서만 실행',
        )
        parser.add_argument(
            '--modality',
            type=str,
            help='특정 모달리티에 대해서만 실행 (예: CT, MR, CR)',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        study_id = options.get('study_id')
        modality = options.get('modality')
        
        # 모달리티별 필요 서류 매핑 (signals.py와 동일)
        DOCUMENT_MAPPING = {
            # 조영제 필요한 검사들
            'CT': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            'MR': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            'XA': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            'NM': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            'PT': ['consent_contrast', 'report_kor', 'imaging_cd', 'export_certificate'],
            
            # 조영제 불필요한 검사들
            'CR': ['report_kor', 'exam_certificate', 'imaging_cd'],
            'DX': ['report_kor', 'exam_certificate', 'imaging_cd'],
            'US': ['report_kor', 'exam_certificate', 'imaging_cd'],
            'MG': ['report_kor', 'exam_certificate', 'imaging_cd'],
        }
        
        # StudyRequest 쿼리셋 구성
        studies = StudyRequest.objects.all()
        
        if study_id:
            studies = studies.filter(id=study_id)
        
        if modality:
            studies = studies.filter(modality=modality.upper())
        
        if not studies.exists():
            self.stdout.write(
                self.style.WARNING('조건에 맞는 StudyRequest가 없습니다.')
            )
            return
        
        self.stdout.write(f'총 {studies.count()}개의 StudyRequest를 처리합니다.')
        
        total_created = 0
        total_skipped = 0
        
        with transaction.atomic():
            for study in studies:
                doc_codes = DOCUMENT_MAPPING.get(study.modality, ['report_kor'])
                created_count = 0
                skipped_count = 0
                
                for doc_code in doc_codes:
                    try:
                        document_type = DocumentType.objects.get(code=doc_code, is_active=True)
                        
                        # 이미 존재하는지 확인
                        exists = DocumentRequest.objects.filter(
                            study_request=study,
                            document_type=document_type
                        ).exists()
                        
                        if exists:
                            skipped_count += 1
                            continue
                        
                        if not dry_run:
                            DocumentRequest.objects.create(
                                study_request=study,
                                document_type=document_type,
                                status='pending',
                                processed_by='batch_creation',
                                notes=f'일괄 생성됨 ({study.modality} 검사용)'
                            )
                        
                        created_count += 1
                        
                    except DocumentType.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f'DocumentType "{doc_code}"가 존재하지 않습니다.'
                            )
                        )
                        continue
                
                total_created += created_count
                total_skipped += skipped_count
                
                if created_count > 0:
                    action = "생성 예정" if dry_run else "생성됨"
                    self.stdout.write(
                        f'Study {study.id} ({study.patient_name}, {study.modality}): '
                        f'{created_count}개 서류 {action}, {skipped_count}개 이미 존재'
                    )
        
        # 결과 요약
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n[DRY RUN] 총 {total_created}개 서류가 생성될 예정입니다. '
                    f'{total_skipped}개는 이미 존재합니다.'
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    '실제로 생성하려면 --dry-run 옵션을 제거하고 다시 실행하세요.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n총 {total_created}개 서류가 생성되었습니다. '
                    f'{total_skipped}개는 이미 존재했습니다.'
                )
            )