// pages/Dashboard/index.js - 최적화된 중복 저장 문제 해결
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import WorkListPanel from '../../components/dashboard/WorkListPanel';
import SchedulePanel from '../../components/dashboard/SchedulePanel';
import AssignmentModal from '../../components/dashboard/AssignmentModal';
import { getTodayKST } from '../../utils/timeUtils';
import { roomService } from '../../services/roomService';
import { doctorService } from '../../services/doctorService';
import { worklistService } from '../../services/worklistService';
import { scheduleService } from '../../services/scheduleService';
import './Dashboard.css';

// ✅ 상수 정의
const BUSINESS_HOURS = { START: 9, END: 18 };
const DEBOUNCE_DELAY = 500;
const FOCUS_THROTTLE_DELAY = 2000;

// ✅ 모달리티별 기본 소요시간 맵핑
const MODALITY_DURATION_MAP = {
  'CR': 10,   // X-ray
  'CT': 30,   // CT
  'MR': 60,   // MRI
  'US': 20,   // 초음파
  'NM': 45,   // Nuclear Medicine
  'PT': 90,   // PET
  'DX': 15,   // Digital Radiography
  'XA': 45,   // Angiography
  'MG': 20    // Mammography
};

const Dashboard = () => {
  const [leftWidth, setLeftWidth] = useState(55);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // 드래그앤드롭 및 모달 상태 관리
  const [draggedExam, setDraggedExam] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selectedRadiologist, setSelectedRadiologist] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  // 검사실과 영상전문의 데이터
  const [rooms, setRooms] = useState([]);
  const [radiologists, setRadiologists] = useState([]);
  const [roomSchedules, setRoomSchedules] = useState({});
  
  // 로딩 상태 및 처리 중복 방지
  const [loading, setLoading] = useState(false);
  const isProcessingRef = useRef(false);
  const lastProcessTimeRef = useRef(0);
  
  const workListPanelRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ✅ 유틸리티 함수들 - useMemo로 최적화
  const formatDateForAPI = useMemo(() => {
    return (date) => {
      if (!date) return new Date().toISOString().split('T')[0];
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date;
    };
  }, []);

  const isValidWorkHour = useMemo(() => {
    return (timeString) => {
      if (!timeString) return false;
      
      try {
        const hour = parseInt(timeString.split(':')[0]);
        return hour >= BUSINESS_HOURS.START && hour <= BUSINESS_HOURS.END;
      } catch {
        return false;
      }
    };
  }, []);

  const getDefaultTimeForSlot = useMemo(() => {
    return (timeSlot) => {
      if (!timeSlot) return '09:00';
      
      // 드롭된 시간대의 첫 번째 정시로 기본값 설정
      const hour = parseInt(timeSlot.split(':')[0]);
      const validHour = Math.max(BUSINESS_HOURS.START, Math.min(hour, BUSINESS_HOURS.END));
      return `${validHour.toString().padStart(2, '0')}:00`;
    };
  }, []);

  const getDefaultDurationByModality = useMemo(() => {
    return (modality) => {
      return (MODALITY_DURATION_MAP[modality] || 30).toString();
    };
  }, []);

  // ✅ 중복 처리 방지 개선
  const canProcess = useCallback(() => {
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    
    if (isProcessingRef.current || timeSinceLastProcess < DEBOUNCE_DELAY) {
      console.log('🔄 처리 방지:', { 
        isProcessing: isProcessingRef.current, 
        timeSinceLastProcess 
      });
      return false;
    }
    
    return true;
  }, []);

  const setProcessing = useCallback((processing, delay = DEBOUNCE_DELAY) => {
    isProcessingRef.current = processing;
    if (processing) {
      lastProcessTimeRef.current = Date.now();
    }
    
    if (!processing && delay > 0) {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, delay);
    }
  }, []);

  // ✅ 초기화 useEffect 최적화
  useEffect(() => {
    // 브라우저 알림 설정
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Service Worker 메시지 처리
    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event) => {
        if (event.data?.type === 'SKIP_WAITING') {
          event.preventDefault();
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);

  // ✅ 초기 데이터 로딩 최적화
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!canProcess()) return;
      
      try {
        setProcessing(true);
        
        const [roomsData, radiologistsData] = await Promise.all([
          roomService.getRooms(),
          doctorService.getRadiologists()
        ]);

        if (isMounted) {
          console.log('초기 데이터 로드:', { roomsData, radiologistsData });
          setRooms(roomsData);
          setRadiologists(radiologistsData);

          // 각 검사실별 빈 스케줄 초기화
          const initialSchedules = roomsData.reduce((acc, room) => {
            acc[room.id] = [];
            return acc;
          }, {});
          setRoomSchedules(initialSchedules);
        }
      } catch (error) {
        if (isMounted) {
          console.error('초기 데이터 로드 실패:', error);
        }
      } finally {
        setProcessing(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ 스케줄 로딩 함수 최적화
  const loadTodaySchedules = useCallback(async (date = null) => {
    if (!canProcess()) {
      console.log('🔄 스케줄 로딩 생략 (중복 방지)');
      return;
    }

    try {
      setProcessing(true);
      const targetDate = date || selectedDate;
      const formattedDate = formatDateForAPI(targetDate);
      
      console.log('🔍 스케줄 로딩 시작:', formattedDate);
      
      const scheduleData = await scheduleService.getRoomSchedules(formattedDate);
      console.log('🔍 로딩된 스케줄 데이터:', scheduleData);
      
      if (scheduleData?.room_schedules) {
        setRoomSchedules(prev => {
          console.log('📊 스케줄 업데이트:', {
            이전: Object.keys(prev).length,
            새로운: Object.keys(scheduleData.room_schedules).length
          });
          return { ...scheduleData.room_schedules };
        });
        console.log('✅ 스케줄 로딩 완료:', Object.keys(scheduleData.room_schedules).length, '개 검사실');
      } else {
        // 빈 스케줄 초기화
        const initialSchedules = rooms.reduce((acc, room) => {
          acc[room.id] = [];
          return acc;
        }, {});
        setRoomSchedules(initialSchedules);
        console.log('📝 빈 스케줄로 초기화');
      }
    } catch (error) {
      console.error('❌ 스케줄 로딩 실패:', error);
      
      // 에러 시 빈 스케줄로 초기화
      const initialSchedules = rooms.reduce((acc, room) => {
        acc[room.id] = [];
        return acc;
      }, {});
      setRoomSchedules(initialSchedules);
    } finally {
      setProcessing(false);
    }
  }, [selectedDate, formatDateForAPI, rooms, canProcess, setProcessing]);

  // ✅ 스케줄 새로고침 함수
  const refreshSchedules = useCallback(async () => {
    console.log('🔄 스케줄 수동 새로고침 요청');
    await loadTodaySchedules(selectedDate);
  }, [selectedDate, loadTodaySchedules]);

  // ✅ rooms 로드 완료 후 스케줄 로딩
  useEffect(() => {
    if (rooms.length > 0) {
      console.log('📋 검사실 데이터 로드 완료, 스케줄 로딩 시작');
      loadTodaySchedules(selectedDate);
    }
  }, [rooms.length, loadTodaySchedules, selectedDate]);

  // ✅ 날짜 변경 시 스케줄 로딩
  useEffect(() => {
    if (rooms.length > 0) {
      console.log('📅 날짜 변경됨, 스케줄 새로 로딩');
      loadTodaySchedules(selectedDate);
    }
  }, [selectedDate, rooms.length, loadTodaySchedules]);

  // ✅ 페이지 포커스 시 스케줄 새로고침 (throttling)
  useEffect(() => {
    let focusTimeout = null;
    
    const handleFocus = () => {
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
      
      focusTimeout = setTimeout(() => {
        console.log('🔄 페이지 포커스 - 스케줄 새로고침');
        if (rooms.length > 0) {
          loadTodaySchedules(selectedDate);
        }
      }, FOCUS_THROTTLE_DELAY);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, [rooms.length, selectedDate, loadTodaySchedules]);

  // ✅ 이벤트 핸들러들
  const handleDateChange = useCallback((date) => {
    console.log('📅 Dashboard 날짜 변경:', date);
    setSelectedDate(new Date(date));
  }, []);

  const handleDragStart = useCallback((exam) => {
    console.log('드래그 시작:', exam);
    setDraggedExam(exam);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleExamUpdated = useCallback((eventType, data) => {
    console.log('검사 업데이트 이벤트:', eventType, data);
    
    if (eventType === 'assignment_requested') {
      // 배정 모달 열기
      setModalData(data);
      setSelectedRadiologist('');
      setSelectedTime(getDefaultTimeForSlot(data.timeSlot));
      setEstimatedDuration(getDefaultDurationByModality(data.exam.modality));
      setShowAssignmentModal(true);
      
      console.log('✅ 배정 모달 기본값 설정:', {
        timeSlot: data.timeSlot,
        defaultTime: getDefaultTimeForSlot(data.timeSlot),
        modality: data.exam.modality,
        defaultDuration: getDefaultDurationByModality(data.exam.modality)
      });
    }
  }, [getDefaultTimeForSlot, getDefaultDurationByModality]);

  // ✅ 배정 확정 핸들러 최적화
  const confirmAssignment = useCallback(async () => {
    if (!selectedRadiologist || !selectedTime || !estimatedDuration || !modalData) {
      alert('⚠️ 모든 필수 정보를 입력해주세요.');
      return;
    }

    // 업무시간 검증
    if (!isValidWorkHour(selectedTime)) {
      alert(`⚠️ 업무시간(${BUSINESS_HOURS.START}:00-${BUSINESS_HOURS.END}:00) 내에서만 검사를 배정할 수 있습니다.`);
      return;
    }

    if (!canProcess()) {
      console.log('🔄 이미 배정 처리 중, 중복 호출 무시');
      return;
    }

    try {
      setLoading(true);
      setProcessing(true, 1000); // 1초 간 재처리 방지
      console.log('🔥 배정 확정 시작');

      const assignmentData = {
        roomId: modalData.roomId,
        radiologistId: parseInt(selectedRadiologist),
        startTime: selectedTime,
        duration: parseInt(estimatedDuration)
      };

      console.log('📤 배정 요청 데이터:', assignmentData);
      const result = await worklistService.assignExam(modalData.exam.id, assignmentData);
      console.log('📥 배정 API 결과:', result);

      // 스케줄 새로고침
      await refreshSchedules();

      // 워크리스트 새로고침
      if (workListPanelRef.current?.refreshWorklist) {
        workListPanelRef.current.refreshWorklist();
      }

      // 성공 메시지
      const radiologistName = radiologists.find(r => r.id === parseInt(selectedRadiologist))?.name || '선택된 의사';
      const roomName = rooms.find(r => r.id === modalData.roomId)?.name || '선택된 검사실';
      
      console.log('✅ 배정 완료!');
      alert(`✅ ${modalData.exam.patientName} 환자의 ${modalData.exam.examPart} ${modalData.exam.modality} 검사가 성공적으로 배정되었습니다!\n\n📋 배정 정보:\n🏥 검사실: ${roomName}\n👨‍⚕️ 담당의: Dr. ${radiologistName}\n🕐 시간: ${selectedTime} (${estimatedDuration}분)`);
      
      cancelAssignment();

    } catch (error) {
      console.error('❌ 배정 실패:', error);
      
      let errorMessage = '❌ 배정 실패: ';
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += '알 수 없는 오류가 발생했습니다.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  }, [
    selectedRadiologist, 
    selectedTime, 
    estimatedDuration, 
    modalData, 
    isValidWorkHour,
    canProcess,
    setProcessing,
    refreshSchedules,
    radiologists,
    rooms
  ]);

  // ✅ 검사 상태 변경 핸들러들 최적화
  const createExamHandler = useCallback((actionName, apiCall) => {
    return async (roomId, examId) => {
      if (!canProcess()) return;
      
      try {
        setLoading(true);
        setProcessing(true);
        console.log(`${actionName}:`, { roomId, examId });
        
        const result = await apiCall(examId);
        console.log(`${actionName} 결과:`, result);
        
        await refreshSchedules();

        if (workListPanelRef.current?.refreshWorklist) {
          workListPanelRef.current.refreshWorklist();
        }

        alert(`${actionName}이(가) 완료되었습니다.`);
      } catch (error) {
        console.error(`${actionName} 실패:`, error);
        alert(`${actionName} 실패: ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
        setProcessing(false);
      }
    };
  }, [canProcess, setProcessing, refreshSchedules]);

  const handleStartExam = useMemo(() => 
    createExamHandler('검사 시작', worklistService.startExam),
    [createExamHandler]
  );

  const handleCompleteExam = useMemo(() => 
    createExamHandler('검사 완료', worklistService.completeExam),
    [createExamHandler]
  );

  const handleCancelExam = useCallback(async (examId) => {
    if (!window.confirm('정말로 검사를 취소하시겠습니까?')) return;
    if (!canProcess()) return;
    
    try {
      setLoading(true);
      setProcessing(true);
      console.log('검사 취소:', examId);
      
      const result = await worklistService.cancelExam(examId);
      console.log('검사 취소 결과:', result);
      
      await refreshSchedules();

      if (workListPanelRef.current?.refreshWorklist) {
        workListPanelRef.current.refreshWorklist();
      }

      alert('검사가 취소되었습니다.');
    } catch (error) {
      console.error('검사 취소 실패:', error);
      alert(`검사 취소 실패: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  }, [canProcess, setProcessing, refreshSchedules]);

  const cancelAssignment = useCallback(() => {
    setShowAssignmentModal(false);
    setModalData(null);
    setDraggedExam(null);
    setSelectedRadiologist('');
    setSelectedTime('');
    setEstimatedDuration('');
  }, []);

  // ✅ 리사이즈 핸들링 최적화
  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    
    const handleMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // ✅ 디버깅 정보 메모이제이션
  const debugInfo = useMemo(() => ({
    roomsCount: rooms.length,
    radiologistsCount: radiologists.length,
    selectedDateStr: formatDateForAPI(selectedDate),
    schedulesCount: Object.keys(roomSchedules).length,
    isProcessing: isProcessingRef.current,
    scheduleDetails: Object.entries(roomSchedules).map(([roomId, schedules]) => ({
      roomId,
      examCount: schedules?.length || 0
    }))
  }), [rooms.length, radiologists.length, formatDateForAPI, selectedDate, roomSchedules]);

  return (
    <div 
      className="dashboard-main" 
      ref={containerRef}
      style={{
        gridTemplateColumns: `${leftWidth}% 4px ${100 - leftWidth}%`
      }}
    >
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          fontSize: '1.2rem'
        }}>
          <div>⏳ 처리 중... (중복 방지 활성화)</div>
        </div>
      )}
      
      {/* 워크리스트 섹션 */}
      <div className="worklist-section">
        <WorkListPanel 
          ref={workListPanelRef}
          onDragStart={handleDragStart}
          onDateChange={handleDateChange}
          selectedDate={formatDateForAPI(selectedDate)}
        />
      </div>
      
      {/* 드래그 핸들 */}
      <div 
        className="resize-handle"
        onMouseDown={handleMouseDown}
      >
        <div className="resize-line"></div>
      </div>
      
      {/* 스케줄 섹션 */}
      <div className="schedule-section">
        <SchedulePanel 
          draggedExam={draggedExam}
          onDragOver={handleDragOver}
          onExamUpdated={handleExamUpdated}
          roomSchedules={roomSchedules}
          rooms={rooms}
          radiologists={radiologists}
          onStartExam={handleStartExam}
          onCompleteExam={handleCompleteExam}
          onCancelExam={handleCancelExam}
          onRefreshSchedules={refreshSchedules}
        />
      </div>

      {/* 배정 모달 */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={cancelAssignment}
        modalData={modalData}
        rooms={rooms}
        radiologists={radiologists}
        selectedRadiologist={selectedRadiologist}
        selectedTime={selectedTime}
        estimatedDuration={estimatedDuration}
        onRadiologistChange={setSelectedRadiologist}
        onTimeChange={setSelectedTime}
        onDurationChange={setEstimatedDuration}
        onConfirm={confirmAssignment}
      />
      
      {/* 개발용 디버깅 정보 */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          lineHeight: '1.4',
          maxWidth: '300px',
          zIndex: 1000
        }}>
          <div>🏥 검사실: <strong>{debugInfo.roomsCount}개</strong></div>
          <div>👨‍⚕️ 영상전문의: <strong>{debugInfo.radiologistsCount}명</strong></div>
          <div>📅 선택된 날짜: <strong>{debugInfo.selectedDateStr}</strong></div>
          <div>📊 스케줄: <strong>{debugInfo.schedulesCount}개 검사실</strong></div>
          <div>🔒 처리 중: <strong>{debugInfo.isProcessing ? '예' : '아니오'}</strong></div>
          {debugInfo.scheduleDetails.map(({ roomId, examCount }) => (
            <div key={roomId} style={{fontSize: '0.7rem', color: '#94a3b8'}}>
              Room {roomId}: {examCount}개 검사
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
};

export default Dashboard;