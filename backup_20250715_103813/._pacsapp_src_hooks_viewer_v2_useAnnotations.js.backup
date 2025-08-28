// // hooks/viewer_v2/useAnnotations.js
// import { useState, useRef, useCallback } from 'react';
// import { 
//   saveAnnotations, 
//   loadAnnotations, 
//   deleteAllAnnotations 
// } from '../../utils/viewer_v2/api';

// // 🔥 API_BASE_URL 추가
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://35.225.63.41:8000';

// // 🔥 토스트 알림 함수
// const showToast = (message) => {
//     const toast = document.createElement('div');
//     toast.textContent = message;
//     toast.style.cssText = `
//         position: fixed;
//         top: 20px;
//         right: 20px;
//         background: #333;
//         color: white;
//         padding: 12px 20px;
//         border-radius: 6px;
//         z-index: 9999;
//         box-shadow: 0 4px 12px rgba(0,0,0,0.2);
//         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
//         font-size: 14px;
//         max-width: 300px;
//         animation: slideInRight 0.3s ease;
//     `;
    
//     const style = document.createElement('style');
//     style.textContent = `
//         @keyframes slideInRight {
//             from { transform: translateX(100%); opacity: 0; }
//             to { transform: translateX(0); opacity: 1; }
//         }
//     `;
//     if (!document.head.querySelector('style[data-toast]')) {
//         style.setAttribute('data-toast', 'true');
//         document.head.appendChild(style);
//     }
    
//     document.body.appendChild(toast);
    
//     setTimeout(() => {
//         if (document.body.contains(toast)) {
//             document.body.removeChild(toast);
//         }
//     }, 3000);
// };

// /**
//  * 어노테이션 관련 상태와 로직을 관리하는 커스텀 훅
//  * @param {string} currentStudyUID - 현재 선택된 스터디 UID
//  * @param {string} currentInstanceUID - 현재 선택된 인스턴스 UID
//  * @param {number} currentInstanceNumber - 현재 선택된 인스턴스 번호
//  * @param {Function} setAnalysisStatus - 상태 메시지 설정 함수
//  * @param {Function} setActiveLayer - 활성 레이어 설정 함수
//  * @param {Object} doctorInfo - 판독의 정보 (WorkList에서)
//  * @returns {Object} 어노테이션 관련 상태와 함수들
//  */
// const useAnnotations = (currentStudyUID, currentInstanceUID, currentInstanceNumber, setAnalysisStatus, setActiveLayer, doctorInfo) => {
//     // =============================================================================
//     // 상태 관리
//     // =============================================================================
    
//     // 어노테이션 그리기 관련 상태
//     const [drawingMode, setDrawingMode] = useState(false);
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [currentBox, setCurrentBox] = useState(null);
//     const [showAnnotations, setShowAnnotations] = useState(true);
    
//     // 어노테이션 데이터
//     const [annotationBoxes, setAnnotationBoxes] = useState([]);
    
//     // 🔥 측정값 기반 어노테이션 저장소
//     const [measurementAnnotations, setMeasurementAnnotations] = useState([]);
    
//     // 라벨 모달 관련 상태
//     const [showLabelModal, setShowLabelModal] = useState(false);
//     const [newBoxLabel, setNewBoxLabel] = useState('');
//     const [tempBox, setTempBox] = useState(null);
    
//     // 드롭다운 상태
//     const [showAnnotationDropdown, setShowAnnotationDropdown] = useState(false);
    
//     // DOM 참조
//     const overlayRef = useRef(null);
    
//     // =============================================================================
//     // 🔥 수정된 측정값을 Django 어노테이션으로 변환하는 함수들
//     // =============================================================================
    
//     /**
//      * 🔥 수정: 측정값을 Django 어노테이션 형태로 변환 - 타입별 올바른 변환
//      */
//     const convertMeasurementToAnnotation = useCallback((measurement, annotationData) => {
//         console.log('🔄 측정값을 어노테이션으로 변환:', { measurement, annotationData });
        
//         let shape_type = 'rectangle';
//         let coordinates = [];
        
//         // 🔥 수정: 타입별로 올바른 shape_type과 coordinates 설정
//         switch (measurement.type) {
//             case 'rectangle':
//                 shape_type = 'rectangle';
//                 const rectX = Math.min(measurement.startPoint.x, measurement.endPoint.x);
//                 const rectY = Math.min(measurement.startPoint.y, measurement.endPoint.y);
//                 const rectWidth = Math.abs(measurement.endPoint.x - measurement.startPoint.x);
//                 const rectHeight = Math.abs(measurement.endPoint.y - measurement.startPoint.y);
//                 coordinates = [rectX, rectY, rectWidth, rectHeight];
//                 console.log('✅ 사각형 변환:', { shape_type, coordinates });
//                 break;
                
//             case 'circle':
//                 shape_type = 'circle';  // 🔥 수정: 'circle'로 설정
//                 const centerX = measurement.startPoint.x;
//                 const centerY = measurement.startPoint.y;
//                 const radius = Math.sqrt(
//                     Math.pow(measurement.endPoint.x - measurement.startPoint.x, 2) + 
//                     Math.pow(measurement.endPoint.y - measurement.startPoint.y, 2)
//                 );
//                 coordinates = [centerX, centerY, radius];
//                 console.log('✅ 원형 변환:', { shape_type, coordinates });
//                 break;
                
//             case 'length':
//                 shape_type = 'line';  // 🔥 수정: 'line'으로 설정
//                 coordinates = [
//                     measurement.startPoint.x, 
//                     measurement.startPoint.y,
//                     measurement.endPoint.x, 
//                     measurement.endPoint.y
//                 ];
//                 console.log('✅ 직선 변환:', { shape_type, coordinates });
//                 break;
                
//             default:
//                 console.warn('⚠️ 알 수 없는 측정값 타입:', measurement.type);
//                 shape_type = 'rectangle';
//                 coordinates = [0, 0, 10, 10];
//         }
        
//         const convertedAnnotation = {
//             id: Date.now() + Math.random(),
//             measurementId: measurement.id,
//             shape_type: shape_type,  // 🔥 수정: 올바른 shape_type 설정
//             coordinates: coordinates,  // 🔥 수정: 타입에 맞는 coordinates 설정
//             label: annotationData.label || '',
//             dr_text: annotationData.memo || '',
//             slice: annotationData.slice || currentInstanceNumber || 1,
//             confidence: 1.0,
//             created: new Date().toISOString(),
//             doctor_name: doctorInfo?.name || '미배정',
            
//             // 하위 호환성 필드들 (사각형만)
//             left: shape_type === 'rectangle' ? coordinates[0] : 0,
//             top: shape_type === 'rectangle' ? coordinates[1] : 0,
//             width: shape_type === 'rectangle' ? coordinates[2] : 0,
//             height: shape_type === 'rectangle' ? coordinates[3] : 0,
//             memo: annotationData.memo || ''
//         };
        
//         console.log('✅ 변환된 어노테이션:', convertedAnnotation);
//         console.log('✅ shape_type:', convertedAnnotation.shape_type);
//         console.log('✅ coordinates:', convertedAnnotation.coordinates);
//         console.log('✅ doctor_name:', convertedAnnotation.doctor_name);
//         return convertedAnnotation;
//     }, [currentInstanceNumber, doctorInfo]);
    
//     /**
//      * 🔥 핵심 함수: 측정값에 라벨을 추가하고 Django 어노테이션으로 변환 - 성공시 결과 반환
//      */
//     const addMeasurementToAnnotations = useCallback(async (measurement, annotationData) => {
//         console.log('🏷️ useAnnotations - addMeasurementToAnnotations 호출:', { measurement, annotationData });
        
//         if (!measurement || !annotationData) {
//             console.error('❌ measurement 또는 annotationData가 없음');
//             return null;
//         }
        
//         console.log('✅ 측정값을 Django 어노테이션으로 변환 시작:', measurement.id);
        
//         try {
//             // 1. 측정값을 Django 어노테이션 형태로 변환
//             const djangoAnnotation = convertMeasurementToAnnotation(measurement, annotationData);
            
//             // 2. 즉시 서버에 저장
//             console.log('💾 Django 어노테이션 서버 저장 시작');
            
//             if (!currentStudyUID) {
//                 console.error('❌ Study UID가 없어서 저장 불가');
//                 return null;
//             }
            
//             const saveData = await saveAnnotations(
//                 currentStudyUID, 
//                 currentInstanceUID || 'temp-instance-uid',
//                 currentInstanceNumber || 1,
//                 [djangoAnnotation]
//             );
            
//             console.log('💾 서버 저장 응답:', saveData);
            
//             if (saveData.status === 'success') {
//                 console.log('✅ Django 어노테이션 서버 저장 성공');
                
//                 // 🔥 기존 annotationBoxes에 새 어노테이션 추가
//                 setAnnotationBoxes(prev => {
//                     const exists = prev.find(existing => 
//                         existing.measurementId === djangoAnnotation.measurementId ||
//                         existing.id === djangoAnnotation.id
//                     );
                    
//                     if (exists) {
//                         console.log('🔄 기존 어노테이션 업데이트:', djangoAnnotation.id);
//                         return prev.map(existing => 
//                             existing.id === djangoAnnotation.id ? 
//                             { ...djangoAnnotation, doctor_name: saveData.data?.doctor_name || existing.doctor_name } : 
//                             existing
//                         );
//                     } else {
//                         console.log('✅ 새 어노테이션 추가:', djangoAnnotation.id);
//                         const updated = [...prev, { 
//                             ...djangoAnnotation, 
//                             doctor_name: saveData.data?.doctor_name || djangoAnnotation.doctor_name 
//                         }];
//                         console.log('📊 총 어노테이션 개수:', updated.length);
//                         return updated;
//                     }
//                 });
                
//                 // 4. measurementAnnotations에 추가/업데이트
//                 setMeasurementAnnotations(prev => {
//                     const existingIndex = prev.findIndex(ann => ann.measurementId === measurement.id);
//                     let updated;
                    
//                     if (existingIndex >= 0) {
//                         updated = [...prev];
//                         updated[existingIndex] = djangoAnnotation;
//                         console.log('🔄 기존 측정값 어노테이션 업데이트:', measurement.id);
//                     } else {
//                         updated = [...prev, djangoAnnotation];
//                         console.log('✅ 새 측정값 어노테이션 추가:', measurement.id);
//                     }
                    
//                     console.log('🏷️ measurementAnnotations 업데이트:', updated.length);
//                     return updated;
//                 });
                
//                 showToast(`✅ 라벨이 추가되었습니다: ${annotationData.label}`);
//                 console.log('✅ 측정값이 Django 어노테이션으로 추가됨');
                
//                 // 🔥 핵심: Django 저장 성공시 결과 반환하여 Layout에서 로컬 데이터 정리
//                 return {
//                     success: true,
//                     djangoAnnotation,
//                     measurementId: measurement.id
//                 };
                
//             } else {
//                 console.error('❌ Django 어노테이션 서버 저장 실패:', saveData);
//                 showToast('❌ 라벨 저장에 실패했습니다');
//                 return null;
//             }
            
//         } catch (error) {
//             console.error('❌ Django 어노테이션 생성/저장 실패:', error);
//             showToast('❌ 라벨 저장 중 오류가 발생했습니다');
//             return null;
//         }
//     }, [convertMeasurementToAnnotation, currentStudyUID, currentInstanceUID, currentInstanceNumber]);
    
//     /**
//      * 🔥 모든 어노테이션 가져오기 - 완전한 중복 제거 + 타입 체크 추가
//      */
//     const getAllAnnotations = useCallback(() => {
//         console.log('📊 getAllAnnotations 호출됨');
        
//         const safeAnnotationBoxes = Array.isArray(annotationBoxes) ? annotationBoxes : [];
//         const safeMeasurementAnnotations = Array.isArray(measurementAnnotations) ? measurementAnnotations : [];
        
//         console.log('📊 안전한 annotationBoxes 길이:', safeAnnotationBoxes.length);
//         console.log('📊 안전한 measurementAnnotations 길이:', safeMeasurementAnnotations.length);
        
//         // 🔥 Django 어노테이션만 반환 (중복 완전 제거) + 타입 체크 추가
//         const uniqueAnnotations = safeAnnotationBoxes.filter(ann => {
//             if (!ann) return false;
            
//             // 🔥 타입 체크 추가: measurementId가 문자열인지 확인
//             if (ann.measurementId && typeof ann.measurementId === 'string') {
//                 // Django 어노테이션인지 확인
//                 const isDjango = ann.measurementId.startsWith('django-');
//                 if (isDjango) {
//                     console.log('✅ Django 어노테이션 포함:', ann.measurementId);
//                     return true;
//                 }
//             }
            
//             // 일반 어노테이션 (직접 그린 것)
//             console.log('✅ 일반 어노테이션 포함:', ann.id);
//             return true;
//         });
        
//         console.log('📊 최종 유니크 어노테이션:', uniqueAnnotations.length);
//         return uniqueAnnotations;
//     }, [annotationBoxes, measurementAnnotations]);
    
//     // =============================================================================
//     // 마우스 이벤트 핸들러들
//     // =============================================================================
    
//     const handleMouseDown = useCallback((e) => {
//         if (!drawingMode) return;
        
//         if (setActiveLayer) {
//             console.log('✏️ 어노테이션 그리기 시작 - 어노테이션 레이어 활성화');
//             setActiveLayer('annotation');
//         }
        
//         const rect = overlayRef.current?.getBoundingClientRect();
//         if (!rect) return;
        
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;
        
//         setIsDrawing(true);
//         setCurrentBox({
//             startX: x,
//             startY: y,
//             endX: x,
//             endY: y
//         });
//     }, [drawingMode, setActiveLayer]);
    
//     const handleMouseMove = useCallback((e) => {
//         if (!isDrawing || !drawingMode) return;
        
//         const rect = overlayRef.current?.getBoundingClientRect();
//         if (!rect) return;
        
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;
        
//         setCurrentBox(prev => prev ? ({
//             ...prev,
//             endX: x,
//             endY: y
//         }) : null);
//     }, [isDrawing, drawingMode]);
    
//     const handleMouseUp = useCallback((e) => {
//         if (!isDrawing || !drawingMode) return;
        
//         setIsDrawing(false);
        
//         if (currentBox) {
//             const width = Math.abs(currentBox.endX - currentBox.startX);
//             const height = Math.abs(currentBox.endY - currentBox.startY);
            
//             if (width > 10 && height > 10) {
//                 setTempBox(currentBox);
//                 setShowLabelModal(true);
                
//                 if (setActiveLayer) {
//                     console.log('📋 라벨 모달 열림 - 모달 레이어 활성화');
//                     setActiveLayer('modal');
//                 }
//             }
//         }
        
//         setCurrentBox(null);
//     }, [isDrawing, drawingMode, currentBox, setActiveLayer]);
    
//     // =============================================================================
//     // 어노테이션 관리 함수들
//     // =============================================================================
    
//     const saveBoundingBox = useCallback((label) => {
//         if (!tempBox || !label.trim()) return;
        
//         const normalizedBox = {
//             id: Date.now(),
//             left: Math.min(tempBox.startX, tempBox.endX),
//             top: Math.min(tempBox.startY, tempBox.endY),
//             width: Math.abs(tempBox.endX - tempBox.startX),
//             height: Math.abs(tempBox.endY - tempBox.startY),
//             label: label.trim(),
//             confidence: 1.0,
//             created: new Date().toISOString(),
//             doctor_name: doctorInfo?.name || '미배정',
//             shape_type: 'rectangle',
//             coordinates: [
//                 Math.min(tempBox.startX, tempBox.endX),
//                 Math.min(tempBox.startY, tempBox.endY),
//                 Math.abs(tempBox.endX - tempBox.startX),
//                 Math.abs(tempBox.endY - tempBox.startY)
//             ]
//         };
        
//         setAnnotationBoxes(prev => {
//             const newBoxes = [...prev, normalizedBox];
//             console.log('💾 어노테이션 추가됨:', normalizedBox);
//             console.log('💾 전체 어노테이션 개수:', newBoxes.length);
//             return newBoxes;
//         });
        
//         setShowLabelModal(false);
//         setNewBoxLabel('');
//         setTempBox(null);
        
//         if (setActiveLayer) {
//             console.log('💾 라벨 저장 완료 - 어노테이션 레이어로 복귀');
//             setActiveLayer('annotation');
//         }
//     }, [tempBox, setActiveLayer, doctorInfo]);
    
//     const deleteBoundingBox = useCallback((boxId) => {
//         setAnnotationBoxes(prev => {
//             const filteredBoxes = prev.filter(box => box.id !== boxId);
//             console.log('🗑️ 어노테이션 삭제됨 ID:', boxId);
//             console.log('🗑️ 남은 어노테이션 개수:', filteredBoxes.length);
//             return filteredBoxes;
//         });
        
//         setMeasurementAnnotations(prev => {
//             const filtered = prev.filter(ann => ann.id !== boxId && ann.measurementId !== boxId);
//             console.log('🗑️ measurementAnnotations에서도 삭제:', filtered.length);
//             return filtered;
//         });
        
//         if (setActiveLayer) {
//             console.log('🗑️ 어노테이션 삭제 - 어노테이션 레이어 활성화');
//             setActiveLayer('annotation');
//         }
//     }, [setActiveLayer]);
    
//     const deleteIndividualAnnotation = useCallback((boxId) => {
//         const allAnnotations = getAllAnnotations();
//         const box = allAnnotations.find(b => b.id === boxId);
//         if (box && window.confirm(`"${box.label}" 어노테이션을 삭제하시겠습니까?`)) {
//             deleteBoundingBox(boxId);
//             setShowAnnotationDropdown(false);
//         }
//     }, [getAllAnnotations, deleteBoundingBox]);
    
