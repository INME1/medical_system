// // /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/RightPanel.js

// import React from 'react';
// import { Ruler, Brain, Edit, FileText, X } from 'lucide-react';
// import PanelButton from './PanelButton';
// import MeasurementsPanel from './MeasurementsPanel';
// import AIAnnotationsPanel from './AIAnnotationsPanel';
// import ManualAnnotationsPanel from './ManualAnnotationsPanel';
// import ReportsPanel from './ReportsPanel';
// import './RightPanel.css';

// const RightPanel = ({ 
//   activeRightPanel, 
//   setActiveRightPanel,
//   addMeasurementToAnnotations, 
  
//   // AI 관련
//   aiResults,
//   onToggleAnnotationVisibility,
//   onDeleteAnnotation,

//   // ai 관련 추가: useAI 훅에서 오는 새로운 AI 관련 props
//   currentInstanceResults,    // 현재 인스턴스의 AI 결과
//   allAIResults,             // 전체 Study AI 결과
//   analysisStatus,           // 분석 상태 메시지
//   isAnalyzing,             // 분석 중 여부
//   loadAllAIResults,        // AI 결과 로드 함수
//   updateCurrentInstanceResults, // 인스턴스 결과 업데이트
//   getStudyStats,           // Study 통계
//   getModelStats,           // 모델별 통계
  
//   // 측정값 관련 props - 분리된 데이터
//   unlabeledMeasurements, // 🔥 라벨 없는 측정값들 (MeasurementsPanel용)
//   labeledMeasurements,   // 🔥 라벨 있는 측정값들 (ManualAnnotationsPanel용)
//   manualAnnotations,
//   selectedMeasurement,
//   setSelectedMeasurement,
//   onDeleteMeasurement,
//   onClearAllMeasurements,
//   onAddManualAnnotation,
//   onDeleteManualAnnotation,
//   onEditManualAnnotation,
//   onToggleMeasurementVisibility,
//   onExportMeasurements,
//   getMeasurementStats,
  
//   // 🔥 모두숨기기 관련 props
//   onToggleAllMeasurements,
//   allMeasurementsHidden,
  
//   // 🔥 편집 관련 props
//   onStartEditMode,
//   onStopEditMode,
//   isEditMode,
//   editingMeasurement,
  
//   // 🔥 하이라이트 관련 props
//   onHighlightMeasurement,
  
//   // 🔥 DICOM 인스턴스 관련 props 추가
//   currentStudyUID,
//   currentInstanceUID,
//   currentInstanceNumber,
  
//   // 🔥 상태 관리 관련 props 추가
//   setAnalysisStatus,
//   setActiveLayer,
  
//   // 🔥 새로 추가: Layout에서 전달받는 Django 어노테이션 관련 props
//   saveAnnotationsToServer,
//   loadAnnotationsFromServer,
//   clearAllAnnotations,
//   annotationBoxes = [], // 🔥 Layout에서 생성한 어노테이션 데이터
  
//   // 🚀 ReportsPanel에 필요한 props들 추가
//   reports,              // useReports 훅 결과
//   showReportModal,      // 모달 상태
//   setShowReportModal,   // 모달 상태 변경 함수
//   patientInfo,          // 환자 정보
//   onEditReport,         // 레포트 편집 핸들러
//   onViewReport,         // 레포트 보기 핸들러
  
//   // 기타
//   instances,
//   currentImageIndex,
//   onImageSelect
// }) => {
//   const rightPanelIcons = [
//     { id: 'measurements', icon: Ruler, label: '측정값' },
//     { id: 'ai-annotations', icon: Brain, label: 'AI 주석/라벨' },
//     { id: 'manual-annotations', icon: Edit, label: '수동 주석/라벨' },
//     { id: 'reports', icon: FileText, label: '리포트 목록' }
//   ];

//   const handlePanelToggle = (panelId) => {
//     setActiveRightPanel(activeRightPanel === panelId ? null : panelId);
//   };

//   // 🔥 수정: 디버깅을 위한 로그 - 분리된 측정값 + Reports 관련 추가
//   console.log('🔧 RightPanel - Props 확인:', {
//     currentStudyUID,
//     currentInstanceUID,
//     currentInstanceNumber,
//     hasSetAnalysisStatus: !!setAnalysisStatus,
//     hasSetActiveLayer: !!setActiveLayer,
//     activeRightPanel,
//     // 🔥 수정: 분리된 측정값 디버깅

