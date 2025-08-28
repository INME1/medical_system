// import { useState, useCallback } from 'react';

// const useAI = () => {
//   const [selectedAIModel, setSelectedAIModel] = useState('yolov8');
//   const [aiResults, setAiResults] = useState({
//     yolov8: [],
//     ssd: [],
//     simclr: []
//   });
//   const [visibleAnnotations, setVisibleAnnotations] = useState({});
//   const [isAnalyzing, setIsAnalyzing] = useState(false);

//   // 사용 가능한 AI 모델 목록
//   const availableModels = [
//     { id: 'yolov8', name: 'YOLOv8', color: '#3b82f6', description: '객체 탐지 모델' },
//     { id: 'ssd', name: 'SSD', color: '#ef4444', description: '단일 샷 탐지기' },
//     { id: 'simclr', name: 'SimCLR', color: '#22c55e', description: '자가 지도 학습 모델' }
//   ];

//   // 모델별 샘플 결과 생성
//   const generateMockResults = useCallback((modelName, currentSlice = 1) => {
//     const baseId = Date.now();
    
//     const mockResults = {
//       yolov8: [
//         { 
//           id: baseId + 1, 
//           label: "폐결절", 
//           type: "rectangle", 
//           coords: "x:240, y:180, w:60, h:45", 
//           slice: currentSlice, 
//           confidence: 92,
//           visible: true,
//           bbox: { x: 240, y: 180, width: 60, height: 45 }
//         },
//         { 
//           id: baseId + 2, 
//           label: "종양 의심", 
//           type: "circle", 
//           coords: "x:320, y:220, r:25", 
//           slice: currentSlice, 
//           confidence: 87,
//           visible: true,
//           bbox: { x: 295, y: 195, width: 50, height: 50 }
//         }
//       ],
//       ssd: [
//         { 
//           id: baseId + 3, 
//           label: "병변", 
//           type: "rectangle", 
//           coords: "x:200, y:150, w:80, h:60", 
//           slice: currentSlice, 
//           confidence: 85,
//           visible: true,
//           bbox: { x: 200, y: 150, width: 80, height: 60 }
//         },
//         { 
//           id: baseId + 4, 
//           label: "이상음영", 
//           type: "circle", 
//           coords: "x:350, y:250, r:30", 
//           slice: currentSlice, 
//           confidence: 78,
//           visible: true,
//           bbox: { x: 320, y: 220, width: 60, height: 60 }
//         }
//       ],
//       simclr: [
//         { 
//           id: baseId + 5, 
//           label: "간유리음영", 
//           type: "rectangle", 
//           coords: "x:150, y:300, w:40, h:35", 
//           slice: currentSlice, 
//           confidence: 75,
//           visible: true,
//           bbox: { x: 150, y: 300, width: 40, height: 35 }
//         }
//       ]
//     };

//     return mockResults[modelName] || [];
//   }, []);

//   // AI 모델 실행
//   const runAIModel = useCallback(async (modelName, currentSlice = 1, imageData = null) => {
//     setIsAnalyzing(true);
    
//     try {
//       // 실제 환경에서는 여기서 API 호출
//       // const response = await fetch('/api/ai/analyze', {
//       //   method: 'POST',
//       //   headers: { 'Content-Type': 'application/json' },
//       //   body: JSON.stringify({ model: modelName, slice: currentSlice, imageData })
//       // });
//       // const results = await response.json();

//       // 모의 분석 시간
//       await new Promise(resolve => setTimeout(resolve, 1500));
      
//       const results = generateMockResults(modelName, currentSlice);
      
//       setAiResults(prev => ({
//         ...prev,
//         [modelName]: results
//       }));
      
//       // 새로운 결과들을 표시 상태로 설정
//       const newVisible = {};
//       results.forEach(result => {
//         newVisible[`${modelName}-${result.id}`] = true;
//       });
//       setVisibleAnnotations(prev => ({ ...prev, ...newVisible }));
      