//     // =============================================================================
//     // 🔥 서버 통신 함수들
//     // =============================================================================
    
//     /**
//      * 🔥 모든 어노테이션을 서버에 저장
//      */
//     const saveAnnotationsToServer = useCallback(async () => {
//         console.log('💾 saveAnnotationsToServer 호출됨');
//         console.log('💾 currentStudyUID:', currentStudyUID);
//         console.log('💾 currentInstanceUID:', currentInstanceUID);
//         console.log('💾 currentInstanceNumber:', currentInstanceNumber);
        
//         // 함수가 전달된 경우 처리
//         if (typeof currentInstanceUID === 'function') {
//             console.error('🚨 currentInstanceUID가 함수입니다! Layout.js 문제');
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('❌ currentInstanceUID가 함수입니다!');
//             }
//             return;
//         }
        
//         if (typeof currentInstanceNumber === 'function') {
//             console.error('🚨 currentInstanceNumber가 함수입니다! Layout.js 문제');
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('❌ currentInstanceNumber가 함수입니다!');
//             }
//             return;
//         }
        
//         if (!currentStudyUID) {
//             const message = 'Study UID가 없습니다';
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(message);
//             }
//             console.log('❌', message);
//             return;
//         }

//         if (!currentInstanceUID) {
//             console.warn('⚠️ Instance UID가 없지만 임시로 기본값 사용');
//         }
        
//         let allAnnotations;
//         try {
//             allAnnotations = getAllAnnotations();
//             console.log('💾 getAllAnnotations 결과:', allAnnotations);
//         } catch (error) {
//             console.error('❌ getAllAnnotations 호출 실패:', error);
//             const errorMessage = '❌ 어노테이션 조회 실패: ' + error.message;
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(errorMessage);
//             }
//             return;
//         }
        
//         if (!Array.isArray(allAnnotations) || allAnnotations.length === 0) {
//             const message = '저장할 어노테이션이 없습니다';
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(message);
//             }
//             console.log('❌', message);
//             return;
//         }
        
//         if (setActiveLayer) {
//             setActiveLayer('annotation');
//         }
        
//         try {
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('어노테이션 저장 중...');
//             }
//             console.log('💾 서버 저장 시작...');
            
//             // 라벨이 있는 어노테이션만 저장
//             const validAnnotations = allAnnotations.filter(ann => 
//                 ann && ann.label && ann.label.trim() !== '' && 
//                 (ann.coordinates || ann.startPoint || ann.left !== undefined)
//             );
            
//             console.log('💾 유효한 어노테이션:', validAnnotations);
//             console.log('💾 유효한 어노테이션 길이:', validAnnotations.length);
            
//             if (validAnnotations.length === 0) {
//                 const message = '라벨이 있는 어노테이션이 없습니다';
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(message);
//                 }
//                 return;
//             }
            
//             const data = await saveAnnotations(
//                 currentStudyUID, 
//                 currentInstanceUID || 'temp-instance-uid',
//                 currentInstanceNumber || 1,
//                 validAnnotations
//             );
//             console.log('💾 서버 응답:', data);
            
//             if (data.status === 'success') {
//                 if (data.data && data.data.doctor_name) {
//                     const doctorName = data.data.doctor_name;
                    
//                     setAnnotationBoxes(prev => 
//                         prev.map(box => ({
//                             ...box,
//                             doctor_name: doctorName
//                         }))
//                     );
                    
//                     setMeasurementAnnotations(prev => 
//                         prev.map(ann => ({
//                             ...ann,
//                             doctor_name: doctorName
//                         }))
//                     );
//                 }
                
//                 const successMessage = `✅ ✅ 어노테이션 저장 완료! (${validAnnotations.length}개)`;
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(successMessage);
//                 }
//                 showToast(`✅ 어노테이션이 저장되었습니다 (판독의: ${data.data?.doctor_name || ''})`);
//                 console.log('✅', successMessage);
//             } else {
//                 const errorMessage = '❌ 저장 실패: ' + (data.message || '알 수 없는 오류');
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(errorMessage);
//                 }
//                 console.error('❌ 저장 실패 상세:', data);
//             }
//         } catch (error) {
//             const errorMessage = '❌ 저장 실패: ' + error.message;
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(errorMessage);
//             }
//             console.error('❌ 네트워크 에러:', error);
//         }
//     }, [currentStudyUID, currentInstanceUID, currentInstanceNumber, getAllAnnotations, setAnalysisStatus, setActiveLayer]);
    
//     /**
//      * 🔥 서버에서 어노테이션을 불러오는 함수
//      */
//     const loadAnnotationsFromServer = useCallback(async () => {
//         if (!currentStudyUID) {
//             console.log('❌ Study UID가 없어서 로드 불가');
//             return;
//         }
        
//         if (setActiveLayer) {
//             setActiveLayer('annotation');
//         }
        
//         try {
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('어노테이션 불러오는 중...');
//             }
//             console.log('📥 서버에서 어노테이션 불러오기 시작...');
//             console.log('📥 Study UID:', currentStudyUID);
//             console.log('📥 Instance UID:', currentInstanceUID);
            
//             const data = await loadAnnotations(currentStudyUID, currentInstanceUID);
//             console.log('📥 서버 응답 전체:', data);
//             console.log('📥 응답 상태:', data.status);
//             console.log('📥 응답 어노테이션 개수:', data.annotations?.length);
//             console.log('📥 응답 어노테이션 상세:', data.annotations);
            
//             if (data.status === 'success' && data.annotations && data.annotations.length > 0) {
//                 console.log('🔄 어노테이션 변환 시작...');
                
//                 const loadedBoxes = data.annotations.map((ann, index) => {
//                     console.log(`🔄 어노테이션 ${index + 1} 변환:`, ann);
                    
//                     let left = 0, top = 0, width = 0, height = 0;
                    
//                     if (ann.shape_type === 'rectangle' && ann.coordinates && ann.coordinates.length === 4) {
//                         left = ann.coordinates[0];
//                         top = ann.coordinates[1];
//                         width = ann.coordinates[2];
//                         height = ann.coordinates[3];
//                         console.log(`  → 사각형: (${left}, ${top}) ${width}×${height}`);
//                     } else if (ann.shape_type === 'circle' && ann.coordinates && ann.coordinates.length === 3) {
//                         const centerX = ann.coordinates[0];
//                         const centerY = ann.coordinates[1];
//                         const radius = ann.coordinates[2];
//                         left = centerX - radius;
//                         top = centerY - radius;
//                         width = radius * 2;
//                         height = radius * 2;
//                         console.log(`  → 원형: 중심(${centerX}, ${centerY}) 반지름${radius} → 박스(${left}, ${top}) ${width}×${height}`);
//                     } else if (ann.shape_type === 'line' && ann.coordinates && ann.coordinates.length === 4) {
//                         const x1 = ann.coordinates[0];
//                         const y1 = ann.coordinates[1];
//                         const x2 = ann.coordinates[2];
//                         const y2 = ann.coordinates[3];
//                         left = Math.min(x1, x2);
//                         top = Math.min(y1, y2);
//                         width = Math.abs(x2 - x1);
//                         height = Math.abs(y2 - y1);
//                         console.log(`  → 선분: (${x1}, ${y1}) → (${x2}, ${y2}) → 박스(${left}, ${top}) ${width}×${height}`);
//                     } else {
//                         console.warn(`  ⚠️ 알 수 없는 좌표 형태:`, ann.shape_type, ann.coordinates);
//                     }
                    
//                     const converted = {
//                         id: ann.id || (Date.now() + index),
//                         left: left,
//                         top: top,
//                         width: width,
//                         height: height,
//                         label: ann.label,
//                         confidence: ann.confidence || 1.0,
//                         created: ann.created || ann.created_at || new Date().toISOString(),
//                         doctor_name: ann.doctor_name || doctorInfo?.name || '미배정',
                        
//                         // 새로운 Django 필드들
//                         shape_type: ann.shape_type,
//                         coordinates: ann.coordinates,
//                         dr_text: ann.dr_text || '',
//                         instance_uid: ann.instance_uid,
//                         instance_number: ann.instance_number,
                        
//                         // 🔥 measurementId 추가 (중복 제거용)
//                         measurementId: ann.measurementId || `django-${ann.id}`,
                        
//                         // 하위 호환성
//                         memo: ann.dr_text || ''
//                     };
                    
//                     console.log(`  ✅ 변환 완료:`, converted);
//                     return converted;
//                 });
                
//                 console.log('📥 최종 변환된 어노테이션들:', loadedBoxes);
                
//                 setAnnotationBoxes(loadedBoxes);
//                 const successMessage = `✅ 어노테이션 불러오기 완료! (${loadedBoxes.length}개)`;
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(successMessage);
//                 }
//                 showToast(`✅ 어노테이션 ${loadedBoxes.length}개를 불러왔습니다`);
//                 console.log('✅', successMessage);
//             } else {
//                 setAnnotationBoxes([]);
//                 const message = '📥 불러올 어노테이션이 없습니다';
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(message);
//                 }
//                 showToast(message);
//                 console.log('📥', message);
//             }
//         } catch (error) {
//             setAnnotationBoxes([]);
//             console.error('❌ 불러오기 에러 상세:', error);
//             console.error('❌ 에러 스택:', error.stack);
            
//             if (error.message.includes('404') || error.message.includes('Not Found')) {
//                 const message = '📥 불러올 어노테이션이 없습니다';
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(message);
//                 }
//                 showToast(message);
//                 console.log('📥', message);
//             } else {
//                 const errorMessage = '❌ 불러오기 실패: ' + error.message;
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(errorMessage);
//                 }
//                 showToast('❌ 어노테이션 불러오기에 실패했습니다');
//                 console.error('❌ 불러오기 에러:', error);
//             }
//         }
//     }, [currentStudyUID, currentInstanceUID, setAnalysisStatus, setActiveLayer, doctorInfo]);
    
//     /**
//      * 🔥 모든 어노테이션을 클리어하는 함수 (서버에서도 삭제) - 에러 처리 강화
//      */
//     const clearAllAnnotations = useCallback(async () => {
//         if (!currentStudyUID) {
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('Study UID가 없습니다');
//             }
//             return;
//         }

//         const allAnnotations = getAllAnnotations();
//         const totalCount = allAnnotations.length;
        
//         if (totalCount === 0) {
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('삭제할 어노테이션이 없습니다');
//             }
//             return;
//         }

//         if (!window.confirm(`현재 인스턴스의 모든 어노테이션(${totalCount}개)을 삭제하시겠습니까?`)) {
//             return;
//         }

//         if (setActiveLayer) {
//             setActiveLayer('annotation');
//         }

//         try {
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('어노테이션 삭제 중...');
//             }

//             console.log('🗑️ 삭제 요청 시작:', { currentStudyUID, currentInstanceUID });
            
//             await deleteAllAnnotations(currentStudyUID, currentInstanceUID);
            
//             // 🔥 로컬 상태 즉시 초기화 (서버 응답과 상관없이)
//             setAnnotationBoxes([]);
//             setMeasurementAnnotations([]);
            
//             const successMessage = `✅ ${totalCount}개 어노테이션이 삭제되었습니다`;
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(successMessage);
//             }
//             showToast(successMessage);
//             console.log('🗑️', successMessage);
            
//         } catch (error) {
//             console.error('❌ 삭제 에러 상세:', error);
            
//             // 🔥 HTML 응답 에러 처리
//             if (error.message.includes('Unexpected token') || error.message.includes('DOCTYPE')) {
//                 console.log('🔧 HTML 응답 감지 - 로컬 삭제로 처리');
                
//                 // 로컬에서만 삭제
//                 setAnnotationBoxes([]);
//                 setMeasurementAnnotations([]);
                
//                 const localMessage = `⚠️ 서버 연결 문제로 로컬에서만 삭제됨 (${totalCount}개)`;
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(localMessage);
//                 }
//                 showToast('⚠️ 로컬에서만 삭제되었습니다');
//             } else {
//                 const errorMessage = '❌ 삭제 실패: ' + error.message;
//                 if (setAnalysisStatus) {
//                     setAnalysisStatus(errorMessage);
//                 }
//                 showToast('❌ 어노테이션 삭제에 실패했습니다');
//             }
//         }
//     }, [currentStudyUID, currentInstanceUID, getAllAnnotations, setAnalysisStatus, setActiveLayer]);

//     /**
//      * 🔥 수정된 Django 어노테이션 개별 편집 함수 - 올바른 API 엔드포인트 사용
//      */
//     const updateDjangoAnnotation = useCallback(async (annotationId, updateData) => {
//         console.log('✏️ updateDjangoAnnotation 호출:', { annotationId, updateData });
        
//         if (!annotationId || !updateData) {
//             console.error('❌ annotationId 또는 updateData가 없음');
//             return { success: false, error: 'Invalid parameters' };
//         }
        
//         try {
//             // 🔥 수정: 올바른 Django API 엔드포인트와 메서드 사용
//             console.log('🔗 API 호출:', `${API_BASE_URL}/api/dr-annotations/detail/${annotationId}/`);
            
//             const response = await fetch(`${API_BASE_URL}/api/dr-annotations/detail/${annotationId}/`, {
//                 method: 'PUT', // 🔥 수정: PATCH → PUT
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(updateData)
//             });
            
//             console.log('📡 API 응답 상태:', response.status);
            
//             if (!response.ok) {
//                 const errorText = await response.text();
//                 console.error('❌ API 에러 응답:', errorText);
//                 throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//             }
            
//             const result = await response.json();
//             console.log('✅ Django 어노테이션 개별 수정 API 응답:', result);
            
//             // 🔥 Django 응답 구조에 맞게 수정
//             if (result.status === 'success') {
//                 // 🔥 로컬 상태도 업데이트
//                 setAnnotationBoxes(prev => 
//                     prev.map(annotation => 
//                         annotation.id === annotationId ? 
//                         { ...annotation, ...updateData, updated_at: new Date().toISOString() } : 
//                         annotation
//                     )
//                 );
                
//                 showToast(`✅ 라벨이 수정되었습니다: ${updateData.label}`);
//                 return { success: true, data: result.annotation };
//             } else {
//                 throw new Error(result.message || '수정 실패');
//             }
            
//         } catch (error) {
//             console.error('❌ Django 어노테이션 개별 수정 실패:', error);
//             showToast('❌ 라벨 수정에 실패했습니다');
//             return { success: false, error: error.message };
//         }
//     }, []);
    
//     // =============================================================================
//     // 토글 및 UI 함수들
//     // =============================================================================
    
//     const toggleDrawingMode = useCallback(() => {
//         setDrawingMode(prev => {
//             const newMode = !prev;
//             if (setActiveLayer && newMode) {
//                 console.log('✏️ 그리기 모드 ON - 어노테이션 레이어 활성화');
//                 setActiveLayer('annotation');
//             }
//             return newMode;
//         });
//     }, [setActiveLayer]);
    
//     const toggleAnnotations = useCallback(() => {
//         setShowAnnotations(prev => {
//             const newShow = !prev;
//             if (setActiveLayer && newShow) {
//                 setActiveLayer('annotation');
//             }
//             return newShow;
//         });
//     }, [setActiveLayer]);
    
//     const toggleAnnotationDropdown = useCallback(() => {
//         setShowAnnotationDropdown(prev => {
//             const newShow = !prev;
//             if (setActiveLayer && newShow) {
//                 setActiveLayer('annotation');
//             }
//             return newShow;
//         });
//     }, [setActiveLayer]);
    
//     const cancelLabelModal = useCallback(() => {
//         setShowLabelModal(false);
//         setNewBoxLabel('');
//         setTempBox(null);
        
//         if (setActiveLayer) {
//             console.log('❌ 라벨 모달 취소 - 어노테이션 레이어로 복귀');
//             setActiveLayer('annotation');
//         }
//     }, [setActiveLayer]);
    
//     const resetAnnotationState = useCallback(() => {
//         setDrawingMode(false);
//         setIsDrawing(false);
//         setCurrentBox(null);
//         setShowLabelModal(false);
//         setNewBoxLabel('');
//         setTempBox(null);
//         setShowAnnotationDropdown(false);
//     }, []);
    
//     // =============================================================================
//     // 반환값
//     // =============================================================================
    
//     return {
//         // 상태
//         drawingMode,
//         isDrawing,
//         currentBox,
//         showAnnotations,
//         annotationBoxes: getAllAnnotations().filter((ann, index, arr) => 
//             arr.findIndex(a => a.id === ann.id) === index
//         ), // 🔥 ID 기준 중복 제거
//         showLabelModal,
//         newBoxLabel,
//         tempBox,
//         showAnnotationDropdown,
//         overlayRef,
        
//         // 측정값 어노테이션
//         measurementAnnotations,
        
//         // 마우스 이벤트 핸들러
//         handleMouseDown,
//         handleMouseMove,
//         handleMouseUp,
        
//         // 어노테이션 관리
//         saveBoundingBox,
//         deleteBoundingBox,
//         deleteIndividualAnnotation,
//         clearAllAnnotations,
        
//         // 핵심 함수들
//         addMeasurementToAnnotations,
//         convertMeasurementToAnnotation,
//         getAllAnnotations,
//         updateDjangoAnnotation, // 🔥 새로 추가!
        
//         // 서버 통신
//         saveAnnotationsToServer,
//         loadAnnotationsFromServer,
        
//         // UI 토글
//         toggleDrawingMode,
//         toggleAnnotations,
//         toggleAnnotationDropdown,
//         cancelLabelModal,
        
//         // 상태 관리
//         setNewBoxLabel,
//         resetAnnotationState,
        
//         // 상태 설정 함수들
//         setShowAnnotations,
//         setAnnotationBoxes,
//         setMeasurementAnnotations,
//         setDrawingMode
//     };
// };

// export default useAnnotations;


// hooks/viewer_v2/useAnnotations.js
// hooks/viewer_v2/useAnnotations.js - 수정 완료
import { useState, useRef, useCallback } from 'react';
import { 
  saveAnnotations, 
  loadAnnotations, 
  deleteAllAnnotations,
  updateAnnotation
} from '../../utils/viewer_v2/api';

// 🔥 API_BASE_URL 추가
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://35.225.63.41:8000';

// 🔥 토스트 알림 함수
const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    if (!document.head.querySelector('style[data-toast]')) {
        style.setAttribute('data-toast', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
};

/**
 * 어노테이션 관련 상태와 로직을 관리하는 커스텀 훅
 * @param {string} currentStudyUID - 현재 선택된 스터디 UID
 * @param {string} currentInstanceUID - 현재 선택된 인스턴스 UID
 * @param {number} currentInstanceNumber - 현재 선택된 인스턴스 번호
 * @param {Function} setAnalysisStatus - 상태 메시지 설정 함수
 * @param {Function} setActiveLayer - 활성 레이어 설정 함수
 * @param {Object} doctorInfo - 판독의 정보 (WorkList에서)
 * @param {Function} getImageDisplayInfo - 🔥 새로 추가: 이미지 표시 정보 가져오는 함수
 * @param {Function} getOriginalImageSize - 🔥 새로 추가: 원본 이미지 크기 가져오는 함수
 * @returns {Object} 어노테이션 관련 상태와 함수들
 */
const useAnnotations = (
    currentStudyUID, 
    currentInstanceUID, 
    currentInstanceNumber, 
    setAnalysisStatus, 
    setActiveLayer, 
    doctorInfo,
    getImageDisplayInfo, // 🔥 새로 추가
    getOriginalImageSize // 🔥 새로 추가
) => {
    // =============================================================================
    // 상태 관리
    // =============================================================================
    
    // 어노테이션 그리기 관련 상태
    const [drawingMode, setDrawingMode] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentBox, setCurrentBox] = useState(null);
    const [showAnnotations, setShowAnnotations] = useState(true);
    
    // 어노테이션 데이터
    const [annotationBoxes, setAnnotationBoxes] = useState([]);
    
    // 🔥 측정값 기반 어노테이션 저장소
    const [measurementAnnotations, setMeasurementAnnotations] = useState([]);
    
    // 라벨 모달 관련 상태
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [newBoxLabel, setNewBoxLabel] = useState('');
    const [tempBox, setTempBox] = useState(null);
    
    // 드롭다운 상태
    const [showAnnotationDropdown, setShowAnnotationDropdown] = useState(false);
    
    // DOM 참조
    const overlayRef = useRef(null);
    
    // =============================================================================
    // 🔥 수정된 측정값을 Django 어노테이션으로 변환하는 함수들
    // =============================================================================
    
    /**
     * 🔥 수정: 측정값을 Django 어노테이션 형태로 변환 - 타입별 올바른 변환
     */
    const convertMeasurementToAnnotation = useCallback((measurement, annotationData) => {
        console.log('🔄 측정값을 어노테이션으로 변환:', { measurement, annotationData });
        
        let shape_type = 'rectangle';
        let coordinates = [];
        
        // 🔥 수정: 타입별로 올바른 shape_type과 coordinates 설정
        switch (measurement.type) {
            case 'rectangle':
                shape_type = 'rectangle';
                const rectX = Math.min(measurement.startPoint.x, measurement.endPoint.x);
                const rectY = Math.min(measurement.startPoint.y, measurement.endPoint.y);
                const rectWidth = Math.abs(measurement.endPoint.x - measurement.startPoint.x);
                const rectHeight = Math.abs(measurement.endPoint.y - measurement.startPoint.y);
                coordinates = [rectX, rectY, rectWidth, rectHeight];
                console.log('✅ 사각형 변환:', { shape_type, coordinates });
                break;
                
            case 'circle':
                shape_type = 'circle';  // 🔥 수정: 'circle'로 설정
                const centerX = measurement.startPoint.x;
                const centerY = measurement.startPoint.y;
                const radius = Math.sqrt(
                    Math.pow(measurement.endPoint.x - measurement.startPoint.x, 2) + 
                    Math.pow(measurement.endPoint.y - measurement.startPoint.y, 2)
                );
                coordinates = [centerX, centerY, radius];
                console.log('✅ 원형 변환:', { shape_type, coordinates });
                break;
                
            case 'length':
                shape_type = 'line';  // 🔥 수정: 'line'으로 설정
                coordinates = [
                    measurement.startPoint.x, 
                    measurement.startPoint.y,
                    measurement.endPoint.x, 
                    measurement.endPoint.y
                ];
                console.log('✅ 직선 변환:', { shape_type, coordinates });
                break;
                
            default:
                console.warn('⚠️ 알 수 없는 측정값 타입:', measurement.type);
                shape_type = 'rectangle';
                coordinates = [0, 0, 10, 10];
        }
        
        const convertedAnnotation = {
            id: Date.now() + Math.random(),
            measurementId: measurement.id,
            type: measurement.type, // 🔥 추가: 변환용
            startPoint: measurement.startPoint, // 🔥 추가: 변환용
            endPoint: measurement.endPoint, // 🔥 추가: 변환용
            shape_type: shape_type,  // 🔥 수정: 올바른 shape_type 설정
            coordinates: coordinates,  // 🔥 수정: 타입에 맞는 coordinates 설정 (아직 화면 좌표)
            label: annotationData.label || '',
            dr_text: annotationData.memo || '',
            slice: annotationData.slice || currentInstanceNumber || 1,
            confidence: 1.0,
            created: new Date().toISOString(),
            doctor_name: doctorInfo?.name || '미배정',
            
            // 하위 호환성 필드들 (사각형만)
            left: shape_type === 'rectangle' ? coordinates[0] : 0,
            top: shape_type === 'rectangle' ? coordinates[1] : 0,
            width: shape_type === 'rectangle' ? coordinates[2] : 0,
            height: shape_type === 'rectangle' ? coordinates[3] : 0,
            memo: annotationData.memo || ''
        };
        
        console.log('✅ 변환된 어노테이션 (화면 좌표):', convertedAnnotation);
        console.log('✅ shape_type:', convertedAnnotation.shape_type);
        console.log('✅ coordinates:', convertedAnnotation.coordinates);
        console.log('✅ doctor_name:', convertedAnnotation.doctor_name);
        return convertedAnnotation;
    }, [currentInstanceNumber, doctorInfo]);
    
    /**
     * 🔥 핵심 함수: 측정값에 라벨을 추가하고 Django 어노테이션으로 변환 - 좌표 변환 적용
     */
    const addMeasurementToAnnotations = useCallback(async (measurement, annotationData) => {
        console.log('🏷️ useAnnotations - addMeasurementToAnnotations 호출:', { measurement, annotationData });
        
        if (!measurement || !annotationData) {
            console.error('❌ measurement 또는 annotationData가 없음');
            return null;
        }
        
        console.log('✅ 측정값을 Django 어노테이션으로 변환 시작:', measurement.id);
        
        try {
            // 1. 측정값을 Django 어노테이션 형태로 변환 (아직 화면 좌표)
            const djangoAnnotation = convertMeasurementToAnnotation(measurement, annotationData);
            
            // 🔥 2. 좌표 변환 정보 가져오기
            const imageDisplayInfo = getImageDisplayInfo ? getImageDisplayInfo() : null;
            const originalImageSize = getOriginalImageSize ? getOriginalImageSize() : null;
            
            console.log('🔄 좌표 변환 정보:', {
                imageDisplayInfo: !!imageDisplayInfo,
                originalImageSize
            });
            
            // 3. 즉시 서버에 저장 (좌표 변환 적용)
            console.log('💾 Django 어노테이션 서버 저장 시작');
            
            if (!currentStudyUID) {
                console.error('❌ Study UID가 없어서 저장 불가');
                return null;
            }
            
            // 🔥 수정: 불필요한 매개변수 제거
            const saveData = await saveAnnotations(
                currentStudyUID, 
                currentInstanceUID || 'temp-instance-uid',
                currentInstanceNumber || 1,
                [djangoAnnotation]
            );
            
            console.log('💾 서버 저장 응답:', saveData);
            
            if (saveData.status === 'success') {
                console.log('✅ Django 어노테이션 서버 저장 성공');
                
                // 🔥 기존 annotationBoxes에 새 어노테이션 추가
                setAnnotationBoxes(prev => {
                    const exists = prev.find(existing => 
                        existing.measurementId === djangoAnnotation.measurementId ||
                        existing.id === djangoAnnotation.id
                    );
                    
                    if (exists) {
                        console.log('🔄 기존 어노테이션 업데이트:', djangoAnnotation.id);
                        return prev.map(existing => 
                            existing.id === djangoAnnotation.id ? 
                            { ...djangoAnnotation, doctor_name: saveData.data?.doctor_name || existing.doctor_name } : 
                            existing
                        );
                    } else {
                        console.log('✅ 새 어노테이션 추가:', djangoAnnotation.id);
                        const updated = [...prev, { 
                            ...djangoAnnotation, 
                            doctor_name: saveData.data?.doctor_name || djangoAnnotation.doctor_name 
                        }];
                        console.log('📊 총 어노테이션 개수:', updated.length);
                        return updated;
                    }
                });
                
                // 4. measurementAnnotations에 추가/업데이트
                setMeasurementAnnotations(prev => {
                    const existingIndex = prev.findIndex(ann => ann.measurementId === measurement.id);
                    let updated;
                    
                    if (existingIndex >= 0) {
                        updated = [...prev];
                        updated[existingIndex] = djangoAnnotation;
                        console.log('🔄 기존 측정값 어노테이션 업데이트:', measurement.id);
                    } else {
                        updated = [...prev, djangoAnnotation];
                        console.log('✅ 새 측정값 어노테이션 추가:', measurement.id);
                    }
                    
                    console.log('🏷️ measurementAnnotations 업데이트:', updated.length);
                    return updated;
                });
                
                showToast(`✅ 라벨이 추가되었습니다: ${annotationData.label}`);
                console.log('✅ 측정값이 Django 어노테이션으로 추가됨');
                
                // 🔥 핵심: Django 저장 성공시 결과 반환하여 Layout에서 로컬 데이터 정리
                return {
                    success: true,
                    djangoAnnotation,
                    measurementId: measurement.id
                };
                
            } else {
                console.error('❌ Django 어노테이션 서버 저장 실패:', saveData);
                showToast('❌ 라벨 저장에 실패했습니다');
                return null;
            }
            
        } catch (error) {
            console.error('❌ Django 어노테이션 생성/저장 실패:', error);
            showToast('❌ 라벨 저장 중 오류가 발생했습니다');
            return null;
        }
    }, [convertMeasurementToAnnotation, currentStudyUID, currentInstanceUID, currentInstanceNumber, getImageDisplayInfo, getOriginalImageSize]);
    
    /**
     * 🔥 모든 어노테이션 가져오기 - 완전한 중복 제거 + 타입 체크 추가
     */
    const getAllAnnotations = useCallback(() => {
        console.log('📊 getAllAnnotations 호출됨');
        
        const safeAnnotationBoxes = Array.isArray(annotationBoxes) ? annotationBoxes : [];
        const safeMeasurementAnnotations = Array.isArray(measurementAnnotations) ? measurementAnnotations : [];
        
        console.log('📊 안전한 annotationBoxes 길이:', safeAnnotationBoxes.length);
        console.log('📊 안전한 measurementAnnotations 길이:', safeMeasurementAnnotations.length);
        
        // 🔥 Django 어노테이션만 반환 (중복 완전 제거) + 타입 체크 추가
        const uniqueAnnotations = safeAnnotationBoxes.filter(ann => {
            if (!ann) return false;
            
            // 🔥 타입 체크 추가: measurementId가 문자열인지 확인
            if (ann.measurementId && typeof ann.measurementId === 'string') {
                // Django 어노테이션인지 확인
                const isDjango = ann.measurementId.startsWith('django-');
                if (isDjango) {
                    console.log('✅ Django 어노테이션 포함:', ann.measurementId);
                    return true;
                }
            }
            
            // 일반 어노테이션 (직접 그린 것)
            console.log('✅ 일반 어노테이션 포함:', ann.id);
            return true;
        });
        
        console.log('📊 최종 유니크 어노테이션:', uniqueAnnotations.length);
        return uniqueAnnotations;
    }, [annotationBoxes, measurementAnnotations]);
    
    // =============================================================================
    // 마우스 이벤트 핸들러들
    // =============================================================================
    
    const handleMouseDown = useCallback((e) => {
        if (!drawingMode) return;
        
        if (setActiveLayer) {
            console.log('✏️ 어노테이션 그리기 시작 - 어노테이션 레이어 활성화');
            setActiveLayer('annotation');
        }
        
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setIsDrawing(true);
        setCurrentBox({
            startX: x,
            startY: y,
            endX: x,
            endY: y
        });
    }, [drawingMode, setActiveLayer]);
    
    const handleMouseMove = useCallback((e) => {
        if (!isDrawing || !drawingMode) return;
        
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setCurrentBox(prev => prev ? ({
            ...prev,
            endX: x,
            endY: y
        }) : null);
    }, [isDrawing, drawingMode]);
    
    const handleMouseUp = useCallback((e) => {
        if (!isDrawing || !drawingMode) return;
        
        setIsDrawing(false);
        
        if (currentBox) {
            const width = Math.abs(currentBox.endX - currentBox.startX);
            const height = Math.abs(currentBox.endY - currentBox.startY);
            
            if (width > 10 && height > 10) {
                setTempBox(currentBox);
                setShowLabelModal(true);
                
                if (setActiveLayer) {
                    console.log('📋 라벨 모달 열림 - 모달 레이어 활성화');
                    setActiveLayer('modal');
                }
            }
        }
        
        setCurrentBox(null);
    }, [isDrawing, drawingMode, currentBox, setActiveLayer]);
    
    // =============================================================================
    // 어노테이션 관리 함수들
    // =============================================================================
    
    const saveBoundingBox = useCallback((label) => {
        if (!tempBox || !label.trim()) return;
        
        const normalizedBox = {
            id: Date.now(),
            left: Math.min(tempBox.startX, tempBox.endX),
            top: Math.min(tempBox.startY, tempBox.endY),
            width: Math.abs(tempBox.endX - tempBox.startX),
            height: Math.abs(tempBox.endY - tempBox.startY),
            label: label.trim(),
            confidence: 1.0,
            created: new Date().toISOString(),
            doctor_name: doctorInfo?.name || '미배정',
            shape_type: 'rectangle',
            coordinates: [
                Math.min(tempBox.startX, tempBox.endX),
                Math.min(tempBox.startY, tempBox.endY),
                Math.abs(tempBox.endX - tempBox.startX),
                Math.abs(tempBox.endY - tempBox.startY)
            ]
        };
        
        setAnnotationBoxes(prev => {
            const newBoxes = [...prev, normalizedBox];
            console.log('💾 어노테이션 추가됨:', normalizedBox);
            console.log('💾 전체 어노테이션 개수:', newBoxes.length);
            return newBoxes;
        });
        
        setShowLabelModal(false);
        setNewBoxLabel('');
        setTempBox(null);
        
        if (setActiveLayer) {
            console.log('💾 라벨 저장 완료 - 어노테이션 레이어로 복귀');
            setActiveLayer('annotation');
        }
    }, [tempBox, setActiveLayer, doctorInfo]);
    
    const deleteBoundingBox = useCallback((boxId) => {
        setAnnotationBoxes(prev => {
            const filteredBoxes = prev.filter(box => box.id !== boxId);
            console.log('🗑️ 어노테이션 삭제됨 ID:', boxId);
            console.log('🗑️ 남은 어노테이션 개수:', filteredBoxes.length);
            return filteredBoxes;
        });
        
        setMeasurementAnnotations(prev => {
            const filtered = prev.filter(ann => ann.id !== boxId && ann.measurementId !== boxId);
            console.log('🗑️ measurementAnnotations에서도 삭제:', filtered.length);
            return filtered;
        });
        
        if (setActiveLayer) {
            console.log('🗑️ 어노테이션 삭제 - 어노테이션 레이어 활성화');
            setActiveLayer('annotation');
        }
    }, [setActiveLayer]);
    
    const deleteIndividualAnnotation = useCallback((boxId) => {
        const allAnnotations = getAllAnnotations();
        const box = allAnnotations.find(b => b.id === boxId);
        if (box && window.confirm(`"${box.label}" 어노테이션을 삭제하시겠습니까?`)) {
            deleteBoundingBox(boxId);
            setShowAnnotationDropdown(false);
        }
    }, [getAllAnnotations, deleteBoundingBox]);
    
    // =============================================================================
    // 🔥 서버 통신 함수들 - 좌표 변환 적용
    // =============================================================================
    
    /**
     * 🔥 모든 어노테이션을 서버에 저장 - 좌표 변환 적용
     */
    const saveAnnotationsToServer = useCallback(async () => {
        console.log('💾 saveAnnotationsToServer 호출됨');
        console.log('💾 currentStudyUID:', currentStudyUID);
        console.log('💾 currentInstanceUID:', currentInstanceUID);
        console.log('💾 currentInstanceNumber:', currentInstanceNumber);
        
        // 함수가 전달된 경우 처리
        if (typeof currentInstanceUID === 'function') {
            console.error('🚨 currentInstanceUID가 함수입니다! Layout.js 문제');
            if (setAnalysisStatus) {
                setAnalysisStatus('❌ currentInstanceUID가 함수입니다!');
            }
            return;
        }
        
        if (typeof currentInstanceNumber === 'function') {
            console.error('🚨 currentInstanceNumber가 함수입니다! Layout.js 문제');
            if (setAnalysisStatus) {
                setAnalysisStatus('❌ currentInstanceNumber가 함수입니다!');
            }
            return;
        }
        
        if (!currentStudyUID) {
            const message = 'Study UID가 없습니다';
            if (setAnalysisStatus) {
                setAnalysisStatus(message);
            }
            console.log('❌', message);
            return;
        }

        if (!currentInstanceUID) {
            console.warn('⚠️ Instance UID가 없지만 임시로 기본값 사용');
        }
        
        let allAnnotations;
        try {
            allAnnotations = getAllAnnotations();
            console.log('💾 getAllAnnotations 결과:', allAnnotations);
        } catch (error) {
            console.error('❌ getAllAnnotations 호출 실패:', error);
            const errorMessage = '❌ 어노테이션 조회 실패: ' + error.message;
            if (setAnalysisStatus) {
                setAnalysisStatus(errorMessage);
            }
            return;
        }
        
        if (!Array.isArray(allAnnotations) || allAnnotations.length === 0) {
            const message = '저장할 어노테이션이 없습니다';
            if (setAnalysisStatus) {
                setAnalysisStatus(message);
            }
            console.log('❌', message);
            return;
        }
        
        if (setActiveLayer) {
            setActiveLayer('annotation');
        }
        
        try {
            if (setAnalysisStatus) {
                setAnalysisStatus('어노테이션 저장 중...');
            }
            console.log('💾 서버 저장 시작...');
            
            // 라벨이 있는 어노테이션만 저장
            const validAnnotations = allAnnotations.filter(ann => 
                ann && ann.label && ann.label.trim() !== '' && 
                (ann.coordinates || ann.startPoint || ann.left !== undefined)
            );
            
            console.log('💾 유효한 어노테이션:', validAnnotations);
            console.log('💾 유효한 어노테이션 길이:', validAnnotations.length);
            
            if (validAnnotations.length === 0) {
                const message = '라벨이 있는 어노테이션이 없습니다';
                if (setAnalysisStatus) {
                    setAnalysisStatus(message);
                }
                return;
            }
            
            // 🔥 좌표 변환 정보 가져오기
            const imageDisplayInfo = getImageDisplayInfo ? getImageDisplayInfo() : null;
            const originalImageSize = getOriginalImageSize ? getOriginalImageSize() : null;
            
            console.log('🔄 저장용 좌표 변환 정보:', {
                imageDisplayInfo: !!imageDisplayInfo,
                originalImageSize
            });
            
            // 🔥 수정: 불필요한 매개변수 제거
            const data = await saveAnnotations(
                currentStudyUID, 
                currentInstanceUID || 'temp-instance-uid',
                currentInstanceNumber || 1,
                validAnnotations
            );
            console.log('💾 서버 응답:', data);
            
            if (data.status === 'success') {
                if (data.data && data.data.doctor_name) {
                    const doctorName = data.data.doctor_name;
                    
                    setAnnotationBoxes(prev => 
                        prev.map(box => ({
                            ...box,
                            doctor_name: doctorName
                        }))
                    );
                    
                    setMeasurementAnnotations(prev => 
                        prev.map(ann => ({
                            ...ann,
                            doctor_name: doctorName
                        }))
                    );
                }
                
                const successMessage = `✅ ✅ 어노테이션 저장 완료! (${validAnnotations.length}개)`;
                if (setAnalysisStatus) {
                    setAnalysisStatus(successMessage);
                }
                showToast(`✅ 어노테이션이 저장되었습니다 (판독의: ${data.data?.doctor_name || ''})`);
                console.log('✅', successMessage);
            } else {
                const errorMessage = '❌ 저장 실패: ' + (data.message || '알 수 없는 오류');
                if (setAnalysisStatus) {
                    setAnalysisStatus(errorMessage);
                }
                console.error('❌ 저장 실패 상세:', data);
            }
        } catch (error) {
            const errorMessage = '❌ 저장 실패: ' + error.message;
            if (setAnalysisStatus) {
                setAnalysisStatus(errorMessage);
            }
            console.error('❌ 네트워크 에러:', error);
        }
    }, [currentStudyUID, currentInstanceUID, currentInstanceNumber, getAllAnnotations, setAnalysisStatus, setActiveLayer, getImageDisplayInfo, getOriginalImageSize]);
    
    /**
     * 🔥 서버에서 어노테이션을 불러오는 함수 - 좌표 변환 적용
     */
    const loadAnnotationsFromServer = useCallback(async () => {
        if (!currentStudyUID) {
            console.log('❌ Study UID가 없어서 로드 불가');
            return;
        }
        
        if (setActiveLayer) {
            setActiveLayer('annotation');
        }
        
        try {
            if (setAnalysisStatus) {
                setAnalysisStatus('어노테이션 불러오는 중...');
            }
            console.log('📥 서버에서 어노테이션 불러오기 시작...');
            console.log('📥 Study UID:', currentStudyUID);
            console.log('📥 Instance UID:', currentInstanceUID);
            
            // 🔥 좌표 변환 정보 가져오기
            const imageDisplayInfo = getImageDisplayInfo ? getImageDisplayInfo() : null;
            const originalImageSize = getOriginalImageSize ? getOriginalImageSize() : null;
            
            console.log('🔄 불러오기용 좌표 변환 정보:', {
                imageDisplayInfo: !!imageDisplayInfo,
                originalImageSize
            });
            
            // 🔥 수정: 잘못된 매개변수 제거
            const data = await loadAnnotations(
                currentStudyUID, 
                currentInstanceUID
            );
            console.log('📥 서버 응답 전체:', data);
            console.log('📥 응답 상태:', data.status);
            console.log('📥 응답 어노테이션 개수:', data.annotations?.length);
            console.log('📥 응답 어노테이션 상세:', data.annotations);
            
            if (data.status === 'success' && data.annotations && data.annotations.length > 0) {
                console.log('🔄 어노테이션 변환 시작...');
                
                const loadedBoxes = data.annotations.map((ann, index) => {
                    console.log(`🔄 어노테이션 ${index + 1} 변환:`, ann);
                    
                    let left = 0, top = 0, width = 0, height = 0;
                    
                    if (ann.shape_type === 'rectangle' && ann.coordinates && ann.coordinates.length === 4) {
                        left = ann.coordinates[0];
                        top = ann.coordinates[1];
                        width = ann.coordinates[2];
                        height = ann.coordinates[3];
                        console.log(`  → 사각형: (${left}, ${top}) ${width}×${height}`);
                    } else if (ann.shape_type === 'circle' && ann.coordinates && ann.coordinates.length === 3) {
                        const centerX = ann.coordinates[0];
                        const centerY = ann.coordinates[1];
                        const radius = ann.coordinates[2];
                        left = centerX - radius;
                        top = centerY - radius;
                        width = radius * 2;
                        height = radius * 2;
                        console.log(`  → 원형: 중심(${centerX}, ${centerY}) 반지름${radius} → 박스(${left}, ${top}) ${width}×${height}`);
                    } else if (ann.shape_type === 'line' && ann.coordinates && ann.coordinates.length === 4) {
                        const x1 = ann.coordinates[0];
                        const y1 = ann.coordinates[1];
                        const x2 = ann.coordinates[2];
                        const y2 = ann.coordinates[3];
                        left = Math.min(x1, x2);
                        top = Math.min(y1, y2);
                        width = Math.abs(x2 - x1);
                        height = Math.abs(y2 - y1);
                        console.log(`  → 선분: (${x1}, ${y1}) → (${x2}, ${y2}) → 박스(${left}, ${top}) ${width}×${height}`);
                    } else {
                        console.warn(`  ⚠️ 알 수 없는 좌표 형태:`, ann.shape_type, ann.coordinates);
                    }
                    
                    const converted = {
                        id: ann.id || (Date.now() + index),
                        left: left,
                        top: top,
                        width: width,
                        height: height,
                        label: ann.label,
                        confidence: ann.confidence || 1.0,
                        created: ann.created || ann.created_at || new Date().toISOString(),
                        doctor_name: ann.doctor_name || doctorInfo?.name || '미배정',
                        
                        // 새로운 Django 필드들
                        shape_type: ann.shape_type,
                        coordinates: ann.coordinates,
                        dr_text: ann.dr_text || '',
                        instance_uid: ann.instance_uid,
                        instance_number: ann.instance_number,
                        
                        // 🔥 measurementId 추가 (중복 제거용)
                        measurementId: ann.measurementId || `django-${ann.id}`,
                        
                        // 하위 호환성
                        memo: ann.dr_text || ''
                    };
                    
                    console.log(`  ✅ 변환 완료:`, converted);
                    return converted;
                });
                
                console.log('📥 최종 변환된 어노테이션들:', loadedBoxes);
                
                setAnnotationBoxes(loadedBoxes);
                const successMessage = `✅ 어노테이션 불러오기 완료! (${loadedBoxes.length}개)`;
                if (setAnalysisStatus) {
                    setAnalysisStatus(successMessage);
                }
                showToast(`✅ 어노테이션 ${loadedBoxes.length}개를 불러왔습니다`);
                console.log('✅', successMessage);
            } else {
                setAnnotationBoxes([]);
                const message = '📥 불러올 어노테이션이 없습니다';
                if (setAnalysisStatus) {
                    setAnalysisStatus(message);
                }
                showToast(message);
                console.log('📥', message);
            }
        } catch (error) {
            setAnnotationBoxes([]);
            console.error('❌ 불러오기 에러 상세:', error);
            console.error('❌ 에러 스택:', error.stack);
            
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                const message = '📥 불러올 어노테이션이 없습니다';
                if (setAnalysisStatus) {
                    setAnalysisStatus(message);
                }
                showToast(message);
                console.log('📥', message);
            } else {
                const errorMessage = '❌ 불러오기 실패: ' + error.message;
                if (setAnalysisStatus) {
                    setAnalysisStatus(errorMessage);
                }
                showToast('❌ 어노테이션 불러오기에 실패했습니다');
                console.error('❌ 불러오기 에러:', error);
            }
        }
    }, [currentStudyUID, currentInstanceUID, setAnalysisStatus, setActiveLayer, doctorInfo, getImageDisplayInfo, getOriginalImageSize]);
    
    /**
     * 🔥 모든 어노테이션을 클리어하는 함수 (서버에서도 삭제) - 에러 처리 강화
     */
    const clearAllAnnotations = useCallback(async () => {
        if (!currentStudyUID) {
            if (setAnalysisStatus) {
                setAnalysisStatus('Study UID가 없습니다');
            }
            return;
        }

        const allAnnotations = getAllAnnotations();
        const totalCount = allAnnotations.length;
        
        if (totalCount === 0) {
            if (setAnalysisStatus) {
                setAnalysisStatus('삭제할 어노테이션이 없습니다');
            }
            return;
        }

        if (!window.confirm(`현재 인스턴스의 모든 어노테이션(${totalCount}개)을 삭제하시겠습니까?`)) {
            return;
        }

        if (setActiveLayer) {
            setActiveLayer('annotation');
        }

        try {
            if (setAnalysisStatus) {
                setAnalysisStatus('어노테이션 삭제 중...');
            }

            console.log('🗑️ 삭제 요청 시작:', { currentStudyUID, currentInstanceUID });
            
            await deleteAllAnnotations(currentStudyUID, currentInstanceUID);
            
            // 🔥 로컬 상태 즉시 초기화 (서버 응답과 상관없이)
            setAnnotationBoxes([]);
            setMeasurementAnnotations([]);
            
            const successMessage = `✅ ${totalCount}개 어노테이션이 삭제되었습니다`;
            if (setAnalysisStatus) {
                setAnalysisStatus(successMessage);
            }
            showToast(successMessage);
            console.log('🗑️', successMessage);
            
        } catch (error) {
            console.error('❌ 삭제 에러 상세:', error);
            
            // 🔥 HTML 응답 에러 처리
            if (error.message.includes('Unexpected token') || error.message.includes('DOCTYPE')) {
                console.log('🔧 HTML 응답 감지 - 로컬 삭제로 처리');
                
                // 로컬에서만 삭제
                setAnnotationBoxes([]);
                setMeasurementAnnotations([]);
                
                const localMessage = `⚠️ 서버 연결 문제로 로컬에서만 삭제됨 (${totalCount}개)`;
                if (setAnalysisStatus) {
                    setAnalysisStatus(localMessage);
                }
                showToast('⚠️ 로컬에서만 삭제되었습니다');
            } else {
                const errorMessage = '❌ 삭제 실패: ' + error.message;
                if (setAnalysisStatus) {
                    setAnalysisStatus(errorMessage);
                }
                showToast('❌ 어노테이션 삭제에 실패했습니다');
            }
        }
    }, [currentStudyUID, currentInstanceUID, getAllAnnotations, setAnalysisStatus, setActiveLayer]);

    /**
     * 🔥 수정된 Django 어노테이션 개별 편집 함수 - 좌표 변환 적용
     */
    const updateDjangoAnnotation = useCallback(async (annotationId, updateData) => {
        console.log('✏️ updateDjangoAnnotation 호출:', { annotationId, updateData });
        
        if (!annotationId || !updateData) {
            console.error('❌ annotationId 또는 updateData가 없음');
            return { success: false, error: 'Invalid parameters' };
        }
        
        try {
            // 🔥 좌표 변환 정보 가져오기
            const imageDisplayInfo = getImageDisplayInfo ? getImageDisplayInfo() : null;
            const originalImageSize = getOriginalImageSize ? getOriginalImageSize() : null;
            
            console.log('🔄 개별 수정용 좌표 변환 정보:', {
                imageDisplayInfo: !!imageDisplayInfo,
                originalImageSize,
                hasCoordinates: !!(updateData.startPoint && updateData.endPoint)
            });
            
            // 🔥 수정: 불필요한 매개변수 제거
            console.log('🔗 API 호출:', `${API_BASE_URL}/api/dr-annotations/detail/${annotationId}/`);
            
            const result = await updateAnnotation(
                annotationId, 
                updateData
            );
            
            console.log('✅ Django 어노테이션 개별 수정 API 응답:', result);
            
            // 🔥 Django 응답 구조에 맞게 수정
            if (result.status === 'success') {
                // 🔥 로컬 상태도 업데이트
                setAnnotationBoxes(prev => 
                    prev.map(annotation => 
                        annotation.id === annotationId ? 
                        { ...annotation, ...updateData, updated_at: new Date().toISOString() } : 
                        annotation
                    )
                );
                
                showToast(`✅ 라벨이 수정되었습니다: ${updateData.label}`);
                return { success: true, data: result.annotation };
            } else {
                throw new Error(result.message || '수정 실패');
            }
            
        } catch (error) {
            console.error('❌ Django 어노테이션 개별 수정 실패:', error);
            showToast('❌ 라벨 수정에 실패했습니다');
            return { success: false, error: error.message };
        }
    }, [getImageDisplayInfo, getOriginalImageSize]);
    
    // =============================================================================
    // 토글 및 UI 함수들
    // =============================================================================
    
    const toggleDrawingMode = useCallback(() => {
        setDrawingMode(prev => {
            const newMode = !prev;
            if (setActiveLayer && newMode) {
                console.log('✏️ 그리기 모드 ON - 어노테이션 레이어 활성화');
                setActiveLayer('annotation');
            }
            return newMode;
        });
    }, [setActiveLayer]);
    
    const toggleAnnotations = useCallback(() => {
        setShowAnnotations(prev => {
            const newShow = !prev;
            if (setActiveLayer && newShow) {
                setActiveLayer('annotation');
            }
            return newShow;
        });
    }, [setActiveLayer]);
    
    const toggleAnnotationDropdown = useCallback(() => {
        setShowAnnotationDropdown(prev => {
            const newShow = !prev;
            if (setActiveLayer && newShow) {
                setActiveLayer('annotation');
            }
            return newShow;
        });
    }, [setActiveLayer]);
    
    const cancelLabelModal = useCallback(() => {
        setShowLabelModal(false);
        setNewBoxLabel('');
        setTempBox(null);
        
        if (setActiveLayer) {
            console.log('❌ 라벨 모달 취소 - 어노테이션 레이어로 복귀');
            setActiveLayer('annotation');
        }
    }, [setActiveLayer]);
    
    const resetAnnotationState = useCallback(() => {
        setDrawingMode(false);
        setIsDrawing(false);
        setCurrentBox(null);
        setShowLabelModal(false);
        setNewBoxLabel('');
        setTempBox(null);
        setShowAnnotationDropdown(false);
    }, []);
    
    // =============================================================================
    // 반환값
    // =============================================================================
    
    return {
        // 상태
        drawingMode,
        isDrawing,
        currentBox,
        showAnnotations,
        annotationBoxes: getAllAnnotations().filter((ann, index, arr) => 
            arr.findIndex(a => a.id === ann.id) === index
        ), // 🔥 ID 기준 중복 제거
        showLabelModal,
        newBoxLabel,
        tempBox,
        showAnnotationDropdown,
        overlayRef,
        
        // 측정값 어노테이션
        measurementAnnotations,
        
        // 마우스 이벤트 핸들러
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        
        // 어노테이션 관리
        saveBoundingBox,
        deleteBoundingBox,
        deleteIndividualAnnotation,
        clearAllAnnotations,
        
        // 핵심 함수들
        addMeasurementToAnnotations,
        convertMeasurementToAnnotation,
        getAllAnnotations,
        updateDjangoAnnotation, // 🔥 수정 완료!
        
        // 서버 통신
        saveAnnotationsToServer,
        loadAnnotationsFromServer,
        
        // UI 토글
        toggleDrawingMode,
        toggleAnnotations,
        toggleAnnotationDropdown,
        cancelLabelModal,
        
        // 상태 관리
        setNewBoxLabel,
        resetAnnotationState,
        
        // 상태 설정 함수들
        setShowAnnotations,
        setAnnotationBoxes,
        setMeasurementAnnotations,
        setDrawingMode
    };
};

export default useAnnotations;