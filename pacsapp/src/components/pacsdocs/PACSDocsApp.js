// 화면 전환 관리
// DocumentRequestList → 버튼 클릭 → DocumentPreview
//                    → 버튼 클릭 → Upload 화면  
//                    → 버튼 클릭 → CD굽기 화면
// 콜백 연결
// DocumentRequestList에서 버튼 클릭 시 실제 기능 실행
// 기존 DocumentPreview.js 재사용


// pacsapp/src/components/pacsdocs/PACSDocsApp.js

import React, { useState } from 'react';
import DocumentPreview from './DocumentPreview';
import { pacsdocsService } from '../../services/pacsdocsService';

// 🔥 가정: DocumentRequestList는 이미 있는 컴포넌트
// import DocumentRequestList from './DocumentRequestList';

// 임시로 DocumentRequestList 시뮬레이션 (실제로는 위의 import 사용)
const DocumentRequestList = ({ onShowDocument, onShowUpload, onShowImagingProcess }) => {
  const dummyData = [
    {
      id: 1,
      patientName: '김철수',
      patientId: 'P2025-001234',
      modality: 'CT',
      examPart: '흉부',
      reportingDoctor: '이지은',
      examStatus: '검사완료'
    }
  ];

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>📋 서류 요청 목록</h3>
      
      {dummyData.map(item => (
        <div key={item.id} style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '12px',
          background: '#f9fafb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>{item.patientName} ({item.patientId})</h4>
              <p>{item.modality} - {item.examPart} | 판독의: {item.reportingDoctor}</p>
              <p>상태: {item.examStatus}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button 
                onClick={() => onShowDocument('report_kor', item.patientName, item.modality, item.examPart, item.id)}
                style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
              >
                📄 판독결과지
              </button>
              
              <button 
                onClick={() => onShowUpload('consent_contrast', item.patientName, item.modality, item.examPart)}
                style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
              >
                📤 동의서 업로드
              </button>
              
              <button 
                onClick={() => onShowImagingProcess(item.patientName, item.modality, item.examPart)}
                style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
              >
                💿 CD 굽기
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 🔥 메인 PACSDocsApp 컴포넌트
const PACSDocsApp = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'document', 'upload', 'imaging'
  const [currentContext, setCurrentContext] = useState(null);

  // 🔥 1. 서류 미리보기 처리
  const handleShowDocument = async (docType, patientName, modality, examPart, studyId) => {
    console.log('📄 서류 미리보기 요청:', { docType, patientName, modality, examPart, studyId });
    
    setCurrentContext({
      type: 'document',
      docType,
      patient: { 
        name: patientName, 
        modality, 
        examPart,
        patientName, // DocumentPreview에서 사용
        patientId: `P2025-${String(studyId).padStart(6, '0')}`,
        birthDate: '1985-06-12',
        reportingDoctor: '이지은'
      },
      studyId
    });
    setCurrentView('document');
  };

  // 🔥 2. 동의서 업로드 처리
  const handleShowUpload = (docType, patientName, modality, examPart) => {
    console.log('📤 동의서 업로드 요청:', { docType, patientName, modality, examPart });
    
    setCurrentContext({
      type: 'upload',
      docType,
      patient: { 
        name: patientName, 
        modality, 
        examPart 
      }
    });
    setCurrentView('upload');
  };

  // 🔥 3. CD 굽기 처리 (시뮬레이션)
  const handleShowImagingProcess = (patientName, modality, examPart) => {
    console.log('💿 CD 굽기 요청:', { patientName, modality, examPart });
    
    setCurrentContext({
      type: 'imaging',
      patient: { 
        name: patientName, 
        modality, 
        examPart 
      }
    });
    setCurrentView('imaging');
  };

  // 뒤로 가기
  const handleBack = () => {
    setCurrentView('list');
    setCurrentContext(null);
  };

  // 🔥 메인 렌더링
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 헤더 */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#1f2937', marginBottom: '8px' }}>🏥 PACS 서류 관리 시스템</h1>
          <p style={{ color: '#6b7280' }}>검사별 서류 생성, 업로드, 영상 처리를 통합 관리합니다</p>
        </div>

        {/* 현재 화면 표시 */}
        {currentView === 'list' && (
          <DocumentRequestList
            onShowDocument={handleShowDocument}
            onShowUpload={handleShowUpload}
            onShowImagingProcess={handleShowImagingProcess}
          />
        )}
        
        {currentView === 'document' && currentContext && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>📄 서류 미리보기</h2>
              <button 
                onClick={handleBack} 
                style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                ← 목록으로
              </button>
            </div>
            
            <DocumentPreview
              currentDocument={currentContext.docType}
              currentPatient={currentContext.patient}
              onClosePreview={handleBack}
              viewMode="document"
              studyId={currentContext.studyId}
            />
          </div>
        )}
        
        {currentView === 'upload' && currentContext && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>📤 동의서 업로드</h2>
              <button 
                onClick={handleBack} 
                style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                ← 목록으로
              </button>
            </div>
            
            <DocumentPreview
              currentDocument={currentContext.docType}
              currentPatient={currentContext.patient}
              onClosePreview={handleBack}
              viewMode="upload"
            />
          </div>
        )}
        
        {currentView === 'imaging' && currentContext && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>💿 영상 처리 (CD 굽기)</h2>
              <button 
                onClick={handleBack} 
                style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                ← 목록으로
              </button>
            </div>
            
            <DocumentPreview
              currentDocument={null}
              currentPatient={currentContext.patient}
              onClosePreview={handleBack}
              viewMode="imaging"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PACSDocsApp;