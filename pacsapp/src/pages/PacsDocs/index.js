// // /home/medical_system/pacsapp/src/pages/PacsDocs/index.js

// import React, { useState, useRef } from 'react';
// import DocumentRequestList from '../../components/pacsdocs/DocumentRequestList';
// import DocumentPreview from '../../components/pacsdocs/DocumentPreview';
// import './PacsDocs.css';

// const PacsDocs = () => {
//   const [leftWidth, setLeftWidth] = useState(70);
//   const containerRef = useRef(null);
//   const isDragging = useRef(false);

//   const [currentDocument, setCurrentDocument] = useState(null);
//   const [currentPatient, setCurrentPatient] = useState(null);
//   const [currentStudyId, setCurrentStudyId] = useState(null);
//   const [currentDocumentId, setCurrentDocumentId] = useState(null); // 🔥 추가: documentId 상태
//   const [viewMode, setViewMode] = useState('empty');

//   const handleMouseDown = (e) => {
//     isDragging.current = true;
//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDragging.current || !containerRef.current) return;

//     const container = containerRef.current;
//     const containerRect = container.getBoundingClientRect();
//     const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

//     if (newLeftWidth >= 30 && newLeftWidth <= 80) {
//       setLeftWidth(newLeftWidth);
//     }
//   };

//   const handleMouseUp = () => {
//     isDragging.current = false;
//     document.removeEventListener('mousemove', handleMouseMove);
//     document.removeEventListener('mouseup', handleMouseUp);
//   };

//   // 🔥 수정: documentId 파라미터 추가
//   const handleShowDocument = (docType, patientName, modality, examPart, studyId, documentId) => {
//     console.log('📄 PacsDocs: 문서 미리보기 요청', {
//       docType,
//       patientName,
//       modality,
//       examPart,
//       studyId,
//       documentId  // 🔥 추가
//     });

//     setCurrentDocument(docType);
//     setCurrentPatient({ name: patientName, modality, examPart });
//     setCurrentStudyId(studyId);
//     setCurrentDocumentId(documentId); // 🔥 추가: documentId 저장
//     setViewMode('document');
//   };

//   // 🔥 수정: documentId 파라미터 추가
//   const handleShowUpload = (docType, patientName, modality, examPart, documentId) => {
//     console.log('📝 PacsDocs: 동의서 업로드 요청', {
//       docType,
//       patientName,
//       modality,
//       examPart,
//       documentId  // 🔥 추가
//     });

//     setCurrentDocument(docType);
//     setCurrentPatient({ name: patientName, modality, examPart });
//     setCurrentStudyId(null); // 업로드는 studyId 불필요
//     setCurrentDocumentId(documentId); // 🔥 추가: documentId 저장
//     setViewMode('upload');
//   };

//   // 진료기록영상 프로세스 핸들러 (documentId 불필요)
//   const handleShowImagingProcess = (patientName, modality, examPart) => {
//     console.log('💿 PacsDocs: 진료기록영상 프로세스 요청', {
//       patientName,
//       modality,
//       examPart
//     });

//     setCurrentDocument('imaging_cd');
//     setCurrentPatient({ name: patientName, modality, examPart });
//     setCurrentStudyId(null);
//     setCurrentDocumentId(null); // 🔥 CD 굽기는 documentId 불필요
//     setViewMode('imaging');
//   };

//   const handleClosePreview = () => {
//     console.log('✅ PacsDocs: 미리보기 닫기');
    
//     setCurrentDocument(null);
//     setCurrentPatient(null);
//     setCurrentStudyId(null);
//     setCurrentDocumentId(null); // 🔥 추가: documentId 초기화
//     setViewMode('empty');
//   };

//   return (
//     <div className="pacsdocs-container">
//       <div
//         className="pacsdocs-main"
//         ref={containerRef}
//         style={{
//           gridTemplateColumns: `${leftWidth}% 4px ${100 - leftWidth}%`,
//         }}
//       >
//         {/* 왼쪽: 요청 목록 */}
//         <div className="request-list-section">
//           <DocumentRequestList 
//             onShowDocument={handleShowDocument} // 🔥 documentId 포함된 핸들러
//             onShowUpload={handleShowUpload} // 🔥 documentId 포함된 핸들러
//             onShowImagingProcess={handleShowImagingProcess}
//           />
//         </div>

//         {/* 중간: 리사이즈 핸들 */}
//         <div className="resize-handle" onMouseDown={handleMouseDown}>
//           <div className="resize-line"></div>
//         </div>

//         {/* 오른쪽: 미리보기 */}
//         <div className="preview-section">
//           <DocumentPreview
//             currentDocument={currentDocument}
//             currentPatient={currentPatient}
//             studyId={currentStudyId}
//             documentId={currentDocumentId} // 🔥 추가: documentId 전달
//             viewMode={viewMode}
//             onClosePreview={handleClosePreview}
//           />
          
//           {/* 디버깅용 정보 표시 */}
//           {(currentDocument || currentStudyId || currentDocumentId) && (
//             <div
//               style={{
//                 position: 'absolute',
//                 bottom: '10px',
//                 right: '10px',
//                 padding: '0.5rem',
//                 background: '#f0f8ff',
//                 borderRadius: '4px',
//                 fontSize: '0.8rem',
//                 color: '#4a5568',
//                 border: '1px solid #e2e8f0'
//               }}
//             >
//               현재 선택된 문서: {currentDocument || 'none'}<br/>
//               Study ID: {currentStudyId || 'none'}<br/>
//               Document ID: {currentDocumentId || 'none'}<br/> {/* 🔥 추가 */}
//               View Mode: {viewMode}<br/>
//               환자: {currentPatient?.name || 'none'}<br/>
//               검사: {currentPatient?.modality || 'none'} ({currentPatient?.examPart || 'none'})
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PacsDocs;

// /home/medical_system/pacsapp/src/pages/PacsDocs/index.js

// /home/medical_system/pacsapp/src/pages/PacsDocs/index.js

import React, { useState, useRef, useCallback } from 'react';
import DocumentRequestList from '../../components/pacsdocs/DocumentRequestList';
import DocumentPreview from '../../components/pacsdocs/DocumentPreview';
import './PacsDocs.css';

