// // pacsapp/src/components/pacsdocs/DocumentPreview.js
// // 🔥 CD 굽기 시뮬레이션 최적// pacsapp/src/components/pacsdocs/DocumentPreview.js

// import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// import { pacsdocsService } from '../../services/pacsdocsService';
// import { generatePDF } from '../../utils/pacsdocs/pdfGenerator';
// import { printDocument } from '../../utils/pacsdocs/printGenerator';
// import { DOC_NAMES, DOC_DISPLAY_NAMES } from '../../utils/pacsdocs/documentTypes';
// import './DocumentPreview.css';

// const DocumentPreview = ({ 
//   currentDocument, 
//   currentPatient, 
//   onClosePreview,
//   onStatusChange,
//   viewMode = 'empty',
//   studyId = null,
//   documentId = null
// }) => {
//   // API 데이터 상태
//   const [documentData, setDocumentData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // 파일 업로드 상태
//   const [uploadedFile, setUploadedFile] = useState(null);
//   const [uploadLoading, setUploadLoading] = useState(false);
//   const fileInputRef = useRef(null);
  
//   // 진료기록영상 프로세스 상태 (다단계)
//   const [imagingStep, setImagingStep] = useState(1);
//   const [imagingFiles, setImagingFiles] = useState([]);
//   const [cdBurning, setCdBurning] = useState(false);
//   const [cdProgress, setCdProgress] = useState(0);
//   const imagingFileInputRef = useRef(null);

//   // 서류 데이터 로딩
//   useEffect(() => {
//     if (viewMode === 'document' && currentDocument && studyId) {
//       loadDocumentData();
//     }
//   }, [viewMode, currentDocument, studyId]);

//   // API 호출하여 서류 데이터 가져오기
//   const loadDocumentData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const data = await pacsdocsService.previewDocument(studyId, currentDocument);
//       console.log('받은 문서 데이터:', data);
      
//       setDocumentData(data);
//     } catch (err) {
//       console.error('문서 데이터 로딩 실패:', err);
//       setError('문서를 불러오는데 실패했습니다.');
//     } finally {
//       setLoading(false);
//     }
//   }, [studyId, currentDocument]);

//   // 🔥 템플릿 변수 치환 함수 최적화 - useMemo 사용
//   const renderedTemplate = useMemo(() => {
//     if (!documentData?.template_content || !documentData) return '';

//     let rendered = documentData.template_content;
    
//     // 🔥 배치 처리로 성능 최적화
//     const replacements = [
//       [/\{\{patient_name\}\}/g, documentData.patientName || ''],
//       [/\{\{patientName\}\}/g, documentData.patientName || ''],
//       [/\{\{patient_id\}\}/g, documentData.patientId || ''],
//       [/\{\{patientId\}\}/g, documentData.patientId || ''],
//       [/\{\{birthdate\}\}/g, documentData.birthDate || ''],
//       [/\{\{birth_date\}\}/g, documentData.birthDate || ''],
//       [/\{\{birthDate\}\}/g, documentData.birthDate || ''],
//       [/\{\{study_name\}\}/g, documentData.study_name || ''],
//       [/\{\{exam_body_part\}\}/g, documentData.examPart || ''],
//       [/\{\{body_part\}\}/g, documentData.examPart || ''],
//       [/\{\{examPart\}\}/g, documentData.examPart || ''],
//       [/\{\{exam_date\}\}/g, documentData.exam_date || ''],
//       [/\{\{exam_location\}\}/g, '영상의학과'],
//       [/\{\{technologist_name\}\}/g, '김기사'],
//       [/\{\{issue_date\}\}/g, documentData.report_date || ''],
//       [/\{\{issuer_name\}\}/g, '시스템관리자'],
//       [/\{\{radiologist_name\}\}/g, documentData.reportingDoctor || 'TBD'],
//       [/\{\{reportingDoctor\}\}/g, documentData.reportingDoctor || 'TBD'],
//       [/\{\{report_date\}\}/g, documentData.report_date || ''],
//       [/\{\{modality\}\}/g, documentData.modality || '']
//     ];

//     // 🔥 비동기적으로 처리하여 성능 개선
//     replacements.forEach(([pattern, replacement]) => {
//       rendered = rendered.replace(pattern, replacement);
//     });
    
//     return rendered;
//   }, [documentData]);

//   // 파일 업로드 핸들러
//   const handleFileUpload = useCallback((event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
//       if (!allowedTypes.includes(file.type)) {
//         alert('지원하지 않는 파일 형식입니다. PDF, JPG, PNG 파일만 업로드 가능합니다.');
//         return;
//       }
      
//       if (file.size > 10 * 1024 * 1024) {
//         alert('파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
//         return;
//       }
      
//       setUploadedFile(file);
//     }
//   }, []);

//   // 업로드 완료 처리
//   const handleCompleteUpload = useCallback(async () => {
//     if (!uploadedFile) {
//       alert('업로드할 파일을 선택해주세요.');
//       return;
//     }

//     try {
//       setUploadLoading(true);
      
