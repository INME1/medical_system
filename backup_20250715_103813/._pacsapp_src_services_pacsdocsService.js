// // pacsapp/src/services/pacsdocsService.js
// import axios from 'axios';

// // API 기본 URL 설정
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// const PACSDOCS_API_URL = `${API_BASE_URL}/api/pacsdocs/api`;
// const WORKLIST_API_URL = `${API_BASE_URL}/api/worklists`; // 워크리스트 API

// // PACS 문서 API 인스턴스
// const api = axios.create({
//   baseURL: PACSDOCS_API_URL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // 워크리스트 API 인스턴스
// const worklistApi = axios.create({
//   baseURL: WORKLIST_API_URL, // http://localhost:8000/api/worklists
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // 요청/응답 인터셉터 (개발용 로깅 추가)
// api.interceptors.request.use(
//   (config) => {
//     console.log(`🔄 PACS API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
//     return config;
//   },
//   (error) => {
//     console.error('❌ PACS Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => {
//     console.log(`✅ PACS API Response: ${response.status} ${response.config.url}`);
//     console.log('📄 PACS Response Data:', response.data);
//     return response;
//   },
//   (error) => {
//     console.error('❌ PACS API Error:', error);
//     console.error('📄 Error Response:', error.response?.data);
//     console.error('🔗 Request URL:', error.config?.url);
//     return Promise.reject(error);
//   }
// );

// export const pacsdocsService = {
//   // ========== 🔥 통합된 검사별 서류 관리 (메인 UI용) ==========
  
//   /**
//    * 🔥 검사별 서류 목록 조회 (워크리스트 + 서류 정보 통합)
//    */
//   getStudyDocuments: async (filters = {}) => {
//     try {
//       console.log('🔄 PACS 문서 통합 데이터 조회 시작', filters);

//       // 1️⃣ 워크리스트 데이터 가져오기
//       let worklistData = [];
//       if (filters.exam_date) {
//         try {
//           console.log(`🔍 워크리스트 조회 날짜: ${filters.exam_date}`);
//           const worklistResponse = await worklistApi.get(`/${filters.exam_date}/`);
          
//           // Django API 응답 구조에 맞게 데이터 추출 (worklistService.js와 동일하게)
//           if (worklistResponse.data.status === 'success') {
//             worklistData = worklistResponse.data.data || [];
//             console.log(`✅ 워크리스트 데이터 ${worklistData.length}개 로드됨`);
//             console.log('🔍 첫 번째 워크리스트 항목:', worklistData[0]); // 🔧 디버깅 추가
//             console.log('🔍 모든 필드명:', Object.keys(worklistData[0] || {})); // 🔧 디버깅 추가
//           } else {
//             console.warn('⚠️ API 응답 상태가 success가 아님:', worklistResponse.data);
//             worklistData = [];
//           }
//         } catch (worklistError) {
//           console.error('❌ 워크리스트 조회 실패:', worklistError);
//           // 워크리스트 조회 실패시 빈 배열로 계속 진행
//           worklistData = [];
//         }
//       }

//       // 필터링 적용 (환자명, 모달리티)
//       if (filters.patient_name) {
//         worklistData = worklistData.filter(item => 
//           item.patientName?.includes(filters.patient_name)
//         );
//       }
//       if (filters.modality) {
//         worklistData = worklistData.filter(item => 
//           item.modality === filters.modality
//         );
//       }

//       // 2️⃣ 각 검사별 서류 정보 추가
//       const enrichedData = await Promise.all(
//         worklistData.map(async (studyRequest) => {
//           try {
//             // 각 검사별 서류 정보 조회 시도
//             const docResponse = await api.get(`/study-documents/${studyRequest.id}/`);
            
//             return {
//               // 🔥 워크리스트 필드명 그대로 사용 ✅
//               ...studyRequest, // 모든 필드 그대로 복사
              
//               // 📄 서류 정보만 추가
//               documents: docResponse.data.documents || []
//             };
//           } catch (docError) {
//             console.warn(`서류 정보 조회 실패 (Study ID: ${studyRequest.id}):`, docError);
            
//             // 🔧 서류 정보가 없는 경우 기본 서류 생성
//             const defaultDocuments = getDefaultDocuments(studyRequest.modality);
            
//             return {
//               // 🔥 워크리스트 필드명 그대로 사용 ✅
//               ...studyRequest, // 모든 필드 그대로 복사
              
//               // 📄 기본 서류 정보 추가
//               documents: defaultDocuments
//             };
//           }
//         })
//       );

//       console.log(`✅ 통합 데이터 완성: ${enrichedData.length}개`);
      
//       return {
//         results: enrichedData,
//         count: enrichedData.length,
//         date: filters.exam_date
//       };

//     } catch (error) {
//       console.error('❌ PACS 문서 통합 데이터 조회 실패:', error);
      
//       // 🔄 에러 발생시에도 워크리스트 API 한번 더 시도
//       console.log('🔄 에러 복구: 워크리스트 API 직접 호출 시도');
//       try {
//         const fallbackResponse = await worklistApi.get(`/${filters.exam_date}/`);
//         if (fallbackResponse.data.status === 'success') {
//           console.log('✅ 복구 성공! 워크리스트 데이터:', fallbackResponse.data.data);
//           return {
//             results: fallbackResponse.data.data.map(item => ({
//               ...item,
//               documents: getDefaultDocuments(item.modality)
//             })),
//             count: fallbackResponse.data.count,
//             date: filters.exam_date
//           };
//         }
//       } catch (fallbackError) {
//         console.error('❌ 복구도 실패:', fallbackError);
//       }
      
//       // 🔄 개발용: 더미 데이터 반환 (기존 코드 유지)
//       console.warn('🔄 Using dummy data for development');
//       return {
//         results: [
//           {
//             id: 1,
//             patientId: 'P2025-001234',
//             patientName: '김철수',
//             birthDate: '1985-06-12',
//             examPart: '흉부',
//             modality: 'CT',
//             reportingDoctor: '이지은',
//             requestDateTime: '2025-06-24T14:30:00Z',
//             priority: '응급',
//             examStatus: '검사완료',
//             documents: [
//               {
//                 id: 1,
//                 document_type: { 
//                   code: 'consent_contrast', 
//                   name: '조영제 사용 동의서', 
//                   requires_signature: true 
//                 },
//                 status: 'pending'
//               },
//               {
//                 id: 2,
//                 document_type: { 
//                   code: 'report_kor', 
//                   name: '판독 결과지 (국문)', 
//                   requires_signature: false 
//                 },
//                 status: 'pending'
//               },
//               {
//                 id: 3,
//                 document_type: { 
//                   code: 'imaging_cd', 
//                   name: '진료기록영상 (CD)', 
//                   requires_signature: false 
//                 },
//                 status: 'pending'
//               },
//               {
//                 id: 4,
//                 document_type: { 
//                   code: 'export_certificate', 
//                   name: '반출 확인서', 
//                   requires_signature: true 
//                 },
//                 status: 'pending'
//               }
//             ]
//           }
//         ]
//       };
//     }
//   },

//   /**
//    * 특정 검사의 서류 상세 조회
//    */
//   getStudyDocumentDetail: async (studyId) => {
//     try {
//       const response = await api.get(`/study-documents/${studyId}/`);
//       return response.data;
//     } catch (error) {
//       console.error(`Failed to fetch study document ${studyId}:`, error);
//       throw error;
//     }
//   },

//   /**
//    * 검사에 필요한 서류들 자동 생성
//    */
//   createDocuments: async (studyId) => {
//     try {
//       const response = await api.post(`/study-documents/${studyId}/create_documents/`);
//       return response.data;
//     } catch (error) {
//       console.error(`Failed to create documents for study ${studyId}:`, error);
//       throw error;
//     }
//   },

//   /**
//    * 선택된 서류들 일괄 처리
//    */
//   processDocuments: async (studyId, data) => {
//     try {
//       const response = await api.post(`/study-documents/${studyId}/process_documents/`, data);
//       return response.data;
//     } catch (error) {
//       console.error(`Failed to process documents for study ${studyId}:`, error);
//       throw error;
//     }
//   },

//   /**
//    * 서류 미리보기 데이터 조회
//    */
//   previewDocument: async (studyId, docType) => {
//     try {
//       const response = await api.get(`/study-documents/${studyId}/preview_document/?doc_type=${docType}`);
//       return response.data;
//     } catch (error) {
//       console.error(`Failed to preview document ${docType} for study ${studyId}:`, error);
//       throw error;
//     }
//   },

//   // ========== 개별 서류 요청 관리 ==========

//   /**
//    * 서류 요청 목록 조회
//    */
//   getDocumentRequests: async (filters = {}) => {
//     try {
//       const params = new URLSearchParams();
      
//       if (filters.study_id) {
//         params.append('study_id', filters.study_id);
//       }
//       if (filters.status) {
//         params.append('status', filters.status);
//       }
//       if (filters.doc_type) {
//         params.append('doc_type', filters.doc_type);
//       }
      
//       const response = await api.get(`/document-requests/?${params.toString()}`);
//       return response.data;
//     } catch (error) {
//       console.error('Failed to fetch document requests:', error);
//       throw error;
//     }
//   },

//   /**
//    * 🔥 개별 서류 상태 변경 (업로드/발급완료 처리용) - 콜백 지원 추가
//    */
//   updateDocumentStatus: async (docRequestId, data, options = {}) => {
//     try {
//       console.log('🔄 서류 상태 업데이트 시작:', { docRequestId, data });
      
//       const response = await api.patch(`/document-requests/${docRequestId}/update_status/`, data);
      
//       console.log('✅ 서류 상태 업데이트 성공:', response.data);
      
//       // 🔥 옵션 처리 (새로고침 콜백 등)
//       if (options.onSuccess && typeof options.onSuccess === 'function') {
//         try {
//           await options.onSuccess(response.data);
//         } catch (callbackError) {
//           console.error('❌ 성공 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error(`❌ 서류 상태 업데이트 실패 ${docRequestId}:`, error);
      
//       // 🔥 옵션 처리 (에러 콜백)
//       if (options.onError && typeof options.onError === 'function') {
//         try {
//           await options.onError(error);
//         } catch (callbackError) {
//           console.error('❌ 에러 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       throw error;
//     }
//   },

//   /**
//    * 🔥 CD 굽기 완료 시 상태 업데이트 (콜백 지원 강화)
//    */
//   updateCDStatus: async (studyId, documentId, options = {}) => {
//     try {
//       console.log('🔄 CD 굽기 완료 상태 업데이트:', { studyId, documentId });
      
//       // CD 관련 서류 상태를 완료로 변경
//       const response = await api.patch(`/document-requests/${documentId}/update_status/`, {
//         status: 'completed',
//         processed_by: 'cd_burner_system',
//         notes: 'CD 굽기 완료'
//       });
      
//       console.log('✅ CD 상태 업데이트 성공:', response.data);
      
//       // 🔥 성공 시 부모 컴포넌트로 상태 변경 알림
//       if (options.onSuccess && typeof options.onSuccess === 'function') {
//         console.log('🔄 CD 완료 콜백 실행');
//         try {
//           await options.onSuccess(studyId, documentId, 'completed');
//         } catch (callbackError) {
//           console.error('❌ CD 완료 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error(`❌ CD 상태 업데이트 실패:`, error);
      
//       // 🔥 에러 콜백 처리
//       if (options.onError && typeof options.onError === 'function') {
//         try {
//           await options.onError(error);
//         } catch (callbackError) {
//           console.error('❌ CD 에러 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       throw error;
//     }
//   },

//   /**
//    * 🔥 업로드 완료 시 상태 업데이트 (새로 추가)
//    */
//   updateUploadStatus: async (documentId, options = {}) => {
//     try {
//       console.log('🔄 업로드 완료 상태 업데이트:', { documentId });
      
//       const response = await api.patch(`/document-requests/${documentId}/update_status/`, {
//         status: 'completed',
//         processed_by: 'upload_system',
//         notes: '스캔 업로드 완료'
//       });
      
//       console.log('✅ 업로드 상태 업데이트 성공:', response.data);
      
//       // 🔥 성공 콜백 실행
//       if (options.onSuccess && typeof options.onSuccess === 'function') {
//         console.log('🔄 업로드 완료 콜백 실행');
//         try {
//           await options.onSuccess(null, documentId, 'completed');
//         } catch (callbackError) {
//           console.error('❌ 업로드 완료 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error(`❌ 업로드 상태 업데이트 실패:`, error);
//       throw error;
//     }
//   },

//   // ========== 서류 종류 관리 ==========

//   /**
//    * 서류 종류 목록 조회
//    */
//   getDocumentTypes: async () => {
//     try {
//       const response = await api.get('/document-types/');
//       return response.data;
//     } catch (error) {
//       console.error('Failed to fetch document types:', error);
//       throw error;
//     }
//   },

//   // ========== 통계 ==========

//   /**
//    * 서류 발급 통계 조회
//    */
//   getStatistics: async () => {
//     try {
//       const response = await api.get('/statistics/');
//       return response.data;
//     } catch (error) {
//       console.error('Failed to fetch statistics:', error);
//       throw error;
//     }
//   },

//   // ========== 파일 업로드 ==========

//   /**
//    * 🔥 파일 업로드 (스캔 문서 등) - 실제 Django API 사용
//    */
//   uploadFile: async (file, metadata = {}, options = {}) => {
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
      
//       Object.keys(metadata).forEach(key => {
//         formData.append(key, metadata[key]);
//       });

//       // 🔥 실제 Django API 호출
//       const response = await axios.post(`${PACSDOCS_API_URL}/upload/`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 30000,
//       });
      
//       console.log('✅ 파일 업로드 성공:', response.data);
      
//       // 🔥 업로드 성공 콜백 실행
//       if (options.onSuccess && typeof options.onSuccess === 'function') {
//         try {
//           await options.onSuccess(response.data);
//         } catch (callbackError) {
//           console.error('❌ 업로드 성공 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error('❌ 파일 업로드 실패:', error);
      
//       // 🔥 업로드 에러 콜백 실행
//       if (options.onError && typeof options.onError === 'function') {
//         try {
//           await options.onError(error);
//         } catch (callbackError) {
//           console.error('❌ 업로드 에러 콜백 실행 실패:', callbackError);
//         }
//       }
      
//       throw error;
//     }
//   },
// };

// // ========== 🔧 헬퍼 함수들 ==========

// /**
//  * 🔧 모달리티별 기본 서류 생성 함수 (중복 방지)
//  */
// function getDefaultDocuments(modality) {
//   const contrastModalities = ['CT', 'MR', 'XA', 'NM', 'PT'];
//   const requiresContrast = contrastModalities.includes(modality);

//   const baseDocuments = [
//     {
//       id: Date.now() + 1,
//       document_type: { 
//         code: 'report_kor', 
//         name: '판독 결과지 (국문)', 
//         requires_signature: false 
//       },
//       status: 'pending'
//     },
//     {
//       id: Date.now() + 2,
//       document_type: { 
//         code: 'imaging_cd', 
//         name: '진료기록영상 (CD)', 
//         requires_signature: false 
//       },
//       status: 'pending'
//     },
//     {
//       id: Date.now() + 3,
//       document_type: { 
//         code: 'export_certificate', 
//         name: '반출 확인서', 
//         requires_signature: true 
//       },
//       status: 'pending'
//     }
//   ];

//   // 🔥 수정: 조영제 동의서 중복 방지
//   if (requiresContrast) {
//     // 이미 동의서가 있는지 확인
//     const hasConsent = baseDocuments.some(doc => 
//       doc.document_type.code === 'consent_contrast'
//     );
    
//     if (!hasConsent) {
//       baseDocuments.unshift({
//         id: Date.now(),
//         document_type: { 
//           code: 'consent_contrast', 
//           name: '조영제 사용 동의서', 
//           requires_signature: true 
//         },
//         status: 'pending'
//       });
//     }
//   }

//   return baseDocuments;
// }

// /**
//  * 모달리티별 조영제 필요 여부 확인
//  */
// export const requiresContrast = (modality) => {
//   const contrastModalites = ['CT', 'MR', 'XA', 'NM', 'PT'];
//   return contrastModalites.includes(modality);
// };

// /**
//  * 서류 상태 한국어 변환
//  */
// export const getStatusLabel = (status) => {
//   const statusMap = {
//     'pending': '대기',
//     'selected': '선택됨',
//     'generated': '생성됨',
//     'signature_waiting': '서명대기',
//     'scan_waiting': '스캔대기',
//     'completed': '완료',
//     'cancelled': '취소',
//   };
//   return statusMap[status] || status;
// };

// /**
//  * 서류 종류 한국어 이름 반환
//  */
// export const getDocumentTypeName = (docType) => {
//   const typeMap = {
//     'consent_contrast': '조영제 사용 동의서',
//     'report_kor': '판독 결과지 (국문)',
//     'report_eng': '판독 결과지 (영문)',
//     'imaging_cd': '진료기록영상 (CD)',
//     'imaging_dvd': '진료기록영상 (DVD)',
//     'export_certificate': '반출 확인서',
//     'exam_certificate': '검사 확인서',
//     'consultation_request': '협진 의뢰서',
//     'medical_record_access_consent': '진료기록 열람 동의서',
//     'medical_record_access_proxy': '진료기록 열람 위임장',
//   };
//   return typeMap[docType] || docType;
// };

// export default pacsdocsService;

// pacsapp/src/services/pacsdocsService.js
import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PACSDOCS_API_URL = `${API_BASE_URL}/api/pacsdocs/api`;
const WORKLIST_API_URL = `${API_BASE_URL}/api/worklists`; // 워크리스트 API

// PACS 문서 API 인스턴스
const api = axios.create({
  baseURL: PACSDOCS_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 워크리스트 API 인스턴스
const worklistApi = axios.create({
  baseURL: WORKLIST_API_URL, // http://localhost:8000/api/worklists
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청/응답 인터셉터 (개발용 로깅 추가)
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 PACS API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ PACS Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ PACS API Response: ${response.status} ${response.config.url}`);
    console.log('📄 PACS Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ PACS API Error:', error);
    console.error('📄 Error Response:', error.response?.data);
    console.error('🔗 Request URL:', error.config?.url);
    return Promise.reject(error);
  }
);

export const pacsdocsService = {
  // ========== 🔥 통합된 검사별 서류 관리 (메인 UI용) ==========
  
  /**
   * 🔥 검사별 서류 목록 조회 (워크리스트 + 서류 정보 통합)
   */
  getStudyDocuments: async (filters = {}) => {
    try {
      console.log('🔄 PACS 문서 통합 데이터 조회 시작', filters);

      // 1️⃣ 워크리스트 데이터 가져오기
      let worklistData = [];
      if (filters.exam_date) {
        try {
          console.log(`🔍 워크리스트 조회 날짜: ${filters.exam_date}`);
          const worklistResponse = await worklistApi.get(`/${filters.exam_date}/`);
          
          // Django API 응답 구조에 맞게 데이터 추출 (worklistService.js와 동일하게)
          if (worklistResponse.data.status === 'success') {
            worklistData = worklistResponse.data.data || [];
            console.log(`✅ 워크리스트 데이터 ${worklistData.length}개 로드됨`);
            console.log('🔍 첫 번째 워크리스트 항목:', worklistData[0]); // 🔧 디버깅 추가
            console.log('🔍 모든 필드명:', Object.keys(worklistData[0] || {})); // 🔧 디버깅 추가
          } else {
            console.warn('⚠️ API 응답 상태가 success가 아님:', worklistResponse.data);
            worklistData = [];
          }
        } catch (worklistError) {
          console.error('❌ 워크리스트 조회 실패:', worklistError);
          // 워크리스트 조회 실패시 빈 배열로 계속 진행
          worklistData = [];
        }
      }

      // 필터링 적용 (환자명, 모달리티)
      if (filters.patient_name) {
        worklistData = worklistData.filter(item => 
          item.patientName?.includes(filters.patient_name)
        );
      }
      if (filters.modality) {
        worklistData = worklistData.filter(item => 
          item.modality === filters.modality
        );
      }

      // 2️⃣ 각 검사별 서류 정보 추가
      const enrichedData = await Promise.all(
        worklistData.map(async (studyRequest) => {
          try {
            // 🔥 판독의와 검사일시 유효성 체크
            const hasRadiologist = studyRequest.reportingDoctor && 
                                 studyRequest.reportingDoctor !== '' && 
                                 studyRequest.reportingDoctor !== 'N/A' &&
                                 studyRequest.reportingDoctor !== 'n/a';
            
            const hasValidDateTime = studyRequest.requestDateTime && 
                                    studyRequest.requestDateTime !== '' && 
                                    studyRequest.requestDateTime !== 'N/A' &&
                                    studyRequest.requestDateTime !== 'n/a';
            
            // 판독의나 검사일시가 없으면 null 반환 (나중에 필터링됨)
            if (!hasRadiologist || !hasValidDateTime) {
              console.log(`🚫 필터링됨: Study ID ${studyRequest.id} - 판독의: ${hasRadiologist}, 검사일시: ${hasValidDateTime}`);
              return null;
            }

            // 각 검사별 서류 정보 조회 시도
            const docResponse = await api.get(`/study-documents/${studyRequest.id}/`);
            
            return {
              // 🔥 워크리스트 필드명 그대로 사용 ✅
              ...studyRequest, // 모든 필드 그대로 복사
              
              // 📄 서류 정보만 추가
              documents: docResponse.data.documents || []
            };
          } catch (docError) {
            console.warn(`서류 정보 조회 실패 (Study ID: ${studyRequest.id}):`, docError);
            
            // 🔥 서류 정보 조회 실패해도 판독의와 검사일시가 있으면 포함
            const hasRadiologist = studyRequest.reportingDoctor && 
                                 studyRequest.reportingDoctor !== '' && 
                                 studyRequest.reportingDoctor !== 'N/A' &&
                                 studyRequest.reportingDoctor !== 'n/a';
            
            const hasValidDateTime = studyRequest.requestDateTime && 
                                    studyRequest.requestDateTime !== '' && 
                                    studyRequest.requestDateTime !== 'N/A' &&
                                    studyRequest.requestDateTime !== 'n/a';
            
            if (!hasRadiologist || !hasValidDateTime) {
              console.log(`🚫 필터링됨 (서류조회실패): Study ID ${studyRequest.id} - 판독의: ${hasRadiologist}, 검사일시: ${hasValidDateTime}`);
              return null;
            }
            
            // 🔧 서류 정보가 없는 경우 기본 서류 생성
            const defaultDocuments = getDefaultDocuments(studyRequest.modality);
            
            return {
              // 🔥 워크리스트 필드명 그대로 사용 ✅
              ...studyRequest, // 모든 필드 그대로 복사
              
              // 📄 기본 서류 정보 추가
              documents: defaultDocuments
            };
          }
        })
      );

      // 🔥 null 값들 제거 (필터링된 데이터)
      const filteredData = enrichedData.filter(item => item !== null);

      console.log(`✅ 필터링된 데이터 완성: ${filteredData.length}개 (원본: ${enrichedData.length}개)`);
      
      return {
        results: filteredData,
        count: filteredData.length,
        date: filters.exam_date
      };

    } catch (error) {
      console.error('❌ PACS 문서 통합 데이터 조회 실패:', error);
      
      // 🔄 에러 발생시에도 워크리스트 API 한번 더 시도
      console.log('🔄 에러 복구: 워크리스트 API 직접 호출 시도');
      try {
        const fallbackResponse = await worklistApi.get(`/${filters.exam_date}/`);
        if (fallbackResponse.data.status === 'success') {
          console.log('✅ 복구 성공! 워크리스트 데이터:', fallbackResponse.data.data);
          
          // 🔥 복구 시에도 필터링 적용
          const fallbackData = fallbackResponse.data.data.filter(item => {
            const hasRadiologist = item.reportingDoctor && 
                                 item.reportingDoctor !== '' && 
                                 item.reportingDoctor !== 'N/A' &&
                                 item.reportingDoctor !== 'n/a';
            
            const hasValidDateTime = item.requestDateTime && 
                                    item.requestDateTime !== '' && 
                                    item.requestDateTime !== 'N/A' &&
                                    item.requestDateTime !== 'n/a';
            
            return hasRadiologist && hasValidDateTime;
          });
          
          return {
            results: fallbackData.map(item => ({
              ...item,
              documents: getDefaultDocuments(item.modality)
            })),
            count: fallbackData.length,
            date: filters.exam_date
          };
        }
      } catch (fallbackError) {
        console.error('❌ 복구도 실패:', fallbackError);
      }
      
      // 🔄 개발용: 더미 데이터 반환 (기존 코드 유지)
      console.warn('🔄 Using dummy data for development');
      return {
        results: [
          {
            id: 1,
            patientId: 'P2025-001234',
            patientName: '김철수',
            birthDate: '1985-06-12',
            examPart: '흉부',
            modality: 'CT',
            reportingDoctor: '이지은',
            requestDateTime: '2025-06-24T14:30:00Z',
            priority: '응급',
            examStatus: '검사완료',
            documents: [
              {
                id: 1,
                document_type: { 
                  code: 'consent_contrast', 
                  name: '조영제 사용 동의서', 
                  requires_signature: true 
                },
                status: 'pending'
              },
              {
                id: 2,
                document_type: { 
                  code: 'report_kor', 
                  name: '판독 결과지 (국문)', 
                  requires_signature: false 
                },
                status: 'pending'
              },
              {
                id: 3,
                document_type: { 
                  code: 'imaging_cd', 
                  name: '진료기록영상 (CD)', 
                  requires_signature: false 
                },
                status: 'pending'
              },
              {
                id: 4,
                document_type: { 
                  code: 'export_certificate', 
                  name: '반출 확인서', 
                  requires_signature: true 
                },
                status: 'pending'
              }
            ]
          }
        ]
      };
    }
  },

  /**
   * 특정 검사의 서류 상세 조회
   */
  getStudyDocumentDetail: async (studyId) => {
    try {
      const response = await api.get(`/study-documents/${studyId}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch study document ${studyId}:`, error);
      throw error;
    }
  },

  /**
   * 검사에 필요한 서류들 자동 생성
   */
  createDocuments: async (studyId) => {
    try {
      const response = await api.post(`/study-documents/${studyId}/create_documents/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to create documents for study ${studyId}:`, error);
      throw error;
    }
  },

  /**
   * 선택된 서류들 일괄 처리
   */
  processDocuments: async (studyId, data) => {
    try {
      const response = await api.post(`/study-documents/${studyId}/process_documents/`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to process documents for study ${studyId}:`, error);
      throw error;
    }
  },

  /**
   * 서류 미리보기 데이터 조회
   */
  previewDocument: async (studyId, docType) => {
    try {
      const response = await api.get(`/study-documents/${studyId}/preview_document/?doc_type=${docType}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to preview document ${docType} for study ${studyId}:`, error);
      throw error;
    }
  },

  // ========== 개별 서류 요청 관리 ==========

  /**
   * 서류 요청 목록 조회
   */
  getDocumentRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.study_id) {
        params.append('study_id', filters.study_id);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.doc_type) {
        params.append('doc_type', filters.doc_type);
      }
      
      const response = await api.get(`/document-requests/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch document requests:', error);
      throw error;
    }
  },

  /**
   * 🔥 개별 서류 상태 변경 (업로드/발급완료 처리용) - 콜백 지원 추가
   */
  updateDocumentStatus: async (docRequestId, data, options = {}) => {
    try {
      console.log('🔄 서류 상태 업데이트 시작:', { docRequestId, data });
      
      const response = await api.patch(`/document-requests/${docRequestId}/update_status/`, data);
      
      console.log('✅ 서류 상태 업데이트 성공:', response.data);
      
      // 🔥 옵션 처리 (새로고침 콜백 등)
      if (options.onSuccess && typeof options.onSuccess === 'function') {
        try {
          await options.onSuccess(response.data);
        } catch (callbackError) {
          console.error('❌ 성공 콜백 실행 실패:', callbackError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ 서류 상태 업데이트 실패 ${docRequestId}:`, error);
      
      // 🔥 옵션 처리 (에러 콜백)
      if (options.onError && typeof options.onError === 'function') {
        try {
          await options.onError(error);
        } catch (callbackError) {
          console.error('❌ 에러 콜백 실행 실패:', callbackError);
        }
      }
      
      throw error;
    }
  },

  /**
   * 🔥 CD 굽기 완료 시 상태 업데이트 (콜백 지원 강화)
   */
  updateCDStatus: async (studyId, documentId, options = {}) => {
    try {
      console.log('🔄 CD 굽기 완료 상태 업데이트:', { studyId, documentId });
      
      // CD 관련 서류 상태를 완료로 변경
      const response = await api.patch(`/document-requests/${documentId}/update_status/`, {
        status: 'completed',
        processed_by: 'cd_burner_system',
        notes: 'CD 굽기 완료'
      });
      
      console.log('✅ CD 상태 업데이트 성공:', response.data);
      
      // 🔥 성공 시 부모 컴포넌트로 상태 변경 알림
      if (options.onSuccess && typeof options.onSuccess === 'function') {
        console.log('🔄 CD 완료 콜백 실행');
        try {
          await options.onSuccess(studyId, documentId, 'completed');
        } catch (callbackError) {
          console.error('❌ CD 완료 콜백 실행 실패:', callbackError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ CD 상태 업데이트 실패:`, error);
      
      // 🔥 에러 콜백 처리
      if (options.onError && typeof options.onError === 'function') {
        try {
          await options.onError(error);
        } catch (callbackError) {
          console.error('❌ CD 에러 콜백 실행 실패:', callbackError);
        }
      }
      
      throw error;
    }
  },

  /**
   * 🔥 업로드 완료 시 상태 업데이트 (새로 추가)
   */
  updateUploadStatus: async (documentId, options = {}) => {
    try {
      console.log('🔄 업로드 완료 상태 업데이트:', { documentId });
      
      const response = await api.patch(`/document-requests/${documentId}/update_status/`, {
        status: 'completed',
        processed_by: 'upload_system',
        notes: '스캔 업로드 완료'
      });
      
      console.log('✅ 업로드 상태 업데이트 성공:', response.data);
      
      // 🔥 성공 콜백 실행
      if (options.onSuccess && typeof options.onSuccess === 'function') {
        console.log('🔄 업로드 완료 콜백 실행');
        try {
          await options.onSuccess(null, documentId, 'completed');
        } catch (callbackError) {
          console.error('❌ 업로드 완료 콜백 실행 실패:', callbackError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ 업로드 상태 업데이트 실패:`, error);
      throw error;
    }
  },

  // ========== 서류 종류 관리 ==========

  /**
   * 서류 종류 목록 조회
   */
  getDocumentTypes: async () => {
    try {
      const response = await api.get('/document-types/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch document types:', error);
      throw error;
    }
  },

  // ========== 통계 ==========

  /**
   * 서류 발급 통계 조회
   */
  getStatistics: async () => {
    try {
      const response = await api.get('/statistics/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      throw error;
    }
  },

  // ========== 파일 업로드 ==========

  /**
   * 🔥 파일 업로드 (스캔 문서 등) - 실제 Django API 사용
   */
  uploadFile: async (file, metadata = {}, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      // 🔥 실제 Django API 호출
      const response = await axios.post(`${PACSDOCS_API_URL}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      console.log('✅ 파일 업로드 성공:', response.data);
      
      // 🔥 업로드 성공 콜백 실행
      if (options.onSuccess && typeof options.onSuccess === 'function') {
        try {
          await options.onSuccess(response.data);
        } catch (callbackError) {
          console.error('❌ 업로드 성공 콜백 실행 실패:', callbackError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
      
      // 🔥 업로드 에러 콜백 실행
      if (options.onError && typeof options.onError === 'function') {
        try {
          await options.onError(error);
        } catch (callbackError) {
          console.error('❌ 업로드 에러 콜백 실행 실패:', callbackError);
        }
      }
      
      throw error;
    }
  },
};

// ========== 🔧 헬퍼 함수들 ==========

/**
 * 🔧 모달리티별 기본 서류 생성 함수 (중복 방지)
 */
function getDefaultDocuments(modality) {
  const contrastModalities = ['CT', 'MR', 'XA', 'NM', 'PT'];
  const requiresContrast = contrastModalities.includes(modality);

  const baseDocuments = [
    {
      id: Date.now() + 1,
      document_type: { 
        code: 'report_kor', 
        name: '판독 결과지 (국문)', 
        requires_signature: false 
      },
      status: 'pending'
    },
    {
      id: Date.now() + 2,
      document_type: { 
        code: 'imaging_cd', 
        name: '진료기록영상 (CD)', 
        requires_signature: false 
      },
      status: 'pending'
    },
    {
      id: Date.now() + 3,
      document_type: { 
        code: 'export_certificate', 
        name: '반출 확인서', 
        requires_signature: true 
      },
      status: 'pending'
    }
  ];

  // 🔥 수정: 조영제 동의서 중복 방지
  if (requiresContrast) {
    // 이미 동의서가 있는지 확인
    const hasConsent = baseDocuments.some(doc => 
      doc.document_type.code === 'consent_contrast'
    );
    
    if (!hasConsent) {
      baseDocuments.unshift({
        id: Date.now(),
        document_type: { 
          code: 'consent_contrast', 
          name: '조영제 사용 동의서', 
          requires_signature: true 
        },
        status: 'pending'
      });
    }
  }

  return baseDocuments;
}

/**
 * 모달리티별 조영제 필요 여부 확인
 */
export const requiresContrast = (modality) => {
  const contrastModalites = ['CT', 'MR', 'XA', 'NM', 'PT'];
  return contrastModalites.includes(modality);
};

/**
 * 서류 상태 한국어 변환
 */
export const getStatusLabel = (status) => {
  const statusMap = {
    'pending': '대기',
    'selected': '선택됨',
    'generated': '생성됨',
    'signature_waiting': '서명대기',
    'scan_waiting': '스캔대기',
    'completed': '완료',
    'cancelled': '취소',
  };
  return statusMap[status] || status;
};

/**
 * 서류 종류 한국어 이름 반환
 */
export const getDocumentTypeName = (docType) => {
  const typeMap = {
    'consent_contrast': '조영제 사용 동의서',
    'report_kor': '판독 결과지 (국문)',
    'report_eng': '판독 결과지 (영문)',
    'imaging_cd': '진료기록영상 (CD)',
    'imaging_dvd': '진료기록영상 (DVD)',
    'export_certificate': '반출 확인서',
    'exam_certificate': '검사 확인서',
    'consultation_request': '협진 의뢰서',
    'medical_record_access_consent': '진료기록 열람 동의서',
    'medical_record_access_proxy': '진료기록 열람 위임장',
  };
  return typeMap[docType] || docType;
};

export default pacsdocsService;