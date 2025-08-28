// // src/components/dashboard/WorkListPanel/index.js

// import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
// import FilterSection from './FilterSection';
// import WorkListTable from './WorkListTable';
// import { worklistService } from '../../../services/worklistService';
// import { getTodayKST } from '../../../utils/timeUtils';
// import './WorkListPanel.css';

// const WorkListPanel = forwardRef((props, ref) => {
//   const { onDragStart, onDateChange, selectedDate } = props;
  
//   // 상태 관리
//   const [worklist, setWorklist] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   // ✅ 날짜 초기값을 일관성 있게 처리
//   const getInitialDate = () => {
//     if (selectedDate) {
//       if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
//         return selectedDate;
//       }
//     }
//     return getTodayKST();
//   };
  
//   const [currentDate, setCurrentDate] = useState(getInitialDate());
//   const [filters, setFilters] = useState({
//     patientId: '',
//     patientName: '',
//     modality: '',
//     examPart: '',
//     requestDoctor: '',
//     reportingDoctor: '',
//     examStatus: '',
//     reportStatus: ''
//   });

//   // ✅ 간단한 데이터 로딩 함수 (시간 변환 없음)
//   const loadWorklist = useCallback(async (date = null) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const targetDate = date || currentDate;
//       console.log('📅 워크리스트 로딩 시작 - 목표 날짜:', targetDate);
      
//       // 날짜 형식 검증
//       if (!targetDate || !targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
//         throw new Error(`잘못된 날짜 형식: ${targetDate}`);
//       }
      
//       // 날짜별 API 호출
//       const data = await worklistService.getWorklistByDate(targetDate);
//       console.log('✅ API 성공:', data?.length || 0, '개');
//       console.log('원본 데이터:', data);
      
//       // ✅ 데이터를 그대로 사용 (Django에서 이미 변환된 상태)
//       if (Array.isArray(data)) {
//         console.log('📊 최종 데이터:', data.length, '개');
//         setWorklist(data);  // 변환 없이 그대로 사용
//       } else {
//         console.warn('⚠️ 데이터가 배열이 아님:', typeof data);
//         setWorklist([]);
//       }
      
//     } catch (err) {
//       console.error('❌ 워크리스트 로드 실패:', err);
//       setError(`데이터를 불러오는데 실패했습니다: ${err.message}`);
//       setWorklist([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentDate]);

//   // 🔥 새로 추가: 레포트 관련 이벤트 리스너
//   useEffect(() => {
//     const handleReportSaved = (event) => {
//       console.log('📡 레포트 저장 이벤트 수신:', event.detail);
//       console.log('🔄 워크리스트 새로고침 실행 (레포트 저장)');
//       loadWorklist(currentDate);
//     };

//     const handleReportStatusUpdated = (event) => {
//       console.log('📡 레포트 상태 업데이트 이벤트 수신:', event.detail);
//       console.log('🔄 워크리스트 새로고침 실행 (상태 업데이트)');
//       loadWorklist(currentDate);
//     };

//     const handleDashboardRefresh = (event) => {
//       console.log('📡 대시보드 새로고침 이벤트 수신:', event.detail);
//       console.log('🔄 워크리스트 새로고침 실행 (대시보드)');
//       loadWorklist(currentDate);
//     };

//     // 🔥 이벤트 리스너 등록
//     window.addEventListener('reportSaved', handleReportSaved);
//     window.addEventListener('reportStatusUpdated', handleReportStatusUpdated);
//     window.addEventListener('dashboardRefresh', handleDashboardRefresh);

//     console.log('📡 워크리스트 이벤트 리스너 등록 완료');

//     // 🔥 정리 함수
//     return () => {
//       window.removeEventListener('reportSaved', handleReportSaved);
//       window.removeEventListener('reportStatusUpdated', handleReportStatusUpdated);
//       window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
//       console.log('📡 워크리스트 이벤트 리스너 해제 완료');
//     };
//   }, [currentDate, loadWorklist]);

//   // ✅ prop으로 받은 selectedDate 변화 감지
//   useEffect(() => {
//     if (selectedDate && selectedDate !== currentDate) {
//       console.log('📅 상위에서 날짜 변경됨:', selectedDate);
//       if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
//         setCurrentDate(selectedDate);
//       } else {
//         console.warn('⚠️ 잘못된 날짜 형식:', selectedDate);
//       }
//     }
//   }, [selectedDate, currentDate]);

//   // ✅ 날짜 변경 핸들러
//   const handleDateChange = useCallback((date) => {
//     console.log('📅 WorkListPanel 날짜 변경:', date);
    
//     // 날짜 형식 검증
//     if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
//       console.warn('⚠️ 잘못된 날짜 형식, 오늘 날짜로 설정');
//       date = getTodayKST();
//     }
    
//     setCurrentDate(date);
    
//     // 부모 컴포넌트에 알림
//     if (onDateChange) {
//       onDateChange(date);
//     }
//   }, [onDateChange]);

//   // ✅ ref 메서드 노출 - 🔥 새로고침 함수 강화
//   useImperativeHandle(ref, () => ({
//     refreshWorklist: () => {
//       console.log('🔄 외부에서 워크리스트 새로고침 요청');
//       return loadWorklist(currentDate);
//     },
//     setDate: (date) => handleDateChange(date),
//     getCurrentDate: () => currentDate,
//     getWorklistCount: () => worklist.length,
//     clearData: () => {
//       console.log('🧹 워크리스트 데이터 초기화');
//       setWorklist([]);
//       setError(null);
//     }
//   }), [currentDate, loadWorklist, handleDateChange, worklist.length]);

//   // ✅ 날짜 변경시 데이터 로딩
//   useEffect(() => {
//     console.log('📅 useEffect - 날짜 변경 감지:', currentDate);
//     loadWorklist(currentDate);
//   }, [currentDate, loadWorklist]);

//   // ✅ 필터링된 워크리스트
//   const filteredWorklist = worklist.filter(exam => {
//     try {
//       return (!filters.patientId || (exam.patientId && exam.patientId.toLowerCase().includes(filters.patientId.toLowerCase()))) &&
//              (!filters.patientName || (exam.patientName && exam.patientName.toLowerCase().includes(filters.patientName.toLowerCase()))) &&
//              (!filters.modality || exam.modality === filters.modality) &&
//              (!filters.examPart || (exam.examPart && exam.examPart.toLowerCase().includes(filters.examPart.toLowerCase()))) &&
//              (!filters.requestDoctor || (exam.requestDoctor && exam.requestDoctor.toLowerCase().includes(filters.requestDoctor.toLowerCase()))) &&
//              (!filters.examStatus || exam.examStatus === filters.examStatus) &&
//              (!filters.reportStatus || exam.reportStatus === filters.reportStatus);
//     } catch (filterError) {
//       console.error('❌ 필터링 오류:', filterError, exam);
//       return false;
//     }
//   });

//   // 디버깅 로그 추가
//   console.log('📊 현재 상태:', {
//     worklist: worklist.length,
//     filteredWorklist: filteredWorklist.length,
//     loading,
//     error
//   });

//   // 필터 변경 핸들러
//   const handleFilterChange = useCallback((field, value) => {
//     console.log('🔍 필터 변경:', field, '=', value);
//     setFilters(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   }, []);

//   // 필터 초기화
//   const clearFilters = useCallback(() => {
//     console.log('🧹 필터 초기화');
//     setFilters({
//       patientId: '',
//       patientName: '',
//       modality: '',
//       examPart: '',
//       requestDoctor: '',
//       reportingDoctor: '',
//       examStatus: '',
//       reportStatus: ''
//     });
//   }, []);

//   // 드래그 시작 핸들러
//   const handleDragStart = useCallback((exam) => {
//     if (exam.examStatus === '대기') {
//       console.log('🖱️ 드래그 시작:', exam.patientName, exam.modality, exam.examPart);
//       onDragStart && onDragStart(exam);
//     } else {
//       console.log('❌ 드래그 불가능한 상태:', exam.examStatus);
//     }
//   }, [onDragStart]);

//   // 재시도 핸들러
//   const handleRetry = useCallback(() => {
//     console.log('🔄 재시도 버튼 클릭');
//     loadWorklist(currentDate);
//   }, [currentDate, loadWorklist]);

//   // 로딩 상태
//   if (loading) {
//     return (
//       <div className="worklist-panel">
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'center', 
//           alignItems: 'center', 
//           height: '200px',
//           color: '#6b7280'
//         }}>
//           📅 {currentDate} 데이터를 불러오는 중...
//         </div>
//       </div>
//     );
//   }

//   // 에러 상태
//   if (error) {
//     return (
//       <div className="worklist-panel">
//         <div style={{ 
//           display: 'flex', 
//           flexDirection: 'column',
//           justifyContent: 'center', 
//           alignItems: 'center', 
//           height: '200px',
//           color: '#dc2626'
//         }}>
//           <p>❌ {error}</p>
//           <button 
//             onClick={handleRetry}
//             style={{
//               marginTop: '1rem',
//               padding: '0.5rem 1rem',
//               background: '#3b82f6',
//               color: 'white',
//               border: 'none',
//               borderRadius: '0.25rem',
//               cursor: 'pointer'
//             }}
//           >
//             🔄 다시 시도
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="worklist-panel">
//       <FilterSection
//         filters={filters}
//         onFilterChange={handleFilterChange}
//         onClearFilters={clearFilters}
//         filteredCount={filteredWorklist.length}
//         selectedDate={currentDate}
//         onDateChange={handleDateChange}
//         worklist={worklist}
//       />
      
//       <WorkListTable
//         filteredWorklist={filteredWorklist}
//         onDragStart={handleDragStart}
//       />
      
//       {/* ✅ 개발용 디버그 정보 */}
//       {/* {process.env.NODE_ENV === 'development' && (
//         <div style={{
//           position: 'fixed',
//           bottom: '10px',
//           left: '10px',
//           background: 'rgba(0,0,0,0.9)',
//           color: 'white',
//           padding: '0.75rem',
//           borderRadius: '0.5rem',
//           fontSize: '0.75rem',
//           lineHeight: '1.4',
//           maxWidth: '350px',
//           zIndex: 1000
//         }}>
//           <div>📅 선택된 날짜: <strong>{currentDate}</strong></div>
//           <div>📊 원본 데이터: <strong>{worklist.length}개</strong></div>
//           <div>📊 필터링된 데이터: <strong>{filteredWorklist.length}개</strong></div>
//           <div>🔄 로딩: {loading ? '중' : '완료'}</div>
//           {error && <div style={{color: '#fca5a5'}}>❌ 에러: {error}</div>}
//           {worklist.length > 0 && (
//             <div>✅ 첫 번째 환자: <strong>{worklist[0]?.patientName}</strong></div>
//           )}
//           <div style={{color: '#94a3b8', marginTop: '0.5rem'}}>
//             📡 이벤트 리스너: reportSaved, reportStatusUpdated, dashboardRefresh
//           </div>
//         </div>
//       )} */}
//     </div>
//   );
// });

// WorkListPanel.displayName = 'WorkListPanel';

// export default WorkListPanel;




// src/components/dashboard/WorkListPanel/index.js

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import FilterSection from './FilterSection';
import WorkListTable from './WorkListTable';
import { worklistService } from '../../../services/worklistService';
import { getTodayKST } from '../../../utils/timeUtils';
import './WorkListPanel.css';

const WorkListPanel = forwardRef((props, ref) => {
  const { onDragStart, onDateChange, selectedDate } = props;
  
  // 상태 관리
  const [worklist, setWorklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ 날짜 초기값을 일관성 있게 처리
  const getInitialDate = () => {
    if (selectedDate) {
      if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return selectedDate;
      }
    }
    return getTodayKST();
  };
  
  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [filters, setFilters] = useState({
    patientId: '',
    patientName: '',
    modality: '',
    examPart: '',
    requestDoctor: '',
    reportingDoctor: '',
    examStatus: '',
    reportStatus: ''
  });

  // ✅ 간단한 데이터 로딩 함수 (시간 변환 없음)
  const loadWorklist = useCallback(async (date = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetDate = date || currentDate;
      console.log('📅 워크리스트 로딩 시작 - 목표 날짜:', targetDate);
      
      // 날짜 형식 검증
      if (!targetDate || !targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error(`잘못된 날짜 형식: ${targetDate}`);
      }
      
      // 날짜별 API 호출
      const data = await worklistService.getWorklistByDate(targetDate);
      console.log('✅ API 성공:', data?.length || 0, '개');
      console.log('원본 데이터:', data);
      
      // ✅ 데이터를 그대로 사용 (Django에서 이미 변환된 상태)
      if (Array.isArray(data)) {
        console.log('📊 최종 데이터:', data.length, '개');
        setWorklist(data);  // 변환 없이 그대로 사용
      } else {
        console.warn('⚠️ 데이터가 배열이 아님:', typeof data);
        setWorklist([]);
      }
      
    } catch (err) {
      console.error('❌ 워크리스트 로드 실패:', err);
      setError(`데이터를 불러오는데 실패했습니다: ${err.message}`);
      setWorklist([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // 🔥 새로 추가: 레포트 관련 이벤트 리스너
  useEffect(() => {
    const handleReportSaved = (event) => {
      console.log('📡 레포트 저장 이벤트 수신:', event.detail);
      console.log('🔄 워크리스트 새로고침 실행 (레포트 저장)');
      loadWorklist(currentDate);
    };

    const handleReportStatusUpdated = (event) => {
      console.log('📡 레포트 상태 업데이트 이벤트 수신:', event.detail);
      console.log('🔄 워크리스트 새로고침 실행 (상태 업데이트)');
      loadWorklist(currentDate);
    };

    const handleDashboardRefresh = (event) => {
      console.log('📡 대시보드 새로고침 이벤트 수신:', event.detail);
      console.log('🔄 워크리스트 새로고침 실행 (대시보드)');
      loadWorklist(currentDate);
    };

    // 🔥 이벤트 리스너 등록
    window.addEventListener('reportSaved', handleReportSaved);
    window.addEventListener('reportStatusUpdated', handleReportStatusUpdated);
    window.addEventListener('dashboardRefresh', handleDashboardRefresh);

    console.log('📡 워크리스트 이벤트 리스너 등록 완료');

    // 🔥 정리 함수
    return () => {
      window.removeEventListener('reportSaved', handleReportSaved);
      window.removeEventListener('reportStatusUpdated', handleReportStatusUpdated);
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
      console.log('📡 워크리스트 이벤트 리스너 해제 완료');
    };
  }, [currentDate, loadWorklist]);

  // ✅ prop으로 받은 selectedDate 변화 감지
  useEffect(() => {
    if (selectedDate && selectedDate !== currentDate) {
      console.log('📅 상위에서 날짜 변경됨:', selectedDate);
      if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setCurrentDate(selectedDate);
      } else {
        console.warn('⚠️ 잘못된 날짜 형식:', selectedDate);
      }
    }
  }, [selectedDate, currentDate]);

  // ✅ 날짜 변경 핸들러
  const handleDateChange = useCallback((date) => {
    console.log('📅 WorkListPanel 날짜 변경:', date);
    
    // 날짜 형식 검증
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.warn('⚠️ 잘못된 날짜 형식, 오늘 날짜로 설정');
      date = getTodayKST();
    }
    
    setCurrentDate(date);
    
    // 부모 컴포넌트에 알림
    if (onDateChange) {
      onDateChange(date);
    }
  }, [onDateChange]);

  // ✅ ref 메서드 노출 - 🔥 새로고침 함수 강화
  useImperativeHandle(ref, () => ({
    refreshWorklist: () => {
      console.log('🔄 외부에서 워크리스트 새로고침 요청');
      return loadWorklist(currentDate);
    },
    setDate: (date) => handleDateChange(date),
    getCurrentDate: () => currentDate,
    getWorklistCount: () => worklist.length,
    clearData: () => {
      console.log('🧹 워크리스트 데이터 초기화');
      setWorklist([]);
      setError(null);
    }
  }), [currentDate, loadWorklist, handleDateChange, worklist.length]);

  // ✅ 날짜 변경시 데이터 로딩
  useEffect(() => {
    console.log('📅 useEffect - 날짜 변경 감지:', currentDate);
    loadWorklist(currentDate);
  }, [currentDate, loadWorklist]);

  // ✅ 필터링된 워크리스트
  const filteredWorklist = worklist.filter(exam => {
    try {
      return (!filters.patientId || (exam.patientId && exam.patientId.toLowerCase().includes(filters.patientId.toLowerCase()))) &&
             (!filters.patientName || (exam.patientName && exam.patientName.toLowerCase().includes(filters.patientName.toLowerCase()))) &&
             (!filters.modality || exam.modality === filters.modality) &&
             (!filters.examPart || (exam.examPart && exam.examPart.toLowerCase().includes(filters.examPart.toLowerCase()))) &&
             (!filters.requestDoctor || (exam.requestDoctor && exam.requestDoctor.toLowerCase().includes(filters.requestDoctor.toLowerCase()))) &&
             (!filters.examStatus || exam.examStatus === filters.examStatus) &&
             (!filters.reportStatus || exam.reportStatus === filters.reportStatus);
    } catch (filterError) {
      console.error('❌ 필터링 오류:', filterError, exam);
      return false;
    }
  });

  // 디버깅 로그 추가
  console.log('📊 현재 상태:', {
    worklist: worklist.length,
    filteredWorklist: filteredWorklist.length,
    loading,
    error
  });

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((field, value) => {
    console.log('🔍 필터 변경:', field, '=', value);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    console.log('🧹 필터 초기화');
    setFilters({
      patientId: '',
      patientName: '',
      modality: '',
      examPart: '',
      requestDoctor: '',
      reportingDoctor: '',
      examStatus: '',
      reportStatus: ''
    });
  }, []);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((exam) => {
    if (exam.examStatus === '대기') {
      console.log('🖱️ 드래그 시작:', exam.patientName, exam.modality, exam.examPart);
      onDragStart && onDragStart(exam);
    } else {
      console.log('❌ 드래그 불가능한 상태:', exam.examStatus);
    }
  }, [onDragStart]);

  // 더블클릭 핸들러 (여기에 추가!)
  const handleDoubleClick = useCallback((exam) => {
    console.log('🖱️ 더블클릭된 환자:', exam);
    
    // 환자 ID 추출
    const patientID = exam.patientId;
    console.log('👤 환자 ID:', patientID);
    
    if (!patientID) {
      console.error('❌ 환자 ID가 없습니다');
      return;
    }
    
    // 새창으로 뷰어 열기
    const viewerUrl = `/viewer?patientID=${patientID}`;
    window.open(viewerUrl, '_blank', 'width=1600,height=1000,scrollbars=yes,resizable=yes');
  }, []);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    console.log('🔄 재시도 버튼 클릭');
    loadWorklist(currentDate);
  }, [currentDate, loadWorklist]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="worklist-panel">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          📅 {currentDate} 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="worklist-panel">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#dc2626'
        }}>
          <p>❌ {error}</p>
          <button 
            onClick={handleRetry}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            🔄 다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="worklist-panel">
      <FilterSection
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        filteredCount={filteredWorklist.length}
        selectedDate={currentDate}
        onDateChange={handleDateChange}
        worklist={worklist}
      />
      
      <WorkListTable
        filteredWorklist={filteredWorklist}
        onDragStart={handleDragStart}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* ✅ 개발용 디버그 정보 */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          lineHeight: '1.4',
          maxWidth: '350px',
          zIndex: 1000
        }}>
          <div>📅 선택된 날짜: <strong>{currentDate}</strong></div>
          <div>📊 원본 데이터: <strong>{worklist.length}개</strong></div>
          <div>📊 필터링된 데이터: <strong>{filteredWorklist.length}개</strong></div>
          <div>🔄 로딩: {loading ? '중' : '완료'}</div>
          {error && <div style={{color: '#fca5a5'}}>❌ 에러: {error}</div>}
          {worklist.length > 0 && (
            <div>✅ 첫 번째 환자: <strong>{worklist[0]?.patientName}</strong></div>
          )}
          <div style={{color: '#94a3b8', marginTop: '0.5rem'}}>
            📡 이벤트 리스너: reportSaved, reportStatusUpdated, dashboardRefresh
          </div>
        </div>
      )} */}
    </div>
  );
});

WorkListPanel.displayName = 'WorkListPanel';

export default WorkListPanel;