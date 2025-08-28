FROM jodogne/orthanc-python:latest

USER root

# Python 설치 및 시스템 GUI 관련 패키지 추가
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
RUN pip3 install --break-system-packages \
    numpy \
    pillow \
    pydicom \
    opencv-python-headless \
    flask \
    flask_cors \
    requests \
    ultralytics \

    fastapi \
    uvicorn

# PyTorch (CPU)
RUN pip3 install --break-system-packages \
    torch \
    torchvision \
    torchaudio \
    --index-url https://download.pytorch.org/whl/cpu

# 파일 복사
COPY orthanc-config/orthanc.json /etc/orthanc/orthanc.json
COPY lua-scripts/ /etc/orthanc/lua-scripts/
COPY scripts/ /scripts/

# 권한 설정
RUN chmod +x /scripts/*.py

EXPOSE 8042 4242
