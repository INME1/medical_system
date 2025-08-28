#!/bin/bash
echo "🔍 localhost 변경 상태를 확인합니다..."

echo ""
echo "📊 현재 상태:"
echo "GCP IP 남은 개수: $(grep -r "35\.225\.63\.41" . 2>/dev/null | wc -l)"
echo "localhost 개수: $(grep -r "localhost" . --include="*.py" --include="*.js" --include="*.env" 2>/dev/null | wc -l)"

echo ""
echo "🔍 남은 GCP IP 주소들 (상위 5개):"
grep -r "35\.225\.63\.41" . --include="*.py" --include="*.js" --include="*.env" 2>/dev/null | head -5

echo ""
echo "✅ 주요 설정 파일들 확인:"
files=("backend/.env" "frontend/.env" "backend/backend/settings.py" "docker-compose/docker-compose.yml")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        gcp_count=$(grep -c "35\.225\.63\.41" "$file" 2>/dev/null || echo "0")
        localhost_count=$(grep -c "localhost" "$file" 2>/dev/null || echo "0")
        echo "  $file: GCP IP=${gcp_count}, localhost=${localhost_count}"
    else
        echo "  $file: 파일 없음"
    fi
done
