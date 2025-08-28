// /RightPanel/AIAnnotationsPanel.js - Django 연동 버전

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, RefreshCw, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import './AIAnnotationsPanel.css'; // 🔥 전용 CSS 파일 import

const AIAnnotationsPanel = ({ 
  // 🔥 수정된 props - useAI 훅에서 새로운 데이터 구조 사용
  currentInstanceResults, // 기존 aiResults 대신
  allAIResults,           // 전체 Study 결과 
  analysisStatus,         // 분석 상태 메시지
  isAnalyzing,           // 분석 중 여부
  
  // 기존 함수들
  onToggleVisibility, 
  onDeleteAnnotation,
  
  // 🔥 새로 추가된 props - 인스턴스 정보
  currentStudyUID,
  currentInstanceUID,
  currentInstanceNumber,
  
  // 🔥 새로 추가된 함수들
  loadAllAIResults,
  updateCurrentInstanceResults,
  getStudyStats,
  getModelStats
}) => {
  const [loadingStatus, setLoadingStatus] = useState('');
  const [lastLoadedStudy, setLastLoadedStudy] = useState(null);

  const modelColors = {
    yolov8: '#3b82f6',
    ssd: '#ef4444', 
    simclr: '#22c55e'
  };

  const modelNames = {
    yolov8: 'YOLOv8',
    ssd: 'SSD',
    simclr: 'SimCLR'
  };

  // 🔥 Study UID 변경 감지해서 AI 결과 자동 로드
  useEffect(() => {
    if (currentStudyUID && currentStudyUID !== lastLoadedStudy && loadAllAIResults) {
      console.log('🔄 AIAnnotationsPanel - Study 변경 감지, AI 결과 로드:', currentStudyUID);
      handleLoadAIResults();
    }
  }, [currentStudyUID, lastLoadedStudy]);

  // 🔥 인스턴스 변경 감지해서 현재 인스턴스 결과 업데이트
  useEffect(() => {
    if (currentInstanceUID && updateCurrentInstanceResults) {
      console.log('🎯 AIAnnotationsPanel - 인스턴스 변경 감지:', currentInstanceUID?.slice(-8) + '...');
      updateCurrentInstanceResults(currentInstanceUID);
    }
  }, [currentInstanceUID, updateCurrentInstanceResults]);

  // 🔥 AI 결과 로드 함수
  const handleLoadAIResults = async () => {
    if (!currentStudyUID || !loadAllAIResults) {
      console.warn('⚠️ AIAnnotationsPanel - Study UID 또는 loadAllAIResults 함수 없음');
      return;
    }

    try {
      setLoadingStatus('AI 결과 로드 중...');
      console.log('🔄 AIAnnotationsPanel - AI 결과 로드 시작:', currentStudyUID);
      
      await loadAllAIResults(currentStudyUID);
      setLastLoadedStudy(currentStudyUID);
      setLoadingStatus('');
      
      console.log('✅ AIAnnotationsPanel - AI 결과 로드 완료');
    } catch (error) {
      console.error('❌ AIAnnotationsPanel - AI 결과 로드 실패:', error);
      setLoadingStatus('AI 결과 로드 실패');
      setTimeout(() => setLoadingStatus(''), 3000);
    }
  };

  // 🔥 현재 표시할 결과 결정 (현재 인스턴스의 결과만)
  const displayResults = currentInstanceResults || { yolov8: [], ssd: [], simclr: [] };

  // 🔥 전체 Study 통계 계산
  const studyStats = getStudyStats ? getStudyStats() : { totalInstances: 0, totalDetections: 0, models: [] };

  // 🔥 개별 모델별 결과 렌더링
  const renderModelResults = () => {
    return Object.entries(displayResults).map(([modelName, annotations]) => {
      if (!annotations || annotations.length === 0) return null;

      const modelStats = getModelStats ? getModelStats(modelName) : { totalCount: 0, visibleCount: 0, avgConfidence: 0 };

      return (
        <div key={modelName} className="mv-model-section">
          <h4 
            className="mv-model-title"
            style={{ color: modelColors[modelName] }}
          >
            🤖 {modelNames[modelName]} 
            <span className="mv-model-stats">
              ({modelStats.totalCount}개 검출, 평균 {modelStats.avgConfidence}%)
            </span>
          </h4>
          
          {annotations.map((annotation) => (
            <div key={annotation.id} className="mv-annotation-item">
              <div className="mv-annotation-info">
                <div 
                  className="mv-annotation-label"
                  style={{ color: modelColors[modelName] }}
                >
                  "{annotation.label}"
                </div>
                <div className="mv-annotation-confidence">
                  신뢰도: {annotation.confidence}%
                </div>
                
                {/* 🔥 새로 추가: 추가 정보 표시 */}
                <div className="mv-annotation-meta">
                  {annotation.bbox && (
                    <div className="mv-annotation-coords">
                      위치: x:{annotation.bbox.x}, y:{annotation.bbox.y}, 
                      크기: {annotation.bbox.width}×{annotation.bbox.height}
                    </div>
                  )}
                  {annotation.created_at && (
                    <div className="mv-annotation-time">
                      생성: {new Date(annotation.created_at).toLocaleString('ko-KR')}
                    </div>
                  )}
                  {annotation.patient_id && (
                    <div className="mv-annotation-patient">
                      환자: {annotation.patient_id}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mv-annotation-controls">
                <button
                  onClick={() => onToggleVisibility(modelName, annotation.id)}
                  className={`mv-visibility-btn ${annotation.visible !== false ? 'mv-visible' : 'mv-hidden'}`}
                  title={annotation.visible !== false ? '숨기기' : '표시하기'}
                >
                  {annotation.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                
                <button 
                  onClick={() => onDeleteAnnotation(modelName, annotation.id)}
                  className="mv-delete-btn"
                  title="삭제하기"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }).filter(Boolean);
  };

  // 🔥 상태별 메시지 렌더링
  const renderStatusMessage = () => {
    if (isAnalyzing) {
      return (
        <div className="mv-status-message mv-analyzing">
          <Loader size={16} className="mv-spinner" />
          <span>AI 모델 분석 중...</span>
          {analysisStatus && <div className="mv-status-detail">{analysisStatus}</div>}
        </div>
      );
    }

    if (loadingStatus) {
      return (
        <div className="mv-status-message mv-loading">
          <RefreshCw size={16} className="mv-spinner" />
          <span>{loadingStatus}</span>
        </div>
      );
    }

    if (!currentStudyUID) {
      return (
        <div className="mv-status-message mv-info">
          <AlertCircle size={16} />
          <span>Study를 선택해주세요</span>
        </div>
      );
    }

    if (!allAIResults || studyStats.totalDetections === 0) {
      return (
        <div className="mv-empty-state">
          <div className="mv-empty-icon">🤖</div>
          <div className="mv-empty-title">AI 분석 결과가 없습니다</div>
          <div className="mv-empty-subtitle">
            왼쪽의 AI 모델 버튼을 클릭해서 분석을 시작하세요
          </div>
          {currentStudyUID && (
            <button 
              onClick={handleLoadAIResults}
              className="mv-reload-btn"
              disabled={loadingStatus}
            >
              <RefreshCw size={14} />
              결과 다시 로드
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const modelResults = renderModelResults();
  const statusMessage = renderStatusMessage();

  return (
    <div className="mv-panel-content">
      {/* 🔥 새로 추가: 패널 헤더 - Study 및 인스턴스 정보 */}
      <div className="mv-ai-panel-header">
        <div className="mv-study-info">
          <div className="mv-study-uid">
            Study: {currentStudyUID ? `...${currentStudyUID.slice(-8)}` : 'None'}
          </div>
          {currentInstanceNumber && (
            <div className="mv-instance-info">
              인스턴스 #{currentInstanceNumber}
              {currentInstanceUID && (
                <span className="mv-instance-uid">
                  (...{currentInstanceUID.slice(-8)})
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* 🔥 새로 추가: 전체 Study 통계 */}
        {studyStats.totalDetections > 0 && (
          <div className="mv-study-stats">
            <div className="mv-stats-summary">
              전체: {studyStats.totalInstances}개 인스턴스, {studyStats.totalDetections}개 검출
            </div>
            <div className="mv-stats-models">
              모델: {studyStats.models.map(model => modelNames[model]).join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* 🔥 상태 메시지 표시 */}
      {statusMessage && statusMessage}

      {/* 🔥 현재 인스턴스의 AI 결과 표시 */}
      {!statusMessage && modelResults.length > 0 && (
        <>
          <div className="mv-current-instance-header">
            <CheckCircle size={16} className="mv-success-icon" />
            <span>현재 인스턴스 #{currentInstanceNumber} 결과</span>
          </div>
          {modelResults}
        </>
      )}

      {/* 🔥 현재 인스턴스에 결과가 없는 경우 */}
      {!statusMessage && modelResults.length === 0 && studyStats.totalDetections > 0 && (
        <div className="mv-no-instance-results">
          <div className="mv-no-results-icon">📭</div>
          <div className="mv-no-results-title">
            현재 인스턴스 #{currentInstanceNumber}에는<br />AI 분석 결과가 없습니다
          </div>
          <div className="mv-no-results-subtitle">
            다른 인스턴스로 이동하거나 이 인스턴스를 분석해보세요
          </div>
        </div>
      )}

      {/* 🔥 디버깅 정보 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mv-debug-info">
          <details>
            <summary>🔍 디버깅 정보</summary>
            <div className="mv-debug-content">
              <div>Study UID: {currentStudyUID || 'None'}</div>
              <div>Instance UID: {currentInstanceUID?.slice(-20) || 'None'}</div>
              <div>Instance Number: {currentInstanceNumber || 'None'}</div>
              <div>Current Results: {JSON.stringify(Object.keys(displayResults).map(k => `${k}:${displayResults[k]?.length || 0}`))}</div>
              <div>All Results Loaded: {allAIResults ? 'Yes' : 'No'}</div>
              <div>Study Stats: {JSON.stringify(studyStats)}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default AIAnnotationsPanel;