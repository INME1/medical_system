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
import LISModelResultPage from './components/LIS/CdssVisualizationPage';
import OpenMRSPatientList from './components/LIS/tests';
import OCSLogPage from './components/OCS/OCSLogPage';
import MainPage from './components/MainPage';
import EmrMainPage from './components/EMR/EmrMainPage';
import PatientList from './components/Main_page/patientsList.jsx';
import SettingsPage from './components/EMR/SettingsPage';
import ReceptionPanel from './components/EMR/ReceptionPanel';
import PatientWaitingList from './components/EMR/PatientWaitingList';
import PatientStatusBoard from './components/EMR/PatientStatusBoard'; 
import CompletedPatients from './components/EMR/CompletedPatients'; 
import StatisticsBoard from './components/Main_page/StatisticsBoard.jsx';
import MainPageFunction from './components/Main_page/main_page_function';
import NoticeBoard from './components/Main_page/Notics_page'; // 새로 추가
// ThemeContext, ReceptionContext 추가
import { ThemeProvider } from './components/EMR/contexts/ThemeContext';
import { ReceptionProvider } from './components/EMR/contexts/ReceptionContext';
import DocDashBoard from './components/DocDashBoard/DocDashBoard';
import TitlePage from  './components/Main_page/TitlePage.js'
import LaCID from './components/Sever_Main_Page/LaCIDPage'
import Login from './components/login/LoginPage.jsx'
import './App.css';

function App() {
  console.log("✅ API URL:", process.env.REACT_APP_API_URL);

  return (
    <ThemeProvider>
      <ReceptionProvider>
        <Router>
          <Routes>
            {/* 기존 메인 페이지 */} {/* 임시 세팅 TitlePage*/}
            <Route path="/" element={<Navigate to="/main" />} />
            <Route path="/main" element={<LaCID />} />

            {/*홈페이지 소개용*/}
            <Route path="/Sever_Main_Page/LaCIDPage" element={<LaCID/>} />
            <Route path= "/Main_page/TitlePage" element={<TitlePage />} />
            {/* 메인 페이지 기능들 */}
            <Route path="/Main_page/StatisticsBoard" element={<StatisticsBoard />} />
            <Route path="/Main_page/main_page_function" element={<MainPageFunction />} />
            <Route path="/Main_page/notices" element={<NoticeBoard />} /> {/* 새로 추가 */}ㄴ
            <Route path="/login" element={<Login />} />
            {/* EMR 페이지 */}
            <Route path="/emr" element={<EmrMainPage />} />
            <Route path="/emr/Settings" element={<SettingsPage />} />
            <Route path="/emr/reception" element={<ReceptionPanel />} />
            <Route path="/emr/waiting" element={<PatientWaitingList />} />
            <Route path="/emr/patient-status" element={<PatientStatusBoard />} />
            <Route path="/emr/completed-patients" element={<CompletedPatients />} />
            <Route path="/doctor-dashboard" element={<DocDashBoard />} />
            {/* LIS 관련 페이지 */}
            <Route path="/lis" element={<LisHome />}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="samples" element={<SampleListPage />} />
              <Route path="order/new" element={<OrderForm />} />
              <Route path="sample/new" element={<SampleForm />} />
              <Route path="sample/new/:orderId" element={<SampleForm />} />
              <Route path="result/new" element={<ResultInputForm />} />
              <Route path="result/new/:sampleId" element={<ResultInputForm />} />
              <Route path="result-list" element={<ResultCdss />} />
              <Route path="cdss/results" element={<LISModelResultPage />} />
              <Route path="cdss/results/:sampleId" element={<LISModelResultPage />} /> 
            </Route>
            <Route path="/tests" element={<OpenMRSPatientList />} />
            <Route path="/logs" element={<OCSLogPage />} />

            {/* 기존 환자 목록 페이지 */}
            <Route path="/Main_page/patients" element={<PatientList />} /> 

            {/* 예외 경로는 메인으로 */}
            <Route path="*" element={<Navigate to="/main" />} />
          </Routes>
        </Router>
      </ReceptionProvider>
    </ThemeProvider>
  );
}

export default App;