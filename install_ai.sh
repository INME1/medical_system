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
