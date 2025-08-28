// pacsapp/src/hooks/useSimCLRAnalysis.js

import { useState, useCallback, useEffect, useRef } from 'react';

const useSimCLRAnalysis = (currentStudyUID) => {
  // ========================================
  // 상태 정의
  // ========================================
  
  // SimCLR 분석 상태
  const [simclrResults, setSimclrResults] = useState(null);
  const [simclrOverlays, setSimclrOverlays] = useState([]);
  const [showSimCLROverlays, setShowSimCLROverlays] = useState(false);
  const [isSimCLRAnalyzing, setIsSimCLRAnalyzing] = useState(false);
  const [simclrError, setSimclrError] = useState(null);
  const [modelStatus, setModelStatus] = useState('unknown');
  
  // 히트맵 상태
  const [heatmapData, setHeatmapData] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // API 설정
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/';
  
  // 이전 studyUID 추적용 ref
  const prevStudyUIDRef = useRef(currentStudyUID);

  // ========================================
  // Effect Hooks
  // ========================================
  
  // studyUID 변경 시 상태 초기화
  useEffect(() => {
    if (prevStudyUIDRef.current !== currentStudyUID) {
      console.log('🧠 SimCLR: StudyUID 변경, 상태 초기화');
      setSimclrResults(null);
      setSimclrOverlays([]);
      setShowSimCLROverlays(false);
      setHeatmapData(null);
      setShowHeatmap(false);
      setSimclrError(null);
      prevStudyUIDRef.current = currentStudyUID;
    }
  }, [currentStudyUID]);

  // 컴포넌트 마운트 시 모델 상태 확인
  useEffect(() => {
    checkSimCLRModelStatus();
  }, []);

  // ========================================
  // API 관련 함수들
  // ========================================

  // SimCLR 모델 상태 확인
  const checkSimCLRModelStatus = useCallback(async () => {
    try {
      console.log('🔍 SimCLR 모델 상태 확인 중...');
      
      const response = await fetch(`${API_BASE}integration/api/analysis/simclr/status/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SimCLR 모델 상태:', data);
        setModelStatus(data.model_available ? 'loaded' : 'not_loaded');
        return data;
      } else {
        console.error('❌ SimCLR 모델 상태 확인 실패:', response.status, response.statusText);
        setModelStatus('error');
        return null;
      }
    } catch (error) {
      console.error('❌ SimCLR 모델 상태 확인 실패:', error);
      setModelStatus('error');
      return null;
    }
  }, [API_BASE]);

  // SimCLR 모델 재로드
  const reloadSimCLRModel = useCallback(async () => {
    try {
      console.log('🔄 SimCLR 모델 재로드 요청...');
      
      const response = await fetch(`${API_BASE}integration/api/analysis/simclr/reload/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SimCLR 모델 재로드 결과:', data);
        
        // 모델 상태 업데이트
        setModelStatus(data.model_available ? 'loaded' : 'not_loaded');
        
        return {
          success: data.status === 'success',
          message: data.message
        };
      } else {
        console.error('❌ SimCLR 모델 재로드 실패:', response.status);
        return {
          success: false,
          message: `재로드 실패 (HTTP ${response.status})`
        };
      }
    } catch (error) {
      console.error('❌ SimCLR 모델 재로드 오류:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }, [API_BASE]);

  // ========================================
  // 메인 분석 함수
  // ========================================

  // SimCLR 이상탐지 분석 실행
  const analyzeSimCLR = useCallback(async (studyUID = currentStudyUID, seriesUID = null, instanceUID = null) => {
    // 입력 검증
    if (!studyUID) {
      const errorMsg = '스터디가 선택되지 않았습니다.';
      setSimclrError(errorMsg);
      console.error('❌ SimCLR 분석 실패:', errorMsg);
      return;
    }

    if (isSimCLRAnalyzing) {
      console.log('⚠️ SimCLR 분석이 이미 진행 중입니다.');
      return;
    }

    // 분석 시작
    setIsSimCLRAnalyzing(true);
    setSimclrError(null);
    
    console.log('🧠 SimCLR 분석 시작:', { studyUID, seriesUID, instanceUID });

    try {
      // 요청 데이터 준비
      const requestBody = {
        studyUID: studyUID,
        seriesUID: seriesUID || '',
        instanceUID: instanceUID || ''
      };

      console.log('📤 SimCLR 분석 요청:', requestBody);

      // API 호출
      const response = await fetch(`${API_BASE}integration/api/analysis/simclr/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 SimCLR 응답 상태:', response.status);

      // 응답 검증
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SimCLR API 오류:', response.status, errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `서버 오류 (${response.status})`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Content-Type 검증
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ 예상하지 못한 응답 형식:', contentType, responseText.substring(0, 200));
        throw new Error('서버에서 HTML 응답을 받았습니다. API 엔드포인트를 확인해주세요.');
      }

      // 응답 데이터 파싱
      const data = await response.json();
      console.log('✅ SimCLR 분석 결과:', data);

      // 성공적인 분석 결과 처리
      if (data.status === 'success') {
        setSimclrResults(data);
        
        // 오버레이 생성
        if (data.results && data.results.patch_results) {
          const overlays = data.results.patch_results.map((patch, index) => ({
            id: `simclr-${index}`,
            type: 'bbox',
            bbox: patch.bbox,
            score: patch.anomaly_score,
            confidence: patch.confidence,
            color: patch.anomaly_score > 0.7 ? 'red' : 'orange',
            label: `이상 ${(patch.anomaly_score * 100).toFixed(1)}%`
          }));
          setSimclrOverlays(overlays);
        }

        // 히트맵 데이터 설정
        if (data.results && data.results.heatmap_data) {
          setHeatmapData(data.results.heatmap_data);
        }
        
        console.log(`✅ SimCLR 분석 완료 - 전체 이상 점수: ${data.results.overall_anomaly_score}`);
      } else {
        throw new Error(data.message || '분석 중 알 수 없는 오류가 발생했습니다.');
      }

    } catch (error) {
      console.error('❌ SimCLR 분석 실패:', error);
      setSimclrError(error.message);
      setSimclrResults(null);
      setSimclrOverlays([]);
      setHeatmapData(null);
    } finally {
      setIsSimCLRAnalyzing(false);
    }
  }, [currentStudyUID, isSimCLRAnalyzing, API_BASE]);

  // ========================================
  // UI 제어 함수들
  // ========================================

  // 오버레이 토글
  const toggleSimCLROverlays = useCallback(() => {
    setShowSimCLROverlays(prev => !prev);
    console.log(`🎯 SimCLR 오버레이 ${!showSimCLROverlays ? '표시' : '숨김'}`);
  }, [showSimCLROverlays]);

  // 히트맵 토글
  const toggleHeatmap = useCallback(() => {
    setShowHeatmap(prev => !prev);
    console.log(`🔥 SimCLR 히트맵 ${!showHeatmap ? '표시' : '숨김'}`);
  }, [showHeatmap]);

  // 결과 초기화
  const clearSimCLRResults = useCallback(() => {
    setSimclrResults(null);
    setSimclrOverlays([]);
    setShowSimCLROverlays(false);
    setHeatmapData(null);
    setShowHeatmap(false);
    setSimclrError(null);
    console.log('🧹 SimCLR 결과 초기화 완료');
  }, []);

  // 분석 중단
  const cancelSimCLRAnalysis = useCallback(() => {
    if (isSimCLRAnalyzing) {
      setIsSimCLRAnalyzing(false);
      setSimclrError('사용자에 의해 분석이 중단되었습니다.');
      console.log('⏹️ SimCLR 분석 중단');
    }
  }, [isSimCLRAnalyzing]);

  // ========================================
  // 편의 함수들
  // ========================================

  // 분석 결과 요약 반환
  const getResultSummary = useCallback(() => {
    if (!simclrResults || simclrResults.status !== 'success') {
      return null;
    }
    
    const results = simclrResults.results;
    return {
      overallScore: results.overall_anomaly_score,
      anomalyDetected: results.anomaly_detected,
      confidence: results.confidence,
      patchCount: results.patch_count,
      processingTime: results.processing_time,
      modelVersion: results.model_version,
      highRiskPatches: results.patch_results.filter(p => p.anomaly_score > 0.7).length
    };
  }, [simclrResults]);

  // ========================================
  // 반환 객체
  // ========================================

  return {
    // 기본 상태
    simclrResults,
    simclrOverlays,
    showSimCLROverlays,
    isSimCLRAnalyzing,
    simclrError,
    modelStatus,
    heatmapData,
    showHeatmap,
    
    // API 함수들
    analyzeSimCLR,
    checkSimCLRModelStatus,
    reloadSimCLRModel,
    
    // UI 제어 함수들
    toggleSimCLROverlays,
    toggleHeatmap,
    clearSimCLRResults,
    cancelSimCLRAnalysis,
    
    // 편의 함수들
    getResultSummary,
    
    // 계산된 상태들 (computed values)
    hasResults: !!simclrResults,
    hasOverlays: simclrOverlays.length > 0,
    hasHeatmap: !!heatmapData,
    isModelLoaded: modelStatus === 'loaded',
    canAnalyze: modelStatus === 'loaded' && !isSimCLRAnalyzing,
  };
};

export default useSimCLRAnalysis;