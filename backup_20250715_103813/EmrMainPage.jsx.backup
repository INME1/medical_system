// src/components/EMR/EmrMainPage.jsx (깔끔한 의료 전문가용 UI)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import PatientDetailModal from './PatientDetailModal';
import UnifiedPatientStatus from './UnifiedPatientStatus';
import NotificationModal from './NotificationModal';
import { saveLog } from '../utils/saveLog';
import SettingsPage from './SettingsPage';
import RealDicomViewer from '../RIS/RealDicomViewer';

// 기존 컴포넌트들
import WaitingBoard from './WaitingBoard';
import ReceptionPanel from './ReceptionPanel';
import PatientStatusBoard from './PatientStatusBoard';

// 의사 대시보드 컴포넌트
import DocDashBoard from '../DocDashBoard/DocDashBoard';
import '../DocDashBoard/DocDashBoard.css';

// 홈 대시보드용 컴포넌트
import WaitingStatsPanel from './home/WaitingStatsPanel';
import CurrentWaitTime from './home/CurrentWaitTime';
import DailySummary from './home/DailySummary';
import { UrgentWidget } from './home';

// 캘린더 라이브러리
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// 아이콘 추가
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  BarChart3,
  Heart,
  Stethoscope
} from 'lucide-react';

import './EmrMainPage.css';

const EmrMainPage = () => {
  // 🔥 상태 관리 - 필수만 남기고 단순화
  const [activeTab, setActiveTab] = useState('홈');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [fullSelectedPatientData, setFullSelectedPatientData] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);

  // 환자 데이터 상태들 - 기본값으로 설정하여 오류 방지
  const [waitingList, setWaitingList] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState({ 1: null, 2: null });
  const [completedPatients, setCompletedPatients] = useState([]);
  const [allPatientMappings, setAllPatientMappings] = useState([]);

  // 캘린더 상태
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 🔥 오류 방지 상태
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Ref로 타이머 관리
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // 🔥 실제 작동하는 API URL 하드코딩
  const API_ENDPOINTS = {
    RECEPTION_LIST: 'http://35.225.63.41:8000/api/integration/reception-list/',
    WAITING_LIST: 'http://35.225.63.41:8000/api/integration/identifier-waiting/',
    COMPLETED: 'http://35.225.63.41:8000/api/integration/completed-patients/',
    ASSIGN_ROOM: 'http://35.225.63.41:8000/api/integration/assign-room/',
    COMPLETE_TREATMENT: 'http://35.225.63.41:8000/api/integration/complete-treatment/',
    UNASSIGN_ROOM: 'http://35.225.63.41:8000/api/integration/unassign-room/',
  };

  // 🔥 데이터 페칭 함수 - 오류 발생시 중단하고 기본값 사용
  const fetchAllPatientData = useCallback(async () => {
    if (errorCount >= 3) {
      console.log('⚠️ 연속 오류로 인해 API 요청을 중단합니다.');
      return;
    }

    try {
      console.log('🔄 환자 데이터 조회 시도...');
      
      const response = await axios.get(API_ENDPOINTS.RECEPTION_LIST, {
        timeout: 8000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const allData = Array.isArray(response.data) ? response.data : [];
      console.log('✅ 데이터 조회 성공:', allData.length, '명');

      // 상태별 분리
      const waiting = allData.filter(p => 
        p.status === 'waiting' || 
        (!p.assigned_room && p.status !== 'complete')
      );
      
      const assigned = allData.filter(p => 
        p.assigned_room && p.status !== 'complete'
      );
      
      const completed = allData.filter(p => 
        p.status === 'complete'
      );

      // 진료실 배정 객체 생성
      const assignedObj = { 1: null, 2: null };
      assigned.forEach(patient => {
        const room = parseInt(patient.assigned_room);
        if (room && (room === 1 || room === 2) && !assignedObj[room]) {
          assignedObj[room] = patient;
        }
      });

      // 🔥 상태 업데이트 - 직접 업데이트 (비교 로직 제거)
      setWaitingList(waiting);
      setAssignedPatients(assignedObj);
      setCompletedPatients(completed);
      setAllPatientMappings(allData);

      // 🔥 오류 카운트 리셋
      setErrorCount(0);
      setHasError(false);

    } catch (error) {
      console.error('❌ 데이터 조회 실패:', error.message);
      
      // 🔥 오류 카운트 증가
      setErrorCount(prev => prev + 1);
      
      // 404 오류인 경우 에러 상태 설정하지 않음 (데이터 없음으로 처리)
      if (error.response?.status === 404) {
        console.log('📋 데이터가 없습니다. 빈 상태로 유지합니다.');
        setWaitingList([]);
        setAssignedPatients({ 1: null, 2: null });
        setCompletedPatients([]);
      } else {
        setHasError(true);
      }
    }
  }, [errorCount]);

  // 🔥 환자 액션 핸들러들 - 오류 발생시 로컬 상태만 업데이트
  const handleAssignToRoom = useCallback(async (patient, roomNumber) => {
    try {
      // 🔥 먼저 로컬 상태 업데이트 (즉시 반영)
      setWaitingList(prev => prev.filter(p => p.mapping_id !== patient.mapping_id));
      setAssignedPatients(prev => ({
        ...prev,
        [roomNumber]: { ...patient, assigned_room: roomNumber, status: 'in_progress' }
      }));

      // 서버 요청은 백그라운드에서 시도
      const response = await axios.post(API_ENDPOINTS.ASSIGN_ROOM, {
        mapping_id: patient.mapping_id,
        room_number: roomNumber
      }, { timeout: 5000 });

      if (response.status === 200) {
        console.log(`✅ 방 배정 성공: ${patient.display} → ${roomNumber}번실`);
        saveLog(`환자 ${patient.display}를 ${roomNumber}번 방에 배정했습니다.`, 'info');
      }

    } catch (error) {
      console.error('❌ 방 배정 API 실패:', error.message);
      // 🔥 API 실패해도 로컬 상태는 그대로 유지 (UX 개선)
      alert('서버 연결에 문제가 있지만 로컬에서는 처리되었습니다.');
    }
  }, []);

  const handleMarkAsComplete = useCallback(async (patient) => {
    try {
      // 🔥 먼저 로컬 상태 업데이트
      setAssignedPatients(prev => ({
        ...prev,
        [patient.assigned_room]: null
      }));
      
      setCompletedPatients(prev => [
        { ...patient, status: 'complete', last_sync: new Date().toISOString() },
        ...prev
      ]);

      // 서버 요청은 백그라운드에서
      const response = await axios.post(API_ENDPOINTS.COMPLETE_TREATMENT, {
        mapping_id: patient.mapping_id
      }, { timeout: 5000 });

      if (response.status === 200) {
        console.log(`✅ 진료 완료: ${patient.display}`);
        saveLog(`환자 ${patient.display}의 진료를 완료했습니다.`, 'info');
      }

    } catch (error) {
      console.error('❌ 진료 완료 API 실패:', error.message);
      alert('서버 연결에 문제가 있지만 로컬에서는 처리되었습니다.');
    }
  }, []);

  const handleUnassignFromRoom = useCallback(async (patient) => {
    try {
      // 🔥 먼저 로컬 상태 업데이트
      setAssignedPatients(prev => ({
        ...prev,
        [patient.assigned_room]: null
      }));
      
      setWaitingList(prev => [
        ...prev,
        { ...patient, assigned_room: null, status: 'waiting' }
      ]);

      // 서버 요청은 백그라운드에서
      const response = await axios.post(API_ENDPOINTS.UNASSIGN_ROOM, {
        mapping_id: patient.mapping_id
      }, { timeout: 5000 });

      if (response.status === 200) {
        console.log(`✅ 방 배정 해제: ${patient.display}`);
        saveLog(`환자 ${patient.display}의 방 배정을 해제했습니다.`, 'info');
      }

    } catch (error) {
      console.error('❌ 방 배정 해제 API 실패:', error.message);
      alert('서버 연결에 문제가 있지만 로컬에서는 처리되었습니다.');
    }
  }, []);

  // 환자 모달 핸들러 - 단순화
  const handlePatientDetail = useCallback(async (patient) => {
    setSelectedPatient(patient);
    setFullSelectedPatientData(patient); // 🔥 기본 데이터로 모달 열기
    setShowPatientModal(true);
    
    // 상세 데이터는 백그라운드에서 로드
    try {
      const response = await axios.get(`${API_ENDPOINTS.RECEPTION_LIST}${patient.mapping_id}/`, {
        timeout: 5000
      });
      setFullSelectedPatientData(response.data);
    } catch (error) {
      console.log('❌ 상세 정보 로드 실패, 기본 데이터 사용');
    }
  }, []);

  const closePatientModal = useCallback(() => {
    setShowPatientModal(false);
    setFullSelectedPatientData(null);
  }, []);

  const handleTabChange = useCallback((tabName) => {
    if (tabName !== activeTab) {
      setActiveTab(tabName);
    }
  }, [activeTab]);

  // 🔥 Effect 최적화 - 초기 로딩만
  useEffect(() => {
    console.log('🚀 Doc Board 앱 시작');
    fetchAllPatientData();
  }, []);

  // 🔥 주기적 업데이트 - 오류 발생시 간격 늘리기
  useEffect(() => {
    if (errorCount < 3) {
      const updateInterval = errorCount === 0 ? 30000 : 60000; // 오류없으면 30초, 있으면 60초
      
      intervalRef.current = setInterval(() => {
        fetchAllPatientData();
      }, updateInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchAllPatientData, errorCount]);

  // scheduleRefresh 처리
  useEffect(() => {
    if (scheduleRefresh > 0) {
      const refreshTimeout = setTimeout(() => {
        fetchAllPatientData();
      }, 1000);

      return () => clearTimeout(refreshTimeout);
    }
  }, [scheduleRefresh, fetchAllPatientData]);

  // 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 🔥 메모이제이션된 렌더 함수들 - 깔끔한 디자인
  const renderHome = useMemo(() => (
    <div className="page-container-full doctor-dashboard-container">
      {/* 📅 캘린더 카드 */}
      <div className="dashboard-card card--calendar">
        <h3 className="card-header">
          <CalendarIcon className="icon" />
          일정 관리
        </h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <Calendar
            onChange={setCalendarDate}
            value={calendarDate}
            locale="ko-KR"
          />
        </div>
        <div style={{ 
          marginTop: '1rem', 
          textAlign: 'center',
          padding: '1rem',
          background: 'var(--light-gray)',
          borderRadius: 'var(--border-radius)',
          color: 'var(--text-dark)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            선택된 날짜: {calendarDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* 📊 대기 현황 카드 */}
      <div className="dashboard-card card--stats">
        <h3 className="card-header">
          <Users className="icon" />
          진료 현황
        </h3>
        <WaitingStatsPanel
          waitingList={waitingList}
          completedPatients={
            completedPatients
              .slice(0, 3)
              .map(p => ({
                name: p.display || p.name || '환자',
                time: p.last_sync ? new Date(p.last_sync).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '-'
              }))
          }
        />
      </div>

      {/* ⏱️ 대기 시간 카드 */}
      <div className="dashboard-card card--waittime">
        <h3 className="card-header">
          <Clock className="icon" />
          대기 시간
        </h3>
        <CurrentWaitTime waitingList={waitingList} />
      </div>

      {/* 📈 일일 요약 카드 */}
      <div className="dashboard-card card--summary">
        <h3 className="card-header">
          <BarChart3 className="icon" />
          오늘의 요약
        </h3>
        <DailySummary />
      </div>

      {/* 🚨 긴급 알림 카드 */}
      <div className="dashboard-card card--urgent">
        <h3 className="card-header">
          <AlertCircle className="icon" />
          긴급 처리
        </h3>
        <UrgentWidget 
          marquee={false} 
          withTabs={false} 
          showActionButtons={true} 
        />
      </div>

      {/* 💊 건강 지표 카드 */}
      <div className="dashboard-card card--schedule">
        <h3 className="card-header">
          <Heart className="icon" />
          시스템 상태
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          textAlign: 'center'
        }}>
          <Activity size={48} style={{ color: 'var(--primary-purple)' }} />
          <div>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              color: 'var(--text-dark)',
              fontSize: '1.1rem'
            }}>
              시스템 정상 가동 중
            </h4>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-medium)',
              fontSize: '0.9rem'
            }}>
              모든 의료 시스템이 안정적으로 운영되고 있습니다.
            </p>
          </div>
          <div className="medical-badge normal">
            <Activity size={16} />
            정상
          </div>
        </div>
      </div>
    </div>
  ), [calendarDate, waitingList, completedPatients]);

  const renderReception = useMemo(() => (
    <div className="page-container-full">
      <ReceptionPanel
        onReceptionSuccess={() => {
          setActiveTab('환자 관리');
          setScheduleRefresh(prev => prev + 1);
        }}
      />
    </div>
  ), []);

  const renderSettings = useMemo(() => (
    <div className="page-container-full">
      <SettingsPage />
    </div>
  ), []);

  const renderClinicalDashboard = useMemo(() => (
    <div className="page-container-full">
      <UnifiedPatientStatus 
        onAssignSuccess={handleAssignToRoom}
        onMarkAsComplete={handleMarkAsComplete}
        onUnassignFromRoom={handleUnassignFromRoom}
        onDeleteSuccess={() => setScheduleRefresh(prev => prev + 1)}
      />
    </div>
  ), [handleAssignToRoom, handleMarkAsComplete, handleUnassignFromRoom]);

  const renderWaitingBoard = useMemo(() => (
    <div className="page-container-full">
      <WaitingBoard waitingList={waitingList} assignedPatients={assignedPatients} />
    </div>
  ), [waitingList, assignedPatients]);

  const renderPatientStatus = useMemo(() => (
    <div className="page-container-full">
      <PatientStatusBoard onComplete={() => setActiveTab('의사 대시보드')} />
    </div>
  ), []);

  const renderDoctorDashboard = useMemo(() => (
    <DocDashBoard />
  ), []);

  // 🔥 의료영상 뷰어 렌더 함수 추가
  const renderMedicalViewer = useMemo(() => (
    <div className="page-container-full">
      <RealDicomViewer />
    </div>
  ), []);

  return (
    <div className="emr-page">
      {/* 🔥 깔끔한 헤더 - Doc Board */}
      <header className="emr-header">
        <div className="logo" onClick={() => handleTabChange('홈')}>
          <Stethoscope size={32} />
          Doc Board
        </div>
        
        {/* 🔥 상태 표시 - 오류 발생시에만 표시 */}
        {errorCount > 0 && (
          <div className={`status-indicator ${errorCount >= 3 ? 'error' : 'warning'}`}>
            {errorCount >= 3 ? '🔴' : '🟡'} 
            {errorCount >= 3 ? '오프라인 모드' : `연결 문제 (${errorCount}/3)`}
          </div>
        )}
      </header>

      <div className="emr-content">
        {/* 🔥 깔끔한 사이드바 */}
        <aside className="sidebar-col">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            onBellClick={() => setShowNotifModal(true)}
          />
        </aside>

        {/* 🔥 메인 콘텐츠 */}
        <main className="content-col">
          {activeTab === '홈' && renderHome}
          {activeTab === '접수' && renderReception}
          {activeTab === '설정' && renderSettings}
          {activeTab === '환자 관리' && renderClinicalDashboard}
          {activeTab === '대기 화면' && renderWaitingBoard}
          {activeTab === '진료 진행도' && renderPatientStatus}
          {activeTab === '의사 대시보드' && renderDoctorDashboard}
          {activeTab === '의료영상 뷰어' && renderMedicalViewer}
        </main>
      </div>

      {/* 🔥 모달들 */}
      {showNotifModal && (
        <NotificationModal onClose={() => setShowNotifModal(false)} />
      )}
      {showPatientModal && selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          doctorId={localStorage.getItem('doctor_id')}
          onClose={closePatientModal}
          onPatientDeleted={() => {
            setScheduleRefresh(prev => prev + 1);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default EmrMainPage;