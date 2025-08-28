// // /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/ManualAnnotationsPanel.js

// import React, { useEffect, useState } from 'react';
// import { Edit, X, Trash2, Eye, EyeOff, Target, RefreshCw, Save } from 'lucide-react';
// import LabelingEditModal from '../Common/LabelingEditModal';
// import { deleteAnnotation } from '../../../utils/viewer_v2/api';
// import './ManualAnnotationsPanel.css';

// const ManualAnnotationsPanel = ({ 
//   // 인스턴스 정보
//   currentStudyUID,
//   currentInstanceUID, 
//   currentInstanceNumber,
  
//   // Layout에서 전달받는 측정값 데이터
//   measurements = [],
//   selectedMeasurement,
//   setSelectedMeasurement,
  
//   // 기존 props
//   manualAnnotations = [],
//   onAddManualAnnotation,
//   onDeleteManualAnnotation,
//   onEditManualAnnotation,
//   onToggleMeasurementVisibility,
//   onToggleAllMeasurements,
//   allMeasurementsHidden,
//   onHighlightMeasurement,
  
//   // 편집 관련 props
//   onStartEditMode,
//   onStopEditMode,
//   isEditMode,
//   editingMeasurement,
  
//   // 상태 관리 함수들
//   setAnalysisStatus,
//   setActiveLayer,
  
//   // Layout에서 전달받는 Django 어노테이션 함수들
//   addMeasurementToAnnotations,
//   saveAnnotationsToServer,
//   loadAnnotationsFromServer,
//   clearAllAnnotations,
//   annotationBoxes = [],
  
//   // 측정값 삭제 함수
//   onDeleteMeasurement
// }) => {

//   // 로딩 상태 관리
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastLoadedInstance, setLastLoadedInstance] = useState(null);

//   // 라벨 편집 모달 상태
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [selectedAnnotationForEdit, setSelectedAnnotationForEdit] = useState(null);

//   // 🔥 추가: Django 어노테이션만 숨기기 상태 (AI 결과 제외)
//   const [allDjangoAnnotationsHidden, setAllDjangoAnnotationsHidden] = useState(false);

//   // 인스턴스 변경시 자동으로 어노테이션 로드
//   useEffect(() => {
//     if (currentStudyUID && currentInstanceUID && 
//         currentInstanceUID !== lastLoadedInstance && loadAnnotationsFromServer) {
//       console.log('🔄 ManualAnnotationsPanel - 인스턴스 변경 감지:', {
//         studyUID: currentStudyUID,
//         instanceUID: currentInstanceUID,
//         instanceNumber: currentInstanceNumber
//       });
      
//       setIsLoading(true);
//       loadAnnotationsFromServer()
//         .finally(() => {
//           setIsLoading(false);
//           setLastLoadedInstance(currentInstanceUID);
//         });
//     }
//   }, [currentStudyUID, currentInstanceUID, currentInstanceNumber, loadAnnotationsFromServer, lastLoadedInstance]);

//   // Layout에서 전달받은 annotationBoxes를 ManualAnnotationsPanel 형태로 변환 (라벨 있는 것만)
//   const convertedAnnotations = React.useMemo(() => {
//     if (!annotationBoxes || !Array.isArray(annotationBoxes)) {
//       return [];
//     }

//     // 🔥 수정: 라벨이 있는 것만 변환
//     const filtered = annotationBoxes.filter(annotation => 
//       annotation.label && annotation.label.trim() !== ''
//     );

//     console.log('🏷️ Django 어노테이션 라벨 필터링:', {
//       전체: annotationBoxes.length,
//       라벨있음: filtered.length,
//       라벨목록: filtered.map(a => a.label)
//     });

//     return filtered.map((annotation, index) => {
//       let coords = 'N/A';
//       let value = 'N/A';
      
//       if (annotation.coordinates && Array.isArray(annotation.coordinates)) {
//         switch (annotation.shape_type) {
//           case 'rectangle':
//             coords = `x:${annotation.coordinates[0]?.toFixed(0)}, y:${annotation.coordinates[1]?.toFixed(0)}, w:${annotation.coordinates[2]?.toFixed(0)}, h:${annotation.coordinates[3]?.toFixed(0)}`;
//             value = `${(annotation.coordinates[2] * annotation.coordinates[3]).toFixed(1)} mm²`;
//             break;
//           case 'circle':
//             coords = `x:${annotation.coordinates[0]?.toFixed(0)}, y:${annotation.coordinates[1]?.toFixed(0)}, r:${annotation.coordinates[2]?.toFixed(0)}`;
//             value = `${(Math.PI * annotation.coordinates[2] * annotation.coordinates[2]).toFixed(1)} mm²`;
//             break;
//           case 'line':
//             coords = `시작: (${annotation.coordinates[0]?.toFixed(0)}, ${annotation.coordinates[1]?.toFixed(0)}), 끝: (${annotation.coordinates[2]?.toFixed(0)}, ${annotation.coordinates[3]?.toFixed(0)})`;
//             const length = Math.sqrt(
//               Math.pow(annotation.coordinates[2] - annotation.coordinates[0], 2) + 
//               Math.pow(annotation.coordinates[3] - annotation.coordinates[1], 2)
//             );
//             value = `${length.toFixed(1)} mm`;
//             break;
//         }
//       } else if (annotation.left !== undefined && annotation.top !== undefined) {
//         coords = `x:${annotation.left?.toFixed(0)}, y:${annotation.top?.toFixed(0)}, w:${annotation.width?.toFixed(0)}, h:${annotation.height?.toFixed(0)}`;
//         value = `${(annotation.width * annotation.height).toFixed(1)} mm²`;
//       }

//       return {
//         id: annotation.id,
//         type: annotation.shape_type || 'rectangle',
//         value: value,
//         slice: currentInstanceNumber || 1,
//         coords: coords,
//         label: annotation.label || '',
//         doctor: annotation.doctor_name || '미지정',
//         memo: annotation.memo || '',
//         timestamp: annotation.created,
//         visible: true,
//         measurementId: annotation.measurementId || `django-${annotation.id}`,
//         _original: annotation
//       };
//     });
//   }, [annotationBoxes, currentInstanceNumber]);

//   // 🔥 수정: Django 어노테이션만 표시 (로컬 측정값 제외)
//   const allAnnotations = React.useMemo(() => {
//     // 🔥 Django 어노테이션만 가져오기
//     const djangoAnnotations = convertedAnnotations.map(ann => ({ 
//         ...ann, 
//         source: 'django',
//         id: `django-${ann.id}` // 고유 ID 보장
//     }));
    
//     console.log('🏷️ Django 어노테이션만 표시:', {
//         Django어노테이션: djangoAnnotations.length,
//         최종합계: djangoAnnotations.length
//     });

//     return djangoAnnotations; // 🔥 Django 어노테이션만 반환
//   }, [convertedAnnotations]);

//   // 🔥 수정: Django 어노테이션만 숨기는 토글 함수 (AI 결과는 그대로)
//   const handleToggleAllDjangoAnnotations = () => {
//     console.log('👁️‍🗨️ Django 어노테이션만 표시/숨김 토글 - 현재상태:', allDjangoAnnotationsHidden);
    