//     unlabeledMeasurementsCount: unlabeledMeasurements?.length || 0,
//     labeledMeasurementsCount: labeledMeasurements?.length || 0,
//     selectedMeasurement: selectedMeasurement ? { id: selectedMeasurement.id, label: selectedMeasurement.label } : null,
//     editingMeasurement: editingMeasurement ? { id: editingMeasurement.id, label: editingMeasurement.label } : null,
//     isEditMode,

//     // 🔥 새로 추가: AI 관련 디버깅 정보
//     hasCurrentInstanceResults: !!currentInstanceResults,
//     currentInstanceResultsCount: currentInstanceResults ? 
//       Object.keys(currentInstanceResults).reduce((sum, model) => sum + (currentInstanceResults[model]?.length || 0), 0) : 0,
//     hasAllAIResults: !!allAIResults,
//     allAIResultsInstanceCount: allAIResults?.groupedByInstance ? Object.keys(allAIResults.groupedByInstance).length : 0,
//     isAnalyzing,
//     analysisStatus,
//     hasLoadAllAIResults: !!loadAllAIResults,
//     hasUpdateCurrentInstanceResults: !!updateCurrentInstanceResults,
    
//     // 🔥 Django 어노테이션 관련 디버깅
//     annotationBoxesCount: annotationBoxes?.length || 0,
//     hasSaveFunction: !!saveAnnotationsToServer,
//     hasLoadFunction: !!loadAnnotationsFromServer,
//     hasClearFunction: !!clearAllAnnotations,
//     hasAddFunction: !!addMeasurementToAnnotations,
    
//     // 🚀 Reports 관련 디버깅 정보 추가
//     hasReports: !!reports,
//     hasReportsList: !!(reports?.reportList),
//     reportsListCount: reports?.reportList?.length || 0,
//     hasShowReportModal: typeof showReportModal !== 'undefined',
//     showReportModalValue: showReportModal,
//     hasSetShowReportModal: !!setShowReportModal,
//     hasPatientInfo: !!patientInfo,
//     patientInfoId: patientInfo?.patient_id || 'Unknown',
//     hasOnEditReport: !!onEditReport,
//     hasOnViewReport: !!onViewReport
//   });

//   const renderPanelContent = () => {
//     switch (activeRightPanel) {
//       case 'measurements':
//         return (
//           <MeasurementsPanel 
//             // 🔥 수정: 라벨 없는 측정값만 전달
//             measurements={unlabeledMeasurements}
//             selectedMeasurement={selectedMeasurement}
//             onSelectMeasurement={setSelectedMeasurement}
//             onDeleteMeasurement={onDeleteMeasurement}
//             onToggleMeasurementVisibility={onToggleMeasurementVisibility}
//             onClearAllMeasurements={onClearAllMeasurements}
//             onExportMeasurements={onExportMeasurements}
//             getMeasurementStats={getMeasurementStats}
            
//             // 🔥 모두숨기기 관련 props 전달
//             onToggleAllMeasurements={onToggleAllMeasurements}
//             allMeasurementsHidden={allMeasurementsHidden}
            
//             // 🔥 편집 관련 props 전달
//             onStartEditMode={onStartEditMode}
//             onStopEditMode={onStopEditMode}
//             isEditMode={isEditMode}
//             editingMeasurement={editingMeasurement}
//           />
//         );

//       case 'ai-annotations':
//         return (
//           <AIAnnotationsPanel 
//             // 🔥 기존 props (하위 호환성)
//             aiResults={aiResults}
//             onToggleVisibility={onToggleAnnotationVisibility}
//             onDeleteAnnotation={onDeleteAnnotation}
            
//             // 🔥 새로운 props - useAI 훅 연동
//             currentInstanceResults={currentInstanceResults}
//             allAIResults={allAIResults}
//             analysisStatus={analysisStatus}
//             isAnalyzing={isAnalyzing}
            
//             // 🔥 인스턴스 정보
//             currentStudyUID={currentStudyUID}
//             currentInstanceUID={currentInstanceUID}
//             currentInstanceNumber={currentInstanceNumber}
            
//             // 🔥 AI 관련 함수들
//             loadAllAIResults={loadAllAIResults}
//             updateCurrentInstanceResults={updateCurrentInstanceResults}
//             getStudyStats={getStudyStats}
//             getModelStats={getModelStats}
//           />
//         );

//       case 'manual-annotations':
//         return (
//           <ManualAnnotationsPanel 
//             // 🔥 기존 props
//             manualAnnotations={manualAnnotations}
//             onAddManualAnnotation={onAddManualAnnotation}
//             onDeleteManualAnnotation={onDeleteManualAnnotation}
//             onEditManualAnnotation={onEditManualAnnotation}
            
//             // 🔥 수정: 라벨 있는 측정값만 전달
//             measurements={labeledMeasurements}
//             onToggleMeasurementVisibility={onToggleMeasurementVisibility}
//             onToggleAllMeasurements={onToggleAllMeasurements}
//             allMeasurementsHidden={allMeasurementsHidden}
//             onHighlightMeasurement={onHighlightMeasurement}
//             selectedMeasurement={selectedMeasurement}
//             setSelectedMeasurement={setSelectedMeasurement}
//             addMeasurementToAnnotations={addMeasurementToAnnotations}
            
//             // 🔥 편집 관련 props - 누락되었던 부분 추가
//             onStartEditMode={onStartEditMode}
//             onStopEditMode={onStopEditMode}
//             isEditMode={isEditMode}
//             editingMeasurement={editingMeasurement}
            
//             // 🔥 측정값 통계 및 내보내기 관련 props 추가
//             onDeleteMeasurement={onDeleteMeasurement}
//             onClearAllMeasurements={onClearAllMeasurements}
//             onExportMeasurements={onExportMeasurements}
//             getMeasurementStats={getMeasurementStats}
            
//             // 🔥 Django API 연동용 props
//             currentStudyUID={currentStudyUID}
//             currentInstanceUID={currentInstanceUID}
//             currentInstanceNumber={currentInstanceNumber}
//             setAnalysisStatus={setAnalysisStatus}
//             setActiveLayer={setActiveLayer}
            
//             // 🔥 새로 추가: Layout에서 전달받는 Django 어노테이션 함수들과 데이터
//             saveAnnotationsToServer={saveAnnotationsToServer}
//             loadAnnotationsFromServer={loadAnnotationsFromServer}
//             clearAllAnnotations={clearAllAnnotations}
//             annotationBoxes={annotationBoxes} // 🔥 핵심: Layout에서 생성한 어노테이션 데이터
//           />
//         );
        
//       case 'reports':
//         return (
//           <ReportsPanel 
//             reports={reports}
//             showReportModal={showReportModal}
//             setShowReportModal={setShowReportModal}
//             currentStudyUID={currentStudyUID}
//             patientInfo={patientInfo}
//             onEditReport={onEditReport}
//             onViewReport={onViewReport}
//           />
//         );
        
//       default:
//         return null;
//     }
//   };

//   return (
//     <>
//       {/* 패널 버튼들 */}
//       <div className="mv-right-panel-buttons">
//         {rightPanelIcons.map((panelIcon) => (
//           <PanelButton
//             key={panelIcon.id}
//             icon={panelIcon.icon}
//             label={panelIcon.label}
//             isActive={activeRightPanel === panelIcon.id}
//             onClick={() => handlePanelToggle(panelIcon.id)}
//           />
//         ))}
//       </div>

//       {/* 패널 내용 */}
//       {activeRightPanel && (
//         <div className="mv-right-panel">
//           <div className="mv-panel-header">
//             <h3 className="mv-panel-title">
//               {rightPanelIcons.find(p => p.id === activeRightPanel)?.label}
              
//               {/* 🔥 인스턴스 정보 표시 (manual-annotations 패널일 때만) */}
//               {activeRightPanel === 'manual-annotations' && currentInstanceNumber && (
//                 <span className="mv-panel-instance-info">
//                   - 슬라이스 #{currentInstanceNumber}
//                 </span>
//               )}
//               {/* 🔥 새로 추가: AI 패널일 때 분석 상태 표시 */}
//               {activeRightPanel === 'ai-annotations' && analysisStatus && (
//                 <span className="mv-panel-status-info">
//                   - {analysisStatus}
//                 </span>
//               )}
//               {/* 🚀 Reports 패널일 때 환자 정보 표시 */}
//               {activeRightPanel === 'reports' && patientInfo?.patient_name && (
//                 <span className="mv-panel-patient-info">
//                   - {patientInfo.patient_name}
//                 </span>
//               )}
//             </h3>
//             <button
//               onClick={() => setActiveRightPanel(null)}
//               className="mv-panel-close"
//             >
//               <X size={20} />
//             </button>
//           </div>

