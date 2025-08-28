// src/utils/api.js

// API 기본 설정
const API_BASE_URL = 'http://35.225.63.41:8000';

/**
 * API 응답을 처리하는 공통 함수
 * @param {Response} response - fetch 응답 객체
 * @returns {Object} 파싱된 JSON 데이터
 * @throws {Error} HTTP 에러 또는 파싱 에러
 */
const handleApiResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`JSON 파싱 실패: ${error.message}`);
    }
};

/**
 * 공통 fetch 옵션을 생성하는 함수
 * @param {string} method - HTTP 메서드
 * @param {Object} data - 요청 바디 데이터 (선택사항)
 * @returns {Object} fetch 옵션 객체
 */
const createFetchOptions = (method = 'GET', data = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    return options;
};

// =============================================================================
// PACS 관련 API
// =============================================================================

/**
 * PACS에서 모든 스터디 목록을 가져오는 함수
 * @returns {Promise<Object>} 스터디 목록 응답
 */
export const fetchPacsStudies = async () => {
    const response = await fetch(`${API_BASE_URL}/api/ai/pacs-studies/`);
    return handleApiResponse(response);
};

// =============================================================================
// AI 분석 관련 API  
// =============================================================================

/**
 * YOLO 모델로 AI 분석을 실행하는 함수
 * @param {string} studyUID - 스터디 UID
 * @returns {Promise<Object>} 분석 결과
 */
export const analyzeWithYOLO = async (studyUID, forceOverwrite = false) => {
    const options = createFetchOptions('POST', { 
        study_uid: studyUID,
        overwrite: forceOverwrite 
    });
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze/`, options);
    return handleApiResponse(response);
};

/**
 * SSD 모델로 AI 분석을 실행하는 함수  
 * @param {string} studyUID - 스터디 UID
 * @returns {Promise<Object>} 분석 결과
 */
export const analyzeWithSSD = async (studyUID, forceOverwrite = false) => {
    const options = createFetchOptions('POST', { 
        study_uid: studyUID,
        overwrite: forceOverwrite, 
    });
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-ssd/`, options);
    return handleApiResponse(response);
};


/**
 * 해당 스터디의 기존 분석 결과 확인
 * @param {string} studyUID - 스터디 UID  
 * @param {string} modelType - 'YOLO' or 'SSD'
 * @returns {Promise<Object>} 기존 결과 존재 여부
 */
export const checkExistingAnalysis = async (studyUID, modelType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/check/${studyUID}/${modelType}/`);
        
        if (response.status === 404) {
            return { exists: false };
        }
        
        if (!response.ok) {
            throw new Error('분석 결과 확인 실패');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        return { exists: false, error: error.message };
    }
};


/**
 * AI 분석 결과를 서버에 저장하는 함수
 * @param {string} studyUID - 스터디 UID
 * @param {Object} analysisData - 분석 결과 데이터
 * @param {boolean} overwrite - 기존 결과 덮어쓰기 여부
 * @returns {Promise<Object>} 저장 결과
 */
export const saveAnalysisResults = async (studyUID, analysisData, overwrite = false) => {
    const options = createFetchOptions('POST', {
        study_uid: studyUID,
        ...analysisData,
        overwrite: overwrite
    });
    const response = await fetch(`${API_BASE_URL}/api/ai/save/`, options);
    return handleApiResponse(response);
};


/**
 * 저장된 AI 분석 결과를 불러오는 함수
 * @param {string} studyUID - 스터디 UID  
 * @returns {Promise<Object>} 저장된 분석 결과
 */
export const loadAnalysisResults = async (studyUID) => {
    const response = await fetch(`${API_BASE_URL}/api/ai/results/${studyUID}/`);
    return handleApiResponse(response);
};

/**
 * AI 분석 결과를 삭제하는 함수
 * @param {string} studyUID - 스터디 UID
 * @returns {Promise<Object>} 삭제 결과
 */
export const clearAnalysisResults = async (studyUID) => {
    const options = createFetchOptions('DELETE');
    const response = await fetch(`${API_BASE_URL}/api/ai/clear/${studyUID}/`, options);
    return handleApiResponse(response);
};

/**
 * AI 모델 상태를 확인하는 함수
 * @returns {Promise<Object>} 모델 상태 정보
 */
export const checkModelStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/api/ai/status/`);
    return handleApiResponse(response);
};

// =============================================================================
// 어노테이션 관련 API
// =============================================================================

/**
 * 어노테이션을 서버에 저장하는 함수
 * @param {string} studyUID - 스터디 UID
 * @param {Array} annotations - 어노테이션 배열
 * @returns {Promise<Object>} 저장 결과
 */
export const saveAnnotations = async (studyUID, annotations) => {
    const requestData = {
        study_uid: studyUID,
        annotations: annotations.map(box => ({
            bbox: [box.left, box.top, box.left + box.width, box.top + box.height],
            label: box.label,
            confidence: box.confidence,
            created: box.created,
            dr_text: box.dr_text || ''
        }))
    };

    const options = createFetchOptions('POST', requestData);
    const response = await fetch(`${API_BASE_URL}/api/annotations/save/`, options);
    return handleApiResponse(response);
};

/**
 * 서버에서 어노테이션을 불러오는 함수
 * @param {string} studyUID - 스터디 UID
 * @returns {Promise<Object>} 어노테이션 데이터
 */
