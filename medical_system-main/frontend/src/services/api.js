// frontend/src/services/api.js에 추가할 함수들

// 기존 API_BASE_URL 사용
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * 완료된 검사 목록 조회 (DMViewer용)
 */
export const getCompletedStudies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklists/completed/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('완료된 검사 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 환자의 완료된 검사 이력 조회
 */
export const getCompletedStudiesByPatient = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklists/completed/patient/${patientId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`환자 ${patientId} 검사 이력 조회 오류:`, error);
    throw error;
  }
};

/**
 * 특정 Study의 상세 정보 조회 (DMViewer에서 클릭시)
 */
export const getStudyDetailForViewer = async (studyUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklists/viewer/${studyUid}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Study ${studyUid} 상세 정보 조회 오류:`, error);
    throw error;
  }
};

/**
 * Orthanc에서 DICOM 이미지 정보 조회
 */
export const getDicomImagesFromOrthanc = async (studyUid) => {
  try {
    // Django backend를 통해 Orthanc API 호출
    const response = await fetch(`${API_BASE_URL}/api/orthanc/studies/${studyUid}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Study ${studyUid} DICOM 이미지 조회 오류:`, error);
    throw error;
  }
};

/**
 * Orthanc에서 스터디의 시리즈 목록 조회
 */
export const getStudySeries = async (studyUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orthanc/studies/${studyUid}/series/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Study ${studyUid} 시리즈 조회 오류:`, error);
    throw error;
  }
};

/**
 * Orthanc에서 시리즈의 인스턴스 목록 조회
 */
export const getSeriesInstances = async (seriesUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orthanc/series/${seriesUid}/instances/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Series ${seriesUid} 인스턴스 조회 오류:`, error);
    throw error;
  }
};

/**
 * 특정 Study의 어노테이션 정보 조회
 */
export const getAnnotationsForStudy = async (studyUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dr-annotations/${studyUid}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 404는 어노테이션이 없다는 의미이므로 빈 배열 반환
      if (response.status === 404) {
        return { status: 'success', data: [] };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Study ${studyUid} 어노테이션 조회 오류:`, error);
    // 어노테이션 조회 실패시에도 빈 배열 반환 (선택적 기능이므로)
    return { status: 'error', data: [] };
  }
};

/**
 * 특정 인스턴스의 어노테이션 조회
 */
export const getAnnotationsForInstance = async (sopInstanceUID) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dr-annotations/instance/${sopInstanceUID}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'success', data: [] };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Instance ${sopInstanceUID} 어노테이션 조회 오류:`, error);
    return { status: 'error', data: [] };
  }
};

/**
 * 리포트 조회
 */
export const getReportForStudy = async (studyUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/${studyUid}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'success', report: null };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Study ${studyUid} 리포트 조회 오류:`, error);
    throw error;
  }
};