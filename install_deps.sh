#!/bin/bash

echo "📦 CDSS Platform 의존성을 설치합니다..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# 현재 위치 확인
cd ~/medical-platform

log_info "현재 위치: $(pwd)"
log_info "디렉터리 구조:"
ls -la

# 1단계: Backend Python 의존성 설치
if [ -d "backend" ]; then
    log_info "Backend Python 의존성을 설치합니다..."
    cd backend
    
    # Python 가상환경 생성
    log_info "Python 가상환경을 생성합니다..."
    python3 -m venv venv
    
    # 가상환경 활성화
    source venv/bin/activate
    
    # pip 업그레이드
    pip install --upgrade pip
    
    # 기본 패키지 먼저 설치
    log_info "기본 Python 패키지를 설치합니다..."
    pip install python-dotenv
    
    # requirements.txt가 있으면 설치
    if [ -f "requirements.txt" ]; then
        log_info "requirements.txt에서 패키지를 설치합니다..."
        pip install -r requirements.txt
    else
        log_info "requirements.txt가 없습니다. 기본 Django 패키지를 설치합니다..."
        pip install django djangorestframework django-cors-headers mysqlclient psycopg2-binary
    fi
    
    # 가상환경 비활성화
    deactivate
    
    log_success "Backend Python 의존성 설치 완료"
    cd ..
else
    log_warning "backend 디렉터리를 찾을 수 없습니다"
fi

# 2단계: Frontend Node.js 의존성 설치
if [ -d "frontend" ]; then
    log_info "Frontend Node.js 의존성을 설치합니다..."
    cd frontend
    
    # package.json 확인
    if [ -f "package.json" ]; then
        log_info "npm install을 실행합니다... (시간이 걸릴 수 있습니다)"
        npm install
        log_success "Frontend 의존성 설치 완료"
    else
        log_warning "package.json을 찾을 수 없습니다"
        
        # React 프로젝트 새로 생성
        log_info "새 React 프로젝트를 생성합니다..."
        cd ..
        npx create-react-app frontend
        cd frontend
    fi
    
    cd ..
else
    log_warning "frontend 디렉터리를 찾을 수 없습니다"
fi

# 3단계: pacsapp 의존성 설치 (있는 경우)
if [ -d "pacsapp" ]; then
    log_info "PACS 앱 의존성을 설치합니다..."
    cd pacsapp
    
    if [ -f "package.json" ]; then
        npm install
        log_success "PACS 앱 의존성 설치 완료"
    fi
    
    cd ..
fi

# 4단계: AI 관련 의존성 설치 (docker-compose/requirements.txt)
if [ -f "docker-compose/requirements.txt" ]; then
    log_info "AI 관련 의존성을 설치합니다..."
    
    # 별도 가상환경에 설치
    python3 -m venv ~/ai-env
    source ~/ai-env/bin/activate
    pip install --upgrade pip
    pip install -r docker-compose/requirements.txt
    deactivate
    
    log_success "AI 의존성 설치 완료"
fi

# 5단계: 개발 모드 시작 스크립트 생성
log_info "개발 모드 시작 스크립트를 생성합니다..."

cat > start_dev.sh << 'EOF'
#!/bin/bash
echo "🛠️ 개발 모드로 CDSS Platform을 시작합니다..."

# 함수 정의
start_backend() {
    echo "🐍 Django Backend 시작 중..."
    cd ~/medical-platform/backend
    source venv/bin/activate
    python manage.py migrate 2>/dev/null || echo "마이그레이션 스킵"
    python manage.py runserver 0.0.0.0:8000 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
}

start_frontend() {
    echo "⚛️ React Frontend 시작 중..."
    cd ~/medical-platform/frontend
    npm start &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
}

# 데이터베이스만 Docker로 시작
echo "🐳 데이터베이스 서비스만 시작합니다..."
if [ -f "docker-compose/docker-compose.yml" ]; then
    docker compose -f docker-compose/docker-compose.yml up -d mariadb openmrs-mysql orthanc-postgres mongodb redis
else
    echo "Docker Compose 파일을 찾을 수 없습니다. 전체 서비스를 시작합니다..."
    ./start.sh
    exit 0
fi

# Backend와 Frontend 시작
start_backend
sleep 5
start_frontend

echo ""
echo "✅ 개발 모드 시작 완료!"
echo ""
echo "📊 서비스 접속 주소:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:8000"
echo ""
echo "🛑 중지하려면: Ctrl+C를 누르고 ./stop_dev.sh 실행"

# PID 저장
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

# 대기
wait
EOF

chmod +x start_dev.sh

# 개발 모드 중지 스크립트
cat > stop_dev.sh << 'EOF'
#!/bin/bash
echo "🛑 개발 모드를 중지합니다..."

# 저장된 PID로 프로세스 종료
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "Backend 중지됨 (PID: $BACKEND_PID)"
    rm backend.pid
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "Frontend 중지됨 (PID: $FRONTEND_PID)"
    rm frontend.pid
fi

# 포트로 실행 중인 프로세스 찾아서 종료
sudo lsof -t -i:8000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -t -i:3000 | xargs sudo kill -9 2>/dev/null || true

echo "✅ 개발 모드 중지 완료"
EOF

chmod +x stop_dev.sh

log_success "개발 스크립트 생성 완료 (start_dev.sh, stop_dev.sh)"

# 6단계: 설치 확인
log_info "설치 확인을 진행합니다..."

echo ""
echo "📋 설치된 도구 버전:"

# Python 확인
if [ -f "backend/venv/bin/python" ]; then
    echo "✅ Python (가상환경): $(backend/venv/bin/python --version)"
    echo "✅ Django: $(backend/venv/bin/python -c 'import django; print(django.get_version())' 2>/dev/null || echo 'Not installed')"
else
    echo "❌ Python 가상환경 없음"
fi

# Node.js 확인
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
    echo "✅ npm: $(npm --version)"
else
    echo "❌ Node.js 설치 필요"
fi

# Docker 확인
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker 설치 필요"
fi

echo ""
echo "🎉 의존성 설치가 완료되었습니다!"
echo ""

log_info "다음 단계를 선택하세요:"
echo ""
echo "🐳 Docker로 전체 시스템 시작:"
echo "   ./start.sh"
echo ""
echo "🛠️ 개발 모드로 시작 (권장):"
echo "   ./start_dev.sh"
echo ""
echo "👀 각각 따로 시작:"
echo "   터미널 1: cd backend && source venv/bin/activate && python manage.py runserver"
echo "   터미널 2: cd frontend && npm start"
echo ""

echo "💡 개발 모드가 더 빠르고 디버깅하기 좋습니다!"
