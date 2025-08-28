# LACID - Lung Abnormality Clinical Intelligence Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2-green.svg)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)

> 실제 병원 환경에서 사용 가능한 AI 기반 흉부 X-ray 이상 탐지 임상 의사결정 지원 시스템

##  프로젝트 개요

LACID는 의료진의 흉부 X-ray 판독을 지원하기 위한 종합적인 CDSS(Clinical Decision Support System)입니다. OpenMRS(전자의무기록)와 Orthanc PACS(의료영상저장시스템)를 완전 통합하여, AI 기반 이상 탐지부터 의료진 워크플로우까지 전체 진료 과정을 지원합니다.

### 주요 특징

- ** 3중 AI 모델 앙상블**: YOLOv8, SSD, SimCLR+EfficientNet-B2 동시 실행
- ** 의료 시스템 통합**: OpenMRS EMR + Orthanc PACS 완전 연동
- ** 실시간 처리**: Lua 스크립트 기반 자동 분석 트리거
- ** 정밀 진단**: annotation 시각화(box)로 근거 제시
- ** 마이크로서비스**: Docker Compose 기반 확장 가능한 아키텍처

## 🛠 기술 스택

### Backend
- **Framework**: Django REST Framework
- **Database**: PostgreSQL, MySQL, MariaDB
- **Queue**: Celery + Redis
- **AI/ML**: PyTorch, TensorFlow, OpenCV
- **Medical Standards**: DICOM, HL7 FHIR

### Frontend
- **Framework**: React 18
- **State Management**: Redux
- **HTTP Client**: Axios
- **UI Library**: Material-UI

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: nginx
- **Medical Systems**: OpenMRS, Orthanc PACS
- **Automation**: Lua Scripts

##  시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web    │    │  OpenMRS EMR    │    │  Orthanc PACS   │
│   Frontend      │    │   (MySQL)       │    │ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │            nginx Reverse Proxy              │
         └─────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │             Django Backend                  │
         │  ┌─────────────────┐  ┌─────────────────┐   │
         │  │  Medical        │  │  AI Analysis    │   │
         │  │  Integration    │  │  Service        │   │
         │  └─────────────────┘  └─────────────────┘   │
         └─────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │          Celery + Redis Queue               │
         └─────────────────────────────────────────────┘
```

##  사전 요구사항

- Docker & Docker Compose
- Python 3.9+
- Node.js 16+
- 최소 8GB RAM (AI 모델 실행용)

##  빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/INME1/medical_system.git
cd medical_system
```

### 2. 환경변수 설정

```bash
# 백엔드 환경변수
cp backend/.env.example backend/.env

# 프론트엔드 환경변수
cp pacsapp/.env.example pacsapp/.env
```

### 3. Docker 컨테이너 실행

```bash
cd docker-compose
docker-compose up -d
```

### 4. 서비스 확인

- **메인 애플리케이션**: http://localhost:3000
- **Django Admin**: http://localhost:8000/admin
- **OpenMRS**: http://localhost:8082/openmrs
- **Orthanc**: http://localhost:8042
- **phpMyAdmin**: http://localhost:8080

##  프로젝트 구조

```
medical_system/
├── backend/                 # Django 백엔드
│   ├── medical_integration/ # 메인 통합 앱
│   ├── ai_analysis/        # AI 모델 서비스
│   ├── openmrs_models/     # OpenMRS 연동
│   ├── orthanc_models/     # Orthanc 연동
│   └── ...
├── pacsapp/                # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   └── ...
├── docker-compose/         # Docker 설정
│   ├── docker-compose.yml
│   ├── nginx/
│   └── lua-scripts/
└── models/                 # AI 모델 파일
```

## 🔧 주요 기능

### 1. 통합 EMR/PACS 연동
- OpenMRS와 Orthanc 실시간 데이터 동기화
- 환자 ID 기반 자동 매핑
- DICOM 표준 완전 준수

### 2. AI 기반 이상 탐지
- **YOLOv8**: 객체 탐지 기반 병변 위치 파악
- **SSD**: 빠른 실시간 분석
- **SimCLR**: 패치 기반 이상 탐지
- **Grad-CAM**: AI 판단 근거 시각화

### 3. 자동화 워크플로우
- Lua 스크립트 기반 DICOM 이벤트 처리
- 새 이미지 저장 시 자동 AI 분석 트리거
- Celery를 통한 비동기 작업 처리

### 4. STT 기반 음성 판독
- 의료진 음성을 실시간 텍스트 변환
- SOAP 형식 자동 생성
- 판독 보고서 자동화

##  API 문서

### 주요 엔드포인트

- `GET /api/integration/patients/` - 환자 목록 조회
- `POST /api/ai/analyze/` - AI 분석 실행
- `GET /api/ai/results/{study_uid}/` - 분석 결과 조회
- `POST /api/dr-annotations/` - 의료진 어노테이션 저장

##  보안 및 규정 준수

- **HIPAA 준수**: 환자 데이터 암호화 및 접근 제어
- **DICOM 표준**: 의료영상 표준 완전 준수
- **HL7 FHIR**: 상호운용성 확보
- **감사 로그**: 모든 의료 데이터 접근 기록

##  문제 해결

### 일반적인 문제

1. **Docker 컨테이너 시작 실패**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. **AI 모델 로드 실패**
   - models/ 디렉토리에 모델 파일 확인
   - 메모리 사용량 확인 (최소 4GB 권장)

3. **OpenMRS 연결 오류**
   - OpenMRS 컨테이너 상태 확인
   - 환경변수 OPENMRS_API_* 설정 확인

##  라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 

##  기여자

- **개발팀**: 4명
- **프로젝트 기간**: 2025.05 - 2025.07

##  지원

이슈나 질문이 있으시면 [GitHub Issues](https://github.com/INME1/medical_system/issues)를 통해 문의해주세요.

---

**⚠ 의료용 소프트웨어 경고**: 이 시스템은 의료진의 진단을 보조하는 도구입니다. 최종 진단과 치료 결정은 반드시 자격을 갖춘 의료진이 내려야 합니다.