//           🔥 연결 상태 표시 (개발용)
//           {activeRightPanel === 'manual-annotations' && (
//             <div className="mv-panel-connection-status">
//               <div className="mv-connection-indicator">
//                 <span className={`mv-status-dot ${currentStudyUID && currentInstanceUID ? 'connected' : 'disconnected'}`}></span>
//                 <span className="mv-status-text">
//                   {currentStudyUID && currentInstanceUID ? 
//                     `연결됨 (Study: ${currentStudyUID.slice(-8)}..., Instance: ${currentInstanceUID.slice(-8)}...)` : 
//                     '연결되지 않음'
//                   }
//                 </span>
//               </div>
              
//               {/* 🔥 수정: 디버깅 정보 표시 - 분리된 측정값 반영 */}
//               <div className="mv-debug-status" style={{ 
//                 fontSize: '10px', 
//                 color: '#666', 
//                 marginTop: '4px',
//                 background: '#f0f0f0',
//                 padding: '4px',
//                 borderRadius: '3px'
//               }}>
//                 라벨없음: {unlabeledMeasurements?.length || 0}개 | 
//                 라벨있음: {labeledMeasurements?.length || 0}개 | 
//                 어노테이션: {annotationBoxes?.length || 0}개 | 
//                 선택됨: {selectedMeasurement?.id || 'None'} | 
//                 편집중: {editingMeasurement?.id || 'None'}
//               </div>
//             </div>
//           )}

//           {/* 🔥 새로 추가: AI 패널 연결 상태 표시 (개발용) */}
//           {activeRightPanel === 'ai-annotations' && process.env.NODE_ENV === 'development' && (
//             <div className="mv-panel-connection-status">
//               <div className="mv-connection-indicator">
//                 <span className={`mv-status-dot ${currentStudyUID && currentInstanceUID ? 'connected' : 'disconnected'}`}></span>
//                 <span className="mv-status-text">
//                   {currentStudyUID && currentInstanceUID ? 
//                     `AI 연결됨 (Study: ${currentStudyUID.slice(-8)}..., Instance: ${currentInstanceUID.slice(-8)}...)` : 
//                     'AI 연결되지 않음'
//                   }
//                 </span>
//               </div>
              
//               {/* AI 디버깅 정보 */}
//               <div className="mv-debug-status" style={{ 
//                 fontSize: '10px', 
//                 color: '#666', 
//                 marginTop: '4px',
//                 background: '#e6f3ff',
//                 padding: '4px',
//                 borderRadius: '3px'
//               }}>
//                 현재결과: {currentInstanceResults ? 
//                   Object.keys(currentInstanceResults).map(model => 
//                     `${model}:${currentInstanceResults[model]?.length || 0}`
//                   ).join(' | ') : 'None'
//                 } | 
//                 전체인스턴스: {allAIResults?.groupedByInstance ? Object.keys(allAIResults.groupedByInstance).length : 0}개 | 
//                 분석중: {isAnalyzing ? 'Yes' : 'No'} | 
//                 상태: {analysisStatus || 'None'}
//               </div>
//             </div>
//           )}

//           {/* 🚀 새로 추가: Reports 패널 연결 상태 표시 (개발용) */}
//           {activeRightPanel === 'reports' && process.env.NODE_ENV === 'development' && (
//             <div className="mv-panel-connection-status">
//               <div className="mv-connection-indicator">
//                 <span className={`mv-status-dot ${reports && patientInfo ? 'connected' : 'disconnected'}`}></span>
//                 <span className="mv-status-text">
//                   {reports && patientInfo ? 
//                     `Reports 연결됨 (Patient: ${patientInfo.patient_id || 'Unknown'})` : 
//                     'Reports 연결되지 않음'
//                   }
//                 </span>
//               </div>
              
