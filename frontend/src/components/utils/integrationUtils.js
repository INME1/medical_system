// src/utils/integrationUtils.js
// OpenMRS와 Orthanc PACS 통합을 위한 공용 유틸리티 함수들

/**
 * 날짜 형식 변환 함수
 * OpenMRS와 Orthanc에서 사용하는 다양한 날짜 형식을 표준 형식으로 변환
 */
export const formatBirthDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    // 'YYYY-MM-DDTHH:mm:ss.sssZ' 또는 'YYYY-MM-DD' 형식을 'YYYY-MM-DD'로 변환
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.warn('유효하지 않은 날짜 형식:', dateString);
      return '';
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
  } catch (error) {
    console.warn('날짜 변환 실패:', dateString, error);
    return '';
  }
};

/**
 * DICOM 날짜 형식으로 변환 (YYYYMMDD)
 * Orthanc PACS에서 사용하는 DICOM 표준 날짜 형식
 */
export const formatDicomDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  } catch (error) {
    console.warn('DICOM 날짜 변환 실패:', dateString, error);
    return '';
  }
};

/**
 * 나이 계산 함수
 * 생년월일로부터 현재 나이를 계산
 */
export const calculateAge = (birthdate) => {
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

/**
 * OpenMRS 환자 데이터 정규화
 * OpenMRS API에서 받은 환자 데이터를 표준 형식으로 변환
 */
export const normalizeOpenMRSPatient = (patient) => {
  if (!patient) return null;
  
  return {
    uuid: patient.uuid,
    identifier: patient.identifiers?.[0]?.identifier || '',
    name: patient.display || patient.person?.display || '',
    givenName: patient.person?.preferredName?.givenName || '',
    familyName: patient.person?.preferredName?.familyName || '',
    birthdate: patient.person?.birthdate || '',
    gender: patient.person?.gender || '',
    age: calculateAge(patient.person?.birthdate),
    // 추가 정보
    addresses: patient.person?.addresses || [],
    attributes: patient.person?.attributes || [],
    // 원본 데이터 유지
    originalData: patient
  };
};

/**
 * PACS 검사 요청 데이터 생성
 * OpenMRS 환자 정보를 Orthanc PACS 형식으로 변환
 */
export const createPACSStudyRequest = (patient, studyInfo) => {
  const normalizedPatient = normalizeOpenMRSPatient(patient);
  
  return {
    // Patient 정보 (DICOM Patient Module)
    PatientID: normalizedPatient.identifier,
    PatientName: normalizedPatient.name,
    PatientBirthDate: formatDicomDate(normalizedPatient.birthdate),
    PatientSex: normalizedPatient.gender?.toUpperCase() || 'O',
    
    // Study 정보 (DICOM Study Module)
    StudyDate: formatDicomDate(studyInfo.studyDate || new Date().toISOString()),
    StudyTime: new Date().toTimeString().split(' ')[0].replace(/:/g, ''),
    StudyDescription: studyInfo.studyDescription || '',
    Modality: studyInfo.modality || '',
    BodyPartExamined: studyInfo.bodyPart || '',
    
    // 추가 메타데이터
    ReferringPhysicianName: studyInfo.referringPhysician || '',
    StudyInstanceUID: studyInfo.studyInstanceUID || generateUID(),
    AccessionNumber: studyInfo.accessionNumber || generateAccessionNumber(),
    
    // 우선순위 및 임상 정보
    Priority: studyInfo.priority || 'ROUTINE',
    ClinicalInfo: studyInfo.clinicalInfo || '',
    
    // 시스템 정보
    RequestingSystem: 'CDSS-EMR',
    Timestamp: new Date().toISOString()
  };
};

/**
 * LIS 검사 요청 데이터 생성
 * OpenMRS 환자 정보를 LIS 형식으로 변환
 */
export const createLISLabRequest = (patient, labInfo) => {
  const normalizedPatient = normalizeOpenMRSPatient(patient);
  
  return {
    // 환자 정보
    patient_id: normalizedPatient.identifier,
    patient_name: normalizedPatient.name,
    birth_date: formatBirthDate(normalizedPatient.birthdate),
    sex: normalizedPatient.gender?.toUpperCase() || 'U',
    age: normalizedPatient.age,
    
    // 검사 정보
    test_panel: labInfo.panel,
    test_codes: labInfo.tests || [],
    specimen_type: labInfo.specimenType || 'BLOOD',
    collection_date: formatBirthDate(labInfo.collectionDate || new Date().toISOString()),
    
    // 의뢰 정보
    ordering_physician: labInfo.orderingPhysician || 'System User',
    clinical_info: labInfo.clinicalInfo || '',
    priority: labInfo.priority || 'ROUTINE',
    
    // 시스템 정보
    order_number: generateOrderNumber(),
    requesting_system: 'CDSS-EMR',
    created_at: new Date().toISOString()
  };
};

/**
 * 성별 표시 변환
 * 다양한 성별 코드를 한국어로 변환
 */
export const getGenderDisplay = (gender) => {
  if (!gender) return '미상';
  
  const genderMap = {
    'M': '남성',
    'F': '여성',
    'O': '기타',
    'U': '미상',
    'MALE': '남성',
    'FEMALE': '여성',
    'OTHER': '기타',
    'UNKNOWN': '미상'
  };
  
  return genderMap[gender.toUpperCase()] || '미상';
};

/**
 * 우선순위 표시 변환
 */
export const getPriorityDisplay = (priority) => {
  if (!priority) return '일반';
  
  const priorityMap = {
    'ROUTINE': '일반',
    'URGENT': '응급',
    'STAT': '즉시',
    'ASAP': '가능한 빨리'
  };
  
  return priorityMap[priority.toUpperCase()] || '일반';
};

/**
 * 고유 UID 생성 (DICOM용)
 */
export const generateUID = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `1.2.840.10008.${timestamp}.${random}`;
};

