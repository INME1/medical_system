# 🎯 CDSS Medical Platform 환경 설정 수정 스크립트
set -e

echo "🔧 CDSS Medical Platform 환경 설정을 수정합니다..."
echo "================================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수 정의
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 현재 위치 확인
log_info "현재 작업 디렉터리: $(pwd)"
log_info "디렉터리 내용:"
ls -la

# medical_system-main 폴더에서 파일들을 현재 디렉터리로 이동
if [ -d "medical_system-main" ]; then
    log_info "medical_system-main 폴더에서 파일들을 복사합니다..."
    
    # 모든 파일과 폴더를 현재 디렉터리로 복사
    cp -r medical_system-main/* . 2>/dev/null || true
    cp -r medical_system-main/.* . 2>/dev/null || true
    
    log_success "파일 복사 완료"
    
    # 복사 후 구조 확인
    log_info "복사 후 디렉터리 구조:"
    ls -la
fi

# backend 디렉터리 존재 확인 및 생성
if [ ! -d "backend" ]; then
    log_warning "backend 디렉터리가 없습니다. 생성합니다..."
    mkdir -p backend
fi

# frontend 디렉터리 존재 확인 및 생성
if [ ! -d "frontend" ]; then
    log_warning "frontend 디렉터리가 없습니다. 생성합니다..."
    mkdir -p frontend
fi

# 권한 설정
sudo chown -R $USER:$USER .
chmod -R 755 .

# Backend .env 파일 생성
log_info "backend/.env 파일을 생성합니다..."

cat > backend/.env << 'EOF'
#################################
# 🔐 Django Settings
#################################
SECRET_KEY=django-insecure-your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

#################################
# ⚙️ Celery / Redis
#################################
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
REDIS_URL=redis://localhost:6379/1

#################################
# 🩺 Orthanc (PACS)
#################################
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
ORTHANC_HOST=localhost
ORTHANC_PORT=8042
ORTHANC_PROTOCOL=http
ORTHANC_TIMEOUT=60
ORTHANC_MAX_RETRIES=3

#################################
# 🗄️ MariaDB (Django Main DB)
#################################
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3306
MARIADB_DATABASE=medical_platform
MARIADB_USER=medical_user
MARIADB_PASSWORD=medical_password

#################################
# 🩻 OpenMRS (EMR)
#################################
OPENMRS_HOST=127.0.0.1
OPENMRS_PORT=3307
OPENMRS_DATABASE=openmrs
OPENMRS_USER=openmrs
OPENMRS_PASSWORD=Admin123

# OpenMRS REST API
OPENMRS_API_HOST=127.0.0.1
OPENMRS_API_PORT=8082
OPENMRS_API_BASE=http://localhost:8082/openmrs/ws/rest/v1
OPENMRS_API_USER=admin
OPENMRS_API_PASSWORD=Admin123

#################################
# 🧠 Orthanc - PostgreSQL
#################################
ORTHANC_DB_HOST=localhost
ORTHANC_DB_PORT=5432
ORTHANC_DB_DATABASE=orthanc
ORTHANC_DB_USER=orthanc
ORTHANC_DB_PASSWORD=orthanc

#################################
# 📦 MongoDB
#################################
MONGODB_HOST=127.0.0.1
MONGODB_PORT=27017
MONGODB_DATABASE=medical_system

# AI 모델 설정
AI_CONFIDENCE_THRESHOLD=0.5
AI_IOU_THRESHOLD=0.45
YOLO_MODEL_PATH=/models/yolov8_best.pt
SSD_MODEL_PATH=/models/ssd_model
EOF

log_success "backend/.env 파일 생성 완료"

# Frontend .env 파일 생성
log_info "frontend/.env 파일을 생성합니다..."

cat > frontend/.env << 'EOF'
# WSL2 로컬 환경 설정
REACT_APP_API_BASE_URL=http://localhost:8000/api/
REACT_APP_INTEGRATION_API=http://localhost:8000/api/integration/
REACT_APP_DJANGO_API_URL=http://localhost:8000/api/integration

# API URLs
REACT_APP_API_URL=http://localhost:8000/api/
REACT_APP_OHIF_URL=http://localhost:3001
REACT_APP_ORTHANC_URL=http://localhost:8042

# OpenMRS
REACT_APP_OPENMRS_API_URL=http://localhost:8082/openmrs/ws/rest/v1/
REACT_APP_OPENMRS_PROXY_URL=http://localhost:8000/api/openmrs/patient/
REACT_APP_OPENMRS_AUTH_TOKEN=YWRtaW46QWRtaW4xMjM=

# 기타 서비스
REACT_APP_API_URL_statistic=http://localhost:8000/api/statisticsboard/
REACT_APP_API_URL_notics=http://localhost:8000

# 디버그 모드
REACT_APP_DEBUG=true
REACT_APP_API_TIMEOUT=30000

# OpenMRS 인증
REACT_APP_OPENMRS_USERNAME=admin
REACT_APP_OPENMRS_PASSWORD=Admin123
EOF

log_success "frontend/.env 파일 생성 완료"

# 기존 설정 파일들에서 IP 주소 변경
log_info "기존 설정 파일에서 GCP IP를 localhost로 변경합니다..."

# IP 주소 변경 함수
update_ip_in_file() {
    local file=$1
    if [ -f "$file" ]; then
        log_info "업데이트 중: $file"
        
        # 백업 생성
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        
        # GCP IP를 localhost로 변경
        sed -i 's/35\.225\.63\.41/localhost/g' "$file" 2>/dev/null || true
        sed -i 's/http:\/\/django:/http:\/\/localhost:/g' "$file" 2>/dev/null || true
        
        log_success "$file 업데이트 완료"
    fi
}

# 모든 .env 파일 업데이트
find . -name "*.env" -type f 2>/dev/null | while read env_file; do
    update_ip_in_file "$env_file"
done

# Django settings.py 파일 업데이트
find . -name "settings.py" -path "*/backend/*" 2>/dev/null | while read settings_file; do
    update_ip_in_file "$settings_file"
done

# Docker Compose 파일 업데이트
find . -name "docker-compose.yml" -o -name "docker-compose.yaml" 2>/dev/null | while read compose_file; do
    update_ip_in_file "$compose_file"
done

# Nginx 설정 파일 업데이트
find . -name "nginx.conf" -o -name "*.nginx" 2>/dev/null | while read nginx_file; do
    if [ -f "$nginx_file" ]; then
        log_info "Nginx 설정 파일 업데이트 중: $nginx_file"
        
        # 백업 생성
        cp "$nginx_file" "${nginx_file}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        
        # IP 주소 변경
        sed -i 's/35\.225\.63\.41/localhost/g' "$nginx_file" 2>/dev/null || true
        sed -i 's/10\.128\.0\.11/host.docker.internal/g' "$nginx_file" 2>/dev/null || true
        
        log_success "Nginx 설정 파일 업데이트 완료"
    fi
done

# Git 설정
log_info "Git을 설정합니다..."

# Git 사용자 정보 설정
git config --global user.name "Medical Platform Developer" 2>/dev/null || true
git config --global user.email "developer@medical-platform.local" 2>/dev/null || true

# .gitignore 파일 생성
log_info ".gitignore 파일을 생성합니다..."

cat > .gitignore << 'EOF'
# Environment files
.env
*.env
.env.local
.env.backup.*

# Database
*.sqlite3
*.db

# Logs
logs/
*.log

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
venv/
.venv/
env/
ENV/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Model files (large files)
models/*.pt
models/*.onnx
models/*.pb
models/*.h5

# Docker
.docker/

# Backup files
*.backup.*

# Temporary files
get-docker.sh
fix_env.sh
setup.sh
EOF

# Git 저장소 초기화
if [ ! -d ".git" ]; then
    log_info "Git 저장소를 초기화합니다..."
    git init
    git add .
    git commit -m "Initial commit: CDSS Medical Platform setup" 2>/dev/null || true
    log_success "Git 저장소 초기화 완료"
fi

# 편의 스크립트 생성
log_info "편의 스크립트를 생성합니다..."

# 시작 스크립트
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 CDSS Medical Platform을 시작합니다..."

# Docker 서비스 시작
echo "🐳 Docker 서비스를 시작합니다..."
sudo service docker start

# Docker Compose 파일 찾기
COMPOSE_FILE=""
if [ -f "docker-compose/docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose/docker-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    echo "❌ Docker Compose 파일을 찾을 수 없습니다"
    echo "현재 위치에서 파일 목록:"
    ls -la
    exit 1
fi

echo "📝 사용할 Compose 파일: $COMPOSE_FILE"

# Docker Compose로 모든 서비스 시작
echo "🏗️ Docker 이미지를 빌드하고 서비스를 시작합니다..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "⏳ 서비스 시작을 대기합니다..."
sleep 15

echo "✅ 모든 서비스가 시작되었습니다!"
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
EOF

chmod +x start.sh

# 중지 스크립트
cat > stop.sh << 'EOF'
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
EOF

chmod +x stop.sh

# 상태 확인 스크립트
cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 CDSS Medical Platform 상태 확인"
echo "================================"

echo "🐳 Docker 컨테이너 상태:"
docker ps -a

echo ""
echo "🔍 서비스 헬스체크:"

services=(
    "Django:http://localhost:8000/api/health/"
    "Orthanc:http://localhost:8042/system"
    "OpenMRS:http://localhost:8082/openmrs/ws/rest/v1/session"
    "React:http://localhost:3000"
    "OHIF:http://localhost:3001"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    url=$(echo $service | cut -d: -f2-)
    
    echo -n "Testing $name... "
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
done

echo ""
echo "💾 디스크 사용량:"
df -h | grep -E "(Filesystem|/dev/sda)"

echo ""
echo "🧠 메모리 사용량:"
free -h
EOF

chmod +x status.sh

# Python 가상환경 생성 (backend가 있는 경우)
if [ -d "backend" ]; then
    log_info "Python 가상환경을 생성합니다..."
    cd backend
    
    if [ -f "requirements.txt" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt 2>/dev/null || log_warning "일부 패키지 설치 실패"
        deactivate
        log_success "Python 가상환경 설정 완료"
    fi
    
    cd ..
fi

# Node.js 의존성 설치 (frontend가 있는 경우)
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    log_info "Frontend 의존성을 설치합니다..."
    cd frontend
    npm install 2>/dev/null || log_warning "일부 npm 패키지 설치 실패"
    cd ..
    log_success "Frontend 의존성 설치 완료"
fi

# 완료 메시지
echo ""
echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
echo "🎉                                   🎉"
echo "🎉  환경 설정이 완료되었습니다!         🎉"
echo "🎉                                   🎉"
echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
echo ""

log_success "생성된 파일들:"
echo "  ✅ backend/.env - Django 환경 설정"
echo "  ✅ frontend/.env - React 환경 설정"
echo "  ✅ start.sh - 시스템 시작 스크립트"
echo "  ✅ stop.sh - 시스템 중지 스크립트"
echo "  ✅ status.sh - 상태 확인 스크립트"
echo "  ✅ .gitignore - Git 무시 파일"
echo ""

log_info "다음 단계:"
echo "1. 새 터미널 열기 (Docker 그룹 적용)"
echo "2. cd ~/medical-platform"
echo "3. ./start.sh"
echo ""

log_info "현재 디렉터리 구조:"
ls -la

echo ""
log_success "🚀 모든 설정이 완료되었습니다! 이제 ./start.sh를 실행하세요!"
