// // pacsapp/src/App.js - ImagePopup 추가
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import MainLayout from './components/layout/MainLayout';
// import Home from './pages/Home';
// import Dashboard from './pages/Dashboard';
// import PacsPage from './pages/PACS/PacsPage';
// import PacsDocs from './pages/PacsDocs';
// import OHIFViewer from './pages/OHIFViewer'; // 🆕 OHIF 추가
// import ImagePopup from './components/home/ImagePopup'; // 🆕 이미지 팝업 추가
// import { DoctorProvider } from './contexts/DoctorContext';
// import './App.css';
// import './utils/emergencyFix';

// function App() {
//   return (
//     <DoctorProvider>
//       <Router>
//         <MainLayout>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/pacs" element={<PacsPage />} />
//             <Route path="/pacsdocs" element={<PacsDocs />} />
//             <Route path="/ohifviewer" element={<OHIFViewer />} />
            
//             {/* 🆕 새로운 라우트들 추가 */}
//             <Route path="/emr" element={
//               <div style={{
//                 background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)', 
//                 height: '100%', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center',
//                 fontSize: '2rem',
//                 color: 'white',
//                 fontWeight: 'bold',
//                 flexDirection: 'column',
//                 gap: '1rem'
//               }}>
//                 <div>🏥 EMR 시스템</div>
//                 <div style={{ fontSize: '1rem', opacity: 0.8 }}>
//                   Electronic Medical Record
//                 </div>
//               </div>
//             } />
            
//             <Route path="/lis" element={
//               <div style={{
//                 background: 'linear-gradient(45deg, #10b981, #059669)', 
//                 height: '100%', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center',
//                 fontSize: '2rem',
//                 color: 'white',
//                 fontWeight: 'bold',
//                 flexDirection: 'column',
//                 gap: '1rem'
//               }}>
//                 <div>🧪 LIS 시스템</div>
//                 <div style={{ fontSize: '1rem', opacity: 0.8 }}>
//                   Laboratory Information System
//                 </div>
//               </div>
//             } />
            
//             <Route path="/control" element={
//               <div style={{
//                 background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)', 
//                 height: '100%', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center',
//                 fontSize: '2rem',
//                 color: 'white',
//                 fontWeight: 'bold',
//                 flexDirection: 'column',
//                 gap: '1rem'
//               }}>
//                 <div>🎛️ Control Page</div>
//                 <div style={{ fontSize: '1rem', opacity: 0.8 }}>
//                   System Control Panel
//                 </div>
//               </div>
//             } />
            
           
//           </Routes>
//         </MainLayout>
//       </Router>
//     </DoctorProvider>
//   );
// }

// export default App;


// pacsapp/src/App.js - Viewer V2 추가
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import PacsPage from './pages/PACS/PacsPage';
import PacsDocs from './pages/PacsDocs';
import OHIFViewer from './pages/OHIFViewer';
import ImagePopup from './components/home/ImagePopup';
import ViewerPage from './pages/viewer_v2'; // 🆕 Viewer V2 추가
import { DoctorProvider } from './contexts/DoctorContext';
import './App.css';
import './utils/emergencyFix';

function App() {
  return (
    <DoctorProvider>
      <Router>
        {/* 🆕 새창용 독립 라우트 (MainLayout 없이) */}
        {window.location.pathname === '/viewer' ? (
          <ViewerPage />
        ) : (
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pacs" element={<PacsPage />} />
              <Route path="/pacsdocs" element={<PacsDocs />} />
              <Route path="/ohifviewer" element={<OHIFViewer />} />
              
              {/* 🆕 새로운 라우트들 추가 */}
              <Route path="/emr" element={
                <div style={{
                  background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div>🏥 EMR 시스템</div>
                  <div style={{ fontSize: '1rem', opacity: 0.8 }}>
                    Electronic Medical Record
                  </div>
                </div>
              } />
              
              <Route path="/lis" element={
                <div style={{
                  background: 'linear-gradient(45deg, #10b981, #059669)', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div>🧪 LIS 시스템</div>
                  <div style={{ fontSize: '1rem', opacity: 0.8 }}>
                    Laboratory Information System
                  </div>
                </div>
              } />
              
              <Route path="/control" element={
                <div style={{
                  background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div>🎛️ Control Page</div>
                  <div style={{ fontSize: '1rem', opacity: 0.8 }}>
                    System Control Panel
                  </div>
                </div>
              } />
            </Routes>
          </MainLayout>
        )}
      </Router>
    </DoctorProvider>
  );
}

export default App;