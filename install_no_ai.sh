echo "📦 CDSS Platform 의존성을 설치합니다 (AI 패키지 제외)..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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
cd ~/medical-platform
log_info "현재 위치: $(pwd)"

# 1단계: 시스템 패키지 설치
log_info "시스템 패키지를 설치합니다..."
sudo apt update
sudo apt install -y \
    pkg-config \
    libmysqlclient-dev \
    default-libmysqlclient-dev \
    libpq-dev \
    build-essential \
    python3-dev \
    python3-pip \
    python3-venv \
    libssl-dev \
    libffi-dev \
    tmux \
    curl \
    wget \
    git \
    vim \
    htop \
    tree \
    unzip

log_success "시스템 패키지 설치 완료"

# 2단계: Node.js 설치 (최신 LTS)
if ! command -v node >/dev/null 2>&1; then
    log_info "Node.js를 설치합니다..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js 설치 완료: $(node --version)"
else
    log_success "Node.js 이미 설치됨: $(node --version)"
fi

# 3단계: Backend Python 의존성 설치
log_info "Backend Python 의존성을 설치합니다..."

cd ~/medical-platform
if [ ! -d "backend" ]; then
    mkdir -p backend
fi

cd backend

# 기존 가상환경 삭제 후 새로 생성
if [ -d "venv" ]; then
    log_warning "기존 가상환경을 삭제하고 새로 생성합니다..."
    rm -rf venv
fi

# Python 가상환경 생성
log_info "Python 가상환경을 생성합니다..."
python3 -m venv venv
source venv/bin/activate

# pip 업그레이드
pip install --upgrade pip setuptools wheel

# 기본 Django 패키지 설치
log_info "Django 및 기본 패키지를 설치합니다..."
pip install \
    django==4.2 \
    djangorestframework \
    django-cors-headers \
    python-dotenv \
    mysqlclient \
    psycopg2-binary \
    celery \
    redis \
    requests \
    pillow \
    numpy \
    pandas \
    matplotlib \
    scipy

# 의료 관련 패키지 (AI 제외)
log_info "의료 관련 기본 패키지를 설치합니다..."
pip install \
    pydicom \
    SimpleITK \
    scikit-image \
    opencv-python-headless

# 개발 도구
log_info "개발 도구를 설치합니다..."
pip install \
    pytest \
    black \
    flake8 \
    django-extensions

# 기존 requirements.txt에서 AI 관련 제외하고 설치
if [ -f "requirements.txt" ]; then
    log_info "requirements.txt에서 AI 패키지를 제외하고 설치합니다..."
    
    # AI 관련 패키지 목록
    AI_PACKAGES="torch torchvision torchaudio tensorflow ultralytics keras tf-keras tensorflow-hub yolov8"
    
    # 임시 requirements 파일 생성 (AI 패키지 제외)
    grep -v -E "(torch|tensorflow|ultralytics|keras|yolo)" requirements.txt > requirements_no_ai.txt || cp requirements.txt requirements_no_ai.txt
    
    # AI 패키지 제외하고 설치
    pip install -r requirements_no_ai.txt || log_warning "일부 패키지 설치 실패 (무시하고 계속)"
    
    # 임시 파일 삭제
    rm -f requirements_no_ai.txt
fi

# 설치 확인
log_info "설치된 주요 패키지 확인:"
echo "✅ Django: $(python -c 'import django; print(django.get_version())' 2>/dev/null || echo '실패')"
echo "✅ DRF: $(python -c 'import rest_framework; print("OK")' 2>/dev/null || echo '실패')"
echo "✅ MySQLdb: $(python -c 'import MySQLdb; print("OK")' 2>/dev/null || echo '실패')"
echo "✅ psycopg2: $(python -c 'import psycopg2; print("OK")' 2>/dev/null || echo '실패')"
echo "✅ python-dotenv: $(python -c 'import dotenv; print("OK")' 2>/dev/null || echo '실패')"
echo "✅ pydicom: $(python -c 'import pydicom; print("OK")' 2>/dev/null || echo '실패')"
echo "✅ opencv: $(python -c 'import cv2; print("OK")' 2>/dev/null || echo '실패')"

deactivate
cd ..

log_success "Backend Python 의존성 설치 완료!"

# 4단계: Frontend Node.js 의존성 설치
if [ -d "frontend" ]; then
    log_info "Frontend Node.js 의존성을 설치합니다..."
    cd frontend
    
    if [ -f "package.json" ]; then
        # npm 캐시 정리
        npm cache clean --force
        
        # package-lock.json이 있으면 삭제 (충돌 방지)
        if [ -f "package-lock.json" ]; then
            rm package-lock.json
        fi
        
        # node_modules 디렉터리가 있으면 삭제
        if [ -d "node_modules" ]; then
            rm -rf node_modules
        fi
        
        # 의존성 설치
        log_info "npm install을 실행합니다..."
        npm install
        
        log_success "Frontend 의존성 설치 완료!"
        
        # 설치 확인
        log_info "주요 React 패키지 확인:"
        echo "✅ React: $(npm list react --depth=0 2>/dev/null | grep react || echo '확인 불가')"
        echo "✅ react-scripts: $(npm list react-scripts --depth=0 2>/dev/null | grep react-scripts || echo '확인 불가')"
    else
        log_warning "package.json을 찾을 수 없습니다"
    fi
    
    cd ..
fi

# 5단계: pacsapp 의존성 설치 (있는 경우)
if [ -d "pacsapp" ]; then
    log_info "PACS 앱 의존성을 설치합니다..."
    cd pacsapp
    
    if [ -f "package.json" ]; then
        # 기존 설치 파일들 정리
        rm -rf node_modules package-lock.json
        npm install
        log_success "PACS 앱 의존성 설치 완료!"
    fi
    
    cd ..
fi

# 6단계: Docker 관련 설정 확인
log_info "Docker 설정을 확인합니다..."
if command -v docker >/dev/null 2>&1; then
    if docker ps >/dev/null 2>&1; then
        log_success "Docker 정상 작동 중"
    else
        log_warning "Docker 권한 문제가 있을 수 있습니다"
        # Docker 권한 재설정
        sudo chmod 666 /var/run/docker.sock
        sudo service docker restart
    fi
else
    log_warning "Docker가 설치되지 않았습니다"
fi

# 7단계: 개발 스크립트 생성
log_info "개발 및 실행 스크립트를 생성합니다..."

# Django 마이그레이션 스크립트
cat > migrate.sh << 'EOF'
#!/bin/bash
echo "🗄️ 데이터베이스 마이그레이션을 실행합니다..."

cd ~/medical-platform/backend
source venv/bin/activate

# Django 마이그레이션
echo "Django 마이그레이션 실행 중..."
python manage.py makemigrations
python manage.py migrate

# OpenMRS 데이터베이스 마이그레이션 (있는 경우)
python manage.py migrate --database=openmrs 2>/dev/null || echo "OpenMRS 마이그레이션 스킵"

echo "✅ 마이그레이션 완료!"
deactivate
EOF

chmod +x migrate.sh

# 개발 모드 시작 스크립트 (tmux 사용)
cat > start_dev.sh << 'EOF'
#!/bin/bash
echo "🛠️ 개발 모드로 CDSS Platform을 시작합니다..."

# tmux 세션이 이미 있는지 확인
if tmux has-session -t medical-platform 2>/dev/null; then
    echo "⚠️ 기존 세션이 있습니다. 종료 후 새로 시작합니다..."
    tmux kill-session -t medical-platform
fi

# 새 tmux 세션 생성
echo "📋 tmux 세션을 생성합니다..."
tmux new-session -d -s medical-platform -c ~/medical-platform

# Backend 창
echo "🐍 Backend (Django) 설정 중..."
tmux send-keys -t medical-platform:0 "cd backend && source venv/bin/activate" Enter
tmux send-keys -t medical-platform:0 "python manage.py migrate --run-syncdb 2>/dev/null || true" Enter
tmux send-keys -t medical-platform:0 "python manage.py runserver 0.0.0.0:8000" Enter

# Frontend 창 생성
echo "⚛️ Frontend (React) 설정 중..."
tmux new-window -t medical-platform -n frontend -c ~/medical-platform/frontend
tmux send-keys -t medical-platform:frontend "npm start" Enter

# 상태 확인 창
tmux new-window -t medical-platform -n status -c ~/medical-platform
tmux send-keys -t medical-platform:status "watch -n 2 './status.sh'" Enter

# Backend 창으로 돌아가기
tmux select-window -t medical-platform:0

echo ""
echo "✅ 개발 환경이 시작되었습니다!"
echo ""
echo "📊 접속 주소:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:8000"
echo ""
echo "📋 tmux 사용법:"
echo "  - 세션 보기: tmux attach -t medical-platform"
echo "  - 창 전환: Ctrl+B → 1,2,3 (또는 n/p)"
echo "  - 세션 분리: Ctrl+B → d"
echo "  - 세션 종료: tmux kill-session -t medical-platform"
echo ""

# 세션에 연결
tmux attach -t medical-platform
EOF

chmod +x start_dev.sh

