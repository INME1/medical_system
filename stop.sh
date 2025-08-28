#!/bin/bash
echo "🛑 CDSS Medical Platform을 중지합니다..."

# Docker Compose 파일 찾기
if [ -f "docker-compose/docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose/docker-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    echo "❌ Docker Compose 파일을 찾을 수 없습니다"
    exit 1
fi

docker compose -f "$COMPOSE_FILE" down

echo "✅ 모든 서비스가 중지되었습니다!"
