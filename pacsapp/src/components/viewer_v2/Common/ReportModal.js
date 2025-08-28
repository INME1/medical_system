// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { X, Mic, Save, FileText, StopCircle, Play } from 'lucide-react';
// import './ReportModal.css';

// const ReportModal = ({
//   isOpen,
//   onClose,
//   onSave,
  
//   // 환자 및 Study 정보
//   patientInfo,
//   currentStudyUID,
//   currentInstanceUID,
//   currentInstanceNumber,
  
//   // AI 결과 및 어노테이션 데이터
//   allAIResults,
//   currentInstanceResults,
//   annotationBoxes,
//   instances,
  
//   // 슬라이스 이동 함수
//   onGoToInstance,
  
//   // 초기 레포트 내용 (편집 시)
//   initialContent = '',
//   initialStatus = 'draft'
// }) => {
//   // 🔥 상태 관리
//   const [selectedFindings, setSelectedFindings] = useState([]);
//   const [reportText, setReportText] = useState(initialContent);
//   const [reportStatus, setReportStatus] = useState(initialStatus);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [sttLoading, setSttLoading] = useState(false);
  
//   // STT 관련 상태
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [audioBlob, setAudioBlob] = useState(null);
//   const audioChunks = useRef([]);
//   const timerRef = useRef(null);

//   // 🔥 Study 전체 데이터 준비
//   const studyReportData = useMemo(() => {
//     if (!allAIResults || !annotationBoxes || !instances) {
//       return null;
//     }

//     console.log('📊 Study 레포트 데이터 준비 시작');

//     // 1. AI 결과 수집 (인스턴스별)
//     const aiFindings = [];
//     if (allAIResults.groupedByInstance) {
//       Object.entries(allAIResults.groupedByInstance).forEach(([instanceUID, results]) => {
//         const instanceNumber = results.instance_number;
        
//         ['yolov8', 'ssd', 'simclr'].forEach(model => {
//           if (results[model] && Array.isArray(results[model]) && results[model].length > 0) {
//             results[model].forEach(detection => {
//               aiFindings.push({
//                 id: `ai-${model}-${detection.id || Math.random().toString(36).substr(2, 9)}`,
//                 instanceUID: instanceUID,
//                 instanceNumber: instanceNumber,
//                 type: 'ai',
//                 model: model,
//                 label: detection.label || 'Unknown',
//                 confidence: detection.confidence || 0,
//                 source: `AI (${model.toUpperCase()})`,
//                 selectable: true
//               });
//             });
//           }
//         });
//       });
//     }

//     // 2. 어노테이션 수집 (인스턴스별)
//     const manualFindings = [];
//     if (Array.isArray(annotationBoxes)) {
//       annotationBoxes.forEach(annotation => {
//         manualFindings.push({
//           id: `manual-${annotation.id || Math.random().toString(36).substr(2, 9)}`,
//           instanceUID: annotation.instance_uid,
//           instanceNumber: annotation.instance_number,
//           type: 'manual',
//           label: annotation.label || 'Unknown',
//           memo: annotation.dr_text || '',
//           source: `수동 (${annotation.doctor_name || '의사'})`,
//           selectable: true,
//           shape_type: annotation.shape_type || 'rectangle'
//         });
//       });
//     }

//     // 3. 통합 및 인스턴스별 그룹화
//     const allFindings = [...aiFindings, ...manualFindings];
//     const findingsByInstance = {};
    
//     allFindings.forEach(finding => {
//       const instanceUID = finding.instanceUID;
//       if (!findingsByInstance[instanceUID]) {
//         findingsByInstance[instanceUID] = [];
//       }
//       findingsByInstance[instanceUID].push(finding);
//     });

//     // 4. 주요 소견이 있는 인스턴스 식별
//     const significantInstances = Object.entries(findingsByInstance)
//       .map(([instanceUID, findings]) => {
//         const instance = instances.find(inst => inst.sopInstanceUID === instanceUID);
//         const instanceIndex = instance ? instances.indexOf(instance) : -1;
        
//         return {
//           instanceUID,
//           instanceNumber: instanceIndex >= 0 ? instanceIndex + 1 : findings[0]?.instanceNumber || 0,
//           count: findings.length,
//           summary: findings.map(f => f.label).join(', '),
//           findings: findings
//         };
//       })
//       .filter(instance => instance.count > 0)
//       .sort((a, b) => b.count - a.count);

//     const result = {
//       total_instances: instances.length,
//       total_findings: allFindings.length,
//       ai_findings: aiFindings.length,
//       manual_findings: manualFindings.length,
//       significant_instances: significantInstances,
//       findings_by_instance: findingsByInstance,
//       all_findings: allFindings
//     };

//     console.log('✅ Study 레포트 데이터 준비 완료:', result);
//     return result;
//   }, [allAIResults, annotationBoxes, instances]);

//   // 🔥 현재 인스턴스의 소견들 필터링
//   const currentInstanceFindings = useMemo(() => {
//     if (!studyReportData || !currentInstanceUID) return [];
//     return studyReportData.findings_by_instance[currentInstanceUID] || [];
//   }, [studyReportData, currentInstanceUID]);

//   // 🔥 소견 추가 핸들러
//   const handleAddFinding = (finding) => {
//     const findingWithDisplay = {
//       ...finding,
//       selected_at: new Date().toISOString(),
//       display_text: `인스턴스 #${finding.instanceNumber}: ${finding.label} (${finding.source})`
//     };
    
//     setSelectedFindings(prev => {
//       if (prev.some(f => f.id === finding.id)) {
//         return prev; // 이미 추가됨
//       }
//       return [...prev, findingWithDisplay];
//     });
    
//     console.log('➕ 소견 추가됨:', findingWithDisplay);
//   };

//   // 🔥 소견 제거 핸들러
//   const handleRemoveFinding = (findingId) => {
//     setSelectedFindings(prev => prev.filter(f => f.id !== findingId));
//     console.log('➖ 소견 제거됨:', findingId);
//   };

//   // 🔥 인스턴스 이동 핸들러
//   const handleGoToInstance = (instanceNumber) => {
//     if (onGoToInstance && typeof onGoToInstance === 'function') {
//       // instanceNumber는 1-based, 배열 인덱스는 0-based
//       onGoToInstance(instanceNumber - 1);
//       console.log('🔄 인스턴스 이동:', instanceNumber);
//     }
//   };

//   // 🔥 녹음 시작
//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const recorder = new MediaRecorder(stream);
      
//       audioChunks.current = [];
      
//       recorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunks.current.push(event.data);
//         }
//       };
      
//       recorder.onstop = () => {
//         const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
//         setAudioBlob(blob);
        
//         // 스트림 정리
//         stream.getTracks().forEach(track => track.stop());
//       };
      
//       recorder.onerror = (event) => {
//         console.error('❌ 녹음 오류:', event);
//         setIsRecording(false);
//         setMediaRecorder(null);
//       };
      
//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//       setRecordingTime(0);
      
//       console.log('🎤 녹음 시작');
//     } catch (error) {
//       console.error('❌ 녹음 시작 실패:', error);
//       alert('마이크 접근 권한이 필요합니다.');
//     }
//   };

//   // 🔥 녹음 중지
//   const stopRecording = () => {
//     if (mediaRecorder && mediaRecorder.state === 'recording') {
//       mediaRecorder.stop();
//       setIsRecording(false);
//       setMediaRecorder(null);
//       console.log('🛑 녹음 중지');
//     }
//   };

//   // 🔥 STT 처리
//   const processSTT = async () => {
//     if (!audioBlob) {
//       alert('먼저 음성을 녹음해주세요.');
//       return;
//     }

//     setSttLoading(true);

//     try {
//       const formData = new FormData();
//       formData.append('audio', audioBlob, 'recording.webm');
//       formData.append('patient_id', patientInfo?.patient_id || 'UNKNOWN');
//       formData.append('study_uid', currentStudyUID || 'UNKNOWN');
      
//       // 🔥 선택된 소견 정보도 함께 전달
//       if (selectedFindings.length > 0) {
//         const findingsContext = selectedFindings.map(finding => ({
//           instanceNumber: finding.instanceNumber,
//           label: finding.label,
//           type: finding.type,
//           source: finding.source,
//           confidence: finding.confidence
//         }));
        
//         formData.append('selected_findings', JSON.stringify(findingsContext));
//       }

//       console.log('🔄 STT 처리 중... (선택된 소견 포함)');

//       const response = await fetch('http://localhost:8000/api/stt/upload/', {
//         method: 'POST',
//         body: formData
//       });

//       if (!response.ok) {
//         throw new Error(`STT 요청 실패: ${response.status}`);
//       }

//       const result = await response.json();
      
//       if (result.status === 'success') {
//         const soapText = result.corrected_text || result.original_text;
        
//         // 🔥 선택된 소견 요약도 텍스트에 포함
//         let finalText = soapText;
        
//         if (selectedFindings.length > 0) {
//           const findingsSummary = '\n\n=== 선택된 주요 소견 ===\n' + 
//             selectedFindings.map(f => `- ${f.display_text}`).join('\n');
//           finalText = soapText + findingsSummary;
//         }
        
//         // 기존 텍스트에 추가
//         const newText = reportText ? `${reportText}\n\n${finalText}` : finalText;
//         setReportText(newText);
        
//         console.log('✅ SOAP 형식 STT 완료 (소견 포함):', finalText);
//         alert('음성 인식이 완료되어 선택된 소견과 함께 SOAP 형식으로 종합소견에 추가되었습니다.');
        
//         // 오디오 블롭 정리
//         setAudioBlob(null);
        
//       } else {
//         throw new Error(result.message || 'STT 처리 실패');
//       }

//     } catch (error) {
//       console.error('❌ STT 처리 실패:', error);
//       alert(`음성 인식 실패: ${error.message}`);
//     } finally {
//       setSttLoading(false);
//     }
//   };

//   // 🔥 레포트 저장 핸들러
//   const handleSave = async () => {
//     if (!reportText.trim()) {
//       alert('종합 소견을 입력해주세요.');
//       return;
//     }

//     try {
//       const reportData = {
//         content: reportText,
//         status: reportStatus,
//         selected_findings: selectedFindings,
//         patient_info: patientInfo,
//         study_uid: currentStudyUID,
//         instance_uid: currentInstanceUID,
//         created_at: new Date().toISOString()
//       };

//       if (typeof onSave === 'function') {
//         const result = await onSave(reportData);
        
//         if (result && result.success) {
//           alert(`레포트가 저장되었습니다! (상태: ${reportStatus})`);
//           onClose();
//         } else {
//           alert(`저장 실패: ${result?.error || '알 수 없는 오류'}`);
//         }
//       } else {
//         console.error('onSave 함수가 정의되지 않았습니다.');
//         alert('저장 함수가 정의되지 않았습니다.');
//       }
//     } catch (error) {
//       console.error('❌ 레포트 저장 실패:', error);
//       alert('레포트 저장 중 오류가 발생했습니다.');
//     }
//   };

//   // 🔥 녹음 시간 타이머
//   useEffect(() => {
//     if (isRecording) {
//       timerRef.current = setInterval(() => {
//         setRecordingTime(prev => prev + 1);
//       }, 1000);
//     } else {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       setRecordingTime(0);
//     }

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [isRecording]);

//   // 🔥 초기 데이터 설정
//   useEffect(() => {
//     if (isOpen) {
//       setReportText(initialContent);
//       setReportStatus(initialStatus);
//       setSelectedFindings([]);
//       setAudioBlob(null);
//       setSttLoading(false);
      
//       // 녹음 중이라면 정리
//       if (isRecording) {
//         stopRecording();
//       }
//     }
//   }, [isOpen, initialContent, initialStatus]);

//   // 컴포넌트 언마운트 시 정리
//   useEffect(() => {
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//       if (mediaRecorder && mediaRecorder.state === 'recording') {
//         mediaRecorder.stop();
//       }
//     };
//   }, []);

//   // 시간 포맷팅
//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="report-modal-overlay">
//       <div className="report-modal-content">
//         {/* 헤더 */}
//         <div className="report-modal-header">
//           <h2>📋 진단 레포트 작성</h2>
//           <button className="report-modal-close" onClick={onClose}>
//             <X size={24} />
//           </button>
//         </div>

//         {/* 환자 정보 */}
//         <div className="report-section">
//           <h3>👤 환자 정보</h3>
//           <div className="patient-info-grid">
//             <div>
//               <strong>환자명:</strong> {patientInfo?.patient_name || 'Unknown'}
//             </div>
//             <div>
//               <strong>환자 ID:</strong> {patientInfo?.patient_id || 'Unknown'}
//             </div>
//             <div>
//               <strong>검사일:</strong> {patientInfo?.study_date || 'Unknown'}
//             </div>
//           </div>
//         </div>

//         {/* Study 전체 요약 */}
//         {studyReportData && (
//           <div className="report-section">
//             <h3>📊 Study 전체 요약</h3>
//             <div className="study-summary">
//               <p>
//                 총 {studyReportData.total_instances}개 인스턴스 중 {studyReportData.significant_instances.length}개에서 소견 발견
//               </p>
//               <p>
//                 AI 검출: {studyReportData.ai_findings}개, 수동 어노테이션: {studyReportData.manual_findings}개
//               </p>
//             </div>
//           </div>
//         )}

//         {/* 현재 인스턴스 소견 */}
//         <div className="report-section">
//           <h3>🔍 현재 인스턴스 #{currentInstanceNumber} 소견</h3>
//           {currentInstanceFindings.length > 0 ? (
//             <div className="findings-grid">
//               {currentInstanceFindings.map(finding => (
//                 <div key={finding.id} className="finding-item">
//                   <div className="finding-info">
//                     <span className={`finding-badge ${finding.type}`}>
//                       {finding.type === 'ai' ? '🤖' : '✏️'}
//                     </span>
//                     <span className="finding-label">{finding.label}</span>
//                     {finding.confidence && finding.confidence > 0 && (
//                       <span className="finding-confidence">({finding.confidence}%)</span>
//                     )}
//                     <span className="finding-source">{finding.source}</span>
//                   </div>
//                   <button
//                     className={`add-finding-btn ${
//                       selectedFindings.some(f => f.id === finding.id) 
//                         ? 'added' : 'available'
//                     }`}
//                     onClick={() => handleAddFinding(finding)}
//                     disabled={selectedFindings.some(f => f.id === finding.id)}
//                   >
//                     {selectedFindings.some(f => f.id === finding.id) ? '✅ 추가됨' : '➕ 추가'}
//                   </button>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="no-findings">현재 인스턴스에는 소견이 없습니다.</p>
//           )}
//         </div>

//         {/* 다른 인스턴스 네비게이션 */}
//         {studyReportData && studyReportData.significant_instances.length > 1 && (
//           <div className="report-section">
//             <h3>🔄 다른 인스턴스 주요 소견</h3>
//             <select 
//               className="instance-selector"
//               onChange={(e) => {
//                 const instanceNumber = parseInt(e.target.value);
//                 if (instanceNumber && !isNaN(instanceNumber)) {
//                   handleGoToInstance(instanceNumber);
//                 }
//               }}
//               value=""
//             >
//               <option value="">인스턴스 이동...</option>
//               {studyReportData.significant_instances
//                 .filter(instance => instance.instanceNumber !== currentInstanceNumber)
//                 .map(instance => (
//                   <option key={instance.instanceUID} value={instance.instanceNumber}>
//                     인스턴스 #{instance.instanceNumber}: {instance.summary} ({instance.count}개 소견)
//                   </option>
//                 ))
//               }
//             </select>
//           </div>
//         )}

//         {/* 선택된 소견 목록 */}
//         <div className="report-section">
//           <h3>📝 선택된 소견 ({selectedFindings.length}개)</h3>
//           {selectedFindings.length > 0 ? (
//             <div className="selected-findings">
//               {selectedFindings.map(finding => (
//                 <div key={finding.id} className="selected-finding-item">
//                   <span className="selected-finding-text">
//                     {finding.display_text}
//                   </span>
//                   <button
//                     className="remove-finding-btn"
//                     onClick={() => handleRemoveFinding(finding.id)}
//                   >
//                     ✕
//                   </button>
//                 </div>
//               ))}
              
//               <button 
//                 className="clear-all-findings-btn"
//                 onClick={() => setSelectedFindings([])}
//               >
//                 🗑️ 모두 제거
//               </button>
//             </div>
//           ) : (
//             <p className="no-selected-findings">
//               선택된 소견이 없습니다. 위에서 소견을 선택해주세요.
//             </p>
//           )}
//         </div>

//         {/* STT 섹션 */}
//         <div className="report-section">
//           <h3>🎤 음성 인식 (SOAP 형식 자동 변환)</h3>
          
//           {selectedFindings.length > 0 && (
//             <div className="stt-context">
//               <p className="stt-context-label">
//                 💡 다음 소견들을 참고하여 종합 의견을 말씀해주세요:
//               </p>
//               <ul className="stt-context-list">
//                 {selectedFindings.map(finding => (
//                   <li key={finding.id}>{finding.display_text}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
          
//           <div className="stt-controls">
//             {!isRecording ? (
//               <button 
//                 className="stt-btn record-btn"
//                 onClick={startRecording}
//                 disabled={sttLoading}
//               >
//                 <Mic size={20} />
//                 🎤 녹음 시작
//               </button>
//             ) : (
//               <button 
//                 className="stt-btn stop-btn"
//                 onClick={stopRecording}
//               >
//                 <StopCircle size={20} />
//                 🔴 녹음 중지 ({formatTime(recordingTime)})
//               </button>
//             )}
            
//             {audioBlob && !isRecording && (
//               <button 
//                 className="stt-btn process-btn"
//                 onClick={processSTT}
//                 disabled={sttLoading}
//               >
//                 {sttLoading ? '🤖 변환 중...' : '🤖 SOAP 변환'}
//               </button>
//             )}
//           </div>
//         </div>

//         {/* 종합 소견 */}
//         <div className="report-section">
//           <h3>📝 종합 소견</h3>
//           <textarea 
//             className="report-textarea"
//             value={reportText}
//             onChange={(e) => setReportText(e.target.value)}
//             placeholder="종합 소견을 입력하거나 음성 인식을 사용하세요..."
//             rows={15}
//           />
//         </div>

//         {/* 레포트 상태 */}
//         <div className="report-section">
//           <h3>📋 레포트 상태</h3>
//           <select 
//             value={reportStatus} 
//             onChange={(e) => setReportStatus(e.target.value)}
//             className="status-selector"
//           >
//             <option value="draft">초안</option>
//             <option value="completed">완료</option>
//             <option value="approved">승인</option>
//           </select>
//         </div>

//         {/* 버튼들 */}
//         <div className="report-modal-footer">
//           <button 
//             className="modal-btn cancel-btn"
//             onClick={onClose}
//           >
//             ❌ 취소
//           </button>
//           <button 
//             className="modal-btn save-btn"
//             onClick={handleSave}
//             disabled={sttLoading}
//           >
//             <Save size={20} />
//             💾 레포트 저장
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReportModal;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Mic, Save, FileText, StopCircle, Play } from 'lucide-react';
import './ReportModal.css';

const ReportModal = ({
  isOpen,
  onClose,
  onSave,
  onPrint,
  
  // 환자 및 Study 정보
  patientInfo = {},
  currentStudyUID = '',
  currentInstanceUID,
  currentInstanceNumber,
  
  // AI 결과 및 어노테이션 데이터
  allAIResults,
  currentInstanceResults,
  annotationBoxes = [],
  instances,
  
  // 슬라이스 이동 함수
  onGoToInstance,
  
  // 초기 레포트 내용 (편집 시)
  initialContent = '',
  initialStatus = 'draft',
  
  // 설정
  title = '📋 진단 레포트'
}) => {
  // 🔥 상태 관리
  const [selectedFindings, setSelectedFindings] = useState([]);
  const [reportText, setReportText] = useState(initialContent);
  const [reportStatus, setReportStatus] = useState(initialStatus);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sttLoading, setSttLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  // STT 관련 상태
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  // API 기반 환자 정보 상태
  const [apiPatientInfo, setApiPatientInfo] = useState({});
  const [isLoadingPatientInfo, setIsLoadingPatientInfo] = useState(false);

  // 🔥 Study 전체 데이터 준비 (데이터 없어도 작동하도록 수정)
  const studyReportData = useMemo(() => {
    console.log('📊 Study 레포트 데이터 준비 시작');
    console.log('📊 받은 데이터:', { 
      allAIResults: !!allAIResults, 
      annotationBoxes: annotationBoxes?.length || 0, 
      instances: instances?.length || 0 
    });

    // 기본 구조 생성 (데이터가 없어도)
    let aiFindings = [];
    let manualFindings = [];

    // 1. AI 결과 수집 (안전하게)
    if (allAIResults && allAIResults.groupedByInstance) {
      Object.entries(allAIResults.groupedByInstance).forEach(([instanceUID, results]) => {
        const instanceNumber = results.instance_number;
        
        ['yolov8', 'ssd', 'simclr'].forEach(model => {
          if (results[model] && Array.isArray(results[model]) && results[model].length > 0) {
            results[model].forEach(detection => {
              aiFindings.push({
                id: `ai-${model}-${detection.id || Math.random().toString(36).substr(2, 9)}`,
                instanceUID: instanceUID,
                instanceNumber: instanceNumber,
                type: 'ai',
                model: model,
                label: detection.label || 'Unknown',
                confidence: detection.confidence || 0,
                source: `AI (${model.toUpperCase()})`,
                selectable: true
              });
            });
          }
        });
      });
    }

    // 2. 어노테이션 수집 (안전하게)
    if (Array.isArray(annotationBoxes) && annotationBoxes.length > 0) {
      annotationBoxes.forEach(annotation => {
        manualFindings.push({
          id: `manual-${annotation.id || Math.random().toString(36).substr(2, 9)}`,
          instanceUID: annotation.instance_uid,
          instanceNumber: annotation.instance_number,
          type: 'manual',
          label: annotation.label || 'Unknown',
          memo: annotation.dr_text || '',
          source: `수동 (${annotation.doctor_name || '의사'})`,
          selectable: true,
          shape_type: annotation.shape_type || 'rectangle'
        });
      });
    }

    // 3. 통합 및 인스턴스별 그룹화
    const allFindings = [...aiFindings, ...manualFindings];
    const findingsByInstance = {};
    
    allFindings.forEach(finding => {
      const instanceUID = finding.instanceUID;
      if (!findingsByInstance[instanceUID]) {
        findingsByInstance[instanceUID] = [];
      }
      findingsByInstance[instanceUID].push(finding);
    });

    // 4. 주요 소견이 있는 인스턴스 식별 (instances가 없어도 작동)
    const significantInstances = Object.entries(findingsByInstance)
      .map(([instanceUID, findings]) => {
        let instanceNumber = findings[0]?.instanceNumber || 0;
        
        // instances 배열이 있다면 정확한 번호 찾기
        if (Array.isArray(instances) && instances.length > 0) {
          const instance = instances.find(inst => inst.sopInstanceUID === instanceUID);
          const instanceIndex = instance ? instances.indexOf(instance) : -1;
          if (instanceIndex >= 0) {
            instanceNumber = instanceIndex + 1;
          }
        }
        
        return {
          instanceUID,
          instanceNumber,
          count: findings.length,
          summary: findings.map(f => f.label).join(', '),
          findings: findings
        };
      })
      .filter(instance => instance.count > 0)
      .sort((a, b) => b.count - a.count);

    const result = {
      total_instances: (Array.isArray(instances) ? instances.length : 1),
      total_findings: allFindings.length,
      ai_findings: aiFindings.length,
      manual_findings: manualFindings.length,
      significant_instances: significantInstances,
      findings_by_instance: findingsByInstance,
      all_findings: allFindings
    };

    console.log('✅ Study 레포트 데이터 준비 완료:', result);
    return result;
  }, [allAIResults, annotationBoxes, instances]);

  // 🔥 현재 인스턴스의 소견들 필터링
  const currentInstanceFindings = useMemo(() => {
    if (!studyReportData || !currentInstanceUID) return [];
    return studyReportData.findings_by_instance[currentInstanceUID] || [];
  }, [studyReportData, currentInstanceUID]);

  // 🔥 API에서 환자 정보 로드 (loadReport 함수가 있다면 사용)
  useEffect(() => {
    const loadPatientInfoFromAPI = async () => {
      if (isOpen && currentStudyUID) {
        setIsLoadingPatientInfo(true);
        try {
          // loadReport 함수가 있는 경우에만 사용
          if (typeof window !== 'undefined' && window.loadReport) {
            console.log('🔍 ReportModal에서 환자 정보 직접 로드 시도...');
            const result = await window.loadReport(currentStudyUID);
            
            if (result && result.status === 'success' && result.report) {
              const report = result.report;
              const apiInfo = {
                patient_name: report.patient_name || 'Unknown',
                patient_id: report.patient_id || 'Unknown',
                study_date: report.study_date || 
                           report.study_datetime?.split(' ')[0] || 
                           report.scheduled_exam_datetime?.split(' ')[0] ||
                           report.created_at?.split('T')[0] ||
                           'Unknown',
                doctor_name: report.doctor_name || '미배정',
                doctor_id: report.doctor_id || 'UNASSIGNED'
              };
              
              setApiPatientInfo(apiInfo);
              console.log('✅ API에서 환자 정보 로드 성공:', apiInfo);
            }
          }
        } catch (error) {
          console.error('❌ API 환자 정보 로드 실패:', error);
        } finally {
          setIsLoadingPatientInfo(false);
        }
      }
    };

    loadPatientInfoFromAPI();
  }, [isOpen, currentStudyUID]);

  // 🔥 초기 데이터 설정
  useEffect(() => {
    if (isOpen) {
      setReportText(initialContent);
      setReportStatus(initialStatus);
      setSelectedFindings([]);
      setAudioBlob(null);
      setAudioUrl(null);
      setSttLoading(false);
      checkMicrophonePermission();
      
      // 녹음 중이라면 정리
      if (isRecording) {
        stopRecording();
      }
    }
  }, [isOpen, initialContent, initialStatus]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // 환자 정보 우선순위: API > prop > fallback
  const patient = {
    ...patientInfo,
    patient_name: apiPatientInfo.patient_name || patientInfo.patient_name || 'Unknown',
    patient_id: apiPatientInfo.patient_id || patientInfo.patient_id || 'Unknown',
    study_date: apiPatientInfo.study_date || (patientInfo.study_date && patientInfo.study_date !== '' ? patientInfo.study_date : 'Unknown'),
    doctor_name: apiPatientInfo.doctor_name || (patientInfo.doctor_name && patientInfo.doctor_name !== '' ? patientInfo.doctor_name : '미배정'),
    doctor_id: apiPatientInfo.doctor_id || patientInfo.doctor_id || 'UNASSIGNED'
  };

  // 🔥 소견 추가 핸들러
  const handleAddFinding = (finding) => {
    const findingWithDisplay = {
      ...finding,
      selected_at: new Date().toISOString(),
      display_text: `인스턴스 #${finding.instanceNumber}: ${finding.label} (${finding.source})`
    };
    
    setSelectedFindings(prev => {
      if (prev.some(f => f.id === finding.id)) {
        return prev; // 이미 추가됨
      }
      return [...prev, findingWithDisplay];
    });
    
    console.log('➕ 소견 추가됨:', findingWithDisplay);
  };

  // 🔥 소견 제거 핸들러
  const handleRemoveFinding = (findingId) => {
    setSelectedFindings(prev => prev.filter(f => f.id !== findingId));
    console.log('➖ 소견 제거됨:', findingId);
  };

  // 🔥 인스턴스 이동 핸들러
  const handleGoToInstance = (instanceNumber) => {
    if (onGoToInstance && typeof onGoToInstance === 'function') {
      onGoToInstance(instanceNumber - 1);
      console.log('🔄 인스턴스 이동:', instanceNumber);
    }
  };

// 🔥 마이크 권한 확인
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ 마이크 권한 승인됨');
    } catch (error) {
      console.error('❌ 마이크 권한 거부됨:', error);
      setHasPermission(false);
    }
  };

  // 🔥 녹음 시작
  const startRecording = async () => {
    if (!hasPermission) {
      await checkMicrophonePermission();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      audioChunks.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.onerror = (event) => {
        console.error('❌ 녹음 오류:', event);
        setIsRecording(false);
        setMediaRecorder(null);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      console.log('🎤 녹음 시작됨');
    } catch (error) {
      console.error('❌ 녹음 시작 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  // 🔥 녹음 중지
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      console.log('🛑 녹음 중지');
    }
  };

  // 🔥 STT 처리
  const processSTT = async () => {
    if (!audioBlob) {
      alert('먼저 음성을 녹음해주세요.');
      return;
    }

    setSttLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('patient_id', patient.patient_id || 'UNKNOWN');
      formData.append('study_uid', currentStudyUID || 'UNKNOWN');
      
      // 🔥 선택된 소견 정보도 함께 전달
      if (selectedFindings.length > 0) {
        const findingsContext = selectedFindings.map(finding => ({
          instanceNumber: finding.instanceNumber,
          label: finding.label,
          type: finding.type,
          source: finding.source,
          confidence: finding.confidence
        }));
        
        formData.append('selected_findings', JSON.stringify(findingsContext));
      }

      console.log('🔄 STT 처리 중... (선택된 소견 포함)');

      const response = await fetch('http://localhost:8000/api/stt/upload/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`STT 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const soapText = result.corrected_text || result.original_text;
        
        // 🔥 선택된 소견 요약도 텍스트에 포함
        let finalText = soapText;
        
        if (selectedFindings.length > 0) {
          const findingsSummary = '\n\n=== 선택된 주요 소견 ===\n' + 
            selectedFindings.map(f => `- ${f.display_text}`).join('\n');
          finalText = soapText + findingsSummary;
        }
        
        // 기존 텍스트에 추가
        const newText = reportText ? `${reportText}\n\n${finalText}` : finalText;
        setReportText(newText);
        
        console.log('✅ SOAP 형식 STT 완료 (소견 포함):', finalText);
        alert('음성 인식이 완료되어 선택된 소견과 함께 SOAP 형식으로 종합소견에 추가되었습니다.');
        
        // 오디오 블롭 정리
        setAudioBlob(null);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          setAudioUrl(null);
        }
        
      } else {
        throw new Error(result.message || 'STT 처리 실패');
      }

    } catch (error) {
      console.error('❌ STT 처리 실패:', error);
      alert(`음성 인식 실패: ${error.message}`);
    } finally {
      setSttLoading(false);
    }
  };

  // 🔥 녹음 시간 타이머
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  // 🔥 레포트 저장/수정 핸들러
  const handleSave = async () => {
    if (!reportText.trim()) {
      alert('종합 소견을 입력해주세요.');
      return;
    }

    try {
      const reportData = {
        content: reportText,
        status: reportStatus,
        selected_findings: selectedFindings,
        patient_info: patient,
        study_uid: currentStudyUID,
        instance_uid: currentInstanceUID,
        created_at: new Date().toISOString()
      };

      if (typeof onSave === 'function') {
        const result = await onSave(reportData);
        
        if (result && result.success) {
          const action = result.isEdit ? '수정' : '저장';
          alert(`레포트가 ${action}되었습니다! (상태: ${reportStatus})`);
          handleClose();
        } else {
          const action = result?.isEdit ? '수정' : '저장';
          alert(`${action} 실패: ${result?.error || '알 수 없는 오류'}`);
        }
      } else {
        console.error('onSave 함수가 정의되지 않았습니다.');
        alert('저장 함수가 정의되지 않았습니다.');
      }
    } catch (error) {
      console.error('❌ 레포트 처리 실패:', error);
      alert('레포트 처리 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    // 녹음 중이면 중지
    if (isRecording) {
      stopRecording();
    }
    // 오디오 URL 정리
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    onClose();
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Study UID 표시용
  const displayStudyUID = currentStudyUID ? 
    currentStudyUID.substring(0, 30) + '...' : 'N/A';

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={handleOverlayClick}>
      <div className="report-modal-content">
        {/* 헤더 */}
        <div className="report-modal-header">
          <h2>{title}</h2>
          <button className="report-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>
        
        {/* 환자 정보 섹션 */}
        <div className="patient-info">
          <h3 className="patient-info-header">👤 환자 정보</h3>
          <div className="patient-grid">
            <div className="patient-grid-item">
              <strong>환자명:</strong> {patient.patient_name}
            </div>
            <div className="patient-grid-item">
              <strong>환자 ID:</strong> {patient.patient_id}
            </div>
            <div className="patient-grid-item">
              <strong>검사일:</strong> {patient.study_date}
            </div>
            <div className="patient-grid-item">
              <strong>판독의:</strong> {patient.doctor_name} {isLoadingPatientInfo && '(로딩중...)'}
            </div>
            <div className="patient-grid-item">
              <strong>Study UID:</strong> {displayStudyUID}
            </div>
          </div>
        </div>

        {/* Study 전체 요약 */}
        {studyReportData && (
          <div className="study-summary">
            <h3 className="study-summary-header">📊 Study 전체 요약</h3>
            <div className="study-summary-content">
              <p>
                총 {studyReportData.total_instances}개 인스턴스 중 {studyReportData.significant_instances.length}개에서 소견 발견
              </p>
              <p>
                AI 검출: {studyReportData.ai_findings}개, 수동 어노테이션: {studyReportData.manual_findings}개
              </p>
            </div>
          </div>
        )}

        {/* 현재 인스턴스 소견 */}
        <div className="current-instance-section">
          <h3 className="current-instance-header">
            🔍 현재 인스턴스 #{currentInstanceNumber} 소견
          </h3>
          {currentInstanceFindings.length > 0 ? (
            <div className="findings-grid">
              {currentInstanceFindings.map(finding => (
                <div key={finding.id} className="finding-item">
                  <div className="finding-info">
                    <span className={`finding-badge ${finding.type}`}>
                      {finding.type === 'ai' ? '🤖' : '✏️'}
                    </span>
                    <span className="finding-label">{finding.label}</span>
                    {finding.confidence && finding.confidence > 0 && (
                      <span className="finding-confidence">({finding.confidence}%)</span>
                    )}
                    <span className="finding-source">{finding.source}</span>
                  </div>
                  <button
                    className={`add-finding-btn ${
                      selectedFindings.some(f => f.id === finding.id) 
                        ? 'added' : 'available'
                    }`}
                    onClick={() => handleAddFinding(finding)}
                    disabled={selectedFindings.some(f => f.id === finding.id)}
                  >
                    {selectedFindings.some(f => f.id === finding.id) ? '✅ 추가됨' : '➕ 추가'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-findings">현재 인스턴스에는 소견이 없습니다.</p>
          )}
        </div>

        {/* 다른 인스턴스 네비게이션 */}
        {studyReportData && studyReportData.significant_instances.length > 1 && (
          <div className="instance-navigation">
            <h3 className="instance-navigation-header">🔄 다른 인스턴스 주요 소견</h3>
            <select 
              className="instance-selector"
              onChange={(e) => {
                const instanceNumber = parseInt(e.target.value);
                if (instanceNumber && !isNaN(instanceNumber)) {
                  handleGoToInstance(instanceNumber);
                }
              }}
              value=""
            >
              <option value="">인스턴스 이동...</option>
              {studyReportData.significant_instances
                .filter(instance => instance.instanceNumber !== currentInstanceNumber)
                .map(instance => (
                  <option key={instance.instanceUID} value={instance.instanceNumber}>
                    인스턴스 #{instance.instanceNumber}: {instance.summary} ({instance.count}개 소견)
                  </option>
                ))
              }
            </select>
          </div>
        )}

        {/* 선택된 소견 목록 */}
        <div className="selected-findings">
          <h3 className="selected-findings-header">📝 선택된 소견 ({selectedFindings.length}개)</h3>
          {selectedFindings.length > 0 ? (
            <div className="selected-findings-list">
              {selectedFindings.map(finding => (
                <div key={finding.id} className="selected-finding-item">
                  <span className="selected-finding-text">
                    {finding.display_text}
                  </span>
                  <button
                    className="remove-finding-btn"
                    onClick={() => handleRemoveFinding(finding.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              <button 
                className="clear-all-findings-btn"
                onClick={() => setSelectedFindings([])}
              >
                🗑️ 모두 제거
              </button>
            </div>
          ) : (
            <p className="no-selected-findings">
              선택된 소견이 없습니다. 위에서 소견을 선택해주세요.
            </p>
          )}
        </div>

        {/* STT 섹션 */}
        <div className="stt-section">
          <h3 className="stt-header">
            🎤 음성 인식 (SOAP 형식 자동 변환)
          </h3>
          
          {selectedFindings.length > 0 && (
            <div className="stt-context">
              <p className="stt-context-label">
                💡 다음 소견들을 참고하여 종합 의견을 말씀해주세요:
              </p>
              <ul className="stt-context-list">
                {selectedFindings.map(finding => (
                  <li key={finding.id}>{finding.display_text}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="stt-controls">
            {!isRecording ? (
              <button 
                className="button record-btn"
                onClick={startRecording}
                disabled={sttLoading || !hasPermission}
              >
                <Mic size={20} />
                🎤 녹음 시작
              </button>
            ) : (
              <div className="recording-controls">
                <button 
                  className="button stop-btn"
                  onClick={stopRecording}
                >
                  <StopCircle size={20} />
                  🔴 녹음 중지 ({formatTime(recordingTime)})
                </button>
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  녹음 중...
                </div>
              </div>
            )}
            
            {audioBlob && !isRecording && (
              <button 
                className="button process-btn"
                onClick={processSTT}
                disabled={sttLoading}
              >
                {sttLoading ? (
                  <>
                    <span className="spinner"></span>
                    🤖 변환 중...
                  </>
                ) : (
                  '🤖 SOAP 변환'
                )}
              </button>
            )}
          </div>

          {/* 오디오 재생 */}
          {audioUrl && (
            <div className="audio-playback">
              <audio
                src={audioUrl}
                controls
                className="audio-controls"
              />
              <p className="audio-hint">
                💡 녹음된 음성을 확인한 후 SOAP 변환 버튼을 눌러주세요.
              </p>
            </div>
          )}

          {/* 권한 없음 안내 */}
          {!hasPermission && (
            <div className="permission-warning">
              <strong>⚠️ 마이크 권한이 필요합니다</strong>
              <p>음성 인식을 사용하려면 브라우저에서 마이크 접근을 허용해야 합니다.</p>
              <button
                onClick={checkMicrophonePermission}
                className="button permission-button"
              >
                권한 다시 요청
              </button>
            </div>
          )}
        </div>
        
        {/* AI 분석 결과 섹션 (기존 호환성 유지) */}
        {allAIResults && allAIResults.results && allAIResults.results.length > 0 && (
          <div className="ai-results">
            <h3 className="ai-results-header">
              🤖 AI 분석 결과 (상세)
            </h3>
            
            <div className="ai-results-summary">
              <strong>사용 모델:</strong> {
                allAIResults.model_used || 
                allAIResults.model_type || 
                allAIResults.model ||
                allAIResults.models?.[0] ||
                allAIResults.results?.[0]?.model ||
                'Unknown'
              } | 
              <strong> 총 검출:</strong> {allAIResults.detections || allAIResults.results.length}개
            </div>
            
            {allAIResults.results.map((result, index) => (
              <div 
                key={index} 
                className={`detection-item ${
                  result.confidence > 0.8 ? 'detection-item-high' : 'detection-item-low'
                }`}
              >
                <div>
                  <div className={`detection-label ${
                    result.confidence > 0.8 ? 'detection-label-high' : 'detection-label-low'
                  }`}>
                    {result.label}
                  </div>
                  <div className="detection-location">
                    위치: [{result.bbox.join(', ')}]
                  </div>
                </div>
                <span className={`confidence-badge ${
                  result.confidence > 0.8 ? 'confidence-badge-high' : 'confidence-badge-low'
                }`}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* 수동 어노테이션 섹션 (기존 호환성 유지) */}
        {annotationBoxes.length > 0 && (
          <div className="annotations">
            <h3 className="annotations-header">
              ✏️ 수동 어노테이션 (상세)
            </h3>
            
            {annotationBoxes.map((box, index) => (
              <div key={box.id} className="annotation-item">
                <div>
                  <div className="annotation-label">
                    수동 마킹 {index + 1}: {box.label}
                  </div>
                  <div className="annotation-location">
                    화면 위치: [{box.left}, {box.top}, {box.left + box.width}, {box.top + box.height}]
                  </div>
                  {box.doctor_name && (
                    <div className="annotation-doctor">
                      판독의: {box.doctor_name}
                    </div>
                  )}
                </div>
                <span className="annotation-badge">
                  수동
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* 종합 소견 섹션 */}
        <div className="report-section">
          <h3 className="report-section-header">📝 종합 소견</h3>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="의료진의 종합 소견을 입력하세요...

SOAP 형식 예시:

S (Subjective - 주관적 소견):
환자가 호소하는 증상이나 병력

O (Objective - 객관적 소견):
영상에서 관찰되는 구체적인 소견들
- 심장 크기 및 형태
- 폐 실질 소견
- 흉막 소견

A (Assessment - 평가/진단):
영상 소견을 바탕으로 한 진단적 평가

P (Plan - 계획):
추가 검사나 추적 관찰 권고사항"
            className="report-textarea"
            rows={15}
          />
          <div className="textarea-footer">
            <span>글자 수: {reportText.length}</span>
            <span>💡 음성인식 결과가 SOAP 형식으로 자동 추가됩니다</span>
          </div>
        </div>

        {/* 레포트 상태 */}
        <div className="report-status-section">
          <h3 className="report-status-header">📋 레포트 상태</h3>
          <select 
            value={reportStatus} 
            onChange={(e) => setReportStatus(e.target.value)}
            className="status-selector"
          >
            <option value="draft">초안</option>
            <option value="completed">완료</option>
            <option value="approved">승인</option>
          </select>
        </div>
        
        {/* 버튼 섹션 */}
        <div className="button-container">
          <button
            onClick={handleClose}
            className="button cancel-button"
          >
            ❌ 취소
          </button>
          
          <button
            onClick={handlePrint}
            className="button print-button"
          >
            🖨️ 인쇄
          </button>
          
          <button
            onClick={handleSave}
            className="button save-button"
            disabled={sttLoading}
          >
            <Save size={20} />
            💾 레포트 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;