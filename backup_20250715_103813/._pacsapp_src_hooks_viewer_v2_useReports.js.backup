// // /home/medical_system/pacsapp/src/hooks/viewer_v2/useReports.js

// import { useState, useCallback, useEffect } from 'react';

// /**
//  * 레포트 관련 상태와 로직을 관리하는 커스텀 훅
//  * @param {string} currentStudyUID - 현재 선택된 스터디 UID
//  * @param {Function} getPatientInfo - 환자 정보를 가져오는 함수
//  */
// const useReports = (currentStudyUID, getPatientInfo) => {
//   // 상태 관리
//   const [reportContent, setReportContent] = useState('');
//   const [reportStatus, setReportStatus] = useState('draft');
//   const [isLoading, setIsLoading] = useState(false);
//   const [reportList, setReportList] = useState([]);
//   const [currentReport, setCurrentReport] = useState(null);

//   // 🔥 환자 정보 가져오기 함수
//   const getPatientInfoSafe = useCallback(() => {
//     try {
//       if (typeof getPatientInfo === 'function') {
//         return getPatientInfo();
//       }
//       return {
//         patient_id: 'Unknown',
//         patient_name: 'Unknown',
//         study_date: 'Unknown'
//       };
//     } catch (error) {
//       console.error('환자 정보 가져오기 실패:', error);
//       return {
//         patient_id: 'Unknown',
//         patient_name: 'Unknown', 
//         study_date: 'Unknown'
//       };
//     }
//   }, [getPatientInfo]);

//   // 🚀 API 응답 처리 함수 (공통)
//   const handleApiResponse = async (response, operation) => {
//     console.log(`🔍 ${operation} - 응답 상태:`, response.status);
    
//     if (!response.ok) {
//       console.error(`❌ ${operation} - HTTP 에러:`, response.status, response.statusText);
//       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     }

//     const contentType = response.headers.get('content-type');
//     if (!contentType || !contentType.includes('application/json')) {
//       const text = await response.text();
//       console.error(`❌ ${operation} - JSON이 아닌 응답:`, text);
//       throw new Error('서버에서 올바른 JSON 응답을 받지 못했습니다.');
//     }

//     const result = await response.json();
//     console.log(`🔍 ${operation} - 응답 데이터:`, result);
//     return result;
//   };

//   // 🔥 레포트 저장 함수 (새로 생성)
//   const saveReportToServer = useCallback(async (reportData) => {
//     if (!currentStudyUID) {
//       console.error('Study UID가 없습니다.');
//       return { success: false, error: 'Study UID가 없습니다.' };
//     }

//     setIsLoading(true);
    
//     try {
//       const patientInfo = getPatientInfoSafe();
      
//       const requestData = {
//         study_uid: currentStudyUID,
//         report_content: reportData.content || reportContent,
//         report_status: reportData.status || reportStatus,
//       };

//       console.log('📤 레포트 저장 요청:', requestData);

//       const response = await fetch('http://35.225.63.41:8000/api/reports/save/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestData),
//       });

//       const result = await handleApiResponse(response, '레포트 저장');

//       // 🚀 Django 응답 구조에 유연하게 대응
//       if (result.status === 'success' || response.ok) {
//         console.log('✅ 레포트 저장 성공:', result);
        
//         // 로컬 상태 업데이트
//         setReportContent(requestData.report_content);
//         setReportStatus(requestData.report_status);
//         setCurrentReport(result.data || result.report || result);
        
//         // 레포트 목록 새로고침
//         if (patientInfo.patient_id !== 'Unknown') {
//           await loadReportList(patientInfo.patient_id);
//         }
        
//         return { 
//           success: true, 
//           data: result.data || result.report || result,
//           message: result.message || '레포트가 저장되었습니다.'
//         };
//       } else {
//         throw new Error(result.message || result.error || '레포트 저장 실패');
//       }
//     } catch (error) {
//       console.error('❌ 레포트 저장 실패:', error);
//       return { 
//         success: false, 
//         error: error.message || '레포트 저장 중 오류가 발생했습니다.' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   }, [currentStudyUID, reportContent, reportStatus, getPatientInfoSafe]);

//   // 🔥 레포트 전체 수정 함수
//   const updateReportToServer = useCallback(async (reportId, reportData) => {
//     if (!reportId) {
//       console.error('Report ID가 없습니다.');
//       return { success: false, error: 'Report ID가 없습니다.' };
//     }
    
//     setIsLoading(true);
    
//     try {
//       const requestData = {
//         dr_report: reportData.content || reportContent,
//         report_status: reportData.status || reportStatus,
//       };
      
//       console.log('📤 레포트 수정 요청:', requestData);
      
//       const response = await fetch(`http://35.225.63.41:8000/api/reports/detail/${reportId}/`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestData),
//       });
      
//       const result = await handleApiResponse(response, '레포트 수정');
      
//       if (result.status === 'success' || response.ok) {
//         console.log('✅ 레포트 수정 성공:', result);
        
//         // 로컬 상태 업데이트
//         setReportContent(requestData.dr_report);
//         setReportStatus(requestData.report_status);
//         setCurrentReport(result.report || result.data || result);
        
//         // 레포트 목록 새로고침
//         const patientInfo = getPatientInfoSafe();
//         if (patientInfo.patient_id !== 'Unknown') {
//           await loadReportList(patientInfo.patient_id);
//         }
        
//         return { 
//           success: true, 
//           data: result.report || result.data || result,
//           message: result.message || '레포트가 수정되었습니다.'
//         };
//       } else {
//         throw new Error(result.message || result.error || '레포트 수정 실패');
//       }
//     } catch (error) {
//       console.error('❌ 레포트 수정 실패:', error);
//       return { 
//         success: false, 
//         error: error.message || '레포트 수정 중 오류가 발생했습니다.' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   }, [reportContent, reportStatus, getPatientInfoSafe]);

//   // 🔥 레포트 불러오기 함수
//   const loadReportFromServer = useCallback(async (studyUID) => {
//     if (!studyUID) {
//       console.error('Study UID가 없습니다.');
//       return { success: false, error: 'Study UID가 없습니다.' };
//     }

//     setIsLoading(true);
    
//     try {
//       console.log('📥 레포트 불러오기:', studyUID);

//       const response = await fetch(`http://35.225.63.41:8000/api/reports/${studyUID}/`);
      
//       // 🚀 404는 정상적인 경우 (레포트가 아직 없음)
//       if (response.status === 404) {
//         console.log('ℹ️ 기존 레포트 없음 (404)');
//         setReportContent('');
//         setReportStatus('draft');
//         setCurrentReport(null);
//         return { 
//           success: true, 
//           data: null,
//           message: '새 레포트입니다.' 
//         };
//       }

//       const result = await handleApiResponse(response, '레포트 불러오기');

//       if (result.status === 'success' || response.ok) {
//         console.log('✅ 레포트 불러오기 성공:', result.report || result.data || result);
        
//         const reportData = result.report || result.data || result;
//         setReportContent(reportData.dr_report || reportData.report_content || '');
//         setReportStatus(reportData.report_status || 'draft');
//         setCurrentReport(reportData);
        
//         return { 
//           success: true, 
//           data: reportData 
//         };
//       } else {
//         throw new Error(result.message || result.error || '레포트 불러오기 실패');
//       }
//     } catch (error) {
//       console.error('❌ 레포트 불러오기 실패:', error);
      
//       // 연결 에러인 경우 상태 초기화
//       setReportContent('');
//       setReportStatus('draft');
//       setCurrentReport(null);
      
//       return { 
//         success: false, 
//         error: error.message || '레포트 불러오기 중 오류가 발생했습니다.' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // 🚀 환자별 레포트 목록 불러오기 (수정된 부분)
//   const loadReportList = useCallback(async (patientId) => {
//     if (!patientId || patientId === 'Unknown') {
//       console.log('환자 ID가 없어서 레포트 목록을 불러올 수 없습니다.');
//       return;
//     }

//     setIsLoading(true);
    
//     try {
//       console.log('📋 환자별 레포트 목록 조회:', patientId);

//       // 🚀 URL 통일 - /list/ 사용
//       const response = await fetch(`http://35.225.63.41:8000/api/reports/list/?patient_id=${patientId}`);
      
//       // 🚀 404는 정상적인 경우 (레포트가 아직 없음)
//       if (response.status === 404) {
//         console.log('ℹ️ 레포트 목록 없음 (404)');
//         setReportList([]);
//         return;
//       }

//       const result = await handleApiResponse(response, '레포트 목록 조회');

//       // 🚀 다양한 응답 구조에 대응
//       let reports = [];
//       if (result.status === 'success' && result.reports) {
//         reports = result.reports;
//       } else if (result.status === 'success' && result.data) {
//         reports = result.data;
//       } else if (Array.isArray(result)) {
//         reports = result;
//       } else if (result.results && Array.isArray(result.results)) {
//         reports = result.results;
//       }

//       console.log('✅ 레포트 목록 조회 성공:', reports.length, '개');
//       setReportList(reports);
      
//     } catch (error) {
//       console.error('❌ 레포트 목록 조회 실패:', error);
//       setReportList([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // 🔥 레포트 삭제 함수
//   const deleteReport = useCallback(async (studyUID) => {
//     if (!studyUID) {
//       console.error('Study UID가 없습니다.');
//       return { success: false, error: 'Study UID가 없습니다.' };
//     }

//     setIsLoading(true);
    
//     try {
//       console.log('🗑️ 레포트 삭제:', studyUID);

//       const response = await fetch(`http://35.225.63.41:8000/api/reports/${studyUID}/delete/`, {
//         method: 'DELETE',
//       });

//       const result = await handleApiResponse(response, '레포트 삭제');

//       if (result.status === 'success' || response.ok) {
//         console.log('✅ 레포트 삭제 성공');
        
//         // 현재 레포트가 삭제된 경우 상태 초기화
//         if (currentStudyUID === studyUID) {
//           setReportContent('');
//           setReportStatus('draft');
//           setCurrentReport(null);
//         }
        
//         // 레포트 목록 새로고침
//         const patientInfo = getPatientInfoSafe();
//         if (patientInfo.patient_id !== 'Unknown') {
//           await loadReportList(patientInfo.patient_id);
//         }
        
//         return { 
//           success: true, 
//           message: result.message || '레포트가 삭제되었습니다.'
//         };
//       } else {
//         throw new Error(result.message || result.error || '레포트 삭제 실패');
//       }
//     } catch (error) {
//       console.error('❌ 레포트 삭제 실패:', error);
//       return { 
//         success: false, 
//         error: error.message || '레포트 삭제 중 오류가 발생했습니다.' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   }, [currentStudyUID, getPatientInfoSafe, loadReportList]);

//   // 🔥 레포트 상태 업데이트 함수
//   const updateReportStatus = useCallback(async (studyUID, newStatus) => {
//     if (!studyUID) {
//       console.error('Study UID가 없습니다.');
//       return { success: false, error: 'Study UID가 없습니다.' };
//     }

//     setIsLoading(true);
    
//     try {
//       console.log('🔄 레포트 상태 업데이트:', studyUID, newStatus);

//       const response = await fetch(`http://35.225.63.41:8000/api/reports/${studyUID}/status/`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           report_status: newStatus
//         }),
//       });

//       const result = await handleApiResponse(response, '레포트 상태 업데이트');

//       if (result.status === 'success' || response.ok) {
//         console.log('✅ 레포트 상태 업데이트 성공');
        
//         // 현재 레포트 상태 업데이트
//         if (currentStudyUID === studyUID) {
//           setReportStatus(newStatus);
//         }
        
//         // 레포트 목록 새로고침
//         const patientInfo = getPatientInfoSafe();
//         if (patientInfo.patient_id !== 'Unknown') {
//           await loadReportList(patientInfo.patient_id);
//         }
        
