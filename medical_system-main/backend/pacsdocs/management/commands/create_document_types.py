# /home/medical_system/backend/pacsdocs/management/commands/create_document_types.py

from django.core.management.base import BaseCommand
from pacsdocs.models import DocumentType

class Command(BaseCommand):
    help = 'Create initial document types for PACS Docs system'

    def handle(self, *args, **options):
        document_types = [
            {
                'code': 'consent_contrast',
                'name': '조영제 사용 동의서',
                'requires_signature': True,
                'sort_order': 1,
                'description': 'CT, MRI 조영증강 검사시 필요한 동의서'
            },
            {
                'code': 'report_kor',
                'name': '판독 결과지 (국문)',
                'requires_signature': False,
                'sort_order': 2,
                'description': '한국어 판독 결과 리포트'
            },
            {
                'code': 'report_eng',
                'name': '판독 결과지 (영문)',
                'requires_signature': False,
                'sort_order': 3,
                'description': '영어 판독 결과 리포트'
            },
            {
                'code': 'imaging_cd',
                'name': '진료기록영상 (CD)',
                'requires_signature': False,
                'sort_order': 4,
                'description': 'DICOM 영상을 CD로 복사'
            },
            {
                'code': 'imaging_dvd',
                'name': '진료기록영상 (DVD)',
                'requires_signature': False,
                'sort_order': 5,
                'description': 'DICOM 영상을 DVD로 복사'
            },
            {
                'code': 'export_certificate',
                'name': '반출 확인서',
                'requires_signature': True,
                'sort_order': 6,
                'description': '영상 반출시 필요한 확인서'
            },
            {
                'code': 'exam_certificate',
                'name': '검사 확인서',
                'requires_signature': False,
                'sort_order': 7,
                'description': '검사 시행 확인 증명서'
            },
            {
                'code': 'consultation_request',
                'name': '협진 의뢰서',
                'requires_signature': False,
                'sort_order': 8,
                'description': '타 과 협진 의뢰서'
            },
            {
                'code': 'medical_record_access_consent',
                'name': '진료기록 열람 및 사본발급 동의서',
                'requires_signature': True,
                'sort_order': 9,
                'description': '진료기록 접근을 위한 동의서'
            },
            {
                'code': 'medical_record_access_proxy',
                'name': '진료기록 열람 및 사본발급 위임장',
                'requires_signature': True,
                'sort_order': 10,
                'description': '진료기록 접근을 위한 위임장'
            }
        ]

        created_count = 0
        updated_count = 0

        for doc_data in document_types:
            doc_type, created = DocumentType.objects.get_or_create(
                code=doc_data['code'],
                defaults=doc_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created: {doc_type.name}')
                )
            else:
                # 기존 데이터 업데이트
                for key, value in doc_data.items():
                    if key != 'code':  # code는 변경하지 않음
                        setattr(doc_type, key, value)
                doc_type.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'🔄 Updated: {doc_type.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n📋 Summary: {created_count} created, {updated_count} updated'
            )
        )
        
        # 모달리티별 추천 서류 조합 출력 (studies 모델 MODALITY_CHOICES 기준)
        self.stdout.write('\n📖 Recommended document combinations by modality:')
        self.stdout.write('🔬 Contrast Enhanced (조영제 필요):')
        self.stdout.write('  - CT, MR, XA, NM, PT: consent_contrast + report_kor + imaging_cd + export_certificate')
        self.stdout.write('📋 Non-Contrast (조영제 불필요):')
        self.stdout.write('  - CR, DX, US, MG: report_kor + exam_certificate + imaging_cd')
        self.stdout.write('💿 For imaging export: medical_record_access_consent + medical_record_access_proxy')