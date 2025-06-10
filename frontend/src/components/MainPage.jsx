import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // ✅ react-router-dom에서 Link를 가져옵니다.
import OrderForm from './LIS/OrderForm';
import SampleForm from './LIS/SampleForm';
import DicomViewer2 from './RIS/DicomViewer';
import LisHome from './LIS/LisHome';
import OCSLogPage from './OCS/OCSLogPage';
import LoginPage from './login/LoginPage';
import Calendar from 'react-calendar';
import PatientsList from './patientsList'; // ✅ 컴포넌트 이름을 PascalCase로
import Medicalemployee from './Medicalemployee';
import DicomViewer from './OHIF/OHIFViewer'
import 'react-calendar/dist/Calendar.css';
import './MainPage.css';
import RISPage from '../pacsapp';
export default function MainPage() {
  const [currentTab, setCurrentTab] = useState('order');
  const [username, setUsername] = useState('홍길동'); // 실제 로그인 상태에 따라 변경 필요

  const renderTab = () => {
    switch (currentTab) {
      case 'order': return <OrderForm />;
      case 'sample': return <SampleForm />;
      case 'dicom': return <DicomViewer />;
      case 'lis': return <LisHome />;
      case 'logs': return <OCSLogPage />;
      case 'logins': return <LoginPage />;
      case 'patientsList': return <PatientsList />;
      case 'Medicalemployee': return <Medicalemployee />;
      case 'RISPage': return <RISPage />;  // ✅ pacsapp 탭 추가
      default: return <OrderForm />;
      
    }
  };

  return (
    <div className="main-container">
      {/* 상단 Chart Header */}
      <header className="chart-header">
        <div className="search-bar">
          🔍 환자 검색: <input type="text" placeholder="환자 이름/번호 입력" />
        </div>
      </header>

      <div className="content-body">
        {/* 좌측 사이드바 */}
        <aside className="sidebar">
          <button onClick={() => setCurrentTab('order')}>💊 처방</button>
          <button onClick={() => setCurrentTab('sample')}>🧪 검체</button>
          <button onClick={() => setCurrentTab('dicom')}>🖼️ DICOM</button>
          <button onClick={() => setCurrentTab('lis')}>🏠 LIS</button>
          <button onClick={() => setCurrentTab('logs')}>📄 로그</button>
          <button onClick={() => setCurrentTab('logins')}>🔐 로그인</button>
          <button onClick={() => setCurrentTab('patientsList')}>🧑‍🤝‍🧑 환자 목록</button>
          <button onClick={() => setCurrentTab('Medicalemployee')}>👨‍⚕️ 의료인 정보</button>
          <button onClick={() => window.open('/RISPage', '_blank')}>RISPage</button>

          
          {/* EMR 이동 버튼 */}
          <Link to="/emr"><button>📁 EMR 이동</button></Link>

          {/* 데스크 페이지 이동 버튼 */}

        </aside>

        {/* 메인 패널 */}
        <main className="main-panel">
          <h2>Welcome, Dr. {username}</h2>
          <div className="tab-content">{renderTab()}</div>
        </main>

        {/* 우측 하단 캘린더 */}
        <div className="calendar-container">
          <Calendar />
        </div>
      </div>
    </div>
  );
}
