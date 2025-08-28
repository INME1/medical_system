// pacsapp/src/utils/pacsdocs/documentTypes.js

/**
 * 파일명용 문서 이름 (언더스코어 사용, 띄어쓰기 없음)
 */
export const DOC_NAMES = {
  'consent_contrast': '조영제_사용_동의서',
  'report_kor': '판독결과지_국문',
  'report_eng': '판독결과지_영문',
  'export_certificate': '반출확인서',
  'exam_certificate': '검사확인서',
  'consultation_request': '협진의뢰서',
  'medical_record_access_consent': '진료기록_열람_동의서',
  'medical_record_access_proxy': '진료기록_열람_위임장',
  'imaging_cd': '진료기록영상_CD',
  'imaging_dvd': '진료기록영상_DVD'
};

/**
 * 화면 표시용 문서 이름 (사용자에게 보여지는 이름)
 */
export const DOC_DISPLAY_NAMES = {
  'consent_contrast': '조영제 사용 동의서',
  'report_kor': '판독 결과지 (국문)',
  'report_eng': '판독 결과지 (영문)',
  'export_certificate': '반출 확인서',
  'exam_certificate': '검사 확인서',
  'consultation_request': '협진 의뢰서',
  'medical_record_access_consent': '진료기록 열람 동의서',
  'medical_record_access_proxy': '진료기록 열람 위임장',
  'imaging_cd': '진료기록영상 (CD)',
  'imaging_dvd': '진료기록영상 (DVD)'
};

/**
 * 문서 타입별 설명
 */
export const DOC_DESCRIPTIONS = {
  'consent_contrast': '조영제 사용에 대한 환자 동의서',
  'report_kor': '검사 결과에 대한 국문 판독 보고서',
  'report_eng': '검사 결과에 대한 영문 판독 보고서',
  'export_certificate': '진료기록 및 영상 반출을 위한 확인서',
  'exam_certificate': '검사 시행을 확인하는 증명서',
  'consultation_request': '다른 과와의 협진을 위한 의뢰서',
  'medical_record_access_consent': '진료기록 열람에 대한 동의서',
  'medical_record_access_proxy': '진료기록 열람을 위한 위임장',
  'imaging_cd': 'DICOM 영상을 CD 미디어로 제공',
  'imaging_dvd': 'DICOM 영상을 DVD 미디어로 제공'
};

/**
 * 서명이 필요한 문서 타입들
 */
export const SIGNATURE_REQUIRED_DOCS = [
  'consent_contrast',
  'export_certificate',
  'medical_record_access_consent',
  'medical_record_access_proxy'
];

/**
 * 문서 타입별 카테고리
 */
export const DOC_CATEGORIES = {
  CONSENT: 'consent',      // 동의서류
  REPORT: 'report',        // 판독보고서
  CERTIFICATE: 'certificate', // 확인서/증명서
  IMAGING: 'imaging'       // 영상매체
};

/**
 * 문서 타입과 카테고리 매핑
 */
export const DOC_TYPE_CATEGORIES = {
  'consent_contrast': DOC_CATEGORIES.CONSENT,
  'medical_record_access_consent': DOC_CATEGORIES.CONSENT,
  'medical_record_access_proxy': DOC_CATEGORIES.CONSENT,
  'report_kor': DOC_CATEGORIES.REPORT,
  'report_eng': DOC_CATEGORIES.REPORT,
  'export_certificate': DOC_CATEGORIES.CERTIFICATE,
  'exam_certificate': DOC_CATEGORIES.CERTIFICATE,
  'consultation_request': DOC_CATEGORIES.CERTIFICATE,
  'imaging_cd': DOC_CATEGORIES.IMAGING,
  'imaging_dvd': DOC_CATEGORIES.IMAGING
};

/**
 * 문서 타입이 서명을 필요로 하는지 확인
 * @param {string} docType - 문서 타입 코드
 * @returns {boolean} 서명 필요 여부
 */
export const requiresSignature = (docType) => {
  return SIGNATURE_REQUIRED_DOCS.includes(docType);
};

/**
 * 문서 타입의 카테고리 반환
 * @param {string} docType - 문서 타입 코드
 * @returns {string} 카테고리
 */
export const getDocumentCategory = (docType) => {
  return DOC_TYPE_CATEGORIES[docType] || 'unknown';
};

/**
 * 파일명 생성 (환자명 + 문서명 + 날짜)
 * @param {string} patientName - 환자명
 * @param {string} docType - 문서 타입
 * @param {Date} date - 날짜 (선택적, 기본값: 오늘)
 * @returns {string} 생성된 파일명
 */
export const generateFileName = (patientName, docType, date = new Date()) => {
  const docName = DOC_NAMES[docType] || '문서';
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  const cleanPatientName = patientName.replace(/[^가-힣a-zA-Z0-9]/g, ''); // 특수문자 제거
  
  return `${cleanPatientName}_${docName}_${dateStr}.pdf`;
};

/**
 * 모달리티별 기본 필요 문서 반환
 * @param {string} modality - 검사 모달리티 (CT, MR, XR 등)
 * @returns {Array} 필요한 문서 타입 배열
 */
export const getDefaultDocumentsByModality = (modality) => {
  const contrastModalities = ['CT', 'MR', 'XA', 'NM', 'PT'];
  const baseDocuments = ['report_kor', 'imaging_cd', 'export_certificate'];
  
  if (contrastModalities.includes(modality)) {
    return ['consent_contrast', ...baseDocuments];
  }
  
  return baseDocuments;
};