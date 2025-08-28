// // /home/medical_system/pacsapp/src/hooks/viewer_v2/useSimpleViewer.js

// import { useState, useCallback, useRef } from 'react';

// const useSimpleViewer = () => {
//   console.log('useSimpleViewer 호출됨');
  
//   // 기본 상태
//   const [selectedTool, setSelectedTool] = useState('wwwc');
//   const [isPlaying, setIsPlaying] = useState(false);
  
//   // 이미지 변환 상태
//   const [imageTransform, setImageTransform] = useState({
//     zoom: 1.0,
//     panX: 0,
//     panY: 0,
//     rotation: 0,
//     flipH: false,
//     flipV: false,
//     brightness: 100,
//     contrast: 100,
//     invert: false
//   });

//   // 드래그 상태
//   const [isDragging, setIsDragging] = useState(false);
//   const dragStartRef = useRef({ x: 0, y: 0 });
//   const initialTransformRef = useRef(null);
  
//   // 측정 상태
//   const [measurements, setMeasurements] = useState([]);
//   const [currentMeasurement, setCurrentMeasurement] = useState(null);

//   // 🔥 편집 상태 추가
//   const [editingMeasurement, setEditingMeasurement] = useState(null);
//   const [editingHandle, setEditingHandle] = useState(null);
//   const [isEditMode, setIsEditMode] = useState(false);

//   // 도구 변경
//   const changeTool = useCallback((toolId) => {
//     console.log('🔧 도구 변경:', toolId);
//     setSelectedTool(toolId);
    
//     // 편집 모드 종료
//     if (toolId !== 'edit') {
//       setEditingMeasurement(null);
//       setEditingHandle(null);
//       setIsEditMode(false);
//     }
//   }, []);

//   // 🔥 편집 모드 진입
//   const startEditMode = useCallback((measurementId) => {
//     console.log('📝 편집 모드 진입:', measurementId);
//     const measurement = measurements.find(m => m.id === measurementId);
//     if (measurement) {
//       setEditingMeasurement(measurement);
//       setIsEditMode(true);
//       setSelectedTool('edit');
//     }
//   }, [measurements]);

//   // 🔥 편집 모드 종료
//   const stopEditMode = useCallback(() => {
//     console.log('📝 편집 모드 종료');
//     setEditingMeasurement(null);
//     setEditingHandle(null);
//     setIsEditMode(false);
//     setSelectedTool('wwwc');
//   }, []);

//   // 🔥 핸들 클릭 감지
//   const getClickedHandle = useCallback((clickX, clickY, measurement) => {
//     const handleRadius = 8; // 핸들 클릭 감지 반경
    
//     switch (measurement.type) {
//       case 'length':
//         // 시작점, 끝점 체크
//         if (Math.abs(clickX - measurement.startPoint.x) < handleRadius && 
//             Math.abs(clickY - measurement.startPoint.y) < handleRadius) {
//           return 'start';
//         }
//         if (Math.abs(clickX - measurement.endPoint.x) < handleRadius && 
//             Math.abs(clickY - measurement.endPoint.y) < handleRadius) {
//           return 'end';
//         }
//         break;
        
//       case 'rectangle':
//         const rectX = Math.min(measurement.startPoint.x, measurement.endPoint.x);
//         const rectY = Math.min(measurement.startPoint.y, measurement.endPoint.y);
//         const rectW = Math.abs(measurement.endPoint.x - measurement.startPoint.x);
//         const rectH = Math.abs(measurement.endPoint.y - measurement.startPoint.y);
        
//         // 4개 모서리 + 중심 체크
//         if (Math.abs(clickX - rectX) < handleRadius && Math.abs(clickY - rectY) < handleRadius) return 'topLeft';
//         if (Math.abs(clickX - (rectX + rectW)) < handleRadius && Math.abs(clickY - rectY) < handleRadius) return 'topRight';
//         if (Math.abs(clickX - rectX) < handleRadius && Math.abs(clickY - (rectY + rectH)) < handleRadius) return 'bottomLeft';
//         if (Math.abs(clickX - (rectX + rectW)) < handleRadius && Math.abs(clickY - (rectY + rectH)) < handleRadius) return 'bottomRight';
        
//         // 전체 이동 (사각형 내부)
//         if (clickX > rectX && clickX < rectX + rectW && clickY > rectY && clickY < rectY + rectH) return 'move';
//         break;
        
//       case 'circle':
//         // 중심점
//         if (Math.abs(clickX - measurement.startPoint.x) < handleRadius && 
//             Math.abs(clickY - measurement.startPoint.y) < handleRadius) {
//           return 'center';
//         }
//         // 테두리점
//         if (Math.abs(clickX - measurement.endPoint.x) < handleRadius && 
//             Math.abs(clickY - measurement.endPoint.y) < handleRadius) {
//           return 'radius';
//         }
//         break;
//     }
    
//     return null;
//   }, []);

//   // 🔥 실제 Window/Level 조절
//   const adjustWindowLevel = useCallback((deltaX, deltaY) => {
//     setImageTransform(prev => {
//       const newBrightness = Math.max(10, Math.min(300, prev.brightness - deltaY * 0.5));
//       const newContrast = Math.max(10, Math.min(300, prev.contrast + deltaX * 0.5));
      
//       console.log(`🖼️ Window/Level: 밝기 ${newBrightness.toFixed(0)}%, 대비 ${newContrast.toFixed(0)}%`);
      
//       return {
//         ...prev,
//         brightness: newBrightness,
//         contrast: newContrast
//       };
//     });
//   }, []);

//   // 🔥 실제 Zoom 조절
//   const adjustZoom = useCallback((delta) => {
//     setImageTransform(prev => {
//       const newZoom = Math.max(0.1, Math.min(10.0, prev.zoom + delta));
//       console.log(`🔍 Zoom: ${newZoom.toFixed(2)}x`);
      
//       return { ...prev, zoom: newZoom };
//     });
//   }, []);

//   // 🔥 실제 Pan 조절
//   const adjustPan = useCallback((deltaX, deltaY) => {
//     setImageTransform(prev => {
//       const newPanX = prev.panX + deltaX;
//       const newPanY = prev.panY + deltaY;
      
//       console.log(`👆 Pan: X=${newPanX.toFixed(0)}, Y=${newPanY.toFixed(0)}`);
      
//       return {
//         ...prev,
//         panX: newPanX,
//         panY: newPanY
//       };
//     });
//   }, []);

//   // CSS 스타일 생성
//   const getImageStyle = useCallback(() => {
//     const { zoom, panX, panY, rotation, flipH, flipV, brightness, contrast, invert } = imageTransform;
    
//     const scaleX = flipH ? -zoom : zoom;
//     const scaleY = flipV ? -zoom : zoom;
    
//     return {
//       transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
//       filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
//       transition: isDragging ? 'none' : 'transform 0.2s ease-out, filter 0.1s ease-out',
//       transformOrigin: 'center center'
//     };
//   }, [imageTransform, isDragging]);

//   // 🔥 마우스 다운 이벤트 (편집 기능 추가)
//   const handleMouseDown = useCallback((event) => {
//     // 🔥 우클릭이면 무시
//     if (event.button === 2) { // 2 = 우클릭
//       console.log('🖱️ useSimpleViewer - 우클릭 차단');
//       event.preventDefault();
//       event.stopPropagation();
//       return;
//     }

//     console.log('🖱️ 마우스 다운 - 도구:', selectedTool, '버튼:', event.button);

//     const rect = event.currentTarget.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     // 🔥 편집 모드일 때 핸들 클릭 체크
//     if (isEditMode && editingMeasurement) {
//       const handle = getClickedHandle(x, y, editingMeasurement);
//       if (handle) {
//         console.log('🖱️ 핸들 클릭:', handle);
//         setEditingHandle(handle);
//         setIsDragging(true);
//         dragStartRef.current = { x, y };
//         return;
//       }
//     }
    
//     setIsDragging(true);
//     dragStartRef.current = { x, y };
//     initialTransformRef.current = { ...imageTransform };