/**
 * 접수번호 생성
 */
export const generateAccessionNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `ACC${year}${month}${day}${random}`;
};

/**
 * 오더번호 생성
 */
export const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `ORD${year}${month}${day}${hour}${minute}${random}`;
};

/**
 * API 에러 핸들링
 */
export const handleAPIError = (error, context = '') => {
  console.error(`${context} API 에러:`, error);
  
  if (error.response) {
    // 서버에서 응답을 받았지만 에러 상태코드
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.detail || error.message;
    
    switch (status) {
      case 400:
        return `잘못된 요청: ${message}`;
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
    // 요청을 보냈지만 응답을 받지 못함
    return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  } else {
    // 요청 설정 중 에러 발생
    return `요청 오류: ${error.message}`;
  }
};

/**
 * 로그 저장 유틸리티
 */
export const saveIntegrationLog = async (action, data, result = null, error = null) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      data: JSON.stringify(data),
      result: result ? JSON.stringify(result) : null,
      error: error ? error.toString() : null,
      system: 'CDSS-Integration'
    };
    
    // 실제 환경에서는 로그 API 호출
    console.log('Integration Log:', logEntry);
    
    // localStorage에 임시 저장 (개발용)
    const logs = JSON.parse(localStorage.getItem('integration_logs') || '[]');
    logs.push(logEntry);
    
    // 최근 1000개만 유지
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    localStorage.setItem('integration_logs', JSON.stringify(logs));
    
  } catch (err) {
    console.error('로그 저장 실패:', err);
  }
};

/**
 * 환자 검색 필터링
 */
export const filterPatients = (patients, searchTerm) => {
  if (!searchTerm) return patients;
  
  const term = searchTerm.toLowerCase();
  
  return patients.filter(patient => {
    const normalized = normalizeOpenMRSPatient(patient);
    
    return (
      normalized.name.toLowerCase().includes(term) ||
      normalized.identifier.toLowerCase().includes(term) ||
      normalized.givenName.toLowerCase().includes(term) ||
      normalized.familyName.toLowerCase().includes(term)
    );
  });
};

/**
 * 데이터 유효성 검증
 */
export const validatePatientData = (patient) => {
  const errors = [];
  
  if (!patient.name && !patient.givenName) {
    errors.push('환자 이름이 필요합니다.');
  }
  
  if (!patient.identifier) {
    errors.push('환자 식별번호가 필요합니다.');
  }
  
  if (!patient.birthdate) {
    errors.push('생년월일이 필요합니다.');
  }
  
  if (!patient.gender) {
    errors.push('성별 정보가 필요합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};