//       await pacsdocsService.uploadFile(uploadedFile, {
//         document_type: currentDocument,
//         patient_name: currentPatient?.name,
//         modality: currentPatient?.modality
//       });
      
//       alert('✅ 스캔 업로드가 완료되었습니다!\n동의서 처리가 완료되었습니다.');
      
//       setUploadedFile(null);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
      
//       if (onStatusChange) {
//         onStatusChange();
//       }
      
//       if (onClosePreview) {
//         onClosePreview(true);
//       }
      
//     } catch (error) {
//       console.error('Upload failed:', error);
//       alert('업로드에 실패했습니다. 다시 시도해주세요.');
//     } finally {
//       setUploadLoading(false);
//     }
//   }, [uploadedFile, currentDocument, currentPatient, onStatusChange, onClosePreview]);

//   // 진료기록영상 파일 업로드
//   const handleImagingUpload = useCallback((event) => {
//     const files = Array.from(event.target.files);
//     if (files.length > 0) {
//       setImagingFiles(files);
//       if (files.length >= 1) {
//         alert(`${files.length}개 파일이 업로드되었습니다.`);
//       }
//     }
//   }, []);

//   // 진료기록영상 프로세스 단계별 처리
//   const handleImagingStep = useCallback((step) => {
//     switch (step) {
//       case 1:
//         if (imagingFiles.length < 1) {
//           alert('위임장 또는 동의서를 업로드해주세요.');
//           return;
//         }
//         setImagingStep(2);
//         break;
//       case 2:
//         handleCDBurn();
//         break;
//       case 3:
//         if (currentPatient) {
//           const event = new CustomEvent('showExportCertificate', {
//             detail: {
//               patient: currentPatient,
//               docType: 'export_certificate'
//             }
//           });
//           window.dispatchEvent(event);
//         }
//         break;
//       default:
//         break;
//     }
//   }, [imagingFiles.length, currentPatient]);

//   // 🔥 CD 굽기 시뮬레이션 최적화 - requestAnimationFrame 사용
//   const handleCDBurn = useCallback(async () => {
//     try {
//       setCdBurning(true);
//       setCdProgress(0);

//       // 🔥 requestAnimationFrame으로 성능 최적화
//       let progress = 0;
//       const updateProgress = () => {
//         progress += Math.random() * 3;
//         if (progress < 90) {
//           setCdProgress(Math.min(progress, 90));
//           requestAnimationFrame(updateProgress);
//         } else {
//           setCdProgress(90);
//         }
//       };
      
//       requestAnimationFrame(updateProgress);

//       // 🔥 비동기 처리로 UI 블로킹 방지
//       await new Promise(resolve => {
//         setTimeout(async () => {
//           setCdProgress(100);
          
//           setTimeout(async () => {
//             setCdBurning(false);
//             setCdProgress(0);
//             setImagingStep(3);
            
//             // 🔥 CD 굽기 완료 시 상태 업데이트
//             if (documentId) {
//               try {
//                 await pacsdocsService.updateCDStatus(studyId, documentId);
//                 console.log('✅ CD 상태 업데이트 완료');
//               } catch (error) {
//                 console.error('❌ CD 상태 업데이트 실패:', error);
//               }
//             }
            
//             alert('💿 CD 굽기가 완료되었습니다!\n\n반출 확인서를 작성해주세요.');
            
//             // 🔥 상태 변경 알림
//             if (onStatusChange) {
//               onStatusChange();
//             }
//             resolve();
//           }, 500);
//         }, 2000); // 3초에서 2초로 단축
//       });

//       console.log('💿 CD 굽기 시뮬레이션 완료');
      
//     } catch (error) {
//       console.error('CD 굽기 시뮬레이션 오류:', error);
//       setCdBurning(false);
//       setCdProgress(0);
//       alert('CD 굽기 중 오류가 발생했습니다.');
//     }
//   }, [onStatusChange, documentId, studyId]);

//   // 실제 인쇄 기능
//   const handlePrint = useCallback(() => {
//     if (!documentData) {
//       alert('문서 데이터를 불러오는 중입니다. 잠시 후 시도해주세요.');
//       return;
//     }

//     const docDisplayName = DOC_DISPLAY_NAMES[currentDocument] || '문서';
//     printDocument(documentData, docDisplayName);
//   }, [documentData, currentDocument]);

//   // 실제 PDF 저장 기능
//   const handleSave = useCallback(async () => {
//     if (!documentData) {
//       alert('문서 데이터를 불러오는 중입니다. 잠시 후 시도해주세요.');
//       return;
//     }

//     const docFileName = DOC_NAMES[currentDocument] || '문서';
//     await generatePDF(documentData, docFileName, currentDocument);
//   }, [documentData, currentDocument]);

//   // 🔥 발급완료 처리 (특정 서류만)
//   const handleMarkCompleted = useCallback(async () => {
//     if (!documentId) {
//       alert('❌ 문서 ID가 없어 완료 처리할 수 없습니다.');
//       return;
//     }

//     try {
//       console.log('🔄 발급완료 처리 시작:', { documentId, docType: currentDocument });