//         return { 
//           success: true, 
//           message: result.message || '상태가 업데이트되었습니다.'
//         };
//       } else {
//         throw new Error(result.message || result.error || '상태 업데이트 실패');
//       }
//     } catch (error) {
//       console.error('❌ 레포트 상태 업데이트 실패:', error);
//       return { 
//         success: false, 
//         error: error.message || '상태 업데이트 중 오류가 발생했습니다.' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   }, [currentStudyUID, getPatientInfoSafe, loadReportList]);

//   // 🔥 Study 변경 시 자동으로 해당 레포트 불러오기
//   useEffect(() => {
//     if (currentStudyUID) {
//       console.log('🔄 Study 변경 감지, 레포트 자동 로드:', currentStudyUID);
//       loadReportFromServer(currentStudyUID);
//     }
//   }, [currentStudyUID, loadReportFromServer]);

//   // 🔥 환자 정보 변경 시 레포트 목록 자동 로드
//   useEffect(() => {
//     const patientInfo = getPatientInfoSafe();
//     if (patientInfo.patient_id && patientInfo.patient_id !== 'Unknown') {
//       console.log('🔄 환자 정보 변경 감지, 레포트 목록 자동 로드:', patientInfo.patient_id);
//       loadReportList(patientInfo.patient_id);
//     }
//   }, [getPatientInfoSafe, loadReportList]);

//   // 🔥 반환 객체
//   return {
//     // 상태
//     reportContent,
//     setReportContent,
//     reportStatus,
//     setReportStatus,
//     isLoading,
//     reportList,
//     currentReport,
    
//     // 함수들
//     saveReportToServer,
//     updateReportToServer,
//     updateReportStatus,
//     loadReportFromServer,
//     loadReportList,
//     deleteReport,
//     getPatientInfo: getPatientInfoSafe,
    
//     // 편의 함수들
//     hasCurrentReport: !!currentReport,
//     getCurrentStudyReport: () => reportList.find(report => report.study_uid === currentStudyUID),
//     getReportsByStatus: (status) => reportList.filter(report => report.report_status === status)
//   };
// };

// export default useReports;

import { useState, useCallback, useEffect } from 'react';

/**
 * 레포트 관련 상태와 로직을 관리하는 커스텀 훅
 * @param {string} currentStudyUID - 현재 선택된 스터디 UID
 * @param {Function} getPatientInfo - 환자 정보를 가져오는 함수
 */
