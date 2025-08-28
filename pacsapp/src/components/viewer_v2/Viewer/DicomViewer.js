// // /home/medical_system/pacsapp/src/components/viewer_v2/Viewer/DicomViewer.js - 완전한 통합 버전

// import React, { useState, useRef, useCallback, useEffect } from 'react';
// import { Stethoscope, Calendar, EyeOff } from 'lucide-react';
// import Modal from '../Common/Modal';
// import LabelingForm from '../Common/LabelingForm';
// import LabelingEditModal from '../Common/LabelingEditModal';
// import './DicomViewer.css';

// const DicomViewer = ({ 
//   selectedTool = 'wwwc', 
//   currentSlice = 1, 
//   totalSlices = 1, 
//   aiResults = {}, 
//   patientInfo = {}, 
//   viewport = {},
  
//   // 실제 이미지 관련 props
//   currentImageUrl,
//   imageIds,
//   viewportSettings,
  
//   // 🔥 CSS 기반 이미지 변환
//   imageTransform,
//   getImageStyle,
  
//   // 🔥 마우스 이벤트 핸들러
//   onMouseDown,
//   onMouseMove,
//   onMouseUp,
//   onWheel,
  
//   // 🔥 측정 도구 관련
//   measurements = [],
//   currentMeasurement,
  
//   // 🔥 편집 관련 props
//   editingMeasurement,
//   isEditMode,
//   startEditMode,
//   stopEditMode,
  
//   // 🔥 컨텍스트 메뉴 관련 props
//   onDeleteMeasurement,
  
//   // 🔥 라벨링 관련 props 추가
//   onAddManualAnnotation,
//   onEditManualAnnotation,
//   setActiveRightPanel,
  
//   // 🔥 하이라이트 관련 props 추가
//   highlightedMeasurementId,
//   onHighlightMeasurement,
  
//   // 🔥 수동 주석 데이터 추가 (라벨 표시용)
//   manualAnnotations = [],
  
//   // 🔥 Django 어노테이션 시스템 연동
//   addMeasurementToAnnotations,
  
//   // 🔥 Django 어노테이션 데이터 추가 (뷰어 렌더링용)
//   annotationBoxes = [],
  
//   // 🔥 새로 추가: 전체 숨기기 관련 props
//   allMeasurementsHidden = false
// }) => {
//   const modelColors = {
//     yolov8: '#3b82f6',
//     ssd: '#ef4444', 
//     simclr: '#22c55e'
//   };

//   // 🔥 이미지 크기 측정 관련 state 추가
//   const imageRef = useRef(null);
//   const [imageDisplayInfo, setImageDisplayInfo] = useState(null);

//   // 🔥 컨텍스트 메뉴 상태
//   const [contextMenu, setContextMenu] = useState(null);
//   const [selectedMeasurementForMenu, setSelectedMeasurementForMenu] = useState(null);
  
//   // 🔥 라벨링 모달 상태
//   const [isLabelingModalOpen, setIsLabelingModalOpen] = useState(false);
//   const [measurementToLabel, setMeasurementToLabel] = useState(null);

//   // 🔥 라벨 편집 모달 상태
//   const [isLabelEditModalOpen, setIsLabelEditModalOpen] = useState(false);
//   const [annotationToEdit, setAnnotationToEdit] = useState(null);

//   // 기본값 설정
//   const safePatientInfo = {
//     name: '샘플 환자',
//     id: 'SAMPLE-001',
//     studyDate: '2024.12.15',
//     ...patientInfo
//   };

//   const safeViewport = {
//     windowWidth: 400,
//     windowCenter: 40,
//     zoom: 1.0,
//     ...viewport,
//     ...viewportSettings
//   };

//   const safeAiResults = aiResults || {};

//   // 🔥 디버깅 로그 추가
//   console.log('🖼️ DicomViewer - manualAnnotations:', manualAnnotations?.length || 0);
//   console.log('🖼️ DicomViewer - annotationBoxes:', annotationBoxes?.length || 0);
//   console.log('🎯 DicomViewer - highlightedMeasurementId:', highlightedMeasurementId);
//   console.log('👁️ DicomViewer - allMeasurementsHidden:', allMeasurementsHidden);
//   console.log('🤖 DicomViewer - safeAiResults:', safeAiResults);

//   // 🔥 새로 추가: 이미지 크기 측정 함수
//   const measureImageDisplay = useCallback(() => {
//     if (!imageRef.current) return;
    
//     const img = imageRef.current;
//     const container = img.parentElement; // .mv-image-content
    
//     console.log('📐 이미지 크기 측정 시작');
//     console.log('원본 크기:', img.naturalWidth, 'x', img.naturalHeight);
//     console.log('컨테이너 크기:', container.clientWidth, 'x', container.clientHeight);
    
//     // object-fit: contain 계산
//     const containerAspect = container.clientWidth / container.clientHeight;
//     const imageAspect = img.naturalWidth / img.naturalHeight;
    
//     let displayWidth, displayHeight, offsetX, offsetY;
    
//     if (imageAspect > containerAspect) {
//       // 이미지가 더 넓음 - 가로에 맞춤
//       displayWidth = container.clientWidth;
//       displayHeight = container.clientWidth / imageAspect;
//       offsetX = 0;
//       offsetY = (container.clientHeight - displayHeight) / 2;
//     } else {
//       // 이미지가 더 높음 - 세로에 맞춤
//       displayHeight = container.clientHeight;
//       displayWidth = container.clientHeight * imageAspect;
//       offsetX = (container.clientWidth - displayWidth) / 2;
//       offsetY = 0;
//     }
    
//     const scaleX = displayWidth / img.naturalWidth;
//     const scaleY = displayHeight / img.naturalHeight;
    
//     const displayInfo = {
//       naturalWidth: img.naturalWidth,
//       naturalHeight: img.naturalHeight,
//       containerWidth: container.clientWidth,
//       containerHeight: container.clientHeight,
//       displayWidth,
//       displayHeight,
//       offsetX,
//       offsetY,
//       scaleX,
//       scaleY
//     };
    
//     console.log('📐 측정 결과:', displayInfo);
//     setImageDisplayInfo(displayInfo);
//   }, []);

//   // 🔥 창 크기 변경시 재측정
//   useEffect(() => {
//     const handleResize = () => {
//       if (imageDisplayInfo) {
//         measureImageDisplay();
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, [imageDisplayInfo, measureImageDisplay]);

//   // 🔥 새로 추가: imageTransform 변경시 재측정 (zoom, pan, rotation 등)
//   useEffect(() => {
//     if (imageDisplayInfo && imageTransform) {
//       console.log('🔄 이미지 변환 감지 - 재측정 시작:', imageTransform);
//       // 약간의 지연을 두고 재측정 (transform 애니메이션 완료 후)
//       const timer = setTimeout(() => {
//         measureImageDisplay();
//       }, 50);
      
//       return () => clearTimeout(timer);
//     }
//   }, [imageTransform?.zoom, imageTransform?.panX, imageTransform?.panY, imageTransform?.rotation, imageTransform?.flipH, imageTransform?.flipV, measureImageDisplay, imageDisplayInfo]);

//   // 🔥 새로 추가: bbox 좌표 변환 함수 (zoom, pan, rotation 적용)
//   const transformBboxCoordinates = useCallback((bbox, originalWidth, originalHeight) => {
//     if (!imageDisplayInfo) {
//       console.warn('⚠️ 이미지 표시 정보가 없어서 bbox 변환 불가');
//       return bbox;
//     }

//     console.log('🔄 bbox 변환 시작:', { bbox, originalWidth, originalHeight });
//     console.log('📐 변환 정보:', imageDisplayInfo);
//     console.log('🎛️ 이미지 변환:', imageTransform);

//     // 원본 이미지 크기 vs 현재 표시 크기 비율 계산
//     const scaleX = imageDisplayInfo.displayWidth / originalWidth;
//     const scaleY = imageDisplayInfo.displayHeight / originalHeight;

//     // 🔥 추가: 사용자 변환 적용 (zoom, pan, rotation)
//     const zoomFactor = imageTransform?.zoom || 1;
//     const panX = imageTransform?.panX || 0;
//     const panY = imageTransform?.panY || 0;
//     const rotation = imageTransform?.rotation || 0;
//     const flipH = imageTransform?.flipH || false;
//     const flipV = imageTransform?.flipV || false;

//     let transformedBbox;

//     if (Array.isArray(bbox)) {
//       // [x1, y1, x2, y2] 형태
//       transformedBbox = [
//         bbox[0] * scaleX * zoomFactor + imageDisplayInfo.offsetX + panX,
//         bbox[1] * scaleY * zoomFactor + imageDisplayInfo.offsetY + panY,
//         bbox[2] * scaleX * zoomFactor + imageDisplayInfo.offsetX + panX,
//         bbox[3] * scaleY * zoomFactor + imageDisplayInfo.offsetY + panY
//       ];

//       // 🔥 플립 적용
//       if (flipH || flipV) {
//         const centerX = imageDisplayInfo.containerWidth / 2;
//         const centerY = imageDisplayInfo.containerHeight / 2;
        
//         if (flipH) {
//           transformedBbox[0] = 2 * centerX - transformedBbox[0];
//           transformedBbox[2] = 2 * centerX - transformedBbox[2];
//           // x1과 x2 순서 바꾸기
//           [transformedBbox[0], transformedBbox[2]] = [transformedBbox[2], transformedBbox[0]];
//         }
        
//         if (flipV) {
//           transformedBbox[1] = 2 * centerY - transformedBbox[1];
//           transformedBbox[3] = 2 * centerY - transformedBbox[3];
//           // y1과 y2 순서 바꾸기
//           [transformedBbox[1], transformedBbox[3]] = [transformedBbox[3], transformedBbox[1]];
//         }
//       }

//       // 🔥 회전 적용 (간단한 90도 단위만)
//       if (rotation !== 0 && rotation % 90 === 0) {
//         const centerX = imageDisplayInfo.containerWidth / 2;
//         const centerY = imageDisplayInfo.containerHeight / 2;
//         const rotationCount = Math.abs(rotation / 90) % 4;
        
//         for (let i = 0; i < rotationCount; i++) {
//           const x1 = transformedBbox[0] - centerX;
//           const y1 = transformedBbox[1] - centerY;
//           const x2 = transformedBbox[2] - centerX;
//           const y2 = transformedBbox[3] - centerY;
          
//           if (rotation > 0) {
//             // 시계방향 90도 회전
//             transformedBbox = [
//               centerX - y1,
//               centerY + x1,
//               centerX - y2,
//               centerY + x2
//             ];
//           } else {
//             // 반시계방향 90도 회전
//             transformedBbox = [
//               centerX + y1,
//               centerY - x1,
//               centerX + y2,
//               centerY - x2
//             ];
//           }
//         }
//       }

//     } else if (bbox && typeof bbox === 'object') {
//       // {x, y, width, height} 형태
//       transformedBbox = {
//         x: bbox.x * scaleX * zoomFactor + imageDisplayInfo.offsetX + panX,
//         y: bbox.y * scaleY * zoomFactor + imageDisplayInfo.offsetY + panY,
//         width: bbox.width * scaleX * zoomFactor,
//         height: bbox.height * scaleY * zoomFactor
//       };

//       // 플립과 회전은 배열 형태로 변환 후 적용
//       const arrayBbox = [transformedBbox.x, transformedBbox.y, 
//                         transformedBbox.x + transformedBbox.width, 
//                         transformedBbox.y + transformedBbox.height];
//       const processedArray = transformBboxCoordinates(arrayBbox, 1, 1); // 재귀 호출로 변환 적용
      
//       transformedBbox = {
//         x: Math.min(processedArray[0], processedArray[2]),
//         y: Math.min(processedArray[1], processedArray[3]),
//         width: Math.abs(processedArray[2] - processedArray[0]),
//         height: Math.abs(processedArray[3] - processedArray[1])
//       };
//     } else {
//       console.warn('❌ 알 수 없는 bbox 형태:', bbox);
//       return bbox;
//     }