//     // 측정 도구인 경우 (좌클릭만)
//     if (['length', 'rectangle', 'circle'].includes(selectedTool) && event.button === 0) {
//       const newMeasurement = {
//         id: Date.now(),
//         type: selectedTool,
//         startPoint: { x, y },
//         endPoint: { x, y },
//         isComplete: false,
//         visible: true
//       };
//       setCurrentMeasurement(newMeasurement);
//       console.log('📏 측정 시작:', selectedTool);
//     }
//   }, [selectedTool, imageTransform, isEditMode, editingMeasurement, getClickedHandle]);

//   // 🔥 마우스 무브 이벤트 (편집 기능 추가)
//   const handleMouseMove = useCallback((event) => {
//     if (!isDragging) return;

//     const rect = event.currentTarget.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;
//     const deltaX = x - dragStartRef.current.x;
//     const deltaY = y - dragStartRef.current.y;

//     // 🔥 편집 모드일 때 핸들 드래그
//     if (isEditMode && editingMeasurement && editingHandle) {
//       console.log('✏️ 핸들 드래그:', editingHandle, x, y);
      
//       const updatedMeasurement = { ...editingMeasurement };
      
//       switch (editingMeasurement.type) {
//         case 'length':
//           if (editingHandle === 'start') {
//             updatedMeasurement.startPoint = { x, y };
//           } else if (editingHandle === 'end') {
//             updatedMeasurement.endPoint = { x, y };
//           }
//           break;
          
//         case 'rectangle':
//           if (editingHandle === 'topLeft') {
//             updatedMeasurement.startPoint = { x, y };
//           } else if (editingHandle === 'bottomRight') {
//             updatedMeasurement.endPoint = { x, y };
//           } else if (editingHandle === 'topRight') {
//             updatedMeasurement.startPoint = { x: updatedMeasurement.startPoint.x, y };
//             updatedMeasurement.endPoint = { x, y: updatedMeasurement.endPoint.y };
//           } else if (editingHandle === 'bottomLeft') {
//             updatedMeasurement.startPoint = { x, y: updatedMeasurement.startPoint.y };
//             updatedMeasurement.endPoint = { x: updatedMeasurement.endPoint.x, y };
//           } else if (editingHandle === 'move') {
//             const rectW = Math.abs(updatedMeasurement.endPoint.x - updatedMeasurement.startPoint.x);
//             const rectH = Math.abs(updatedMeasurement.endPoint.y - updatedMeasurement.startPoint.y);
//             updatedMeasurement.startPoint = { x: x - rectW/2, y: y - rectH/2 };
//             updatedMeasurement.endPoint = { x: x + rectW/2, y: y + rectH/2 };
//           }
//           break;
          
//         case 'circle':
//           if (editingHandle === 'center') {
//             const offsetX = x - updatedMeasurement.startPoint.x;
//             const offsetY = y - updatedMeasurement.startPoint.y;
//             updatedMeasurement.startPoint = { x, y };
//             updatedMeasurement.endPoint = { 
//               x: updatedMeasurement.endPoint.x + offsetX, 
//               y: updatedMeasurement.endPoint.y + offsetY 
//             };
//           } else if (editingHandle === 'radius') {
//             updatedMeasurement.endPoint = { x, y };
//           }
//           break;
//       }
      
//       // 측정값 재계산
//       updatedMeasurement.value = calculateMeasurementValue(updatedMeasurement);
      
//       // 편집 중인 측정값 업데이트
//       setEditingMeasurement(updatedMeasurement);
      
//       // 전체 measurements 배열에서도 업데이트
//       setMeasurements(prev => prev.map(m => 
//         m.id === updatedMeasurement.id ? updatedMeasurement : m
//       ));
      
//       return;
//     }

//     // 기존 도구 동작
//     switch (selectedTool) {
//       case 'wwwc': // Window/Level
//         adjustWindowLevel(deltaX, deltaY);
//         break;
      
//       case 'zoom': // Zoom
//         const zoomDelta = -deltaY * 0.01;
//         setImageTransform(prev => ({
//           ...prev,
//           zoom: Math.max(0.1, Math.min(10.0, initialTransformRef.current.zoom + zoomDelta))
//         }));
//         break;
      
//       case 'pan': // Pan
//         setImageTransform(prev => ({
//           ...prev,
//           panX: initialTransformRef.current.panX + deltaX,
//           panY: initialTransformRef.current.panY + deltaY
//         }));
//         break;

//       case 'length':
//       case 'rectangle':
//       case 'circle':
//         // 측정 도구 - 끝점 업데이트
//         if (currentMeasurement) {
//           setCurrentMeasurement(prev => ({
//             ...prev,
//             endPoint: { x, y }
//           }));
//         }
//         break;
//     }
//   }, [isDragging, selectedTool, currentMeasurement, adjustWindowLevel, isEditMode, editingMeasurement, editingHandle]);

//   // 🔥 마우스 업 이벤트 (편집 기능 추가)
//   const handleMouseUp = useCallback(() => {
//     console.log('🖱️ 마우스 업');
//     setIsDragging(false);
//     setEditingHandle(null); // 핸들 드래그 종료
    
//     // 측정 완료
//     if (currentMeasurement && !isEditMode) {
//       const completedMeasurement = {
//         ...currentMeasurement,
//         isComplete: true,
//         visible: true, // 🔥 명시적으로 visible 설정
//         value: calculateMeasurementValue(currentMeasurement)
//       };
//       console.log('📏 측정 완료:', completedMeasurement);
//       setMeasurements(prev => [...prev, completedMeasurement]);
//       setCurrentMeasurement(null);
//     }
//   }, [currentMeasurement, isEditMode]);

//   // 🔥 휠 이벤트 (zoom)
//   const handleWheel = useCallback((event) => {
//     // passive event listener 경고 해결
//     if (event.cancelable) {
//       event.preventDefault();
//     }
    
//     const delta = event.deltaY > 0 ? -0.1 : 0.1;
//     adjustZoom(delta);
//   }, [adjustZoom]);

//   // 🔥 측정값 계산
//   const calculateMeasurementValue = useCallback((measurement) => {
//     const { startPoint, endPoint, type } = measurement;
//     const deltaX = endPoint.x - startPoint.x;
//     const deltaY = endPoint.y - startPoint.y;

//     switch (type) {
//       case 'length':
//         const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
//         return `${(length * 0.5).toFixed(1)} mm`; // 가상의 스케일
      
//       case 'rectangle':
//         const area = Math.abs(deltaX * deltaY);
//         return `${(area * 0.25).toFixed(1)} mm²`;
      
//       case 'circle':
//         const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
//         const circleArea = Math.PI * radius * radius;
//         return `${(circleArea * 0.25).toFixed(1)} mm²`;
      
//       default:
//         return 'N/A';
//     }
//   }, []);

//   // 🔥 회전
//   const handleRotate = useCallback((clockwise = true) => {
//     setImageTransform(prev => {
//       const newRotation = prev.rotation + (clockwise ? 90 : -90);
//       console.log(`🔄 회전: ${newRotation}°`);
//       return { ...prev, rotation: newRotation };
//     });
//   }, []);

//   // 🔥 플립
//   const handleFlip = useCallback((direction = 'horizontal') => {
//     setImageTransform(prev => {
//       const newTransform = {
//         ...prev,
//         flipH: direction === 'horizontal' ? !prev.flipH : prev.flipH,
//         flipV: direction === 'vertical' ? !prev.flipV : prev.flipV
//       };
//       console.log(`🔄 플립: H=${newTransform.flipH}, V=${newTransform.flipV}`);
//       return newTransform;
//     });
//   }, []);

//   // 🔥 반전
//   const handleInvert = useCallback(() => {
//     setImageTransform(prev => {
//       const newInvert = !prev.invert;
//       console.log(`🔄 반전: ${newInvert ? 'ON' : 'OFF'}`);
//       return { ...prev, invert: newInvert };
//     });
//   }, []);

//   // 🔥 리셋
//   const handleReset = useCallback(() => {
//     console.log('🔄 리셋');
//     setImageTransform({
//       zoom: 1.0,
//       panX: 0,
//       panY: 0,
//       rotation: 0,
//       flipH: false,
//       flipV: false,
//       brightness: 100,
//       contrast: 100,
//       invert: false
//     });
//     setMeasurements([]);
//     setCurrentMeasurement(null);
//     stopEditMode();
//   }, [stopEditMode]);

//   return {
//     // 상태
//     selectedTool,
//     isPlaying,
//     setIsPlaying,
//     imageTransform,
//     measurements,
//     currentMeasurement,
//     isDragging,

//     // 🔥 편집 관련 상태
//     editingMeasurement,
//     editingHandle,
//     isEditMode,

//     // 함수들
//     changeTool,
//     adjustZoom,
//     adjustPan,
//     adjustWindowLevel,
//     handleRotate,
//     handleFlip,
//     handleInvert,
//     handleReset,
    
//     // 🔥 편집 관련 함수
//     startEditMode,
//     stopEditMode,
    
//     // 이벤트 핸들러
//     handleMouseDown,
//     handleMouseMove,
//     handleMouseUp,
//     handleWheel,
    
//     // 스타일
//     getImageStyle,
    
//     // 기타
//     setMeasurements,
    
//     // 뷰포트 정보
//     viewportSettings: {
//       windowWidth: Math.round((imageTransform.contrast - 100) * 4 + 400),
//       windowCenter: Math.round((imageTransform.brightness - 100) * 0.4 + 40),
//       zoom: imageTransform.zoom,
//       invert: imageTransform.invert
//     }
//   };
// };

// export default useSimpleViewer;

// /home/medical_system/pacsapp/src/hooks/viewer_v2/useSimpleViewer.js

import { useState, useCallback, useRef } from 'react';

const useSimpleViewer = () => {
  console.log('useSimpleViewer 호출됨');
  
  // 기본 상태
  const [selectedTool, setSelectedTool] = useState('wwwc');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 이미지 변환 상태
  const [imageTransform, setImageTransform] = useState({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    brightness: 100,
    contrast: 100,
    invert: false
  });

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialTransformRef = useRef(null);
  
  // 측정 상태
  const [measurements, setMeasurements] = useState([]);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);

  // 🔥 편집 상태 추가
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [editingHandle, setEditingHandle] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 도구 변경
  const changeTool = useCallback((toolId) => {
    console.log('🔧 도구 변경:', toolId);
    setSelectedTool(toolId);
    
    // 편집 모드 종료
    if (toolId !== 'edit') {
      setEditingMeasurement(null);
      setEditingHandle(null);
      setIsEditMode(false);
    }
  }, []);

  // 🔥 편집 모드 진입
  const startEditMode = useCallback((measurementId) => {
    console.log('📝 편집 모드 진입:', measurementId);
    const measurement = measurements.find(m => m.id === measurementId);
    if (measurement) {
      setEditingMeasurement(measurement);
      setIsEditMode(true);
      setSelectedTool('edit');
    }
  }, [measurements]);

  // 🔥 편집 모드 종료
  const stopEditMode = useCallback(() => {
    console.log('📝 편집 모드 종료');
    setEditingMeasurement(null);
    setEditingHandle(null);
    setIsEditMode(false);
    setSelectedTool('wwwc');
  }, []);

  // 🔥 핸들 클릭 감지
  const getClickedHandle = useCallback((clickX, clickY, measurement) => {
    const handleRadius = 8; // 핸들 클릭 감지 반경
    
    switch (measurement.type) {
      case 'length':
        // 시작점, 끝점 체크
        if (Math.abs(clickX - measurement.startPoint.x) < handleRadius && 
            Math.abs(clickY - measurement.startPoint.y) < handleRadius) {
          return 'start';
        }
        if (Math.abs(clickX - measurement.endPoint.x) < handleRadius && 
            Math.abs(clickY - measurement.endPoint.y) < handleRadius) {
          return 'end';
        }
        break;
        
      case 'rectangle':
        const rectX = Math.min(measurement.startPoint.x, measurement.endPoint.x);
        const rectY = Math.min(measurement.startPoint.y, measurement.endPoint.y);
        const rectW = Math.abs(measurement.endPoint.x - measurement.startPoint.x);
        const rectH = Math.abs(measurement.endPoint.y - measurement.startPoint.y);
        
        // 4개 모서리 + 중심 체크
        if (Math.abs(clickX - rectX) < handleRadius && Math.abs(clickY - rectY) < handleRadius) return 'topLeft';
        if (Math.abs(clickX - (rectX + rectW)) < handleRadius && Math.abs(clickY - rectY) < handleRadius) return 'topRight';
        if (Math.abs(clickX - rectX) < handleRadius && Math.abs(clickY - (rectY + rectH)) < handleRadius) return 'bottomLeft';
        if (Math.abs(clickX - (rectX + rectW)) < handleRadius && Math.abs(clickY - (rectY + rectH)) < handleRadius) return 'bottomRight';
        
        // 전체 이동 (사각형 내부)
        if (clickX > rectX && clickX < rectX + rectW && clickY > rectY && clickY < rectY + rectH) return 'move';
        break;
        
      case 'circle':
        // 중심점
        if (Math.abs(clickX - measurement.startPoint.x) < handleRadius && 
            Math.abs(clickY - measurement.startPoint.y) < handleRadius) {
          return 'center';
        }
        // 테두리점
        if (Math.abs(clickX - measurement.endPoint.x) < handleRadius && 
            Math.abs(clickY - measurement.endPoint.y) < handleRadius) {
          return 'radius';
        }
        break;
    }
    
    return null;
  }, []);

  // 🔥 실제 Window/Level 조절
  const adjustWindowLevel = useCallback((deltaX, deltaY) => {
    setImageTransform(prev => {
      const newBrightness = Math.max(10, Math.min(300, prev.brightness - deltaY * 0.5));
      const newContrast = Math.max(10, Math.min(300, prev.contrast + deltaX * 0.5));
      
      console.log(`🖼️ Window/Level: 밝기 ${newBrightness.toFixed(0)}%, 대비 ${newContrast.toFixed(0)}%`);
      
      return {
        ...prev,
        brightness: newBrightness,
        contrast: newContrast
      };
    });
  }, []);

  // 🔥 실제 Zoom 조절
  const adjustZoom = useCallback((delta) => {
    setImageTransform(prev => {
      const newZoom = Math.max(0.1, Math.min(10.0, prev.zoom + delta));
      console.log(`🔍 Zoom: ${newZoom.toFixed(2)}x`);
      
      return { ...prev, zoom: newZoom };
    });
  }, []);

  // 🔥 실제 Pan 조절
  const adjustPan = useCallback((deltaX, deltaY) => {
    setImageTransform(prev => {
      const newPanX = prev.panX + deltaX;
      const newPanY = prev.panY + deltaY;
      
      console.log(`👆 Pan: X=${newPanX.toFixed(0)}, Y=${newPanY.toFixed(0)}`);
      
      return {
        ...prev,
        panX: newPanX,
        panY: newPanY
      };
    });
  }, []);

  // CSS 스타일 생성
  const getImageStyle = useCallback(() => {
    const { zoom, panX, panY, rotation, flipH, flipV, brightness, contrast, invert } = imageTransform;
    
    const scaleX = flipH ? -zoom : zoom;
    const scaleY = flipV ? -zoom : zoom;
    
    return {
      transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
      filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
      transition: isDragging ? 'none' : 'transform 0.2s ease-out, filter 0.1s ease-out',
      transformOrigin: 'center center'
    };
  }, [imageTransform, isDragging]);

  // 🔥 마우스 다운 이벤트 (편집 기능 추가)
  const handleMouseDown = useCallback((event) => {
    // 🔥 우클릭이면 무시
    if (event.button === 2) { // 2 = 우클릭
      console.log('🖱️ useSimpleViewer - 우클릭 차단');
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    console.log('🖱️ 마우스 다운 - 도구:', selectedTool, '버튼:', event.button);

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 🔥 편집 모드일 때 핸들 클릭 체크
    if (isEditMode && editingMeasurement) {
      const handle = getClickedHandle(x, y, editingMeasurement);
      if (handle) {
        console.log('🖱️ 핸들 클릭:', handle);
        setEditingHandle(handle);
        setIsDragging(true);
        dragStartRef.current = { x, y };
        return;
      }
    }
    
    setIsDragging(true);
    dragStartRef.current = { x, y };
    initialTransformRef.current = { ...imageTransform };

    // 측정 도구인 경우 (좌클릭만)
    if (['length', 'rectangle', 'circle'].includes(selectedTool) && event.button === 0) {
      const newMeasurement = {
        id: Date.now(),
        type: selectedTool,
        startPoint: { x, y },
        endPoint: { x, y },
        isComplete: false,
        visible: true
      };
      setCurrentMeasurement(newMeasurement);
      console.log('📏 측정 시작:', selectedTool);
    }
  }, [selectedTool, imageTransform, isEditMode, editingMeasurement, getClickedHandle]);

  // 🔥 마우스 무브 이벤트 (편집 기능 추가)
  const handleMouseMove = useCallback((event) => {
    if (!isDragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const deltaX = x - dragStartRef.current.x;
    const deltaY = y - dragStartRef.current.y;

    // 🔥 편집 모드일 때 핸들 드래그
    if (isEditMode && editingMeasurement && editingHandle) {
      console.log('✏️ 핸들 드래그:', editingHandle, x, y);
      
      const updatedMeasurement = { ...editingMeasurement };
      
      switch (editingMeasurement.type) {
        case 'length':
          if (editingHandle === 'start') {
            updatedMeasurement.startPoint = { x, y };
          } else if (editingHandle === 'end') {
            updatedMeasurement.endPoint = { x, y };
          }
          break;
          
        case 'rectangle':
          if (editingHandle === 'topLeft') {
            updatedMeasurement.startPoint = { x, y };
          } else if (editingHandle === 'bottomRight') {
            updatedMeasurement.endPoint = { x, y };
          } else if (editingHandle === 'topRight') {
            updatedMeasurement.startPoint = { x: updatedMeasurement.startPoint.x, y };
            updatedMeasurement.endPoint = { x, y: updatedMeasurement.endPoint.y };
          } else if (editingHandle === 'bottomLeft') {
            updatedMeasurement.startPoint = { x, y: updatedMeasurement.startPoint.y };
            updatedMeasurement.endPoint = { x: updatedMeasurement.endPoint.x, y };
          } else if (editingHandle === 'move') {
            const rectW = Math.abs(updatedMeasurement.endPoint.x - updatedMeasurement.startPoint.x);
            const rectH = Math.abs(updatedMeasurement.endPoint.y - updatedMeasurement.startPoint.y);
            updatedMeasurement.startPoint = { x: x - rectW/2, y: y - rectH/2 };
            updatedMeasurement.endPoint = { x: x + rectW/2, y: y + rectH/2 };
          }
          break;
          
        case 'circle':
          if (editingHandle === 'center') {
            const offsetX = x - updatedMeasurement.startPoint.x;
            const offsetY = y - updatedMeasurement.startPoint.y;
            updatedMeasurement.startPoint = { x, y };
            updatedMeasurement.endPoint = { 
              x: updatedMeasurement.endPoint.x + offsetX, 
              y: updatedMeasurement.endPoint.y + offsetY 
            };
          } else if (editingHandle === 'radius') {
            updatedMeasurement.endPoint = { x, y };
          }
          break;
      }
      
      // 측정값 재계산
      updatedMeasurement.value = calculateMeasurementValue(updatedMeasurement);
      
      // 편집 중인 측정값 업데이트
      setEditingMeasurement(updatedMeasurement);
      
      // 전체 measurements 배열에서도 업데이트
      setMeasurements(prev => prev.map(m => 
        m.id === updatedMeasurement.id ? updatedMeasurement : m
      ));
      
      return;
    }

    // 기존 도구 동작
    switch (selectedTool) {
      case 'wwwc': // Window/Level
        adjustWindowLevel(deltaX, deltaY);
        break;
      
      case 'zoom': // Zoom
        const zoomDelta = -deltaY * 0.01;
        setImageTransform(prev => ({
          ...prev,
          zoom: Math.max(0.1, Math.min(10.0, initialTransformRef.current.zoom + zoomDelta))
        }));
        break;
      
      case 'pan': // Pan
        setImageTransform(prev => ({
          ...prev,
          panX: initialTransformRef.current.panX + deltaX,
          panY: initialTransformRef.current.panY + deltaY
        }));
        break;

      case 'length':
      case 'rectangle':
      case 'circle':
        // 측정 도구 - 끝점 업데이트
        if (currentMeasurement) {
          setCurrentMeasurement(prev => ({
            ...prev,
            endPoint: { x, y }
          }));
        }
        break;
    }
  }, [isDragging, selectedTool, currentMeasurement, adjustWindowLevel, isEditMode, editingMeasurement, editingHandle]);

  // 🔥 마우스 업 이벤트 (편집 기능 추가)
  const handleMouseUp = useCallback(() => {
    console.log('🖱️ 마우스 업');
    setIsDragging(false);
    setEditingHandle(null); // 핸들 드래그 종료
    
    // 측정 완료
    if (currentMeasurement && !isEditMode) {
      const completedMeasurement = {
        ...currentMeasurement,
        isComplete: true,
        visible: true, // 🔥 명시적으로 visible 설정
        value: calculateMeasurementValue(currentMeasurement)
      };
      console.log('📏 측정 완료:', completedMeasurement);
      setMeasurements(prev => [...prev, completedMeasurement]);
      setCurrentMeasurement(null);
    }
  }, [currentMeasurement, isEditMode]);

  // 🔥 휠 이벤트 (zoom)
  const handleWheel = useCallback((event) => {
    // passive event listener 경고 해결
    if (event.cancelable) {
      event.preventDefault();
    }
    
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    adjustZoom(delta);
  }, [adjustZoom]);

  // 🔥 측정값 계산
  const calculateMeasurementValue = useCallback((measurement) => {
    const { startPoint, endPoint, type } = measurement;
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;

    switch (type) {
      case 'length':
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return `${(length * 0.5).toFixed(1)} mm`; // 가상의 스케일
      
      case 'rectangle':
        const area = Math.abs(deltaX * deltaY);
        return `${(area * 0.25).toFixed(1)} mm²`;
      
      case 'circle':
        const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const circleArea = Math.PI * radius * radius;
        return `${(circleArea * 0.25).toFixed(1)} mm²`;
      
      default:
        return 'N/A';
    }
  }, []);

  // 🔥 회전
  const handleRotate = useCallback((clockwise = true) => {
    setImageTransform(prev => {
      const newRotation = prev.rotation + (clockwise ? 90 : -90);
      console.log(`🔄 회전: ${newRotation}°`);
      return { ...prev, rotation: newRotation };
    });
  }, []);

  // 🔥 플립
  const handleFlip = useCallback((direction = 'horizontal') => {
    setImageTransform(prev => {
      const newTransform = {
        ...prev,
        flipH: direction === 'horizontal' ? !prev.flipH : prev.flipH,
        flipV: direction === 'vertical' ? !prev.flipV : prev.flipV
      };
      console.log(`🔄 플립: H=${newTransform.flipH}, V=${newTransform.flipV}`);
      return newTransform;
    });
  }, []);

  // 🔥 반전
  const handleInvert = useCallback(() => {
    setImageTransform(prev => {
      const newInvert = !prev.invert;
      console.log(`🔄 반전: ${newInvert ? 'ON' : 'OFF'}`);
      return { ...prev, invert: newInvert };
    });
  }, []);

  // 🔥 리셋
  const handleReset = useCallback(() => {
    console.log('🔄 리셋');
    setImageTransform({
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      brightness: 100,
      contrast: 100,
      invert: false
    });
    setMeasurements([]);
    setCurrentMeasurement(null);
    stopEditMode();
  }, [stopEditMode]);

  return {
    // 상태
    selectedTool,
    isPlaying,
    setIsPlaying,
    imageTransform,
    measurements,
    currentMeasurement,
    isDragging,

    // 🔥 편집 관련 상태
    editingMeasurement,
    editingHandle,
    isEditMode,

    // 함수들
    changeTool,
    adjustZoom,
    adjustPan,
    adjustWindowLevel,
    handleRotate,
    handleFlip,
    handleInvert,
    handleReset,
    
    // 🔥 편집 관련 함수
    startEditMode,
    stopEditMode,
    
    // 이벤트 핸들러
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    
    // 스타일
    getImageStyle,
    
    // 기타
    setMeasurements,
    
    // 뷰포트 정보
    viewportSettings: {
      windowWidth: Math.round((imageTransform.contrast - 100) * 4 + 400),
      windowCenter: Math.round((imageTransform.brightness - 100) * 0.4 + 40),
      zoom: imageTransform.zoom,
      invert: imageTransform.invert
    }
  };
};

export default useSimpleViewer;