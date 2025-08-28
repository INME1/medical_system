// // /home/medical_system/pacsapp/src/utils/viewer_v2/api.js

// /**
//  * Django 백엔드 어노테이션 API 함수들
//  * 새로운 구조: shape_type + coordinates 기반
//  */

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://35.225.63.41:8000';
// const ANNOTATION_API_URL = `${API_BASE_URL}/api/dr-annotations`;
// const AI_ANALYSIS_API_URL = `${API_BASE_URL}/api/ai`;


// /**
//  * API 요청 헬퍼 함수
//  */
// const apiRequest = async (url, options = {}) => {
//   try {
//     const method = options.method || 'GET';
//     const headers = {
//       'Content-Type': 'application/json',
//       ...(options.headers || {})
//     };

//     const response = await fetch(url, {
//       method,
//       headers,
//       body: options.body || undefined,
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || `HTTP error! status: ${response.status}`);
//     }

//     return data;
//   } catch (error) {
//     console.error('API 요청 실패:', error);
//     throw error;
//   }
// };

// /**
//  * 🔥 완전 수정: 어노테이션을 서버에 저장 - 타입별 올바른 변환
//  */
// export const saveAnnotations = async (studyUID, instanceUID, instanceNumber, annotations) => {
//   console.log('💾 API - 어노테이션 저장 시작:', { 
//     studyUID, 
//     instanceUID, 
//     instanceNumber, 
//     count: annotations.length 
//   });

//   // 🔥 완전 수정: React 측정값 구조를 Django 구조로 변환
//   const convertedAnnotations = annotations.map(annotation => {
//     let shape_type = 'rectangle';
//     let coordinates = [];

//     console.log('🔄 변환 중인 어노테이션:', annotation);
//     console.log('🔄 어노테이션 타입:', annotation.type);
//     console.log('🔄 어노테이션 shape_type:', annotation.shape_type);

//     // 🔥 이미 shape_type이 있는 경우 (Django에서 온 데이터)
//     if (annotation.shape_type && annotation.coordinates) {
//       shape_type = annotation.shape_type;
//       coordinates = annotation.coordinates;
//       console.log('✅ Django 데이터 그대로 사용:', { shape_type, coordinates });
//     }
//     // 🔥 기존 bbox 기반 데이터 처리 (하위 호환성)
//     else if (annotation.left !== undefined && annotation.top !== undefined) {
//       shape_type = 'rectangle';
//       coordinates = [
//         annotation.left,
//         annotation.top,
//         annotation.width,
//         annotation.height
//       ];
//       console.log('✅ BBox → Rectangle 변환:', { shape_type, coordinates });
//     } 
//     // 🔥 새로운 측정값 기반 데이터 처리 - 타입별 완전 분리
//     else if (annotation.type && annotation.startPoint) {
//       console.log('🔄 측정값 타입별 변환 시작:', annotation.type);
      
//       switch (annotation.type) {
//         case 'length':
//           shape_type = 'line';  // 🔥 수정: line으로 설정
//           coordinates = [
//             annotation.startPoint.x,
//             annotation.startPoint.y,
//             annotation.endPoint.x,
//             annotation.endPoint.y
//           ];
//           console.log('✅ Length → Line 변환:', { shape_type, coordinates });
//           break;
          
//         case 'rectangle':
//           shape_type = 'rectangle';
//           const rectX = Math.min(annotation.startPoint.x, annotation.endPoint.x);
//           const rectY = Math.min(annotation.startPoint.y, annotation.endPoint.y);
//           const rectW = Math.abs(annotation.endPoint.x - annotation.startPoint.x);
//           const rectH = Math.abs(annotation.endPoint.y - annotation.startPoint.y);
//           coordinates = [rectX, rectY, rectW, rectH];
//           console.log('✅ Rectangle → Rectangle 변환:', { shape_type, coordinates });
//           break;
          
//         case 'circle':
//           shape_type = 'circle';  // 🔥 수정: circle로 설정
//           const centerX = annotation.startPoint.x;
//           const centerY = annotation.startPoint.y;
//           const radius = Math.sqrt(
//             Math.pow(annotation.endPoint.x - annotation.startPoint.x, 2) + 
//             Math.pow(annotation.endPoint.y - annotation.startPoint.y, 2)
//           );
//           coordinates = [centerX, centerY, radius];
//           console.log('✅ Circle → Circle 변환:', { shape_type, coordinates });
//           break;
          
//         default:
//           console.warn('⚠️ 알 수 없는 어노테이션 타입:', annotation.type);
//           shape_type = 'rectangle';
//           coordinates = [0, 0, 10, 10];
//       }
//     }
//     // 기본값 처리
//     else {
//       console.warn('❌ 어노테이션 구조를 인식할 수 없음:', annotation);
//       shape_type = 'rectangle';
//       coordinates = [0, 0, 10, 10];
//     }

//     const result = {
//       label: annotation.label || 'Untitled',
//       shape_type: shape_type,  // 🔥 핵심: 올바른 shape_type 설정
//       coordinates: coordinates,  // 🔥 핵심: 타입에 맞는 coordinates 설정
//       dr_text: annotation.memo || annotation.dr_text || ''
//     };

//     console.log('🎯 최종 변환 결과:', result);
//     return result;
//   });

//   const requestData = {
//     study_uid: studyUID,
//     instance_uid: instanceUID,
//     instance_number: instanceNumber,
//     annotations: convertedAnnotations
//   };

//   console.log('📤 API - 전송할 데이터:', requestData);
//   console.log('📤 API - 전송할 어노테이션들:', convertedAnnotations);

//   return await apiRequest(`${ANNOTATION_API_URL}/save/`, {
//     method: 'POST',
//     body: JSON.stringify(requestData),
//   });
// };

// /**
//  * 서버에서 어노테이션을 불러오기 (인스턴스 단위)
//  */
// export const loadAnnotations = async (studyUID, instanceUID) => {
//   console.log('📥 API - 어노테이션 불러오기 시작:', { studyUID, instanceUID });

//   const queryParams = new URLSearchParams({
//     instance_uid: instanceUID
//   });

//   const response = await apiRequest(`${ANNOTATION_API_URL}/load/${studyUID}/?${queryParams.toString()}`);

//   console.log('📥 API - 불러온 원본 데이터:', response);

//   // Django 구조를 React 구조로 변환
//   if (response.status === 'success' && response.annotations) {
//     const convertedAnnotations = response.annotations.map((ann, index) => {
//       let bbox;
//       let measurement = null;

//       // shape_type에 따라 bbox 계산 (하위 호환성을 위해)
//       switch (ann.shape_type) {
//         case 'rectangle':
//           bbox = [
//             ann.coordinates[0],
//             ann.coordinates[1],
//             ann.coordinates[0] + ann.coordinates[2],
//             ann.coordinates[1] + ann.coordinates[3]
//           ];
//           break;
          
//         case 'circle':
//           const centerX = ann.coordinates[0];
//           const centerY = ann.coordinates[1];
//           const radius = ann.coordinates[2];
//           bbox = [
//             centerX - radius,
//             centerY - radius,
//             centerX + radius,
//             centerY + radius
//           ];
//           break;
          
//         case 'line':
//           bbox = ann.coordinates;
//           break;
          
//         default:
//           console.warn('알 수 없는 shape_type:', ann.shape_type);
//           bbox = [0, 0, 10, 10];
//       }

//       // 새로운 측정값 형태 객체도 생성
//       if (ann.shape_type === 'line') {
//         measurement = {
//           id: ann.id || `measurement-${Date.now()}-${index}`,
//           type: 'length',
//           startPoint: { x: ann.coordinates[0], y: ann.coordinates[1] },
//           endPoint: { x: ann.coordinates[2], y: ann.coordinates[3] },
//           isComplete: true,
//           visible: true
//         };
//       } else if (ann.shape_type === 'rectangle') {
//         measurement = {
//           id: ann.id || `measurement-${Date.now()}-${index}`,
//           type: 'rectangle',
//           startPoint: { x: ann.coordinates[0], y: ann.coordinates[1] },
//           endPoint: { 
//             x: ann.coordinates[0] + ann.coordinates[2], 
//             y: ann.coordinates[1] + ann.coordinates[3] 
//           },
//           isComplete: true,
//           visible: true
//         };
//       } else if (ann.shape_type === 'circle') {
//         measurement = {
//           id: ann.id || `measurement-${Date.now()}-${index}`,
//           type: 'circle',
//           startPoint: { x: ann.coordinates[0], y: ann.coordinates[1] },
//           endPoint: { 
//             x: ann.coordinates[0] + ann.coordinates[2], 
//             y: ann.coordinates[1] 
//           },
//           isComplete: true,
//           visible: true
//         };
//       }

//       return {
//         // 기존 bbox 기반 구조 (하위 호환성)
//         id: ann.id || Date.now() + index,
//         left: bbox[0],
//         top: bbox[1],
//         width: Math.abs(bbox[2] - bbox[0]),
//         height: Math.abs(bbox[3] - bbox[1]),
//         label: ann.label,
//         confidence: ann.confidence || 1.0,
//         created: ann.created_at || ann.created,
//         doctor_name: ann.doctor_name,
        
//         // 새로운 Django 구조 필드들
//         shape_type: ann.shape_type,
//         coordinates: ann.coordinates,
//         dr_text: ann.dr_text,
        
//         // 추가 메타데이터
//         bbox: bbox,
//         measurement: measurement,
        
//         // 서버 원본 데이터 보존
//         _original: ann
//       };
//     });

//     console.log('📥 API - 변환된 데이터:', convertedAnnotations);

//     return {
//       ...response,
//       annotations: convertedAnnotations
//     };
//   }

//   return response;
// };

// /**
//  * 개별 어노테이션 수정
//  */
// export const updateAnnotation = async (annotationId, updateData) => {
//   console.log('✏️ API - 어노테이션 수정:', { annotationId, updateData });

//   return await apiRequest(`${ANNOTATION_API_URL}/detail/${annotationId}/`, {
//     method: 'PUT',
//     body: JSON.stringify(updateData),
//   });
// };

// /**
//  * 개별 어노테이션 삭제
//  */
// export const deleteAnnotation = async (annotationId) => {
//   console.log('🗑️ API - 어노테이션 삭제:', annotationId);

//   return await apiRequest(`${ANNOTATION_API_URL}/detail/${annotationId}/`, {
//     method: 'DELETE',
//   });
// };

// /**
//  * 특정 인스턴스의 모든 어노테이션 삭제
//  */
// export const deleteAllAnnotations = async (studyUID, instanceUID) => {
//   console.log('🗑️ API - 인스턴스 어노테이션 삭제:', { studyUID, instanceUID });

//   const queryParams = new URLSearchParams({
//     instance_uid: instanceUID
//   });

//   return await apiRequest(`${ANNOTATION_API_URL}/delete-all/${studyUID}/?${queryParams.toString()}`, {
//     method: 'DELETE',
//   });
// };

// /**
//  * 여러 인스턴스의 어노테이션 일괄 조회
//  */
// export const loadAnnotationsByInstances = async (instanceUIDs) => {
//   console.log('📥 API - 여러 인스턴스 어노테이션 조회:', instanceUIDs);

//   return await apiRequest(`${ANNOTATION_API_URL}/by-instances/`, {
//     method: 'POST',
//     body: JSON.stringify({ instance_uids: instanceUIDs }),
//   });
// };

// /**
//  * 특정 Study의 모든 어노테이션 조회 (모든 인스턴스)
//  */
// export const loadAllStudyAnnotations = async (studyUID) => {
//   console.log('📥 API - Study 전체 어노테이션 조회:', studyUID);

//   return await apiRequest(`${ANNOTATION_API_URL}/study/${studyUID}/`);
// };

// /**
//  * 어노테이션 목록 조회 (관리용)
//  */
// export const getAnnotationList = async (filters = {}) => {
//   console.log('📋 API - 어노테이션 목록 조회:', filters);

//   const queryParams = new URLSearchParams();
//   Object.entries(filters).forEach(([key, value]) => {
//     if (value !== null && value !== undefined && value !== '') {
//       queryParams.append(key, value);
//     }
//   });

//   const url = `${ANNOTATION_API_URL}/list/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

//   return await apiRequest(url);
// };

// /**
//  * 어노테이션 상세 조회 (면적/길이 계산 포함)
//  */
// export const getAnnotationDetail = async (annotationId) => {
//   console.log('🔍 API - 어노테이션 상세 조회:', annotationId);

//   return await apiRequest(`${ANNOTATION_API_URL}/detail/${annotationId}/`);
// };

// /**
//  * 에러 처리 헬퍼
//  */
// export const handleApiError = (error) => {
//   console.error('API 에러:', error);
  
//   if (error.message.includes('404')) {
//     return '데이터를 찾을 수 없습니다.';
//   } else if (error.message.includes('500')) {
//     return '서버 오류가 발생했습니다.';
//   } else if (error.message.includes('Network')) {
//     return '네트워크 연결을 확인해주세요.';
//   }
  
//   return error.message || '알 수 없는 오류가 발생했습니다.';
// };

// /**
//  * 🤖 AI 분석 결과 조회 (Study 전체) - 인스턴스별 필터링 지원
//  * 🔥 YOLO 결과 디버깅 로직 추가
//  */
// export const getAIAnalysisResults = async (studyUID) => {
//   console.log('🤖 API - AI 분석 결과 조회:', studyUID);

//   try {
//     const response = await apiRequest(`${AI_ANALYSIS_API_URL}/results/${studyUID}/`);
    
//     // 🔥 원본 응답 상세 로깅 추가
//     console.log('🔍 Django 원본 응답 전체:', response);
//     console.log('🔍 응답 상태:', response.status);
//     console.log('🔍 응답 키들:', Object.keys(response));
    
//     if (response.results && Array.isArray(response.results)) {
//       console.log('🔍 results 배열 길이:', response.results.length);
      
//       // 🔥 각 결과의 model_name 확인
//       const modelNames = [...new Set(response.results.map(r => r.model_name))];
//       console.log('🔍 발견된 모든 모델명들:', modelNames);
      
//       // 🔥 각 모델별 개수 확인
//       const modelCounts = {};
//       response.results.forEach(result => {
//         const modelName = result.model_name;
//         modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
//       });
//       console.log('🔍 모델별 결과 개수:', modelCounts);
      
//       // 🔥 YOLO 관련 결과만 따로 확인
//       const yoloResults = response.results.filter(r => 
//         r.model_name.toLowerCase().includes('yolo')
//       );
//       console.log('🔍 YOLO 관련 결과들:', yoloResults.length, '개');
//       if (yoloResults.length > 0) {
//         console.log('🔍 첫 번째 YOLO 결과:', yoloResults[0]);
//       }
//     }
    
//     if (response.status === 'success' && response.results) {
//       console.log('🤖 Django 원본 응답:', {
//         total_count: response.total_count,
//         models: response.models,
//         results_count: response.results?.length || 0
//       });

//       // 🔥 인스턴스별로 그룹화 (React useAI에서 사용할 형태)
//       const groupedByInstance = {};
      
//       response.results.forEach(result => {
//         const instanceUID = result.instance_uid;
//         const originalModelName = result.model_name;
//         const normalizedModelName = normalizeModelName(originalModelName);
        
//         // 🔥 모델명 매핑 과정 로깅
//         console.log(`🔄 모델명 매핑: "${originalModelName}" → "${normalizedModelName}"`);
        
//         // 인스턴스 그룹 초기화
//         if (!groupedByInstance[instanceUID]) {
//           groupedByInstance[instanceUID] = {
//             instance_number: result.instance_number,
//             yolov8: [],
//             ssd: [],
//             simclr: []
//           };
//         }
        
//         // 🔥 매핑된 모델명이 올바른지 확인
//         if (!['yolov8', 'ssd', 'simclr'].includes(normalizedModelName)) {
//           console.error(`❌ 알 수 없는 모델명: "${originalModelName}" → "${normalizedModelName}"`);
//           return; // 이 결과는 건너뛰기
//         }
        
//         // Django 형태를 React useAI 형태로 변환
//         const convertedResult = {
//           id: result.id,
//           label: result.label,
//           confidence: Math.round(result.confidence * 100), // 0.87 → 87
//           bbox: {
//             x: result.bbox[0],
//             y: result.bbox[1], 
//             width: result.bbox[2] - result.bbox[0],  // x2-x1
//             height: result.bbox[3] - result.bbox[1]  // y2-y1
//           },
//           visible: true, // 기본적으로 표시
//           type: "rectangle", // AI 결과는 보통 사각형
//           coords: `x:${result.bbox[0]}, y:${result.bbox[1]}, w:${result.bbox[2] - result.bbox[0]}, h:${result.bbox[3] - result.bbox[1]}`,
//           slice: result.instance_number,
          
//           // Django 메타데이터 보존
//           patient_id: result.patient_id,
//           study_uid: result.study_uid,
//           series_uid: result.series_uid,
//           instance_uid: result.instance_uid,
//           instance_number: result.instance_number,
//           model_name: result.model_name,
//           image_width: result.image_width,
//           image_height: result.image_height,
//           created_at: result.created_at,
//           _original: result // 원본 데이터 보존
//         };
        
//         // 🔥 결과 추가 과정 로깅
//         console.log(`✅ ${normalizedModelName} 결과 추가:`, {
//           instance: instanceUID.slice(-8) + '...',
//           label: convertedResult.label,
//           confidence: convertedResult.confidence
//         });
        
//         groupedByInstance[instanceUID][normalizedModelName].push(convertedResult);
//       });

//       // 🔥 최종 그룹화 결과 확인
//       console.log('🔍 최종 그룹화 결과:', {
//         total_instances: Object.keys(groupedByInstance).length,
//         instances_summary: Object.entries(groupedByInstance).map(([uid, data]) => ({
//           instance: uid.slice(-8) + '...',
//           instance_number: data.instance_number,
//           yolov8_count: data.yolov8.length,
//           ssd_count: data.ssd.length,
//           simclr_count: data.simclr.length
//         }))
//       });

//       return {
//         success: true,
//         studyUID,
//         total_count: response.total_count,
//         models: response.models,
//         groupedByInstance, // 🔥 핵심: 인스턴스별 AI 결과
//         raw_response: response // 디버깅용
//       };
//     }

//     // 결과가 없는 경우
//     return {
//       success: true,
//       studyUID,
//       total_count: 0,
//       models: [],
//       groupedByInstance: {}
//     };
    
//   } catch (error) {
//     console.error('🤖 AI 분석 결과 조회 실패:', error);
//     throw new Error(`AI 분석 결과 조회 실패: ${error.message}`);
//   }
// };

// /**
//  * 🤖 특정 인스턴스의 AI 결과만 추출 (헬퍼 함수)
//  */
// export const getInstanceAIResults = (allResults, instanceUID) => {
//   console.log('🎯 인스턴스 AI 결과 추출:', { instanceUID: instanceUID?.slice(-8) + '...' });
  
//   if (!allResults || !allResults.groupedByInstance || !instanceUID) {
//     return { yolov8: [], ssd: [], simclr: [] };
//   }
  
//   const instanceResults = allResults.groupedByInstance[instanceUID];
//   if (!instanceResults) {
//     console.log('⚠️ 해당 인스턴스의 AI 결과 없음');
//     return { yolov8: [], ssd: [], simclr: [] };
//   }
  
//   console.log('✅ 인스턴스 AI 결과:', {
//     yolov8: instanceResults.yolov8.length,
//     ssd: instanceResults.ssd.length,
//     simclr: instanceResults.simclr.length
//   });
  
//   return {
//     yolov8: instanceResults.yolov8 || [],
//     ssd: instanceResults.ssd || [],
//     simclr: instanceResults.simclr || []
//   };
// };

// /**
//  * 🤖 AI 모델 실행 (새로운 분석)
//  */
// export const runAIAnalysis = async (studyUID, modelType, overwrite = false) => {
//   console.log('🤖 API - AI 분석 실행:', { studyUID, modelType, overwrite });

//   // 모델 타입에 따른 엔드포인트 결정
//   const endpoint = getModelEndpoint(modelType);
  
//   const requestData = {
//     study_uid: studyUID,
//     overwrite: overwrite
//   };

//   try {
//     const response = await apiRequest(`${AI_ANALYSIS_API_URL}/${endpoint}/`, {
//       method: 'POST',
//       body: JSON.stringify(requestData),
//     });

//     console.log('🤖 AI 분석 완료:', {
//       status: response.status,
//       model_used: response.model_used,
//       detections: response.detections,
//       study_uid: response.study_uid
//     });

//     if (response.status === 'success') {
//       return {
//         success: true,
//         model_used: response.model_used,
//         study_uid: response.study_uid,
//         detections: response.detections,
//         results: response.results || [],
//         patient_info: response.patient_info
//       };
//     } else if (response.status === 'exists') {
//       // 기존 결과 존재
//       return {
//         success: false,
//         exists: true,
//         message: response.message,
//         existing_count: response.existing_count
//       };
//     } else {
//       throw new Error(response.message || 'AI 분석 실행 실패');
//     }
    
//   } catch (error) {
//     console.error('🤖 AI 분석 실행 실패:', error);
//     throw error;
//   }
// };

// /**
//  * 🤖 기존 AI 분석 결과 확인
//  */
// export const checkExistingAIAnalysis = async (studyUID, modelType) => {
//   console.log('🤖 API - 기존 AI 분석 확인:', { studyUID, modelType });

//   try {
//     const response = await apiRequest(`${AI_ANALYSIS_API_URL}/check/${studyUID}/${modelType}/`);
    
//     console.log('🤖 중복 확인 결과:', {
//       exists: response.exists,
//       data: response.data
//     });
    
//     return {
//       exists: response.exists,
//       data: response.data || null,
//       error: response.error || null
//     };
    
//   } catch (error) {
//     console.error('🤖 기존 AI 분석 확인 실패:', error);
//     return {
//       exists: false,
//       error: error.message
//     };
//   }
// };

// /**
//  * 🤖 AI 분석 결과 삭제
//  */
// export const clearAIAnalysisResults = async (studyUID, modelType = null) => {
//   console.log('🤖 API - AI 분석 결과 삭제:', { studyUID, modelType });

//   const url = modelType 
//     ? `${AI_ANALYSIS_API_URL}/clear/${studyUID}/?model_type=${modelType}`
//     : `${AI_ANALYSIS_API_URL}/clear/${studyUID}/`;

//   try {
//     const response = await apiRequest(url, {
//       method: 'DELETE',
//     });

//     console.log('🤖 AI 분석 결과 삭제 완료:', response);
//     return response;
    
//   } catch (error) {
//     console.error('🤖 AI 분석 결과 삭제 실패:', error);
//     throw error;
//   }
// };

// /**
//  * 🛠️ 헬퍼 함수들
//  */

// // 🔥 강화된 모델명 정규화 함수
// const normalizeModelName = (djangoModelName) => {
//   if (!djangoModelName) {
//     console.warn('⚠️ 빈 모델명 감지');
//     return 'unknown';
//   }
  
//   const modelStr = djangoModelName.toString().trim();
//   console.log(`🔄 모델명 정규화 시작: "${modelStr}"`);
  
//   // 🔥 더 강력한 매핑 로직
//   const lowerModel = modelStr.toLowerCase();
  
//   if (lowerModel.includes('yolo')) {
//     console.log(`✅ YOLO 계열 감지: "${modelStr}" → "yolov8"`);
//     return 'yolov8';
//   } else if (lowerModel.includes('ssd')) {
//     console.log(`✅ SSD 계열 감지: "${modelStr}" → "ssd"`);
//     return 'ssd';
//   } else if (lowerModel.includes('simclr')) {
//     console.log(`✅ SimCLR 계열 감지: "${modelStr}" → "simclr"`);
//     return 'simclr';
//   } else {
//     console.warn(`⚠️ 알 수 없는 모델명: "${modelStr}" → "unknown"`);
//     return 'unknown';
//   }
// };

// // 모델 타입에 따른 엔드포인트 결정
// const getModelEndpoint = (modelType) => {
//   const endpoints = {
//     'yolov8': 'analyze',
//     'yolo': 'analyze', 
//     'ssd': 'analyze-ssd',
//     'simclr': 'analyze' // 필요시 추가
//   };
//   return endpoints[modelType.toLowerCase()] || 'analyze';
// };

// // 모델 타입 정규화 (Django 체크용)
// export const normalizeModelTypeForDjango = (modelType) => {
//   const mapping = {
//     'yolov8': 'yolo',
//     'yolo': 'yolo',
//     'ssd': 'ssd',
//     'simclr': 'simclr'
//   };
//   return mapping[modelType.toLowerCase()] || modelType.toLowerCase();
// };

// /**
//  * 🔄 AI 분석 전체 워크플로우 (편의 함수)
//  */
// export const aiAnalysisWorkflow = async (studyUID, modelType, forceOverwrite = false) => {
//   console.log('🔄 AI 분석 워크플로우 시작:', { studyUID, modelType, forceOverwrite });
  
//   try {
//     // 1. 기존 결과 확인 (강제 덮어쓰기가 아닌 경우)
//     if (!forceOverwrite) {
//       const existsCheck = await checkExistingAIAnalysis(studyUID, normalizeModelTypeForDjango(modelType));
      
//       if (existsCheck.exists) {
//         return {
//           success: false,
//           exists: true,
//           message: `기존 ${modelType.toUpperCase()} 분석 결과가 있습니다.`,
//           existingData: existsCheck.data
//         };
//       }
//     }
    
//     // 2. AI 분석 실행
//     const analysisResult = await runAIAnalysis(studyUID, modelType, forceOverwrite);
    
//     if (!analysisResult.success) {
//       return analysisResult;
//     }
    
//     // 3. 새로운 결과 조회
//     const updatedResults = await getAIAnalysisResults(studyUID);
    
//     return {
//       success: true,
//       message: `${modelType.toUpperCase()} 분석이 완료되었습니다.`,
//       analysisResult,
//       updatedResults
//     };
    
//   } catch (error) {
//     console.error('🔄 AI 분석 워크플로우 실패:', error);
//     throw error;
//   }
// };

// /**
//  * 🔍 YOLO 디버깅 함수 (브라우저 콘솔용)
//  * 사용법: window.debugYOLO("studyUID")
//  */
// window.debugYOLO = async (studyUID) => {
//   console.log('🔍 YOLO 디버깅 시작:', studyUID);
  
//   try {
//     // 1. Django API 직접 호출
//     const response = await fetch(`${AI_ANALYSIS_API_URL}/results/${studyUID}/`);
//     const data = await response.json();
    
//     console.log('📡 Django 원본 응답:', data);
    
//     if (data.results) {
//       // 2. 모델별 분류
//       const byModel = {};
//       data.results.forEach(result => {
//         const modelName = result.model_name;
//         if (!byModel[modelName]) byModel[modelName] = [];
//         byModel[modelName].push(result);
//       });
      
//       console.log('📊 모델별 분류:', byModel);
      
//       // 3. YOLO 결과 상세 확인
//       Object.entries(byModel).forEach(([modelName, results]) => {
//         console.log(`🤖 ${modelName}: ${results.length}개 결과`);
//         if (results.length > 0) {
//           console.log(`   첫 번째 결과:`, results[0]);
//         }
//       });
      
//       // 4. 모델명 매핑 테스트
//       Object.keys(byModel).forEach(modelName => {
//         const normalized = normalizeModelName(modelName);
//         console.log(`🔄 매핑 테스트: "${modelName}" → "${normalized}"`);
//       });
//     }
    
//     return data;
//   } catch (error) {
//     console.error('❌ YOLO 디버깅 실패:', error);
//   }
// };

// /home/medical_system/pacsapp/src/utils/viewer_v2/api.js
// /home/medical_system/pacsapp/src/utils/viewer_v2/api.js

/**
 * Django 백엔드 어노테이션 API 함수들
 * 새로운 구조: shape_type + coordinates 기반
 * 🔥 수동 어노테이션 좌표 변환 제거 - 반응형으로만 처리
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://35.225.63.41:8000';
const ANNOTATION_API_URL = `${API_BASE_URL}/api/dr-annotations`;
const AI_ANALYSIS_API_URL = `${API_BASE_URL}/api/ai`;


/**
 * API 요청 헬퍼 함수
 */
const apiRequest = async (url, options = {}) => {
  try {
    const method = options.method || 'GET';
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      method,
      headers,
      body: options.body || undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
};

/**
 * 🎯 수정: 어노테이션을 서버에 저장 - 좌표 변환 제거, 그대로 저장
 */
export const saveAnnotations = async (studyUID, instanceUID, instanceNumber, annotations, imageDisplayInfo, originalImageSize) => {
  console.log('💾 API - 어노테이션 저장 시작:', { 
    studyUID, 
    instanceUID, 
    instanceNumber, 
    count: annotations.length,
    좌표변환: '없음 (반응형으로 처리)'
  });

  // 🎯 수정: React 측정값 구조를 Django 구조로 변환 (좌표 변환 없이)
  const convertedAnnotations = annotations.map(annotation => {
    let shape_type = 'rectangle';
    let coordinates = [];

    console.log('🔄 변환 중인 어노테이션:', annotation);
    console.log('🔄 어노테이션 타입:', annotation.type);
    console.log('🔄 어노테이션 shape_type:', annotation.shape_type);

    // 🎯 이미 Django 어노테이션인 경우 - 좌표 그대로 사용
    if (annotation.shape_type && annotation.coordinates) {
      shape_type = annotation.shape_type;
      coordinates = annotation.coordinates; // 🎯 그대로 사용
      console.log('✅ Django 데이터 좌표 그대로 사용:', { shape_type, coordinates });
    }
    // 🎯 기존 bbox 기반 데이터 처리 - 좌표 변환 없이
    else if (annotation.left !== undefined && annotation.top !== undefined) {
      shape_type = 'rectangle';
      coordinates = [annotation.left, annotation.top, annotation.width, annotation.height];
      console.log('✅ BBox → Rectangle 변환 (변환없음):', { shape_type, coordinates });
    } 
    // 🎯 새로운 측정값 기반 데이터 처리 - 좌표 변환 없이 그대로 사용
    else if (annotation.type && annotation.startPoint) {
      console.log('🔄 측정값 타입별 변환 시작 (좌표변환없음):', annotation.type);
      
      // 🎯 좌표 변환 없이 그대로 사용
      switch (annotation.type) {
        case 'length':
          shape_type = 'line';
          coordinates = [
            annotation.startPoint.x,
            annotation.startPoint.y,
            annotation.endPoint.x,
            annotation.endPoint.y
          ];
          console.log('✅ Length → Line 변환 (좌표변환없음):', { shape_type, coordinates });
          break;
          
        case 'rectangle':
          shape_type = 'rectangle';
          const rectX = Math.min(annotation.startPoint.x, annotation.endPoint.x);
          const rectY = Math.min(annotation.startPoint.y, annotation.endPoint.y);
          const rectW = Math.abs(annotation.endPoint.x - annotation.startPoint.x);
          const rectH = Math.abs(annotation.endPoint.y - annotation.startPoint.y);
          coordinates = [rectX, rectY, rectW, rectH];
          console.log('✅ Rectangle → Rectangle 변환 (좌표변환없음):', { shape_type, coordinates });
          break;
          
        case 'circle':
          shape_type = 'circle';
          const centerX = annotation.startPoint.x;
          const centerY = annotation.startPoint.y;
          const radius = Math.sqrt(
            Math.pow(annotation.endPoint.x - annotation.startPoint.x, 2) + 
            Math.pow(annotation.endPoint.y - annotation.startPoint.y, 2)
          );
          coordinates = [centerX, centerY, radius];
          console.log('✅ Circle → Circle 변환 (좌표변환없음):', { shape_type, coordinates });
          break;
          
        default:
          console.warn('⚠️ 알 수 없는 어노테이션 타입:', annotation.type);
          shape_type = 'rectangle';
          coordinates = [0, 0, 10, 10];
      }
    }
    // 기본값 처리
    else {
      console.warn('❌ 어노테이션 구조를 인식할 수 없음:', annotation);
      shape_type = 'rectangle';
      coordinates = [0, 0, 10, 10];
    }

    const result = {
      label: annotation.label || 'Untitled',
      shape_type: shape_type,
      coordinates: coordinates,  // 🎯 좌표 변환 없이 그대로 저장
      dr_text: annotation.memo || annotation.dr_text || ''
    };

    console.log('🎯 최종 변환 결과 (좌표변환없음):', result);
    return result;
  });

  const requestData = {
    study_uid: studyUID,
    instance_uid: instanceUID,
    instance_number: instanceNumber,
    annotations: convertedAnnotations
  };

  console.log('📤 API - 전송할 데이터:', requestData);
  console.log('📤 API - 전송할 어노테이션들:', convertedAnnotations);

  return await apiRequest(`${ANNOTATION_API_URL}/save/`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

/**
 * 🎯 수정: 서버에서 어노테이션을 불러오기 - 좌표 변환 없이 그대로 사용
 */
export const loadAnnotations = async (studyUID, instanceUID, imageDisplayInfo, originalImageSize) => {
  console.log('📥 API - 어노테이션 불러오기 시작:', { 
    studyUID, 
    instanceUID,
    좌표변환: '없음 (반응형으로 처리)'
  });

  const queryParams = new URLSearchParams({
    instance_uid: instanceUID
  });

  const response = await apiRequest(`${ANNOTATION_API_URL}/load/${studyUID}/?${queryParams.toString()}`);

  console.log('📥 API - 불러온 원본 데이터:', response);

  // Django 구조를 React 구조로 변환
  if (response.status === 'success' && response.annotations) {
    const convertedAnnotations = response.annotations.map((ann, index) => {
      let bbox;
      let measurement = null;

      console.log(`🔄 어노테이션 ${index + 1} 변환 시작 (좌표변환없음):`, ann);

      // 🎯 좌표 변환 없이 그대로 사용
      const coordinates = ann.coordinates; // 원본 좌표 그대로 사용

      // shape_type에 따라 bbox 계산 (좌표 변환 없이)
      switch (ann.shape_type) {
        case 'rectangle':
          bbox = [
            coordinates[0],
            coordinates[1],
            coordinates[0] + coordinates[2],
            coordinates[1] + coordinates[3]
          ];
          
          // measurement 생성 (좌표 변환 없이)
          measurement = {
            id: ann.id || `measurement-${Date.now()}-${index}`,
            type: 'rectangle',
            startPoint: { x: coordinates[0], y: coordinates[1] },
            endPoint: { 
              x: coordinates[0] + coordinates[2], 
              y: coordinates[1] + coordinates[3] 
            },
            isComplete: true,
            visible: true
          };
          break;
          
        case 'circle':
          const centerX = coordinates[0];
          const centerY = coordinates[1];
          const radius = coordinates[2];
          bbox = [
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
          ];
          
          // measurement 생성 (좌표 변환 없이)
          measurement = {
            id: ann.id || `measurement-${Date.now()}-${index}`,
            type: 'circle',
            startPoint: { x: centerX, y: centerY },
            endPoint: { 
              x: centerX + radius, 
              y: centerY 
            },
            isComplete: true,
            visible: true
          };
          break;
          
        case 'line':
          bbox = coordinates; // [x1, y1, x2, y2]
          
          // measurement 생성 (좌표 변환 없이)
          measurement = {
            id: ann.id || `measurement-${Date.now()}-${index}`,
            type: 'length',
            startPoint: { x: coordinates[0], y: coordinates[1] },
            endPoint: { x: coordinates[2], y: coordinates[3] },
            isComplete: true,
            visible: true
          };
          break;
          
        default:
          console.warn('알 수 없는 shape_type:', ann.shape_type);
          bbox = [0, 0, 10, 10];
      }

      console.log(`✅ 어노테이션 ${index + 1} 변환 완료 (좌표변환없음):`, { bbox, measurement });

      return {
        // 기존 bbox 기반 구조 (하위 호환성)
        id: ann.id || Date.now() + index,
        left: bbox[0],
        top: bbox[1],
        width: Math.abs(bbox[2] - bbox[0]),
        height: Math.abs(bbox[3] - bbox[1]),
        label: ann.label,
        confidence: ann.confidence || 1.0,
        created: ann.created_at || ann.created,
        doctor_name: ann.doctor_name,
        
        // 새로운 Django 구조 필드들
        shape_type: ann.shape_type,
        coordinates: ann.coordinates, // 🎯 원본 좌표 보존
        dr_text: ann.dr_text,
        
        // 추가 메타데이터
        bbox: bbox,
        measurement: measurement,
        
        // 서버 원본 데이터 보존
        _original: ann
      };
    });

    console.log('📥 API - 변환된 데이터 (좌표변환없음):', convertedAnnotations);

    return {
      ...response,
      annotations: convertedAnnotations
    };
  }

  return response;
};

/**
 * 🎯 수정: 개별 어노테이션 수정 - 좌표 변환 없이
 */
export const updateAnnotation = async (annotationId, updateData, imageDisplayInfo, originalImageSize) => {
  console.log('✏️ API - 어노테이션 수정 (좌표변환없음):', { 
    annotationId, 
    updateData
  });

  // 🎯 좌표 변환 없이 그대로 사용
  if (updateData.startPoint && updateData.endPoint) {
    console.log('🔄 수정 데이터를 Django 형식으로 변환 (좌표변환없음)');
    
    // 좌표를 Django 형식으로 변환 (좌표 변환 없이)
    let coordinates;
    switch (updateData.type) {
      case 'rectangle':
        const rectX = Math.min(updateData.startPoint.x, updateData.endPoint.x);
        const rectY = Math.min(updateData.startPoint.y, updateData.endPoint.y);
        const rectW = Math.abs(updateData.endPoint.x - updateData.startPoint.x);
        const rectH = Math.abs(updateData.endPoint.y - updateData.startPoint.y);
        coordinates = [rectX, rectY, rectW, rectH];
        break;
        
      case 'circle':
        const centerX = updateData.startPoint.x;
        const centerY = updateData.startPoint.y;
        const radius = Math.sqrt(
          Math.pow(updateData.endPoint.x - updateData.startPoint.x, 2) + 
          Math.pow(updateData.endPoint.y - updateData.startPoint.y, 2)
        );
        coordinates = [centerX, centerY, radius];
        break;
        
      case 'length':
        coordinates = [
          updateData.startPoint.x,
          updateData.startPoint.y,
          updateData.endPoint.x,
          updateData.endPoint.y
        ];
        break;
        
      default:
        coordinates = updateData.coordinates || [0, 0, 10, 10];
    }
    
    // 좌표 변환 결과를 Django 형식으로 설정
    updateData.coordinates = coordinates;
    
    // startPoint, endPoint는 Django API에서 필요 없으므로 제거
    delete updateData.startPoint;
    delete updateData.endPoint;
    delete updateData.type;
    
    console.log('✅ Django 형식으로 변환 완료 (좌표변환없음):', coordinates);
  }

  return await apiRequest(`${ANNOTATION_API_URL}/detail/${annotationId}/`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * 개별 어노테이션 삭제
 */
export const deleteAnnotation = async (annotationId) => {
  console.log('🗑️ API - 어노테이션 삭제:', annotationId);

  return await apiRequest(`${ANNOTATION_API_URL}/detail/${annotationId}/`, {
    method: 'DELETE',
  });
};

/**
 * 특정 인스턴스의 모든 어노테이션 삭제
 */
export const deleteAllAnnotations = async (studyUID, instanceUID) => {
  console.log('🗑️ API - 인스턴스 어노테이션 삭제:', { studyUID, instanceUID });

  const queryParams = new URLSearchParams({
    instance_uid: instanceUID
  });

  return await apiRequest(`${ANNOTATION_API_URL}/delete-all/${studyUID}/?${queryParams.toString()}`, {
    method: 'DELETE',
  });
};

/**
 * 여러 인스턴스의 어노테이션 일괄 조회
 */
export const loadAnnotationsByInstances = async (instanceUIDs) => {
  console.log('📥 API - 여러 인스턴스 어노테이션 조회:', instanceUIDs);

  return await apiRequest(`${ANNOTATION_API_URL}/by-instances/`, {
    method: 'POST',
    body: JSON.stringify({ instance_uids: instanceUIDs }),
  });
};

/**
 * 특정 Study의 모든 어노테이션 조회 (모든 인스턴스)
 */
export const loadAllStudyAnnotations = async (studyUID) => {
  console.log('📥 API - Study 전체 어노테이션 조회:', studyUID);

  return await apiRequest(`${ANNOTATION_API_URL}/study/${studyUID}/`);
};

/**
 * 어노테이션 목록 조회 (관리용)
 */
export const getAnnotationList = async (filters = {}) => {
  console.log('📋 API - 어노테이션 목록 조회:', filters);

  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });

  const url = `${ANNOTATION_API_URL}/list/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return await apiRequest(url);
};

/**
 * 어노테이션 상세 조회 (면적/길이 계산 포함)
 */
export const getAnnotationDetail = async (annotationId) => {
  console.log('🔍 API - 어노테이션 상세 조회:', annotationId);

  return await apiRequest(`${ANNOTATION_API_URL}/detail/${annotationId}/`);
};

/**
 * 에러 처리 헬퍼
 */
export const handleApiError = (error) => {
  console.error('API 에러:', error);
  
  if (error.message.includes('404')) {
    return '데이터를 찾을 수 없습니다.';
  } else if (error.message.includes('500')) {
    return '서버 오류가 발생했습니다.';
  } else if (error.message.includes('Network')) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  return error.message || '알 수 없는 오류가 발생했습니다.';
};

/**
 * 🤖 AI 분석 결과 조회 (Study 전체) - 인스턴스별 필터링 지원
 * 🔥 YOLO 결과 디버깅 로직 추가
 */
export const getAIAnalysisResults = async (studyUID) => {
  console.log('🤖 API - AI 분석 결과 조회:', studyUID);

  try {
    const response = await apiRequest(`${AI_ANALYSIS_API_URL}/results/${studyUID}/`);
    
    // 🔥 원본 응답 상세 로깅 추가
    console.log('🔍 Django 원본 응답 전체:', response);
    console.log('🔍 응답 상태:', response.status);
    console.log('🔍 응답 키들:', Object.keys(response));
    
    if (response.results && Array.isArray(response.results)) {
      console.log('🔍 results 배열 길이:', response.results.length);
      
      // 🔥 각 결과의 model_name 확인
      const modelNames = [...new Set(response.results.map(r => r.model_name))];
      console.log('🔍 발견된 모든 모델명들:', modelNames);
      
      // 🔥 각 모델별 개수 확인
      const modelCounts = {};
      response.results.forEach(result => {
        const modelName = result.model_name;
        modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
      });
      console.log('🔍 모델별 결과 개수:', modelCounts);
      
      // 🔥 YOLO 관련 결과만 따로 확인
      const yoloResults = response.results.filter(r => 
        r.model_name.toLowerCase().includes('yolo')
      );
      console.log('🔍 YOLO 관련 결과들:', yoloResults.length, '개');
      if (yoloResults.length > 0) {
        console.log('🔍 첫 번째 YOLO 결과:', yoloResults[0]);
      }
    }
    
    if (response.status === 'success' && response.results) {
      console.log('🤖 Django 원본 응답:', {
        total_count: response.total_count,
        models: response.models,
        results_count: response.results?.length || 0
      });

      // 🔥 인스턴스별로 그룹화 (React useAI에서 사용할 형태)
      const groupedByInstance = {};
      
      response.results.forEach(result => {
        const instanceUID = result.instance_uid;
        const originalModelName = result.model_name;
        const normalizedModelName = normalizeModelName(originalModelName);
        
        // 🔥 모델명 매핑 과정 로깅
        console.log(`🔄 모델명 매핑: "${originalModelName}" → "${normalizedModelName}"`);
        
        // 인스턴스 그룹 초기화
        if (!groupedByInstance[instanceUID]) {
          groupedByInstance[instanceUID] = {
            instance_number: result.instance_number,
            yolov8: [],
            ssd: [],
            simclr: []
          };
        }
        
        // 🔥 매핑된 모델명이 올바른지 확인
        if (!['yolov8', 'ssd', 'simclr'].includes(normalizedModelName)) {
          console.error(`❌ 알 수 없는 모델명: "${originalModelName}" → "${normalizedModelName}"`);
          return; // 이 결과는 건너뛰기
        }
        
        // Django 형태를 React useAI 형태로 변환
        const convertedResult = {
          id: result.id,
          label: result.label,
          confidence: Math.round(result.confidence * 100), // 0.87 → 87
          bbox: {
            x: result.bbox[0],
            y: result.bbox[1], 
            width: result.bbox[2] - result.bbox[0],  // x2-x1
            height: result.bbox[3] - result.bbox[1]  // y2-y1
          },
          visible: true, // 기본적으로 표시
          type: "rectangle", // AI 결과는 보통 사각형
          coords: `x:${result.bbox[0]}, y:${result.bbox[1]}, w:${result.bbox[2] - result.bbox[0]}, h:${result.bbox[3] - result.bbox[1]}`,
          slice: result.instance_number,
          
          // Django 메타데이터 보존
          patient_id: result.patient_id,
          study_uid: result.study_uid,
          series_uid: result.series_uid,
          instance_uid: result.instance_uid,
          instance_number: result.instance_number,
          model_name: result.model_name,
          image_width: result.image_width,
          image_height: result.image_height,
          created_at: result.created_at,
          _original: result // 원본 데이터 보존
        };
        
        // 🔥 결과 추가 과정 로깅
        console.log(`✅ ${normalizedModelName} 결과 추가:`, {
          instance: instanceUID.slice(-8) + '...',
          label: convertedResult.label,
          confidence: convertedResult.confidence
        });
        
        groupedByInstance[instanceUID][normalizedModelName].push(convertedResult);
      });

      // 🔥 최종 그룹화 결과 확인
      console.log('🔍 최종 그룹화 결과:', {
        total_instances: Object.keys(groupedByInstance).length,
        instances_summary: Object.entries(groupedByInstance).map(([uid, data]) => ({
          instance: uid.slice(-8) + '...',
          instance_number: data.instance_number,
          yolov8_count: data.yolov8.length,
          ssd_count: data.ssd.length,
          simclr_count: data.simclr.length
        }))
      });

      return {
        success: true,
        studyUID,
        total_count: response.total_count,
        models: response.models,
        groupedByInstance, // 🔥 핵심: 인스턴스별 AI 결과
        raw_response: response // 디버깅용
      };
    }

    // 결과가 없는 경우
    return {
      success: true,
      studyUID,
      total_count: 0,
      models: [],
      groupedByInstance: {}
    };
    
  } catch (error) {
    console.error('🤖 AI 분석 결과 조회 실패:', error);
    throw new Error(`AI 분석 결과 조회 실패: ${error.message}`);
  }
};

/**
 * 🤖 특정 인스턴스의 AI 결과만 추출 (헬퍼 함수)
 */
export const getInstanceAIResults = (allResults, instanceUID) => {
  console.log('🎯 인스턴스 AI 결과 추출:', { instanceUID: instanceUID?.slice(-8) + '...' });
  
  if (!allResults || !allResults.groupedByInstance || !instanceUID) {
    return { yolov8: [], ssd: [], simclr: [] };
  }
  
  const instanceResults = allResults.groupedByInstance[instanceUID];
  if (!instanceResults) {
    console.log('⚠️ 해당 인스턴스의 AI 결과 없음');
    return { yolov8: [], ssd: [], simclr: [] };
  }
  
  console.log('✅ 인스턴스 AI 결과:', {
    yolov8: instanceResults.yolov8.length,
    ssd: instanceResults.ssd.length,
    simclr: instanceResults.simclr.length
  });
  
  return {
    yolov8: instanceResults.yolov8 || [],
    ssd: instanceResults.ssd || [],
    simclr: instanceResults.simclr || []
  };
};

/**
 * 🤖 AI 모델 실행 (새로운 분석)
 */
export const runAIAnalysis = async (studyUID, modelType, overwrite = false) => {
  console.log('🤖 API - AI 분석 실행:', { studyUID, modelType, overwrite });

  // 모델 타입에 따른 엔드포인트 결정
  const endpoint = getModelEndpoint(modelType);
  
  const requestData = {
    study_uid: studyUID,
    overwrite: overwrite
  };

  try {
    const response = await apiRequest(`${AI_ANALYSIS_API_URL}/${endpoint}/`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    console.log('🤖 AI 분석 완료:', {
      status: response.status,
      model_used: response.model_used,
      detections: response.detections,
      study_uid: response.study_uid
    });

    if (response.status === 'success') {
      return {
        success: true,
        model_used: response.model_used,
        study_uid: response.study_uid,
        detections: response.detections,
        results: response.results || [],
        patient_info: response.patient_info
      };
    } else if (response.status === 'exists') {
      // 기존 결과 존재
      return {
        success: false,
        exists: true,
        message: response.message,
        existing_count: response.existing_count
      };
    } else {
      throw new Error(response.message || 'AI 분석 실행 실패');
    }
    
  } catch (error) {
    console.error('🤖 AI 분석 실행 실패:', error);
    throw error;
  }
};

/**
 * 🤖 기존 AI 분석 결과 확인
 */
export const checkExistingAIAnalysis = async (studyUID, modelType) => {
  console.log('🤖 API - 기존 AI 분석 확인:', { studyUID, modelType });

  try {
    const response = await apiRequest(`${AI_ANALYSIS_API_URL}/check/${studyUID}/${modelType}/`);
    
    console.log('🤖 중복 확인 결과:', {
      exists: response.exists,
      data: response.data
    });
    
    return {
      exists: response.exists,
      data: response.data || null,
      error: response.error || null
    };
    
  } catch (error) {
    console.error('🤖 기존 AI 분석 확인 실패:', error);
    return {
      exists: false,
      error: error.message
    };
  }
};

/**
 * 🤖 AI 분석 결과 삭제
 */
export const clearAIAnalysisResults = async (studyUID, modelType = null) => {
  console.log('🤖 API - AI 분석 결과 삭제:', { studyUID, modelType });

  const url = modelType 
    ? `${AI_ANALYSIS_API_URL}/clear/${studyUID}/?model_type=${modelType}`
    : `${AI_ANALYSIS_API_URL}/clear/${studyUID}/`;

  try {
    const response = await apiRequest(url, {
      method: 'DELETE',
    });

    console.log('🤖 AI 분석 결과 삭제 완료:', response);
    return response;
    
  } catch (error) {
    console.error('🤖 AI 분석 결과 삭제 실패:', error);
    throw error;
  }
};

/**
 * 🛠️ 헬퍼 함수들
 */

// 🔥 강화된 모델명 정규화 함수
const normalizeModelName = (djangoModelName) => {
  if (!djangoModelName) {
    console.warn('⚠️ 빈 모델명 감지');
    return 'unknown';
  }
  
  const modelStr = djangoModelName.toString().trim();
  console.log(`🔄 모델명 정규화 시작: "${modelStr}"`);
  
  // 🔥 더 강력한 매핑 로직
  const lowerModel = modelStr.toLowerCase();
  
  if (lowerModel.includes('yolo')) {
    console.log(`✅ YOLO 계열 감지: "${modelStr}" → "yolov8"`);
    return 'yolov8';
  } else if (lowerModel.includes('ssd')) {
    console.log(`✅ SSD 계열 감지: "${modelStr}" → "ssd"`);
    return 'ssd';
  } else if (lowerModel.includes('simclr')) {
    console.log(`✅ SimCLR 계열 감지: "${modelStr}" → "simclr"`);
    return 'simclr';
  } else {
    console.warn(`⚠️ 알 수 없는 모델명: "${modelStr}" → "unknown"`);
    return 'unknown';
  }
};

// 모델 타입에 따른 엔드포인트 결정
const getModelEndpoint = (modelType) => {
  const endpoints = {
    'yolov8': 'analyze',
    'yolo': 'analyze', 
    'ssd': 'analyze-ssd',
    'simclr': 'analyze' // 필요시 추가
  };
  return endpoints[modelType.toLowerCase()] || 'analyze';
};

// 모델 타입 정규화 (Django 체크용)
export const normalizeModelTypeForDjango = (modelType) => {
  const mapping = {
    'yolov8': 'yolo',
    'yolo': 'yolo',
    'ssd': 'ssd',
    'simclr': 'simclr'
  };
  return mapping[modelType.toLowerCase()] || modelType.toLowerCase();
};

/**
 * 🔄 AI 분석 전체 워크플로우 (편의 함수)
 */
export const aiAnalysisWorkflow = async (studyUID, modelType, forceOverwrite = false) => {
  console.log('🔄 AI 분석 워크플로우 시작:', { studyUID, modelType, forceOverwrite });
  
  try {
    // 1. 기존 결과 확인 (강제 덮어쓰기가 아닌 경우)
    if (!forceOverwrite) {
      const existsCheck = await checkExistingAIAnalysis(studyUID, normalizeModelTypeForDjango(modelType));
      
      if (existsCheck.exists) {
        return {
          success: false,
          exists: true,
          message: `기존 ${modelType.toUpperCase()} 분석 결과가 있습니다.`,
          existingData: existsCheck.data
        };
      }
    }
    
    // 2. AI 분석 실행
    const analysisResult = await runAIAnalysis(studyUID, modelType, forceOverwrite);
    
    if (!analysisResult.success) {
      return analysisResult;
    }
    
    // 3. 새로운 결과 조회
    const updatedResults = await getAIAnalysisResults(studyUID);
    
    return {
      success: true,
      message: `${modelType.toUpperCase()} 분석이 완료되었습니다.`,
      analysisResult,
      updatedResults
    };
    
  } catch (error) {
    console.error('🔄 AI 분석 워크플로우 실패:', error);
    throw error;
  }
};

/**
 * 🔍 YOLO 디버깅 함수 (브라우저 콘솔용)
 * 사용법: window.debugYOLO("studyUID")
 */
window.debugYOLO = async (studyUID) => {
  console.log('🔍 YOLO 디버깅 시작:', studyUID);
  
  try {
    // 1. Django API 직접 호출
    const response = await fetch(`${AI_ANALYSIS_API_URL}/results/${studyUID}/`);
    const data = await response.json();
    
    console.log('📡 Django 원본 응답:', data);
    
    if (data.results) {
      // 2. 모델별 분류
      const byModel = {};
      data.results.forEach(result => {
        const modelName = result.model_name;
        if (!byModel[modelName]) byModel[modelName] = [];
        byModel[modelName].push(result);
      });
      
      console.log('📊 모델별 분류:', byModel);
      
      // 3. YOLO 결과 상세 확인
      Object.entries(byModel).forEach(([modelName, results]) => {
        console.log(`🤖 ${modelName}: ${results.length}개 결과`);
        if (results.length > 0) {
          console.log(`   첫 번째 결과:`, results[0]);
        }
      });
      
      // 4. 모델명 매핑 테스트
      Object.keys(byModel).forEach(modelName => {
        const normalized = normalizeModelName(modelName);
        console.log(`🔄 매핑 테스트: "${modelName}" → "${normalized}"`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ YOLO 디버깅 실패:', error);
  }
};