//     console.log('✅ 변환된 bbox (zoom, pan, rotation 적용):', transformedBbox);
//     return transformedBbox;
//   }, [imageDisplayInfo, imageTransform]);

//   // 🔥 수정: Django 어노테이션을 측정값 형태로 변환하여 렌더링 - visible 상태 고려
//   const convertDjangoAnnotationsToMeasurements = () => {
//     if (!annotationBoxes || !Array.isArray(annotationBoxes)) {
//       return [];
//     }
    
//     return annotationBoxes
//       .filter(annotation => annotation.coordinates && annotation.shape_type)
//       .map(annotation => {
//         let startPoint, endPoint, centerPoint, radius;
        
//         // 🔥 Django 어노테이션의 visible 상태 확인 (measurements 배열에서)
//         const correspondingMeasurement = measurements.find(m => 
//           m.id === `django-${annotation.id}` || m.measurementId === `django-${annotation.id}`
//         );
//         const isVisible = correspondingMeasurement ? (correspondingMeasurement.visible !== false) : true;
        
//         switch (annotation.shape_type) {
//           case 'line':
//             startPoint = { x: annotation.coordinates[0], y: annotation.coordinates[1] };
//             endPoint = { x: annotation.coordinates[2], y: annotation.coordinates[3] };
//             const length = Math.sqrt(
//               Math.pow(endPoint.x - startPoint.x, 2) + 
//               Math.pow(endPoint.y - startPoint.y, 2)
//             );
//             return {
//               id: `django-${annotation.id}`,
//               type: 'length',
//               startPoint,
//               endPoint,
//               value: `${length.toFixed(1)} mm`,
//               isComplete: true,
//               visible: isVisible,
//               source: 'django',
//               djangoData: annotation
//             };
            
//           case 'rectangle':
//             startPoint = { x: annotation.coordinates[0], y: annotation.coordinates[1] };
//             endPoint = { 
//               x: annotation.coordinates[0] + annotation.coordinates[2], 
//               y: annotation.coordinates[1] + annotation.coordinates[3] 
//             };
//             const area = annotation.coordinates[2] * annotation.coordinates[3];
//             return {
//               id: `django-${annotation.id}`,
//               type: 'rectangle',
//               startPoint,
//               endPoint,
//               value: `면적: ${area.toFixed(1)} mm²`,
//               isComplete: true,
//               visible: isVisible,
//               source: 'django',
//               djangoData: annotation
//             };
            
//           case 'circle':
//             centerPoint = { x: annotation.coordinates[0], y: annotation.coordinates[1] };
//             radius = annotation.coordinates[2];
//             const circleArea = Math.PI * radius * radius;
//             return {
//               id: `django-${annotation.id}`,
//               type: 'circle',
//               startPoint: centerPoint,
//               endPoint: { x: centerPoint.x + radius, y: centerPoint.y },
//               centerPoint,
//               radius,
//               value: `면적: ${circleArea.toFixed(1)} mm²`,
//               isComplete: true,
//               visible: isVisible,
//               source: 'django',
//               djangoData: annotation
//             };
            
//           default:
//             return null;
//         }
//       })
//       .filter(Boolean);
//   };

//   // 🔥 마우스 다운 핸들러 래퍼 (우클릭 차단)
//   const handleMouseDownWrapper = (event) => {
//     // 우클릭이면 무시
//     if (event.button === 2) {
//       console.log('🖱️ DicomViewer - 우클릭 감지 - 측정 시작 차단');
//       event.preventDefault();
//       event.stopPropagation();
//       return;
//     }
    
//     // 좌클릭만 onMouseDown 전달
//     if (onMouseDown) {
//       onMouseDown(event);
//     }
//   };

//   // 🔥 컨텍스트 메뉴 핸들러
//   const handleContextMenu = (event, measurement) => {
//     event.preventDefault();
//     event.stopPropagation();
    
//     // 🔥 확실하게 측정 중단
//     if (onMouseUp) {
//       onMouseUp(event);
//     }
    
//     // 🔥 브라우저 뷰포트 기준 좌표 사용 (더 정확함)
//     const viewportX = event.clientX;
//     const viewportY = event.clientY;
    
//     // 🔥 메뉴가 화면 밖으로 나가지 않도록 조정
//     const menuWidth = 180;
//     const menuHeight = 160;
//     const windowWidth = window.innerWidth;
//     const windowHeight = window.innerHeight;
    
//     let x = viewportX;
//     let y = viewportY;
    
//     // 오른쪽 경계 체크
//     if (x + menuWidth > windowWidth) {
//       x = windowWidth - menuWidth - 10;
//     }
    
//     // 하단 경계 체크
//     if (y + menuHeight > windowHeight) {
//       y = windowHeight - menuHeight - 10;
//     }
    
//     // 최소값 보장
//     x = Math.max(10, x);
//     y = Math.max(10, y);
    
//     setContextMenu({ x, y });
//     setSelectedMeasurementForMenu(measurement);
//     console.log('🖱️ 우클릭 컨텍스트 메뉴:', measurement.id, `위치: (${x}, ${y})`);
//   };

//   const handleCloseContextMenu = () => {
//     setContextMenu(null);
//     setSelectedMeasurementForMenu(null);
//   };

//   // 🔥 좌표 편집 모드 진입
//   const handleEditCoordinates = () => {
//     if (selectedMeasurementForMenu && startEditMode) {
//       console.log('📍 좌표 편집 모드 시작:', selectedMeasurementForMenu.id);
//       startEditMode(selectedMeasurementForMenu.id);
//       handleCloseContextMenu();
//     }
//   };

//   // 🔥 측정값에 연결된 라벨 찾기 - Django 어노테이션 지원 개선
//   const findLabelForMeasurement = (measurementId) => {
//     // Django 어노테이션인지 확인
//     const measurement = measurements.find(m => m.id === measurementId);
//     if (measurement && measurement.source === 'django' && measurement.djangoData) {
//       // Django 어노테이션은 자체적으로 라벨을 가지고 있음
//       return {
//         id: measurement.djangoData.id,
//         label: measurement.djangoData.label,
//         memo: measurement.djangoData.dr_text || '',
//         measurementId: measurementId,
//         type: measurement.type,
//         value: measurement.value,
//         slice: currentSlice,
//         coords: `shape: ${measurement.djangoData.shape_type}`,
//         doctor: measurement.djangoData.doctor_name || '미지정',
//         timestamp: measurement.djangoData.created
//       };
//     }
    
//     // 일반 측정값의 경우 manualAnnotations에서 찾기
//     const found = manualAnnotations.find(annotation => 
//       annotation.measurementId === measurementId
//     );
//     console.log(`🔍 측정값 ${measurementId}에 연결된 라벨:`, found?.label || 'none');
//     return found;
//   };

//   // 🔥 라벨 편집 모달 열기
//   const handleEditLabel = () => {
//     if (selectedMeasurementForMenu) {
//       console.log('🔍 선택된 측정값:', selectedMeasurementForMenu);
//       console.log('🔍 전체 manualAnnotations:', manualAnnotations);
      
//       // 🔥 Django 어노테이션인지 확인
//       if (selectedMeasurementForMenu.source === 'django' && selectedMeasurementForMenu.djangoData) {
//         // Django 어노테이션의 경우 djangoData를 사용
//         const djangoAnnotation = {
//           id: selectedMeasurementForMenu.djangoData.id,
//           label: selectedMeasurementForMenu.djangoData.label,
//           memo: selectedMeasurementForMenu.djangoData.dr_text || '',
//           type: selectedMeasurementForMenu.type,
//           value: selectedMeasurementForMenu.value,
//           slice: currentSlice,
//           coords: `shape: ${selectedMeasurementForMenu.djangoData.shape_type}`,
//           doctor: selectedMeasurementForMenu.djangoData.doctor_name || '미지정',
//           timestamp: selectedMeasurementForMenu.djangoData.created,
//           measurementId: selectedMeasurementForMenu.id,
//           _original: selectedMeasurementForMenu.djangoData
//         };
        
//         console.log('✅ Django 어노테이션 데이터:', djangoAnnotation);
//         setAnnotationToEdit(djangoAnnotation);
//         setIsLabelEditModalOpen(true);
//       } else {
//         // 일반 측정값의 경우 기존 로직 사용
//         const linkedAnnotation = findLabelForMeasurement(selectedMeasurementForMenu.id);
//         console.log('🔍 찾은 annotation:', linkedAnnotation);
        
//         if (linkedAnnotation) {
//           console.log('✅ annotation 데이터 확인:', {
//             type: linkedAnnotation.type,
//             value: linkedAnnotation.value,
//             slice: linkedAnnotation.slice,
//             coords: linkedAnnotation.coords,
//             label: linkedAnnotation.label,
//             memo: linkedAnnotation.memo
//           });
          
//           setAnnotationToEdit(linkedAnnotation);
//           setIsLabelEditModalOpen(true);
//         } else {
//           console.error('❌ linkedAnnotation이 null입니다!');
//           // 임시로 새 라벨 추가 모달로 대체
//           setMeasurementToLabel(selectedMeasurementForMenu);
//           setIsLabelingModalOpen(true);
//         }
//       }
      
//       handleCloseContextMenu();
//     }
//   };

//   const handleDeleteMeasurement = () => {
//     if (selectedMeasurementForMenu && onDeleteMeasurement) {
//       onDeleteMeasurement(selectedMeasurementForMenu.id);
//       handleCloseContextMenu();
//     }
//   };

//   // 🔥 라벨링 모달 열기
//   const handleLabelMeasurement = () => {
//     if (selectedMeasurementForMenu) {
//       console.log('🏷️ 라벨링 시작:', selectedMeasurementForMenu.id);
//       setMeasurementToLabel(selectedMeasurementForMenu);
//       setIsLabelingModalOpen(true);
//       handleCloseContextMenu();
//     }
//   };

//   // 🔥 라벨링 저장 핸들러 - 실시간 반영 추가
//   const handleSaveLabeling = async (annotationData) => {
//     console.log('💾 DicomViewer - 라벨링 저장 시작:', annotationData);
//     console.log('📏 DicomViewer - 측정값 정보:', measurementToLabel);
    
//     // 1. 기존 manualAnnotations에 추가 (UI 표시용)
//     if (onAddManualAnnotation) {
//       console.log('✅ DicomViewer - onAddManualAnnotation 호출');
//       await onAddManualAnnotation(annotationData);
//     } else {
//       console.error('❌ DicomViewer - onAddManualAnnotation prop이 없음!');
//     }
    
//     // 오른쪽 패널을 수동 주석 탭으로 전환
//     if (setActiveRightPanel) {
//       console.log('🔄 DicomViewer - 오른쪽 패널을 manual-annotations로 전환');
//       setActiveRightPanel('manual-annotations');
//     } else {
//       console.error('❌ DicomViewer - setActiveRightPanel prop이 없음!');
//     }
    
//     setIsLabelingModalOpen(false);
//     setMeasurementToLabel(null);
//   };

//   // 🔥 라벨 편집 저장 핸들러 - 실시간 반영 추가
//   const handleSaveLabelEdit = async (updatedAnnotation) => {
//     console.log('✏️ DicomViewer - 라벨 편집 저장:', updatedAnnotation);
    
//     if (onEditManualAnnotation) {
//       await onEditManualAnnotation(updatedAnnotation);
//     } else {
//       console.error('❌ DicomViewer - onEditManualAnnotation prop이 없음!');
//     }
    
//     setIsLabelEditModalOpen(false);
//     setAnnotationToEdit(null);
//   };

//   // 🔥 라벨링 모달 닫기
//   const handleCloseLabeling = () => {
//     setIsLabelingModalOpen(false);
//     setMeasurementToLabel(null);
//   };

//   // 🔥 라벨 편집 모달 닫기
//   const handleCloseLabelEdit = () => {
//     setIsLabelEditModalOpen(false);
//     setAnnotationToEdit(null);
//   };

