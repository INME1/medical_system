# Orthanc AI Server Makefile

.PHONY: help build up down restart logs test clean install-deps

# 기본 타겟
help:
	@echo "Orthanc AI Server 관리 명령어:"
	@echo "  build       - Docker 이미지 빌드"
	@echo "  up          - 컨테이너 시작"
	@echo "  down        - 컨테이너 중지 및 제거"
	@echo "  restart     - 컨테이너 재시작"
	@echo "  logs        - 실시간 로그 조회"
	@echo "  test        - 기능 테스트 실행"
	@echo "  clean       - 모든 컨테이너 및 볼륨 제거"
	@echo "  install-deps- Python 의존성 설치"
	@echo "  shell       - 컨테이너 쉘 접속"
	@echo "  status      - 서비스 상태 확인"

# Docker 이미지 빌드
build:
	@echo "🏗️ Docker 이미지 빌드 중..."
	docker-compose build --no-cache

# 컨테이너 시작
up:
	@echo "🚀 Orthanc AI Server 시작 중..."
	docker-compose up -d
	@echo "✅ 서버가 시작되었습니다:"
	@echo "   - Web Interface: http://35.225.63.41:8042"
	@echo "   - DICOM Port: 4242"

# 컨테이너 중지
down:
	@echo "🛑 Orthanc AI Server 중지 중..."
	docker-compose down

# 컨테이너 재시작
restart: down up

# 실시간 로그 조회
logs:
	@echo "📋 실시간 로그 조회 (Ctrl+C로 종료):"
	docker-compose logs -f

# AI 로그만 조회
ai-logs:
	@echo "🤖 AI 분석 로그 조회:"
	docker exec orthanc-ai-server tail -f /var/log/orthanc_ai.log

# 기능 테스트 실행
test:
	@echo "🧪 기능 테스트 실행 중..."
	python3 test_dicom_analysis.py

# 의존성 설치 (로컬 개발용)
install-deps:
	@echo "📦 Python 의존성 설치 중..."
	pip3 install -r requirements.txt

# 컨테이너 쉘 접속
shell:
	@echo "🐚 컨테이너 쉘 접속:"
	docker exec -it orthanc-ai-server /bin/bash

# 서비스 상태 확인
status:
	@echo "📊 서비스 상태:"
	@docker-compose ps
	@echo ""
	@echo "🔍 서버 연결 테스트:"
	@curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://35.225.63.41/:8042/system || echo "❌ 연결 실패"

# 리소스 사용량 확인
stats:
	@echo "📈 리소스 사용량:"
	docker stats orthanc-ai-server --no-stream

# 전체 정리 (주의: 모든 데이터 삭제됨)
clean:
	@echo "🧹 모든 컨테이너 및 볼륨 제거 중..."
	@read -p "정말로 모든 데이터를 삭제하시겠습니까? (y/N): " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down -v --remove-orphans; \
		docker system prune -f; \
		echo "✅ 정리 완료"; \
	else \
		echo "❌ 취소됨"; \
	fi

# 로그 디렉토리 생성
setup:
	@echo "⚙️ 초기 설정 중..."
	mkdir -p logs
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "📝 .env 파일이 생성되었습니다. 필요에 따라 수정하세요."; \
	fi
	@echo "✅ 초기 설정 완료"

# 개발 환경 설정
dev-setup: setup install-deps
	@echo "🛠️ 개발 환경 설정 완료"

# 모델 다운로드 (예시)
download-models:
	@echo "📥 AI 모델 다운로드 중..."
	@mkdir -p models/yolov8 models/ssd
	@echo "💡 커스텀 모델을 models/ 디렉토리에 배치하세요:"
	@echo "   - models/yolov8/yolov8_best.pt"
	@echo "   - models/ssd/ssd_model/"

# 백업 생성
backup:
	@echo "💾 데이터 백업 생성 중..."
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	docker run --rm -v orthanc-ai-server_orthanc_data:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/orthanc_backup_$$timestamp.tar.gz -C /data .; \
	echo "✅ 백업 완료: backups/orthanc_backup_$$timestamp.tar.gz"

# 백업 복원
restore:
	@echo "♻️ 데이터 복원:"
	@ls -la backups/*.tar.gz 2>/dev/null || (echo "❌ 백업 파일이 없습니다." && exit 1)
	@read -p "복원할 백업 파일명을 입력하세요: " backup_file; \
	if [ -f "backups/$$backup_file" ]; then \
		docker-compose down; \
		docker run --rm -v orthanc-ai-server_orthanc_data:/data -v $$(pwd)/backups:/backup alpine sh -c "cd /data && tar xzf /backup/$$backup_file"; \
		echo "✅ 복원 완료"; \
	else \
		echo "❌ 파일을 찾을 수 없습니다: backups/$$backup_file"; \
	fi

# 모니터링 대시보드 (간단한 상태 확인)
monitor:
	@echo "📊 실시간 모니터링 (Ctrl+C로 종료):"
	@while true; do \
		clear; \
		echo "=== Orthanc AI Server 모니터링 ==="; \
		echo "시간: $$(date)"; \
		echo ""; \
		echo "컨테이너 상태:"; \
		docker-compose ps; \
		echo ""; \
		echo "리소스 사용량:"; \
		docker stats orthanc-ai-server --no-stream; \
		echo ""; \
		echo "최근 로그 (마지막 5줄):"; \
		docker-compose logs --tail=5 orthanc; \
		sleep 5; \
	done