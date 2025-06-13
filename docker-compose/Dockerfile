FROM jodogne/orthanc-python:1.12.7
USER root

# ✅ 시스템 패키지 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        python3-pip \
        python3-dev \
        build-essential \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*



# ✅ Python 라이브러리 설치 (AI 모델 추론용 + 이미지 처리 등)
RUN pip3 install --break-system-packages \
    requests \
    numpy \
    pillow \
    pydicom \
    opencv-python-headless \
    scikit-image \
    matplotlib \
    torch \
    torchvision \
    ultralytics \
    tensorflow \
    flask \
    fastapi \
    uvicorn \
    gunicorn \
    && rm -rf ~/.cache/pip/*

# REMOVED: COPY ./ai_models/ /models/  <-- Docker Compose 볼륨으로 처리
# REMOVED: COPY ./scripts/ /scripts/            <-- Docker Compose 볼륨으로 처리

# ✅ 스크립트 실행 권한 부여
# 이 부분은 마운트된 스크립트에 적용됩니다.
# 호스트에서 스크립트 권한을 설정하거나, 컨테이너 시작 시점에 Entrypoint 스크립트를 통해
# 권한을 부여하는 것을 고려할 수도 있습니다. 현재는 유지해도 무방합니다.
RUN chmod +x /scripts/*.py

# ✅ Orthanc 설정 경로 생성 및 설정 파일 복사
RUN mkdir -p /etc/orthanc /var/lib/orthanc/db
COPY ./orthanc-config/orthanc.json /etc/orthanc/orthanc.json

# ✅ 포트 오픈 (HTTP / DICOM)
EXPOSE 8042 4242

CMD ["Orthanc", "/etc/orthanc/orthanc.json"]