//   // 클릭 시 컨텍스트 메뉴 닫기
//   const handleClick = () => {
//     if (contextMenu) {
//       handleCloseContextMenu();
//     }
//   };

//   // 타입별 기본 색상 반환
//   const getOriginalColor = (type) => {
//     switch (type) {
//       case 'length': return '#fbbf24';
//       case 'rectangle': return '#22c55e';
//       case 'circle': return '#a78bfa';
//       default: return '#64748b';
//     }
//   };

//   // 🔥 편집 핸들 렌더링
//   const renderEditHandles = (measurement) => {
//     if (!isEditMode || editingMeasurement?.id !== measurement.id) return null;

//     const handles = [];
//     const handleSize = 8;
//     const handleColor = '#ffffff';
//     const handleStroke = '#3b82f6';
//     const handleStrokeWidth = 2;

//     switch (measurement.type) {
//       case 'length':
//         handles.push(
//           <circle
//             key="start"
//             cx={measurement.startPoint.x}
//             cy={measurement.startPoint.y}
//             r={handleSize}
//             fill={handleColor}
//             stroke={handleStroke}
//             strokeWidth={handleStrokeWidth}
//             style={{ cursor: 'grab' }}
//           />
//         );
        
//         handles.push(
//           <circle
//             key="end"
//             cx={measurement.endPoint.x}
//             cy={measurement.endPoint.y}
//             r={handleSize}
//             fill={handleColor}
//             stroke={handleStroke}
//             strokeWidth={handleStrokeWidth}
//             style={{ cursor: 'grab' }}
//           />
//         );
//         break;

//       case 'rectangle':
//         const rectX = Math.min(measurement.startPoint.x, measurement.endPoint.x);
//         const rectY = Math.min(measurement.startPoint.y, measurement.endPoint.y);
//         const rectW = Math.abs(measurement.endPoint.x - measurement.startPoint.x);
//         const rectH = Math.abs(measurement.endPoint.y - measurement.startPoint.y);
        
//         const corners = [
//           { key: 'topLeft', x: rectX, y: rectY },
//           { key: 'topRight', x: rectX + rectW, y: rectY },
//           { key: 'bottomLeft', x: rectX, y: rectY + rectH },
//           { key: 'bottomRight', x: rectX + rectW, y: rectY + rectH }
//         ];
        
//         corners.forEach(corner => {
//           handles.push(
//             <rect
//               key={corner.key}
//               x={corner.x - handleSize}
//               y={corner.y - handleSize}
//               width={handleSize * 2}
//               height={handleSize * 2}
//               fill={handleColor}
//               stroke={handleStroke}
//               strokeWidth={handleStrokeWidth}
//               style={{ cursor: 'nw-resize' }}
//             />
//           );
//         });
        
//         handles.push(
//           <circle
//             key="center"
//             cx={rectX + rectW / 2}
//             cy={rectY + rectH / 2}
//             r={handleSize}
//             fill={handleColor}
//             stroke={handleStroke}
//             strokeWidth={handleStrokeWidth}
//             style={{ cursor: 'move' }}
//           />
//         );
//         break;

//       case 'circle':
//         handles.push(
//           <circle
//             key="center"
//             cx={measurement.startPoint.x}
//             cy={measurement.startPoint.y}
//             r={handleSize}
//             fill={handleColor}
//             stroke={handleStroke}
//             strokeWidth={handleStrokeWidth}
//             style={{ cursor: 'move' }}
//           />
//         );
        
//         handles.push(
//           <circle
//             key="radius"
//             cx={measurement.endPoint.x}
//             cy={measurement.endPoint.y}
//             r={handleSize}
//             fill={handleColor}
//             stroke={handleStroke}
//             strokeWidth={handleStrokeWidth}
//             style={{ cursor: 'grab' }}
//           />
//         );
//         break;
//     }

//     return handles;
//   };

//   // 🔥 AI 결과 렌더링 함수 (bbox 변환 적용)
//   const renderAIResults = () => {
//     if (allMeasurementsHidden) {
//       console.log('👁️ 전체 숨기기 활성화 - AI 결과도 숨김');
//       return [];
//     }

//     if (!safeAiResults || typeof safeAiResults !== 'object') {
//       return [];
//     }

//     const aiElements = [];

//     Object.entries(safeAiResults).forEach(([modelName, annotations]) => {
//       if (!annotations || !Array.isArray(annotations)) return;

//       annotations
//         .filter(result => result && result.visible !== false)
//         .forEach((result, idx) => {
//           // AI 결과에서 bbox 좌표 및 원본 이미지 크기 추출
//           let bbox = result.bbox || result.coordinates;
//           const originalWidth = result.image_width || 2985; // 기본값
//           const originalHeight = result.image_height || 2985; // 기본값
          
//           console.log('🔍 AI 결과 원본:', { bbox, originalWidth, originalHeight });
          
//           let x1, y1, x2, y2;
          
//           // bbox가 객체인 경우 처리
//           if (bbox && typeof bbox === 'object' && !Array.isArray(bbox)) {
//             // 객체 형태: {x: 323, y: 1020, width: 1068, height: 1695} 또는 {x1, y1, x2, y2}
//             if (bbox.x !== undefined && bbox.y !== undefined && bbox.width !== undefined && bbox.height !== undefined) {
//               // {x, y, width, height} 형태를 [x1, y1, x2, y2]로 변환
//               bbox = [bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height];
//             } else if (bbox.x1 !== undefined && bbox.y1 !== undefined && bbox.x2 !== undefined && bbox.y2 !== undefined) {
//               // {x1, y1, x2, y2} 형태를 배열로 변환
//               bbox = [bbox.x1, bbox.y1, bbox.x2, bbox.y2];
//             } else {
//               console.warn('❌ AI 결과 bbox 객체 형태를 인식할 수 없음:', bbox);
//               return;
//             }
//           } else if (Array.isArray(bbox) && bbox.length >= 4) {
//             // 배열 형태: [x1, y1, x2, y2] 또는 [x, y, width, height]
//             if (result.bbox_format === 'xywh' || (bbox.length === 4 && bbox[2] < bbox[0])) {
//               // [x, y, width, height] 형태를 [x1, y1, x2, y2]로 변환
//               bbox = [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]];
//             }
//             // 이미 [x1, y1, x2, y2] 형태인 경우는 그대로 사용
//           } else {
//             console.warn('❌ AI 결과에 유효한 bbox가 없음:', result);
//             return;
//           }
          
//           // 🔥 bbox 좌표 변환 적용
//           const transformedBbox = transformBboxCoordinates(bbox, originalWidth, originalHeight);
          
//           if (Array.isArray(transformedBbox)) {
//             x1 = transformedBbox[0];
//             y1 = transformedBbox[1];
//             x2 = transformedBbox[2];
//             y2 = transformedBbox[3];
//           } else {
//             console.warn('❌ bbox 변환 실패:', transformedBbox);
//             return;
//           }
          
//           console.log('✅ AI bbox 변환 완료:', {x1, y1, x2, y2});

//           const width = Math.abs(x2 - x1);
//           const height = Math.abs(y2 - y1);
//           const centerX = (x1 + x2) / 2;
//           const centerY = (y1 + y2) / 2;

//           const color = modelColors[modelName] || '#64748b';
//           const confidence = result.confidence || result.score || 0;
//           const label = result.label || result.class_name || 'Unknown';
          
//           // confidence를 퍼센트로 변환
//           const confidencePercent = confidence > 1 ? confidence : Math.round(confidence * 100);

//           const key = `ai-${modelName}-${result.id || idx}`;

//           aiElements.push(
//             <g key={key}>
//               {/* AI bbox 사각형 */}
//               <rect
//                 x={Math.min(x1, x2)}
//                 y={Math.min(y1, y2)}
//                 width={width}
//                 height={height}
//                 fill="none"
//                 stroke={color}
//                 strokeWidth="2"
//                 strokeDasharray="3,3"
//                 style={{ 
//                   pointerEvents: 'auto'
//                 }}
//               />
              
//               {/* AI 라벨 배경 */}
//               <rect
//                 x={Math.min(x1, x2)}
//                 y={Math.min(y1, y2) - 25}
//                 width={Math.max(80, label.length * 8 + 30)}
//                 height="20"
//                 fill={color}
//                 fillOpacity="0.9"
//                 rx="3"
//               />
              
//               {/* AI 라벨 텍스트 */}
//               <text
//                 x={Math.min(x1, x2) + 5}
//                 y={Math.min(y1, y2) - 10}
//                 fill="white"
//                 fontSize="11"
//                 fontWeight="600"
//                 style={{ 
//                   textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
//                   pointerEvents: 'none'
//                 }}
//               >
//                 🤖 {label} ({confidencePercent}%)
//               </text>

//               {/* 모델명 표시 */}
//               <text
//                 x={centerX}
//                 y={Math.max(y1, y2) + 15}
//                 fill={color}
//                 fontSize="10"
//                 fontWeight="500"
//                 textAnchor="middle"
//                 style={{ 
//                   textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
//                   pointerEvents: 'none'
//                 }}
//               >
//                 [{modelName.toUpperCase()}]
//               </text>
              
//               {/* bbox 모서리 점들 */}
//               <circle cx={x1} cy={y1} r="3" fill={color} />
//               <circle cx={x2} cy={y1} r="3" fill={color} />
//               <circle cx={x1} cy={y2} r="3" fill={color} />
//               <circle cx={x2} cy={y2} r="3" fill={color} />
//             </g>
//           );
//         });
//     });

//     return aiElements;
//   };

//   // 🔥 수정된 측정값 렌더링 - Django 어노테이션 포함 + visible 상태 엄격 체크 + 전체 숨기기 우선 확인
//   const renderMeasurements = () => {
//     // 🔥 새로 추가: 전체 숨기기 상태가 활성화되어 있으면 아무것도 렌더링하지 않음
//     if (allMeasurementsHidden) {
//       console.log('👁️ 전체 숨기기 활성화 - 모든 측정값과 어노테이션 숨김');
//       return [];
//     }

//     // 🔥 로컬 측정값과 Django 어노테이션 통합
//     const localMeasurements = [...(measurements || [])];
//     const djangoMeasurements = convertDjangoAnnotationsToMeasurements();
    
//     const allMeasurements = [...localMeasurements, ...djangoMeasurements];
    
//     if (currentMeasurement) {
//       allMeasurements.push(currentMeasurement);
//     }

//     console.log('🔍 렌더링할 측정값들:', allMeasurements.map(m => ({ 
//       id: m.id, 
//       visible: m.visible, 
//       type: m.type,
//       source: m.source,
//       hasLabel: m.source === 'django' ? !!m.djangoData?.label : !!findLabelForMeasurement(m.id),
//       isHighlighted: highlightedMeasurementId === m.id,
//       allHidden: allMeasurementsHidden
//     })));

//     return allMeasurements
//       .filter(measurement => {
//         // 🔥 수정: visible 상태 엄격 체크 - false인 경우 완전히 숨김
//         const isVisible = measurement.visible !== false;
//         console.log(`📊 측정값 ${measurement.id} visible:`, measurement.visible, '→ 표시:', isVisible);
//         return isVisible;
//       })
//       .map((measurement, index) => {
//         const { id, type, startPoint, endPoint, value, isComplete } = measurement;
//         const key = id || `temp-${index}`;
        
//         // 편집 중인 측정값인지 확인
//         const isEditing = isEditMode && editingMeasurement?.id === measurement.id;
        
//         // 🔥 하이라이트된 측정값인지 확인 (깜빡이 효과)
//         const isHighlighted = highlightedMeasurementId === measurement.id;
        
//         // 🔥 연결된 라벨 찾기 - Django 어노테이션 지원
//         let linkedLabel = null;
//         if (measurement.source === 'django' && measurement.djangoData?.label) {
//           // Django 어노테이션은 자체적으로 라벨을 가짐
//           linkedLabel = {
//             label: measurement.djangoData.label,
//             memo: measurement.djangoData.dr_text || ''
//           };
//         } else {
//           // 일반 측정값은 manualAnnotations에서 찾기
//           linkedLabel = findLabelForMeasurement(measurement.id);
//         }
        
//         console.log(`🎯 측정값 ${measurement.id} - 하이라이트:`, isHighlighted, '라벨:', linkedLabel?.label || 'none', 'source:', measurement.source);
        
//         const strokeColor = isEditing ? '#3b82f6' : 
//                            isHighlighted ? '#f59e0b' : 
//                            getOriginalColor(type);
//         const strokeWidth = isEditing ? 3 : isHighlighted ? 3 : 2;
        
//         let measurementElement = null;
        
//         switch (type) {
//           case 'length':
//             measurementElement = (
//               <g key={key}>
//                 <line
//                   x1={startPoint.x}
//                   y1={startPoint.y}
//                   x2={endPoint.x}
//                   y2={endPoint.y}
//                   stroke={strokeColor}
//                   strokeWidth={strokeWidth}
//                   strokeDasharray={isComplete ? "none" : "5,5"}
//                   style={{ 
//                     cursor: isComplete ? 'context-menu' : 'default',
//                     pointerEvents: isComplete ? 'auto' : 'none'
//                   }}
//                   onContextMenu={(e) => isComplete && handleContextMenu(e, measurement)}
//                 />
//                 <circle cx={startPoint.x} cy={startPoint.y} r="4" fill={strokeColor} />
//                 <circle cx={endPoint.x} cy={endPoint.y} r="4" fill={strokeColor} />
                
//                 {/* 측정값 표시 */}
//                 {isComplete && value && (
//                   <text
//                     x={(startPoint.x + endPoint.x) / 2}
//                     y={(startPoint.y + endPoint.y) / 2 - 10}
//                     fill={strokeColor}
//                     fontSize="12"
//                     fontWeight={isEditing ? "bold" : "normal"}
//                     textAnchor="middle"
//                     style={{ 
//                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
//                       cursor: 'context-menu',
//                       pointerEvents: 'auto'
//                     }}
//                     onContextMenu={(e) => handleContextMenu(e, measurement)}
//                     className={isHighlighted ? 'mv-measurement-highlight' : ''}
//                   >
//                     {value}
//                   </text>
//                 )}
                
//                 {/* 🔥 연결된 라벨 표시 */}
//                 {isComplete && linkedLabel && (
//                   <text
//                     x={(startPoint.x + endPoint.x) / 2}
//                     y={(startPoint.y + endPoint.y) / 2 + 15}
//                     fill="#22c55e"
//                     fontSize="11"
//                     fontWeight="600"
//                     textAnchor="middle"
//                     style={{ 
//                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
//                       cursor: 'context-menu',
//                       pointerEvents: 'auto'
//                     }}
//                     onContextMenu={(e) => handleContextMenu(e, measurement)}
//                     className={isHighlighted ? 'mv-label-highlight' : ''}
//                   >
//                     🏷️ "{linkedLabel.label}"
//                   </text>
//                 )}
                
//                 {/* 편집 핸들 */}
//                 {renderEditHandles(measurement)}
//               </g>
//             );
//             break;

//           case 'rectangle':
//             const rectWidth = Math.abs(endPoint.x - startPoint.x);
//             const rectHeight = Math.abs(endPoint.y - startPoint.y);
//             const rectX = Math.min(startPoint.x, endPoint.x);
//             const rectY = Math.min(startPoint.y, endPoint.y);
            
//             measurementElement = (
//               <g key={key}>
//                 <rect
//                   x={rectX}
//                   y={rectY}
//                   width={rectWidth}
//                   height={rectHeight}
//                   fill={isEditing ? "rgba(59, 130, 246, 0.3)" : "rgba(34, 197, 94, 0.2)"}
//                   stroke={strokeColor}
//                   strokeWidth={strokeWidth}
//                   strokeDasharray={isComplete ? "none" : "5,5"}
//                   style={{ 
//                     cursor: isComplete ? 'context-menu' : 'default',
//                     pointerEvents: isComplete ? 'auto' : 'none'
//                   }}
//                   onContextMenu={(e) => isComplete && handleContextMenu(e, measurement)}
//                 />
                
//                 {/* 측정값 표시 */}
//                 {isComplete && value && (
//                   <text
//                     x={rectX + rectWidth / 2}
//                     y={rectY + rectHeight / 2}
//                     fill={strokeColor}
//                     fontSize="12"
//                     fontWeight={isEditing ? "bold" : "normal"}
//                     textAnchor="middle"
//                     style={{ 
//                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
//                       cursor: 'context-menu',
//                       pointerEvents: 'auto'
//                     }}
//                     onContextMenu={(e) => handleContextMenu(e, measurement)}
//                     className={isHighlighted ? 'mv-measurement-highlight' : ''}
//                   >
//                     {value}
//                   </text>
//                 )}
                
//                 {/* 🔥 연결된 라벨 표시 */}
//                 {isComplete && linkedLabel && (
//                   <text
//                     x={rectX + rectWidth / 2}
//                     y={rectY + rectHeight + 20}
//                     fill="#22c55e"
//                     fontSize="11"
//                     fontWeight="600"
//                     textAnchor="middle"
//                     style={{ 
//                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
//                       cursor: 'context-menu',
//                       pointerEvents: 'auto'
//                     }}
//                     onContextMenu={(e) => handleContextMenu(e, measurement)}
//                     className={isHighlighted ? 'mv-label-highlight' : ''}
//                   >
//                     🏷️ "{linkedLabel.label}"
//                   </text>
//                 )}
                
//                 {/* 편집 핸들 */}
//                 {renderEditHandles(measurement)}
//               </g>
//             );
//             break;

//           case 'circle':
//             const radius = Math.sqrt(
//               Math.pow(endPoint.x - startPoint.x, 2) + 
//               Math.pow(endPoint.y - startPoint.y, 2)
//             );
            
//             measurementElement = (
//               <g key={key}>
//                 <circle
//                   cx={startPoint.x}
//                   cy={startPoint.y}
//                   r={radius}
//                   fill={isEditing ? "rgba(59, 130, 246, 0.3)" : "rgba(167, 139, 250, 0.2)"}
//                   stroke={strokeColor}
//                   strokeWidth={strokeWidth}
//                   strokeDasharray={isComplete ? "none" : "5,5"}
//                   style={{ 
//                     cursor: isComplete ? 'context-menu' : 'default',
//                     pointerEvents: isComplete ? 'auto' : 'none'
//                   }}
//                   onContextMenu={(e) => isComplete && handleContextMenu(e, measurement)}
//                 />
//                 <circle cx={startPoint.x} cy={startPoint.y} r="4" fill={strokeColor} />
                
//                 {/* 측정값 표시 */}
//                 {isComplete && value && (
//                   <text
//                     x={startPoint.x}
//                     y={startPoint.y - radius - 15}
//                     fill={strokeColor}
//                     fontSize="12"
//                     fontWeight={isEditing ? "bold" : "normal"}
//                     textAnchor="middle"
//                     style={{ 
//                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
//                       cursor: 'context-menu',
//                       pointerEvents: 'auto'
//                     }}
//                     onContextMenu={(e) => handleContextMenu(e, measurement)}
//                     className={isHighlighted ? 'mv-measurement-highlight' : ''}
//                   >
//                     {value}
//                   </text>
//                 )}
                
//                 {/* 🔥 연결된 라벨 표시 */}
//                 {isComplete && linkedLabel && (
//                   <text
//                     x={startPoint.x}
//                     y={startPoint.y + radius + 25}
//                     fill="#22c55e"
//                     fontSize="11"
//                     fontWeight="600"
//                     textAnchor="middle"
//                     style={{ 
//                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
//                       cursor: 'context-menu',
//                       pointerEvents: 'auto'
//                     }}
//                     onContextMenu={(e) => handleContextMenu(e, measurement)}
//                     className={isHighlighted ? 'mv-label-highlight' : ''}
//                   >
//                     🏷️ "{linkedLabel.label}"
//                   </text>
//                 )}
                
//                 {/* 편집 핸들 */}
//                 {renderEditHandles(measurement)}
//               </g>
//             );
//             break;

//           default:
//             measurementElement = null;
//         }
        
//         return measurementElement;
//       });
//   };

//   return (
//     <div className="mv-dicom-viewer">
//       {/* 실제 DICOM 이미지 표시 */}
//       <div className="mv-medical-image">
//         <div 
//           className="mv-image-content"
//           onMouseDown={handleMouseDownWrapper}
//           onMouseMove={onMouseMove}
//           onMouseUp={onMouseUp}
//           onWheel={onWheel}
//           onClick={handleClick}
//           onContextMenu={(e) => e.preventDefault()}
//           style={{ 
//             cursor: isEditMode ? 'default' :
//                     selectedTool === 'wwwc' ? 'ew-resize' : 
//                     selectedTool === 'zoom' ? 'zoom-in' :
//                     selectedTool === 'pan' ? 'move' :
//                     ['length', 'rectangle', 'circle'].includes(selectedTool) ? 'crosshair' : 'default' 
//           }}
//         >
//           {currentImageUrl ? (
//             <>
//               <img 
//                 ref={imageRef}
//                 src={currentImageUrl}
//                 alt={`DICOM Image ${currentSlice}`}
//                 className="mv-dicom-image"
//                 style={{
//                   width: '100%',
//                   height: '100%',
//                   objectFit: 'contain',
//                   ...getImageStyle(),
//                   pointerEvents: 'none'
//                 }}
//                 onLoad={measureImageDisplay}
//                 onError={(e) => {
//                   console.error('❌ DICOM 이미지 로드 실패:', e.target.src);
//                 }}
//                 draggable={false}
//               />
              
//               <svg
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '100%',
//                   height: '100%',
//                   pointerEvents: 'auto',
//                   zIndex: 10
//                 }}
//               >
//                 {renderMeasurements()}
//                 {renderAIResults()}
//               </svg>
//             </>
//           ) : (
//             <div className="mv-empty-image">
//               <div className="mv-empty-image-icon">📋</div>
//               <div>DICOM 이미지 없음</div>
//               <div className="mv-empty-image-text">이미지를 선택해주세요</div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 뷰포트 정보 오버레이 */}
//       <div className="mv-viewport-info mv-info-left">
//         <div className="mv-info-row">
//           <Stethoscope size={12} />
//           <span>환자: {safePatientInfo.name}</span>
//         </div>
//         <div>ID: {safePatientInfo.id}</div>
//         <div>Slice: {currentSlice}/{totalSlices}</div>
//         <div>도구: {selectedTool.toUpperCase()}</div>
//         {isEditMode && <div className="mv-edit-mode-indicator">편집 모드</div>}
//         {imageTransform && (
//           <div>Zoom: {imageTransform.zoom?.toFixed(1)}x</div>
//         )}
//         {highlightedMeasurementId && (
//           <div className="mv-highlight-indicator">🎯 하이라이트 중</div>
//         )}
//         {allMeasurementsHidden && (
//           <div className="mv-all-hidden-indicator">
//             <EyeOff size={12} />
//             <span>모든 측정값 숨김</span>
//           </div>
//         )}
//         {/* 🔥 이미지 크기 정보 표시 (디버깅용) */}
//         {imageDisplayInfo && (
//           <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
//             📐 {Math.round(imageDisplayInfo.displayWidth)}x{Math.round(imageDisplayInfo.displayHeight)}
//             (비율: {imageDisplayInfo.scaleX.toFixed(2)})
//           </div>
//         )}
//       </div>