//       await pacsdocsService.updateDocumentStatus(documentId, {
//         status: 'completed',
//         processed_by: 'current_user',
//         notes: '발급 완료 처리됨'
//       });

//       console.log('✅ 발급완료 처리 성공');
//       alert('✅ 문서 발급이 완료되었습니다!');
      
//       if (onStatusChange) {
//         onStatusChange();
//       }
      
//       if (onClosePreview) {
//         onClosePreview(true);
//       }

//     } catch (error) {
//       console.error('❌ 발급완료 처리 실패:', error);
//       alert('❌ 발급 완료 처리 중 오류가 발생했습니다.\n\n다시 시도해주세요.');
//     }
//   }, [documentId, currentDocument, onStatusChange, onClosePreview]);

//   // 🔥 발급완료 버튼 표시 여부 결정
//   const shouldShowCompleteButton = useMemo(() => {
//     // 조영제 사용 동의서와 반출확인서는 발급완료 버튼 숨김
//     const hiddenDocTypes = ['consent_contrast', 'export_certificate'];
//     return !hiddenDocTypes.includes(currentDocument);
//   }, [currentDocument]);

//   // 🔥 뷰 모드에 따른 렌더링 - useMemo로 최적화
//   const renderContent = useMemo(() => {
//     switch (viewMode) {
//       case 'upload':
//         return (
//           <div className="upload-container">
//             <h3>📝 서명된 동의서 스캔 업로드</h3>
//             <p className="upload-description">
//               환자가 서명한 동의서를 스캔하여 업로드해주세요.
//             </p>
            
//             <div className="upload-section" onClick={() => fileInputRef.current?.click()}>
//               <div className="upload-icon">📁</div>
//               <p>파일을 드래그하거나 클릭하여 업로드</p>
//               <p className="upload-hint">지원 형식: PDF, JPG, PNG (최대 10MB)</p>
//             </div>
            
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept=".pdf,.jpg,.jpeg,.png"
//               style={{ display: 'none' }}
//               onChange={handleFileUpload}
//             />
            
//             {uploadedFile && (
//               <div className="upload-preview">
//                 <p className="upload-preview-label">업로드된 파일:</p>
//                 <p className="upload-preview-info">
//                   {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)}MB)
//                 </p>
//               </div>
//             )}
            
//             <div className="preview-action-buttons">
//               <button 
//                 className={`preview-btn preview-btn-success ${!uploadedFile || uploadLoading ? 'disabled' : ''}`}
//                 onClick={handleCompleteUpload}
//                 disabled={!uploadedFile || uploadLoading}
//               >
//                 {uploadLoading ? '업로드 중...' : '✅ 업로드 완료'}
//               </button>
//               <button className="preview-btn preview-btn-secondary" onClick={onClosePreview}>
//                 취소
//               </button>
//             </div>
//           </div>
//         );

//       case 'imaging':
//         return (
//           <div className="imaging-container">
//             <h3>💿 진료기록영상 발급 프로세스</h3>
            
//             <div className="patient-info-box">
//               <p><strong>환자명:</strong> {currentPatient?.name}</p>
//               <p><strong>검사:</strong> {currentPatient?.modality} {currentPatient?.examPart}</p>
//             </div>

//             {/* 1단계: 필수 서류 제출 */}
//             <div className={`process-step ${imagingStep === 1 ? 'step-active' : imagingStep > 1 ? 'step-completed' : 'step-waiting'}`}>
//               <h4>1단계: 필수 서류 제출</h4>
//               <p>다음 서류를 스캔하여 업로드해주세요:</p>
//               <ul>
//                 <li>진료기록 열람 및 사본발급 위임장</li>
//                 <li>진료기록 열람 및 사본발급 동의서</li>
//               </ul>
              
//               <div className="upload-section" onClick={() => imagingFileInputRef.current?.click()}>
//                 <div className="upload-icon">📁</div>
//                 <p>서류를 업로드해주세요</p>
//               </div>
              
//               <input
//                 ref={imagingFileInputRef}
//                 type="file"
//                 accept=".pdf,.jpg,.jpeg,.png"
//                 multiple
//                 style={{ display: 'none' }}
//                 onChange={handleImagingUpload}
//               />
              
//               {imagingFiles.length > 0 && (
//                 <div className="upload-preview">
//                   <p className="upload-preview-label">업로드된 파일: {imagingFiles.length}개</p>
//                   {imagingFiles.map((file, index) => (
//                     <p key={index} className="upload-preview-info">
//                       {file.name}
//                     </p>
//                   ))}
//                 </div>
//               )}
              
//               <button 
//                 className={`preview-btn preview-btn-primary ${imagingFiles.length < 1 ? 'disabled' : ''}`}
//                 onClick={() => handleImagingStep(1)}
//                 disabled={imagingFiles.length < 1}
//               >
//                 1단계 완료
//               </button>
//             </div>
            
//             {/* 2단계: CD/DVD 발급 */}
//             <div className={`process-step ${imagingStep === 2 ? 'step-active' : imagingStep > 2 ? 'step-completed' : 'step-waiting'}`}>
//               <h4>2단계: CD/DVD 발급</h4>
//               <p>서류 확인 후 진료기록영상을 발급합니다.</p>
              
