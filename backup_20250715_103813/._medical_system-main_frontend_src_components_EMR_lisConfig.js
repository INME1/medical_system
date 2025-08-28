// frontend/src/components/EMR/lisConfig.js (수정된 버전)

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

// 🔥 수정된 LIS API 엔드포인트 - URL 중복 제거
export const LIS_API = {
  // 검사 주문 관련 엔드포인트 (orders_emr 앱)
  CREATE_ORDER: 'orders/',                    // POST: 새 검사 주문 생성
  LIST_ORDERS: 'orders/',                     // GET: 주문 목록 조회
  ORDER_DETAIL: (id) => `orders/${id}/`,     // GET: 특정 주문 상세
  UPDATE_ORDER_STATUS: (id) => `orders/${id}/status/`, // PATCH: 주문 상태 업데이트
  
  // 검색 및 필터링
  SEARCH_ORDERS: 'orders/search/',           // GET: 주문 검색
  ORDERS_BY_PATIENT: (patientId) => `orders/by-patient/${patientId}/`, // GET: 환자별 주문
  PENDING_ORDERS: 'orders/pending/',         // GET: 대기중 주문들
  ORDER_STATISTICS: 'orders/stats/',         // GET: 주문 통계
  
  // 검사 패널 관련
  AVAILABLE_PANELS: 'orders/panels/',        // GET: 사용 가능한 패널들
  PANEL_COMPONENTS: (panelName) => `orders/panels/${panelName}/components/`, // GET: 패널 구성요소
  
  // 배치 작업
  BULK_CREATE_ORDERS: 'orders/bulk-create/', // POST: 대량 주문 생성
  BULK_UPDATE_STATUS: 'orders/bulk-update/', // POST: 대량 상태 업데이트
  
  // 통합 로그
  INTEGRATION_LOGS: 'orders/logs/',          // GET: 통합 로그 조회
  CREATE_LOG: 'orders/logs/create/',         // POST: 로그 생성

  // 샘플 관련 엔드포인트 (기존 samples 앱 사용)
  CREATE_SAMPLE: 'samples/create',           // POST: 샘플 생성
  LIST_SAMPLES: 'samples/',                  // GET: 샘플 목록
  SAMPLE_DETAIL: (id) => `samples/${id}/`,  // GET: 샘플 상세

  // 테스트 관련 엔드포인트 (기존 tests 앱 사용)
  LIST_TESTS: 'tests/',                      // GET: 테스트 목록
  TEST_DETAIL: (id) => `tests/${id}/`,      // GET: 테스트 상세
  
  // 기타 유틸리티
  ALIAS_MAPPING: 'samples/alias-mapping',                    // GET: 별칭 매핑
  TEST_TYPES: 'samples/test-types-by-alias/',               // GET: 테스트 타입 목록
  LOINC_MAPPING: 'samples/loinc-by-sample-type',           // GET: LOINC 코드 매핑
};

// 🔥 API URL 생성 헬퍼 함수 - URL 중복 제거
export const getFullApiUrl = (endpoint) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/';
  
  // 이미 'api/'가 포함된 경우 중복 제거
  if (endpoint.startsWith('api/')) {
    return `${baseUrl.replace('/api/', '/')}${endpoint}`;
  }
  
  // baseUrl이 이미 'api/'로 끝나는지 확인
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  return `${cleanBaseUrl}${endpoint}`;
};

// 🔥 기본 의사 정보
export const DEFAULT_DOCTOR_ID = 'DR001';
export const DEFAULT_DOCTOR_NAME = 'System User';

// 🔥 환자 데이터 정규화 함수 - 다양한 데이터 소스 지원
export const normalizeOpenMRSPatient = (patient) => {
  if (!patient) return null;
  
  // 🔥 다양한 identifier 소스들을 체크
  const getIdentifier = (patient) => {
    // 1. patient_identifier 필드 (가장 우선)
    if (patient.patient_identifier) return patient.patient_identifier;
    
    // 2. identifiers 배열에서 추출
    if (patient.identifiers && Array.isArray(patient.identifiers) && patient.identifiers.length > 0) {
      return patient.identifiers[0].identifier;
    }
    
    // 3. 기본 identifier 필드
    if (patient.identifier) return patient.identifier;
    
    // 4. uuid를 식별자로 사용
    if (patient.uuid) return patient.uuid;
    
    // 5. 기타 ID 필드들
    if (patient.patient_id) return patient.patient_id;
    if (patient.id) return patient.id;
    
    return null;
  };

  // 🔥 다양한 이름 소스들을 체크
  const getName = (patient) => {
    // 1. display 필드 (가장 우선)
    if (patient.display) return patient.display;
    
    // 2. name 필드
    if (patient.name) return patient.name;
    
    // 3. person.display
    if (patient.person?.display) return patient.person.display;
    
    // 4. 기타 이름 필드들
    if (patient.patient_name) return patient.patient_name;
    
    return 'Unknown Patient';
  };

  // OpenMRS 환자 데이터 구조에 맞춘 정규화
  return {
    uuid: patient.uuid || patient.patient_id || patient.id,
    identifier: getIdentifier(patient),
    name: getName(patient),
    gender: patient.person?.gender || patient.gender || 'Unknown',
    birthdate: patient.person?.birthdate || patient.birthdate || null,
    age: patient.person?.age || patient.age || calculateAge(patient.person?.birthdate || patient.birthdate)
  };
};

// 🔥 나이 계산 헬퍼 함수
const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  
  try {
    const birth = new Date(birthdate);
    const today = new Date();
    
    if (isNaN(birth.getTime())) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.warn('나이 계산 실패:', birthdate, error);
    return null;
  }
};

// 🔥 환자 데이터 유효성 검증 - 더 관대한 검증
export const validatePatientData = (patient) => {
  const errors = [];
  
  if (!patient) {
    errors.push('환자 정보가 없습니다');
    return { isValid: false, errors };
  }
  
  // 🔥 identifier 검증 완화 - 다양한 ID 필드 허용
  if (!patient.identifier && !patient.uuid) {
    errors.push('환자 식별자가 없습니다');
  }
  
  // 🔥 이름 검증 완화 - 다양한 이름 필드 허용
  if (!patient.name || patient.name === 'Unknown Patient') {
    // 경고만 하고 통과시킴
    console.warn('환자 이름이 설정되지 않았습니다:', patient);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 🔥 에러 메시지 헬퍼
export const getErrorMessage = (error) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.response.statusText;
    
    switch (status) {
      case 400:
        return '잘못된 요청입니다. 입력 정보를 확인해주세요.';
      case 401:
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 500:
        return '서버 내부 오류가 발생했습니다.';
      default:
        return `서버 오류 (${status}): ${message}`;
    }
  } else if (error.request) {
    return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  } else {
    return `요청 오류: ${error.message}`;
  }
};

// 🔥 로그 레벨 정의
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning', 
  ERROR: 'error',
  SUCCESS: 'success'
};

// 🔥 통합 로그 저장 헬퍼
export const saveIntegrationLog = async (action, data, result = null, error = null, level = LOG_LEVELS.INFO) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      result: result ? JSON.stringify(result) : null,
      error: error ? error.toString() : null,
      level,
      system: 'CDSS-Integration'
    };
    
    console.log(`[${level.toUpperCase()}] Integration Log:`, logEntry);
    
    // 선택적으로 백엔드에 로그 전송
    // const apiUrl = getFullApiUrl(LIS_API.CREATE_LOG);
    // await axios.post(apiUrl, logEntry);
    
    return logEntry;
  } catch (err) {
    console.error('로그 저장 실패:', err);
    return null;
  }
};