//     const newHiddenState = !allDjangoAnnotationsHidden;
//     setAllDjangoAnnotationsHidden(newHiddenState);
    
//     // Django 어노테이션들만 개별적으로 토글
//     allAnnotations.forEach(annotation => {
//       if (annotation.source === 'django' && annotation.measurementId) {
//         // 각 Django 어노테이션의 measurementId로 개별 토글
//         const measurementId = annotation.measurementId || `django-${annotation.id.replace('django-', '')}`;
//         console.log(`🔄 Django 어노테이션 개별 토글: ${measurementId}`);
        
//         if (onToggleMeasurementVisibility) {
//           onToggleMeasurementVisibility(measurementId);
//         }
//       }
//     });
    
//     console.log(`✅ Django 어노테이션만 ${newHiddenState ? '숨김' : '표시'} 완료 (AI 결과는 그대로)`);
//   };

//   // 새로고침 핸들러
//   const handleRefresh = async () => {
//     if (!currentStudyUID) {
//       if (setAnalysisStatus) {
//         setAnalysisStatus('Study UID가 없습니다');
//       }
//       return;
//     }
    
//     if (!loadAnnotationsFromServer) {
//       if (setAnalysisStatus) {
//         setAnalysisStatus('로드 함수가 없습니다');
//       }
//       return;
//     }
    
//     setIsLoading(true);
//     try {
//       await loadAnnotationsFromServer();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // 저장 핸들러
//   const handleSave = async () => {
//     if (!annotationBoxes || annotationBoxes.length === 0) {
//       if (setAnalysisStatus) {
//         setAnalysisStatus('저장할 어노테이션이 없습니다');
//       }
//       return;
//     }

//     if (!saveAnnotationsToServer) {
//       if (setAnalysisStatus) {
//         setAnalysisStatus('저장 함수가 없습니다');
//       }
//       return;
//     }
    
//     setIsLoading(true);
//     try {
//       await saveAnnotationsToServer();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // 전체 삭제 핸들러
//   const handleClearAll = async () => {
//     if (allAnnotations.length === 0) {
//       if (setAnalysisStatus) {
//         setAnalysisStatus('삭제할 어노테이션이 없습니다');
//       }
//       return;
//     }

//     if (!clearAllAnnotations) {
//       if (setAnalysisStatus) {
//         setAnalysisStatus('삭제 함수가 없습니다');
//       }
//       return;
//     }
    
//     setIsLoading(true);
//     try {
//       await clearAllAnnotations();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // 개별 삭제 핸들러
//   const handleDelete = async (annotationId, event) => {
//     event.stopPropagation();
    
//     const annotation = allAnnotations.find(ann => ann.id === annotationId);
//     if (!annotation) return;
    
//     if (window.confirm(`"${annotation.label}" 어노테이션을 삭제하시겠습니까?`)) {
//       try {
//         setIsLoading(true);
        
//         if (annotation.source === 'django' || (annotation._original && annotation._original.id)) {
//           const djangoId = annotation._original?.id || annotation.id;
          
//           try {
//             await deleteAnnotation(djangoId);
//             setTimeout(() => {
//               handleRefresh();
//             }, 500);
//           } catch (error) {
//             console.error('❌ Django 서버 삭제 실패:', error);
//             if (setAnalysisStatus) {
//               setAnalysisStatus('❌ 서버 삭제 실패: ' + error.message);
//             }
//             return;
//           }
//         } 
//         else if (annotation.source === 'local' || (annotation.measurementId && !annotation.measurementId.startsWith('annotation-'))) {
//           if (onDeleteMeasurement) {
//             onDeleteMeasurement(annotation.measurementId);
//           }
          
//           if (onDeleteManualAnnotation) {
//             onDeleteManualAnnotation(annotationId);
//           }
//         } 
//         else {
//           if (onDeleteManualAnnotation) {
//             onDeleteManualAnnotation(annotationId);
//           }
//         }
        
//       } catch (error) {
//         console.error('❌ 어노테이션 삭제 실패:', error);
//         if (setAnalysisStatus) {
//           setAnalysisStatus('❌ 삭제 실패: ' + error.message);
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   // 라벨 편집 핸들러
//   const handleEdit = (annotation, event) => {
//     event.stopPropagation();
//     setSelectedAnnotationForEdit(annotation);
//     setIsEditModalOpen(true);
//   };

//   // 라벨 편집 저장 핸들러
//   const handleSaveLabelEdit = (updatedAnnotation) => {
//     if (onEditManualAnnotation) {
//       onEditManualAnnotation(updatedAnnotation);
//     }
    
//     setIsEditModalOpen(false);
//     setSelectedAnnotationForEdit(null);
//   };

//   // 라벨 편집 모달 닫기
//   const handleCloseLabelEdit = () => {
//     setIsEditModalOpen(false);
//     setSelectedAnnotationForEdit(null);
//   };

//   // 🔥 수정: 개별 표시/숨김 토글 - Django 어노테이션 지원 + 디버깅
//   const handleToggleVisibility = (annotationId, event) => {
//     event.stopPropagation();
    
//     const annotation = allAnnotations.find(ann => ann.id === annotationId);
//     if (!annotation) {
//       console.error('❌ annotation을 찾을 수 없음:', annotationId);
//       return;
//     }
    
//     console.log('👁️ 개별 어노테이션 표시/숨김 토글 시작:', {
//       annotationId,
//       measurementId: annotation.measurementId,
//       source: annotation.source,
//       currentVisible: isVisibleInViewer(annotation)
//     });
    
//     // 🔥 Django 어노테이션인 경우
//     if (annotation.source === 'django') {
//       // measurementId 형태로 변환하여 토글
//       const measurementId = annotation.measurementId || `django-${annotation.id.replace('django-', '')}`;
//       console.log('🔄 Django 어노테이션 측정값 ID로 토글:', measurementId);
      
//       // 🔥 토글 전 measurements에서 현재 상태 확인
//       const currentMeasurement = measurements.find(m => m.id === measurementId);
//       console.log('📊 토글 전 측정값 상태:', currentMeasurement);
      
//       if (onToggleMeasurementVisibility) {
//         console.log('🔄 onToggleMeasurementVisibility 호출:', measurementId);
//         onToggleMeasurementVisibility(measurementId);
        
//         // 🔥 토글 후 상태 확인 (디버깅용)
//         setTimeout(() => {
//           const afterMeasurement = measurements.find(m => m.id === measurementId);
//           console.log('📊 토글 후 측정값 상태:', afterMeasurement);
//         }, 100);
//       } else {
//         console.error('❌ onToggleMeasurementVisibility 함수가 없음!');
//       }
//     } else {
//       // 일반 측정값의 경우
//       if (annotation.measurementId && onToggleMeasurementVisibility) {
//         console.log('🔄 일반 측정값 토글:', annotation.measurementId);
//         onToggleMeasurementVisibility(annotation.measurementId);
//       }
//     }
//   };

//   const handleAnnotationClick = (annotation) => {
//     if (setSelectedMeasurement) {
//       setSelectedMeasurement(annotation);
//     }
    
//     if (onHighlightMeasurement && annotation.measurementId) {
//       onHighlightMeasurement(annotation.measurementId);
//     }
//   };

//   // 유틸리티 함수들
//   const getTypeIcon = (type) => {
//     switch (type) {
//       case 'length': return '📏';
//       case 'rectangle': return '📦';
//       case 'circle': return '⭕';
//       case 'line': return '📏';
//       default: return '📏';
//     }
//   };

//   const getTypeName = (type) => {
//     switch (type) {
//       case 'length': return '길이 측정';
//       case 'rectangle': return '사각형 ROI';
//       case 'circle': return '원형 ROI';
//       case 'line': return '길이 측정';
//       default: return '측정';
//     }
//   };

//   const formatTimestamp = (timestamp) => {
//     if (!timestamp) return '';
//     const date = new Date(timestamp);
//     return date.toLocaleDateString('ko-KR', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const isSelected = (annotation) => {
//     return selectedMeasurement?.id === annotation.id || 
//            selectedMeasurement?.measurementId === annotation.measurementId;
//   };

//   const isAnnotationEditing = (annotation) => {
//     return isEditMode && editingMeasurement?.id === annotation.measurementId;
//   };

//   const getAnnotationNumber = (index) => {
//     return `#${String(index + 1).padStart(3, '0')}`;
//   };

//   // 🔥 수정: 카드 필터링 - Django 어노테이션 전용 숨기기 상태 사용
//   const visibleAnnotations = allAnnotations.filter(annotation => {
//     // Django 어노테이션 전용 숨기기가 활성화되면 모두 숨김
//     if (allDjangoAnnotationsHidden) return false;
    
//     // 🔥 중요: 개별 숨기기는 카드 표시에 영향 안 줌!
//     return true; // 카드는 항상 표시
//   });

//   // 🔥 수정: 뷰어에서의 실제 표시 상태 확인 - Django 전용 상태 사용 + 디버깅
//   const isVisibleInViewer = (annotation) => {
//     console.log('👁️ isVisibleInViewer 체크:', {
//       annotationId: annotation.id,
//       measurementId: annotation.measurementId,
//       source: annotation.source,
//       allDjangoAnnotationsHidden,
//       measurements: measurements.length
//     });

//     // Django 어노테이션 전용 숨기기 상태 확인
//     if (allDjangoAnnotationsHidden) {
//       console.log('📴 Django 전용 숨기기 활성화 → false');
//       return false;
//     }
    
//     // Django 어노테이션의 경우
//     if (annotation.source === 'django' && annotation.measurementId) {
//       // measurements 배열에서 해당 measurementId 찾기
//       const correspondingMeasurement = measurements.find(m => {
//         const isMatch = m.id === annotation.measurementId;
//         console.log(`🔍 측정값 비교: ${m.id} === ${annotation.measurementId} → ${isMatch}`);
//         return isMatch;
//       });
      
//       if (correspondingMeasurement) {
//         const isVisible = correspondingMeasurement.visible !== false;
//         console.log(`✅ measurements에서 찾음: visible=${correspondingMeasurement.visible} → ${isVisible}`);
//         return isVisible;
//       } else {
//         console.log(`⚠️ measurements에서 못 찾음: ${annotation.measurementId}`);
//         console.log('📊 전체 measurements IDs:', measurements.map(m => m.id));
        
//         // measurements에 없으면 annotation 자체의 visible 상태 확인
//         const fallbackVisible = annotation.visible !== false;
//         console.log(`🔄 fallback visible: ${annotation.visible} → ${fallbackVisible}`);
//         return fallbackVisible;
//       }
//     }
    
//     // Layout에서 온 측정값의 경우
//     if (annotation.source === 'local') {
//       const isVisible = annotation.visible !== false;
//       console.log(`🏠 로컬 측정값: ${annotation.visible} → ${isVisible}`);
//       return isVisible;
//     }
    
//     // 기본값
//     console.log('🔧 기본값 사용 → true');
//     return true;
//   };

//   // 🔥 추가: measurements 배열 변화 감지 (디버깅용)
//   React.useEffect(() => {
//     console.log('📊 measurements 배열 변화 감지:', {
//       길이: measurements.length,
//       Django어노테이션들: measurements.filter(m => m.id?.startsWith('django-')),
//       모든IDs: measurements.map(m => ({ id: m.id, visible: m.visible, source: m.source }))
//     });
//   }, [measurements]);

//   // 🔥 추가: allDjangoAnnotationsHidden 상태 변화 감지 (디버깅용)
//   React.useEffect(() => {
//     console.log('📴 allDjangoAnnotationsHidden 상태 변화:', allDjangoAnnotationsHidden);
//   }, [allDjangoAnnotationsHidden]);

//   return (
//     <div className="mv-manual-panel-content">
//       {/* 인스턴스 정보 표시 */}
//       {currentStudyUID && currentInstanceUID && (
//         <div className="mv-manual-instance-info">
//           <div className="mv-instance-header">
//             <span className="mv-instance-label">현재 슬라이스:</span>
//             <span className="mv-instance-value">#{currentInstanceNumber || '?'}</span>
//           </div>
//           <div className="mv-instance-uid">
//             Instance: {currentInstanceUID.slice(-8)}...
//           </div>
//         </div>
//       )}

//       {/* 헤더 - 통계 + 컨트롤 */}
//       <div className="mv-manual-annotations-header">
//         <div className="mv-manual-annotations-stats">
//           <span className="mv-manual-stats-label">라벨있는 어노테이션:</span>
//           <span className="mv-manual-stats-value">{allAnnotations.length}개</span>
          
//           {isLoading && (
//             <span className="mv-manual-stats-loading">
//               <RefreshCw size={12} className="mv-spinning" />
//             </span>
//           )}
          
//           {/* 🔥 수정: Django 전용 상태 표시 */}
//           <span className="mv-manual-stats-status">
//             {allDjangoAnnotationsHidden ? '(숨김)' : '(표시)'}
//           </span>
//         </div>
        
//         <div className="mv-manual-header-controls">
//           {/* 새로고침 버튼 */}
//           <button 
//             className="mv-manual-refresh-btn"
//             onClick={handleRefresh}
//             disabled={isLoading || !currentStudyUID || !loadAnnotationsFromServer}
//             title="어노테이션 새로고침"
//           >
//             <RefreshCw size={14} className={isLoading ? 'mv-spinning' : ''} />
//           </button>

//           {/* 저장 버튼 */}
//           <button 
//             className="mv-manual-save-btn"
//             onClick={handleSave}
//             disabled={isLoading || !saveAnnotationsToServer}
//             title="어노테이션 저장"
//           >
//             <Save size={14} />
//           </button>

//           {/* 🔥 수정: Django 전용 표시/숨김 토글 버튼 */}
//           <button 
//             className={`mv-manual-toggle-all-btn ${!allDjangoAnnotationsHidden ? 'visible' : 'hidden'}`}
//             onClick={handleToggleAllDjangoAnnotations}
//             title={!allDjangoAnnotationsHidden ? '모든 라벨 숨기기' : '모든 라벨 보이기'}
//           >
//             {!allDjangoAnnotationsHidden ? <Eye size={16} /> : <EyeOff size={16} />}
//             <span>{!allDjangoAnnotationsHidden ? '라벨 숨기기' : '라벨 보이기'}</span>
//           </button>
          
//           {/* 편집 모드 종료 버튼 */}
//           {isEditMode && (
//             <button 
//               className="mv-manual-exit-edit-btn"
//               onClick={() => {
//                 if (onStopEditMode) {
//                   onStopEditMode();
//                 }
//               }}
//               title="편집 완료"
//             >
//               편집 완료
//             </button>
//           )}
//         </div>
//       </div>

//       {/* 로딩 오버레이 */}
//       {isLoading && (
//         <div className="mv-manual-loading">
//           <RefreshCw size={24} className="mv-spinning" />
//           <span>어노테이션 로딩 중...</span>
//         </div>
//       )}

//       {/* 🔥 수정: Django 전용 숨김 상태 메시지 */}
//       {allDjangoAnnotationsHidden && allAnnotations.length > 0 && (
//         <div className="mv-manual-hidden-notice">
//           👁️‍🗨️ 모든 라벨이 숨겨져 있습니다. "라벨 보이기" 버튼을 클릭하세요.
//         </div>
//       )}

//       {/* 카드형 주석 목록 */}
//       {visibleAnnotations.map((annotation, index) => (
//         <div 
//           key={annotation.id} 
//           className={`mv-manual-card ${isSelected(annotation) ? 'selected' : ''} ${isAnnotationEditing(annotation) ? 'editing' : ''}`}
//           data-type={annotation.type}
//           onClick={() => handleAnnotationClick(annotation)}
//         >
//           {/* 카드 헤더 */}
//           <div className="mv-card-header">
//             <div className="mv-card-title">
//               {getTypeIcon(annotation.type)} {getTypeName(annotation.type)}
//               {annotation.source && (
//                 <span className="mv-card-source">({annotation.source})</span>
//               )}
//             </div>
//             <div className="mv-card-number">
//               {getAnnotationNumber(index)}
//             </div>
//           </div>
          
//           {/* 카드 구분선 */}
//           <div className="mv-card-divider"></div>
          
//           {/* 카드 본문 */}
//           <div className="mv-card-body">
//             {/* 측정값과 슬라이스 */}
//             <div className="mv-card-info-line">
//               <span className="mv-card-value">
//                 {annotation.type === 'rectangle' && '면적: '}
//                 {annotation.type === 'circle' && '면적: '}
//                 {(annotation.type === 'length' || annotation.type === 'line') && '길이: '}
//                 {annotation.value || 'N/A'}
//               </span>
//               <span className="mv-card-separator">|</span>
//               <span className="mv-card-slice">슬라이스: {annotation.slice}</span>
//             </div>
            
//             {/* 좌표 정보 */}
//             <div className="mv-card-coords">
//               좌표: {annotation.coords}
//             </div>
            
//             {/* 공백 줄 */}
//             <div className="mv-card-spacer"></div>
            
//             {/* 라벨과 판독의 */}
//             <div className="mv-card-label-line">
//               <span className="mv-card-label">
//                 🏷️ 라벨: "{annotation.label || 'N/A'}"
//               </span>
//               <span className="mv-card-doctor">
//                 👨‍⚕️ {annotation.doctor || '미지정'}
//               </span>
//             </div>
            
//             {/* 메모 */}
//             {annotation.memo && (
//               <div className="mv-card-memo">
//                 💭 메모: {annotation.memo}
//               </div>
//             )}
            
//             {/* 시간 정보 */}
//             <div className="mv-card-time-line">
//               {annotation.timestamp && (
//                 <span className="mv-card-created">
//                   📅 생성: {formatTimestamp(annotation.timestamp)}
//                 </span>
//               )}
//             </div>
            
//             {/* 편집 중 표시 */}
//             {isAnnotationEditing(annotation) && (
//               <div className="mv-card-editing-indicator">
//                 ✏️ 편집 중
//               </div>
//             )}
//           </div>
          
//           {/* 🔥 수정: 카드 컨트롤 버튼들 */}
//           <div className="mv-card-controls">
//             {/* 🔥 수정: 뷰어에서의 실제 표시 상태를 반영하는 눈 아이콘 */}
//             <button 
//               className={`mv-card-visibility-btn ${isVisibleInViewer(annotation) ? 'visible' : 'hidden'}`}
//               onClick={(e) => handleToggleVisibility(annotation.id, e)}
//               title={isVisibleInViewer(annotation) ? '뷰어에서 숨기기' : '뷰어에서 보이기'}
//             >
//               {isVisibleInViewer(annotation) ? <Eye size={14} /> : <EyeOff size={14} />}
//             </button>
            
//             {/* 라벨 편집 버튼 */}
//             <button 
//               className="mv-card-edit-btn"
//               onClick={(e) => handleEdit(annotation, e)}
//               title="라벨 편집"
//             >
//               <Edit size={14} />
//             </button>
            
//             {/* 삭제 버튼 */}
//             <button 
//               className="mv-card-delete-btn"
//               onClick={(e) => handleDelete(annotation.id, e)}
//               title="삭제"
//               disabled={isLoading}
//             >
//               <X size={14} />
//             </button>
//           </div>
//         </div>
//       ))}
      
//       {/* Empty State */}
//       {allAnnotations.length === 0 && !isLoading && (
//         <div className="mv-manual-empty-state">
//           <Edit size={48} className="mv-manual-empty-icon" />
//           <p>라벨이 있는 수동 주석 없음</p>
//           <p className="mv-manual-empty-subtitle">
//             {currentStudyUID ? 
//               `측정값에 라벨을 추가해주세요` :
//               '인스턴스를 선택해주세요'
//             }
//           </p>
//           {currentStudyUID && (
//             <button 
//               className="mv-manual-refresh-empty-btn"
//               onClick={handleRefresh}
//               disabled={isLoading || !loadAnnotationsFromServer}
//             >
//               <RefreshCw size={16} />
//               새로고침
//             </button>
//           )}
//         </div>
//       )}

//       {/* 통계 요약 (하단) */}
//       {allAnnotations.length > 0 && (
//         <div className="mv-manual-annotations-summary">
//           <div className="mv-manual-summary-title">📊 라벨 통계</div>
//           <div className="mv-manual-summary-stats">
//             {/* 타입별 개수 */}
//             {Object.entries(
//               allAnnotations.reduce((acc, annotation) => {
//                 acc[annotation.type] = (acc[annotation.type] || 0) + 1;
//                 return acc;
//               }, {})
//             ).map(([type, count]) => (
//               <div key={type} className="mv-manual-summary-item">
//                 {getTypeIcon(type)} {getTypeName(type)}: {count}개
//               </div>
//             ))}
            
//             {/* 편집 상태 표시 */}
//             {isEditMode && (
//               <div className="mv-manual-summary-item mv-edit-status">
//                 ✏️ 편집 모드 활성화
//               </div>
//             )}
            
//             {/* 🔥 수정: Django 전용 숨김 상태 표시 */}
//             {allDjangoAnnotationsHidden && (
//               <div className="mv-manual-summary-item mv-hidden-status">
//                 👁️‍🗨️ 라벨 전체 숨김 상태
//               </div>
//             )}
            
//             {/* 인스턴스 정보 */}
//             <div className="mv-manual-summary-item">
//               📊 슬라이스 #{currentInstanceNumber || '?'}
//             </div>
            
//             {/* 전체 삭제 버튼 */}
//             {allAnnotations.length > 0 && (
//               <button 
//                 className="mv-manual-clear-all-btn"
//                 onClick={handleClearAll}
//                 disabled={isLoading || !clearAllAnnotations}
//                 title="현재 슬라이스의 모든 어노테이션 삭제"
//               >
//                 <Trash2 size={14} />
//                 전체 삭제
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* 라벨 편집 모달 */}
//       <LabelingEditModal
//         isOpen={isEditModalOpen}
//         onClose={handleCloseLabelEdit}
//         onSave={handleSaveLabelEdit}
//         annotation={selectedAnnotationForEdit}
//         measurementId={selectedAnnotationForEdit?.measurementId}
//         debugInfo={{
//           panel: 'ManualAnnotationsPanel',
//           annotationsCount: allAnnotations.length,
//           selectedId: selectedAnnotationForEdit?.id,
//           source: selectedAnnotationForEdit?.source
//         }}
//       />
//     </div>
//   );
// };

// export default ManualAnnotationsPanel;

// /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/ManualAnnotationsPanel.js

import React, { useEffect, useState } from 'react';
import { Edit, X, Trash2, Eye, EyeOff, Target, RefreshCw, Save } from 'lucide-react';
import LabelingEditModal from '../Common/LabelingEditModal';
import { deleteAnnotation } from '../../../utils/viewer_v2/api';
import './ManualAnnotationsPanel.css';

const ManualAnnotationsPanel = ({ 
  // 인스턴스 정보
  currentStudyUID,
  currentInstanceUID, 
  currentInstanceNumber,
  
  // Layout에서 전달받는 측정값 데이터
  measurements = [],
  selectedMeasurement,
  setSelectedMeasurement,
  
  // 기존 props
  manualAnnotations = [],
  onAddManualAnnotation,
  onDeleteManualAnnotation,
  onEditManualAnnotation,
  onToggleMeasurementVisibility,
  onToggleAllMeasurements,
  allMeasurementsHidden,
  onHighlightMeasurement,
  
  // 편집 관련 props
  onStartEditMode,
  onStopEditMode,
  isEditMode,
  editingMeasurement,
  
  // 상태 관리 함수들
  setAnalysisStatus,
  setActiveLayer,
  
  // Layout에서 전달받는 Django 어노테이션 함수들
  addMeasurementToAnnotations,
  saveAnnotationsToServer,
  loadAnnotationsFromServer,
  clearAllAnnotations,
  annotationBoxes = [],
  
  // 측정값 삭제 함수
  onDeleteMeasurement
}) => {

  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadedInstance, setLastLoadedInstance] = useState(null);

  // 라벨 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAnnotationForEdit, setSelectedAnnotationForEdit] = useState(null);

  // 🔥 추가: Django 어노테이션만 숨기기 상태 (AI 결과 제외)
  const [allDjangoAnnotationsHidden, setAllDjangoAnnotationsHidden] = useState(false);

  // 인스턴스 변경시 자동으로 어노테이션 로드
  useEffect(() => {
    if (currentStudyUID && currentInstanceUID && 
        currentInstanceUID !== lastLoadedInstance && loadAnnotationsFromServer) {
      console.log('🔄 ManualAnnotationsPanel - 인스턴스 변경 감지:', {
        studyUID: currentStudyUID,
        instanceUID: currentInstanceUID,
        instanceNumber: currentInstanceNumber
      });
      
      setIsLoading(true);
      loadAnnotationsFromServer()
        .finally(() => {
          setIsLoading(false);
          setLastLoadedInstance(currentInstanceUID);
        });
    }
  }, [currentStudyUID, currentInstanceUID, currentInstanceNumber, loadAnnotationsFromServer, lastLoadedInstance]);

  // Layout에서 전달받은 annotationBoxes를 ManualAnnotationsPanel 형태로 변환 (라벨 있는 것만)
  const convertedAnnotations = React.useMemo(() => {
    if (!annotationBoxes || !Array.isArray(annotationBoxes)) {
      return [];
    }

    // 🔥 수정: 라벨이 있는 것만 변환
    const filtered = annotationBoxes.filter(annotation => 
      annotation.label && annotation.label.trim() !== ''
    );

    console.log('🏷️ Django 어노테이션 라벨 필터링:', {
      전체: annotationBoxes.length,
      라벨있음: filtered.length,
      라벨목록: filtered.map(a => a.label)
    });

    return filtered.map((annotation, index) => {
      let coords = 'N/A';
      let value = 'N/A';
      
      if (annotation.coordinates && Array.isArray(annotation.coordinates)) {
        switch (annotation.shape_type) {
          case 'rectangle':
            coords = `x:${annotation.coordinates[0]?.toFixed(0)}, y:${annotation.coordinates[1]?.toFixed(0)}, w:${annotation.coordinates[2]?.toFixed(0)}, h:${annotation.coordinates[3]?.toFixed(0)}`;
            value = `${(annotation.coordinates[2] * annotation.coordinates[3]).toFixed(1)} mm²`;
            break;
          case 'circle':
            coords = `x:${annotation.coordinates[0]?.toFixed(0)}, y:${annotation.coordinates[1]?.toFixed(0)}, r:${annotation.coordinates[2]?.toFixed(0)}`;
            value = `${(Math.PI * annotation.coordinates[2] * annotation.coordinates[2]).toFixed(1)} mm²`;
            break;
          case 'line':
            coords = `시작: (${annotation.coordinates[0]?.toFixed(0)}, ${annotation.coordinates[1]?.toFixed(0)}), 끝: (${annotation.coordinates[2]?.toFixed(0)}, ${annotation.coordinates[3]?.toFixed(0)})`;
            const length = Math.sqrt(
              Math.pow(annotation.coordinates[2] - annotation.coordinates[0], 2) + 
              Math.pow(annotation.coordinates[3] - annotation.coordinates[1], 2)
            );
            value = `${length.toFixed(1)} mm`;
            break;
        }
      } else if (annotation.left !== undefined && annotation.top !== undefined) {
        coords = `x:${annotation.left?.toFixed(0)}, y:${annotation.top?.toFixed(0)}, w:${annotation.width?.toFixed(0)}, h:${annotation.height?.toFixed(0)}`;
        value = `${(annotation.width * annotation.height).toFixed(1)} mm²`;
      }

      return {
        id: annotation.id,
        type: annotation.shape_type || 'rectangle',
        value: value,
        slice: currentInstanceNumber || 1,
        coords: coords,
        label: annotation.label || '',
        doctor: annotation.doctor_name || '미지정',
        memo: annotation.memo || '',
        timestamp: annotation.created,
        visible: true,
        measurementId: annotation.measurementId || `django-${annotation.id}`,
        _original: annotation
      };
    });
  }, [annotationBoxes, currentInstanceNumber]);

  // 🔥 수정: Django 어노테이션만 표시 (로컬 측정값 제외)
  const allAnnotations = React.useMemo(() => {
    // 🔥 Django 어노테이션만 가져오기
    const djangoAnnotations = convertedAnnotations.map(ann => ({ 
        ...ann, 
        source: 'django',
        id: `django-${ann.id}` // 고유 ID 보장
    }));
    
    console.log('🏷️ Django 어노테이션만 표시:', {
        Django어노테이션: djangoAnnotations.length,
        최종합계: djangoAnnotations.length
    });

    return djangoAnnotations; // 🔥 Django 어노테이션만 반환
  }, [convertedAnnotations]);

  // 🔥 수정: Django 어노테이션만 숨기는 토글 함수 (AI 결과는 그대로)
  const handleToggleAllDjangoAnnotations = () => {
    console.log('👁️‍🗨️ Django 어노테이션만 표시/숨김 토글 - 현재상태:', allDjangoAnnotationsHidden);
    
    const newHiddenState = !allDjangoAnnotationsHidden;
    setAllDjangoAnnotationsHidden(newHiddenState);
    
    // Django 어노테이션들만 개별적으로 토글
    allAnnotations.forEach(annotation => {
      if (annotation.source === 'django' && annotation.measurementId) {
        // 각 Django 어노테이션의 measurementId로 개별 토글
        const measurementId = annotation.measurementId || `django-${annotation.id.replace('django-', '')}`;
        console.log(`🔄 Django 어노테이션 개별 토글: ${measurementId}`);
        
        if (onToggleMeasurementVisibility) {
          onToggleMeasurementVisibility(measurementId);
        }
      }
    });
    
    console.log(`✅ Django 어노테이션만 ${newHiddenState ? '숨김' : '표시'} 완료 (AI 결과는 그대로)`);
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    if (!currentStudyUID) {
      if (setAnalysisStatus) {
        setAnalysisStatus('Study UID가 없습니다');
      }
      return;
    }
    
    if (!loadAnnotationsFromServer) {
      if (setAnalysisStatus) {
        setAnalysisStatus('로드 함수가 없습니다');
      }
      return;
    }
    
    setIsLoading(true);
    try {
      await loadAnnotationsFromServer();
    } finally {
      setIsLoading(false);
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!annotationBoxes || annotationBoxes.length === 0) {
      if (setAnalysisStatus) {
        setAnalysisStatus('저장할 어노테이션이 없습니다');
      }
      return;
    }

    if (!saveAnnotationsToServer) {
      if (setAnalysisStatus) {
        setAnalysisStatus('저장 함수가 없습니다');
      }
      return;
    }
    
    setIsLoading(true);
    try {
      await saveAnnotationsToServer();
    } finally {
      setIsLoading(false);
    }
  };

  // 전체 삭제 핸들러
  const handleClearAll = async () => {
    if (allAnnotations.length === 0) {
      if (setAnalysisStatus) {
        setAnalysisStatus('삭제할 어노테이션이 없습니다');
      }
      return;
    }

    if (!clearAllAnnotations) {
      if (setAnalysisStatus) {
        setAnalysisStatus('삭제 함수가 없습니다');
      }
      return;
    }
    
    setIsLoading(true);
    try {
      await clearAllAnnotations();
    } finally {
      setIsLoading(false);
    }
  };

  // 개별 삭제 핸들러
  const handleDelete = async (annotationId, event) => {
    event.stopPropagation();
    
    const annotation = allAnnotations.find(ann => ann.id === annotationId);
    if (!annotation) return;
    
    if (window.confirm(`"${annotation.label}" 어노테이션을 삭제하시겠습니까?`)) {
      try {
        setIsLoading(true);
        
        if (annotation.source === 'django' || (annotation._original && annotation._original.id)) {
          const djangoId = annotation._original?.id || annotation.id;
          
          try {
            await deleteAnnotation(djangoId);
            setTimeout(() => {
              handleRefresh();
            }, 500);
          } catch (error) {
            console.error('❌ Django 서버 삭제 실패:', error);
            if (setAnalysisStatus) {
              setAnalysisStatus('❌ 서버 삭제 실패: ' + error.message);
            }
            return;
          }
        } 
        else if (annotation.source === 'local' || (annotation.measurementId && !annotation.measurementId.startsWith('annotation-'))) {
          if (onDeleteMeasurement) {
            onDeleteMeasurement(annotation.measurementId);
          }
          
          if (onDeleteManualAnnotation) {
            onDeleteManualAnnotation(annotationId);
          }
        } 
        else {
          if (onDeleteManualAnnotation) {
            onDeleteManualAnnotation(annotationId);
          }
        }
        
      } catch (error) {
        console.error('❌ 어노테이션 삭제 실패:', error);
        if (setAnalysisStatus) {
          setAnalysisStatus('❌ 삭제 실패: ' + error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 라벨 편집 핸들러
  const handleEdit = (annotation, event) => {
    event.stopPropagation();
    setSelectedAnnotationForEdit(annotation);
    setIsEditModalOpen(true);
  };

  // 라벨 편집 저장 핸들러
  const handleSaveLabelEdit = (updatedAnnotation) => {
    if (onEditManualAnnotation) {
      onEditManualAnnotation(updatedAnnotation);
    }
    
    setIsEditModalOpen(false);
    setSelectedAnnotationForEdit(null);
  };

  // 라벨 편집 모달 닫기
  const handleCloseLabelEdit = () => {
    setIsEditModalOpen(false);
    setSelectedAnnotationForEdit(null);
  };

  // 🔥 수정: 개별 표시/숨김 토글 - Django 어노테이션 지원 + 디버깅
  const handleToggleVisibility = (annotationId, event) => {
    event.stopPropagation();
    
    const annotation = allAnnotations.find(ann => ann.id === annotationId);
    if (!annotation) {
      console.error('❌ annotation을 찾을 수 없음:', annotationId);
      return;
    }
    
    console.log('👁️ 개별 어노테이션 표시/숨김 토글 시작:', {
      annotationId,
      measurementId: annotation.measurementId,
      source: annotation.source,
      currentVisible: isVisibleInViewer(annotation)
    });
    
    // 🔥 Django 어노테이션인 경우
    if (annotation.source === 'django') {
      // measurementId 형태로 변환하여 토글
      const measurementId = annotation.measurementId || `django-${annotation.id.replace('django-', '')}`;
      console.log('🔄 Django 어노테이션 측정값 ID로 토글:', measurementId);
      
      // 🔥 토글 전 measurements에서 현재 상태 확인
      const currentMeasurement = measurements.find(m => m.id === measurementId);
      console.log('📊 토글 전 측정값 상태:', currentMeasurement);
      
      if (onToggleMeasurementVisibility) {
        console.log('🔄 onToggleMeasurementVisibility 호출:', measurementId);
        onToggleMeasurementVisibility(measurementId);
        
        // 🔥 토글 후 상태 확인 (디버깅용)
        setTimeout(() => {
          const afterMeasurement = measurements.find(m => m.id === measurementId);
          console.log('📊 토글 후 측정값 상태:', afterMeasurement);
        }, 100);
      } else {
        console.error('❌ onToggleMeasurementVisibility 함수가 없음!');
      }
    } else {
      // 일반 측정값의 경우
      if (annotation.measurementId && onToggleMeasurementVisibility) {
        console.log('🔄 일반 측정값 토글:', annotation.measurementId);
        onToggleMeasurementVisibility(annotation.measurementId);
      }
    }
  };

  const handleAnnotationClick = (annotation) => {
    if (setSelectedMeasurement) {
      setSelectedMeasurement(annotation);
    }
    
    if (onHighlightMeasurement && annotation.measurementId) {
      onHighlightMeasurement(annotation.measurementId);
    }
  };

  // 유틸리티 함수들
  const getTypeIcon = (type) => {
    switch (type) {
      case 'length': return '📏';
      case 'rectangle': return '📦';
      case 'circle': return '⭕';
      case 'line': return '📏';
      default: return '📏';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'length': return '길이 측정';
      case 'rectangle': return '사각형 ROI';
      case 'circle': return '원형 ROI';
      case 'line': return '길이 측정';
      default: return '측정';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSelected = (annotation) => {
    return selectedMeasurement?.id === annotation.id || 
           selectedMeasurement?.measurementId === annotation.measurementId;
  };

  const isAnnotationEditing = (annotation) => {
    return isEditMode && editingMeasurement?.id === annotation.measurementId;
  };

  const getAnnotationNumber = (index) => {
    return `#${String(index + 1).padStart(3, '0')}`;
  };

  // 🔥 수정: 카드 필터링 - Django 어노테이션 전용 숨기기 상태 사용
  const visibleAnnotations = allAnnotations.filter(annotation => {
    // Django 어노테이션 전용 숨기기가 활성화되면 모두 숨김
    if (allDjangoAnnotationsHidden) return false;
    
    // 🔥 중요: 개별 숨기기는 카드 표시에 영향 안 줌!
    return true; // 카드는 항상 표시
  });

  // 🔥 수정: 뷰어에서의 실제 표시 상태 확인 - Django 전용 상태 사용 + 디버깅
  const isVisibleInViewer = (annotation) => {
    console.log('👁️ isVisibleInViewer 체크:', {
      annotationId: annotation.id,
      measurementId: annotation.measurementId,
      source: annotation.source,
      allDjangoAnnotationsHidden,
      measurements: measurements.length
    });

    // Django 어노테이션 전용 숨기기 상태 확인
    if (allDjangoAnnotationsHidden) {
      console.log('📴 Django 전용 숨기기 활성화 → false');
      return false;
    }
    
    // Django 어노테이션의 경우
    if (annotation.source === 'django' && annotation.measurementId) {
      // measurements 배열에서 해당 measurementId 찾기
      const correspondingMeasurement = measurements.find(m => {
        const isMatch = m.id === annotation.measurementId;
        console.log(`🔍 측정값 비교: ${m.id} === ${annotation.measurementId} → ${isMatch}`);
        return isMatch;
      });
      
      if (correspondingMeasurement) {
        // 🔥 수정: useMeasurements와 동일한 로직 사용
        const isVisible = correspondingMeasurement.visible !== false; // undefined나 true면 true
        console.log(`✅ measurements에서 찾음: visible=${correspondingMeasurement.visible} → ${isVisible}`);
        return isVisible;
      } else {
        console.log(`⚠️ measurements에서 못 찾음: ${annotation.measurementId}`);
        console.log('📊 전체 measurements IDs:', measurements.map(m => m.id));
        
        // measurements에 없으면 annotation 자체의 visible 상태 확인
        const fallbackVisible = annotation.visible !== false;
        console.log(`🔄 fallback visible: ${annotation.visible} → ${fallbackVisible}`);
        return fallbackVisible;
      }
    }
    
    // Layout에서 온 측정값의 경우
    if (annotation.source === 'local') {
      const isVisible = annotation.visible !== false;
      console.log(`🏠 로컬 측정값: ${annotation.visible} → ${isVisible}`);
      return isVisible;
    }
    
    // 기본값
    console.log('🔧 기본값 사용 → true');
    return true;
  };

  // 🔥 추가: measurements 배열 변화 감지 (디버깅용)
  React.useEffect(() => {
    console.log('📊 measurements 배열 변화 감지:', {
      길이: measurements.length,
      Django어노테이션들: measurements.filter(m => m.id?.startsWith('django-')),
      모든IDs: measurements.map(m => ({ id: m.id, visible: m.visible, source: m.source }))
    });
  }, [measurements]);

  // 🔥 추가: allDjangoAnnotationsHidden 상태 변화 감지 (디버깅용)
  React.useEffect(() => {
    console.log('📴 allDjangoAnnotationsHidden 상태 변화:', allDjangoAnnotationsHidden);
  }, [allDjangoAnnotationsHidden]);

  return (
    <div className="mv-manual-panel-content">
      {/* 인스턴스 정보 표시 */}
      {currentStudyUID && currentInstanceUID && (
        <div className="mv-manual-instance-info">
          <div className="mv-instance-header">
            <span className="mv-instance-label">현재 슬라이스:</span>
            <span className="mv-instance-value">#{currentInstanceNumber || '?'}</span>
          </div>
          <div className="mv-instance-uid">
            Instance: {currentInstanceUID.slice(-8)}...
          </div>
        </div>
      )}

      {/* 헤더 - 통계 + 컨트롤 */}
      <div className="mv-manual-annotations-header">
        <div className="mv-manual-annotations-stats">
          <span className="mv-manual-stats-label">라벨있는 어노테이션:</span>
          <span className="mv-manual-stats-value">{allAnnotations.length}개</span>
          
          {isLoading && (
            <span className="mv-manual-stats-loading">
              <RefreshCw size={12} className="mv-spinning" />
            </span>
          )}
          
          {/* 🔥 수정: Django 전용 상태 표시 */}
          <span className="mv-manual-stats-status">
            {allDjangoAnnotationsHidden ? '(숨김)' : '(표시)'}
          </span>
        </div>
        
        <div className="mv-manual-header-controls">
          {/* 새로고침 버튼 */}
          <button 
            className="mv-manual-refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading || !currentStudyUID || !loadAnnotationsFromServer}
            title="어노테이션 새로고침"
          >
            <RefreshCw size={14} className={isLoading ? 'mv-spinning' : ''} />
          </button>

          {/* 저장 버튼 */}
          <button 
            className="mv-manual-save-btn"
            onClick={handleSave}
            disabled={isLoading || !saveAnnotationsToServer}
            title="어노테이션 저장"
          >
            <Save size={14} />
          </button>

          {/* 🔥 수정: Django 전용 표시/숨김 토글 버튼 */}
          <button 
            className={`mv-manual-toggle-all-btn ${!allDjangoAnnotationsHidden ? 'visible' : 'hidden'}`}
            onClick={handleToggleAllDjangoAnnotations}
            title={!allDjangoAnnotationsHidden ? '모든 라벨 숨기기' : '모든 라벨 보이기'}
          >
            {!allDjangoAnnotationsHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{!allDjangoAnnotationsHidden ? '라벨 숨기기' : '라벨 보이기'}</span>
          </button>
          
          {/* 편집 모드 종료 버튼 */}
          {isEditMode && (
            <button 
              className="mv-manual-exit-edit-btn"
              onClick={() => {
                if (onStopEditMode) {
                  onStopEditMode();
                }
              }}
              title="편집 완료"
            >
              편집 완료
            </button>
          )}
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="mv-manual-loading">
          <RefreshCw size={24} className="mv-spinning" />
          <span>어노테이션 로딩 중...</span>
        </div>
      )}

      {/* 🔥 수정: Django 전용 숨김 상태 메시지 */}
      {allDjangoAnnotationsHidden && allAnnotations.length > 0 && (
        <div className="mv-manual-hidden-notice">
          👁️‍🗨️ 모든 라벨이 숨겨져 있습니다. "라벨 보이기" 버튼을 클릭하세요.
        </div>
      )}

      {/* 카드형 주석 목록 */}
      {visibleAnnotations.map((annotation, index) => (
        <div 
          key={annotation.id} 
          className={`mv-manual-card ${isSelected(annotation) ? 'selected' : ''} ${isAnnotationEditing(annotation) ? 'editing' : ''}`}
          data-type={annotation.type}
          onClick={() => handleAnnotationClick(annotation)}
        >
          {/* 카드 헤더 */}
          <div className="mv-card-header">
            <div className="mv-card-title">
              {getTypeIcon(annotation.type)} {getTypeName(annotation.type)}
              {annotation.source && (
                <span className="mv-card-source">({annotation.source})</span>
              )}
            </div>
            <div className="mv-card-number">
              {getAnnotationNumber(index)}
            </div>
          </div>
          
          {/* 카드 구분선 */}
          <div className="mv-card-divider"></div>
          
          {/* 카드 본문 */}
          <div className="mv-card-body">
            {/* 측정값과 슬라이스 */}
            <div className="mv-card-info-line">
              <span className="mv-card-value">
                {annotation.type === 'rectangle' && '면적: '}
                {annotation.type === 'circle' && '면적: '}
                {(annotation.type === 'length' || annotation.type === 'line') && '길이: '}
                {annotation.value || 'N/A'}
              </span>
              <span className="mv-card-separator">|</span>
              <span className="mv-card-slice">슬라이스: {annotation.slice}</span>
            </div>
            
            {/* 좌표 정보 */}
            <div className="mv-card-coords">
              좌표: {annotation.coords}
            </div>
            
            {/* 공백 줄 */}
            <div className="mv-card-spacer"></div>
            
            {/* 라벨과 판독의 */}
            <div className="mv-card-label-line">
              <span className="mv-card-label">
                🏷️ 라벨: "{annotation.label || 'N/A'}"
              </span>
              <span className="mv-card-doctor">
                👨‍⚕️ {annotation.doctor || '미지정'}
              </span>
            </div>
            
            {/* 메모 */}
            {annotation.memo && (
              <div className="mv-card-memo">
                💭 메모: {annotation.memo}
              </div>
            )}
            
            {/* 시간 정보 */}
            <div className="mv-card-time-line">
              {annotation.timestamp && (
                <span className="mv-card-created">
                  📅 생성: {formatTimestamp(annotation.timestamp)}
                </span>
              )}
            </div>
            
            {/* 편집 중 표시 */}
            {isAnnotationEditing(annotation) && (
              <div className="mv-card-editing-indicator">
                ✏️ 편집 중
              </div>
            )}
          </div>
          
          {/* 🔥 수정: 카드 컨트롤 버튼들 */}
          <div className="mv-card-controls">
            {/* 🔥 수정: 뷰어에서의 실제 표시 상태를 반영하는 눈 아이콘 */}
            <button 
              className={`mv-card-visibility-btn ${isVisibleInViewer(annotation) ? 'visible' : 'hidden'}`}
              onClick={(e) => handleToggleVisibility(annotation.id, e)}
              title={isVisibleInViewer(annotation) ? '뷰어에서 숨기기' : '뷰어에서 보이기'}
            >
              {isVisibleInViewer(annotation) ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            
            {/* 라벨 편집 버튼 */}
            <button 
              className="mv-card-edit-btn"
              onClick={(e) => handleEdit(annotation, e)}
              title="라벨 편집"
            >
              <Edit size={14} />
            </button>
            
            {/* 삭제 버튼 */}
            <button 
              className="mv-card-delete-btn"
              onClick={(e) => handleDelete(annotation.id, e)}
              title="삭제"
              disabled={isLoading}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
      
      {/* Empty State */}
      {allAnnotations.length === 0 && !isLoading && (
        <div className="mv-manual-empty-state">
          <Edit size={48} className="mv-manual-empty-icon" />
          <p>라벨이 있는 수동 주석 없음</p>
          <p className="mv-manual-empty-subtitle">
            {currentStudyUID ? 
              `측정값에 라벨을 추가해주세요` :
              '인스턴스를 선택해주세요'
            }
          </p>
          {currentStudyUID && (
            <button 
              className="mv-manual-refresh-empty-btn"
              onClick={handleRefresh}
              disabled={isLoading || !loadAnnotationsFromServer}
            >
              <RefreshCw size={16} />
              새로고침
            </button>
          )}
        </div>
      )}

      {/* 통계 요약 (하단) */}
      {allAnnotations.length > 0 && (
        <div className="mv-manual-annotations-summary">
          <div className="mv-manual-summary-title">📊 라벨 통계</div>
          <div className="mv-manual-summary-stats">
            {/* 타입별 개수 */}
            {Object.entries(
              allAnnotations.reduce((acc, annotation) => {
                acc[annotation.type] = (acc[annotation.type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <div key={type} className="mv-manual-summary-item">
                {getTypeIcon(type)} {getTypeName(type)}: {count}개
              </div>
            ))}
            
            {/* 편집 상태 표시 */}
            {isEditMode && (
              <div className="mv-manual-summary-item mv-edit-status">
                ✏️ 편집 모드 활성화
              </div>
            )}
            
            {/* 🔥 수정: Django 전용 숨김 상태 표시 */}
            {allDjangoAnnotationsHidden && (
              <div className="mv-manual-summary-item mv-hidden-status">
                👁️‍🗨️ 라벨 전체 숨김 상태
              </div>
            )}
            
            {/* 인스턴스 정보 */}
            <div className="mv-manual-summary-item">
              📊 슬라이스 #{currentInstanceNumber || '?'}
            </div>
            
            {/* 전체 삭제 버튼 */}
            {allAnnotations.length > 0 && (
              <button 
                className="mv-manual-clear-all-btn"
                onClick={handleClearAll}
                disabled={isLoading || !clearAllAnnotations}
                title="현재 슬라이스의 모든 어노테이션 삭제"
              >
                <Trash2 size={14} />
                전체 삭제
              </button>
            )}
          </div>
        </div>
      )}

      {/* 라벨 편집 모달 */}
      <LabelingEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseLabelEdit}
        onSave={handleSaveLabelEdit}
        annotation={selectedAnnotationForEdit}
        measurementId={selectedAnnotationForEdit?.measurementId}
        debugInfo={{
          panel: 'ManualAnnotationsPanel',
          annotationsCount: allAnnotations.length,
          selectedId: selectedAnnotationForEdit?.id,
          source: selectedAnnotationForEdit?.source
        }}
      />
    </div>
  );
};

export default ManualAnnotationsPanel;