// pacsapp/src/components/ohifviewer/AnalysisPanel/SimCLRAnalysisPanel.js

import React, { useState, useEffect, useCallback } from 'react';
import styles from './SimCLRAnalysisPanel.css';

const SimCLRAnalysisPanel = ({ 
  currentStudyUID, 
  currentSeriesUID, 
  currentInstanceUID,
  onOverlayUpdate,
  isVisible 
}) => {
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    results: null,
    error: null,
    modelStatus: 'unknown'
  });
  
  const [heatmapState, setHeatmapState] = useState({
    heatmapData: null,
    showHeatmap: false
  });

  // 모델 상태 확인
  const checkModelStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/analysis/simclr/status/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setAnalysisState(prev => ({
        ...prev,
        modelStatus: data.model_available ? 'loaded' : 'not_loaded'
      }));
      
    } catch (error) {
      console.error('SimCLR 모델 상태 확인 실패:', error);
      setAnalysisState(prev => ({
        ...prev,
        modelStatus: 'error'
      }));
    }
  }, []);

  // 컴포넌트 마운트 시 모델 상태 확인
  useEffect(() => {
    if (isVisible) {
      checkModelStatus();
    }
  }, [isVisible, checkModelStatus]);

  // SimCLR 이상탐지 분석 실행
  const runSimCLRAnalysis = useCallback(async () => {
    if (!currentStudyUID) {
      setAnalysisState(prev => ({
        ...prev,
        error: '스터디가 선택되지 않았습니다.'
      }));
      return;
    }

    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      results: null
    }));

    setHeatmapState({
      heatmapData: null,
      showHeatmap: false
    });

    try {
      const requestData = {
        studyUID: currentStudyUID,
        seriesUID: currentSeriesUID || '',
        instanceUID: currentInstanceUID || ''
      };

      console.log('🧠 SimCLR 분석 요청:', requestData);

      const response = await fetch('/api/analysis/simclr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        console.log('✅ SimCLR 분석 결과:', data);
        
        setAnalysisState(prev => ({
          ...prev,
          isAnalyzing: false,
          results: data,
          error: null
        }));

        // 히트맵 오버레이 데이터 설정
        if (data.results?.heatmap_overlay) {
          setHeatmapState({
            heatmapData: data.results.heatmap_overlay,
            showHeatmap: true
          });

          // OHIF 뷰어에 히트맵 오버레이 추가
          if (onOverlayUpdate) {
            onOverlayUpdate({
              type: 'simclr_heatmap',
              data: data.results.heatmap_overlay,
              analysisInfo: {
                overallAnomalyScore: data.results.overall_anomaly_score,
                maxAnomalyScore: data.results.max_anomaly_score,
                confidence: data.results.confidence,
                isAbnormal: data.results.is_abnormal,
                numPatches: data.results.num_patches,
                numAnomalyPatches: data.results.num_anomaly_patches
              },
              anomalyPatches: data.results.anomaly_patches || []
            });
          }
        }

      } else {
        console.error('❌ SimCLR 분석 실패:', data);
        setAnalysisState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: data.message || 'SimCLR 분석 실패',
          results: null
        }));
      }

    } catch (error) {
      console.error('❌ SimCLR 분석 네트워크 오류:', error);
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: '네트워크 오류가 발생했습니다.',
        results: null
      }));
    }
  }, [currentStudyUID, currentSeriesUID, currentInstanceUID, onOverlayUpdate]);

  // 히트맵 토글
  const toggleHeatmap = useCallback(() => {
    setHeatmapState(prev => ({
      ...prev,
      showHeatmap: !prev.showHeatmap
    }));

    if (onOverlayUpdate) {
      onOverlayUpdate({
        type: 'toggle_simclr_heatmap',
        visible: !heatmapState.showHeatmap
      });
    }
  }, [heatmapState.showHeatmap, onOverlayUpdate]);

  // 결과 초기화
  const clearResults = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      results: null,
      error: null
    }));
    
    setHeatmapState({
      heatmapData: null,
      showHeatmap: false
    });

    if (onOverlayUpdate) {
      onOverlayUpdate({
        type: 'clear_simclr'
      });
    }
  }, [onOverlayUpdate]);

  if (!isVisible) {
    return null;
  }

  const { isAnalyzing, results, error, modelStatus } = analysisState;
  const { heatmapData, showHeatmap } = heatmapState;

  return (
    <div className={styles.simclrPanel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          🧠 SimCLR 이상탐지
        </h3>
        
        {/* 모델 상태 표시 */}
        <div className={styles.modelStatus}>
          <span className={`${styles.statusIndicator} ${styles[modelStatus]}`}>
            {modelStatus === 'loaded' && '✅ 모델 로드됨'}
            {modelStatus === 'not_loaded' && '❌ 모델 미로드'}
            {modelStatus === 'error' && '⚠️ 모델 오류'}
            {modelStatus === 'unknown' && '❓ 상태 확인 중...'}
          </span>
        </div>
      </div>

      {/* 분석 제어 버튼들 */}
      <div className={styles.controlButtons}>
        <button
          onClick={runSimCLRAnalysis}
          disabled={isAnalyzing || modelStatus !== 'loaded' || !currentStudyUID}
          className={`${styles.analysisButton} ${styles.primary}`}
        >
          {isAnalyzing ? (
            <>
              <span className={styles.spinner}></span>
              패치 분석 중...
            </>
          ) : (
            '🧠 SimCLR 이상탐지'
          )}
        </button>

        {heatmapData && (
          <>
            <button
              onClick={toggleHeatmap}
              className={`${styles.analysisButton} ${showHeatmap ? styles.active : styles.secondary}`}
            >
              {showHeatmap ? '👁️‍🗨️ 히트맵 숨김' : '👁️ 히트맵 표시'}
            </button>

            <button
              onClick={clearResults}
              className={`${styles.analysisButton} ${styles.danger}`}
            >
              🗑️ 결과 지우기
            </button>
          </>
        )}
      </div>

      {/* 스터디 정보 */}
      {currentStudyUID && (
        <div className={styles.studyInfo}>
          <div className={styles.studyUid}>
            <strong>📂 스터디:</strong> {currentStudyUID.substring(0, 20)}...
          </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className={styles.errorMessage}>
          <div className={styles.errorTitle}>❌ 오류</div>
          <div className={styles.errorText}>{error}</div>
        </div>
      )}

      {/* 분석 결과 */}
      {results && results.status === 'success' && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h4>🧠 SimCLR 분석 결과</h4>
            <span className={styles.timestamp}>
              {new Date(results.timestamp).toLocaleString()}
            </span>
          </div>

          {/* 주요 지표 */}
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>전체 이상도</div>
              <div className={`${styles.metricValue} ${
                results.results.overall_anomaly_score > 0.7 ? styles.high :
                results.results.overall_anomaly_score > 0.4 ? styles.medium : styles.low
              }`}>
                {results.results.overall_anomaly_score.toFixed(3)}
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricLabel}>신뢰도</div>
              <div className={styles.metricValue}>
                {results.results.confidence.toFixed(1)}%
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricLabel}>분석 패치</div>
              <div className={styles.metricValue}>
                {results.results.num_patches}개
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricLabel}>이상 패치</div>
              <div className={`${styles.metricValue} ${
                results.results.num_anomaly_patches > 0 ? styles.warning : styles.normal
              }`}>
                {results.results.num_anomaly_patches}개
              </div>
            </div>
          </div>

          {/* 진단 요약 */}
          <div className={styles.diagnosisSummary}>
            <div className={`${styles.diagnosisResult} ${
              results.results.is_abnormal ? styles.abnormal : styles.normal
            }`}>
              {results.results.is_abnormal ? (
                <>
                  ⚠️ <strong>이상 소견 감지됨</strong>
                  <div className={styles.diagnosisNote}>
                    {results.results.num_anomaly_patches}개의 이상 패치가 발견되었습니다.
                  </div>
                </>
              ) : (
                <>
                  ✅ <strong>정상 범위</strong>
                  <div className={styles.diagnosisNote}>
                    특별한 이상 소견이 감지되지 않았습니다.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimCLRAnalysisPanel;