// App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- 기존 컴포넌트 임포트 ---
import SampleForm from './components/LIS/SampleForm';
import LisHome from './components/LIS/LisHome';
import OrderForm from './components/LIS/OrderForm';
import OrderListPage from './components/LIS/OrderListPage';
import SampleListPage from './components/LIS/SampleListPage';
import ResultInputForm from './components/LIS/ResultInputForm';
import ResultCdss from './components/LIS/ResultCdss';
import OpenMRSPatientList from './components/LIS/tests';
import OCSLogPage from './components/OCS/OCSLogPage';
// import VitalAlertBanner from './components/EMR/VitalAlert'; // VitalAlertBanner는 Routes 내에 직접 사용되지 않는 것 같아 주석 처리 (필요시 해제)
import MainPage from './components/MainPage';
import EmrMainPage from './components/EMR/EmrMainPage';
import PatientList from './components/patientsList'; // 기존 환자 목록 (경로 확인 필요)
import SettingsPage from './components/EMR/SettingsPage';
import RISPage from './pacsapp/';
// ---------------------------


// ✅ ThemeContext 추가
import { ThemeProvider } from './components/EMR/contexts/ThemeContext';

import './App.css';

function App() {
  console.log("✅ API URL:", process.env.REACT_APP_API_URL);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* 기존 메인 페이지 */}
          <Route path="/" element={<Navigate to="/main" />} />
          <Route path="/main" element={<MainPage />} />

          {/* EMR 페이지 */}
          <Route path="/emr" element={<EmrMainPage />} />
          <Route path="/emr/Settings" element={<SettingsPage />} />

          {/* LIS 관련 페이지 */}
          <Route path="/lis" element={<LisHome />}>
            <Route path="orders" element={<OrderListPage />} />
            <Route path="samples" element={<SampleListPage />} />
            <Route path="order/new" element={<OrderForm />} />
            <Route path="sample/new" element={<SampleForm />} />
            <Route path="sample/new/:orderId" element={<SampleForm />} />
            <Route path="result/new" element={<ResultInputForm />} />
            <Route path="result/new/:sampleId" element={<ResultInputForm />} />
            <Route path="result-list" element={<ResultCdss />} />
          </Route>
          <Route path="/tests" element={<OpenMRSPatientList />} />
          <Route path="/ocs/log" element={<OCSLogPage />} />
          <Route path="/RISPage" element={<RISPage />} />

          
          {/* 기존 환자 목록 페이지 (이 페이지가 새로운 데스크의 환자 목록과 기능적으로 겹치는지 확인 필요) */}
          <Route path="/patients" element={<PatientList />} /> 

 

          {/* 예외 경로는 메인으로 */}
          <Route path="*" element={<Navigate to="/main" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;