export const loadAnnotations = async (studyUID) => {
    const response = await fetch(`${API_BASE_URL}/api/annotations/${studyUID}/`);
    return handleApiResponse(response);
};

// =============================================================================
// 레포트 관련 API
// =============================================================================

/**
 * 레포트를 서버에 저장하는 함수
 * @param {string} studyUID - 스터디 UID
 * @param {string} patientId - 환자 ID
 * @param {string} reportContent - 레포트 내용
 * @param {string} reportStatus - 레포트 상태 (기본: 'draft')
 * @returns {Promise<Object>} 저장 결과
 */
export const saveReport = async (studyUID, patientId, reportContent, reportStatus = 'draft') => {
    const reportData = {
        study_uid: studyUID,
        patient_id: patientId,
        report_content: reportContent,
        report_status: reportStatus
    };

    const options = createFetchOptions('POST', reportData);
    const response = await fetch(`${API_BASE_URL}/api/reports/save/`, options);
    return handleApiResponse(response);
};


/**
 * 서버에서 레포트를 불러오는 함수
 * @param {string} studyUID - 스터디 UID
 * @returns {Promise<Object>} 레포트 데이터
 */
export const loadReport = async (studyUID) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reports/${studyUID}/`);
        
        if (response.status === 404) {
            return { 
                status: 'no_reports', 
                message: '불러올 레포트가 없습니다' 
            };
        }
        
        if (!response.ok) {
            return { 
                status: 'error', 
                message: `레포트 불러오기 실패 (${response.status})` 
            };
        }
        
        return handleApiResponse(response);
    } catch (error) {
        return { 
            status: 'error', 
            message: '네트워크 오류: ' + error.message 
        };
    }
};

/**
 * 서버에서 레포트를 삭제하는 함수
 * @param {string} studyUID - 스터디 UID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteReport = async (studyUID) => {
    try {
        const options = createFetchOptions('DELETE');
        const response = await fetch(`${API_BASE_URL}/api/reports/${studyUID}/delete/`, options);
        
        if (response.status === 404) {
            return { 
                status: 'no_reports', 
                message: '삭제할 레포트가 없습니다' 
            };
        }
        
        if (!response.ok) {
            return { 
                status: 'error', 
                message: `레포트 삭제 실패 (${response.status})` 
            };
        }
        
        return handleApiResponse(response);
    } catch (error) {
        return { 
            status: 'error', 
            message: '네트워크 오류: ' + error.message 
        };
    }
};

/**
 * 레포트 상태를 업데이트하는 함수
 * @param {string} studyUID - 스터디 UID
 * @param {string} status - 새로운 상태 ('draft', 'completed', 'approved')
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateReportStatus = async (studyUID, status) => {
    try {
        const options = createFetchOptions('PATCH', { report_status: status });
        const response = await fetch(`${API_BASE_URL}/api/reports/${studyUID}/status/`, options);
        
        if (response.status === 404) {
            return { 
                status: 'no_reports', 
                message: '업데이트할 레포트가 없습니다' 
            };
        }
        
        if (!response.ok) {
            return { 
                status: 'error', 
                message: `상태 업데이트 실패 (${response.status})` 
            };
        }
        
        return handleApiResponse(response);
    } catch (error) {
        return { 
            status: 'error', 
            message: '네트워크 오류: ' + error.message 
        };
    }
};


// =============================================================================
// 에러 처리 헬퍼 함수들
// =============================================================================

/**
 * API 에러를 사용자 친화적인 메시지로 변환하는 함수
 * @param {Error} error - 발생한 에러
 * @param {string} operation - 수행하려던 작업명
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const getErrorMessage = (error, operation = '작업') => {
    if (error.message.includes('fetch')) {
        return `서버 연결 실패: ${operation} 중 네트워크 오류가 발생했습니다.`;
    }
    
    if (error.message.includes('HTTP 404')) {
        return `데이터를 찾을 수 없습니다: ${operation} 대상이 존재하지 않습니다.`;
    }
    
    if (error.message.includes('HTTP 500')) {
        return `서버 오류: ${operation} 중 서버에서 문제가 발생했습니다.`;
    }
    
    if (error.message.includes('JSON 파싱')) {
        return `데이터 처리 오류: ${operation} 응답을 해석할 수 없습니다.`;
    }
    
    return `${operation} 실패: ${error.message}`;
};

/**
 * API 호출을 재시도하는 함수
 * @param {Function} apiCall - 재시도할 API 호출 함수
 * @param {number} maxRetries - 최대 재시도 횟수 (기본: 3)
 * @param {number} delay - 재시도 간격 (밀리초, 기본: 1000)
 * @returns {Promise<any>} API 호출 결과
 */
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            console.warn(`API 호출 실패 (${attempt}/${maxRetries}):`, error.message);
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
};

// =============================================================================
// 설정
// =============================================================================

/**
 * API 기본 URL을 변경하는 함수 (테스트용)
 * @param {string} newBaseUrl - 새로운 기본 URL
 */
export const setApiBaseUrl = (newBaseUrl) => {
    // 개발/테스트 환경에서만 사용
    if (process.env.NODE_ENV !== 'production') {
        console.log(`API Base URL을 ${newBaseUrl}로 변경 시도했지만, 런타임에서는 변경할 수 없습니다.`);
    }
};