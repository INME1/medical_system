#!/bin/bash

echo "🔄 모든 파일에서 GCP IP(35.225.63.41)를 localhost로 변경합니다..."

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

# 프로젝트 루트로 이동
cd ~/medical-platform

log_info "현재 작업 디렉터리: $(pwd)"

# 1단계: 변경할 파일들 검색
log_info "GCP IP 주소가 포함된 파일들을 검색합니다..."

# GCP IP가 포함된 파일들 찾기
files_with_gcp_ip=$(grep -r "35\.225\.63\.41" . --include="*.py" --include="*.js" --include="*.json" --include="*.env" --include="*.conf" --include="*.yml" --include="*.yaml" --include="*.md" --include="*.txt" 2>/dev/null | cut -d: -f1 | sort | uniq)

if [ -z "$files_with_gcp_ip" ]; then
    log_warning "GCP IP 주소가 포함된 파일을 찾을 수 없습니다."
    exit 0
fi

echo ""
log_info "다음 파일들에서 GCP IP를 발견했습니다:"
echo "$files_with_gcp_ip" | while read file; do
    count=$(grep -c "35\.225\.63\.41" "$file" 2>/dev/null || echo "0")
    echo "  📄 $file (${count}개 발견)"
done

echo ""
read -p "🤔 모든 파일을 변경하시겠습니까? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    log_warning "작업이 취소되었습니다."
    exit 0
fi

# 2단계: 백업 디렉터리 생성
backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
log_info "백업 디렉터리를 생성합니다: $backup_dir"
mkdir -p "$backup_dir"

# 3단계: 파일별로 백업 후 변경
log_info "파일들을 백업하고 IP 주소를 변경합니다..."

echo "$files_with_gcp_ip" | while read file; do
    if [ -f "$file" ]; then
        # 백업 생성
        backup_path="$backup_dir/$(echo "$file" | sed 's|/|_|g')"
        cp "$file" "$backup_path"
        
        # IP 주소 변경
        sed -i 's/35\.225\.63\.41/localhost/g' "$file"
        
        # 변경 확인
        changed_count=$(diff "$backup_path" "$file" | grep "35\.225\.63\.41\|localhost" | wc -l)
        
        if [ "$changed_count" -gt 0 ]; then
            log_success "✅ $file - 변경 완료"
        else
            log_warning "⚠️ $file - 변경사항 없음"
        fi
    fi
done

# 4단계: 추가로 확인해야 할 특수 케이스들
log_info "특수 케이스들을 추가로 확인합니다..."

# Docker Compose 파일들에서 내부 IP 변경
find . -name "docker-compose*.yml" -o -name "docker-compose*.yaml" | while read compose_file; do
    if [ -f "$compose_file" ]; then
        log_info "Docker Compose 파일 확인: $compose_file"
        
        # 백업
        cp "$compose_file" "$backup_dir/$(basename "$compose_file").backup"
        
        # 내부 Docker 네트워크 IP도 변경
        sed -i 's/10\.128\.0\.11/host.docker.internal/g' "$compose_file"
        
        log_success "Docker Compose 파일 업데이트: $compose_file"
    fi
done

# 5단계: 환경 변수 파일들 특별 처리
log_info "환경 변수 파일들을 특별 처리합니다..."

find . -name "*.env" -type f | while read env_file; do
    if [ -f "$env_file" ] && grep -q "35\.225\.63\.41" "$env_file"; then
        log_info "환경 파일 처리: $env_file"
        
        # 백업
        cp "$env_file" "$backup_dir/$(basename "$env_file").backup"
        
        # URL 형태로 된 것들 변경
        sed -i 's|http://35\.225\.63\.41|http://localhost|g' "$env_file"
        sed -i 's|https://35\.225\.63\.41|https://localhost|g' "$env_file"
        
        log_success "환경 파일 업데이트: $env_file"
    fi
done