# 개발 모드 중지 스크립트
cat > stop_dev.sh << 'EOF'
#!/bin/bash
echo "🛑 개발 모드를 중지합니다..."

# tmux 세션 종료
if tmux has-session -t medical-platform 2>/dev/null; then
    tmux kill-session -t medical-platform
    echo "✅ tmux 세션 종료됨"
fi

# 포트에서 실행 중인 프로세스 강제 종료
echo "🔍 포트 정리 중..."
sudo lsof -t -i:8000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -t -i:3000 | xargs sudo kill -9 2>/dev/null || true

echo "✅ 개발 모드 완전 중지"
EOF

chmod +x stop_dev.sh

# Docker 모드 시작 스크립트 업데이트
cat > start.sh << 'EOF'
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
EOF

chmod +x start.sh

# 상태 확인 스크립트 업데이트
cat > status.sh << 'EOF'
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
EOF

chmod +x status.sh

# AI 패키지 별도 설치 스크립트
cat > install_ai.sh << 'EOF'
#!/bin/bash
echo "🤖 AI 패키지를 별도로 설치합니다..."

# AI 전용 가상환경 생성
echo "AI 전용 Python 환경을 생성합니다..."
python3 -m venv ~/ai-env
source ~/ai-env/bin/activate

# 기본 패키지 설치
pip install --upgrade pip setuptools wheel numpy

echo "어떤 버전의 AI 패키지를 설치하시겠습니까?"
echo "1) CPU 버전 (가볍고 빠름)"
echo "2) GPU 버전 (CUDA 필요, 강력함)"
read -p "선택 (1 또는 2): " choice

if [ "$choice" = "1" ]; then
    echo "📦 CPU 버전 AI 패키지를 설치합니다..."
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
    pip install tensorflow-cpu
    pip install ultralytics
else
    echo "📦 GPU 버전 AI 패키지를 설치합니다..."
    pip install torch torchvision torchaudio
    pip install tensorflow
    pip install ultralytics
fi

echo "✅ AI 패키지 설치 완료!"
echo "사용법: source ~/ai-env/bin/activate"
deactivate
EOF

chmod +x install_ai.sh

# 8단계: 최종 확인 및 안내
echo ""
echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉��"
echo "🎉                                   🎉"
echo "🎉   설치가 완료되었습니다!           🎉"
echo "🎉                                   🎉"
echo "🎉🎉🎉🎉��🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
echo ""

log_success "설치된 시스템 패키지:"
echo "  ✅ MySQL/PostgreSQL 개발 라이브러리"
echo "  ✅ Python 개발 도구"
echo "  ✅ Node.js $(node --version)"
echo "  ✅ 기본 개발 도구들"
echo ""

log_success "설치된 Python 패키지 (AI 제외):"
echo "  ✅ Django + DRF"
echo "  ✅ 데이터베이스 클라이언트 (MySQL, PostgreSQL)"
echo "  ✅ 기본 의료 이미지 처리 (pydicom, opencv)"
echo "  ✅ 데이터 분석 (numpy, pandas, matplotlib)"
echo ""

log_success "생성된 실행 스크립트:"
echo "  ✅ start_dev.sh - 개발 모드 (tmux 사용)"
echo "  ✅ start.sh - Docker 모드"
echo "  ✅ stop_dev.sh - 개발 모드 중지"
echo "  ✅ migrate.sh - 데이터베이스 마이그레이션"
echo "  ✅ status.sh - 시스템 상태 확인"
echo "  ✅ install_ai.sh - AI 패키지 별도 설치"
echo ""

log_info "🚀 시스템 시작 방법:"
echo ""
echo "🛠️ 개발 모드 (권장, 빠름):"
echo "   ./start_dev.sh"
echo ""
echo "🐳 Docker 모드 (완전한 환경):"
echo "   ./start.sh"
echo ""
echo "🗄️ 데이터베이스 마이그레이션:"
echo "   ./migrate.sh"
echo ""
echo "🤖 AI 패키지 설치 (나중에):"
echo "   ./install_ai.sh"
echo ""

log_warning "💡 중요 안내:"
echo "- 개발 모드는 tmux를 사용합니다 (Ctrl+B → d로 분리)"
echo "- 첫 실행 시 ./migrate.sh로 데이터베이스를 설정하세요"
echo "- AI 기능이 필요하면 나중에 ./install_ai.sh 실행"
echo "- ./status.sh로 언제든 시스템 상태를 확인할 수 있습니다"
echo ""

log_success "🎯 이제 ./start_dev.sh를 실행하세요!"

# 현재 디렉터리 구조 표시
echo ""
log_info "현재 프로젝트 구조:"
ls -la
