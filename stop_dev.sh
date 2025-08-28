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