# 6단계: JavaScript/React 파일들 특별 처리
log_info "JavaScript/React 파일들을 특별 처리합니다..."

find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read js_file; do
    if [ -f "$js_file" ] && grep -q "35\.225\.63\.41" "$js_file"; then
        log_info "JavaScript 파일 처리: $js_file"
        
        # 백업
        cp "$js_file" "$backup_dir/$(basename "$js_file").backup"
        
        # API URL들 변경
        sed -i 's|http://35\.225\.63\.41|http://localhost|g' "$js_file"
        sed -i 's|https://35\.225\.63\.41|https://localhost|g' "$js_file"
        
        log_success "JavaScript 파일 업데이트: $js_file"
    fi
done

# 7단계: Nginx 설정 파일들 특별 처리
log_info "Nginx 설정 파일들을 특별 처리합니다..."

find . -name "nginx.conf" -o -name "*.nginx" | while read nginx_file; do
    if [ -f "$nginx_file" ]; then
        log_info "Nginx 설정 파일 처리: $nginx_file"
        
        # 백업
        cp "$nginx_file" "$backup_dir/$(basename "$nginx_file").backup"
        
        # 서버 이름과 프록시 설정 변경
        sed -i 's/server_name 35\.225\.63\.41/server_name localhost/g' "$nginx_file"
        sed -i 's/proxy_set_header Host 35\.225\.63\.41/proxy_set_header Host localhost/g' "$nginx_file"
        
        log_success "Nginx 설정 파일 업데이트: $nginx_file"
    fi
done

# 8단계: 변경 결과 확인
echo ""
log_info "변경 결과를 확인합니다..."

# 남은 GCP IP 주소 검색
remaining_ips=$(grep -r "35\.225\.63\.41" . --include="*.py" --include="*.js" --include="*.json" --include="*.env" --include="*.conf" --include="*.yml" --include="*.yaml" 2>/dev/null | wc -l)

if [ "$remaining_ips" -eq 0 ]; then
    log_success "🎉 모든 GCP IP 주소가 성공적으로 localhost로 변경되었습니다!"
else
    log_warning "⚠️ 아직 ${remaining_ips}개의 GCP IP 주소가 남아있습니다:"
    grep -r "35\.225\.63\.41" . --include="*.py" --include="*.js" --include="*.json" --include="*.env" --include="*.conf" --include="*.yml" --include="*.yaml" 2>/dev/null | head -5
fi

# 9단계: 변경 요약 리포트
echo ""
echo "📊 변경 요약 리포트"
echo "==================="
echo "백업 위치: $(pwd)/$backup_dir"
echo "처리된 파일 유형:"
echo "  - Python 파일들 (.py)"
echo "  - JavaScript/React 파일들 (.js, .jsx)"
echo "  - 환경 설정 파일들 (.env)"
echo "  - Docker Compose 파일들 (.yml, .yaml)"
echo "  - Nginx 설정 파일들 (.conf)"
echo "  - JSON 설정 파일들 (.json)"
echo ""

# 10단계: 백업 파일 목록
log_info "백업된 파일들:"
ls -la "$backup_dir" | head -10
backup_count=$(ls -1 "$backup_dir" | wc -l)
echo "총 ${backup_count}개 파일이 백업되었습니다."

echo ""
log_success "🎯 모든 작업이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. cd ~/medical-platform/backend"
echo "2. source venv/bin/activate"
echo "3. python manage.py runserver 0.0.0.0:8000"
echo ""
echo "🔙 롤백이 필요한 경우:"
echo "백업 디렉터리에서 원본 파일들을 복원할 수 있습니다."
echo "예: cp $backup_dir/backend_settings.py.backup backend/settings.py"

# 11단계: 추가 확인 스크립트 생성
cat > check_localhost.sh << 'EOF'
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
EOF

chmod +x check_localhost.sh

log_success "확인 스크립트도 생성했습니다: ./check_localhost.sh"