//               {imagingStep === 2 && cdBurning ? (
//                 <div className="cd-burning-status">
//                   <div className="cd-icon-large">💿</div>
//                   <h4>CD를 굽고 있습니다...</h4>
//                   <div className="progress-bar">
//                     <div 
//                       className="progress-fill" 
//                       style={{ width: `${cdProgress}%` }}
//                     ></div>
//                   </div>
//                   <p className="progress-text">{Math.round(cdProgress)}% 완료</p>
//                   <p className="progress-hint">잠시만 기다려주세요. 약 2분 소요됩니다.</p>
//                 </div>
//               ) : (
//                 <button 
//                   className={`preview-btn preview-btn-success ${imagingStep < 2 ? 'disabled' : ''}`}
//                   onClick={() => handleImagingStep(2)}
//                   disabled={imagingStep < 2}
//                 >
//                   💿 CD 발급
//                 </button>
//               )}
//             </div>
            
//             {/* 3단계: 반출 확인서 */}
//             <div className={`process-step ${imagingStep === 3 ? 'step-active' : 'step-waiting'}`}>
//               <h4>3단계: 반출 확인서</h4>
//               <p>CD 수령시 반출 확인서에 서명이 필요합니다.</p>
//             </div>
            
//             <div className="preview-action-buttons">
//               <button 
//                 className={`preview-btn preview-btn-secondary ${cdBurning ? 'disabled' : ''}`}
//                 onClick={onClosePreview}
//                 disabled={cdBurning}
//               >
//                 {cdBurning ? '굽기 중...' : '닫기'}
//               </button>
//             </div>
//           </div>
//         );

//       case 'document':
//         if (loading) {
//           return (
//             <div className="loading-container">
//               <div className="loading-icon">⏳</div>
//               <h3>문서를 불러오는 중...</h3>
//             </div>
//           );
//         }

//         if (error) {
//           return (
//             <div className="error-container">
//               <div className="error-icon">❌</div>
//               <h3>오류 발생</h3>
//               <p>{error}</p>
//               <button className="preview-btn preview-btn-primary" onClick={loadDocumentData}>
//                 다시 시도
//               </button>
//             </div>
//           );
//         }

//         if (!documentData) {
//           return (
//             <div className="empty-document">
//               <div className="empty-icon">📄</div>
//               <h3>문서를 선택해주세요</h3>
//             </div>
//           );
//         }

//         return (
//           <div className="document-container">
//             <div 
//               className="preview-content" 
//               dangerouslySetInnerHTML={{ __html: renderedTemplate }}
//             />
            
//             <div className="preview-action-buttons">
//               <button className="preview-btn preview-btn-primary" onClick={handlePrint}>
//                 🖨️ 인쇄
//               </button>
//               <button className="preview-btn preview-btn-primary" onClick={handleSave}>
//                 💾 PDF 저장
//               </button>
//               {/* 🔥 조건부 발급완료 버튼 - 조영제동의서/반출확인서 제외 */}
//               {shouldShowCompleteButton && (
//                 <button className="preview-btn preview-btn-success" onClick={handleMarkCompleted}>
//                   ✅ 발급 완료
//                 </button>
//               )}
//               <button className="preview-btn preview-btn-secondary" onClick={onClosePreview}>
//                 닫기
//               </button>
//             </div>
//           </div>
//         );

//       default: // 'empty'
//         return (
//           <div className="empty-preview">
//             <div className="empty-icon">📄</div>
//             <h3>서류를 선택해주세요</h3>
//             <p>좌측에서 서류를 클릭하면<br />여기에 내용이 표시됩니다.</p>
//             <p className="current-document">
//               현재 선택된 문서: {currentDocument || 'none'}
//             </p>
//           </div>
//         );
//     }
//   }, [
//     viewMode, 
//     uploadedFile, 
//     uploadLoading, 
//     handleFileUpload, 
//     handleCompleteUpload, 
//     onClosePreview,
//     currentPatient,
//     imagingStep,
//     imagingFiles,
//     cdBurning,
//     cdProgress,
//     handleImagingUpload,
//     handleImagingStep,
//     loading,
//     error,
//     documentData,
//     renderedTemplate,
//     handlePrint,
//     handleSave,
//     handleMarkCompleted,
//     loadDocumentData,
//     currentDocument
//   ]);

//   return (
//     <div className="document-preview">
//       <div className="section-header">📄 생성서류 미리보기</div>
//       <div className="content-wrapper">
//         {renderContent}
//       </div>
//     </div>
//   );
// };

// export default DocumentPreview;
// pacsapp/src/components/pacsdocs/DocumentPreview.js
// pacsapp/src/components/pacsdocs/DocumentPreview.js

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { pacsdocsService } from '../../services/pacsdocsService';
import { generatePDF } from '../../utils/pacsdocs/pdfGenerator';
import { printDocument } from '../../utils/pacsdocs/printGenerator';
import { DOC_NAMES, DOC_DISPLAY_NAMES } from '../../utils/pacsdocs/documentTypes';
import './DocumentPreview.css';

const DocumentPreview = ({ 
  currentDocument, 
  currentPatient, 
  onClosePreview,
  onStatusChange, // 🔥 상태 변경 콜백 추가
  viewMode = 'empty',
  studyId = null,
  documentId = null, // 🔥 document ID 추가
  imagingData = null // 🔥 진료기록영상 데이터 추가
}) => {
  // API 데이터 상태
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 파일 업로드 상태
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // 진료기록영상 프로세스 상태 (다단계)
  const [imagingStep, setImagingStep] = useState(1);
  const [imagingFiles, setImagingFiles] = useState([]);
  const [cdBurning, setCdBurning] = useState(false);
  const [cdProgress, setCdProgress] = useState(0);
  const imagingFileInputRef = useRef(null);

  // 🔥 진료기록영상 모드에서 필요한 데이터 처리
  const processedStudyId = useMemo(() => {
    if (viewMode === 'imaging' && imagingData?.studyId) {
      return imagingData.studyId;
    }
    return studyId;
  }, [viewMode, imagingData, studyId]);

  const processedDocumentId = useMemo(() => {
    if (viewMode === 'imaging' && imagingData?.documentId) {
      return imagingData.documentId;
    }
    return documentId;
  }, [viewMode, imagingData, documentId]);

  const processedPatient = useMemo(() => {
    if (viewMode === 'imaging' && imagingData?.patient) {
      return imagingData.patient;
    }
    return currentPatient;
  }, [viewMode, imagingData, currentPatient]);
  
  // 서류 데이터 로딩
  useEffect(() => {
    if (viewMode === 'document' && currentDocument && processedStudyId) {
      loadDocumentData();
    }
  }, [viewMode, currentDocument, processedStudyId]);

  // API 호출하여 서류 데이터 가져오기
  const loadDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await pacsdocsService.previewDocument(processedStudyId, currentDocument);
      console.log('받은 문서 데이터:', data);
      
      setDocumentData(data);
    } catch (err) {
      console.error('문서 데이터 로딩 실패:', err);
      setError('문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [processedStudyId, currentDocument]);

  // 🔥 템플릿 변수 치환 함수 최적화 - useMemo 사용
  const renderedTemplate = useMemo(() => {
    if (!documentData?.template_content || !documentData) return '';

    let rendered = documentData.template_content;
    
    // 🔥 배치 처리로 성능 최적화
    const replacements = [
      [/\{\{patient_name\}\}/g, documentData.patientName || ''],
      [/\{\{patientName\}\}/g, documentData.patientName || ''],
      [/\{\{patient_id\}\}/g, documentData.patientId || ''],
      [/\{\{patientId\}\}/g, documentData.patientId || ''],
      [/\{\{birthdate\}\}/g, documentData.birthDate || ''],
      [/\{\{birth_date\}\}/g, documentData.birthDate || ''],
      [/\{\{birthDate\}\}/g, documentData.birthDate || ''],
      [/\{\{study_name\}\}/g, documentData.study_name || ''],
      [/\{\{exam_body_part\}\}/g, documentData.examPart || ''],
      [/\{\{body_part\}\}/g, documentData.examPart || ''],
      [/\{\{examPart\}\}/g, documentData.examPart || ''],
      [/\{\{exam_date\}\}/g, documentData.exam_date || ''],
      [/\{\{exam_location\}\}/g, '영상의학과'],
      [/\{\{technologist_name\}\}/g, '김기사'],
      [/\{\{issue_date\}\}/g, documentData.report_date || ''],
      [/\{\{issuer_name\}\}/g, '시스템관리자'],
      [/\{\{radiologist_name\}\}/g, documentData.reportingDoctor || 'TBD'],
      [/\{\{reportingDoctor\}\}/g, documentData.reportingDoctor || 'TBD'],
      [/\{\{report_date\}\}/g, documentData.report_date || ''],
      [/\{\{modality\}\}/g, documentData.modality || '']
    ];

    // 🔥 성능 최적화된 치환
    replacements.forEach(([pattern, replacement]) => {
      rendered = rendered.replace(pattern, replacement);
    });
    
    return rendered;
  }, [documentData]);

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('지원하지 않는 파일 형식입니다. PDF, JPG, PNG 파일만 업로드 가능합니다.');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
        return;
      }
      
      setUploadedFile(file);
    }
  }, []);

  // 🔥 업로드 완료 처리 - 상태 업데이트 포함 (성능 최적화)
  const handleCompleteUpload = useCallback(async () => {
    if (!uploadedFile) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    const currentDocId = processedDocumentId;
    if (!currentDocId) {
      alert('❌ 문서 ID가 없어 업로드를 완료할 수 없습니다.');
      console.error('❌ DocumentId 누락:', { processedDocumentId, documentId, imagingData });
      return;
    }

    try {
      setUploadLoading(true);
      
      // 🔥 성능 최적화: 병렬 처리하지 않고 순차 처리
      console.log('📤 파일 업로드 시작:', { 
        fileName: uploadedFile.name, 
        documentId: currentDocId,
        documentType: currentDocument 
      });
      
      await pacsdocsService.uploadFile(uploadedFile, {
        document_type: currentDocument,
        patient_name: processedPatient?.name,
        modality: processedPatient?.modality,
        document_id: currentDocId
      });
      
      console.log('📤 파일 업로드 성공');
      
      // 🔥 업로드 성공 시 상태 업데이트 (지연 없이)
      await pacsdocsService.updateUploadStatus(currentDocId, {
        onSuccess: async (studyId, docId, newStatus) => {
          console.log('✅ 업로드 상태 업데이트 완료:', { studyId, docId, newStatus });
          
          // 🔥 부모 컴포넌트에 상태 변경 알림
          if (onStatusChange && typeof onStatusChange === 'function') {
            onStatusChange(processedStudyId, docId, newStatus);
          }
        }
      });
      
      alert('✅ 스캔 업로드가 완료되었습니다!\n동의서 처리가 완료되었습니다.');
      
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onClosePreview) {
        onClosePreview(true); // 성공 플래그와 함께 닫기
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploadLoading(false);
    }
  }, [uploadedFile, currentDocument, processedPatient, processedDocumentId, processedStudyId, onStatusChange, onClosePreview]);

  // 진료기록영상 파일 업로드
  const handleImagingUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setImagingFiles(files);
      if (files.length >= 1) {
        alert(`${files.length}개 파일이 업로드되었습니다.`);
      }
    }
  }, []);

  // 진료기록영상 프로세스 단계별 처리
  const handleImagingStep = useCallback((step) => {
    switch (step) {
      case 1:
        if (imagingFiles.length < 1) {
          alert('위임장 또는 동의서를 업로드해주세요.');
          return;
        }
        setImagingStep(2);
        break;
      case 2:
        handleCDBurn();
        break;
      case 3:
        if (currentPatient) {
          const event = new CustomEvent('showExportCertificate', {
            detail: {
              patient: currentPatient,
              docType: 'export_certificate'
            }
          });
          window.dispatchEvent(event);
        }
        break;
      default:
        break;
    }
  }, [imagingFiles.length, currentPatient]);

  // 🔥 CD 굽기 시뮬레이션 - 간소화 (성능 개선)
  const handleCDBurn = useCallback(async () => {
    try {
      setCdBurning(true);
      setCdProgress(0);

      // 🔥 간단한 진행률 업데이트
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          setCdProgress(90);
          clearInterval(progressInterval);
        } else {
          setCdProgress(progress);
        }
      }, 150);

      // 🔥 1.5초 후 완료
      setTimeout(() => {
        clearInterval(progressInterval);
        setCdProgress(100);
        
        setTimeout(() => {
          setCdBurning(false);
          setCdProgress(0);
          setImagingStep(3);
          
          alert('💿 CD 굽기가 완료되었습니다!\n\n반출 확인서를 작성해주세요.');
          
          // 🔥 CD 굽기 완료 후 상태 변경 (로그 추가)
          console.log('🔄 CD 굽기 완료 - 상태 변경 시도', { 
            studyId: processedStudyId, 
            documentId: processedDocumentId,
            onStatusChange: typeof onStatusChange 
          });
          
          if (onStatusChange && typeof onStatusChange === 'function') {
            onStatusChange(processedStudyId, processedDocumentId, 'completed');
          } else {
            console.warn('⚠️ onStatusChange 함수가 없거나 함수가 아님');
          }
        }, 300);
      }, 1500);

      console.log('💿 CD 굽기 시뮬레이션 완료');
      
    } catch (error) {
      console.error('CD 굽기 시뮬레이션 오류:', error);
      setCdBurning(false);
      setCdProgress(0);
      alert('CD 굽기 중 오류가 발생했습니다.');
    }
  }, [onStatusChange, processedStudyId, processedDocumentId]);

  // 실제 인쇄 기능
  const handlePrint = useCallback(() => {
    if (!documentData) {
      alert('문서 데이터를 불러오는 중입니다. 잠시 후 시도해주세요.');
      return;
    }

    const docDisplayName = DOC_DISPLAY_NAMES[currentDocument] || '문서';
    printDocument(documentData, docDisplayName);
  }, [documentData, currentDocument]);

  // 실제 PDF 저장 기능
  const handleSave = useCallback(async () => {
    if (!documentData) {
      alert('문서 데이터를 불러오는 중입니다. 잠시 후 시도해주세요.');
      return;
    }

    const docFileName = DOC_NAMES[currentDocument] || '문서';
    await generatePDF(documentData, docFileName, currentDocument);
  }, [documentData, currentDocument]);

  // 🔥 발급완료 처리 - 상태 업데이트 포함 (성능 최적화)
  const handleMarkCompleted = useCallback(async () => {
    const currentDocId = processedDocumentId;
    if (!currentDocId) {
      alert('❌ 문서 ID가 없어 완료 처리할 수 없습니다.');
      return;
    }

    try {
      console.log('🔄 발급완료 처리 시작:', { 
        documentId: currentDocId, 
        docType: currentDocument 
      });

      // 🔥 상태 업데이트 (간소화)
      await pacsdocsService.updateDocumentStatus(currentDocId, {
        status: 'completed',
        processed_by: 'current_user',
        notes: '발급 완료 처리됨'
      }, {
        onSuccess: async (updateResult) => {
          console.log('✅ 발급완료 처리 성공:', updateResult);
          
          // 🔥 부모 컴포넌트에 상태 변경 알림
          if (onStatusChange && typeof onStatusChange === 'function') {
            onStatusChange(processedStudyId, currentDocId, 'completed');
          }
          
          alert('✅ 문서 발급이 완료되었습니다!');
          
          if (onClosePreview) {
            onClosePreview(true); // 성공 플래그와 함께 닫기
          }
        },
        onError: (error) => {
          console.error('❌ 발급완료 처리 실패:', error);
          alert('❌ 발급 완료 처리 중 오류가 발생했습니다.\n\n다시 시도해주세요.');
        }
      });

    } catch (error) {
      console.error('❌ 발급완료 처리 예외:', error);
      alert('❌ 발급 완료 처리 중 오류가 발생했습니다.\n\n다시 시도해주세요.');
    }
  }, [processedDocumentId, currentDocument, processedStudyId, onStatusChange, onClosePreview]);

  // 🔥 발급완료 버튼 표시 여부 결정
  const shouldShowCompleteButton = useMemo(() => {
    // 조영제 사용 동의서와 반출확인서는 발급완료 버튼 숨김
    const hiddenDocTypes = ['consent_contrast', 'export_certificate'];
    return !hiddenDocTypes.includes(currentDocument);
  }, [currentDocument]);

  // 🔥 뷰 모드에 따른 렌더링 - useMemo로 최적화
  const renderContent = useMemo(() => {
    switch (viewMode) {
      case 'upload':
        return (
          <div className="upload-container">
            <h3>📝 서명된 동의서 스캔 업로드</h3>
            <p className="upload-description">
              환자가 서명한 동의서를 스캔하여 업로드해주세요.
            </p>
            
            <div className="upload-section" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon">📁</div>
              <p>파일을 드래그하거나 클릭하여 업로드</p>
              <p className="upload-hint">지원 형식: PDF, JPG, PNG (최대 10MB)</p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            
            {uploadedFile && (
              <div className="upload-preview">
                <p className="upload-preview-label">업로드된 파일:</p>
                <p className="upload-preview-info">
                  {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              </div>
            )}
            
            <div className="preview-action-buttons">
              <button 
                className={`preview-btn preview-btn-success ${!uploadedFile || uploadLoading ? 'disabled' : ''}`}
                onClick={handleCompleteUpload}
                disabled={!uploadedFile || uploadLoading}
              >
                {uploadLoading ? '업로드 중...' : '✅ 업로드 완료'}
              </button>
              <button className="preview-btn preview-btn-secondary" onClick={onClosePreview}>
                취소
              </button>
            </div>
          </div>
        );

      case 'imaging':
        return (
          <div className="imaging-container">
            <h3>💿 진료기록영상 발급 프로세스</h3>
            
            <div className="patient-info-box">
              <p><strong>환자명:</strong> {processedPatient?.name}</p>
              <p><strong>검사:</strong> {processedPatient?.modality} {processedPatient?.examPart}</p>
            </div>

            {/* 1단계: 필수 서류 제출 */}
            <div className={`process-step ${imagingStep === 1 ? 'step-active' : imagingStep > 1 ? 'step-completed' : 'step-waiting'}`}>
              <h4>1단계: 필수 서류 제출</h4>
              <p>다음 서류를 스캔하여 업로드해주세요:</p>
              <ul>
                <li>진료기록 열람 및 사본발급 위임장</li>
                <li>진료기록 열람 및 사본발급 동의서</li>
              </ul>
              
              <div className="upload-section" onClick={() => imagingFileInputRef.current?.click()}>
                <div className="upload-icon">📁</div>
                <p>서류를 업로드해주세요</p>
              </div>
              
              <input
                ref={imagingFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                style={{ display: 'none' }}
                onChange={handleImagingUpload}
              />
              
              {imagingFiles.length > 0 && (
                <div className="upload-preview">
                  <p className="upload-preview-label">업로드된 파일: {imagingFiles.length}개</p>
                  {imagingFiles.map((file, index) => (
                    <p key={index} className="upload-preview-info">
                      {file.name}
                    </p>
                  ))}
                </div>
              )}
              
              <button 
                className={`preview-btn preview-btn-primary ${imagingFiles.length < 1 ? 'disabled' : ''}`}
                onClick={() => handleImagingStep(1)}
                disabled={imagingFiles.length < 1}
              >
                1단계 완료
              </button>
            </div>
            
            {/* 2단계: CD/DVD 발급 */}
            <div className={`process-step ${imagingStep === 2 ? 'step-active' : imagingStep > 2 ? 'step-completed' : 'step-waiting'}`}>
              <h4>2단계: CD/DVD 발급</h4>
              <p>서류 확인 후 진료기록영상을 발급합니다.</p>
              
              {imagingStep === 2 && cdBurning ? (
                <div className="cd-burning-status">
                  <div className="cd-icon-large">💿</div>
                  <h4>CD를 굽고 있습니다...</h4>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${cdProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{Math.round(cdProgress)}% 완료</p>
                  <p className="progress-hint">잠시만 기다려주세요. 약 2분 소요됩니다.</p>
                </div>
              ) : (
                <button 
                  className={`preview-btn preview-btn-success ${imagingStep < 2 ? 'disabled' : ''}`}
                  onClick={() => handleImagingStep(2)}
                  disabled={imagingStep < 2}
                >
                  💿 CD 발급
                </button>
              )}
            </div>
            
            {/* 3단계: 반출 확인서 */}
            <div className={`process-step ${imagingStep === 3 ? 'step-active' : 'step-waiting'}`}>
              <h4>3단계: 반출 확인서</h4>
              <p>CD 수령시 반출 확인서에 서명이 필요합니다.</p>
            </div>
            
            <div className="preview-action-buttons">
              <button 
                className={`preview-btn preview-btn-secondary ${cdBurning ? 'disabled' : ''}`}
                onClick={() => {
                  // 🔥 3단계일 때만 CD 상태를 로컬에서 완료로 변경
                  if (imagingStep === 3 && onStatusChange && typeof onStatusChange === 'function') {
                    console.log('🔄 CD 발급 완료 - 로컬 상태만 변경');
                    
                    // 🔥 실제 studyId, documentId 대신 현재 화면의 CD 항목 찾아서 변경
                    // imaging_cd 타입의 문서를 찾아서 상태 변경
                    const cdDocId = imagingData?.documentId; // CD 문서 ID
                    
                    if (cdDocId) {
                      onStatusChange(processedStudyId, cdDocId, 'completed');
                    } else {
                      // 🔥 documentId가 없으면 임시로 시뮬레이션
                      console.log('🔄 CD documentId 없음 - 시뮬레이션 상태 변경');
                      onStatusChange(processedStudyId, 'imaging_cd_sim', 'completed');
                    }
                  }
                  onClosePreview(true);
                }}
                disabled={cdBurning}
              >
                {cdBurning ? '굽기 중...' : '닫기'}
              </button>
            </div>
          </div>
        );

      case 'document':
        if (loading) {
          return (
            <div className="loading-container">
              <div className="loading-icon">⏳</div>
              <h3>문서를 불러오는 중...</h3>
            </div>
          );
        }

        if (error) {
          return (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <h3>오류 발생</h3>
              <p>{error}</p>
              <button className="preview-btn preview-btn-primary" onClick={loadDocumentData}>
                다시 시도
              </button>
            </div>
          );
        }

        if (!documentData) {
          return (
            <div className="empty-document">
              <div className="empty-icon">📄</div>
              <h3>문서를 선택해주세요</h3>
            </div>
          );
        }

        return (
          <div className="document-container">
            <div 
              className="preview-content" 
              dangerouslySetInnerHTML={{ __html: renderedTemplate }}
            />
            
            <div className="preview-action-buttons">
              <button className="preview-btn preview-btn-primary" onClick={handlePrint}>
                🖨️ 인쇄
              </button>
              <button className="preview-btn preview-btn-primary" onClick={handleSave}>
                💾 PDF 저장
              </button>
              {/* 🔥 조건부 발급완료 버튼 - 조영제동의서/반출확인서 제외 */}
              {shouldShowCompleteButton && (
                <button className="preview-btn preview-btn-success" onClick={handleMarkCompleted}>
                  ✅ 발급 완료
                </button>
              )}
              <button className="preview-btn preview-btn-secondary" onClick={onClosePreview}>
                닫기
              </button>
            </div>
          </div>
        );

      default: // 'empty'
        return (
          <div className="empty-preview">
            <div className="empty-icon">📄</div>
            <h3>서류를 선택해주세요</h3>
            <p>좌측에서 서류를 클릭하면<br />여기에 내용이 표시됩니다.</p>
            <p className="current-document">
              현재 선택된 문서: {currentDocument || 'none'}
            </p>
          </div>
        );
    }
  }, [
    viewMode, 
    uploadedFile, 
    uploadLoading, 
    handleFileUpload, 
    handleCompleteUpload, 
    onClosePreview,
    processedPatient,
    imagingStep,
    imagingFiles,
    cdBurning,
    cdProgress,
    handleImagingUpload,
    handleImagingStep,
    loading,
    error,
    documentData,
    renderedTemplate,
    handlePrint,
    handleSave,
    handleMarkCompleted,
    loadDocumentData,
    currentDocument,
    shouldShowCompleteButton,
    processedStudyId,
    processedDocumentId,
    onStatusChange
  ]);

  return (
    <div className="document-preview">
      <div className="section-header">📄 생성서류 미리보기</div>
      <div className="content-wrapper">
        {renderContent}
      </div>
    </div>
  );
};

export default DocumentPreview;