const PacsDocs = () => {
  const [leftWidth, setLeftWidth] = useState(70);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentStudyId, setCurrentStudyId] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null); // 🔥 추가: documentId 상태
  const [viewMode, setViewMode] = useState('empty');
  
  // 🔥 새로 추가: DocumentRequestList 새로고침 함수를 저장할 상태
  const [refreshDocumentList, setRefreshDocumentList] = useState(null);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    if (newLeftWidth >= 30 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 🔥 수정: useCallback으로 함수 안정화
  const handleDocumentStatusUpdate = useCallback((refreshFn) => {
    console.log('🔄 새로고침 함수 등록됨');
    setRefreshDocumentList(() => refreshFn);
  }, []);

  // 🔥 수정: documentId 파라미터 추가
  const handleShowDocument = (docType, patientName, modality, examPart, studyId, documentId) => {
    console.log('📄 PacsDocs: 문서 미리보기 요청', {
      docType,
      patientName,
      modality,
      examPart,
      studyId,
      documentId  // 🔥 추가
    });

    setCurrentDocument(docType);
    setCurrentPatient({ name: patientName, modality, examPart });
    setCurrentStudyId(studyId);
    setCurrentDocumentId(documentId); // 🔥 추가: documentId 저장
    setViewMode('document');
  };

  // 🔥 수정: documentId 파라미터 추가
  const handleShowUpload = (docType, patientName, modality, examPart, documentId) => {
    console.log('📝 PacsDocs: 동의서 업로드 요청', {
      docType,
      patientName,
      modality,
      examPart,
      documentId  // 🔥 추가
    });

    setCurrentDocument(docType);
    setCurrentPatient({ name: patientName, modality, examPart });
    setCurrentStudyId(null); // 업로드는 studyId 불필요
    setCurrentDocumentId(documentId); // 🔥 추가: documentId 저장
    setViewMode('upload');
  };

  // 진료기록영상 프로세스 핸들러 (documentId 불필요)
  const handleShowImagingProcess = (patientName, modality, examPart) => {
    console.log('💿 PacsDocs: 진료기록영상 프로세스 요청', {
      patientName,
      modality,
      examPart
    });

    setCurrentDocument('imaging_cd');
    setCurrentPatient({ name: patientName, modality, examPart });
    setCurrentStudyId(null);
    setCurrentDocumentId(null); // 🔥 CD 굽기는 documentId 불필요
    setViewMode('imaging');
  };

  // 🔥 수정: 상태 변경 여부를 받아서 목록 새로고침
  const handleClosePreview = (statusChanged = false) => {
    console.log('✅ PacsDocs: 미리보기 닫기', { statusChanged });
    
    setCurrentDocument(null);
    setCurrentPatient(null);
    setCurrentStudyId(null);
    setCurrentDocumentId(null); // 🔥 추가: documentId 초기화
    setViewMode('empty');
    
    // 🔥 새로 추가: 상태가 변경되었으면 목록 새로고침
    if (statusChanged && refreshDocumentList) {
      console.log('🔄 서류 목록 새로고침 실행');
      refreshDocumentList();
    }
  };

  // 🔥 수정: useCallback으로 함수 안정화
  const handleDocumentStatusChange = useCallback(() => {
    console.log('🔄 문서 상태 변경됨 - 목록 새로고침');
    if (refreshDocumentList) {
      refreshDocumentList();
    }
  }, [refreshDocumentList]);

  return (
    <div className="pacsdocs-container">
      <div
        className="pacsdocs-main"
        ref={containerRef}
        style={{
          gridTemplateColumns: `${leftWidth}% 4px ${100 - leftWidth}%`,
        }}
      >
        {/* 왼쪽: 요청 목록 */}
        <div className="request-list-section">
          <DocumentRequestList 
            onShowDocument={handleShowDocument} // 🔥 documentId 포함된 핸들러
            onShowUpload={handleShowUpload} // 🔥 documentId 포함된 핸들러
            onShowImagingProcess={handleShowImagingProcess}
            onDocumentStatusUpdate={handleDocumentStatusUpdate} // 🔥 새로 추가
          />
        </div>

        {/* 중간: 리사이즈 핸들 */}
        <div className="resize-handle" onMouseDown={handleMouseDown}>
          <div className="resize-line"></div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="preview-section">
          <DocumentPreview
            currentDocument={currentDocument}
            currentPatient={currentPatient}
            studyId={currentStudyId}
            documentId={currentDocumentId} // 🔥 추가: documentId 전달
            viewMode={viewMode}
            onClosePreview={handleClosePreview} // 🔥 수정: statusChanged 파라미터 지원
            onStatusChange={handleDocumentStatusChange} // 🔥 새로 추가: 상태 변경 콜백
          />
          
          {/* 디버깅용 정보 표시 */}
          {(currentDocument || currentStudyId || currentDocumentId) && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                padding: '0.5rem',
                background: '#f0f8ff',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#4a5568',
                border: '1px solid #e2e8f0'
              }}
            >
              현재 선택된 문서: {currentDocument || 'none'}<br/>
              Study ID: {currentStudyId || 'none'}<br/>
              Document ID: {currentDocumentId || 'none'}<br/> {/* 🔥 추가 */}
              View Mode: {viewMode}<br/>
              환자: {currentPatient?.name || 'none'}<br/>
              검사: {currentPatient?.modality || 'none'} ({currentPatient?.examPart || 'none'})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacsDocs;