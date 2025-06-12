// src/components/EMR/EmrMainPage.jsx

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import PatientDetailModal from './PatientDetailModal';
import PatientWaitingList from './PatientWaitingList';
import ThemeSettings from './Settings/ThemeSettings';
import LogViewer from './Settings/LogViewer';
import HelpGuide from './Settings/HelpGuide';
import NotificationModal from './NotificationModal';
import { saveLog } from '../utils/saveLog';

// 기존 컴포넌트
import ChartHeader from './ChartHeader';
import WaitingRoom from './WaitingRoom';
import PatientInfoPanel from './PatientInfoPanel';
import VisitHistoryPanel from './VisitHistoryPanel';
import LisRequestPanel from './LisRequestPanel';
import ImagingRequestPanel from './ImagingRequestPanel';
import DiagnosisPanel from './DiagnosisPanel';
import WaitingBoard from './WaitingBoard';

// 새 컴포넌트
import AssignedPatientList from './AssignedPatientList';

// 임시 더미 의사 ID
import { DEFAULT_DOCTOR_ID } from './lisConfig';

import {
  DashboardCards,
  ScheduleCalendar,
  UrgentWidget,
} from './home';

import './EmrMainPage.css';

const EmrMainPage = () => {
  const [activeTab, setActiveTab] = useState('홈');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState({ 1: null, 2: null });
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAssignedData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const assignToRoom = async (roomNumber) => {
    if (!selectedPatient) return;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_INTEGRATION_API || 'http://35.225.63.41:8000/api/integration/'}assign-room/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.mapping_id || selectedPatient.id,
          room: roomNumber
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setAssignedPatients(prev => ({ ...prev, [roomNumber]: selectedPatient }));
      refreshAssignedData();
      setSelectedPatient(null);
      saveLog({
        patient_id: selectedPatient.id || selectedPatient.patient_id || selectedPatient.mapping_id,
        patient_name: selectedPatient.name || selectedPatient.display,
        doctor_id: localStorage.getItem('doctor_id') || 'UNKNOWN',
        doctor_name: localStorage.getItem('doctor_name') || '',
        request_type: '진료실 배정',
        request_detail: `진료실 ${roomNumber}번으로 배정됨`,
      });
      alert(`✅ ${selectedPatient.display || selectedPatient.name}님이 진료실 ${roomNumber}번에 배정되었습니다.`);
    } catch (error) {
      console.error('❌ 진료실 배정 실패:', error);
      alert('진료실 배정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const openPatientModal = () => selectedPatient && setShowPatientModal(true);
  const closePatientModal = () => setShowPatientModal(false);

  // ─── 홈 ─────────────────────────────────────────
  const renderHome = () => (
    <div className="page-container-full">
      <div className="home-container">
        <div className="left-column">
          <DashboardCards withProgress withSparkline />
          <UrgentWidget marquee withTabs showActionButtons />
        </div>
        <div className="right-column">
          <ScheduleCalendar enableDragDrop />
        </div>
      </div>
    </div>
  );

  // ─── 설정 ────────────────────────────────────────
  const renderSettings = () => (
    <div className="page-container-full">
      <h2 className="page-title">⚙️ 설정 페이지</h2>
      <div className="card">
        <ThemeSettings />
        <LogViewer />
        <HelpGuide />
      </div>
    </div>
  );

  // ─── 대기 목록 ───────────────────────────────────
  const renderWaitingList = () => (
    <div className="page-container-full">
      <div className="card">
        <PatientWaitingList />
      </div>
    </div>
  );

  // ─── 대기 화면 ───────────────────────────────────
  const renderWaitingBoard = () => (
    <div className="page-container-full">
      <WaitingBoard />
    </div>
  );

  // ─── 진료 ────────────────────────────────────────
  const renderClinical = () => (
    <div className="clinical-container-new">
      {/* 탭1: 진료실 배정된 환자 */}
      <section className="tab-col tab1-new">
        <h3 className="section-title">🧑‍⚕️ 진료실 배정된 환자</h3>
        <AssignedPatientList
          onPatientSelect={setSelectedPatient}
          selectedPatient={selectedPatient}
          refreshTrigger={refreshTrigger}
        />
      </section>

      {/* 탭2: 정보 + 내원 이력 */}
      <section className="tab-col tab2">
        <h3 className="section-title">📄 환자 정보</h3>
        {selectedPatient
          ? <PatientInfoPanel patient={selectedPatient} onOpenDetailModal={openPatientModal} />
          : <p className="empty-text">배정된 환자를 선택해주세요.</p>
        }
        <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
        <h3 className="section-title">📁 내원 이력</h3>
        {selectedPatient
          ? <VisitHistoryPanel patient={selectedPatient} />
          : <p className="empty-text">배정된 환자를 선택해주세요.</p>
        }
      </section>

      {/* 탭3: LIS 검사 요청 */}
      <section className="tab-col tab3">
        <h3 className="section-title">🔬 LIS 검사 요청</h3>
        {selectedPatient
          ? (
            <LisRequestPanel
              patient={selectedPatient}
              doctorId={DEFAULT_DOCTOR_ID}  // 임시 더미 ID
            />
          )
          : <p className="empty-text">배정된 환자를 선택해주세요.</p>
        }
      </section>

      {/* 탭4-5: 영상검사 요청 + AI 판독 */}
      <section className="tab-col tab4-5">
        <div className="imaging-section">
          <h3 className="section-title">🏥 영상검사 요청</h3>
          {selectedPatient
            ? <ImagingRequestPanel selectedPatient={selectedPatient}/>
            : <p className="empty-text">배정된 환자를 선택해주세요.</p>}
        </div>
        <div className="ai-section">
          <h3 className="section-title">🧠 AI 판독</h3>
          {selectedPatient
            ? <DiagnosisPanel patient={selectedPatient}/>
            : <p className="empty-text">배정된 환자를 선택해주세요.</p>}
        </div>
      </section>
    </div>
  );

  return (
    <div className="emr-page">
      <header className="emr-header">
        <div className="logo" onClick={() => setActiveTab('진료')}>
          🏥 EMR 시스템
        </div>
      </header>

      <div className="emr-content">
        <aside className="sidebar-col">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBellClick={() => setShowNotifModal(true)}
          />
        </aside>
        <main className="content-col">
          {activeTab === '홈'        && renderHome()}
          {activeTab === '설정'      && renderSettings()}
          {activeTab === '대기 목록' && renderWaitingList()}
          {activeTab === '대기 화면' && renderWaitingBoard()}
          {activeTab === '진료'      && renderClinical()}
        </main>
      </div>

      {showNotifModal && (
        <NotificationModal onClose={() => setShowNotifModal(false)} onMark={() => {}} />
      )}
      {showPatientModal && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={closePatientModal}
        />
      )}
    </div>
  );
};

export default EmrMainPage;
