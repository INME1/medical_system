// 의료 영상 뷰어 상수 정의

// AI 모델 정보
export const AI_MODELS = {
  YOLOV8: {
    id: 'yolov8',
    name: 'YOLOv8',
    color: '#3b82f6',
    description: '실시간 객체 탐지 모델',
    type: 'detection'
  },
  SSD: {
    id: 'ssd',
    name: 'SSD',
    color: '#ef4444',
    description: '단일 샷 탐지기',
    type: 'detection'
  },
  SIMCLR: {
    id: 'simclr',
    name: 'SimCLR',
    color: '#22c55e',
    description: '자가 지도 학습 모델',
    type: 'classification'
  }
};

// 도구 정의
export const VIEWER_TOOLS = {
  WWWC: { id: 'wwwc', name: 'Window/Level', shortcut: 'W' },
  ZOOM: { id: 'zoom', name: 'Zoom', shortcut: 'Z' },
  PAN: { id: 'pan', name: 'Pan', shortcut: 'P' },
  LENGTH: { id: 'length', name: 'Length', shortcut: 'L' },
  RECTANGLE: { id: 'rectangle', name: 'Rectangle ROI', shortcut: 'R' },
  CIRCLE: { id: 'circle', name: 'Circle ROI', shortcut: 'C' },
  ANGLE: { id: 'angle', name: 'Angle', shortcut: 'A' },
  ROTATE: { id: 'rotate', name: 'Rotate', shortcut: 'O' },
  FLIP: { id: 'flip', name: 'Flip', shortcut: 'F' },
  INVERT: { id: 'invert', name: 'Invert', shortcut: 'I' },
  RESET: { id: 'reset', name: 'Reset', shortcut: 'ESC' }
};

// 패널 타입
export const PANEL_TYPES = {
  MEASUREMENTS: 'measurements',
  AI_ANNOTATIONS: 'ai-annotations',
  MANUAL_ANNOTATIONS: 'manual-annotations',
  REPORTS: 'reports'
};

// 뷰포트 기본 설정
export const DEFAULT_VIEWPORT_SETTINGS = {
  windowWidth: 400,
  windowCenter: 40,
  zoom: 1.0,
  invert: false,
  rotation: 0,
  hflip: false,
  vflip: false
};

// HU 윈도우 프리셋
export const WINDOW_PRESETS = {
  LUNG: { windowWidth: 1500, windowCenter: -600, name: '폐' },
  MEDIASTINUM: { windowWidth: 350, windowCenter: 50, name: '종격동' },
  ABDOMEN: { windowWidth: 400, windowCenter: 50, name: '복부' },
  BONE: { windowWidth: 1800, windowCenter: 400, name: '뼈' },
  BRAIN: { windowWidth: 100, windowCenter: 50, name: '뇌' },
  LIVER: { windowWidth: 150, windowCenter: 30, name: '간' },
  ANGIO: { windowWidth: 600, windowCenter: 100, name: '혈관' }
};

// 측정 단위
export const MEASUREMENT_UNITS = {
  LENGTH: 'mm',
  AREA: 'mm²',
  VOLUME: 'mm³',
  ANGLE: '°',
  DENSITY: 'HU'
};

// 지원하는 DICOM 모달리티
export const MODALITIES = {
  CT: 'CT',
  MR: 'MR', 
  XA: 'XA',
  DX: 'DX',
  CR: 'CR',
  US: 'US',
  NM: 'NM',
  PT: 'PT',
  MG: 'MG',
  RF: 'RF'
};

// 이미지 형식
export const IMAGE_FORMATS = {
  DICOM: 'application/dicom',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WADO: 'application/wado'
};

// API 엔드포인트
export const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  STUDIES: '/api/studies',
  SERIES: '/api/series',
  INSTANCES: '/api/instances',
  AI_ANALYZE: '/api/ai/analyze',
  REPORTS: '/api/reports',
  MEASUREMENTS: '/api/measurements'
};

// 에러 메시지
export const ERROR_MESSAGES = {
  LOAD_IMAGE_FAILED: '이미지 로드에 실패했습니다.',
  CORNERSTONE_INIT_FAILED: 'Cornerstone 초기화에 실패했습니다.',
  AI_ANALYSIS_FAILED: 'AI 분석에 실패했습니다.',
  SAVE_FAILED: '저장에 실패했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  INVALID_DICOM: '유효하지 않은 DICOM 파일입니다.',
  UNSUPPORTED_FORMAT: '지원하지 않는 파일 형식입니다.'
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  IMAGE_LOADED: '이미지가 성공적으로 로드되었습니다.',
  AI_ANALYSIS_COMPLETE: 'AI 분석이 완료되었습니다.',
  MEASUREMENT_SAVED: '측정값이 저장되었습니다.',
  REPORT_SAVED: '리포트가 저장되었습니다.',
  EXPORT_COMPLETE: '내보내기가 완료되었습니다.'
};

// 키보드 단축키
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_LEFT_PANEL: 'F1',
  TOGGLE_RIGHT_PANEL: 'F2',
  NEXT_SLICE: 'ArrowDown',
  PREV_SLICE: 'ArrowUp',
  PLAY_PAUSE: 'Space',
  RESET_VIEWPORT: 'Escape',
  ZOOM_IN: '+',
  ZOOM_OUT: '-',
  FIT_TO_WINDOW: '0'
};

// 테마 색상
export const COLORS = {
  PRIMARY: '#2563eb',
  SUCCESS: '#16a34a',
  WARNING: '#d97706',
  DANGER: '#dc2626',
  INFO: '#0891b2',
  BACKGROUND: '#0f172a',
  SURFACE: '#1e293b',
  BORDER: '#475569',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#94a3b8',
  TEXT_MUTED: '#64748b'
};

// 애니메이션 설정
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  CINE_DEFAULT: 100
};

// 파일 크기 제한
export const FILE_SIZE_LIMITS = {
  MAX_DICOM_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,  // 10MB
  MAX_REPORT_SIZE: 1 * 1024 * 1024   // 1MB
};

// 페이지네이션 설정
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'mv_user_preferences',
  RECENT_STUDIES: 'mv_recent_studies',
  VIEWPORT_SETTINGS: 'mv_viewport_settings',
  AI_MODEL_SETTINGS: 'mv_ai_model_settings'
};

// 환경 설정
export const CONFIG = {
  ENABLE_WEBGL: true,
  USE_WEB_WORKERS: true,
  MAX_CACHED_IMAGES: 50,
  PREFETCH_COUNT: 5,
  AUTO_SAVE_INTERVAL: 30000, // 30초
  SESSION_TIMEOUT: 3600000   // 1시간
};