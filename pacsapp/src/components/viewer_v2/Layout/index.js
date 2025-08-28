// // /home/medical_system/pacsapp/src/components/viewer_v2/Layout/index.js 

// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import LeftPanel from '../LeftPanel/LeftPanel';
// import ViewerContainer from '../Viewer/ViewerContainer';
// import RightPanel from '../RightPanel/RightPanel';
// import { useViewerData } from '../Common/DataProvider';

// // 🔥 레포트 모달 import 추가
// import ReportModal from '../Common/ReportModal';

// // 훅들 import
// import useViewer from '../../../hooks/viewer_v2/useSimpleViewer';
// import useAI from '../../../hooks/viewer_v2/useAI';  
// import useMeasurements from '../../../hooks/viewer_v2/useMeasurements';
// import useAnnotations from '../../../hooks/viewer_v2/useAnnotations';

// // 🔥 레포트 훅 import 추가
// import useReports from '../../../hooks/viewer_v2/useReports';

// import './Layout.css';

// const Layout = () => {
//   // 🔥 모든 훅을 최상단에서 호출
//   const viewerData = useViewerData();
//   const viewer = useViewer(); // 이제 useSimpleViewer
//   const ai = useAI();
//   const measurements = useMeasurements();

//   // UI 상태
//   const [showLeftPanel, setShowLeftPanel] = useState(true);
//   const [activeRightPanel, setActiveRightPanel] = useState(null);
  
//   // 🔥 레포트 모달 상태 추가
//   const [showReportModal, setShowReportModal] = useState(false);
  
//   // 🔥 하이라이트 상태 개선 - 깜빡이 제어
//   const [highlightedMeasurementId, setHighlightedMeasurementId] = useState(null);
//   const [isBlinking, setIsBlinking] = useState(false);

//   // 🔥 모두숨기기 상태 추가
//   const [allMeasurementsHidden, setAllMeasurementsHidden] = useState(false);

//   // 🔥 어노테이션 관련 상태 추가
//   const [analysisStatus, setAnalysisStatus] = useState('');
//   const [activeLayer, setActiveLayer] = useState('viewer'); // viewer, annotation, modal

//   // 🔥 수정: 실제 이미지 표시 정보 상태 추가
//   const [realImageDisplayInfo, setRealImageDisplayInfo] = useState(null);

//   // 🔥 구조분해할당
//   const {
//     patientID,
//     patientData,
//     studies,
//     selectedStudy,
//     series,
//     selectedSeries,
//     instances,
//     currentImageIndex,
//     loading,
//     error,
//     workListData,
//     workListLoading,
//     selectStudy,
//     selectSeries,
//     goToPrevImage,
//     goToNextImage,
//     getCurrentImageUrl,
//     setImageIndex,
//     refreshData,
//     hasData,
//     canGoPrev,
//     canGoNext,
//     imageInfo
//   } = viewerData;

//   // 🔥 간단한 뷰어 훅 구조분해할당
//   const {
//     selectedTool,
//     isPlaying,
//     setIsPlaying,
//     imageTransform,
//     measurements: viewerMeasurements,
//     currentMeasurement,
//     isDragging,
//     changeTool,
//     adjustZoom,
//     adjustPan,
//     adjustWindowLevel,
//     handleRotate,
//     handleFlip,
//     handleInvert,
//     handleReset,
//     handleMouseDown,
//     handleMouseMove,
//     handleMouseUp,
//     handleWheel,
//     getImageStyle,
//     setMeasurements: setViewerMeasurements,
//     viewportSettings,
    
//     // 🔥 편집 관련 추가
//     editingMeasurement,
//     editingHandle,
//     isEditMode,
//     startEditMode,
//     stopEditMode
//   } = viewer;

//   // 🔥 새로운 AI 훅 구조분해할당
//   const {
//     selectedAIModel,
//     setSelectedAIModel,
    
//     // 🔥 새로운 상태들
//     allAIResults,              // 전체 Study AI 결과
//     currentInstanceResults,    // 현재 인스턴스 AI 결과 (기존 aiResults 대체)
//     analysisStatus: aiAnalysisStatus, // AI 분석 상태
//     isAnalyzing,
    
//     // 🔥 새로운 함수들
//     loadAllAIResults,          // Study 전체 AI 결과 로드
//     updateCurrentInstanceResults, // 현재 인스턴스 결과 업데이트
//     checkExistingResults,      // 기존 결과 확인
//     runAIModel,               // AI 모델 실행 (업데이트됨)
//     getStudyStats,            // Study 통계
//     getModelStats,            // 모델별 통계
    
//     // 기존 함수들
//     toggleAnnotationVisibility,
//     deleteAnnotation,
//     clearAllResults,
    
//     // 🔥 하위 호환성을 위한 aiResults
//     aiResults // 기존 코드와 호환성
//   } = ai;

//   // 🔥 측정 훅 구조분해할당 - 별칭 사용으로 충돌 해결
//   const {
//     measurements: measurementsList,
//     manualAnnotations,
//     selectedMeasurement,
//     setSelectedMeasurement,
//     deleteMeasurement,
//     clearAllMeasurements,
//     addMeasurement,
//     addManualAnnotation,
//     deleteManualAnnotation,
//     editManualAnnotation,
//     toggleMeasurementVisibility, // ✅ 실제 measurements를 변경하는 함수
//     toggleAnnotationVisibility: toggleManualAnnotationVisibility, // ✅ 별칭 사용
//     exportMeasurements,
//     getMeasurementStats
//   } = measurements;

//   // 🔥 DICOM 인스턴스 정보 계산
//   const currentStudyUID = selectedStudy?.studyInstanceUID || null;
//   const currentInstance = instances?.[currentImageIndex] || null;
//   const currentInstanceUID = currentInstance?.sopInstanceUID || null;
//   const currentInstanceNumber = currentImageIndex + 1;

//   // 🔥 WorkList에서 판독의 정보 추출 (useAnnotations 호출 전에 추가)
//   const currentDoctor = workListData?.assigned_radiologist || null;
//   const doctorInfo = useMemo(() => ({
//     id: currentDoctor?.medical_id || 'UNKNOWN',
//     name: currentDoctor?.name || '미배정'
//   }), [currentDoctor?.medical_id, currentDoctor?.name]);

//   // 🔥 레포트 훅 추가 - 환자 정보 함수 정의
//   const getPatientInfoForReports = useCallback(() => {
//     return {
//       patient_id: patientData?.patientID || patientID || 'Unknown',
//       patient_name: patientData?.patientName || 'Unknown',
//       study_date: selectedStudy?.studyDate || 'Unknown'
//     };
//   }, [patientData, patientID, selectedStudy]);

//   // 🔥 useReports 훅 호출
//   const reports = useReports(currentStudyUID, getPatientInfoForReports);

//   // 🔥 수정: 실제 이미지 표시 정보 가져오는 함수 - realImageDisplayInfo 사용
//   const getImageDisplayInfo = useCallback(() => {
//     console.log('🔍 getImageDisplayInfo 호출됨 - 실제 정보 사용');
    
//     if (realImageDisplayInfo) {
//       console.log('✅ 실제 이미지 표시 정보 반환:', realImageDisplayInfo);
//       return realImageDisplayInfo;
//     }
    
//     // 실제 정보가 없으면 기본값 반환 (첫 로딩시에만)
//     const defaultInfo = {
//       naturalWidth: 2985,
//       naturalHeight: 2985,
//       containerWidth: 800,
//       containerHeight: 600,
//       displayWidth: 800,
//       displayHeight: 600,
//       offsetX: 0,
//       offsetY: 0,
//       scaleX: 1,
//       scaleY: 1
//     };
    
//     console.log('⚠️ 기본 이미지 표시 정보 사용:', defaultInfo);
//     return defaultInfo;
//   }, [realImageDisplayInfo]);

//   // 🔥 수정: 원본 이미지 크기 가져오는 함수 - realImageDisplayInfo 사용
//   const getOriginalImageSize = useCallback(() => {
//     console.log('🔍 getOriginalImageSize 호출됨 - 실제 정보 사용');
    
//     // 실제 이미지 정보에서 원본 크기 추출
//     if (realImageDisplayInfo) {
//       const size = {
//         width: realImageDisplayInfo.naturalWidth,
//         height: realImageDisplayInfo.naturalHeight
//       };
//       console.log('✅ 실제 원본 이미지 크기 반환:', size);
//       return size;
//     }
    
//     // AI 결과에서 이미지 크기 정보를 가져오거나, 기본값 사용
//     if (currentInstanceResults && Object.keys(currentInstanceResults).length > 0) {
//       // AI 결과에서 이미지 크기 추출
//       for (const modelName in currentInstanceResults) {
//         const results = currentInstanceResults[modelName];
//         if (results && results.length > 0 && results[0].image_width && results[0].image_height) {
//           const size = {
//             width: results[0].image_width,
//             height: results[0].image_height
//           };
//           console.log('📐 AI 결과에서 추출한 원본 이미지 크기:', size);
//           return size;
//         }
//       }
//     }
    
//     // 기본값 사용
//     const defaultSize = { width: 2985, height: 2985 };
//     console.log('📐 기본 원본 이미지 크기 사용:', defaultSize);
//     return defaultSize;
//   }, [realImageDisplayInfo, currentInstanceResults]);

//   // 🔥 새로 추가: DicomViewer에서 이미지 표시 정보 업데이트 받는 함수
//   const handleImageDisplayInfoChange = useCallback((newImageDisplayInfo) => {
//     console.log('🔄 Layout - 이미지 표시 정보 업데이트됨:', newImageDisplayInfo);
//     setRealImageDisplayInfo(newImageDisplayInfo);
//   }, []);

//   // 🔥 Django 어노테이션 훅 - 좌표 변환 함수들 전달
//   const {
//     addMeasurementToAnnotations,
//     saveAnnotationsToServer,
//     loadAnnotationsFromServer,
//     clearAllAnnotations,
//     annotationBoxes,
//     getAllAnnotations,
//     convertMeasurementToAnnotation,
//     updateDjangoAnnotation, // 🔥 새로 추가: 개별 수정 함수
//     isLoading: annotationsLoading
//   } = useAnnotations(
//     currentStudyUID,        // 첫 번째: Study UID
//     currentInstanceUID,     // 두 번째: Instance UID 
//     currentInstanceNumber,  // 세 번째: Instance Number
//     setAnalysisStatus,      // 네 번째: 상태 메시지 설정
//     setActiveLayer,        // 다섯 번째: 레이어 설정
//     doctorInfo,            // 여섯 번째: 판독의 정보
//     getImageDisplayInfo,   // 🔥 일곱 번째: 실제 이미지 표시 정보 함수
//     getOriginalImageSize   // 🔥 여덟 번째: 실제 원본 이미지 크기 함수
//   );

//   // 🔥 인스턴스 변경 감지 → AI 결과 업데이트
//   useEffect(() => {
//     if (currentInstanceUID && updateCurrentInstanceResults && allAIResults) {
//       console.log('🎯 Layout - 인스턴스 변경 감지, AI 결과 업데이트:', currentInstanceUID?.slice(-8) + '...');
//       updateCurrentInstanceResults(currentInstanceUID);
//     }
//   }, [currentInstanceUID, updateCurrentInstanceResults, allAIResults]);

//   // 🔥 수정: 뷰어에 전달할 측정값 - 로컬 측정값만 (Django 어노테이션 제외) + allMeasurementsHidden 반영
//   const combinedMeasurements = React.useMemo(() => {
//     // Django 어노테이션 제거하고 로컬 측정값만 사용
//     const localMeasurements = (viewerMeasurements || []).map(m => ({
//       ...m,
//       visible: allMeasurementsHidden ? false : (m.visible !== false)
//     }));
    
//     console.log('🔍 통합 측정값 (로컬만):', {
//       local: localMeasurements.length,
//       combined: localMeasurements.length,
//       allHidden: allMeasurementsHidden
//     });
    
//     return localMeasurements;
//   }, [viewerMeasurements, allMeasurementsHidden]);

//   // 🔥 수동 주석 필터링 함수 추가 - 라벨이 있는 것만
//   const getFilteredManualAnnotations = useCallback(() => {
//     const filtered = manualAnnotations.filter(annotation => 
//       annotation.label && annotation.label.trim() !== ''
//     );
//     console.log('🏷️ 필터링된 수동 주석:', {
//       전체: manualAnnotations.length,
//       필터링됨: filtered.length,
//       라벨목록: filtered.map(a => a.label)
//     });
//     return filtered;
//   }, [manualAnnotations]);

//   // 🔥 새로 추가: 라벨이 없는 측정값만 필터링 (MeasurementsPanel용)
//   const getUnlabeledMeasurements = useCallback(() => {
//     const unlabeled = measurementsList.filter(measurement => {
//       // Django 어노테이션은 제외 (이미 라벨이 있음)
//       if (measurement.source === 'django') {
//         return false;
//       }
      
//       // 일반 측정값 중에서 라벨이 없는 것만
//       const hasLabel = manualAnnotations.some(annotation => 
//         annotation.measurementId === measurement.id && 
//         annotation.label && 
//         annotation.label.trim() !== ''
//       );
      
//       return !hasLabel; // 라벨이 없는 것만 반환
//     });
    
//     console.log('📏 라벨이 없는 측정값 필터링 (MeasurementsPanel용):', {
//       전체측정값: measurementsList.length,
//       라벨없는측정값: unlabeled.length,
//       라벨없는목록: unlabeled.map(m => ({ id: m.id, type: m.type, value: m.value }))
//     });
    
//     return unlabeled;
//   }, [measurementsList, manualAnnotations]);

//   // 🔥 새로 추가: 라벨이 있는 측정값만 필터링 (ManualAnnotationsPanel용)
//   const getLabeledMeasurements = useCallback(() => {
//     const labeled = measurementsList.filter(measurement => {
//       // 1. Django 어노테이션이면서 라벨이 있는 경우
//       if (measurement.source === 'django' && measurement.djangoData?.label) {
//         const hasLabel = measurement.djangoData.label.trim() !== '';
//         console.log(`🏷️ Django 측정값 ${measurement.id} 라벨 체크:`, measurement.djangoData.label, '→', hasLabel);
//         return hasLabel;
//       }
      
//       // 2. 일반 측정값이면서 manualAnnotations에 라벨이 연결된 경우
//       if (measurement.source !== 'django') {
//         const hasLabel = manualAnnotations.some(annotation => 
//           annotation.measurementId === measurement.id && 
//           annotation.label && 
//           annotation.label.trim() !== ''
//         );
//         console.log(`🏷️ 일반 측정값 ${measurement.id} 라벨 체크:`, '→', hasLabel);
//         return hasLabel;
//       }
      
//       return false;
//     });
    
//     console.log('🏷️ 라벨이 있는 측정값 필터링 (ManualAnnotationsPanel용):', {
//       전체측정값: measurementsList.length,
//       라벨있는측정값: labeled.length,
//       Django어노테이션: labeled.filter(m => m.source === 'django').length,
//       일반측정값: labeled.filter(m => m.source !== 'django').length
//     });
    
//     return labeled;
//   }, [measurementsList, manualAnnotations]);

//   // 🔥 하이라이트 관련 핸들러 개선 - 1초씩 3번 깜빡이
//   const handleHighlightMeasurement = useCallback((measurementId) => {
//     console.log('🎯 측정값 하이라이트 시작:', measurementId);
    
//     // 이미 깜빡이고 있으면 무시
//     if (isBlinking) {
//       console.log('⚠️ 이미 깜빡이는 중이므로 무시');
//       return;
//     }
    
//     setHighlightedMeasurementId(measurementId);
//     setIsBlinking(true);
    
//     // 3초 후 하이라이트 해제 (1초씩 3번 깜빡이는 애니메이션)
//     setTimeout(() => {
//       setHighlightedMeasurementId(null);
//       setIsBlinking(false);
//       console.log('✅ 하이라이트 효과 종료');
//     }, 3000);
//   }, [isBlinking]);

//   // 🔥 핵심 수정: 수동 주석 추가 핸들러 - Django 저장 후 로컬 데이터 제거
//   const handleAddManualAnnotation = useCallback(async (annotationData) => {
//     console.log('🏷️ Layout - 수동 주석 추가 시작:', annotationData);
//     console.log('🔧 Layout - 현재 이미지 표시 정보:', realImageDisplayInfo);
    
//     // 🔥 Django 어노테이션 생성만 수행
//     if (annotationData.measurementId && addMeasurementToAnnotations) {
//         const measurement = measurementsList.find(m => m.id === annotationData.measurementId);
//         if (measurement) {
//             console.log('🔄 측정값을 Django 어노테이션으로 변환:', {
//                 measurementId: measurement.id,
//                 measurementSource: measurement.source,
//                 annotationData,
//                 hasRealImageInfo: !!realImageDisplayInfo
//             });
            
//             try {
//                 // Django 저장 (실제 이미지 정보가 자동으로 사용됨)
//                 const result = await addMeasurementToAnnotations(measurement, annotationData);
                
//                 if (result && result.success) {
//                     console.log('✅ Django 어노테이션 생성 완료');
                    
//                     // 🔥 핵심: Django 저장 성공시 로컬 측정값 제거
//                     console.log('🗑️ 로컬 측정값 제거 시작:', measurement.id);
                    
//                     // 1. useMeasurements에서 제거
//                     deleteMeasurement(measurement.id);
                    
//                     // 2. useSimpleViewer에서도 제거
//                     const updatedViewerMeasurements = viewerMeasurements.filter(m => m.id !== measurement.id);
//                     setViewerMeasurements(updatedViewerMeasurements);
                    
//                     console.log('✅ 로컬 측정값 정리 완료 - 이제 Django 어노테이션만 표시됨');
                    
//                 } else {
//                     console.error('❌ Django 어노테이션 생성 실패');
//                 }
                
//             } catch (error) {
//                 console.error('❌ 라벨 추가 실패:', error);
//             }
//         } else {
//             console.error('❌ 측정값을 찾을 수 없음:', annotationData.measurementId);
//         }
//     } else {
//         console.error('❌ measurementId 또는 addMeasurementToAnnotations가 없음');
//     }
//   }, [measurementsList, addMeasurementToAnnotations, deleteMeasurement, viewerMeasurements, setViewerMeasurements, realImageDisplayInfo]);

//   // 🔥 수정: 수동 주석 편집 핸들러 - Django 개별 편집 API 사용 + 로컬 상태 업데이트
//   const handleEditManualAnnotation = useCallback(async (updatedAnnotation) => {
//     console.log('✏️ Layout - 수동 주석 편집:', updatedAnnotation);
    
//     // 🔥 Django 어노테이션 편집의 경우 개별 수정 API 사용
//     if (updatedAnnotation._original && updatedAnnotation._original.id) {
//       console.log('🔄 Django 어노테이션 개별 편집 - API 호출:', updatedAnnotation._original.id);
      
//       try {
//         // 🔥 개별 수정 API 호출
//         const result = await updateDjangoAnnotation(updatedAnnotation._original.id, {
//           label: updatedAnnotation.label,
//           memo: updatedAnnotation.memo || '',
//           dr_text: updatedAnnotation.memo || ''
//         });
        
//         if (result && result.success) {
//           console.log('✅ Django 어노테이션 개별 수정 완료');
          
//           // 🔥 새로 추가: Django 수정 후 서버에서 최신 데이터 다시 로드
//           if (loadAnnotationsFromServer) {
//             console.log('🔄 Django 어노테이션 수정 후 서버에서 최신 데이터 로드');
//             await loadAnnotationsFromServer();
//           }
          
//         } else {
//           console.error('❌ Django 어노테이션 개별 수정 실패');
//         }
        
//       } catch (error) {
//         console.error('❌ Django 어노테이션 편집 실패:', error);
//       }
      
//       return; // Django 어노테이션은 여기서 종료
//     }
    
//     // 기존 로컬 manualAnnotations 편집
//     if (editManualAnnotation) {
//       editManualAnnotation(updatedAnnotation);
//       console.log('✅ Layout - editManualAnnotation 호출 완료');
//     } else {
//       console.error('❌ Layout - editManualAnnotation 함수가 없음!');
//     }

//     // 🔥 일반 측정값의 라벨 편집으로 인한 Django 어노테이션 업데이트
//     if (updatedAnnotation.measurementId && addMeasurementToAnnotations) {
//       const measurement = measurementsList.find(m => m.id === updatedAnnotation.measurementId);
//       if (measurement && measurement.source !== 'django') {
//         console.log('🔄 일반 측정값의 라벨 편집으로 인한 Django 어노테이션 업데이트:', {
//           measurement,
//           updatedAnnotation
//         });
        
//         try {
//           await addMeasurementToAnnotations(measurement, updatedAnnotation);
//           console.log('✅ 라벨 편집 및 상태 동기화 완료');
          
//         } catch (error) {
//           console.error('❌ 라벨 편집 실패:', error);
//         }
//       }
//     }
//   }, [updateDjangoAnnotation, loadAnnotationsFromServer, editManualAnnotation, measurementsList, addMeasurementToAnnotations]);

//   // 🔥 측정값 삭제 핸들러 - 실시간 상태 업데이트 추가 + 타입 체크
//   const handleDeleteMeasurement = useCallback(async (measurementId) => {
//     console.log('🗑️ 측정값 삭제:', measurementId, 'type:', typeof measurementId);
    
//     // Django 어노테이션인지 확인 (문자열인지 먼저 체크) + 타입 체크 강화
//     const isDjangoMeasurement = measurementId && typeof measurementId === 'string' && measurementId.startsWith('django-');
    
//     if (isDjangoMeasurement) {
//       console.log('🗑️ Django 어노테이션 삭제:', measurementId);
      
//       try {
//         // 1. 즉시 로컬 상태 업데이트
//         console.log('🔄 로컬 상태 즉시 업데이트 시작');
        
//         // measurementsList에서 제거
//         deleteMeasurement(measurementId);
        
//         // 2. annotationBoxes 상태도 강제 새로고침
//         if (loadAnnotationsFromServer) {
//           console.log('🔄 annotationBoxes 새로고침');
//           await loadAnnotationsFromServer();
//         }
        
//         console.log('✅ Django 어노테이션 삭제 및 상태 업데이트 완료');
        
//       } catch (error) {
//         console.error('❌ Django 어노테이션 삭제 실패:', error);
//       }
      
//       return;
//     }
    
//     // 일반 측정값 삭제 (기존 로직)
//     deleteMeasurement(measurementId);
    
//     // useSimpleViewer에서도 삭제
//     const updatedViewerMeasurements = viewerMeasurements.filter(m => m.id !== measurementId);
//     setViewerMeasurements(updatedViewerMeasurements);

//     // Django 어노테이션에서도 삭제 (측정값과 연결된 어노테이션)
//     if (annotationBoxes && annotationBoxes.length > 0) {
//       // measurementId와 연결된 어노테이션 찾기
//       const linkedAnnotations = annotationBoxes.filter(ann => ann.measurementId === measurementId);
//       linkedAnnotations.forEach(annotation => {
//         console.log('🗑️ 연결된 Django 어노테이션도 삭제:', annotation.id);
//         // deleteBoundingBox나 유사한 함수가 있다면 호출
//       });
//     }
//   }, [deleteMeasurement, loadAnnotationsFromServer, viewerMeasurements, setViewerMeasurements, annotationBoxes]);

//   // 🔥 수정: 개별 측정값 표시/숨김 토글 함수 개선 - 디버깅 로그 추가 + 타입 체크
//   const handleToggleMeasurementVisibility = useCallback((measurementId) => {
//     console.log('🔧 개별 토글 시작:', measurementId);
    
//     // 토글 전 상태 확인
//     const beforeState = measurementsList.find(m => m.id === measurementId);
//     console.log('🔧 토글 전 상태:', beforeState?.visible);
    
//     // Django 어노테이션인지 확인 + 타입 체크 강화
//     const isDjangoMeasurement = measurementId && typeof measurementId === 'string' && measurementId.startsWith('django-');
    
//     if (isDjangoMeasurement) {
//       console.log('👁️ Django 어노테이션 표시/숨김 토글:', measurementId);
      
//       // 1. useMeasurements의 측정값 토글 (Django 어노테이션용)
//       if (toggleMeasurementVisibility) {
//         toggleMeasurementVisibility(measurementId);
//         console.log('✅ useMeasurements에서 Django 어노테이션 토글 완료');
//       }
      
//       return;
//     }
    
//     // 일반 측정값 토글
//     console.log('👁️ 일반 측정값 표시/숨김 토글:', measurementId);
    