//       return results;
//     } catch (error) {
//       console.error('AI 모델 실행 중 오류:', error);
//       throw error;
//     } finally {
//       setIsAnalyzing(false);
//     }
//   }, [generateMockResults]);

//   // 여러 모델 동시 실행
//   const runAllModels = useCallback(async (currentSlice = 1, imageData = null) => {
//     setIsAnalyzing(true);
    
//     try {
//       const promises = availableModels.map(model => 
//         runAIModel(model.id, currentSlice, imageData)
//       );
      
//       const results = await Promise.all(promises);
//       return results;
//     } catch (error) {
//       console.error('모든 AI 모델 실행 중 오류:', error);
//       throw error;
//     } finally {
//       setIsAnalyzing(false);
//     }
//   }, [runAIModel, availableModels]);

//   // 주석 표시/숨김 토글
//   const toggleAnnotationVisibility = useCallback((modelName, annotationId) => {
//     const key = `${modelName}-${annotationId}`;
//     setVisibleAnnotations(prev => ({
//       ...prev,
//       [key]: !prev[key]
//     }));

//     // AI 결과에서도 visible 속성 업데이트
//     setAiResults(prev => ({
//       ...prev,
//       [modelName]: prev[modelName].map(annotation => 
//         annotation.id === annotationId 
//           ? { ...annotation, visible: !annotation.visible }
//           : annotation
//       )
//     }));
//   }, []);

//   // 주석 삭제
//   const deleteAnnotation = useCallback((modelName, annotationId) => {
//     setAiResults(prev => ({
//       ...prev,
//       [modelName]: prev[modelName].filter(a => a.id !== annotationId)
//     }));
    
//     // 표시 상태에서도 제거
//     const key = `${modelName}-${annotationId}`;
//     setVisibleAnnotations(prev => {
//       const newState = { ...prev };
//       delete newState[key];
//       return newState;
//     });
//   }, []);

//   // 모든 결과 지우기
//   const clearAllResults = useCallback((modelName = null) => {
//     if (modelName) {
//       setAiResults(prev => ({
//         ...prev,
//         [modelName]: []
//       }));
      
//       // 해당 모델의 표시 상태 제거
//       setVisibleAnnotations(prev => {
//         const newState = { ...prev };
//         Object.keys(newState).forEach(key => {
//           if (key.startsWith(`${modelName}-`)) {
//             delete newState[key];
//           }
//         });
//         return newState;
//       });
//     } else {
//       setAiResults({
//         yolov8: [],
//         ssd: [],
//         simclr: []
//       });
//       setVisibleAnnotations({});
//     }
//   }, []);

//   // 모델별 결과 통계
//   const getModelStats = useCallback((modelName) => {
//     const results = aiResults[modelName] || [];
//     const totalCount = results.length;
//     const visibleCount = results.filter(r => r.visible).length;
//     const avgConfidence = totalCount > 0 
//       ? results.reduce((sum, r) => sum + r.confidence, 0) / totalCount 
//       : 0;

//     return {
//       totalCount,
//       visibleCount,
//       avgConfidence: Math.round(avgConfidence * 10) / 10
//     };
//   }, [aiResults]);

//   // 신뢰도 필터링
//   const filterByConfidence = useCallback((modelName, minConfidence) => {
//     const results = aiResults[modelName] || [];
//     return results.filter(r => r.confidence >= minConfidence);
//   }, [aiResults]);

//   return {
//     selectedAIModel,
//     setSelectedAIModel,
//     aiResults,
//     setAiResults,
//     visibleAnnotations,
//     setVisibleAnnotations,
//     isAnalyzing,
//     availableModels,
//     runAIModel,
//     runAllModels,
//     toggleAnnotationVisibility,
//     deleteAnnotation,
//     clearAllResults,
//     getModelStats,
//     filterByConfidence
//   };
// };

// export default useAI;

import { useState, useCallback } from 'react';
import {   
  getAIAnalysisResults,   
  getInstanceAIResults,  
  runAIAnalysis,   
  checkExistingAIAnalysis,  
  clearAIAnalysisResults,  
  aiAnalysisWorkflow,  
  normalizeModelTypeForDjango 
} from '../../utils/viewer_v2';

const useAI = () => {
  const [selectedAIModel, setSelectedAIModel] = useState('yolov8');
  
  // 🔥 새로운 상태 구조: 인스턴스별 AI 결과 관리
  const [allAIResults, setAllAIResults] = useState(null); // 전체 Study 결과
  const [currentInstanceResults, setCurrentInstanceResults] = useState({
    yolov8: [],
    ssd: [],
    simclr: []
  }); // 현재 인스턴스의 결과만
  
  const [visibleAnnotations, setVisibleAnnotations] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');

  // 사용 가능한 AI 모델 목록
  const availableModels = [
    { id: 'yolov8', name: 'YOLOv8', color: '#3b82f6', description: '객체 탐지 모델' },
    { id: 'ssd', name: 'SSD', color: '#ef4444', description: '단일 샷 탐지기' },
    { id: 'simclr', name: 'SimCLR', color: '#22c55e', description: '자가 지도 학습 모델' }
  ];

  // 🔥 새로운 함수: Study 전체 AI 결과 로드
  const loadAllAIResults = useCallback(async (studyUID) => {
    console.log('🔄 useAI - Study 전체 AI 결과 로드 시작:', studyUID);
    
    try {
      setAnalysisStatus('AI 결과 로드 중...');
      
      const results = await getAIAnalysisResults(studyUID);
      
      if (results.success) {
        setAllAIResults(results);
        console.log('✅ useAI - 전체 AI 결과 로드 완료:', {
          study: studyUID,
          instance_count: Object.keys(results.groupedByInstance).length,
          total_count: results.total_count
        });
        setAnalysisStatus('');
        return results;
      } else {
        console.warn('⚠️ useAI - AI 결과 없음');
        setAllAIResults({ groupedByInstance: {}, total_count: 0 });
        setAnalysisStatus('');
        return null;
      }
    } catch (error) {
      console.error('❌ useAI - AI 결과 로드 실패:', error);
      setAnalysisStatus('AI 결과 로드 실패');
      throw error;
    }
  }, []);

  // 🔥 새로운 함수: 현재 인스턴스의 AI 결과 업데이트
  const updateCurrentInstanceResults = useCallback((instanceUID) => {
    console.log('🎯 useAI - 현재 인스턴스 결과 업데이트:', instanceUID?.slice(-8) + '...');
    
    if (!allAIResults || !instanceUID) {
      setCurrentInstanceResults({ yolov8: [], ssd: [], simclr: [] });
      return;
    }
    
    const instanceResults = getInstanceAIResults(allAIResults, instanceUID);
    setCurrentInstanceResults(instanceResults);
    
    console.log('✅ useAI - 인스턴스 결과 업데이트 완료:', {
      instance: instanceUID.slice(-8) + '...',
      yolov8: instanceResults.yolov8.length,
      ssd: instanceResults.ssd.length,
      simclr: instanceResults.simclr.length
    });
    
    return instanceResults;
  }, [allAIResults]);

  // 🔥 수정된 함수: AI 모델 실행 (실제 API 호출)
  const runAIModel = useCallback(async (modelName, studyUID, forceOverwrite = false) => {
    console.log('🤖 useAI - AI 모델 실행:', { modelName, studyUID, forceOverwrite });
    
    setIsAnalyzing(true);
    setAnalysisStatus(`${modelName.toUpperCase()} 모델 분석 중...`);
    
    try {
      // 🔥 실제 Django API 호출
      const result = await aiAnalysisWorkflow(studyUID, modelName, forceOverwrite);
      
      if (result.success) {
        // 성공: 전체 결과 다시 로드
        console.log('✅ useAI - AI 분석 성공, 결과 다시 로드');
        await loadAllAIResults(studyUID);
        
        setAnalysisStatus(`${modelName.toUpperCase()} 분석 완료!`);
        setTimeout(() => setAnalysisStatus(''), 3000);
        
        return result.analysisResult;
      } else if (result.exists) {
        // 기존 결과 존재
        console.log('⚠️ useAI - 기존 결과 존재');
        setAnalysisStatus('');
        return {
          exists: true,
          message: result.message,
          existingData: result.existingData
        };
      } else {
        throw new Error(result.message || 'AI 분석 실패');
      }
    } catch (error) {
      console.error('❌ useAI - AI 모델 실행 실패:', error);
      setAnalysisStatus('AI 분석 실패');
      setTimeout(() => setAnalysisStatus(''), 3000);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [loadAllAIResults]);

  // 🔥 새로운 함수: 기존 결과 확인
  const checkExistingResults = useCallback(async (studyUID, modelType) => {
    console.log('🔍 useAI - 기존 결과 확인:', { studyUID, modelType });
    
    try {
      const normalizedModelType = normalizeModelTypeForDjango(modelType);
      const result = await checkExistingAIAnalysis(studyUID, normalizedModelType);
      
      console.log('✅ useAI - 기존 결과 확인 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ useAI - 기존 결과 확인 실패:', error);
      return { exists: false, error: error.message };
    }
  }, []);

  // 🔥 여러 모델 동시 실행 (업데이트된 버전)
  const runAllModels = useCallback(async (studyUID) => {
    console.log('🤖 useAI - 모든 모델 실행:', studyUID);
    
    setIsAnalyzing(true);
    setAnalysisStatus('모든 AI 모델 분석 중...');
    
    try {
      const results = [];
      
      for (const model of availableModels) {
        try {
          setAnalysisStatus(`${model.name} 분석 중...`);
          const result = await runAIModel(model.id, studyUID, false);
          results.push({ model: model.id, result });
        } catch (error) {
          console.error(`❌ ${model.name} 실행 실패:`, error);
          results.push({ model: model.id, error: error.message });
        }
      }
      
      setAnalysisStatus('모든 모델 분석 완료!');
      setTimeout(() => setAnalysisStatus(''), 3000);
      
      return results;
    } catch (error) {
      console.error('❌ useAI - 모든 모델 실행 실패:', error);
      setAnalysisStatus('모델 분석 실패');
      setTimeout(() => setAnalysisStatus(''), 3000);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [availableModels, runAIModel]);

  // 🔥 주석 표시/숨김 토글 (기존 로직 유지)
  const toggleAnnotationVisibility = useCallback((modelName, annotationId) => {
    const key = `${modelName}-${annotationId}`;
    setVisibleAnnotations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // 현재 인스턴스 결과에서도 visible 속성 업데이트
    setCurrentInstanceResults(prev => ({
      ...prev,
      [modelName]: prev[modelName].map(annotation => 
        annotation.id === annotationId 
          ? { ...annotation, visible: !annotation.visible }
          : annotation
      )
    }));
  }, []);

  // 🔥 주석 삭제 (현재 인스턴스에서만)
  const deleteAnnotation = useCallback((modelName, annotationId) => {
    console.log('🗑️ useAI - 어노테이션 삭제 (로컬):', { modelName, annotationId });
    
    setCurrentInstanceResults(prev => ({
      ...prev,
      [modelName]: prev[modelName].filter(a => a.id !== annotationId)
    }));
    
    // 표시 상태에서도 제거
    const key = `${modelName}-${annotationId}`;
    setVisibleAnnotations(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // 🔥 모든 결과 지우기 (실제 API 호출)
  const clearAllResults = useCallback(async (studyUID, modelName = null) => {
    console.log('🗑️ useAI - 모든 결과 지우기:', { studyUID, modelName });
    
    try {
      setAnalysisStatus('결과 삭제 중...');
      
      if (studyUID) {
        // 서버에서 삭제
        await clearAIAnalysisResults(studyUID, modelName);
        
        // 로컬 상태 업데이트
        if (modelName) {
          setCurrentInstanceResults(prev => ({
            ...prev,
            [modelName]: []
          }));
        } else {
          setCurrentInstanceResults({ yolov8: [], ssd: [], simclr: [] });
          setAllAIResults(null);
        }
        
        setVisibleAnnotations({});
        setAnalysisStatus('결과 삭제 완료');
        setTimeout(() => setAnalysisStatus(''), 2000);
      } else {
        // 로컬만 지우기
        setCurrentInstanceResults({ yolov8: [], ssd: [], simclr: [] });
        setAllAIResults(null);
        setVisibleAnnotations({});
      }
    } catch (error) {
      console.error('❌ useAI - 결과 삭제 실패:', error);
      setAnalysisStatus('결과 삭제 실패');
      setTimeout(() => setAnalysisStatus(''), 3000);
      throw error;
    }
  }, []);

  // 🔥 모델별 결과 통계 (현재 인스턴스 기준)
  const getModelStats = useCallback((modelName) => {
    const results = currentInstanceResults[modelName] || [];
    const totalCount = results.length;
    const visibleCount = results.filter(r => r.visible !== false).length;
    const avgConfidence = totalCount > 0 
      ? results.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalCount 
      : 0;

    return {
      totalCount,
      visibleCount,
      avgConfidence: Math.round(avgConfidence * 10) / 10
    };
  }, [currentInstanceResults]);

  // 🔥 신뢰도 필터링 (현재 인스턴스 기준)
  const filterByConfidence = useCallback((modelName, minConfidence) => {
    const results = currentInstanceResults[modelName] || [];
    return results.filter(r => (r.confidence || 0) >= minConfidence);
  }, [currentInstanceResults]);

  // 🔥 새로운 함수: 전체 Study 통계
  const getStudyStats = useCallback(() => {
    if (!allAIResults || !allAIResults.groupedByInstance) {
      return { totalInstances: 0, totalDetections: 0, models: [] };
    }
    
    const instances = Object.keys(allAIResults.groupedByInstance);
    let totalDetections = 0;
    const modelSet = new Set();
    
    instances.forEach(instanceUID => {
      const instance = allAIResults.groupedByInstance[instanceUID];
      ['yolov8', 'ssd', 'simclr'].forEach(model => {
        if (instance[model] && instance[model].length > 0) {
          totalDetections += instance[model].length;
          modelSet.add(model);
        }
      });
    });
    
    return {
      totalInstances: instances.length,
      totalDetections,
      models: Array.from(modelSet)
    };
  }, [allAIResults]);

  return {
    // 기본 상태
    selectedAIModel,
    setSelectedAIModel,
    
    // 🔥 새로운 상태: 인스턴스별 결과 관리
    allAIResults,              // 전체 Study 결과
    currentInstanceResults,    // 현재 인스턴스 결과 (기존 aiResults 대체)
    setCurrentInstanceResults,
    
    // 기존 상태
    visibleAnnotations,
    setVisibleAnnotations,
    isAnalyzing,
    analysisStatus,            // 🔥 새로 추가: 분석 상태 메시지
    availableModels,
    
    // 🔥 새로운 함수들
    loadAllAIResults,          // Study 전체 결과 로드
    updateCurrentInstanceResults, // 현재 인스턴스 결과 업데이트
    checkExistingResults,      // 기존 결과 확인
    
    // 기존 함수들 (실제 API 연동)
    runAIModel,
    runAllModels,
    toggleAnnotationVisibility,
    deleteAnnotation,
    clearAllResults,
    getModelStats,
    filterByConfidence,
    
    // 🔥 새로운 통계 함수
    getStudyStats,             // 전체 Study 통계
    
    // 🔥 편의 속성 (하위 호환성)
    get aiResults() {
      return currentInstanceResults; // 기존 코드와 호환성
    }
  };
};

export default useAI;