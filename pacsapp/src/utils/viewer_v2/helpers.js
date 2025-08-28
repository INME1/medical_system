// 헬퍼 함수들

import { WINDOW_PRESETS, MEASUREMENT_UNITS, ERROR_MESSAGES } from './constants';

/**
 * 날짜 포맷팅
 */
export const formatDate = (date, format = 'YYYY.MM.DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'YYYY.MM.DD':
      return `${year}.${month}.${day}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY.MM.DD HH:mm':
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    default:
      return `${year}.${month}.${day}`;
  }
};

/**
 * DICOM 날짜 파싱 (YYYYMMDD)
 */
export const parseDicomDate = (dicomDate) => {
  if (!dicomDate || dicomDate.length !== 8) return null;
  
  const year = dicomDate.substring(0, 4);
  const month = dicomDate.substring(4, 6);
  const day = dicomDate.substring(6, 8);
  
  return new Date(`${year}-${month}-${day}`);
};

/**
 * DICOM 시간 파싱 (HHMMSS)
 */
export const parseDicomTime = (dicomTime) => {
  if (!dicomTime) return '';
  
  const time = dicomTime.toString().padStart(6, '0');
  const hours = time.substring(0, 2);
  const minutes = time.substring(2, 4);
  const seconds = time.substring(4, 6);
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 거리 계산 (픽셀 좌표)
 */
export const calculateDistance = (point1, point2, pixelSpacing = { x: 1, y: 1 }) => {
  const deltaX = (point2.x - point1.x) * pixelSpacing.x;
  const deltaY = (point2.y - point1.y) * pixelSpacing.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

/**
 * 면적 계산 (사각형)
 */
export const calculateRectangleArea = (startPoint, endPoint, pixelSpacing = { x: 1, y: 1 }) => {
  const width = Math.abs(endPoint.x - startPoint.x) * pixelSpacing.x;
  const height = Math.abs(endPoint.y - startPoint.y) * pixelSpacing.y;
  return width * height;
};

/**
 * 면적 계산 (원형)
 */
export const calculateCircleArea = (radius, pixelSpacing = { x: 1, y: 1 }) => {
  const radiusMM = radius * Math.min(pixelSpacing.x, pixelSpacing.y);
  return Math.PI * radiusMM * radiusMM;
};

/**
 * 각도 계산 (세 점)
 */
export const calculateAngle = (point1, point2, point3) => {
  const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
  const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };

  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  return Math.acos(dot / (magnitude1 * magnitude2)) * (180 / Math.PI);
};

/**
 * HU 값을 그레이스케일로 변환
 */
export const hounsFieldToGrayscale = (huValue, windowWidth, windowCenter) => {
  const minValue = windowCenter - windowWidth / 2;
  const maxValue = windowCenter + windowWidth / 2;
  
  if (huValue <= minValue) return 0;
  if (huValue >= maxValue) return 255;
  
  return Math.round(((huValue - minValue) / windowWidth) * 255);
};

/**
 * 윈도우 프리셋 적용
 */
export const applyWindowPreset = (presetName) => {
  const preset = WINDOW_PRESETS[presetName.toUpperCase()];
  if (!preset) {
    console.warn(`Unknown window preset: ${presetName}`);
    return null;
  }
  return preset;
};

/**
 * 좌표 정규화 (0-1 범위로)
 */
export const normalizeCoordinates = (point, imageWidth, imageHeight) => {
  return {
    x: point.x / imageWidth,
    y: point.y / imageHeight
  };
};

/**
 * 좌표 비정규화 (픽셀 좌표로)
 */
export const denormalizeCoordinates = (normalizedPoint, imageWidth, imageHeight) => {
  return {
    x: normalizedPoint.x * imageWidth,
    y: normalizedPoint.y * imageHeight
  };
};

/**
 * 바운딩 박스 검증
 */
export const validateBoundingBox = (bbox, imageWidth, imageHeight) => {
  return bbox.x >= 0 && 
         bbox.y >= 0 && 
         bbox.x + bbox.width <= imageWidth && 
         bbox.y + bbox.height <= imageHeight &&
         bbox.width > 0 && 
         bbox.height > 0;
};

/**
 * 색상 hex를 rgba로 변환
 */
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * 디바운스 함수
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 스로틀 함수
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 깊은 복사
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

/**
 * 로컬 스토리지 헬퍼
 */
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }
};

/**
 * 에러 처리 헬퍼
 */
export const handleError = (error, customMessage = null) => {
  console.error('Error occurred:', error);
  
  let message = customMessage || ERROR_MESSAGES.NETWORK_ERROR;
  
  if (error.response) {
    // API 에러
    message = error.response.data?.message || `HTTP ${error.response.status} Error`;
  } else if (error.request) {
    // 네트워크 에러
    message = ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.message) {
    // 일반 에러
    message = error.message;
  }
  
  return {
    message,
    type: 'error',
    timestamp: new Date().toISOString()
  };
};

/**
 * 이미지 ID 생성
 */
export const generateImageId = (studyInstanceUID, seriesInstanceUID, sopInstanceUID) => {
  return `wadouri:${studyInstanceUID}/${seriesInstanceUID}/${sopInstanceUID}`;
};

/**
 * 환자 ID 마스킹
 */
export const maskPatientId = (patientId, showLast = 4) => {
  if (!patientId || patientId.length <= showLast) return patientId;
  
  const masked = '*'.repeat(patientId.length - showLast);
  const visible = patientId.slice(-showLast);
  return masked + visible;
};

/**
 * 신뢰도 색상 반환
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 90) return '#22c55e'; // 초록
  if (confidence >= 70) return '#f59e0b'; // 주황
  if (confidence >= 50) return '#ef4444'; // 빨강
  return '#64748b'; // 회색
};

/**
 * 측정값 포맷팅
 */
export const formatMeasurement = (value, unit, precision = 1) => {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  
  const formatted = value.toFixed(precision);
  return `${formatted} ${unit}`;
};

/**
 * 키보드 이벤트 처리
 */
export const isValidKeyboardEvent = (event, targetKeys) => {
  if (!event || !targetKeys) return false;
  
  const key = event.key.toLowerCase();
  const targetKeyArray = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
  
  return targetKeyArray.some(targetKey => 
    key === targetKey.toLowerCase() || 
    event.code === targetKey
  );
};

/**
 * 파일 확장자 검증
 */
export const validateFileExtension = (filename, allowedExtensions) => {
  if (!filename || !allowedExtensions) return false;
  
  const extension = filename.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(extension);
};

/**
 * DICOM 태그 파싱
 */
export const parseDicomTag = (tag) => {
  if (!tag) return null;
  
  // (GGGG,EEEE) 형식에서 그룹과 엘리먼트 추출
  const match = tag.match(/\(([0-9A-Fa-f]{4}),([0-9A-Fa-f]{4})\)/);
  if (!match) return null;
  
  return {
    group: match[1],
    element: match[2],
    hex: `0x${match[1]}${match[2]}`
  };
};

/**
 * 성능 측정 헬퍼
 */
export const performanceMeasure = {
  start: (label) => {
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
    return Date.now();
  },
  
  end: (label, startTime = null) => {
    const endTime = Date.now();
    
    if (performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        console.log(`Performance [${label}]: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    
    if (startTime) {
      const duration = endTime - startTime;
      console.log(`Performance [${label}]: ${duration}ms`);
      return duration;
    }
    
    return null;
  }
};

/**
 * URL 파라미터 파싱
 */
export const parseUrlParams = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

/**
 * 클립보드에 텍스트 복사
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 폴백 방식
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * 이미지 다운로드
 */
export const downloadImage = (canvas, filename = 'image.png') => {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
    return true;
  } catch (error) {
    console.error('Failed to download image:', error);
    return false;
  }
};

/**
 * 배열 청크 분할
 */
export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * 객체 배열 정렬
 */
export const sortByKey = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * 브라우저 지원 여부 확인
 */
export const browserSupport = {
  webgl: () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (error) {
      return false;
    }
  },
  
  webWorkers: () => {
    return typeof Worker !== 'undefined';
  },
  
  fileReader: () => {
    return typeof FileReader !== 'undefined';
  },
  
  localStorage: () => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
};