//     // 1. useMeasurements의 측정값 토글
//     if (toggleMeasurementVisibility) {
//       toggleMeasurementVisibility(measurementId);
//     }
    
//     // 2. useSimpleViewer의 측정값 토글
//     setViewerMeasurements(prev => 
//       prev.map(m => 
//         m.id === measurementId ? { ...m, visible: !m.visible } : m
//       )
//     );
    
//     console.log(`✅ 측정값 ${measurementId} 표시 상태 토글 완료`);
//   }, [measurementsList, toggleMeasurementVisibility, setViewerMeasurements]);

//   // 🔥 수정: 모든 측정값 숨기기/표시하기 토글 (Django 어노테이션 포함)
//   const handleToggleAllMeasurements = useCallback(() => {
//     console.log('👁️‍🗨️ 모든 측정값 표시/숨김 토글 - 현재상태:', allMeasurementsHidden);
    
//     const newHiddenState = !allMeasurementsHidden;
//     setAllMeasurementsHidden(newHiddenState);
    
//     // 1. useSimpleViewer 측정값들의 visible 속성 일괄 변경
//     const updatedViewerMeasurements = viewerMeasurements.map(m => ({
//       ...m,
//       visible: !newHiddenState // 숨김이면 false, 표시면 true
//     }));
//     setViewerMeasurements(updatedViewerMeasurements);
    
//     // 2. useMeasurements의 측정값들도 일괄 변경
//     measurementsList.forEach(measurement => {
//       const currentVisible = measurement.visible !== false;
//       const targetVisible = !newHiddenState;
      
//       if (currentVisible !== targetVisible) {
//         toggleMeasurementVisibility(measurement.id);
//       }
//     });
    
//     console.log(`✅ 모든 측정값 ${newHiddenState ? '숨김' : '표시'} 완료 (Django 어노테이션 포함)`);
//   }, [allMeasurementsHidden, viewerMeasurements, setViewerMeasurements, measurementsList, toggleMeasurementVisibility]);

//   // 🔥 측정값 모두 삭제 - Django 어노테이션도 함께 삭제
//   const handleClearAllMeasurements = useCallback(() => {
//     console.log('🗑️ 모든 측정값 삭제');
    
//     // 1. useMeasurements에서 모두 삭제
//     clearAllMeasurements();
    
//     // 2. useSimpleViewer에서도 모두 삭제
//     setViewerMeasurements([]);
    
//     // 🔥 3. Django 어노테이션도 모두 삭제
//     if (clearAllAnnotations) {
//       clearAllAnnotations();
//       console.log('🗑️ Django 어노테이션도 모두 삭제 완료');
//     }
    
//     // 4. 모두숨기기 상태도 초기화
//     setAllMeasurementsHidden(false);
//   }, [clearAllMeasurements, setViewerMeasurements, clearAllAnnotations]);

//   // 🔥 리셋 핸들러 (양쪽 다 초기화)
//   const handleCompleteReset = useCallback(() => {
//     console.log('🔄 전체 리셋 실행');
    
//     // 1. useSimpleViewer 리셋 (이미지 변환 + 측정값)
//     handleReset();
    
//     // 2. useMeasurements 리셋 (오른쪽 패널 측정값)
//     clearAllMeasurements();
    
//     // 🔥 3. Django 어노테이션 리셋
//     if (clearAllAnnotations) {
//       clearAllAnnotations();
//     }
    
//     // 4. 편집 모드 종료
//     if (isEditMode) {
//       stopEditMode();
//     }
    
//     // 5. 모두숨기기 상태도 초기화
//     setAllMeasurementsHidden(false);
//   }, [handleReset, clearAllMeasurements, clearAllAnnotations, isEditMode, stopEditMode]);

//   // 🔥 도구 변경 핸들러
//   const handleToolChange = useCallback((toolId) => {
//     console.log('🔧 도구 변경:', toolId);
    
//     // 특별한 도구들 처리
//     switch (toolId) {
//       case 'rotate':
//         handleRotate();
//         break;
//       case 'flip':
//         handleFlip();
//         break;
//       case 'invert':
//         handleInvert();
//         break;
//       case 'reset':
//         handleCompleteReset(); // 🔥 전체 리셋 함수 호출
//         break;
//       case 'load-results':
//         handleLoadAIResults();
//         break;
//       default:
//         changeTool(toolId);
//         break;
//     }
//   }, [handleRotate, handleFlip, handleInvert, handleCompleteReset, changeTool]);

//   // 🔥 수정된 AI 모델 실행 핸들러 - 새로운 useAI 훅 사용
//   const handleRunAIModel = useCallback(async (modelName) => {
//     try {
//       console.log('🤖 AI 모델 실행:', modelName, 'Study UID:', currentStudyUID);
      
//       if (!currentStudyUID) {
//         console.error('❌ Study UID가 없어서 AI 분석을 실행할 수 없습니다.');
//         return;
//       }
      
//       // 🔥 기존 결과 확인
//       const existsCheck = await checkExistingResults(currentStudyUID, modelName);
      
//       if (existsCheck.exists) {
//         // 🔥 사용자에게 덮어쓰기 여부 확인
//         const shouldOverwrite = window.confirm(
//           `이미 ${modelName.toUpperCase()} 분석 결과가 있습니다.\n다시 분석하시겠습니까?`
//         );
        
//         if (!shouldOverwrite) {
//           console.log('사용자가 재분석을 취소했습니다.');
//           return;
//         }
//       }
      
//       // 🔥 AI 모델 실행 (강제 덮어쓰기 포함)
//       const results = await runAIModel(modelName, currentStudyUID, existsCheck.exists);
      
//       if (results && !results.exists) {
//         // 성공 시 AI 패널 자동 열기
//         setActiveRightPanel('ai-annotations');
//         console.log('✅ AI 모델 실행 완료:', modelName, results);
//       } else if (results && results.exists) {
//         console.log('⚠️ 기존 결과 존재로 분석이 중단됨');
//       }
      
//     } catch (error) {
//       console.error('❌ AI 모델 실행 실패:', error);
//       alert(`AI 모델 실행 중 오류가 발생했습니다: ${error.message}`);
//     }
//   }, [currentStudyUID, checkExistingResults, runAIModel, setActiveRightPanel]);

//   // 🔥 새로 추가: AI 결과 로드 핸들러
//   const handleLoadAIResults = useCallback(async () => {
//     try {
//       console.log('📥 AI 결과 로드:', currentStudyUID);
      
//       if (!currentStudyUID) {
//         console.error('❌ Study UID가 없어서 AI 결과를 로드할 수 없습니다.');
//         return;
//       }
      
//       await loadAllAIResults(currentStudyUID);
//       setActiveRightPanel('ai-annotations');
//       console.log('✅ AI 결과 로드 완료');
      
//     } catch (error) {
//       console.error('❌ AI 결과 로드 실패:', error);
//     }
//   }, [currentStudyUID, loadAllAIResults, setActiveRightPanel]);

//   // 🔥 핵심 수정: annotationBoxes를 measurementsList에 동기화 (무한 루프 해결)
//   useEffect(() => {
//     console.log('🔍 annotationBoxes 변경 감지:', annotationBoxes?.length || 0);
    
//     if (annotationBoxes && annotationBoxes.length > 0) {
//       // 🔥 새로 추가: Django 어노테이션을 measurementsList에 동기화
//       annotationBoxes.forEach(annotation => {
//         const djangoId = `django-${annotation.id}`;
//         const exists = measurementsList.find(m => m.id === djangoId);
        
//         if (!exists) {
//           console.log('🔄 Django 어노테이션을 measurementsList에 추가:', djangoId);
          
//           // Django 어노테이션을 측정값으로 변환하여 추가
//           const djangoMeasurement = {
//             id: djangoId,
//             type: annotation.shape_type === 'line' ? 'length' : annotation.shape_type,
//             value: `${annotation.label}`, 
//             source: 'django',
//             visible: true, // 🔥 기본값 true
//             djangoData: annotation,
//             slice: currentImageIndex + 1,
//             timestamp: annotation.created,
//             label: annotation.label, // 🔥 라벨 직접 추가
//             memo: annotation.dr_text || annotation.memo || ''
//           };
          
//           addMeasurement(djangoMeasurement);
//         } else {
//           // 🔥 새로 추가: 기존 Django 어노테이션 업데이트 (라벨 수정 반영)
//           const currentMeasurement = measurementsList.find(m => m.id === djangoId);
//           if (currentMeasurement && 
//               (currentMeasurement.label !== annotation.label || 
//                currentMeasurement.memo !== (annotation.dr_text || annotation.memo))) {
            
//             console.log('🔄 Django 어노테이션 업데이트:', djangoId, {
//               이전라벨: currentMeasurement.label,
//               새라벨: annotation.label,
//               이전메모: currentMeasurement.memo,
//               새메모: annotation.dr_text || annotation.memo
//             });
            
//             // 업데이트된 Django 어노테이션 반영
//             const updatedMeasurement = {
//               ...currentMeasurement,
//               value: `${annotation.label}`,
//               label: annotation.label,
//               memo: annotation.dr_text || annotation.memo || '',
//               djangoData: annotation
//             };
            
//             // 기존 측정값 삭제 후 새로 추가
//             deleteMeasurement(djangoId);
//             addMeasurement(updatedMeasurement);
//           }
//         }
//       });
//     }
    
//     // 🔥 기존 삭제 로직 유지 - measurementsList와 annotationBoxes 동기화
//     if (annotationBoxes && measurementsList) {
//       // 삭제된 Django 어노테이션을 measurementsList에서도 제거
//       const currentDjangoIds = annotationBoxes.map(ann => `django-${ann.id}`);
//       const measurementDjangoIds = measurementsList
//         .filter(m => m.source === 'django')
//         .map(m => m.id);
      
//       // 삭제된 항목 찾기
//       const deletedIds = measurementDjangoIds.filter(id => !currentDjangoIds.includes(id));
      
//       if (deletedIds.length > 0) {
//         console.log('🗑️ 삭제된 Django 어노테이션들을 measurementsList에서 제거:', deletedIds);
//         deletedIds.forEach(id => deleteMeasurement(id));
//       }
//     }
//   }, [annotationBoxes, currentImageIndex]); // 🔥 measurementsList 의존성 제거로 무한 루프 방지

//   // 🔥 측정값 동기화를 위한 useEffect - 자동 Django 어노테이션 변환 제거
//   useEffect(() => {
//     if (viewerMeasurements && viewerMeasurements.length > 0) {
//       // useSimpleViewer의 측정값이 변경되면 useMeasurements에도 반영
//       const latestMeasurement = viewerMeasurements[viewerMeasurements.length - 1];
      
//       // 이미 추가된 측정값인지 확인
//       const exists = measurementsList.find(m => m.id === latestMeasurement.id);
      
//       if (!exists && latestMeasurement.isComplete) {
//         console.log('🔄 새 측정값을 useMeasurements에 동기화:', latestMeasurement);
        
//         // useMeasurements에 새 측정값 추가 (라벨 없이)
//         addMeasurement({
//           id: latestMeasurement.id,
//           type: latestMeasurement.type,
//           value: latestMeasurement.value,
//           startPoint: latestMeasurement.startPoint,
//           endPoint: latestMeasurement.endPoint,
//           centerPoint: latestMeasurement.centerPoint,
//           radius: latestMeasurement.radius,
//           slice: currentImageIndex + 1,
//           visible: true,
//           isComplete: true,
//           timestamp: new Date().toISOString()
//           // 🔥 라벨은 추가하지 않음! 사용자가 직접 추가해야 함
//         });
        
//         // 🔥 자동 Django 어노테이션 변환 제거!
//         // 사용자가 직접 라벨을 추가할 때만 addMeasurementToAnnotations 호출됨
//         console.log('📏 측정값만 추가됨 - 라벨은 사용자가 직접 추가해야 함');
//       }
//     }
//   }, [viewerMeasurements, currentImageIndex]); // 🔥 measurementsList 의존성 제거

//   // 🔥 디버깅 로그들 - early return 이전에 이동
//   console.log('🔍 Layout - 인스턴스 값 검증:', {
//     currentStudyUID: currentStudyUID,
//     currentStudyUIDType: typeof currentStudyUID,
//     currentInstanceUID: currentInstanceUID,
//     currentInstanceUIDType: typeof currentInstanceUID,
//     currentInstanceNumber: currentInstanceNumber,
//     currentInstanceNumberType: typeof currentInstanceNumber,
//     selectedStudy: selectedStudy,
//     currentInstance: currentInstance,
//     currentImageIndex: currentImageIndex,
//     instancesLength: instances?.length
//   });

//   console.log('👨‍⚕️ Layout - 판독의 정보:', doctorInfo);

//   console.log('🚨🚨🚨 Layout.js - useAnnotations 호출 확인:');
//   console.log('📍 전달하는 값들:');
//   console.log('  - currentStudyUID:', currentStudyUID);
//   console.log('  - currentInstanceUID:', currentInstanceUID);
//   console.log('  - currentInstanceNumber:', currentInstanceNumber);
//   console.log('  - getImageDisplayInfo:', !!getImageDisplayInfo);
//   console.log('  - getOriginalImageSize:', !!getOriginalImageSize);
//   console.log('  - realImageDisplayInfo:', realImageDisplayInfo);
//   console.log('📦 받아온 결과:');
//   console.log('  - annotationBoxes:', annotationBoxes);
//   console.log('  - annotationBoxes 길이:', annotationBoxes?.length);
//   console.log('  - annotationBoxes 타입:', typeof annotationBoxes);
//   console.log('  - doctorInfo:', doctorInfo);

//   // 🔥 새로 추가: AI 관련 디버깅 로그
//   console.log('🤖 Layout - AI 상태 확인:');
//   console.log('  - allAIResults:', !!allAIResults);
//   console.log('  - allAIResults.groupedByInstance 개수:', allAIResults?.groupedByInstance ? Object.keys(allAIResults.groupedByInstance).length : 0);
//   console.log('  - currentInstanceResults:', currentInstanceResults);
//   console.log('  - currentInstanceResults 개수:', currentInstanceResults ? 
//     Object.keys(currentInstanceResults).reduce((sum, model) => sum + (currentInstanceResults[model]?.length || 0), 0) : 0);
//   console.log('  - aiAnalysisStatus:', aiAnalysisStatus);
//   console.log('  - isAnalyzing:', isAnalyzing);
//   console.log('  - selectedAIModel:', selectedAIModel);

//   console.log('🏥 Layout - DICOM 인스턴스 정보:', {
//     currentStudyUID,
//     currentInstanceUID,
//     currentInstanceNumber,
//     instancesLength: instances?.length || 0,
//     selectedStudy: selectedStudy?.studyInstanceUID?.slice(-8) || 'none',
//     currentInstance: currentInstance?.sopInstanceUID?.slice(-8) || 'none'
//   });

//   // 🔥 로딩 상태 처리 - early return
//   if (loading) {
//     return (
//       <div className="mv-layout">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>환자 데이터를 불러오는 중...</p>
//           <p>환자 ID: {patientID}</p>
//         </div>
//       </div>
//     );
//   }

//   // 🔥 에러 상태 처리 - early return
//   if (error) {
//     return (
//       <div className="mv-layout">
//         <div className="error-container">
//           <h2>❌ 오류 발생</h2>
//           <p>{error}</p>
//           <button 
//             className="error-retry-button"
//             onClick={refreshData}
//           >
//             🔄 다시 시도
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//       <div className="mv-layout">
//         <LeftPanel 
//           showLeftPanel={showLeftPanel}
//           currentSlice={currentImageIndex + 1}
//           setCurrentSlice={(slice) => setImageIndex && setImageIndex(slice - 1)}
//           totalSlices={instances?.length || 0}
//           isPlaying={isPlaying || false}
//           setIsPlaying={setIsPlaying || (() => {})}
          
//           // 환자 데이터
//           patientData={patientData}
//           workListData={workListData}
//           patientInfo={{
//             id: patientData?.patientID || patientID || 'N/A',
//             name: patientData?.patientName || 'N/A',
//             age: patientData?.patientAge || 'N/A',
//             gender: patientData?.patientSex || 'N/A',
//             studyDate: selectedStudy?.studyDate || 'N/A',
//             modality: selectedSeries?.modality || selectedStudy?.modalitiesInStudy || 'N/A'
//           }}
          
//           // PACS 데이터
//           studies={studies || []}
//           selectedStudy={selectedStudy}
//           series={series || []}
//           selectedSeries={selectedSeries}
//           onSelectStudy={selectStudy || (() => {})}
//           onSelectSeries={selectSeries || (() => {})}
//           instances={instances || []}
//         />
        
//         <ViewerContainer 
//           showLeftPanel={showLeftPanel}
//           setShowLeftPanel={setShowLeftPanel}
          
//           // 🔥 간단한 뷰어 관련
//           selectedTool={selectedTool || 'wwwc'}
//           setSelectedTool={handleToolChange}
//           selectedAIModel={selectedAIModel || 'yolov8'}
//           setSelectedAIModel={setSelectedAIModel || (() => {})}
//           onRunAIModel={handleRunAIModel}
          
//           // 🔥 이미지 변환 관련
//           imageTransform={imageTransform}
//           getImageStyle={getImageStyle}
          
//           // 🔥 마우스 이벤트 핸들러
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onWheel={handleWheel}
          
//           // 뷰포트 설정
//           viewportSettings={viewportSettings}
          
//           // 환자 정보
//           patientInfo={{
//             id: patientData?.patientID || patientID || 'N/A',
//             name: patientData?.patientName || 'N/A',
//             age: patientData?.patientAge || 'N/A',
//             gender: patientData?.patientSex || 'N/A',
//             studyDate: selectedStudy?.studyDate || 'N/A',
//             modality: selectedSeries?.modality || selectedStudy?.modalitiesInStudy || 'N/A'
//           }}
          
//           // 이미지 데이터
//           currentSlice={currentImageIndex + 1}
//           totalSlices={instances?.length || 0}
//           imageIds={instances?.map(instance => instance.previewUrl) || []}
//           currentImageUrl={getCurrentImageUrl ? getCurrentImageUrl() : null}
          
//           // 네비게이션
//           canGoPrev={canGoPrev || false}
//           canGoNext={canGoNext || false}
//           onPrevImage={goToPrevImage || (() => {})}
//           onNextImage={goToNextImage || (() => {})}
//           imageInfo={imageInfo || { current: 1, total: 0, displayText: '1 / 0' }}
          
//           // 🔥 수정: AI 결과 - 현재 인스턴스 결과 사용 (하위 호환성)
//           aiResults={currentInstanceResults || aiResults || {}}
//           isAnalyzing={isAnalyzing || false}
          
//           // 🔥 측정 도구 결과 - 로컬 측정값만 (Django 어노테이션 제외)
//           measurements={combinedMeasurements || []}
//           currentMeasurement={currentMeasurement}
          
//           // 🔥 편집 관련 props 추가
//           editingMeasurement={editingMeasurement}
//           isEditMode={isEditMode}
//           startEditMode={startEditMode}
//           stopEditMode={stopEditMode}
          
//           // 🔥 삭제 기능 prop 추가
//           onDeleteMeasurement={handleDeleteMeasurement}
          
//           // 🔥 라벨링 관련 props 추가
//           onAddManualAnnotation={handleAddManualAnnotation}
//           onEditManualAnnotation={handleEditManualAnnotation}
//           setActiveRightPanel={setActiveRightPanel}
          
//           // 🔥 하이라이트 관련 props 추가
//           highlightedMeasurementId={highlightedMeasurementId}
//           onHighlightMeasurement={handleHighlightMeasurement}
          
//           // 🔥 수동 주석 데이터 추가 (라벨 표시용)
//           manualAnnotations={manualAnnotations || []}
          
//           // 🔥 Django 어노테이션 시스템 연동
//           addMeasurementToAnnotations={addMeasurementToAnnotations}
//           updateDjangoAnnotation={updateDjangoAnnotation} // 🔥 새로 추가!
          
//           // 🔥 Django 어노테이션 데이터 추가 (뷰어 렌더링용) + allMeasurementsHidden 전달
//           annotationBoxes={annotationBoxes || []}
//           allMeasurementsHidden={allMeasurementsHidden} // 🔥 추가: 전체 숨기기 상태 전달
          
//           // 🔥 새로 추가: 이미지 표시 정보 업데이트 콜백
//           onImageDisplayInfoChange={handleImageDisplayInfoChange}
//         />
        
//         <RightPanel 
//           activeRightPanel={activeRightPanel}
//           setActiveRightPanel={setActiveRightPanel}
          
//           // 🔥 수정: AI 데이터 - 기존 + 새로운 구조
//           aiResults={aiResults || {}} // 하위 호환성
//           onToggleAnnotationVisibility={toggleAnnotationVisibility || (() => {})}
//           onDeleteAnnotation={deleteAnnotation || (() => {})}
          
//           // 🔥 새로 추가: useAI 훅의 새로운 AI 관련 props
//           currentInstanceResults={currentInstanceResults}
//           allAIResults={allAIResults}
//           analysisStatus={aiAnalysisStatus}
//           isAnalyzing={isAnalyzing}
//           loadAllAIResults={loadAllAIResults}
//           updateCurrentInstanceResults={updateCurrentInstanceResults}
//           getStudyStats={getStudyStats}
//           getModelStats={getModelStats}
          
//           // 🔥 수정: 측정값 분리 전달
//           unlabeledMeasurements={getUnlabeledMeasurements()} // 🔥 라벨 없는 측정값 (MeasurementsPanel용)
//           labeledMeasurements={getLabeledMeasurements()} // 🔥 라벨 있는 측정값 (ManualAnnotationsPanel용)
//           manualAnnotations={getFilteredManualAnnotations()} // 🔥 필터링된 주석만 전달
//           selectedMeasurement={selectedMeasurement}
//           setSelectedMeasurement={setSelectedMeasurement || (() => {})}
//           onDeleteMeasurement={handleDeleteMeasurement}
//           onClearAllMeasurements={handleClearAllMeasurements}
//           onAddManualAnnotation={handleAddManualAnnotation}
//           onDeleteManualAnnotation={deleteManualAnnotation || (() => {})}
//           onEditManualAnnotation={handleEditManualAnnotation}
//           onToggleMeasurementVisibility={handleToggleMeasurementVisibility}
//           onExportMeasurements={exportMeasurements || (() => {})}
//           getMeasurementStats={getMeasurementStats || (() => ({}))}
          
//           // 🔥 모든 측정값 숨기기/표시하기 기능 추가
//           onToggleAllMeasurements={handleToggleAllMeasurements}
//           allMeasurementsHidden={allMeasurementsHidden}
          
//           // 🔥 편집 관련 함수 추가
//           onStartEditMode={startEditMode}
//           onStopEditMode={stopEditMode}
//           isEditMode={isEditMode}
//           editingMeasurement={editingMeasurement}
          
//           // 🔥 하이라이트 관련 함수
//           onHighlightMeasurement={handleHighlightMeasurement}
          
//           // 🔥 Django API 연동용 props
//           currentStudyUID={currentStudyUID}
//           currentInstanceUID={currentInstanceUID}
//           currentInstanceNumber={currentInstanceNumber}
//           setAnalysisStatus={setAnalysisStatus}
//           setActiveLayer={setActiveLayer}
          
//           // 🔥 Django 어노테이션 함수들과 데이터 전달
//           addMeasurementToAnnotations={addMeasurementToAnnotations}
//           saveAnnotationsToServer={saveAnnotationsToServer}
//           loadAnnotationsFromServer={loadAnnotationsFromServer}
//           clearAllAnnotations={clearAllAnnotations}
//           updateDjangoAnnotation={updateDjangoAnnotation} // 🔥 새로 추가!
//           annotationBoxes={annotationBoxes} // 🔥 핵심: 생성된 어노테이션 데이터
          
//           // 🔥 레포트 관련 props 추가
//           reports={reports}
//           showReportModal={showReportModal}
//           setShowReportModal={setShowReportModal}
//           patientInfo={getPatientInfoForReports()}
          
//           // 기타
//           instances={instances || []}
//           currentImageIndex={currentImageIndex || 0}
//           onImageSelect={setImageIndex || (() => {})}
//         />
        
//         {/* 🔥 레포트 모달 추가 */}
//         {showReportModal && (
//           <ReportModal
//             isOpen={showReportModal}
//             onClose={() => setShowReportModal(false)}
//             onSave={reports.saveReportToServer}
            
//             // 환자 및 Study 정보
//             patientInfo={getPatientInfoForReports()}
//             currentStudyUID={currentStudyUID}
//             currentInstanceUID={currentInstanceUID}
//             currentInstanceNumber={currentInstanceNumber}
            
//             // AI 결과 및 어노테이션 데이터
//             allAIResults={allAIResults}
//             currentInstanceResults={currentInstanceResults}
//             annotationBoxes={annotationBoxes}
//             instances={instances}
            
//             // 슬라이스 이동 함수
//             onGoToInstance={setImageIndex}
            
//             // 초기 레포트 내용 (편집 시)
//             initialContent={reports.reportContent || ''}
//             initialStatus={reports.reportStatus || 'draft'}
//           />
//         )}
        
//         {/* 🔥 상태 표시 바 추가 (개발용) */}
//         {(analysisStatus || aiAnalysisStatus) && (
//           <div className="mv-status-bar">
//             <span className="mv-status-text">{analysisStatus || aiAnalysisStatus}</span>
//             <button 
//               className="mv-status-close"
//               onClick={() => {
//                 setAnalysisStatus('');
//               }}
//             >
//               ×
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   };

//   export default Layout;

// /home/medical_system/pacsapp/src/components/viewer_v2/Layout/index.js 

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LeftPanel from '../LeftPanel/LeftPanel';
import ViewerContainer from '../Viewer/ViewerContainer';
import RightPanel from '../RightPanel/RightPanel';
import { useViewerData } from '../Common/DataProvider';

// 🔥 레포트 모달 import 추가
import ReportModal from '../Common/ReportModal';

// 훅들 import
import useViewer from '../../../hooks/viewer_v2/useSimpleViewer';
import useAI from '../../../hooks/viewer_v2/useAI';  
import useMeasurements from '../../../hooks/viewer_v2/useMeasurements';
import useAnnotations from '../../../hooks/viewer_v2/useAnnotations';

// 🔥 레포트 훅 import 추가
import useReports from '../../../hooks/viewer_v2/useReports';

import './Layout.css';

const Layout = () => {
  // 🔥 모든 훅을 최상단에서 호출
  const viewerData = useViewerData();
  const viewer = useViewer(); // 이제 useSimpleViewer
  const ai = useAI();
  const measurements = useMeasurements();

  // UI 상태
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [activeRightPanel, setActiveRightPanel] = useState(null);
  
  // 🔥 레포트 모달 상태 추가
  const [showReportModal, setShowReportModal] = useState(false);
  
  // 🔥 하이라이트 상태 개선 - 깜빡이 제어
  const [highlightedMeasurementId, setHighlightedMeasurementId] = useState(null);
  const [isBlinking, setIsBlinking] = useState(false);

  // 🔥 모두숨기기 상태 추가
  const [allMeasurementsHidden, setAllMeasurementsHidden] = useState(false);

  // 🔥 어노테이션 관련 상태 추가
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [activeLayer, setActiveLayer] = useState('viewer'); // viewer, annotation, modal

  // 🔥 수정: 실제 이미지 표시 정보 상태 추가
  const [realImageDisplayInfo, setRealImageDisplayInfo] = useState(null);

  // 🔥 구조분해할당
  const {
    patientID,
    patientData,
    studies,
    selectedStudy,
    series,
    selectedSeries,
    instances,
    currentImageIndex,
    loading,
    error,
    workListData,
    workListLoading,
    selectStudy,
    selectSeries,
    goToPrevImage,
    goToNextImage,
    getCurrentImageUrl,
    setImageIndex,
    refreshData,
    hasData,
    canGoPrev,
    canGoNext,
    imageInfo
  } = viewerData;

  // 🔥 간단한 뷰어 훅 구조분해할당
  const {
    selectedTool,
    isPlaying,
    setIsPlaying,
    imageTransform,
    measurements: viewerMeasurements,
    currentMeasurement,
    isDragging,
    changeTool,
    adjustZoom,
    adjustPan,
    adjustWindowLevel,
    handleRotate,
    handleFlip,
    handleInvert,
    handleReset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getImageStyle,
    setMeasurements: setViewerMeasurements,
    viewportSettings,
    
    // 🔥 편집 관련 추가
    editingMeasurement,
    editingHandle,
    isEditMode,
    startEditMode,
    stopEditMode
  } = viewer;

  // 🔥 새로운 AI 훅 구조분해할당
  const {
    selectedAIModel,
    setSelectedAIModel,
    
    // 🔥 새로운 상태들
    allAIResults,              // 전체 Study AI 결과
    currentInstanceResults,    // 현재 인스턴스 AI 결과 (기존 aiResults 대체)
    analysisStatus: aiAnalysisStatus, // AI 분석 상태
    isAnalyzing,
    
    // 🔥 새로운 함수들
    loadAllAIResults,          // Study 전체 AI 결과 로드
    updateCurrentInstanceResults, // 현재 인스턴스 결과 업데이트
    checkExistingResults,      // 기존 결과 확인
    runAIModel,               // AI 모델 실행 (업데이트됨)
    getStudyStats,            // Study 통계
    getModelStats,            // 모델별 통계
    
    // 기존 함수들
    toggleAnnotationVisibility,
    deleteAnnotation,
    clearAllResults,
    
    // 🔥 하위 호환성을 위한 aiResults
    aiResults // 기존 코드와 호환성
  } = ai;

  // 🔥 측정 훅 구조분해할당 - 별칭 사용으로 충돌 해결
  const {
    measurements: measurementsList,
    manualAnnotations,
    selectedMeasurement,
    setSelectedMeasurement,
    deleteMeasurement,
    clearAllMeasurements,
    addMeasurement,
    addManualAnnotation,
    deleteManualAnnotation,
    editManualAnnotation,
    toggleMeasurementVisibility, // ✅ 실제 measurements를 변경하는 함수
    toggleAnnotationVisibility: toggleManualAnnotationVisibility, // ✅ 별칭 사용
    exportMeasurements,
    getMeasurementStats
  } = measurements;

  // 🔥 DICOM 인스턴스 정보 계산
  const currentStudyUID = selectedStudy?.studyInstanceUID || null;
  const currentInstance = instances?.[currentImageIndex] || null;
  const currentInstanceUID = currentInstance?.sopInstanceUID || null;
  const currentInstanceNumber = currentImageIndex + 1;

  // 🔥 WorkList에서 판독의 정보 추출 (useAnnotations 호출 전에 추가)
  const currentDoctor = workListData?.assigned_radiologist || null;
  const doctorInfo = useMemo(() => ({
    id: currentDoctor?.medical_id || 'UNKNOWN',
    name: currentDoctor?.name || '미배정'
  }), [currentDoctor?.medical_id, currentDoctor?.name]);

  // 🔥 레포트 훅 추가 - 환자 정보 함수 정의
  const getPatientInfoForReports = useCallback(() => {
    return {
      patient_id: patientData?.patientID || patientID || 'Unknown',
      patient_name: patientData?.patientName || 'Unknown',
      study_date: selectedStudy?.studyDate || 'Unknown'
    };
  }, [patientData, patientID, selectedStudy]);

  // 🔥 useReports 훅 호출
  const reports = useReports(currentStudyUID, getPatientInfoForReports);

  // 🔥 수정: 실제 이미지 표시 정보 가져오는 함수 - realImageDisplayInfo 사용
  const getImageDisplayInfo = useCallback(() => {
    console.log('🔍 getImageDisplayInfo 호출됨 - 실제 정보 사용');
    
    if (realImageDisplayInfo) {
      console.log('✅ 실제 이미지 표시 정보 반환:', realImageDisplayInfo);
      return realImageDisplayInfo;
    }
    
    // 실제 정보가 없으면 기본값 반환 (첫 로딩시에만)
    const defaultInfo = {
      naturalWidth: 2985,
      naturalHeight: 2985,
      containerWidth: 800,
      containerHeight: 600,
      displayWidth: 800,
      displayHeight: 600,
      offsetX: 0,
      offsetY: 0,
      scaleX: 1,
      scaleY: 1
    };
    
    console.log('⚠️ 기본 이미지 표시 정보 사용:', defaultInfo);
    return defaultInfo;
  }, [realImageDisplayInfo]);

  // 🔥 수정: 원본 이미지 크기 가져오는 함수 - realImageDisplayInfo 사용
  const getOriginalImageSize = useCallback(() => {
    console.log('🔍 getOriginalImageSize 호출됨 - 실제 정보 사용');
    
    // 실제 이미지 정보에서 원본 크기 추출
    if (realImageDisplayInfo) {
      const size = {
        width: realImageDisplayInfo.naturalWidth,
        height: realImageDisplayInfo.naturalHeight
      };
      console.log('✅ 실제 원본 이미지 크기 반환:', size);
      return size;
    }
    
    // AI 결과에서 이미지 크기 정보를 가져오거나, 기본값 사용
    if (currentInstanceResults && Object.keys(currentInstanceResults).length > 0) {
      // AI 결과에서 이미지 크기 추출
      for (const modelName in currentInstanceResults) {
        const results = currentInstanceResults[modelName];
        if (results && results.length > 0 && results[0].image_width && results[0].image_height) {
          const size = {
            width: results[0].image_width,
            height: results[0].image_height
          };
          console.log('📐 AI 결과에서 추출한 원본 이미지 크기:', size);
          return size;
        }
      }
    }
    
    // 기본값 사용
    const defaultSize = { width: 2985, height: 2985 };
    console.log('📐 기본 원본 이미지 크기 사용:', defaultSize);
    return defaultSize;
  }, [realImageDisplayInfo, currentInstanceResults]);

  // 🔥 새로 추가: DicomViewer에서 이미지 표시 정보 업데이트 받는 함수
  const handleImageDisplayInfoChange = useCallback((newImageDisplayInfo) => {
    console.log('🔄 Layout - 이미지 표시 정보 업데이트됨:', newImageDisplayInfo);
    setRealImageDisplayInfo(newImageDisplayInfo);
  }, []);

  // 🔥 Django 어노테이션 훅 - 좌표 변환 함수들 전달
  const {
    addMeasurementToAnnotations,
    saveAnnotationsToServer,
    loadAnnotationsFromServer,
    clearAllAnnotations,
    annotationBoxes,
    getAllAnnotations,
    convertMeasurementToAnnotation,
    updateDjangoAnnotation, // 🔥 새로 추가: 개별 수정 함수
    isLoading: annotationsLoading
  } = useAnnotations(
    currentStudyUID,        // 첫 번째: Study UID
    currentInstanceUID,     // 두 번째: Instance UID 
    currentInstanceNumber,  // 세 번째: Instance Number
    setAnalysisStatus,      // 네 번째: 상태 메시지 설정
    setActiveLayer,        // 다섯 번째: 레이어 설정
    doctorInfo,            // 여섯 번째: 판독의 정보
    getImageDisplayInfo,   // 🔥 일곱 번째: 실제 이미지 표시 정보 함수
    getOriginalImageSize   // 🔥 여덟 번째: 실제 원본 이미지 크기 함수
  );

  // 🔥 인스턴스 변경 감지 → AI 결과 업데이트
  useEffect(() => {
    if (currentInstanceUID && updateCurrentInstanceResults && allAIResults) {
      console.log('🎯 Layout - 인스턴스 변경 감지, AI 결과 업데이트:', currentInstanceUID?.slice(-8) + '...');
      updateCurrentInstanceResults(currentInstanceUID);
    }
  }, [currentInstanceUID, updateCurrentInstanceResults, allAIResults]);

  // 🔥 수정: 뷰어에 전달할 측정값 - 로컬 측정값만 (Django 어노테이션 제외) + allMeasurementsHidden 반영
  const combinedMeasurements = React.useMemo(() => {
    // Django 어노테이션 제거하고 로컬 측정값만 사용
    const localMeasurements = (viewerMeasurements || []).map(m => ({
      ...m,
      visible: allMeasurementsHidden ? false : (m.visible !== false)
    }));
    
    console.log('🔍 통합 측정값 (로컬만):', {
      local: localMeasurements.length,
      combined: localMeasurements.length,
      allHidden: allMeasurementsHidden
    });
    
    return localMeasurements;
  }, [viewerMeasurements, allMeasurementsHidden]);

  // 🔥 수동 주석 필터링 함수 추가 - 라벨이 있는 것만
  const getFilteredManualAnnotations = useCallback(() => {
    const filtered = manualAnnotations.filter(annotation => 
      annotation.label && annotation.label.trim() !== ''
    );
    console.log('🏷️ 필터링된 수동 주석:', {
      전체: manualAnnotations.length,
      필터링됨: filtered.length,
      라벨목록: filtered.map(a => a.label)
    });
    return filtered;
  }, [manualAnnotations]);

  // 🔥 새로 추가: 라벨이 없는 측정값만 필터링 (MeasurementsPanel용)
  const getUnlabeledMeasurements = useCallback(() => {
    const unlabeled = measurementsList.filter(measurement => {
      // Django 어노테이션은 제외 (이미 라벨이 있음)
      if (measurement.source === 'django') {
        return false;
      }
      
      // 일반 측정값 중에서 라벨이 없는 것만
      const hasLabel = manualAnnotations.some(annotation => 
        annotation.measurementId === measurement.id && 
        annotation.label && 
        annotation.label.trim() !== ''
      );
      
      return !hasLabel; // 라벨이 없는 것만 반환
    });
    
    console.log('📏 라벨이 없는 측정값 필터링 (MeasurementsPanel용):', {
      전체측정값: measurementsList.length,
      라벨없는측정값: unlabeled.length,
      라벨없는목록: unlabeled.map(m => ({ id: m.id, type: m.type, value: m.value }))
    });
    
    return unlabeled;
  }, [measurementsList, manualAnnotations]);

  // 🔥 새로 추가: 라벨이 있는 측정값만 필터링 (ManualAnnotationsPanel용)
  const getLabeledMeasurements = useCallback(() => {
    const labeled = measurementsList.filter(measurement => {
      // 1. Django 어노테이션이면서 라벨이 있는 경우
      if (measurement.source === 'django' && measurement.djangoData?.label) {
        const hasLabel = measurement.djangoData.label.trim() !== '';
        console.log(`🏷️ Django 측정값 ${measurement.id} 라벨 체크:`, measurement.djangoData.label, '→', hasLabel);
        return hasLabel;
      }
      
      // 2. 일반 측정값이면서 manualAnnotations에 라벨이 연결된 경우
      if (measurement.source !== 'django') {
        const hasLabel = manualAnnotations.some(annotation => 
          annotation.measurementId === measurement.id && 
          annotation.label && 
          annotation.label.trim() !== ''
        );
        console.log(`🏷️ 일반 측정값 ${measurement.id} 라벨 체크:`, '→', hasLabel);
        return hasLabel;
      }
      
      return false;
    });
    
    console.log('🏷️ 라벨이 있는 측정값 필터링 (ManualAnnotationsPanel용):', {
      전체측정값: measurementsList.length,
      라벨있는측정값: labeled.length,
      Django어노테이션: labeled.filter(m => m.source === 'django').length,
      일반측정값: labeled.filter(m => m.source !== 'django').length
    });
    
    return labeled;
  }, [measurementsList, manualAnnotations]);

  // 🔥 하이라이트 관련 핸들러 개선 - 1초씩 3번 깜빡이
  const handleHighlightMeasurement = useCallback((measurementId) => {
    console.log('🎯 측정값 하이라이트 시작:', measurementId);
    
    // 이미 깜빡이고 있으면 무시
    if (isBlinking) {
      console.log('⚠️ 이미 깜빡이는 중이므로 무시');
      return;
    }
    
    setHighlightedMeasurementId(measurementId);
    setIsBlinking(true);
    
    // 3초 후 하이라이트 해제 (1초씩 3번 깜빡이는 애니메이션)
    setTimeout(() => {
      setHighlightedMeasurementId(null);
      setIsBlinking(false);
      console.log('✅ 하이라이트 효과 종료');
    }, 3000);
  }, [isBlinking]);

  // 🔥 핵심 수정: 수동 주석 추가 핸들러 - Django 저장 후 로컬 데이터 제거
  const handleAddManualAnnotation = useCallback(async (annotationData) => {
    console.log('🏷️ Layout - 수동 주석 추가 시작:', annotationData);
    console.log('🔧 Layout - 현재 이미지 표시 정보:', realImageDisplayInfo);
    
    // 🔥 Django 어노테이션 생성만 수행
    if (annotationData.measurementId && addMeasurementToAnnotations) {
        const measurement = measurementsList.find(m => m.id === annotationData.measurementId);
        if (measurement) {
            console.log('🔄 측정값을 Django 어노테이션으로 변환:', {
                measurementId: measurement.id,
                measurementSource: measurement.source,
                annotationData,
                hasRealImageInfo: !!realImageDisplayInfo
            });
            
            try {
                // Django 저장 (실제 이미지 정보가 자동으로 사용됨)
                const result = await addMeasurementToAnnotations(measurement, annotationData);
                
                if (result && result.success) {
                    console.log('✅ Django 어노테이션 생성 완료');
                    
                    // 🔥 핵심: Django 저장 성공시 로컬 측정값 제거
                    console.log('🗑️ 로컬 측정값 제거 시작:', measurement.id);
                    
                    // 1. useMeasurements에서 제거
                    deleteMeasurement(measurement.id);
                    
                    // 2. useSimpleViewer에서도 제거
                    const updatedViewerMeasurements = viewerMeasurements.filter(m => m.id !== measurement.id);
                    setViewerMeasurements(updatedViewerMeasurements);
                    
                    console.log('✅ 로컬 측정값 정리 완료 - 이제 Django 어노테이션만 표시됨');
                    
                } else {
                    console.error('❌ Django 어노테이션 생성 실패');
                }
                
            } catch (error) {
                console.error('❌ 라벨 추가 실패:', error);
            }
        } else {
            console.error('❌ 측정값을 찾을 수 없음:', annotationData.measurementId);
        }
    } else {
        console.error('❌ measurementId 또는 addMeasurementToAnnotations가 없음');
    }
  }, [measurementsList, addMeasurementToAnnotations, deleteMeasurement, viewerMeasurements, setViewerMeasurements, realImageDisplayInfo]);

  // 🔥 수정: 수동 주석 편집 핸들러 - Django 개별 편집 API 사용 + 로컬 상태 업데이트
  const handleEditManualAnnotation = useCallback(async (updatedAnnotation) => {
    console.log('✏️ Layout - 수동 주석 편집:', updatedAnnotation);
    
    // 🔥 Django 어노테이션 편집의 경우 개별 수정 API 사용
    if (updatedAnnotation._original && updatedAnnotation._original.id) {
      console.log('🔄 Django 어노테이션 개별 편집 - API 호출:', updatedAnnotation._original.id);
      
      try {
        // 🔥 개별 수정 API 호출
        const result = await updateDjangoAnnotation(updatedAnnotation._original.id, {
          label: updatedAnnotation.label,
          memo: updatedAnnotation.memo || '',
          dr_text: updatedAnnotation.memo || ''
        });
        
        if (result && result.success) {
          console.log('✅ Django 어노테이션 개별 수정 완료');
          
          // 🔥 새로 추가: Django 수정 후 서버에서 최신 데이터 다시 로드
          if (loadAnnotationsFromServer) {
            console.log('🔄 Django 어노테이션 수정 후 서버에서 최신 데이터 로드');
            await loadAnnotationsFromServer();
          }
          
        } else {
          console.error('❌ Django 어노테이션 개별 수정 실패');
        }
        
      } catch (error) {
        console.error('❌ Django 어노테이션 편집 실패:', error);
      }
      
      return; // Django 어노테이션은 여기서 종료
    }
    
    // 기존 로컬 manualAnnotations 편집
    if (editManualAnnotation) {
      editManualAnnotation(updatedAnnotation);
      console.log('✅ Layout - editManualAnnotation 호출 완료');
    } else {
      console.error('❌ Layout - editManualAnnotation 함수가 없음!');
    }

    // 🔥 일반 측정값의 라벨 편집으로 인한 Django 어노테이션 업데이트
    if (updatedAnnotation.measurementId && addMeasurementToAnnotations) {
      const measurement = measurementsList.find(m => m.id === updatedAnnotation.measurementId);
      if (measurement && measurement.source !== 'django') {
        console.log('🔄 일반 측정값의 라벨 편집으로 인한 Django 어노테이션 업데이트:', {
          measurement,
          updatedAnnotation
        });
        
        try {
          await addMeasurementToAnnotations(measurement, updatedAnnotation);
          console.log('✅ 라벨 편집 및 상태 동기화 완료');
          
        } catch (error) {
          console.error('❌ 라벨 편집 실패:', error);
        }
      }
    }
  }, [updateDjangoAnnotation, loadAnnotationsFromServer, editManualAnnotation, measurementsList, addMeasurementToAnnotations]);

  // 🔥 측정값 삭제 핸들러 - 실시간 상태 업데이트 추가 + 타입 체크
  const handleDeleteMeasurement = useCallback(async (measurementId) => {
    console.log('🗑️ 측정값 삭제:', measurementId, 'type:', typeof measurementId);
    
    // Django 어노테이션인지 확인 (문자열인지 먼저 체크) + 타입 체크 강화
    const isDjangoMeasurement = measurementId && typeof measurementId === 'string' && measurementId.startsWith('django-');
    
    if (isDjangoMeasurement) {
      console.log('🗑️ Django 어노테이션 삭제:', measurementId);
      
      try {
        // 1. 즉시 로컬 상태 업데이트
        console.log('🔄 로컬 상태 즉시 업데이트 시작');
        
        // measurementsList에서 제거
        deleteMeasurement(measurementId);
        
        // 2. annotationBoxes 상태도 강제 새로고침
        if (loadAnnotationsFromServer) {
          console.log('🔄 annotationBoxes 새로고침');
          await loadAnnotationsFromServer();
        }
        
        console.log('✅ Django 어노테이션 삭제 및 상태 업데이트 완료');
        
      } catch (error) {
        console.error('❌ Django 어노테이션 삭제 실패:', error);
      }
      
      return;
    }
    
    // 일반 측정값 삭제 (기존 로직)
    deleteMeasurement(measurementId);
    
    // useSimpleViewer에서도 삭제
    const updatedViewerMeasurements = viewerMeasurements.filter(m => m.id !== measurementId);
    setViewerMeasurements(updatedViewerMeasurements);

    // Django 어노테이션에서도 삭제 (측정값과 연결된 어노테이션)
    if (annotationBoxes && annotationBoxes.length > 0) {
      // measurementId와 연결된 어노테이션 찾기
      const linkedAnnotations = annotationBoxes.filter(ann => ann.measurementId === measurementId);
      linkedAnnotations.forEach(annotation => {
        console.log('🗑️ 연결된 Django 어노테이션도 삭제:', annotation.id);
        // deleteBoundingBox나 유사한 함수가 있다면 호출
      });
    }
  }, [deleteMeasurement, loadAnnotationsFromServer, viewerMeasurements, setViewerMeasurements, annotationBoxes]);

  // 🔥 수정: 개별 측정값 표시/숨김 토글 함수 개선 - 디버깅 로그 추가 + 타입 체크
  const handleToggleMeasurementVisibility = useCallback((measurementId) => {
    console.log('🔧 개별 토글 시작:', measurementId);
    
  // 토글 전 상태 확인
  const beforeMeasurement = measurementsList.find(m => m.id === measurementId);
  console.log('🔧 토글 전 상태:', {
    id: measurementId,
    visible: beforeMeasurement?.visible,
    exists: !!beforeMeasurement
  });
  
  // Django 어노테이션인지 확인
  const isDjangoMeasurement = measurementId && typeof measurementId === 'string' && measurementId.startsWith('django-');
  
  if (isDjangoMeasurement) {
    console.log('👁️ Django 어노테이션 표시/숨김 토글:', measurementId);
    
    // 🔥 핵심 수정: useMeasurements의 toggleMeasurementVisibility 호출
    if (toggleMeasurementVisibility) {
      toggleMeasurementVisibility(measurementId);
      
      // 🔥 추가: 토글 후 상태 확인 (디버깅용)
      setTimeout(() => {
        const afterMeasurement = measurementsList.find(m => m.id === measurementId);
        console.log('🔧 토글 후 상태:', {
          id: measurementId,
          visible: afterMeasurement?.visible,
          changed: beforeMeasurement?.visible !== afterMeasurement?.visible
        });
      }, 100);
      
      console.log('✅ useMeasurements에서 Django 어노테이션 토글 호출 완료');
    } else {
      console.error('❌ toggleMeasurementVisibility 함수가 없음!');
    }
      
      return;
    }
    
    // 일반 측정값 토글
    console.log('👁️ 일반 측정값 표시/숨김 토글:', measurementId);
    
    // 1. useMeasurements의 측정값 토글
    if (toggleMeasurementVisibility) {
      toggleMeasurementVisibility(measurementId);
    }
    
    // 2. useSimpleViewer의 측정값 토글
    setViewerMeasurements(prev => 
      prev.map(m => 
        m.id === measurementId ? { ...m, visible: !m.visible } : m
      )
    );
    
    console.log(`✅ 측정값 ${measurementId} 표시 상태 토글 완료`);
  }, [measurementsList, toggleMeasurementVisibility, setViewerMeasurements]);

  // 🔥 수정: 모든 측정값 숨기기/표시하기 토글 (Django 어노테이션 포함)
  const handleToggleAllMeasurements = useCallback(() => {
    console.log('👁️‍🗨️ 모든 측정값 표시/숨김 토글 - 현재상태:', allMeasurementsHidden);
    
    const newHiddenState = !allMeasurementsHidden;
    setAllMeasurementsHidden(newHiddenState);
    
    // 1. useSimpleViewer 측정값들의 visible 속성 일괄 변경
    const updatedViewerMeasurements = viewerMeasurements.map(m => ({
      ...m,
      visible: !newHiddenState // 숨김이면 false, 표시면 true
    }));
    setViewerMeasurements(updatedViewerMeasurements);
    
    // 2. useMeasurements의 측정값들도 일괄 변경
    measurementsList.forEach(measurement => {
      const currentVisible = measurement.visible !== false;
      const targetVisible = !newHiddenState;
      
      if (currentVisible !== targetVisible) {
        toggleMeasurementVisibility(measurement.id);
      }
    });
    
    console.log(`✅ 모든 측정값 ${newHiddenState ? '숨김' : '표시'} 완료 (Django 어노테이션 포함)`);
  }, [allMeasurementsHidden, viewerMeasurements, setViewerMeasurements, measurementsList, toggleMeasurementVisibility]);

  // 🔥 측정값 모두 삭제 - Django 어노테이션도 함께 삭제
  const handleClearAllMeasurements = useCallback(() => {
    console.log('🗑️ 모든 측정값 삭제');
    
    // 1. useMeasurements에서 모두 삭제
    clearAllMeasurements();
    
    // 2. useSimpleViewer에서도 모두 삭제
    setViewerMeasurements([]);
    
    // 🔥 3. Django 어노테이션도 모두 삭제
    if (clearAllAnnotations) {
      clearAllAnnotations();
      console.log('🗑️ Django 어노테이션도 모두 삭제 완료');
    }
    
    // 4. 모두숨기기 상태도 초기화
    setAllMeasurementsHidden(false);
  }, [clearAllMeasurements, setViewerMeasurements, clearAllAnnotations]);

  // 🔥 리셋 핸들러 (양쪽 다 초기화)
  const handleCompleteReset = useCallback(() => {
    console.log('🔄 전체 리셋 실행');
    
    // 1. useSimpleViewer 리셋 (이미지 변환 + 측정값)
    handleReset();
    
    // 2. useMeasurements 리셋 (오른쪽 패널 측정값)
    clearAllMeasurements();
    
    // 🔥 3. Django 어노테이션 리셋
    if (clearAllAnnotations) {
      clearAllAnnotations();
    }
    
    // 4. 편집 모드 종료
    if (isEditMode) {
      stopEditMode();
    }
    
    // 5. 모두숨기기 상태도 초기화
    setAllMeasurementsHidden(false);
  }, [handleReset, clearAllMeasurements, clearAllAnnotations, isEditMode, stopEditMode]);

  // 🔥 도구 변경 핸들러
  const handleToolChange = useCallback((toolId) => {
    console.log('🔧 도구 변경:', toolId);
    
    // 특별한 도구들 처리
    switch (toolId) {
      case 'rotate':
        handleRotate();
        break;
      case 'flip':
        handleFlip();
        break;
      case 'invert':
        handleInvert();
        break;
      case 'reset':
        handleCompleteReset(); // 🔥 전체 리셋 함수 호출
        break;
      case 'load-results':
        handleLoadAIResults();
        break;
      default:
        changeTool(toolId);
        break;
    }
  }, [handleRotate, handleFlip, handleInvert, handleCompleteReset, changeTool]);

  // 🔥 수정된 AI 모델 실행 핸들러 - 새로운 useAI 훅 사용
  const handleRunAIModel = useCallback(async (modelName) => {
    try {
      console.log('🤖 AI 모델 실행:', modelName, 'Study UID:', currentStudyUID);
      
      if (!currentStudyUID) {
        console.error('❌ Study UID가 없어서 AI 분석을 실행할 수 없습니다.');
        return;
      }
      
      // 🔥 기존 결과 확인
      const existsCheck = await checkExistingResults(currentStudyUID, modelName);
      
      if (existsCheck.exists) {
        // 🔥 사용자에게 덮어쓰기 여부 확인
        const shouldOverwrite = window.confirm(
          `이미 ${modelName.toUpperCase()} 분석 결과가 있습니다.\n다시 분석하시겠습니까?`
        );
        
        if (!shouldOverwrite) {
          console.log('사용자가 재분석을 취소했습니다.');
          return;
        }
      }
      
      // 🔥 AI 모델 실행 (강제 덮어쓰기 포함)
      const results = await runAIModel(modelName, currentStudyUID, existsCheck.exists);
      
      if (results && !results.exists) {
        // 성공 시 AI 패널 자동 열기
        setActiveRightPanel('ai-annotations');
        console.log('✅ AI 모델 실행 완료:', modelName, results);
      } else if (results && results.exists) {
        console.log('⚠️ 기존 결과 존재로 분석이 중단됨');
      }
      
    } catch (error) {
      console.error('❌ AI 모델 실행 실패:', error);
      alert(`AI 모델 실행 중 오류가 발생했습니다: ${error.message}`);
    }
  }, [currentStudyUID, checkExistingResults, runAIModel, setActiveRightPanel]);

  // 🔥 새로 추가: AI 결과 로드 핸들러
  const handleLoadAIResults = useCallback(async () => {
    try {
      console.log('📥 AI 결과 로드:', currentStudyUID);
      
      if (!currentStudyUID) {
        console.error('❌ Study UID가 없어서 AI 결과를 로드할 수 없습니다.');
        return;
      }
      
      await loadAllAIResults(currentStudyUID);
      setActiveRightPanel('ai-annotations');
      console.log('✅ AI 결과 로드 완료');
      
    } catch (error) {
      console.error('❌ AI 결과 로드 실패:', error);
    }
  }, [currentStudyUID, loadAllAIResults, setActiveRightPanel]);

  // 🔥 핵심 수정: annotationBoxes를 measurementsList에 동기화 (무한 루프 해결)
  useEffect(() => {
    console.log('🔍 annotationBoxes 변경 감지:', annotationBoxes?.length || 0);
    
    if (annotationBoxes && annotationBoxes.length > 0) {
      // 🔥 새로 추가: Django 어노테이션을 measurementsList에 동기화
      annotationBoxes.forEach(annotation => {
        const djangoId = `django-${annotation.id}`;
        const exists = measurementsList.find(m => m.id === djangoId);
        
        if (!exists) {
          console.log('🔄 Django 어노테이션을 measurementsList에 추가:', djangoId);
          
          // Django 어노테이션을 측정값으로 변환하여 추가
          const djangoMeasurement = {
            id: djangoId,
            type: annotation.shape_type === 'line' ? 'length' : annotation.shape_type,
            value: `${annotation.label}`, 
            source: 'django',
            visible: true, // 🔥 기본값 true
            djangoData: annotation,
            slice: currentImageIndex + 1,
            timestamp: annotation.created,
            label: annotation.label, // 🔥 라벨 직접 추가
            memo: annotation.dr_text || annotation.memo || ''
          };
          
          addMeasurement(djangoMeasurement);
        } else {
          // 🔥 새로 추가: 기존 Django 어노테이션 업데이트 (라벨 수정 반영)
          const currentMeasurement = measurementsList.find(m => m.id === djangoId);
          if (currentMeasurement && 
              (currentMeasurement.label !== annotation.label || 
               currentMeasurement.memo !== (annotation.dr_text || annotation.memo))) {
            
            console.log('🔄 Django 어노테이션 업데이트:', djangoId, {
              이전라벨: currentMeasurement.label,
              새라벨: annotation.label,
              이전메모: currentMeasurement.memo,
              새메모: annotation.dr_text || annotation.memo
            });
            
            // 업데이트된 Django 어노테이션 반영
            const updatedMeasurement = {
              ...currentMeasurement,
              value: `${annotation.label}`,
              label: annotation.label,
              memo: annotation.dr_text || annotation.memo || '',
              djangoData: annotation
            };
            
            // 기존 측정값 삭제 후 새로 추가
            deleteMeasurement(djangoId);
            addMeasurement(updatedMeasurement);
          }
        }
      });
    }
    
    // 🔥 기존 삭제 로직 유지 - measurementsList와 annotationBoxes 동기화
    if (annotationBoxes && measurementsList) {
      // 삭제된 Django 어노테이션을 measurementsList에서도 제거
      const currentDjangoIds = annotationBoxes.map(ann => `django-${ann.id}`);
      const measurementDjangoIds = measurementsList
        .filter(m => m.source === 'django')
        .map(m => m.id);
      
      // 삭제된 항목 찾기
      const deletedIds = measurementDjangoIds.filter(id => !currentDjangoIds.includes(id));
      
      if (deletedIds.length > 0) {
        console.log('🗑️ 삭제된 Django 어노테이션들을 measurementsList에서 제거:', deletedIds);
        deletedIds.forEach(id => deleteMeasurement(id));
      }
    }
  }, [annotationBoxes, currentImageIndex]); // 🔥 measurementsList 의존성 제거로 무한 루프 방지

  // 🔥 측정값 동기화를 위한 useEffect - 자동 Django 어노테이션 변환 제거
  useEffect(() => {
    if (viewerMeasurements && viewerMeasurements.length > 0) {
      // useSimpleViewer의 측정값이 변경되면 useMeasurements에도 반영
      const latestMeasurement = viewerMeasurements[viewerMeasurements.length - 1];
      
      // 이미 추가된 측정값인지 확인
      const exists = measurementsList.find(m => m.id === latestMeasurement.id);
      
      if (!exists && latestMeasurement.isComplete) {
        console.log('🔄 새 측정값을 useMeasurements에 동기화:', latestMeasurement);
        
        // useMeasurements에 새 측정값 추가 (라벨 없이)
        addMeasurement({
          id: latestMeasurement.id,
          type: latestMeasurement.type,
          value: latestMeasurement.value,
          startPoint: latestMeasurement.startPoint,
          endPoint: latestMeasurement.endPoint,
          centerPoint: latestMeasurement.centerPoint,
          radius: latestMeasurement.radius,
          slice: currentImageIndex + 1,
          visible: true,
          isComplete: true,
          timestamp: new Date().toISOString()
          // 🔥 라벨은 추가하지 않음! 사용자가 직접 추가해야 함
        });
        
        // 🔥 자동 Django 어노테이션 변환 제거!
        // 사용자가 직접 라벨을 추가할 때만 addMeasurementToAnnotations 호출됨
        console.log('📏 측정값만 추가됨 - 라벨은 사용자가 직접 추가해야 함');
      }
    }
  }, [viewerMeasurements, currentImageIndex]); // 🔥 measurementsList 의존성 제거

  // 🔥 디버깅 로그들 - early return 이전에 이동
  console.log('🔍 Layout - 인스턴스 값 검증:', {
    currentStudyUID: currentStudyUID,
    currentStudyUIDType: typeof currentStudyUID,
    currentInstanceUID: currentInstanceUID,
    currentInstanceUIDType: typeof currentInstanceUID,
    currentInstanceNumber: currentInstanceNumber,
    currentInstanceNumberType: typeof currentInstanceNumber,
    selectedStudy: selectedStudy,
    currentInstance: currentInstance,
    currentImageIndex: currentImageIndex,
    instancesLength: instances?.length
  });

  console.log('👨‍⚕️ Layout - 판독의 정보:', doctorInfo);

  console.log('🚨🚨🚨 Layout.js - useAnnotations 호출 확인:');
  console.log('📍 전달하는 값들:');
  console.log('  - currentStudyUID:', currentStudyUID);
  console.log('  - currentInstanceUID:', currentInstanceUID);
  console.log('  - currentInstanceNumber:', currentInstanceNumber);
  console.log('  - getImageDisplayInfo:', !!getImageDisplayInfo);
  console.log('  - getOriginalImageSize:', !!getOriginalImageSize);
  console.log('  - realImageDisplayInfo:', realImageDisplayInfo);
  console.log('📦 받아온 결과:');
  console.log('  - annotationBoxes:', annotationBoxes);
  console.log('  - annotationBoxes 길이:', annotationBoxes?.length);
  console.log('  - annotationBoxes 타입:', typeof annotationBoxes);
  console.log('  - doctorInfo:', doctorInfo);

  // 🔥 새로 추가: AI 관련 디버깅 로그
  console.log('🤖 Layout - AI 상태 확인:');
  console.log('  - allAIResults:', !!allAIResults);
  console.log('  - allAIResults.groupedByInstance 개수:', allAIResults?.groupedByInstance ? Object.keys(allAIResults.groupedByInstance).length : 0);
  console.log('  - currentInstanceResults:', currentInstanceResults);
  console.log('  - currentInstanceResults 개수:', currentInstanceResults ? 
    Object.keys(currentInstanceResults).reduce((sum, model) => sum + (currentInstanceResults[model]?.length || 0), 0) : 0);
  console.log('  - aiAnalysisStatus:', aiAnalysisStatus);
  console.log('  - isAnalyzing:', isAnalyzing);
  console.log('  - selectedAIModel:', selectedAIModel);

  console.log('🏥 Layout - DICOM 인스턴스 정보:', {
    currentStudyUID,
    currentInstanceUID,
    currentInstanceNumber,
    instancesLength: instances?.length || 0,
    selectedStudy: selectedStudy?.studyInstanceUID?.slice(-8) || 'none',
    currentInstance: currentInstance?.sopInstanceUID?.slice(-8) || 'none'
  });

  // 🔥 로딩 상태 처리 - early return
  if (loading) {
    return (
      <div className="mv-layout">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>환자 데이터를 불러오는 중...</p>
          <p>환자 ID: {patientID}</p>
        </div>
      </div>
    );
  }

  // 🔥 에러 상태 처리 - early return
  if (error) {
    return (
      <div className="mv-layout">
        <div className="error-container">
          <h2>❌ 오류 발생</h2>
          <p>{error}</p>
          <button 
            className="error-retry-button"
            onClick={refreshData}
          >
            🔄 다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="mv-layout">
        <LeftPanel 
          showLeftPanel={showLeftPanel}
          currentSlice={currentImageIndex + 1}
          setCurrentSlice={(slice) => setImageIndex && setImageIndex(slice - 1)}
          totalSlices={instances?.length || 0}
          isPlaying={isPlaying || false}
          setIsPlaying={setIsPlaying || (() => {})}
          
          // 환자 데이터
          patientData={patientData}
          workListData={workListData}
          patientInfo={{
            id: patientData?.patientID || patientID || 'N/A',
            name: patientData?.patientName || 'N/A',
            age: patientData?.patientAge || 'N/A',
            gender: patientData?.patientSex || 'N/A',
            studyDate: selectedStudy?.studyDate || 'N/A',
            modality: selectedSeries?.modality || selectedStudy?.modalitiesInStudy || 'N/A'
          }}
          
          // PACS 데이터
          studies={studies || []}
          selectedStudy={selectedStudy}
          series={series || []}
          selectedSeries={selectedSeries}
          onSelectStudy={selectStudy || (() => {})}
          onSelectSeries={selectSeries || (() => {})}
          instances={instances || []}
        />
        
        <ViewerContainer 
          showLeftPanel={showLeftPanel}
          setShowLeftPanel={setShowLeftPanel}
          
          // 🔥 간단한 뷰어 관련
          selectedTool={selectedTool || 'wwwc'}
          setSelectedTool={handleToolChange}
          selectedAIModel={selectedAIModel || 'yolov8'}
          setSelectedAIModel={setSelectedAIModel || (() => {})}
          onRunAIModel={handleRunAIModel}
          
          // 🔥 이미지 변환 관련
          imageTransform={imageTransform}
          getImageStyle={getImageStyle}
          
          // 🔥 마우스 이벤트 핸들러
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          
          // 뷰포트 설정
          viewportSettings={viewportSettings}
          
          // 환자 정보
          patientInfo={{
            id: patientData?.patientID || patientID || 'N/A',
            name: patientData?.patientName || 'N/A',
            age: patientData?.patientAge || 'N/A',
            gender: patientData?.patientSex || 'N/A',
            studyDate: selectedStudy?.studyDate || 'N/A',
            modality: selectedSeries?.modality || selectedStudy?.modalitiesInStudy || 'N/A'
          }}
          
          // 이미지 데이터
          currentSlice={currentImageIndex + 1}
          totalSlices={instances?.length || 0}
          imageIds={instances?.map(instance => instance.previewUrl) || []}
          currentImageUrl={getCurrentImageUrl ? getCurrentImageUrl() : null}
          
          // 네비게이션
          canGoPrev={canGoPrev || false}
          canGoNext={canGoNext || false}
          onPrevImage={goToPrevImage || (() => {})}
          onNextImage={goToNextImage || (() => {})}
          imageInfo={imageInfo || { current: 1, total: 0, displayText: '1 / 0' }}
          
          // 🔥 수정: AI 결과 - 현재 인스턴스 결과 사용 (하위 호환성)
          aiResults={currentInstanceResults || aiResults || {}}
          isAnalyzing={isAnalyzing || false}
          
          // 🔥 측정 도구 결과 - 로컬 측정값만 (Django 어노테이션 제외)
          measurements={combinedMeasurements || []}
          currentMeasurement={currentMeasurement}
          
          // 🔥 편집 관련 props 추가
          editingMeasurement={editingMeasurement}
          isEditMode={isEditMode}
          startEditMode={startEditMode}
          stopEditMode={stopEditMode}
          
          // 🔥 삭제 기능 prop 추가
          onDeleteMeasurement={handleDeleteMeasurement}
          
          // 🔥 라벨링 관련 props 추가
          onAddManualAnnotation={handleAddManualAnnotation}
          onEditManualAnnotation={handleEditManualAnnotation}
          setActiveRightPanel={setActiveRightPanel}
          
          // 🔥 하이라이트 관련 props 추가
          highlightedMeasurementId={highlightedMeasurementId}
          onHighlightMeasurement={handleHighlightMeasurement}
          
          // 🔥 수동 주석 데이터 추가 (라벨 표시용)
          manualAnnotations={manualAnnotations || []}
          
          // 🔥 Django 어노테이션 시스템 연동
          addMeasurementToAnnotations={addMeasurementToAnnotations}
          updateDjangoAnnotation={updateDjangoAnnotation} // 🔥 새로 추가!
          
          // 🔥 Django 어노테이션 데이터 추가 (뷰어 렌더링용) + allMeasurementsHidden 전달
          annotationBoxes={annotationBoxes || []}
          allMeasurementsHidden={allMeasurementsHidden} // 🔥 추가: 전체 숨기기 상태 전달
          
          // 🔥 새로 추가: 이미지 표시 정보 업데이트 콜백
          onImageDisplayInfoChange={handleImageDisplayInfoChange}
        />
        
        <RightPanel 
          activeRightPanel={activeRightPanel}
          setActiveRightPanel={setActiveRightPanel}
          
          // 🔥 수정: AI 데이터 - 기존 + 새로운 구조
          aiResults={aiResults || {}} // 하위 호환성
          onToggleAnnotationVisibility={toggleAnnotationVisibility || (() => {})}
          onDeleteAnnotation={deleteAnnotation || (() => {})}
          
          // 🔥 새로 추가: useAI 훅의 새로운 AI 관련 props
          currentInstanceResults={currentInstanceResults}
          allAIResults={allAIResults}
          analysisStatus={aiAnalysisStatus}
          isAnalyzing={isAnalyzing}
          loadAllAIResults={loadAllAIResults}
          updateCurrentInstanceResults={updateCurrentInstanceResults}
          getStudyStats={getStudyStats}
          getModelStats={getModelStats}
          
          // 🔥 수정: 측정값 분리 전달
          unlabeledMeasurements={getUnlabeledMeasurements()} // 🔥 라벨 없는 측정값 (MeasurementsPanel용)
          labeledMeasurements={getLabeledMeasurements()} // 🔥 라벨 있는 측정값 (ManualAnnotationsPanel용)
          manualAnnotations={getFilteredManualAnnotations()} // 🔥 필터링된 주석만 전달
          selectedMeasurement={selectedMeasurement}
          setSelectedMeasurement={setSelectedMeasurement || (() => {})}
          onDeleteMeasurement={handleDeleteMeasurement}
          onClearAllMeasurements={handleClearAllMeasurements}
          onAddManualAnnotation={handleAddManualAnnotation}
          onDeleteManualAnnotation={deleteManualAnnotation || (() => {})}
          onEditManualAnnotation={handleEditManualAnnotation}
          onToggleMeasurementVisibility={handleToggleMeasurementVisibility}
          onExportMeasurements={exportMeasurements || (() => {})}
          getMeasurementStats={getMeasurementStats || (() => ({}))}
          
          // 🔥 모든 측정값 숨기기/표시하기 기능 추가
          onToggleAllMeasurements={handleToggleAllMeasurements}
          allMeasurementsHidden={allMeasurementsHidden}
          
          // 🔥 편집 관련 함수 추가
          onStartEditMode={startEditMode}
          onStopEditMode={stopEditMode}
          isEditMode={isEditMode}
          editingMeasurement={editingMeasurement}
          
          // 🔥 하이라이트 관련 함수
          onHighlightMeasurement={handleHighlightMeasurement}
          
          // 🔥 Django API 연동용 props
          currentStudyUID={currentStudyUID}
          currentInstanceUID={currentInstanceUID}
          currentInstanceNumber={currentInstanceNumber}
          setAnalysisStatus={setAnalysisStatus}
          setActiveLayer={setActiveLayer}
          
          // 🔥 Django 어노테이션 함수들과 데이터 전달
          addMeasurementToAnnotations={addMeasurementToAnnotations}
          saveAnnotationsToServer={saveAnnotationsToServer}
          loadAnnotationsFromServer={loadAnnotationsFromServer}
          clearAllAnnotations={clearAllAnnotations}
          updateDjangoAnnotation={updateDjangoAnnotation} // 🔥 새로 추가!
          annotationBoxes={annotationBoxes} // 🔥 핵심: 생성된 어노테이션 데이터
          
          // 🔥 레포트 관련 props 추가
          reports={reports}
          showReportModal={showReportModal}
          setShowReportModal={setShowReportModal}
          patientInfo={getPatientInfoForReports()}
          
          // 기타
          instances={instances || []}
          currentImageIndex={currentImageIndex || 0}
          onImageSelect={setImageIndex || (() => {})}
        />
        
        {/* 🔥 레포트 모달 추가 */}
        {showReportModal && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onSave={reports.saveReportToServer}
            
            // 환자 및 Study 정보
            patientInfo={getPatientInfoForReports()}
            currentStudyUID={currentStudyUID}
            currentInstanceUID={currentInstanceUID}
            currentInstanceNumber={currentInstanceNumber}
            
            // AI 결과 및 어노테이션 데이터
            allAIResults={allAIResults}
            currentInstanceResults={currentInstanceResults}
            annotationBoxes={annotationBoxes}
            instances={instances}
            
            // 슬라이스 이동 함수
            onGoToInstance={setImageIndex}
            
            // 초기 레포트 내용 (편집 시)
            initialContent={reports.reportContent || ''}
            initialStatus={reports.reportStatus || 'draft'}
          />
        )}
        
        {/* 🔥 상태 표시 바 추가 (개발용) */}
        {(analysisStatus || aiAnalysisStatus) && (
          <div className="mv-status-bar">
            <span className="mv-status-text">{analysisStatus || aiAnalysisStatus}</span>
            <button 
              className="mv-status-close"
              onClick={() => {
                setAnalysisStatus('');
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
    );
  };

  export default Layout;