// // pacsapp/src/components/pacsdocs/DocumentRequestList.js

// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { pacsdocsService, requiresContrast, getStatusLabel } from '../../services/pacsdocsService';
// import './DocumentRequestList.css';

// // 🔥 디바운스 함수 추가
// const useDebounce = (value, delay) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// const DocumentRequestList = ({ onShowDocument, onShowUpload, onShowImagingProcess, onDocumentStatusUpdate }) => {
//   // 상태 관리
//   const [studyDocuments, setStudyDocuments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // 필터 상태
//   const [filters, setFilters] = useState({
//     exam_date: new Date().toISOString().split('T')[0],
//     patient_id: '',
//     patient_name: '',
//     modality: '',
//     reporting_doctor: ''
//   });

//   // 🔥 디바운싱 적용 (500ms 지연)
//   const debouncedFilters = useDebounce(filters, 500);

//   // 🔥 데이터 로딩 함수를 useCallback으로 정의
//   const loadData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log('🔎 데이터 로딩 시작, 필터:', debouncedFilters);
      
//       const data = await pacsdocsService.getStudyDocuments(debouncedFilters);
//       console.log('🔎 Fetched study documents:', data);
      
//       const documents = data.results || data || [];
//       console.log('🔎 최종 documents 배열:', documents);
      
//       setStudyDocuments(documents);
//     } catch (err) {
//       console.error('🔎 Failed to fetch study documents:', err);
//       setError('서류 목록을 불러오는데 실패했습니다.');
      
//       console.log('🔎 더미 데이터 사용');
//       setStudyDocuments(getDummyData());
//     } finally {
//       setLoading(false);
//     }
//   }, [debouncedFilters]);

//   // 🔥 디바운싱된 필터로만 API 호출
//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // 🔥 부모 컴포넌트에 새로고침 함수 등록
//   useEffect(() => {
//     if (onDocumentStatusUpdate && typeof onDocumentStatusUpdate === 'function') {
//       onDocumentStatusUpdate(loadData);
//     }
//   }, [onDocumentStatusUpdate, loadData]);

//   const getDummyData = () => {
//     return [
//       {
//         id: 1,
//         patientId: 'P2025-001234',
//         patientName: '김철수',
//         birthDate: '1985-06-12',
//         examPart: '흉부',
//         modality: 'CT',
//         reportingDoctor: '이지은',
//         requestDateTime: '2025-06-24T14:30:00Z',
//         examDateTime: '2025. 6. 27. 오전 11:00',
//         priority: '응급',
//         examStatus: '검사완료',
//         documents: [
//           {
//             id: 1,
//             document_type: { code: 'consent_contrast', name: '조영제 사용 동의서', requires_signature: true },
//             status: 'pending'
//           },
//           {
//             id: 2,
//             document_type: { code: 'report_kor', name: '판독 결과지 (국문)', requires_signature: false },
//             status: 'pending'
//           },
//           {
//             id: 3,
//             document_type: { code: 'export_certificate', name: '반출 확인서', requires_signature: true },
//             status: 'pending'
//           },
//           {
//             id: 4,
//             document_type: { code: 'imaging_cd', name: '진료기록영상 (CD)', requires_signature: false },
//             status: 'pending'
//           }
//         ]
//       }
//     ];
//   };

//   // 🔥 필터 변경 핸들러 최적화 - 즉시 상태만 변경, API 호출은 디바운싱됨
//   const handleFilterChange = useCallback((key, value) => {
//     setFilters(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   }, []);

//   const resetFilters = useCallback(() => {
//     setFilters({
//       exam_date: '',
//       patient_id: '',
//       patient_name: '',
//       modality: '',
//       reporting_doctor: ''
//     });
//   }, []);

//   // 🔥 핸들러들을 useCallback으로 최적화
//   const handleConsentView = useCallback((study, docRequest) => {
//     if (onShowDocument) {
//       onShowDocument(
//         docRequest.document_type.code, 
//         study.patientName,
//         study.modality, 
//         study.examPart,
//         study.id,
//         docRequest.id
//       );
//     }
//   }, [onShowDocument]);

//   const handleConsentUpload = useCallback((study, docRequest) => {
//     if (onShowUpload) {
//       onShowUpload(
//         docRequest.document_type.code, 
//         study.patientName, 
//         study.modality, 
//         study.examPart,
//         docRequest.id
//       );
//     }
//   }, [onShowUpload]);

//   const handleDocumentView = useCallback((study, docRequest) => {
//     if (docRequest.document_type.code === 'imaging_cd' || docRequest.document_type.code === 'imaging_dvd') {
//       if (onShowImagingProcess) {
//         onShowImagingProcess(study.patientName, study.modality, study.examPart);
//       }
//     } else {
//       if (onShowDocument) {
//         onShowDocument(
//           docRequest.document_type.code, 
//           study.patientName,
//           study.modality, 
//           study.examPart,
//           study.id,
//           docRequest.id
//         );
//       }
//     }
//   }, [onShowDocument, onShowImagingProcess]);

//   const handleDocumentUpload = useCallback((study, docRequest) => {
//     if (onShowUpload) {
//       onShowUpload(
//         docRequest.document_type.code, 
//         study.patientName, 
//         study.modality, 
//         study.examPart,
//         docRequest.id
//       );
//     }
//   }, [onShowUpload]);

//   // 🔥 날짜 포맷팅을 useMemo로 최적화
//   const formatExamDateTime = useMemo(() => {
//     return (examDateTime) => {
//       if (!examDateTime) return 'N/A';
      
//       if (typeof examDateTime === 'string' && examDateTime.includes('.')) {
//         return examDateTime;
//       } else {
//         const date = new Date(examDateTime);
//         return (
//           <>
//             {date.toLocaleDateString('ko-KR')}
//             <br />
//             {date.toLocaleTimeString('ko-KR', { 
//               hour: '2-digit', 
//               minute: '2-digit' 
//             })}
//           </>
//         );
//       }
//     };
//   }, []);

//   // 로딩 상태
//   if (loading && studyDocuments.length === 0) {
//     return (
//       <div className="document-request-list">
//         <div className="section-header">📋 서류 요청 목록</div>
//         <div className="loading-message">데이터를 불러오는 중...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="document-request-list">
//       <div className="section-header">📋 서류 요청 목록</div>
      
//       {/* 필터 섹션 */}
//       <div className="filter-section">
//         <div className="filter-row">
//           <div className="filter-item">
//             <span>📅</span>
//             <input
//               type="date"
//               value={filters.exam_date}
//               onChange={(e) => handleFilterChange('exam_date', e.target.value)}
//               className="filter-input"
//             />
//           </div>
          
//           <div className="filter-item">
//             <span>🆔</span>
//             <input
//               type="text"
//               placeholder="환자ID"
//               value={filters.patient_id}
//               onChange={(e) => handleFilterChange('patient_id', e.target.value)}
//               className="filter-input"
//             />
//           </div>
          
//           <div className="filter-item">
//             <span>👤</span>
//             <input
//               type="text"
//               placeholder="환자명"
//               value={filters.patient_name}
//               onChange={(e) => handleFilterChange('patient_name', e.target.value)}
//               className="filter-input patient-filter"
//             />
//           </div>
//         </div>

//         <div className="filter-row">
//           <div className="filter-item">
//             <span>📋</span>
//             <select
//               value={filters.modality}
//               onChange={(e) => handleFilterChange('modality', e.target.value)}
//               className="filter-input"
//             >
//               <option value="">모든 검사</option>
//               <option value="CT">CT</option>
//               <option value="MR">MR</option>
//               <option value="CR">CR</option>
//               <option value="DX">DX</option>
//               <option value="US">US</option>
//               <option value="XA">XA</option>
//               <option value="MG">MG</option>
//               <option value="NM">NM</option>
//               <option value="PT">PT</option>
//             </select>
//           </div>
          
//           <div className="filter-item">
//             <span>👨‍⚕️</span>
//             <input
//               type="text"
//               placeholder="판독의"
//               value={filters.reporting_doctor}
//               onChange={(e) => handleFilterChange('reporting_doctor', e.target.value)}
//               className="filter-input"
//             />
//           </div>
          
//           <div className="filter-buttons">
//             <button className="btn btn-primary" onClick={loadData}>
//               🔎 검색
//             </button>
//             <button className="btn btn-secondary" onClick={resetFilters}>
//               🔄 초기화
//             </button>
//           </div>
//         </div>
        
//         {/* 🔥 디바운싱 상태 표시 */}
//         {loading && (
//           <div className="filter-loading">
//             ⏳ 검색 중... ({JSON.stringify(debouncedFilters) !== JSON.stringify(filters) ? '입력 대기중' : '조회중'})
//           </div>
//         )}
//       </div>

//       {/* 에러 메시지 */}
//       {error && (
//         <div className="error-message">⚠️ {error}</div>
//       )}
      
//       {/* 테이블 */}
//       <div className="table-container">
//         <table className="pacsdocs-table">
//           <thead>
//             <tr>
//               <th>No</th>
//               <th>환자ID</th>
//               <th>환자명</th>
//               <th>검사부위</th>
//               <th>모달리티</th>
//               <th>판독의</th>
//               <th>검사일시</th>
//               <th>서류</th> 
//               <th>비고</th>
//             </tr>
//           </thead>
//           <tbody>
//             {studyDocuments.map((study, index) => {
//               const allDocuments = study.documents || [];
              
//               return (
//                 <tr 
//                   key={study.id} 
//                   className={study.priority === '응급' ? 'urgent-row' : ''}
//                 >
//                   <td className="number-cell">{index + 1}</td>
//                   <td>{study.patientId}</td>
//                   <td className="patient-cell">
//                     {study.patientName}
//                     <div className="patient-id">{study.birthDate}</div>
//                   </td>
//                   <td>{study.examPart}</td>
//                   <td className={`modality-cell modality-${study.modality?.toLowerCase()}`}>
//                     {study.modality}
//                   </td>
//                   <td>{study.reportingDoctor}</td>
//                   <td>{formatExamDateTime(study.examDateTime)}</td>
                  
//                   {/* 통합된 필요서류 열 */}
//                   <td>
//                     <div className="all-documents">
//                       {allDocuments.map(doc => {
//                         const isConsent = doc.document_type.code === 'consent_contrast';
//                         const isImaging = doc.document_type.code.includes('imaging');
                        
//                         return (
//                           <div key={doc.id} className={`unified-document ${isConsent ? 'consent-doc' : 'regular-doc'}`}>
//                             <div className="doc-content">
//                               <span className={`doc-name ${isConsent ? 'consent-name' : 'regular-name'}`}>
//                                 {doc.document_type.name}
//                               </span>
                              
//                               <div className="doc-actions-simple">
//                                 <button 
//                                   className="simple-btn view-btn"
//                                   onClick={() => isImaging ? 
//                                     handleDocumentView(study, doc) : 
//                                     (isConsent ? handleConsentView(study, doc) : handleDocumentView(study, doc))
//                                   }
//                                   title={isImaging ? 'CD 굽기 프로세스' : '빈 서류 보기/인쇄'}
//                                 >
//                                   👁️
//                                 </button>
                                
//                                 {doc.document_type.requires_signature && (
//                                   <button 
//                                     className="simple-btn upload-btn"
//                                     onClick={() => isConsent ? 
//                                       handleConsentUpload(study, doc) : 
//                                       handleDocumentUpload(study, doc)
//                                     }
//                                     title="서명된 서류 업로드"
//                                   >
//                                     📤
//                                   </button>
//                                 )}
//                               </div>
//                             </div>
                            
//                             {isImaging && (
//                               <div className="imaging-info-line">
//                                 위임장/동의서 필요
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </td>
                  
//                   {/* 비고 열 */}
//                   <td className="remarks-section">
//                     <div className="status-boxes">
//                       {allDocuments.map(doc => {
//                         // 🔥 간단한 상태 표시: 대기중 / 완료만
//                         const statusText = doc.status === 'completed' ? '완료' : '대기중';
//                         const statusClass = doc.status === 'completed' ? 'status-completed' : 'status-pending';
                        
//                         return (
//                           <div key={doc.id} className={`status-box ${statusClass}`}>
//                             {statusText}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* 데이터가 없을 때 */}
//       {!loading && studyDocuments.length === 0 && (
//         <div className="empty-message">
//           📋 검색 조건에 맞는 서류 요청이 없습니다.
//         </div>
//       )}
//     </div>
//   );
// };

// export default DocumentRequestList;

// pacsapp/src/components/pacsdocs/DocumentRequestList.js
// pacsapp/src/components/pacsdocs/DocumentRequestList.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { pacsdocsService, requiresContrast, getStatusLabel } from '../../services/pacsdocsService';
import './DocumentRequestList.css';

// 🔥 디바운스 함수 추가
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const DocumentRequestList = ({ onShowDocument, onShowUpload, onShowImagingProcess, onDocumentStatusUpdate }) => {
  // 상태 관리
  const [studyDocuments, setStudyDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    exam_date: new Date().toISOString().split('T')[0],
    patient_id: '',
    patient_name: '',
    modality: '',
    reporting_doctor: ''
  });

  // 🔥 디바운싱 적용 (500ms 지연)
  const debouncedFilters = useDebounce(filters, 500);

  // 🔥 데이터 로딩 함수를 useCallback으로 정의
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔎 데이터 로딩 시작, 필터:', debouncedFilters);
      
      const data = await pacsdocsService.getStudyDocuments(debouncedFilters);
      console.log('🔎 Fetched study documents:', data);
      
      const documents = data.results || data || [];
      console.log('🔎 최종 documents 배열:', documents);
      
      setStudyDocuments(documents);
    } catch (err) {
      console.error('🔎 Failed to fetch study documents:', err);
      setError('서류 목록을 불러오는데 실패했습니다.');
      
      console.log('🔎 더미 데이터 사용');
      setStudyDocuments(getDummyData());
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters]);

  // 🔥 디바운싱된 필터로만 API 호출
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 🔥 상태 업데이트 후 동일한 필터로 새로고침하는 함수
  const refreshCurrentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🔥 현재 filters (디바운싱 안 된) 상태를 사용해서 즉시 새로고침
      console.log('🔄 상태 변경 후 즉시 새로고침, 필터:', filters);
      
      const data = await pacsdocsService.getStudyDocuments(filters);
      console.log('🔎 Refreshed study documents:', data);
      
      const documents = data.results || data || [];
      console.log('🔎 새로고침된 documents 배열:', documents);
      
      setStudyDocuments(documents);
    } catch (err) {
      console.error('🔎 Failed to refresh study documents:', err);
      setError('서류 목록 새로고침에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]); // debouncedFilters 대신 filters 사용

  const getDummyData = () => {
    return [
      {
        id: 1,
        patientId: 'P2025-001234',
        patientName: '김철수',
        birthDate: '1985-06-12',
        examPart: '흉부',
        modality: 'CT',
        reportingDoctor: '이지은',
        requestDateTime: '2025-06-24T14:30:00Z',
        examDateTime: '2025. 6. 27. 오전 11:00',
        priority: '응급',
        examStatus: '검사완료',
        documents: [
          {
            id: 1,
            document_type: { code: 'consent_contrast', name: '조영제 사용 동의서', requires_signature: true },
            status: 'pending'
          },
          {
            id: 2,
            document_type: { code: 'report_kor', name: '판독 결과지 (국문)', requires_signature: false },
            status: 'pending'
          },
          {
            id: 3,
            document_type: { code: 'export_certificate', name: '반출 확인서', requires_signature: true },
            status: 'pending'
          },
          {
            id: 4,
            document_type: { code: 'imaging_cd', name: '진료기록영상 (CD)', requires_signature: false },
            status: 'pending'
          }
        ]
      }
    ];
  };

  // 🔥 로컬 상태 업데이트 함수 수정 - CD 지원 추가
  const updateDocumentStatus = useCallback((studyId, documentId, newStatus) => {
    console.log('🎯 상태 업데이트 요청:', { studyId, documentId, newStatus });
    
    setStudyDocuments(prevStudies => 
      prevStudies.map(study => {
        if (study.id !== studyId) return study;
        
        return {
          ...study,
          documents: study.documents.map(doc => {
            // 🔥 CD인 경우: document_type.code로 찾기
            if (documentId === 'imaging_cd' && doc.document_type.code === 'imaging_cd') {
              console.log('📀 CD 상태 업데이트:', doc.document_type.name, '->', newStatus);
              return { ...doc, status: newStatus };
            }
            // 🔥 일반 문서인 경우: document ID로 찾기  
            else if (doc.id === documentId) {
              console.log('📄 문서 상태 업데이트:', doc.document_type.name, '->', newStatus);
              return { ...doc, status: newStatus };
            }
            return doc;
          })
        };
      })
    );
  }, []);

  // 🔥 상태 변경 핸들러 - CD는 서버 동기화 스킵
  const handleStatusUpdate = useCallback(async (studyId, documentId, newStatus) => {
    console.log('🔄 handleStatusUpdate 호출:', { studyId, documentId, newStatus });
    
    // 🔥 CD인 경우: 로컬 상태만 업데이트, 서버 동기화 안함
    if (documentId === 'imaging_cd') {
      console.log('📀 CD 상태 변경 - 로컬만 업데이트');
      updateDocumentStatus(studyId, documentId, newStatus);
      return;
    }
    
    // 🔥 일반 문서인 경우: 서버 동기화 + 로컬 상태 업데이트
    try {
      console.log('📄 일반 문서 상태 변경 - 서버 동기화 시작');
      await pacsdocsService.updateDocumentStatus(documentId, newStatus);
      console.log('✅ 서버 동기화 완료');
      
      updateDocumentStatus(studyId, documentId, newStatus);
      
      // 🔥 성공 후 데이터 새로고침
      refreshCurrentData();
    } catch (error) {
      console.error('❌ 상태 업데이트 실패:', error);
      setError('문서 상태 업데이트에 실패했습니다.');
    }
  }, [updateDocumentStatus, refreshCurrentData]);

  // 🔥 부모 컴포넌트에 함수 등록 - 기존 방식 유지하면서 확장
  useEffect(() => {
    if (onDocumentStatusUpdate && typeof onDocumentStatusUpdate === 'function') {
      console.log('🔄 부모에게 새로고침 함수 등록');
      
      // 🔥 기본적으로는 새로고침 함수를 전달하되, 추가 속성으로 다른 함수들도 전달
      const refreshFunction = refreshCurrentData;
      
      // 🔥 함수에 추가 메서드들을 속성으로 붙여서 전달
      refreshFunction.updateStatus = handleStatusUpdate;
      refreshFunction.updateDocumentStatus = updateDocumentStatus;
      refreshFunction.refreshDocumentList = refreshCurrentData;
      
      onDocumentStatusUpdate(refreshFunction);
    }
  }, [onDocumentStatusUpdate, refreshCurrentData, handleStatusUpdate, updateDocumentStatus]);

  // 🔥 필터 변경 핸들러 최적화 - 즉시 상태만 변경, API 호출은 디바운싱됨
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      exam_date: '',
      patient_id: '',
      patient_name: '',
      modality: '',
      reporting_doctor: ''
    });
  }, []);

  // 🔥 핸들러들을 useCallback으로 최적화
  const handleConsentView = useCallback((study, docRequest) => {
    if (onShowDocument) {
      onShowDocument(
        docRequest.document_type.code, 
        study.patientName,
        study.modality, 
        study.examPart,
        study.id,
        docRequest.id
      );
    }
  }, [onShowDocument]);

  const handleConsentUpload = useCallback((study, docRequest) => {
    if (onShowUpload) {
      onShowUpload(
        docRequest.document_type.code, 
        study.patientName, 
        study.modality, 
        study.examPart,
        docRequest.id
      );
    }
  }, [onShowUpload]);

  const handleDocumentView = useCallback((study, docRequest) => {
    if (docRequest.document_type.code === 'imaging_cd' || docRequest.document_type.code === 'imaging_dvd') {
      if (onShowImagingProcess) {
        onShowImagingProcess(study.patientName, study.modality, study.examPart);
      }
    } else {
      if (onShowDocument) {
        onShowDocument(
          docRequest.document_type.code, 
          study.patientName,
          study.modality, 
          study.examPart,
          study.id,
          docRequest.id
        );
      }
    }
  }, [onShowDocument, onShowImagingProcess]);

  const handleDocumentUpload = useCallback((study, docRequest) => {
    if (onShowUpload) {
      onShowUpload(
        docRequest.document_type.code, 
        study.patientName, 
        study.modality, 
        study.examPart,
        docRequest.id
      );
    }
  }, [onShowUpload]);

  // 🔥 날짜 포맷팅을 useMemo로 최적화
  const formatExamDateTime = useMemo(() => {
    return (examDateTime) => {
      if (!examDateTime) return 'N/A';
      
      if (typeof examDateTime === 'string' && examDateTime.includes('.')) {
        return examDateTime;
      } else {
        const date = new Date(examDateTime);
        return (
          <>
            {date.toLocaleDateString('ko-KR')}
            <br />
            {date.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </>
        );
      }
    };
  }, []);

  // 로딩 상태
  if (loading && studyDocuments.length === 0) {
    return (
      <div className="document-request-list">
        <div className="section-header">📋 서류 요청 목록</div>
        <div className="loading-message">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="document-request-list">
      <div className="section-header">📋 서류 요청 목록</div>
      
      {/* 필터 섹션 */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-item">
            <span>📅</span>
            <input
              type="date"
              value={filters.exam_date}
              onChange={(e) => handleFilterChange('exam_date', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-item">
            <span>🆔</span>
            <input
              type="text"
              placeholder="환자ID"
              value={filters.patient_id}
              onChange={(e) => handleFilterChange('patient_id', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-item">
            <span>👤</span>
            <input
              type="text"
              placeholder="환자명"
              value={filters.patient_name}
              onChange={(e) => handleFilterChange('patient_name', e.target.value)}
              className="filter-input patient-filter"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-item">
            <span>📋</span>
            <select
              value={filters.modality}
              onChange={(e) => handleFilterChange('modality', e.target.value)}
              className="filter-input"
            >
              <option value="">모든 검사</option>
              <option value="CT">CT</option>
              <option value="MR">MR</option>
              <option value="CR">CR</option>
              <option value="DX">DX</option>
              <option value="US">US</option>
              <option value="XA">XA</option>
              <option value="MG">MG</option>
              <option value="NM">NM</option>
              <option value="PT">PT</option>
            </select>
          </div>
          
          <div className="filter-item">
            <span>👨‍⚕️</span>
            <input
              type="text"
              placeholder="판독의"
              value={filters.reporting_doctor}
              onChange={(e) => handleFilterChange('reporting_doctor', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button className="btn btn-primary" onClick={loadData}>
              🔎 검색
            </button>
            <button className="btn btn-secondary" onClick={resetFilters}>
              🔄 초기화
            </button>
          </div>
        </div>
        
        {/* 🔥 디바운싱 상태 표시 */}
        {loading && (
          <div className="filter-loading">
            ⏳ 검색 중... ({JSON.stringify(debouncedFilters) !== JSON.stringify(filters) ? '입력 대기중' : '조회중'})
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="error-message">⚠️ {error}</div>
      )}
      
      {/* 테이블 */}
      <div className="table-container">
        <table className="pacsdocs-table">
          <thead>
            <tr>
              <th>No</th>
              <th>환자ID</th>
              <th>환자명</th>
              <th>검사부위</th>
              <th>모달리티</th>
              <th>판독의</th>
              <th>검사일시</th>
              <th>서류</th> 
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {studyDocuments.map((study, index) => {
              const allDocuments = study.documents || [];
              
              return (
                <tr 
                  key={study.id} 
                  className={study.priority === '응급' ? 'urgent-row' : ''}
                >
                  <td className="number-cell">{index + 1}</td>
                  <td>{study.patientId}</td>
                  <td className="patient-cell">
                    {study.patientName}
                    <div className="patient-id">{study.birthDate}</div>
                  </td>
                  <td>{study.examPart}</td>
                  <td className={`modality-cell modality-${study.modality?.toLowerCase()}`}>
                    {study.modality}
                  </td>
                  <td>{study.reportingDoctor}</td>
                  <td>{formatExamDateTime(study.examDateTime)}</td>
                  
                  {/* 통합된 필요서류 열 */}
                  <td>
                    <div className="all-documents">
                      {allDocuments.map(doc => {
                        const isConsent = doc.document_type.code === 'consent_contrast';
                        const isImaging = doc.document_type.code.includes('imaging');
                        
                        return (
                          <div key={doc.id} className={`unified-document ${isConsent ? 'consent-doc' : 'regular-doc'}`}>
                            <div className="doc-content">
                              <span className={`doc-name ${isConsent ? 'consent-name' : 'regular-name'}`}>
                                {doc.document_type.name}
                              </span>
                              
                              <div className="doc-actions-simple">
                                <button 
                                  className="simple-btn view-btn"
                                  onClick={() => isImaging ? 
                                    handleDocumentView(study, doc) : 
                                    (isConsent ? handleConsentView(study, doc) : handleDocumentView(study, doc))
                                  }
                                  title={isImaging ? 'CD 굽기 프로세스' : '빈 서류 보기/인쇄'}
                                >
                                  👁️
                                </button>
                                
                                {doc.document_type.requires_signature && (
                                  <button 
                                    className="simple-btn upload-btn"
                                    onClick={() => isConsent ? 
                                      handleConsentUpload(study, doc) : 
                                      handleDocumentUpload(study, doc)
                                    }
                                    title="서명된 서류 업로드"
                                  >
                                    📤
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {isImaging && (
                              <div className="imaging-info-line">
                                위임장/동의서 필요
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  
                  {/* 비고 열 */}
                  <td className="remarks-section">
                    <div className="status-boxes">
                      {allDocuments.map(doc => {
                        // 🔥 간단한 상태 표시: 대기중 / 완료만
                        const statusText = doc.status === 'completed' ? '완료' : '대기중';
                        const statusClass = doc.status === 'completed' ? 'status-completed' : 'status-pending';
                        
                        return (
                          <div key={doc.id} className={`status-box ${statusClass}`}>
                            {statusText}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 데이터가 없을 때 */}
      {!loading && studyDocuments.length === 0 && (
        <div className="empty-message">
          📋 검색 조건에 맞는 서류 요청이 없습니다.
        </div>
      )}
    </div>
  );
};

export default DocumentRequestList;