//       <div className="mv-viewport-info mv-info-right">
//         <div>WW: {safeViewport.windowWidth}</div>
//         <div>WC: {safeViewport.windowCenter}</div>
//         <div>Zoom: {safeViewport.zoom?.toFixed(1) || '1.0'}x</div>
//         <div className="mv-info-row">
//           <Calendar size={12} />
//           <span>{safePatientInfo.studyDate}</span>
//         </div>
//         {imageTransform && (
//           <>
//             <div>밝기: {Math.round(imageTransform.brightness)}%</div>
//             <div>대비: {Math.round(imageTransform.contrast)}%</div>
//             {imageTransform.rotation !== 0 && (
//               <div>회전: {imageTransform.rotation}°</div>
//             )}
//             {(imageTransform.flipH || imageTransform.flipV) && (
//               <div>플립: {imageTransform.flipH ? 'H' : ''}{imageTransform.flipV ? 'V' : ''}</div>
//             )}
//             {imageTransform.invert && (
//               <div>반전: ON</div>
//             )}
//           </>
//         )}
//         {manualAnnotations && manualAnnotations.length > 0 && (
//           <div className="mv-label-stats">🏷️ 라벨: {manualAnnotations.length}개</div>
//         )}
//         {annotationBoxes && annotationBoxes.length > 0 && (
//           <div className="mv-django-stats">🔗 Django: {annotationBoxes.length}개</div>
//         )}
//       </div>

//       {/* 도구 도움말 */}
//       {selectedTool && !isEditMode && (
//         <div className="mv-tool-help">
//           {selectedTool === 'wwwc' && '마우스 드래그: Window/Level 조절'}
//           {selectedTool === 'zoom' && '마우스 드래그: 확대/축소 | 휠: 빠른 확대/축소'}
//           {selectedTool === 'pan' && '마우스 드래그: 이미지 이동'}
//           {selectedTool === 'length' && '클릭 드래그: 길이 측정'}
//           {selectedTool === 'rectangle' && '클릭 드래그: 사각형 ROI'}
//           {selectedTool === 'circle' && '클릭 드래그: 원형 ROI'}
//         </div>
//       )}

//       {isEditMode && (
//         <div className="mv-edit-help">
//           📝 편집 모드: 핸들을 드래그해서 크기와 위치를 조정하세요
//         </div>
//       )}

//       {highlightedMeasurementId && (
//         <div className="mv-highlight-help">
//           🎯 측정값과 라벨이 깜빡이고 있습니다 (3초간)
//         </div>
//       )}

//       {allMeasurementsHidden && (
//         <div className="mv-all-hidden-help">
//           👁️ 모든 측정값과 어노테이션이 숨겨져 있습니다
//         </div>
//       )}

//       {/* 컨텍스트 메뉴 */}
//       {contextMenu && (
//         <div 
//           className="mv-context-menu"
//           style={{
//             position: 'fixed',
//             left: contextMenu.x,
//             top: contextMenu.y,
//             zIndex: 1000
//           }}
//         >
//           {(selectedMeasurementForMenu?.source === 'django' && selectedMeasurementForMenu?.djangoData?.label) || 
//            findLabelForMeasurement(selectedMeasurementForMenu?.id) ? (
//             <div className="mv-context-menu-item" onClick={handleEditLabel}>
//               ✏️ 라벨 편집
//             </div>
//           ) : (
//             <div className="mv-context-menu-item" onClick={handleLabelMeasurement}>
//               🏷️ 라벨 추가
//             </div>
//           )}
          
//           {selectedMeasurementForMenu?.source !== 'django' && (
//             <div className="mv-context-menu-item" onClick={handleEditCoordinates}>
//               📍 좌표 편집
//             </div>
//           )}
          
//           <div className="mv-context-menu-item" onClick={handleDeleteMeasurement}>
//             ❌ 삭제하기
//           </div>
//         </div>
//       )}

//       {/* 라벨링 모달들 */}
//       <Modal
//         isOpen={isLabelingModalOpen}
//         onClose={handleCloseLabeling}
//         title="🏷️ 라벨링 추가"
//         size="medium"
//       >
//         <LabelingForm
//           measurement={measurementToLabel}
//           currentSlice={currentSlice}
//           onSave={handleSaveLabeling}
//           onCancel={handleCloseLabeling}
//         />
//       </Modal>

//       <LabelingEditModal
//         isOpen={isLabelEditModalOpen}
//         onClose={handleCloseLabelEdit}
//         onSave={handleSaveLabelEdit}
//         annotation={annotationToEdit}
//       />

//       {!currentImageUrl && (
//         <div className="mv-loading-overlay">
//           <div className="mv-loading-message">
//             <div className="mv-loading-spinner"></div>
//             <div>DICOM 이미지 로딩 중...</div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DicomViewer;

// /home/medical_system/pacsapp/src/components/viewer_v2/Viewer/DicomViewer.js - 완전한 전체 코드
// /home/medical_system/pacsapp/src/components/viewer_v2/Viewer/DicomViewer.js - 수동 주석 좌표변환 제거

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stethoscope, Calendar, EyeOff } from 'lucide-react';
import Modal from '../Common/Modal';
import LabelingForm from '../Common/LabelingForm';
import LabelingEditModal from '../Common/LabelingEditModal';
import './DicomViewer.css';

