#!/bin/bash
echo "🐳 Docker 모드로 CDSS Platform을 시작합니다..."

# Docker 서비스 시작
sudo service docker start

# Docker Compose 파일 찾기
COMPOSE_FILE=""
if [ -f "docker-compose/docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose/docker-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    echo "❌ Docker Compose 파일을 찾을 수 없습니다"
    exit 1
fi

echo "📝 사용할 Compose 파일: $COMPOSE_FILE"

# 이미지 빌드 및 서비스 시작
echo "🏗️ Docker 이미지를 빌드하고 서비스를 시작합니다..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "⏳ 서비스 시작 대기 중..."
sleep 20

echo "✅ Docker 모드 시작 완료!"
echo ""
echo "📊 서비스 접속 주소:"
echo "  - Frontend: http://localhost:3000"
echo "  - Django API: http://localhost:8000"
echo "  - Orthanc PACS: http://localhost:8042"
echo "  - OpenMRS: http://localhost:8082"
echo "  - OHIF Viewer: http://localhost:3001"
echo ""
echo "📋 유용한 명령어:"
echo "  - 로그 확인: docker compose -f $COMPOSE_FILE logs -f"
echo "  - 상태 확인: ./status.sh"
echo "  - 서비스 중지: ./stop.sh"