//               {/* Reports 디버깅 정보 */}
//               <div className="mv-debug-status" style={{ 
//                 fontSize: '10px', 
//                 color: '#666', 
//                 marginTop: '4px',
//                 background: '#f0fff0',
//                 padding: '4px',
//                 borderRadius: '3px'
//               }}>
//                 레포트수: {reports?.reportList?.length || 0}개 | 
//                 모달상태: {showReportModal ? 'Open' : 'Closed'} | 
//                 환자ID: {patientInfo?.patient_id || 'None'} | 
//                 StudyUID: {currentStudyUID ? currentStudyUID.slice(-8) + '...' : 'None'}
//               </div>
//             </div>
//           )}

//           {renderPanelContent()}
//         </div>
//       )}
//     </>
//   );
// };

// export default RightPanel;


// /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/RightPanel.js

import React from 'react';
import { Ruler, Brain, Edit, FileText, X } from 'lucide-react';
import PanelButton from './PanelButton';
import MeasurementsPanel from './MeasurementsPanel';
import AIAnnotationsPanel from './AIAnnotationsPanel';
import ManualAnnotationsPanel from './ManualAnnotationsPanel';
import ReportsPanel from './ReportsPanel';
import './RightPanel.css';

const RightPanel = ({ 
  activeRightPanel, 
  setActiveRightPanel,
  addMeasurementToAnnotations, 
  
  // AI 관련
  aiResults,
  onToggleAnnotationVisibility,
  onDeleteAnnotation,

  // ai 관련 추가: useAI 훅에서 오는 새로운 AI 관련 props
  currentInstanceResults,    // 현재 인스턴스의 AI 결과
  allAIResults,             // 전체 Study AI 결과
  analysisStatus,           // 분석 상태 메시지
  isAnalyzing,             // 분석 중 여부
  loadAllAIResults,        // AI 결과 로드 함수
  updateCurrentInstanceResults, // 인스턴스 결과 업데이트
  getStudyStats,           // Study 통계
  getModelStats,           // 모델별 통계
  
  // 측정값 관련 props - 분리된 데이터
  unlabeledMeasurements, // 🔥 라벨 없는 측정값들 (MeasurementsPanel용)
  labeledMeasurements,   // 🔥 라벨 있는 측정값들 (ManualAnnotationsPanel용)
  manualAnnotations,
  selectedMeasurement,
  setSelectedMeasurement,
  onDeleteMeasurement,
  onClearAllMeasurements,
  onAddManualAnnotation,
  onDeleteManualAnnotation,
  onEditManualAnnotation,
  onToggleMeasurementVisibility,
  onExportMeasurements,
  getMeasurementStats,
  
  // 🔥 모두숨기기 관련 props
  onToggleAllMeasurements,
  allMeasurementsHidden,
  
  // 🔥 편집 관련 props
  onStartEditMode,
  onStopEditMode,
  isEditMode,
  editingMeasurement,
  
  // 🔥 하이라이트 관련 props
  onHighlightMeasurement,
  
  // 🔥 DICOM 인스턴스 관련 props 추가
  currentStudyUID,
  currentInstanceUID,
  currentInstanceNumber,
  
  // 🔥 상태 관리 관련 props 추가
  setAnalysisStatus,
  setActiveLayer,
  
  // 🔥 새로 추가: Layout에서 전달받는 Django 어노테이션 관련 props
  saveAnnotationsToServer,
  loadAnnotationsFromServer,
  clearAllAnnotations,
  annotationBoxes = [], // 🔥 Layout에서 생성한 어노테이션 데이터
  
  // 🚀 ReportsPanel에 필요한 props들 추가
  reports,              // useReports 훅 결과
  showReportModal,      // 모달 상태
  setShowReportModal,   // 모달 상태 변경 함수
  patientInfo,          // 환자 정보
  onEditReport,         // 레포트 편집 핸들러
  onViewReport,         // 레포트 보기 핸들러
  
  // 기타
  instances,
  currentImageIndex,
  onImageSelect
}) => {
  const rightPanelIcons = [
    { id: 'measurements', icon: Ruler, label: '측정값' },
    { id: 'ai-annotations', icon: Brain, label: 'AI 주석/라벨' },
    { id: 'manual-annotations', icon: Edit, label: '수동 주석/라벨' },
    { id: 'reports', icon: FileText, label: '리포트 목록' }
  ];

  const handlePanelToggle = (panelId) => {
    setActiveRightPanel(activeRightPanel === panelId ? null : panelId);
  };

  // 🔥 주석처리: 디버깅을 위한 로그 - 분리된 측정값 + Reports 관련 추가
  /*
  console.log('🔧 RightPanel - Props 확인:', {
    currentStudyUID,
    currentInstanceUID,
    currentInstanceNumber,
    hasSetAnalysisStatus: !!setAnalysisStatus,
    hasSetActiveLayer: !!setActiveLayer,
    activeRightPanel,
    // 🔥 수정: 분리된 측정값 디버깅

    unlabeledMeasurementsCount: unlabeledMeasurements?.length || 0,
    labeledMeasurementsCount: labeledMeasurements?.length || 0,
    selectedMeasurement: selectedMeasurement ? { id: selectedMeasurement.id, label: selectedMeasurement.label } : null,
    editingMeasurement: editingMeasurement ? { id: editingMeasurement.id, label: editingMeasurement.label } : null,
    isEditMode,

    // 🔥 새로 추가: AI 관련 디버깅 정보
    hasCurrentInstanceResults: !!currentInstanceResults,
    currentInstanceResultsCount: currentInstanceResults ? 
      Object.keys(currentInstanceResults).reduce((sum, model) => sum + (currentInstanceResults[model]?.length || 0), 0) : 0,
    hasAllAIResults: !!allAIResults,
    allAIResultsInstanceCount: allAIResults?.groupedByInstance ? Object.keys(allAIResults.groupedByInstance).length : 0,
    isAnalyzing,
    analysisStatus,
    hasLoadAllAIResults: !!loadAllAIResults,
    hasUpdateCurrentInstanceResults: !!updateCurrentInstanceResults,
    
    // 🔥 Django 어노테이션 관련 디버깅
    annotationBoxesCount: annotationBoxes?.length || 0,
    hasSaveFunction: !!saveAnnotationsToServer,
    hasLoadFunction: !!loadAnnotationsFromServer,
    hasClearFunction: !!clearAllAnnotations,
    hasAddFunction: !!addMeasurementToAnnotations,
    
    // 🚀 Reports 관련 디버깅 정보 추가
    hasReports: !!reports,
    hasReportsList: !!(reports?.reportList),
    reportsListCount: reports?.reportList?.length || 0,
    hasShowReportModal: typeof showReportModal !== 'undefined',
    showReportModalValue: showReportModal,
    hasSetShowReportModal: !!setShowReportModal,
    hasPatientInfo: !!patientInfo,
    patientInfoId: patientInfo?.patient_id || 'Unknown',
    hasOnEditReport: !!onEditReport,
    hasOnViewReport: !!onViewReport
  });
  */

  const renderPanelContent = () => {
    switch (activeRightPanel) {
      case 'measurements':
        return (
          <MeasurementsPanel 
            // 🔥 수정: 라벨 없는 측정값만 전달
            measurements={unlabeledMeasurements}
            selectedMeasurement={selectedMeasurement}
            onSelectMeasurement={setSelectedMeasurement}
            onDeleteMeasurement={onDeleteMeasurement}
            onToggleMeasurementVisibility={onToggleMeasurementVisibility}
            onClearAllMeasurements={onClearAllMeasurements}
            onExportMeasurements={onExportMeasurements}
            getMeasurementStats={getMeasurementStats}
            
            // 🔥 모두숨기기 관련 props 전달
            onToggleAllMeasurements={onToggleAllMeasurements}
            allMeasurementsHidden={allMeasurementsHidden}
            
            // 🔥 편집 관련 props 전달
            onStartEditMode={onStartEditMode}
            onStopEditMode={onStopEditMode}
            isEditMode={isEditMode}
            editingMeasurement={editingMeasurement}
          />
        );

      case 'ai-annotations':
        return (
          <AIAnnotationsPanel 
            // 🔥 기존 props (하위 호환성)
            aiResults={aiResults}
            onToggleVisibility={onToggleAnnotationVisibility}
            onDeleteAnnotation={onDeleteAnnotation}
            
            // 🔥 새로운 props - useAI 훅 연동
            currentInstanceResults={currentInstanceResults}
            allAIResults={allAIResults}
            analysisStatus={analysisStatus}
            isAnalyzing={isAnalyzing}
            
            // 🔥 인스턴스 정보
            currentStudyUID={currentStudyUID}
            currentInstanceUID={currentInstanceUID}
            currentInstanceNumber={currentInstanceNumber}
            
            // 🔥 AI 관련 함수들
            loadAllAIResults={loadAllAIResults}
            updateCurrentInstanceResults={updateCurrentInstanceResults}
            getStudyStats={getStudyStats}
            getModelStats={getModelStats}
          />
        );

      case 'manual-annotations':
        return (
          <ManualAnnotationsPanel 
            // 🔥 기존 props
            manualAnnotations={manualAnnotations}
            onAddManualAnnotation={onAddManualAnnotation}
            onDeleteManualAnnotation={onDeleteManualAnnotation}
            onEditManualAnnotation={onEditManualAnnotation}
            
            // 🔥 수정: 라벨 있는 측정값만 전달
            measurements={labeledMeasurements}
            onToggleMeasurementVisibility={onToggleMeasurementVisibility}
            onToggleAllMeasurements={onToggleAllMeasurements}
            allMeasurementsHidden={allMeasurementsHidden}
            onHighlightMeasurement={onHighlightMeasurement}
            selectedMeasurement={selectedMeasurement}
            setSelectedMeasurement={setSelectedMeasurement}
            addMeasurementToAnnotations={addMeasurementToAnnotations}
            
            // 🔥 편집 관련 props - 누락되었던 부분 추가
            onStartEditMode={onStartEditMode}
            onStopEditMode={onStopEditMode}
            isEditMode={isEditMode}
            editingMeasurement={editingMeasurement}
            
            // 🔥 측정값 통계 및 내보내기 관련 props 추가
            onDeleteMeasurement={onDeleteMeasurement}
            onClearAllMeasurements={onClearAllMeasurements}
            onExportMeasurements={onExportMeasurements}
            getMeasurementStats={getMeasurementStats}
            
            // 🔥 Django API 연동용 props
            currentStudyUID={currentStudyUID}
            currentInstanceUID={currentInstanceUID}
            currentInstanceNumber={currentInstanceNumber}
            setAnalysisStatus={setAnalysisStatus}
            setActiveLayer={setActiveLayer}
            
            // 🔥 새로 추가: Layout에서 전달받는 Django 어노테이션 함수들과 데이터
            saveAnnotationsToServer={saveAnnotationsToServer}
            loadAnnotationsFromServer={loadAnnotationsFromServer}
            clearAllAnnotations={clearAllAnnotations}
            annotationBoxes={annotationBoxes} // 🔥 핵심: Layout에서 생성한 어노테이션 데이터
          />
        );
        
      case 'reports':
        return (
          <ReportsPanel 
            reports={reports}
            showReportModal={showReportModal}
            setShowReportModal={setShowReportModal}
            currentStudyUID={currentStudyUID}
            patientInfo={patientInfo}
            onEditReport={onEditReport}
            onViewReport={onViewReport}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      {/* 패널 버튼들 */}
      <div className="mv-right-panel-buttons">
        {rightPanelIcons.map((panelIcon) => (
          <PanelButton
            key={panelIcon.id}
            icon={panelIcon.icon}
            label={panelIcon.label}
            isActive={activeRightPanel === panelIcon.id}
            onClick={() => handlePanelToggle(panelIcon.id)}
          />
        ))}
      </div>

      {/* 패널 내용 */}
      {activeRightPanel && (
        <div className="mv-right-panel">
          <div className="mv-panel-header">
            <h3 className="mv-panel-title">
              {rightPanelIcons.find(p => p.id === activeRightPanel)?.label}
              
              {/* 🔥 인스턴스 정보 표시 (manual-annotations 패널일 때만) */}
              {activeRightPanel === 'manual-annotations' && currentInstanceNumber && (
                <span className="mv-panel-instance-info">
                  - 슬라이스 #{currentInstanceNumber}
                </span>
              )}
              {/* 🔥 새로 추가: AI 패널일 때 분석 상태 표시 */}
              {activeRightPanel === 'ai-annotations' && analysisStatus && (
                <span className="mv-panel-status-info">
                  - {analysisStatus}
                </span>
              )}
              {/* 🚀 Reports 패널일 때 환자 정보 표시 */}
              {activeRightPanel === 'reports' && patientInfo?.patient_name && (
                <span className="mv-panel-patient-info">
                  - {patientInfo.patient_name}
                </span>
              )}
            </h3>
            <button
              onClick={() => setActiveRightPanel(null)}
              className="mv-panel-close"
            >
              <X size={20} />
            </button>
          </div>

          {/* 🔥 주석처리: 연결 상태 표시 (개발용) */}
          {/*
          {activeRightPanel === 'manual-annotations' && (
            <div className="mv-panel-connection-status">
              <div className="mv-connection-indicator">
                <span className={`mv-status-dot ${currentStudyUID && currentInstanceUID ? 'connected' : 'disconnected'}`}></span>
                <span className="mv-status-text">
                  {currentStudyUID && currentInstanceUID ? 
                    `연결됨 (Study: ${currentStudyUID.slice(-8)}..., Instance: ${currentInstanceUID.slice(-8)}...)` : 
                    '연결되지 않음'
                  }
                </span>
              </div>
              
              <div className="mv-debug-status" style={{ 
                fontSize: '10px', 
                color: '#666', 
                marginTop: '4px',
                background: '#f0f0f0',
                padding: '4px',
                borderRadius: '3px'
              }}>
                라벨없음: {unlabeledMeasurements?.length || 0}개 | 
                라벨있음: {labeledMeasurements?.length || 0}개 | 
                어노테이션: {annotationBoxes?.length || 0}개 | 
                선택됨: {selectedMeasurement?.id || 'None'} | 
                편집중: {editingMeasurement?.id || 'None'}
              </div>
            </div>
          )}
          */}

          {/* 🔥 주석처리: AI 패널 연결 상태 표시 (개발용) */}
          {/*
          {activeRightPanel === 'ai-annotations' && process.env.NODE_ENV === 'development' && (
            <div className="mv-panel-connection-status">
              <div className="mv-connection-indicator">
                <span className={`mv-status-dot ${currentStudyUID && currentInstanceUID ? 'connected' : 'disconnected'}`}></span>
                <span className="mv-status-text">
                  {currentStudyUID && currentInstanceUID ? 
                    `AI 연결됨 (Study: ${currentStudyUID.slice(-8)}..., Instance: ${currentInstanceUID.slice(-8)}...)` : 
                    'AI 연결되지 않음'
                  }
                </span>
              </div>
              
              <div className="mv-debug-status" style={{ 
                fontSize: '10px', 
                color: '#666', 
                marginTop: '4px',
                background: '#e6f3ff',
                padding: '4px',
                borderRadius: '3px'
              }}>
                현재결과: {currentInstanceResults ? 
                  Object.keys(currentInstanceResults).map(model => 
                    `${model}:${currentInstanceResults[model]?.length || 0}`
                  ).join(' | ') : 'None'
                } | 
                전체인스턴스: {allAIResults?.groupedByInstance ? Object.keys(allAIResults.groupedByInstance).length : 0}개 | 
                분석중: {isAnalyzing ? 'Yes' : 'No'} | 
                상태: {analysisStatus || 'None'}
              </div>
            </div>
          )}
          */}

          {/* 🔥 주석처리: Reports 패널 연결 상태 표시 (개발용) */}
          {/*
          {activeRightPanel === 'reports' && process.env.NODE_ENV === 'development' && (
            <div className="mv-panel-connection-status">
              <div className="mv-connection-indicator">
                <span className={`mv-status-dot ${reports && patientInfo ? 'connected' : 'disconnected'}`}></span>
                <span className="mv-status-text">
                  {reports && patientInfo ? 
                    `Reports 연결됨 (Patient: ${patientInfo.patient_id || 'Unknown'})` : 
                    'Reports 연결되지 않음'
                  }
                </span>
              </div>
              
              <div className="mv-debug-status" style={{ 
                fontSize: '10px', 
                color: '#666', 
                marginTop: '4px',
                background: '#f0fff0',
                padding: '4px',
                borderRadius: '3px'
              }}>
                레포트수: {reports?.reportList?.length || 0}개 | 
                모달상태: {showReportModal ? 'Open' : 'Closed'} | 
                환자ID: {patientInfo?.patient_id || 'None'} | 
                StudyUID: {currentStudyUID ? currentStudyUID.slice(-8) + '...' : 'None'}
              </div>
            </div>
          )}
          */}

          {renderPanelContent()}
        </div>
      )}
    </>
  );
};

export default RightPanel;