const useReports = (currentStudyUID, getPatientInfo) => {
  // 상태 관리
  const [reportContent, setReportContent] = useState('');
  const [reportStatus, setReportStatus] = useState('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [reportList, setReportList] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);

  // 🔥 환자 정보 가져오기 함수
  const getPatientInfoSafe = useCallback(() => {
    try {
      if (typeof getPatientInfo === 'function') {
        return getPatientInfo();
      }
      return {
        patient_id: 'Unknown',
        patient_name: 'Unknown',
        study_date: 'Unknown'
      };
    } catch (error) {
      console.error('환자 정보 가져오기 실패:', error);
      return {
        patient_id: 'Unknown',
        patient_name: 'Unknown', 
        study_date: 'Unknown'
      };
    }
  }, [getPatientInfo]);

  // 🚀 API 응답 처리 함수 (공통)
  const handleApiResponse = async (response, operation) => {
    console.log(`🔍 ${operation} - 응답 상태:`, response.status);
    
    if (!response.ok) {
      console.error(`❌ ${operation} - HTTP 에러:`, response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ ${operation} - JSON이 아닌 응답:`, text);
      throw new Error('서버에서 올바른 JSON 응답을 받지 못했습니다.');
    }

    const result = await response.json();
    console.log(`🔍 ${operation} - 응답 데이터:`, result);
    return result;
  };

  // 🚀 새로 추가: 전체 레포트 내용 로드 함수
  const loadFullReport = useCallback(async (reportId) => {
    if (!reportId) {
      console.error('Report ID가 없습니다.');
      throw new Error('Report ID가 필요합니다.');
    }

    setIsLoading(true);
    
    try {
      console.log('📋 전체 레포트 내용 로딩:', reportId);

      const response = await fetch(`http://35.225.63.41:8000/api/reports/detail/${reportId}/`);
      
      if (response.status === 404) {
        throw new Error('레포트를 찾을 수 없습니다.');
      }

      const result = await handleApiResponse(response, '전체 레포트 로드');

      if (result.status === 'success' || response.ok) {
        const fullReport = result.report || result.data || result;
        console.log('✅ 전체 레포트 로드 성공:', fullReport);
        
        return {
          ...fullReport,
          // 🚀 Django 필드 매핑
          dr_report: fullReport.dr_report || fullReport.report_content || fullReport.content || '',
          content: fullReport.dr_report || fullReport.report_content || fullReport.content || '',
          report_preview: fullReport.report_preview || fullReport.dr_report?.substring(0, 200) + '...' || ''
        };
      } else {
        throw new Error(result.message || result.error || '전체 레포트 로드 실패');
      }
    } catch (error) {
      console.error('❌ 전체 레포트 로드 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔥 레포트 저장 함수 (새로 생성)
  const saveReportToServer = useCallback(async (reportData) => {
    if (!currentStudyUID) {
      console.error('Study UID가 없습니다.');
      return { success: false, error: 'Study UID가 없습니다.' };
    }

    setIsLoading(true);
    
    try {
      const patientInfo = getPatientInfoSafe();
      
      const requestData = {
        study_uid: currentStudyUID,
        report_content: reportData.content || reportContent,
        report_status: reportData.status || reportStatus,
      };

      console.log('📤 레포트 저장 요청:', requestData);

      const response = await fetch('http://35.225.63.41:8000/api/reports/save/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await handleApiResponse(response, '레포트 저장');

      // 🚀 Django 응답 구조에 유연하게 대응
      if (result.status === 'success' || response.ok) {
        console.log('✅ 레포트 저장 성공:', result);
        
        // 로컬 상태 업데이트
        setReportContent(requestData.report_content);
        setReportStatus(requestData.report_status);
        setCurrentReport(result.data || result.report || result);
        
        // 레포트 목록 새로고침
        if (patientInfo.patient_id !== 'Unknown') {
          await loadReportList(patientInfo.patient_id);
        }
        
        return { 
          success: true, 
          data: result.data || result.report || result,
          message: result.message || '레포트가 저장되었습니다.'
        };
      } else {
        throw new Error(result.message || result.error || '레포트 저장 실패');
      }
    } catch (error) {
      console.error('❌ 레포트 저장 실패:', error);
      return { 
        success: false, 
        error: error.message || '레포트 저장 중 오류가 발생했습니다.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentStudyUID, reportContent, reportStatus, getPatientInfoSafe]);

  // 🔥 레포트 전체 수정 함수
  const updateReportToServer = useCallback(async (reportId, reportData) => {
    if (!reportId) {
      console.error('Report ID가 없습니다.');
      return { success: false, error: 'Report ID가 없습니다.' };
    }
    
    setIsLoading(true);
    
    try {
      const requestData = {
        dr_report: reportData.content || reportContent,
        report_status: reportData.status || reportStatus,
      };
      
      console.log('📤 레포트 수정 요청:', requestData);
      
      const response = await fetch(`http://35.225.63.41:8000/api/reports/detail/${reportId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await handleApiResponse(response, '레포트 수정');
      
      if (result.status === 'success' || response.ok) {
        console.log('✅ 레포트 수정 성공:', result);
        
        // 로컬 상태 업데이트
        setReportContent(requestData.dr_report);
        setReportStatus(requestData.report_status);
        setCurrentReport(result.report || result.data || result);
        
        // 레포트 목록 새로고침
        const patientInfo = getPatientInfoSafe();
        if (patientInfo.patient_id !== 'Unknown') {
          await loadReportList(patientInfo.patient_id);
        }
        
        return { 
          success: true, 
          data: result.report || result.data || result,
          message: result.message || '레포트가 수정되었습니다.'
        };
      } else {
        throw new Error(result.message || result.error || '레포트 수정 실패');
      }
    } catch (error) {
      console.error('❌ 레포트 수정 실패:', error);
      return { 
        success: false, 
        error: error.message || '레포트 수정 중 오류가 발생했습니다.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [reportContent, reportStatus, getPatientInfoSafe]);

  // 🔥 레포트 불러오기 함수
  const loadReportFromServer = useCallback(async (studyUID) => {
    if (!studyUID) {
      console.error('Study UID가 없습니다.');
      return { success: false, error: 'Study UID가 없습니다.' };
    }

    setIsLoading(true);
    
    try {
      console.log('📥 레포트 불러오기:', studyUID);

      const response = await fetch(`http://35.225.63.41:8000/api/reports/${studyUID}/`);
      
      // 🚀 404는 정상적인 경우 (레포트가 아직 없음)
      if (response.status === 404) {
        console.log('ℹ️ 기존 레포트 없음 (404)');
        setReportContent('');
        setReportStatus('draft');
        setCurrentReport(null);
        return { 
          success: true, 
          data: null,
          message: '새 레포트입니다.' 
        };
      }

      const result = await handleApiResponse(response, '레포트 불러오기');

      if (result.status === 'success' || response.ok) {
        console.log('✅ 레포트 불러오기 성공:', result.report || result.data || result);
        
        const reportData = result.report || result.data || result;
        setReportContent(reportData.dr_report || reportData.report_content || '');
        setReportStatus(reportData.report_status || 'draft');
        setCurrentReport(reportData);
        
        return { 
          success: true, 
          data: reportData 
        };
      } else {
        throw new Error(result.message || result.error || '레포트 불러오기 실패');
      }
    } catch (error) {
      console.error('❌ 레포트 불러오기 실패:', error);
      
      // 연결 에러인 경우 상태 초기화
      setReportContent('');
      setReportStatus('draft');
      setCurrentReport(null);
      
      return { 
        success: false, 
        error: error.message || '레포트 불러오기 중 오류가 발생했습니다.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🚀 환자별 레포트 목록 불러오기 (수정된 부분)
  const loadReportList = useCallback(async (patientId) => {
    if (!patientId || patientId === 'Unknown') {
      console.log('환자 ID가 없어서 레포트 목록을 불러올 수 없습니다.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📋 환자별 레포트 목록 조회:', patientId);

      // 🚀 URL 통일 - /list/ 사용
      const response = await fetch(`http://35.225.63.41:8000/api/reports/list/?patient_id=${patientId}`);
      
      // 🚀 404는 정상적인 경우 (레포트가 아직 없음)
      if (response.status === 404) {
        console.log('ℹ️ 레포트 목록 없음 (404)');
        setReportList([]);
        return;
      }

      const result = await handleApiResponse(response, '레포트 목록 조회');

      // 🚀 다양한 응답 구조에 대응
      let reports = [];
      if (result.status === 'success' && result.reports) {
        reports = result.reports;
      } else if (result.status === 'success' && result.data) {
        reports = result.data;
      } else if (Array.isArray(result)) {
        reports = result;
      } else if (result.results && Array.isArray(result.results)) {
        reports = result.results;
      }

      console.log('✅ 레포트 목록 조회 성공:', reports.length, '개');
      setReportList(reports);
      
    } catch (error) {
      console.error('❌ 레포트 목록 조회 실패:', error);
      setReportList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔥 레포트 삭제 함수
  const deleteReport = useCallback(async (studyUID) => {
    if (!studyUID) {
      console.error('Study UID가 없습니다.');
      return { success: false, error: 'Study UID가 없습니다.' };
    }

    setIsLoading(true);
    
    try {
      console.log('🗑️ 레포트 삭제:', studyUID);

      const response = await fetch(`http://35.225.63.41:8000/api/reports/${studyUID}/delete/`, {
        method: 'DELETE',
      });

      const result = await handleApiResponse(response, '레포트 삭제');

      if (result.status === 'success' || response.ok) {
        console.log('✅ 레포트 삭제 성공');
        
        // 현재 레포트가 삭제된 경우 상태 초기화
        if (currentStudyUID === studyUID) {
          setReportContent('');
          setReportStatus('draft');
          setCurrentReport(null);
        }
        
        // 레포트 목록 새로고침
        const patientInfo = getPatientInfoSafe();
        if (patientInfo.patient_id !== 'Unknown') {
          await loadReportList(patientInfo.patient_id);
        }
        
        return { 
          success: true, 
          message: result.message || '레포트가 삭제되었습니다.'
        };
      } else {
        throw new Error(result.message || result.error || '레포트 삭제 실패');
      }
    } catch (error) {
      console.error('❌ 레포트 삭제 실패:', error);
      return { 
        success: false, 
        error: error.message || '레포트 삭제 중 오류가 발생했습니다.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentStudyUID, getPatientInfoSafe, loadReportList]);

  // 🔥 레포트 상태 업데이트 함수
  const updateReportStatus = useCallback(async (studyUID, newStatus) => {
    if (!studyUID) {
      console.error('Study UID가 없습니다.');
      return { success: false, error: 'Study UID가 없습니다.' };
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 레포트 상태 업데이트:', studyUID, newStatus);

      const response = await fetch(`http://35.225.63.41:8000/api/reports/${studyUID}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_status: newStatus
        }),
      });

      const result = await handleApiResponse(response, '레포트 상태 업데이트');

      if (result.status === 'success' || response.ok) {
        console.log('✅ 레포트 상태 업데이트 성공');
        
        // 현재 레포트 상태 업데이트
        if (currentStudyUID === studyUID) {
          setReportStatus(newStatus);
        }
        
        // 레포트 목록 새로고침
        const patientInfo = getPatientInfoSafe();
        if (patientInfo.patient_id !== 'Unknown') {
          await loadReportList(patientInfo.patient_id);
        }
        
        return { 
          success: true, 
          message: result.message || '상태가 업데이트되었습니다.'
        };
      } else {
        throw new Error(result.message || result.error || '상태 업데이트 실패');
      }
    } catch (error) {
      console.error('❌ 레포트 상태 업데이트 실패:', error);
      return { 
        success: false, 
        error: error.message || '상태 업데이트 중 오류가 발생했습니다.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentStudyUID, getPatientInfoSafe, loadReportList]);

  // 🔥 Study 변경 시 자동으로 해당 레포트 불러오기
  useEffect(() => {
    if (currentStudyUID) {
      console.log('🔄 Study 변경 감지, 레포트 자동 로드:', currentStudyUID);
      loadReportFromServer(currentStudyUID);
    }
  }, [currentStudyUID, loadReportFromServer]);

  // 🔥 환자 정보 변경 시 레포트 목록 자동 로드
  useEffect(() => {
    const patientInfo = getPatientInfoSafe();
    if (patientInfo.patient_id && patientInfo.patient_id !== 'Unknown') {
      console.log('🔄 환자 정보 변경 감지, 레포트 목록 자동 로드:', patientInfo.patient_id);
      loadReportList(patientInfo.patient_id);
    }
  }, [getPatientInfoSafe, loadReportList]);

  // 🔥 반환 객체
  return {
    // 상태
    reportContent,
    setReportContent,
    reportStatus,
    setReportStatus,
    isLoading,
    reportList,
    currentReport,
    setCurrentReport,
    
    // 함수들
    saveReportToServer,
    updateReportToServer,
    updateReportStatus,
    loadReportFromServer,
    loadReportList,
    deleteReport,
    getPatientInfo: getPatientInfoSafe,
    
    // 🚀 새로 추가: 전체 레포트 로드 함수
    loadFullReport,
    
    // 편의 함수들
    hasCurrentReport: !!currentReport,
    getCurrentStudyReport: () => reportList.find(report => report.study_uid === currentStudyUID),
    getReportsByStatus: (status) => reportList.filter(report => report.report_status === status)
  };
};

export default useReports;