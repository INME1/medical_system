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
