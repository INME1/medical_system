#!/bin/bash
echo "📊 CDSS Medical Platform 상태 확인"
echo "================================"

# tmux 세션 확인
if tmux has-session -t medical-platform 2>/dev/null; then
    echo "✅ tmux 개발 세션 실행 중"
else
    echo "❌ tmux 개발 세션 없음"
fi

echo ""
echo "🐳 Docker 컨테이너 상태:"
docker ps -a 2>/dev/null || echo "Docker 정보 없음"

echo ""
echo "🔍 포트 사용 상황:"
netstat -tulpn 2>/dev/null | grep -E ":(3000|8000|8042|8082|3001)" || echo "포트 정보 없음"

echo ""
echo "🌐 서비스 헬스체크:"

services=(
    "Django:http://localhost:8000/api/health/"
    "React:http://localhost:3000"
    "Orthanc:http://localhost:8042/system"
    "OpenMRS:http://localhost:8082/openmrs/ws/rest/v1/session"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    url=$(echo $service | cut -d: -f2-)
    
    printf "%-10s: " "$name"
    if curl -s -f "$url" >/dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
done

echo ""
echo "💾 시스템 리소스:"
echo "메모리: $(free -h | grep '^Mem:' | awk '{print $3"/"$2}')"
echo "디스크: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" 사용)"}')"
