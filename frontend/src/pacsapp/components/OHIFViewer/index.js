// src/components/OHIFViewer/index.js
import React, { useState, useCallback, useEffect } from 'react';
import ViewerIframe from './ViewerIframe/ViewerIframe';
import AnalysisPanel from './AnalysisPanel/AnalysisPanel';
import LabelModal from './AnnotationTools/LabelModal';
import ReportModal from './ReportModal/ReportModal';

// 커스텀 훅들
import useAIAnalysis from '../../hooks/useAIAnalysis';
import useAnnotations from '../../hooks/useAnnotations';
import useReports from '../../hooks/useReports';
import usePACS from '../../hooks/usePACS';

import styles from './OHIFViewer.module.css';

const OHIFViewer = ({
  ohifBaseUrl = "http://35.225.63.41:8042/ohif/",
  showDebugInfo = false
}) => {
  // 동적 z-index 관리
  const [activeLayer, setActiveLayer] = useState('iframe');
  
  const getZIndex = (layer) => {
    const baseZIndex = {
      iframe: 100,
      ai: 200,
      annotation: 300,
      modal: 400
    };
    return activeLayer === layer ? baseZIndex[layer] + 1000 : baseZIndex[layer];
  };

  // 스터디 연동 관련 상태
  const [studySyncStatus, setStudySyncStatus] = useState('');
  const [isStudyTransitioning, setIsStudyTransitioning] = useState(false);

  // PACS 훅 초기화
  const pacsHook = usePACS();
  const { 
    currentStudyUID, 
    availableStudies, 
    fetchAvailableStudies,
    selectStudy,
    getCurrentStudyInfo,
    isLoading: pacsLoading,
    connectionError: pacsError,
    setCurrentStudyUID
  } = pacsHook;

  // OHIF URL 관리
  const [ohifUrl, setOhifUrl] = useState(ohifBaseUrl);
  
  useEffect(() => {
    let newUrl;
    
    if (!currentStudyUID) {
      newUrl = ohifBaseUrl;
    } else {
      newUrl = `${ohifBaseUrl}viewer?StudyInstanceUIDs=${currentStudyUID}`;
    }
    
    if (newUrl !== ohifUrl) {
      console.log('📋 OHIF URL 변경:', {
        from: ohifUrl,
        to: newUrl,
        studyUID: currentStudyUID || 'none'
      });
      setOhifUrl(newUrl);
    }
  }, [currentStudyUID, ohifBaseUrl, ohifUrl]);

  // AI 분석 훅
  const aiHook = useAIAnalysis(currentStudyUID);
  const {
    analysisStatus,
    analysisResults,
    overlays,
    showOverlays,
    isAnalyzing,
    analyzeYOLO,
    analyzeSSD,
    loadSavedResults,
    clearResults,
    checkAIModelStatus,
    toggleOverlays,
    recalculateOverlays,
    setAnalysisStatus
  } = aiHook;

  // 어노테이션 훅
  const annotationHook = useAnnotations(currentStudyUID, setAnalysisStatus, setActiveLayer);
  const {
    drawingMode,
    currentBox,
    annotationBoxes,
    showAnnotations,
    showLabelModal,
    newBoxLabel,
    showAnnotationDropdown,
    overlayRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    saveBoundingBox,
    deleteBoundingBox,
    deleteIndividualAnnotation,
    saveAnnotationsToServer,
    loadAnnotationsFromServer,
    toggleDrawingMode,
    toggleAnnotations,
    toggleAnnotationDropdown,
    cancelLabelModal
  } = annotationHook;

  // 레포트 훅
  const reportHook = useReports(currentStudyUID, getCurrentStudyInfo);
  const {
    showReportModal,
    reportContent,
    reportSummaries,
    showReportDropdown,
    saveReportToServer,
    loadReportFromServer,
    deleteReportFromServer,
    updateReportStatusOnServer,
    openReportModal,
    closeReportModal,
    toggleReportDropdown,
    selectReportFromDropdown,
    printReport
  } = reportHook;

  // 스터디 변경 처리 함수
  const handleStudyChangeFromOHIF = useCallback(async (newStudyUID) => {
    console.log('🔄 OHIF에서 스터디 변경 감지:', {
      from: currentStudyUID,
      to: newStudyUID
    });

    if (newStudyUID === currentStudyUID) {
      console.log('📝 같은 스터디 - 변경 무시');
      return;
    }

    setIsStudyTransitioning(true);
    setStudySyncStatus(`스터디 동기화 중...`);

    try {
      console.log('🧹 기존 오버레이 숨김...');
      
      if (aiHook.showYOLOOverlays) {
        console.log('🤖 YOLO 오버레이 숨김');
        aiHook.toggleYOLOOverlays();
      }
      if (aiHook.showSSDOverlays) {
        console.log('🤖 SSD 오버레이 숨김');
        aiHook.toggleSSDOverlays();
      }
      
      console.log('📂 PACS 상태 동기화 중...');
      
      const targetStudy = availableStudies.find(study => study.studyUID === newStudyUID);
      
      if (targetStudy) {
        setCurrentStudyUID(newStudyUID);
        setStudySyncStatus(`✅ ${targetStudy.patientName} 동기화 완료`);
        
        setTimeout(async () => {
          try {
            console.log('📊 새 스터디 분석 결과 로드...');
            await loadSavedResults();
            setStudySyncStatus(`✅ ${targetStudy.patientName} 전환 완료`);
          } catch (error) {
            console.warn('⚠️ 저장된 분석 결과 로드 실패:', error);
            setStudySyncStatus(`✅ ${targetStudy.patientName} (분석 결과 없음)`);
          }
          
          setTimeout(() => {
            setStudySyncStatus('');
          }, 3000);
        }, 500);
        
      } else {
        console.warn('⚠️ PACS에서 스터디를 찾을 수 없음, 새로고침 시도:', newStudyUID);
        
        await fetchAvailableStudies();
        
        const refreshedStudy = availableStudies.find(study => study.studyUID === newStudyUID);
        if (refreshedStudy) {
          setCurrentStudyUID(newStudyUID);
          setStudySyncStatus(`✅ ${refreshedStudy.patientName} 동기화 완료`);
        } else {
          setCurrentStudyUID(newStudyUID);
          setStudySyncStatus(`⚠️ 알 수 없는 스터디로 전환됨`);
        }
        
        setTimeout(() => {
          setStudySyncStatus('');
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ 스터디 동기화 중 오류:', error);
      setStudySyncStatus('❌ 스터디 동기화 실패');
      
      setTimeout(() => {
        setStudySyncStatus('');
      }, 3000);
    } finally {
      setIsStudyTransitioning(false);
    }
  }, [currentStudyUID, availableStudies, aiHook, setCurrentStudyUID, loadSavedResults, fetchAvailableStudies]);

  const handleManualStudySelect = useCallback(async (studyUID) => {
    console.log('👆 수동 스터디 선택:', {
      from: currentStudyUID,
      to: studyUID
    });
    await handleStudyChangeFromOHIF(studyUID);
  }, [handleStudyChangeFromOHIF]);

  // 로컬 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // 핸들러 함수들
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleGlobalError = (error, context = '') => {
    console.error(`글로벌 에러 (${context}):`, error);
    setGlobalError(`${context}: ${error.message}`);
  };

  const retryConnection = async () => {
    setGlobalError(null);
    try {
      await fetchAvailableStudies();
    } catch (error) {
      handleGlobalError(error, 'PACS 재연결');
    }
  };

  const handleAnalyzeYOLO = async (...args) => {
    setActiveLayer('ai');
    console.log('🤖 YOLO 분석 시작 - AI 레이어 활성화');
    return await analyzeYOLO(...args);
  };

  const handleAnalyzeSSD = async (...args) => {
    setActiveLayer('ai');
    console.log('🤖 SSD 분석 시작 - AI 레이어 활성화');
    return await analyzeSSD(...args);
  };

  const handleToggleOverlays = () => {
    setActiveLayer('ai');
    console.log('👁️ AI 오버레이 토글 - AI 레이어 활성화');
    toggleOverlays();
  };

  const handleOpenReportModal = (...args) => {
    setActiveLayer('modal');
    console.log('📋 레포트 모달 열림 - 모달 레이어 활성화');
    openReportModal(...args);
  };

  // Props 구성
  const viewerIframeProps = {
    analysisResults,
    overlays: aiHook.getVisibleOverlays(),
    showOverlays,
    onRecalculateOverlays: recalculateOverlays,
    ohifUrl,
    showDebugInfo,
    isLoading: isAnalyzing || isStudyTransitioning,
    error: globalError,
    currentStudyUID,
    onStudyChange: handleStudyChangeFromOHIF,
    activeLayer,
    setActiveLayer,
    annotationProps: {
      drawingMode,
      currentBox,
      annotationBoxes,
      showAnnotations,
      overlayRef,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onDeleteAnnotation: deleteBoundingBox,
      onDrawingStart: () => setActiveLayer('annotation'),
      onModalOpen: () => setActiveLayer('modal')
    }
  };

  const analysisPanelProps = {
    analysisStatus,
    analysisResults,
    overlays: aiHook.getVisibleOverlays(),
    showOverlays,
    showYOLOOverlays: aiHook.showYOLOOverlays,
    showSSDOverlays: aiHook.showSSDOverlays,
    showDeleteModal: aiHook.showDeleteModal,
    onToggleYOLOOverlays: aiHook.toggleYOLOOverlays,
    onToggleSSDOverlays: aiHook.toggleSSDOverlays,
    onRequestDeleteResult: aiHook.requestDeleteResult,
    onHandleDeleteConfirm: aiHook.handleDeleteConfirm,
    onHandleDeleteCancel: aiHook.handleDeleteCancel,
    allOverlays: overlays,
    onAnalyzeYOLO: handleAnalyzeYOLO,
    onAnalyzeSSD: handleAnalyzeSSD,
    onLoadSavedResults: loadSavedResults,
    onClearResults: clearResults,
    onCheckModelStatus: checkAIModelStatus,
    onToggleOverlays: handleToggleOverlays,
    onRecalculateOverlays: recalculateOverlays,
    currentStudyUID,
    availableStudies,
    onSelectStudy: handleManualStudySelect,
    onRefreshStudies: fetchAvailableStudies,
    studySyncStatus,
    isStudyTransitioning,
    annotationProps: {
      drawingMode,
      annotationBoxes,
      showAnnotations,
      showAnnotationDropdown,
      onToggleDrawingMode: toggleDrawingMode,
      onToggleAnnotations: toggleAnnotations,
      onToggleAnnotationDropdown: toggleAnnotationDropdown,
      onSaveAnnotations: saveAnnotationsToServer,
      onLoadAnnotations: loadAnnotationsFromServer,
      onDeleteIndividualAnnotation: deleteIndividualAnnotation
    },
    onLoadReport: loadReportFromServer,
    onOpenReportModal: handleOpenReportModal,
    reportSummaries,
    showReportDropdown,
    onToggleReportDropdown: toggleReportDropdown,
    onSelectReport: selectReportFromDropdown,
    onDeleteReport: deleteReportFromServer,
    onUpdateReportStatus: updateReportStatusOnServer
  };

  const labelModalProps = {
    isOpen: showLabelModal,
    onSave: saveBoundingBox,
    onCancel: cancelLabelModal,
    initialLabel: newBoxLabel,
    title: '🏷️ 어노테이션 라벨 입력',
    onModalOpen: () => setActiveLayer('modal')
  };

  const reportModalProps = {
    isOpen: showReportModal,
    onClose: closeReportModal,
    onSave: saveReportToServer,
    onPrint: printReport,
    patientInfo: getCurrentStudyInfo(),
    currentStudyUID,
    analysisResults,
    annotationBoxes,
    initialContent: reportContent,
    title: '📋 진단 레포트',
    onModalOpen: () => setActiveLayer('modal')
  };

  // 렌더링
  if (pacsLoading && availableStudies.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        PACS 연결 중...
      </div>
    );
  }

  if (globalError || pacsError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>
          ❌ 연결 오류
        </div>
        <div className={styles.errorMessage}>
          {globalError || pacsError}
        </div>
        <button 
          onClick={retryConnection}
          className={styles.errorRetryButton}
        >
          🔄 다시 시도
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.ohifViewerContainer} ${isFullscreen ? styles.fullscreen : ''}`}
      style={{
        '--z-iframe': getZIndex('iframe'),
        '--z-ai': getZIndex('ai'),
        '--z-annotation': getZIndex('annotation'),
        '--z-modal': getZIndex('modal')
      }}
    >
      {studySyncStatus && (
        <div className={styles.studySyncNotification}>
          {studySyncStatus}
        </div>
      )}

      <div className={styles.viewerSection}>
        <ViewerIframe {...viewerIframeProps} />
      </div>
      
      {!isFullscreen && (
        <div className={styles.panelSection}>
          <AnalysisPanel {...analysisPanelProps} />
        </div>
      )}
      
      <LabelModal {...labelModalProps} />
      <ReportModal {...reportModalProps} />
      
      {showDebugInfo && (
        <div>
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 10000,
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? '🔲 창 모드' : '📺 전체화면'}
          </button>
          
          <div
            style={{
              position: 'fixed',
              top: '80px',
              left: '20px',
              zIndex: 10000,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
          >
            🎯 활성 레이어: <strong>{activeLayer}</strong><br/>
            📂 현재 스터디: <strong>{currentStudyUID || 'none'}</strong><br/>
            🌐 OHIF URL: <strong>{ohifUrl}</strong><br/>
            🔄 전환 중: <strong>{isStudyTransitioning ? '✅' : '❌'}</strong><br/>
            📊 z-index: iframe({getZIndex('iframe')}), ai({getZIndex('ai')}), annotation({getZIndex('annotation')}), modal({getZIndex('modal')})
          </div>
          
          <div
            style={{
              position: 'fixed',
              top: '250px',
              left: '20px',
              zIndex: 10000,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
          >
            <div><strong>🧪 디버깅 테스트</strong></div>
            <button
              onClick={() => {
                console.log('🧪 강제 스터디 변경 테스트');
                const testStudyUID = '1.3.6.1.4.1.14519.5.2.1.9999.103.2445110399502685110179049624124';
                handleStudyChangeFromOHIF(testStudyUID);
              }}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                marginTop: '5px',
                display: 'block',
                width: '100%'
              }}
            >
              🧪 강제 스터디 변경
            </button>
            
            <button
              onClick={() => {
                console.log('📊 현재 상태 출력');
                console.log('currentStudyUID:', currentStudyUID);
                console.log('availableStudies:', availableStudies);
                console.log('ohifUrl:', ohifUrl);
              }}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                marginTop: '5px',
                display: 'block',
                width: '100%'
              }}
            >
              📊 현재 상태 출력
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OHIFViewer;