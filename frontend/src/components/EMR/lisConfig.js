// src/components/EMR/lisConfig.js

// 검사 패널별 항목 리스트
export const panelComponents = {
  CBC: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'Platelets'],
  LFT: ['ALT', 'AST', 'ALP', 'GGT', 'Total Bilirubin', 'Direct Bilirubin', 'Albumin', 'Total Protein'],
  RFT: ['BUN', 'Creatinine', 'eGFR', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride'],
  'Lipid Panel': ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides'],
  'Electrolyte Panel': ['Sodium', 'Potassium', 'Chloride', 'Bicarbonate'],
  'Thyroid Panel': ['TSH', 'Free T4', 'T3'],
  'Coagulation Panel': ['PT', 'INR', 'aPTT', 'Fibrinogen'],
  Glucose: ['Fasting Blood Glucose', 'HbA1c'],
};

// 🔥 수정된 LIS API 엔드포인트 - 기존 백엔드 구조에 맞춤
export const LIS_API = {
  // 기존 orders 엔드포인트 사용 (검사 요청은 주문의 일종)
  CREATE_ORDER: 'api/orders/',          // POST: 새 검사 주문 생성
  LIST_ORDERS: 'api/orders/',           // GET: 주문 목록 조회
  ORDER_DETAIL: (id) => `api/orders/${id}/`,  // GET: 특정 주문 상세

  // 샘플 관련 엔드포인트 (이미 존재)
  CREATE_SAMPLE: 'api/samples/create',  // POST: 샘플 생성
  LIST_SAMPLES: 'api/samples/',         // GET: 샘플 목록
  SAMPLE_DETAIL: (id) => `api/samples/${id}/`,  // GET: 샘플 상세

  // 테스트 관련 엔드포인트 (이미 존재)  
  LIST_TESTS: 'api/tests/',             // GET: 테스트 목록
  TEST_DETAIL: (id) => `api/tests/${id}/`,      // GET: 테스트 상세
  
  // 통합 로그 엔드포인트 (이미 존재)
  LOGS: 'api/logs/',                    // GET/POST: 로그 관련
  
  // 기타 유틸리티
  ALIAS_MAPPING: 'api/samples/alias-mapping',    // GET: 별칭 매핑
  TEST_TYPES: 'api/samples/test-types-by-alias/', // GET: 테스트 타입 목록
  LOINC_MAPPING: 'api/samples/loinc-by-sample-type', // GET: LOINC 코드 매핑
};

// 🔥 기본 의사 정보 (EmrMainPage에서 사용)
export const DEFAULT_DOCTOR_ID = 'DR001';
export const DEFAULT_DOCTOR_NAME = 'System User';

// 🔥 환경 변수에서 API Base URL 가져오기
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || 'http://35.225.63.41:8000';

// 🔥 완전한 URL을 생성하는 헬퍼 함수
export const getFullApiUrl = (endpoint) => {
  // endpoint가 이미 'api/'로 시작하면 BASE_URL과 결합
  if (endpoint.startsWith('api/')) {
    return `${API_BASE_URL}/${endpoint}`;
  }
  // 그렇지 않으면 api/ 접두사 추가
  return `${API_BASE_URL}/api/${endpoint}`;
};

// 🔥 OpenMRS 통합을 위한 검사 패널 매핑
export const panelToOrderMapping = {
  CBC: {
    orderType: 'LAB',
    category: 'HEMATOLOGY',
    urgency: 'ROUTINE',
    instructions: 'Complete Blood Count 검사',
  },
  LFT: {
    orderType: 'LAB', 
    category: 'CHEMISTRY',
    urgency: 'ROUTINE',
    instructions: 'Liver Function Test 검사',
  },
  RFT: {
    orderType: 'LAB',
    category: 'CHEMISTRY', 
    urgency: 'ROUTINE',
    instructions: 'Renal Function Test 검사',
  },
  'Lipid Panel': {
    orderType: 'LAB',
    category: 'CHEMISTRY',
    urgency: 'ROUTINE',
    instructions: 'Lipid Profile 검사',
  },
  'Electrolyte Panel': {
    orderType: 'LAB',
    category: 'CHEMISTRY',
    urgency: 'ROUTINE', 
    instructions: 'Electrolyte Panel 검사',
  },
  'Thyroid Panel': {
    orderType: 'LAB',
    category: 'ENDOCRINOLOGY',
    urgency: 'ROUTINE',
    instructions: 'Thyroid Function Test 검사',
  },
  'Coagulation Panel': {
    orderType: 'LAB',
    category: 'HEMATOLOGY',
    urgency: 'ROUTINE',
    instructions: 'Coagulation Studies 검사',
  },
  Glucose: {
    orderType: 'LAB',
    category: 'CHEMISTRY',
    urgency: 'ROUTINE',
    instructions: 'Glucose and HbA1c 검사',
  },
};

// 🔥 우선순위 매핑
export const PRIORITY_LEVELS = {
  STAT: {
    value: 'STAT',
    label: '즉시',
    color: '#dc3545',
    description: '응급 검사'
  },
  URGENT: {
    value: 'URGENT', 
    label: '긴급',
    color: '#fd7e14',
    description: '24시간 내 결과 필요'
  },
  ROUTINE: {
    value: 'ROUTINE',
    label: '일반',
    color: '#28a745', 
    description: '일반적인 검사'
  },
  TIMED: {
    value: 'TIMED',
    label: '예약',
    color: '#6f42c1',
    description: '특정 시간에 검사'
  }
};

// 🔥 샘플 타입 매핑
export const SAMPLE_TYPES = {
  BLOOD: {
    value: 'BLOOD',
    label: '혈액',
    description: '정맥혈/동맥혈',
    color: '#dc3545'
  },
  SERUM: {
    value: 'SERUM', 
    label: '혈청',
    description: '혈청 분리',
    color: '#fd7e14'
  },
  PLASMA: {
    value: 'PLASMA',
    label: '혈장',
    description: '혈장 분리',
    color: '#ffc107'
  },
  URINE: {
    value: 'URINE',
    label: '소변',
    description: '요검체',
    color: '#28a745'
  },
  STOOL: {
    value: 'STOOL',
    label: '대변', 
    description: '분변검체',
    color: '#6c757d'
  },
  CSF: {
    value: 'CSF',
    label: '뇌척수액',
    description: 'Cerebrospinal Fluid',
    color: '#17a2b8'
  },
  OTHER: {
    value: 'OTHER',
    label: '기타',
    description: '기타 검체',
    color: '#6f42c1'
  }
};

// 🔥 검사 상태 매핑  
export const TEST_STATUS = {
  ORDERED: {
    value: 'ORDERED',
    label: '주문됨',
    color: '#6c757d',
    description: '검사 주문 완료'
  },
  COLLECTED: {
    value: 'COLLECTED', 
    label: '채취됨',
    color: '#fd7e14',
    description: '검체 채취 완료'
  },
  PROCESSING: {
    value: 'PROCESSING',
    label: '검사중',
    color: '#ffc107',
    description: '검사 진행중'
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: '완료',
    color: '#28a745', 
    description: '검사 완료'
  },
  REPORTED: {
    value: 'REPORTED',
    label: '보고됨',
    color: '#17a2b8',
    description: '결과 보고 완료'
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: '취소됨',
    color: '#dc3545',
    description: '검사 취소'
  }
};