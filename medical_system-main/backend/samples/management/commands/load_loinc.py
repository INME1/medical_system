import csv
import os
from django.core.management.base import BaseCommand
from samples.models import LOINCCode, AliasMapping

class Command(BaseCommand):
    help = 'CSV 파일에서 LOINC 및 Alias 정보를 불러옵니다.'

    def handle(self, *args, **kwargs):
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(BASE_DIR, '../../data/auto_mapped_alias_loinc.csv')
        
        loinc_count = 0
        alias_count = 0
        loinc_seen = set()
        alias_seen = set()

        try:
            with open(csv_path, newline='', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sample_type = row["sample_type"].strip()
                    alias_name = row["alias_name"].strip()
                    test_type = row["test_type"].strip().lower()
                    loinc_code = row["loinc_code"].strip()
                    component = row.get("component", "").strip()
                    loinc_name = row.get("loinc_name", "").strip()

                    # 1. LOINCCode 등록
                    loinc_key = (sample_type, test_type)
                    if loinc_key not in loinc_seen:
                        loinc_seen.add(loinc_key)
                        LOINCCode.objects.get_or_create(
                            code=loinc_code or f"{sample_type}-{test_type}",
                            defaults={
                                "name": loinc_name or f"{test_type} 검사",
                                "description": f"{test_type}에 대한 테스트입니다.",
                                "component": component,
                                "property": "N/A",
                                "system": sample_type,
                                "method": "default",
                                "sample_type": sample_type,
                                "test_type": test_type
                            }
                        )
                        loinc_count += 1

                    # 2. AliasMapping 등록
                    if alias_name not in alias_seen:
                        alias_seen.add(alias_name)
                        AliasMapping.objects.get_or_create(
                            alias_name=alias_name,
                            defaults={
                                "sample_type": sample_type,
                                "test_type_keywords": test_type  # 단일 keyword 저장
                            }
                        )
                        alias_count += 1
                        
            self.stdout.write(self.style.SUCCESS(
                f"✅ 등록 완료: LOINC {loinc_count}개, Alias {alias_count}개"
            ))

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"❌ 파일을 찾을 수 없습니다: {csv_path}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ 오류 발생: {str(e)}"))