const DicomViewer = ({ 
  selectedTool = 'wwwc', 
  currentSlice = 1, 
  totalSlices = 1, 
  aiResults = {}, 
  patientInfo = {}, 
  viewport = {},
  currentImageUrl,
  imageIds,
  viewportSettings,
  imageTransform,
  getImageStyle,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  measurements = [],
  currentMeasurement,
  editingMeasurement,
  isEditMode,
  startEditMode,
  stopEditMode,
  onDeleteMeasurement,
  onAddManualAnnotation,
  onEditManualAnnotation,
  setActiveRightPanel,
  highlightedMeasurementId,
  onHighlightMeasurement,
  manualAnnotations = [],
  addMeasurementToAnnotations,
  annotationBoxes = [],
  allMeasurementsHidden = false,
  onImageDisplayInfoChange
}) => {
  const modelColors = {
    yolov8: '#3b82f6',
    ssd: '#ef4444', 
    simclr: '#22c55e'
  };

  const imageRef = useRef(null);
  const [imageDisplayInfo, setImageDisplayInfo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMeasurementForMenu, setSelectedMeasurementForMenu] = useState(null);
  const [isLabelingModalOpen, setIsLabelingModalOpen] = useState(false);
  const [measurementToLabel, setMeasurementToLabel] = useState(null);
  const [isLabelEditModalOpen, setIsLabelEditModalOpen] = useState(false);
  const [annotationToEdit, setAnnotationToEdit] = useState(null);

  const safePatientInfo = {
    name: '샘플 환자',
    id: 'SAMPLE-001',
    studyDate: '2024.12.15',
    ...patientInfo
  };

  const safeViewport = {
    windowWidth: 400,
    windowCenter: 40,
    zoom: 1.0,
    ...viewport,
    ...viewportSettings
  };

  const safeAiResults = aiResults || {};

  console.log('🖼️ DicomViewer - manualAnnotations:', manualAnnotations?.length || 0);
  console.log('🖼️ DicomViewer - annotationBoxes:', annotationBoxes?.length || 0);
  console.log('🎯 DicomViewer - highlightedMeasurementId:', highlightedMeasurementId);
  console.log('👁️ DicomViewer - allMeasurementsHidden:', allMeasurementsHidden);
  console.log('🤖 DicomViewer - safeAiResults:', safeAiResults);
  console.log('📐 DicomViewer - imageDisplayInfo:', imageDisplayInfo);

  const measureImageDisplay = useCallback(() => {
    if (!imageRef.current) {
      console.warn('⚠️ imageRef.current가 없어서 이미지 크기 측정 불가');
      return;
    }
    
    const img = imageRef.current;
    const container = img.parentElement;
    
    if (!container) {
      console.warn('⚠️ container가 없어서 이미지 크기 측정 불가');
      return;
    }
    
    console.log('📐 이미지 크기 측정 시작');
    console.log('원본 크기:', img.naturalWidth, 'x', img.naturalHeight);
    console.log('컨테이너 크기:', container.clientWidth, 'x', container.clientHeight);
    
    const containerAspect = container.clientWidth / container.clientHeight;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    
    if (imageAspect > containerAspect) {
      displayWidth = container.clientWidth;
      displayHeight = container.clientWidth / imageAspect;
      offsetX = 0;
      offsetY = (container.clientHeight - displayHeight) / 2;
    } else {
      displayHeight = container.clientHeight;
      displayWidth = container.clientHeight * imageAspect;
      offsetX = (container.clientWidth - displayWidth) / 2;
      offsetY = 0;
    }
    
    const scaleX = displayWidth / img.naturalWidth;
    const scaleY = displayHeight / img.naturalHeight;
    
    const displayInfo = {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
      scaleX,
      scaleY
    };
    
    console.log('📐 측정 결과:', displayInfo);
    setImageDisplayInfo(displayInfo);
    
    if (onImageDisplayInfoChange) {
      console.log('🔄 Layout으로 이미지 표시 정보 전달:', displayInfo);
      onImageDisplayInfoChange(displayInfo);
    } else {
      console.warn('⚠️ onImageDisplayInfoChange 콜백이 없음!');
    }
  }, [onImageDisplayInfoChange]);

  const handleImageLoad = useCallback(() => {
    console.log('🖼️ 이미지 로드 완료 - 크기 측정 시작');
    setTimeout(() => {
      measureImageDisplay();
    }, 50);
  }, [measureImageDisplay]);

  useEffect(() => {
    const handleResize = () => {
      if (imageDisplayInfo) {
        console.log('🔄 창 크기 변경 감지 - 재측정');
        measureImageDisplay();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageDisplayInfo, measureImageDisplay]);

  useEffect(() => {
    if (imageDisplayInfo && imageTransform) {
      console.log('🔄 이미지 변환 감지 - 재측정 시작:', imageTransform);
      const timer = setTimeout(() => {
        measureImageDisplay();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [imageTransform?.zoom, imageTransform?.panX, imageTransform?.panY, imageTransform?.rotation, imageTransform?.flipH, imageTransform?.flipV, measureImageDisplay, imageDisplayInfo]);

  useEffect(() => {
    if (currentImageUrl && imageRef.current) {
      console.log('🔄 이미지 URL 변경 감지 - 재측정 준비');
    }
  }, [currentImageUrl]);

  // 🔥 AI 전용 bbox 변환 함수 (기존 방식 그대로)
  const transformBboxCoordinates = useCallback((bbox, originalWidth, originalHeight) => {
    if (!imageDisplayInfo) {
      console.warn('⚠️ AI bbox 변환: 이미지 표시 정보가 없음');
      return bbox;
    }

    console.log('🤖 AI bbox 변환 시작:', { bbox, originalWidth, originalHeight });
    console.log('📐 AI 변환 정보:', imageDisplayInfo);
    console.log('🎛️ 이미지 변환:', imageTransform);

    const scaleX = imageDisplayInfo.displayWidth / originalWidth;
    const scaleY = imageDisplayInfo.displayHeight / originalHeight;

    const zoomFactor = imageTransform?.zoom || 1;
    const panX = imageTransform?.panX || 0;
    const panY = imageTransform?.panY || 0;
    const rotation = imageTransform?.rotation || 0;
    const flipH = imageTransform?.flipH || false;
    const flipV = imageTransform?.flipV || false;

    let transformedBbox;

    if (Array.isArray(bbox)) {
      transformedBbox = [
        bbox[0] * scaleX * zoomFactor + imageDisplayInfo.offsetX + panX,
        bbox[1] * scaleY * zoomFactor + imageDisplayInfo.offsetY + panY,
        bbox[2] * scaleX * zoomFactor + imageDisplayInfo.offsetX + panX,
        bbox[3] * scaleY * zoomFactor + imageDisplayInfo.offsetY + panY
      ];

      if (flipH || flipV) {
        const centerX = imageDisplayInfo.containerWidth / 2;
        const centerY = imageDisplayInfo.containerHeight / 2;
        
        if (flipH) {
          transformedBbox[0] = 2 * centerX - transformedBbox[0];
          transformedBbox[2] = 2 * centerX - transformedBbox[2];
          [transformedBbox[0], transformedBbox[2]] = [transformedBbox[2], transformedBbox[0]];
        }
        
        if (flipV) {
          transformedBbox[1] = 2 * centerY - transformedBbox[1];
          transformedBbox[3] = 2 * centerY - transformedBbox[3];
          [transformedBbox[1], transformedBbox[3]] = [transformedBbox[3], transformedBbox[1]];
        }
      }

      if (rotation !== 0 && rotation % 90 === 0) {
        const centerX = imageDisplayInfo.containerWidth / 2;
        const centerY = imageDisplayInfo.containerHeight / 2;
        const rotationCount = Math.abs(rotation / 90) % 4;
        
        for (let i = 0; i < rotationCount; i++) {
          const x1 = transformedBbox[0] - centerX;
          const y1 = transformedBbox[1] - centerY;
          const x2 = transformedBbox[2] - centerX;
          const y2 = transformedBbox[3] - centerY;
          
          if (rotation > 0) {
            transformedBbox = [
              centerX - y1,
              centerY + x1,
              centerX - y2,
              centerY + x2
            ];
          } else {
            transformedBbox = [
              centerX + y1,
              centerY - x1,
              centerX + y2,
              centerY - x2
            ];
          }
        }
      }

    } else if (bbox && typeof bbox === 'object') {
      transformedBbox = {
        x: bbox.x * scaleX * zoomFactor + imageDisplayInfo.offsetX + panX,
        y: bbox.y * scaleY * zoomFactor + imageDisplayInfo.offsetY + panY,
        width: bbox.width * scaleX * zoomFactor,
        height: bbox.height * scaleY * zoomFactor
      };

      const arrayBbox = [transformedBbox.x, transformedBbox.y, 
                        transformedBbox.x + transformedBbox.width, 
                        transformedBbox.y + transformedBbox.height];
      const processedArray = transformBboxCoordinates(arrayBbox, 1, 1);
      
      transformedBbox = {
        x: Math.min(processedArray[0], processedArray[2]),
        y: Math.min(processedArray[1], processedArray[3]),
        width: Math.abs(processedArray[2] - processedArray[0]),
        height: Math.abs(processedArray[3] - processedArray[1])
      };
    } else {
      console.warn('❌ 알 수 없는 AI bbox 형태:', bbox);
      return bbox;
    }

    console.log('✅ AI bbox 변환 완료:', transformedBbox);
    return transformedBbox;
  }, [imageDisplayInfo, imageTransform]);

  // 🎯 수정: 수동 주석은 좌표 변환 없이 그대로 사용
  const convertDjangoAnnotationsToMeasurements = () => {
    if (!annotationBoxes || !Array.isArray(annotationBoxes)) {
      return [];
    }
    
    console.log('🔄 Django 어노테이션 → 측정값 변환 시작:', annotationBoxes.length);
    
    return annotationBoxes
      .filter(annotation => annotation.coordinates && annotation.shape_type)
      .map(annotation => {
        let startPoint, endPoint, centerPoint, radius;
        
        console.log(`🔄 어노테이션 ${annotation.id} 변환:`, annotation.shape_type, annotation.coordinates);
        
        const correspondingMeasurement = measurements.find(m => 
          m.id === `django-${annotation.id}` || m.measurementId === `django-${annotation.id}`
        );
        const isVisible = correspondingMeasurement ? (correspondingMeasurement.visible !== false) : true;
        
        console.log(`👁️ 어노테이션 ${annotation.id} visible 상태:`, isVisible);
        
        const originalWidth = annotation.image_width || 2985;
        const originalHeight = annotation.image_height || 2985;
        
        console.log(`📐 원본 이미지 크기: ${originalWidth} x ${originalHeight}`);
        
        // 🎯 핵심 수정: 수동 주석과 Django 어노테이션 구분 처리
        let transformedCoords;
        
        if (annotation.source === 'manual') {
          console.log('🎯 수동 주석 - 좌표 변환 없이 그대로 사용');
          transformedCoords = annotation.coordinates;
        } else if (annotation.source === 'ai') {
          console.log('🤖 AI 결과 - 좌표 변환 시작');
          transformedCoords = transformBboxCoordinates(
            annotation.coordinates,
            originalWidth,
            originalHeight
          );
        } else {
          // Django 어노테이션은 이미 화면 좌표계
          console.log('🏷️ Django 어노테이션 - 좌표 변환 없이 사용');
          transformedCoords = annotation.coordinates; // ✅ 변환 안 함!
        }
        
        console.log(`✅ 좌표 처리: ${annotation.coordinates} → ${transformedCoords}`);
        
        switch (annotation.shape_type) {
          case 'line':
            if (Array.isArray(transformedCoords) && transformedCoords.length >= 4) {
              startPoint = { x: transformedCoords[0], y: transformedCoords[1] };
              endPoint = { x: transformedCoords[2], y: transformedCoords[3] };
            } else {
              console.warn('❌ line 좌표 변환 실패:', transformedCoords);
              startPoint = { x: annotation.coordinates[0], y: annotation.coordinates[1] };
              endPoint = { x: annotation.coordinates[2], y: annotation.coordinates[3] };
            }
            
            const length = Math.sqrt(
              Math.pow(endPoint.x - startPoint.x, 2) + 
              Math.pow(endPoint.y - startPoint.y, 2)
            );
            
            console.log(`📏 line 측정값: 길이=${length.toFixed(1)}mm`);
            
            return {
              id: `django-${annotation.id}`,
              type: 'length',
              startPoint,
              endPoint,
              value: `${length.toFixed(1)} mm`,
              isComplete: true,
              visible: isVisible,
              source: 'django',
              djangoData: annotation
            };
            
          case 'rectangle':
            if (Array.isArray(transformedCoords) && transformedCoords.length >= 4) {
              startPoint = { x: transformedCoords[0], y: transformedCoords[1] };
              endPoint = { 
                x: transformedCoords[0] + transformedCoords[2], 
                y: transformedCoords[1] + transformedCoords[3] 
              };
            } else {
              console.warn('❌ rectangle 좌표 변환 실패:', transformedCoords);
              startPoint = { x: annotation.coordinates[0], y: annotation.coordinates[1] };
              endPoint = { 
                x: annotation.coordinates[0] + annotation.coordinates[2], 
                y: annotation.coordinates[1] + annotation.coordinates[3] 
              };
            }
            
            const area = Math.abs(endPoint.x - startPoint.x) * Math.abs(endPoint.y - startPoint.y);
            
            console.log(`📐 rectangle 측정값: 면적=${area.toFixed(1)}mm²`);
            
            return {
              id: `django-${annotation.id}`,
              type: 'rectangle',
              startPoint,
              endPoint,
              value: `면적: ${area.toFixed(1)} mm²`,
              isComplete: true,
              visible: isVisible,
              source: 'django',
              djangoData: annotation
            };
            
          case 'circle':
            if (Array.isArray(transformedCoords) && transformedCoords.length >= 3) {
              centerPoint = { x: transformedCoords[0], y: transformedCoords[1] };
              radius = transformedCoords[2];
              endPoint = { x: centerPoint.x + radius, y: centerPoint.y };
            } else {
              console.warn('❌ circle 좌표 변환 실패:', transformedCoords);
              centerPoint = { x: annotation.coordinates[0], y: annotation.coordinates[1] };
              radius = annotation.coordinates[2];
              endPoint = { x: centerPoint.x + radius, y: centerPoint.y };
            }
            
            const circleArea = Math.PI * radius * radius;
            
            console.log(`🔵 circle 측정값: 반지름=${radius.toFixed(1)}mm, 면적=${circleArea.toFixed(1)}mm²`);
            
            return {
              id: `django-${annotation.id}`,
              type: 'circle',
              startPoint: centerPoint,
              endPoint: endPoint,
              centerPoint,
              radius,
              value: `면적: ${circleArea.toFixed(1)} mm²`,
              isComplete: true,
              visible: isVisible,
              source: 'django',
              djangoData: annotation
            };
            
          default:
            console.warn('❌ 알 수 없는 shape_type:', annotation.shape_type);
            return null;
        }
      })
      .filter(Boolean);
  };

  const handleMouseDownWrapper = (event) => {
    if (event.button === 2) {
      console.log('🖱️ DicomViewer - 우클릭 감지 - 측정 시작 차단');
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    if (onMouseDown) {
      onMouseDown(event);
    }
  };

  const handleContextMenu = (event, measurement) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onMouseUp) {
      onMouseUp(event);
    }
    
    const viewportX = event.clientX;
    const viewportY = event.clientY;
    
    const menuWidth = 180;
    const menuHeight = 160;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let x = viewportX;
    let y = viewportY;
    
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }
    
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setContextMenu({ x, y });
    setSelectedMeasurementForMenu(measurement);
    console.log('🖱️ 우클릭 컨텍스트 메뉴:', measurement.id, `위치: (${x}, ${y})`);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedMeasurementForMenu(null);
  };

  const handleEditCoordinates = () => {
    if (selectedMeasurementForMenu && startEditMode) {
      console.log('📍 좌표 편집 모드 시작:', selectedMeasurementForMenu.id);
      startEditMode(selectedMeasurementForMenu.id);
      handleCloseContextMenu();
    }
  };

  const findLabelForMeasurement = (measurementId) => {
    const measurement = measurements.find(m => m.id === measurementId);
    if (measurement && measurement.source === 'django' && measurement.djangoData) {
      return {
        id: measurement.djangoData.id,
        label: measurement.djangoData.label,
        memo: measurement.djangoData.dr_text || '',
        measurementId: measurementId,
        type: measurement.type,
        value: measurement.value,
        slice: currentSlice,
        coords: `shape: ${measurement.djangoData.shape_type}`,
        doctor: measurement.djangoData.doctor_name || '미지정',
        timestamp: measurement.djangoData.created
      };
    }
    
    const found = manualAnnotations.find(annotation => 
      annotation.measurementId === measurementId
    );
    console.log(`🔍 측정값 ${measurementId}에 연결된 라벨:`, found?.label || 'none');
    return found;
  };

  const handleEditLabel = () => {
    if (selectedMeasurementForMenu) {
      console.log('🔍 선택된 측정값:', selectedMeasurementForMenu);
      console.log('🔍 전체 manualAnnotations:', manualAnnotations);
      
      if (selectedMeasurementForMenu.source === 'django' && selectedMeasurementForMenu.djangoData) {
        const djangoAnnotation = {
          id: selectedMeasurementForMenu.djangoData.id,
          label: selectedMeasurementForMenu.djangoData.label,
          memo: selectedMeasurementForMenu.djangoData.dr_text || '',
          type: selectedMeasurementForMenu.type,
          value: selectedMeasurementForMenu.value,
          slice: currentSlice,
          coords: `shape: ${selectedMeasurementForMenu.djangoData.shape_type}`,
          doctor: selectedMeasurementForMenu.djangoData.doctor_name || '미지정',
          timestamp: selectedMeasurementForMenu.djangoData.created,
          measurementId: selectedMeasurementForMenu.id,
          _original: selectedMeasurementForMenu.djangoData
        };
        
        console.log('✅ Django 어노테이션 데이터:', djangoAnnotation);
        setAnnotationToEdit(djangoAnnotation);
        setIsLabelEditModalOpen(true);
      } else {
        const linkedAnnotation = findLabelForMeasurement(selectedMeasurementForMenu.id);
        console.log('🔍 찾은 annotation:', linkedAnnotation);
        
        if (linkedAnnotation) {
          console.log('✅ annotation 데이터 확인:', {
            type: linkedAnnotation.type,
            value: linkedAnnotation.value,
            slice: linkedAnnotation.slice,
            coords: linkedAnnotation.coords,
            label: linkedAnnotation.label,
            memo: linkedAnnotation.memo
          });
          
          setAnnotationToEdit(linkedAnnotation);
          setIsLabelEditModalOpen(true);
        } else {
          console.error('❌ linkedAnnotation이 null입니다!');
          setMeasurementToLabel(selectedMeasurementForMenu);
          setIsLabelingModalOpen(true);
        }
      }
      
      handleCloseContextMenu();
    }
  };

  const handleDeleteMeasurement = () => {
    if (selectedMeasurementForMenu && onDeleteMeasurement) {
      onDeleteMeasurement(selectedMeasurementForMenu.id);
      handleCloseContextMenu();
    }
  };

  const handleLabelMeasurement = () => {
    if (selectedMeasurementForMenu) {
      console.log('🏷️ 라벨링 시작:', selectedMeasurementForMenu.id);
      setMeasurementToLabel(selectedMeasurementForMenu);
      setIsLabelingModalOpen(true);
      handleCloseContextMenu();
    }
  };

  const handleSaveLabeling = async (annotationData) => {
    console.log('💾 DicomViewer - 라벨링 저장 시작:', annotationData);
    console.log('📏 DicomViewer - 측정값 정보:', measurementToLabel);
    console.log('📐 DicomViewer - 현재 이미지 표시 정보:', imageDisplayInfo);
    
    if (onAddManualAnnotation) {
      console.log('✅ DicomViewer - onAddManualAnnotation 호출 (좌표변환없음)');
      await onAddManualAnnotation(annotationData);
    } else {
      console.error('❌ DicomViewer - onAddManualAnnotation prop이 없음!');
    }
    
    if (setActiveRightPanel) {
      console.log('🔄 DicomViewer - 오른쪽 패널을 manual-annotations로 전환');
      setActiveRightPanel('manual-annotations');
    } else {
      console.error('❌ DicomViewer - setActiveRightPanel prop이 없음!');
    }
    
    setIsLabelingModalOpen(false);
    setMeasurementToLabel(null);
  };

  const handleSaveLabelEdit = async (updatedAnnotation) => {
    console.log('✏️ DicomViewer - 라벨 편집 저장:', updatedAnnotation);
    
    if (onEditManualAnnotation) {
      await onEditManualAnnotation(updatedAnnotation);
    } else {
      console.error('❌ DicomViewer - onEditManualAnnotation prop이 없음!');
    }
    
    setIsLabelEditModalOpen(false);
    setAnnotationToEdit(null);
  };

  const handleCloseLabeling = () => {
    setIsLabelingModalOpen(false);
    setMeasurementToLabel(null);
  };

  const handleCloseLabelEdit = () => {
    setIsLabelEditModalOpen(false);
    setAnnotationToEdit(null);
  };

  const handleClick = () => {
    if (contextMenu) {
      handleCloseContextMenu();
    }
  };

  const getOriginalColor = (type) => {
    switch (type) {
      case 'length': return '#fbbf24';
      case 'rectangle': return '#22c55e';
      case 'circle': return '#a78bfa';
      default: return '#64748b';
    }
  };

  const renderEditHandles = (measurement) => {
    if (!isEditMode || editingMeasurement?.id !== measurement.id) return null;

    const handles = [];
    const handleSize = 8;
    const handleColor = '#ffffff';
    const handleStroke = '#3b82f6';
    const handleStrokeWidth = 2;

    switch (measurement.type) {
      case 'length':
        handles.push(
          <circle
            key="start"
            cx={measurement.startPoint.x}
            cy={measurement.startPoint.y}
            r={handleSize}
            fill={handleColor}
            stroke={handleStroke}
            strokeWidth={handleStrokeWidth}
            style={{ cursor: 'grab' }}
          />
        );
        
        handles.push(
          <circle
            key="end"
            cx={measurement.endPoint.x}
            cy={measurement.endPoint.y}
            r={handleSize}
            fill={handleColor}
            stroke={handleStroke}
            strokeWidth={handleStrokeWidth}
            style={{ cursor: 'grab' }}
          />
        );
        break;

      case 'rectangle':
        const rectX = Math.min(measurement.startPoint.x, measurement.endPoint.x);
        const rectY = Math.min(measurement.startPoint.y, measurement.endPoint.y);
        const rectW = Math.abs(measurement.endPoint.x - measurement.startPoint.x);
        const rectH = Math.abs(measurement.endPoint.y - measurement.startPoint.y);
        
        const corners = [
          { key: 'topLeft', x: rectX, y: rectY },
          { key: 'topRight', x: rectX + rectW, y: rectY },
          { key: 'bottomLeft', x: rectX, y: rectY + rectH },
          { key: 'bottomRight', x: rectX + rectW, y: rectY + rectH }
        ];
        
        corners.forEach(corner => {
          handles.push(
            <rect
              key={corner.key}
              x={corner.x - handleSize}
              y={corner.y - handleSize}
              width={handleSize * 2}
              height={handleSize * 2}
              fill={handleColor}
              stroke={handleStroke}
              strokeWidth={handleStrokeWidth}
              style={{ cursor: 'nw-resize' }}
            />
          );
        });
        
        handles.push(
          <circle
            key="center"
            cx={rectX + rectW / 2}
            cy={rectY + rectH / 2}
            r={handleSize}
            fill={handleColor}
            stroke={handleStroke}
            strokeWidth={handleStrokeWidth}
            style={{ cursor: 'move' }}
          />
        );
        break;

      case 'circle':
        handles.push(
          <circle
            key="center"
            cx={measurement.startPoint.x}
            cy={measurement.startPoint.y}
            r={handleSize}
            fill={handleColor}
            stroke={handleStroke}
            strokeWidth={handleStrokeWidth}
            style={{ cursor: 'move' }}
          />
        );
        
        handles.push(
          <circle
            key="radius"
            cx={measurement.endPoint.x}
            cy={measurement.endPoint.y}
            r={handleSize}
            fill={handleColor}
            stroke={handleStroke}
            strokeWidth={handleStrokeWidth}
            style={{ cursor: 'grab' }}
          />
        );
        break;
    }

    return handles;
  };

  // 🔥 AI 결과 렌더링 - 기존 방식 그대로 유지
  const renderAIResults = () => {
    if (allMeasurementsHidden) {
      console.log('👁️ 전체 숨기기 활성화 - AI 결과도 숨김');
      return [];
    }

    if (!safeAiResults || typeof safeAiResults !== 'object') {
      return [];
    }

    const aiElements = [];

    Object.entries(safeAiResults).forEach(([modelName, annotations]) => {
      if (!annotations || !Array.isArray(annotations)) return;

      annotations
        .filter(result => result && result.visible !== false)
        .forEach((result, idx) => {
          let bbox = result.bbox || result.coordinates;
          const originalWidth = result.image_width || 2985;
          const originalHeight = result.image_height || 2985;
          
          console.log('🔍 AI 결과 원본:', { bbox, originalWidth, originalHeight });
          
          let x1, y1, x2, y2;
          
          if (bbox && typeof bbox === 'object' && !Array.isArray(bbox)) {
            if (bbox.x !== undefined && bbox.y !== undefined && bbox.width !== undefined && bbox.height !== undefined) {
              bbox = [bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height];
            } else if (bbox.x1 !== undefined && bbox.y1 !== undefined && bbox.x2 !== undefined && bbox.y2 !== undefined) {
              bbox = [bbox.x1, bbox.y1, bbox.x2, bbox.y2];
            } else {
              console.warn('❌ AI 결과 bbox 객체 형태를 인식할 수 없음:', bbox);
              return;
            }
          } else if (Array.isArray(bbox) && bbox.length >= 4) {
            if (result.bbox_format === 'xywh' || (bbox.length === 4 && bbox[2] < bbox[0])) {
              bbox = [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]];
            }
          } else {
            console.warn('❌ AI 결과에 유효한 bbox가 없음:', result);
            return;
          }
          
          // 🔥 AI 결과는 transformBboxCoordinates 사용 (기존 방식)
          const transformedBbox = transformBboxCoordinates(bbox, originalWidth, originalHeight);
          
          if (Array.isArray(transformedBbox)) {
            x1 = transformedBbox[0];
            y1 = transformedBbox[1];
            x2 = transformedBbox[2];
            y2 = transformedBbox[3];
          } else {
            console.warn('❌ AI bbox 변환 실패:', transformedBbox);
            return;
          }
          
          console.log('✅ AI bbox 변환 완료:', {x1, y1, x2, y2});

          const width = Math.abs(x2 - x1);
          const height = Math.abs(y2 - y1);
          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;

          const color = modelColors[modelName] || '#64748b';
          const confidence = result.confidence || result.score || 0;
          const label = result.label || result.class_name || 'Unknown';
          
          const confidencePercent = confidence > 1 ? confidence : Math.round(confidence * 100);

          const key = `ai-${modelName}-${result.id || idx}`;

          aiElements.push(
            <g key={key}>
              <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2)}
                width={width}
                height={height}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="3,3"
                style={{ 
                  pointerEvents: 'auto'
                }}
              />
              
              <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2) - 25}
                width={Math.max(80, label.length * 8 + 30)}
                height="20"
                fill={color}
                fillOpacity="0.9"
                rx="3"
              />
              
              <text
                x={Math.min(x1, x2) + 5}
                y={Math.min(y1, y2) - 10}
                fill="white"
                fontSize="11"
                fontWeight="600"
                style={{ 
                  textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                  pointerEvents: 'none'
                }}
              >
                🤖 {label} ({confidencePercent}%)
              </text>

              <text
                x={centerX}
                y={Math.max(y1, y2) + 15}
                fill={color}
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
                style={{ 
                  textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                  pointerEvents: 'none'
                }}
              >
                [{modelName.toUpperCase()}]
              </text>
              
              <circle cx={x1} cy={y1} r="3" fill={color} />
              <circle cx={x2} cy={y1} r="3" fill={color} />
              <circle cx={x1} cy={y2} r="3" fill={color} />
              <circle cx={x2} cy={y2} r="3" fill={color} />
            </g>
          );
        });
    });

    return aiElements;
  };

  const renderMeasurements = () => {
    if (allMeasurementsHidden) {
      console.log('👁️ 전체 숨기기 활성화 - 모든 측정값과 어노테이션 숨김');
      return [];
    }

    const localMeasurements = [...(measurements || [])];
    const djangoMeasurements = convertDjangoAnnotationsToMeasurements();
    
    const allMeasurements = [...localMeasurements, ...djangoMeasurements];
    
    if (currentMeasurement) {
      allMeasurements.push(currentMeasurement);
    }

    console.log('🔍 렌더링할 측정값들:', allMeasurements.map(m => ({ 
      id: m.id, 
      visible: m.visible, 
      type: m.type,
      source: m.source,
      hasLabel: m.source === 'django' ? !!m.djangoData?.label : !!findLabelForMeasurement(m.id),
      isHighlighted: highlightedMeasurementId === m.id,
      allHidden: allMeasurementsHidden
    })));

    return allMeasurements
      .filter(measurement => {
        const isVisible = measurement.visible !== false;
        console.log(`📊 측정값 ${measurement.id} visible:`, measurement.visible, '→ 표시:', isVisible);
        return isVisible;
      })
      .map((measurement, index) => {
        const { id, type, startPoint, endPoint, value, isComplete } = measurement;
        const key = id || `temp-${index}`;
        
        const isEditing = isEditMode && editingMeasurement?.id === measurement.id;
        const isHighlighted = highlightedMeasurementId === measurement.id;
        
        let linkedLabel = null;
        if (measurement.source === 'django' && measurement.djangoData?.label) {
          linkedLabel = {
            label: measurement.djangoData.label,
            memo: measurement.djangoData.dr_text || ''
          };
        } else {
          linkedLabel = findLabelForMeasurement(measurement.id);
        }
        
        console.log(`🎯 측정값 ${measurement.id} - 하이라이트:`, isHighlighted, '라벨:', linkedLabel?.label || 'none', 'source:', measurement.source);
        
        const strokeColor = isEditing ? '#3b82f6' : 
                           isHighlighted ? '#f59e0b' : 
                           getOriginalColor(type);
        const strokeWidth = isEditing ? 3 : isHighlighted ? 3 : 2;
        
        let measurementElement = null;
        
        switch (type) {
          case 'length':
            measurementElement = (
              <g key={key}>
                <line
                  x1={startPoint.x}
                  y1={startPoint.y}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isComplete ? "none" : "5,5"}
                  style={{ 
                    cursor: isComplete ? 'context-menu' : 'default',
                    pointerEvents: isComplete ? 'auto' : 'none'
                  }}
                  onContextMenu={(e) => isComplete && handleContextMenu(e, measurement)}
                />
                <circle cx={startPoint.x} cy={startPoint.y} r="4" fill={strokeColor} />
                <circle cx={endPoint.x} cy={endPoint.y} r="4" fill={strokeColor} />
                
                {isComplete && value && (
                  <text
                    x={(startPoint.x + endPoint.x) / 2}
                    y={(startPoint.y + endPoint.y) / 2 - 10}
                    fill={strokeColor}
                    fontSize="12"
                    fontWeight={isEditing ? "bold" : "normal"}
                    textAnchor="middle"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
                      cursor: 'context-menu',
                      pointerEvents: 'auto'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, measurement)}
                    className={isHighlighted ? 'mv-measurement-highlight' : ''}
                  >
                    {value}
                  </text>
                )}
                
                {isComplete && linkedLabel && (
                  <text
                    x={(startPoint.x + endPoint.x) / 2}
                    y={(startPoint.y + endPoint.y) / 2 + 15}
                    fill="#22c55e"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      cursor: 'context-menu',
                      pointerEvents: 'auto'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, measurement)}
                    className={isHighlighted ? 'mv-label-highlight' : ''}
                  >
                    🏷️ "{linkedLabel.label}"
                  </text>
                )}
                
                {renderEditHandles(measurement)}
              </g>
            );
            break;

          case 'rectangle':
            const rectWidth = Math.abs(endPoint.x - startPoint.x);
            const rectHeight = Math.abs(endPoint.y - startPoint.y);
            const rectX = Math.min(startPoint.x, endPoint.x);
            const rectY = Math.min(startPoint.y, endPoint.y);
            
            measurementElement = (
              <g key={key}>
                <rect
                  x={rectX}
                  y={rectY}
                  width={rectWidth}
                  height={rectHeight}
                  fill={isEditing ? "rgba(59, 130, 246, 0.3)" : "rgba(34, 197, 94, 0.2)"}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isComplete ? "none" : "5,5"}
                  style={{ 
                    cursor: isComplete ? 'context-menu' : 'default',
                    pointerEvents: isComplete ? 'auto' : 'none'
                  }}
                  onContextMenu={(e) => isComplete && handleContextMenu(e, measurement)}
                />
                
                {isComplete && value && (
                  <text
                    x={rectX + rectWidth / 2}
                    y={rectY + rectHeight / 2}
                    fill={strokeColor}
                    fontSize="12"
                    fontWeight={isEditing ? "bold" : "normal"}
                    textAnchor="middle"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
                      cursor: 'context-menu',
                      pointerEvents: 'auto'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, measurement)}
                    className={isHighlighted ? 'mv-measurement-highlight' : ''}
                  >
                    {value}
                  </text>
                )}
                
                {isComplete && linkedLabel && (
                  <text
                    x={rectX + rectWidth / 2}
                    y={rectY + rectHeight + 20}
                    fill="#22c55e"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      cursor: 'context-menu',
                      pointerEvents: 'auto'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, measurement)}
                    className={isHighlighted ? 'mv-label-highlight' : ''}
                  >
                    🏷️ "{linkedLabel.label}"
                  </text>
                )}
                
                {renderEditHandles(measurement)}
              </g>
            );
            break;

          case 'circle':
            const radius = Math.sqrt(
              Math.pow(endPoint.x - startPoint.x, 2) + 
              Math.pow(endPoint.y - startPoint.y, 2)
            );
            
            measurementElement = (
              <g key={key}>
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r={radius}
                  fill={isEditing ? "rgba(59, 130, 246, 0.3)" : "rgba(167, 139, 250, 0.2)"}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isComplete ? "none" : "5,5"}
                  style={{ 
                    cursor: isComplete ? 'context-menu' : 'default',
                    pointerEvents: isComplete ? 'auto' : 'none'
                  }}
                  onContextMenu={(e) => isComplete && handleContextMenu(e, measurement)}
                />
                <circle cx={startPoint.x} cy={startPoint.y} r="4" fill={strokeColor} />
                
                {isComplete && value && (
                  <text
                    x={startPoint.x}
                    y={startPoint.y - radius - 15}
                    fill={strokeColor}
                    fontSize="12"
                    fontWeight={isEditing ? "bold" : "normal"}
                    textAnchor="middle"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
                      cursor: 'context-menu',
                      pointerEvents: 'auto'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, measurement)}
                    className={isHighlighted ? 'mv-measurement-highlight' : ''}
                  >
                    {value}
                  </text>
                )}
                
                {isComplete && linkedLabel && (
                  <text
                    x={startPoint.x}
                    y={startPoint.y + radius + 25}
                    fill="#22c55e"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      cursor: 'context-menu',
                      pointerEvents: 'auto'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, measurement)}
                    className={isHighlighted ? 'mv-label-highlight' : ''}
                  >
                    🏷️ "{linkedLabel.label}"
                  </text>
                )}
                
                {renderEditHandles(measurement)}
              </g>
            );
            break;

          default:
            measurementElement = null;
        }
        
        return measurementElement;
      });
  };

  return (
    <div className="mv-dicom-viewer">
      <div className="mv-medical-image">
        <div 
          className="mv-image-content"
          onMouseDown={handleMouseDownWrapper}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onWheel={onWheel}
          onClick={handleClick}
          onContextMenu={(e) => e.preventDefault()}
          style={{ 
            cursor: isEditMode ? 'default' :
                    selectedTool === 'wwwc' ? 'ew-resize' : 
                    selectedTool === 'zoom' ? 'zoom-in' :
                    selectedTool === 'pan' ? 'move' :
                    ['length', 'rectangle', 'circle'].includes(selectedTool) ? 'crosshair' : 'default' 
          }}
        >
          {currentImageUrl ? (
            <>
              <img 
                ref={imageRef}
                src={currentImageUrl}
                alt={`DICOM Image ${currentSlice}`}
                className="mv-dicom-image"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  ...getImageStyle(),
                  pointerEvents: 'none'
                }}
                onLoad={handleImageLoad}
                onError={(e) => {
                  console.error('❌ DICOM 이미지 로드 실패:', e.target.src);
                }}
                draggable={false}
              />
              
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                {renderMeasurements()}
                {renderAIResults()}
              </svg>
            </>
          ) : (
            <div className="mv-empty-image">
              <div className="mv-empty-image-icon">📋</div>
              <div>DICOM 이미지 없음</div>
              <div className="mv-empty-image-text">이미지를 선택해주세요</div>
            </div>
          )}
        </div>
      </div>

      <div className="mv-viewport-info mv-info-left">
        <div className="mv-info-row">
          <Stethoscope size={12} />
          <span>환자: {safePatientInfo.name}</span>
        </div>
        <div>ID: {safePatientInfo.id}</div>
        <div>Slice: {currentSlice}/{totalSlices}</div>
        <div>도구: {selectedTool.toUpperCase()}</div>
        {isEditMode && <div className="mv-edit-mode-indicator">편집 모드</div>}
        {imageTransform && (
          <div>Zoom: {imageTransform.zoom?.toFixed(1)}x</div>
        )}
        {highlightedMeasurementId && (
          <div className="mv-highlight-indicator">🎯 하이라이트 중</div>
        )}
        {allMeasurementsHidden && (
          <div className="mv-all-hidden-indicator">
            <EyeOff size={12} />
            <span>모든 측정값 숨김</span>
          </div>
        )}
        {imageDisplayInfo && (
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
            📐 {Math.round(imageDisplayInfo.displayWidth)}x{Math.round(imageDisplayInfo.displayHeight)}
            (비율: {imageDisplayInfo.scaleX.toFixed(2)})
          </div>
        )}
      </div>

      <div className="mv-viewport-info mv-info-right">
        <div>WW: {safeViewport.windowWidth}</div>
        <div>WC: {safeViewport.windowCenter}</div>
        <div>Zoom: {safeViewport.zoom?.toFixed(1) || '1.0'}x</div>
        <div className="mv-info-row">
          <Calendar size={12} />
          <span>{safePatientInfo.studyDate}</span>
        </div>
        {imageTransform && (
          <>
            <div>밝기: {Math.round(imageTransform.brightness)}%</div>
            <div>대비: {Math.round(imageTransform.contrast)}%</div>
            {imageTransform.rotation !== 0 && (
              <div>회전: {imageTransform.rotation}°</div>
            )}
            {(imageTransform.flipH || imageTransform.flipV) && (
              <div>플립: {imageTransform.flipH ? 'H' : ''}{imageTransform.flipV ? 'V' : ''}</div>
            )}
            {imageTransform.invert && (
              <div>반전: ON</div>
            )}
          </>
        )}
        {manualAnnotations && manualAnnotations.length > 0 && (
          <div className="mv-label-stats">🏷️ 라벨: {manualAnnotations.length}개</div>
        )}
        {annotationBoxes && annotationBoxes.length > 0 && (
          <div className="mv-django-stats">🔗 Django: {annotationBoxes.length}개</div>
        )}
      </div>

      {selectedTool && !isEditMode && (
        <div className="mv-tool-help">
          {selectedTool === 'wwwc' && '마우스 드래그: Window/Level 조절'}
          {selectedTool === 'zoom' && '마우스 드래그: 확대/축소 | 휠: 빠른 확대/축소'}
          {selectedTool === 'pan' && '마우스 드래그: 이미지 이동'}
          {selectedTool === 'length' && '클릭 드래그: 길이 측정'}
          {selectedTool === 'rectangle' && '클릭 드래그: 사각형 ROI'}
          {selectedTool === 'circle' && '클릭 드래그: 원형 ROI'}
        </div>
      )}

      {isEditMode && (
        <div className="mv-edit-help">
          📝 편집 모드: 핸들을 드래그해서 크기와 위치를 조정하세요
        </div>
      )}

      {highlightedMeasurementId && (
        <div className="mv-highlight-help">
          🎯 측정값과 라벨이 깜빡이고 있습니다 (3초간)
        </div>
      )}

      {allMeasurementsHidden && (
        <div className="mv-all-hidden-help">
          👁️ 모든 측정값과 어노테이션이 숨겨져 있습니다
        </div>
      )}

      {contextMenu && (
        <div 
          className="mv-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
        >
          {(selectedMeasurementForMenu?.source === 'django' && selectedMeasurementForMenu?.djangoData?.label) || 
           findLabelForMeasurement(selectedMeasurementForMenu?.id) ? (
            <div className="mv-context-menu-item" onClick={handleEditLabel}>
              ✏️ 라벨 편집
            </div>
          ) : (
            <div className="mv-context-menu-item" onClick={handleLabelMeasurement}>
              🏷️ 라벨 추가
            </div>
          )}
          
          {selectedMeasurementForMenu?.source !== 'django' && (
            <div className="mv-context-menu-item" onClick={handleEditCoordinates}>
              📍 좌표 편집
            </div>
          )}
          
          <div className="mv-context-menu-item" onClick={handleDeleteMeasurement}>
            ❌ 삭제하기
          </div>
        </div>
      )}

      <Modal
        isOpen={isLabelingModalOpen}
        onClose={handleCloseLabeling}
        title="🏷️ 라벨링 추가"
        size="medium"
      >
        <LabelingForm
          measurement={measurementToLabel}
          currentSlice={currentSlice}
          onSave={handleSaveLabeling}
          onCancel={handleCloseLabeling}
        />
      </Modal>

      <LabelingEditModal
        isOpen={isLabelEditModalOpen}
        onClose={handleCloseLabelEdit}
        onSave={handleSaveLabelEdit}
        annotation={annotationToEdit}
      />

      {!currentImageUrl && (
        <div className="mv-loading-overlay">
          <div className="mv-loading-message">
            <div className="mv-loading-spinner"></div>
            <div>DICOM 이미지 로딩 중...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomViewer;