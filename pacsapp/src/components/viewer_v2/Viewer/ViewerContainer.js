// /home/medical_system/pacsapp/src/components/viewer_v2/Viewer/ViewerContainer.js

import React from 'react';
import Toolbar from './Toolbar';
import AIModelSelector from './AIModelSelector';
import DicomViewer from './DicomViewer';
import './ViewerContainer.css';

const ViewerContainer = ({ 
  // 기본 도구 관련
  selectedTool,
  setSelectedTool,
  showLeftPanel,
  setShowLeftPanel,
  
  // AI 관련
  selectedAIModel,
  setSelectedAIModel,
  onRunAIModel,
  aiResults,
  isAnalyzing,
  
  // 이미지 데이터
  currentSlice,
  totalSlices,
  currentImageUrl,
  imageIds,
  patientInfo,
  viewport,
  
  // 뷰포트 설정
  viewportSettings,
  
  // 🔥 CSS 기반 이미지 변환
  imageTransform,
  getImageStyle,
  
  // 🔥 마우스 이벤트 핸들러
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  
  // 네비게이션
  canGoPrev,
  canGoNext,
  onPrevImage,
  onNextImage,
  imageInfo,
  
  // 🔥 측정 도구 관련
  measurements,
  currentMeasurement,
  
  // 🔥 편집 관련 props
  editingMeasurement,
  isEditMode,
  startEditMode,
  stopEditMode,
  
  // 🔥 삭제 관련 props 추가
  onDeleteMeasurement,
  
  // 🔥 라벨링 관련 props 추가
  onAddManualAnnotation,
  onEditManualAnnotation,
  setActiveRightPanel,
  
  // 🔥 하이라이트 관련 props 추가
  highlightedMeasurementId,
  onHighlightMeasurement,
  
  // 🔥 수동 주석 데이터 추가 (라벨 표시용)
  manualAnnotations,
  
  // 🔥 Django 어노테이션 시스템 연동
  addMeasurementToAnnotations,
  
  // 🔥 핵심: Django 어노테이션 데이터 추가 (뷰어 렌더링용)
  annotationBoxes = [],
  
  // 🔥 새로 추가: 전체 숨기기 관련 props
  allMeasurementsHidden = false
}) => {

  // 🔥 디버깅 로그 추가
  console.log('🖼️ ViewerContainer - annotationBoxes 받음:', annotationBoxes?.length || 0);
  console.log('👁️ ViewerContainer - allMeasurementsHidden 받음:', allMeasurementsHidden);

  // 도구 변경 핸들러
  const handleToolChange = (toolId) => {
    console.log('ViewerContainer - 도구 변경:', toolId);
    
    if (setSelectedTool) {
      setSelectedTool(toolId);
    }
  };

  // AI 모델 실행 핸들러
  const handleRunAIModel = async (modelName) => {
    console.log('ViewerContainer - AI 모델 실행:', modelName);
    
    if (onRunAIModel) {
      try {
        await onRunAIModel(modelName);
      } catch (error) {
        console.error('AI 모델 실행 중 오류:', error);
      }
    }
  };

  return (
    <div className="mv-viewer-container">
      <Toolbar 
        selectedTool={selectedTool}
        setSelectedTool={handleToolChange}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrevImage={onPrevImage}
        onNextImage={onNextImage}
        imageInfo={imageInfo}
        viewportSettings={viewportSettings}
        
        // 🔥 편집 관련 props 추가
        isEditMode={isEditMode}
        stopEditMode={stopEditMode}
      />
      
      <div className="mv-viewer-main">
        <div className="mv-viewer-content">
          <DicomViewer 
            selectedTool={selectedTool}
            currentSlice={currentSlice}
            totalSlices={totalSlices}
            aiResults={aiResults}
            patientInfo={patientInfo}
            viewport={viewport}
            currentImageUrl={currentImageUrl}
            imageIds={imageIds}
            viewportSettings={viewportSettings}
            
            // 🔥 CSS 기반 이미지 변환
            imageTransform={imageTransform}
            getImageStyle={getImageStyle}
            
            // 🔥 마우스 이벤트 핸들러 전달
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
            
            // 🔥 측정 도구 관련
            measurements={measurements}
            currentMeasurement={currentMeasurement}
            
            // 🔥 편집 관련 props 전달
            editingMeasurement={editingMeasurement}
            isEditMode={isEditMode}
            startEditMode={startEditMode}
            stopEditMode={stopEditMode}
            
            // 🔥 삭제 기능 prop 전달 (핵심!)
            onDeleteMeasurement={onDeleteMeasurement}
            
            // 🔥 라벨링 기능 props 전달 (핵심!)
            onAddManualAnnotation={onAddManualAnnotation}
            onEditManualAnnotation={onEditManualAnnotation}
            setActiveRightPanel={setActiveRightPanel}
            
            // 🔥 하이라이트 기능 props 전달
            highlightedMeasurementId={highlightedMeasurementId}
            onHighlightMeasurement={onHighlightMeasurement}
            
            // 🔥 수동 주석 데이터 전달 (라벨 표시용)
            manualAnnotations={manualAnnotations}
            
            // 🔥 Django 어노테이션 시스템 연동
            addMeasurementToAnnotations={addMeasurementToAnnotations}
            
            // 🔥 핵심 추가: Django 어노테이션 데이터 전달 (뷰어 렌더링용)
            annotationBoxes={annotationBoxes}
            
            // 🔥 새로 추가: 전체 숨기기 상태 전달 (핵심!)
            allMeasurementsHidden={allMeasurementsHidden}
          />
        </div>

        <div className="mv-viewer-ai-controls">
          <AIModelSelector 
            selectedAIModel={selectedAIModel}
            setSelectedAIModel={setSelectedAIModel}
            onRunModel={handleRunAIModel}
            isAnalyzing={isAnalyzing}
            aiResults={aiResults}
          />
        </div>

        {/* 🔥 편집 모드 오버레이 */}
        {isEditMode && (
          <div className="mv-edit-mode-overlay">
            <div className="mv-edit-mode-controls">
              <span className="mv-edit-mode-text">📝 편집 모드</span>
              <button 
                className="mv-edit-mode-exit"
                onClick={stopEditMode}
                title="편집 종료"
              >
                완료
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isAnalyzing && (
        <div className="mv-ai-loading-overlay">
          <div className="mv-ai-loading-content">
            <div className="mv-loading-spinner"></div>
            <div>AI 모델 분석 중...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewerContainer;