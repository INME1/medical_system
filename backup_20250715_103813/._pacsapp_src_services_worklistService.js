import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// ✅ 한국어 날짜 파싱 ("2025. 6. 26. 오전 5:45" → "2025-06-26")
const parseKoreanDate = (koreanStr) => {
  if (!koreanStr) return null;
  const match = koreanStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
};

export const worklistService = {
  // ✅ 전체 워크리스트 조회 (ViewSet의 worklist action 사용)
  getWorklist: async () => {
    try {
      console.log('🔍 전체 워크리스트 조회');
      const response = await api.get('/worklists/worklist/');
      console.log(`✅ 성공: ${response.data.length}개`);
      return response.data;
    } catch (error) {
      console.error('❌ 전체 워크리스트 조회 실패:', error);
      throw error;
    }
  },

  // ✅ 날짜별 워크리스트 (우리가 만든 날짜별 API 사용)
  getWorklistByDate: async (targetDate) => {
    try {
      console.log(`🔍 날짜별 조회: ${targetDate}`);
      
      // 날짜 형식 검증 (YYYY-MM-DD)
      if (!targetDate || !targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error(`잘못된 날짜 형식: ${targetDate}`);
      }
      
      // ✅ 우리가 만든 날짜별 API 호출
      const response = await api.get(`/worklists/${targetDate}/`);
      
      console.log(`✅ 날짜별 조회 성공:`, response.data);
      
      // Django API 응답 구조에 맞게 데이터 추출
      if (response.data.status === 'success') {
        console.log(`📊 데이터 ${response.data.count}개 로드됨`);
        return response.data.data;  // 실제 데이터 배열
      } else {
        console.warn('⚠️ API 응답 상태가 success가 아님:', response.data);
        return [];
      }
      
    } catch (error) {
      console.error('❌ 날짜별 조회 실패:', error);
      
      // ✅ 폴백: 전체 데이터에서 클라이언트 필터링
      console.log('🔄 폴백: 클라이언트 필터링 시도');
      try {
        const allData = await worklistService.getWorklist();
        const filtered = allData.filter(item => {
          // 한국어 날짜 형식 파싱
          const requestDate = parseKoreanDate(item.requestDateTime);
          const examDate = parseKoreanDate(item.examDateTime);
          
          // 요청일 또는 검사일이 타겟 날짜와 일치하면 포함
          return requestDate === targetDate || examDate === targetDate;
        });
        
        console.log(`✅ 클라이언트 필터 성공: ${filtered.length}개`);
        return filtered;
      } catch (fallbackError) {
        console.error('❌ 폴백도 실패:', fallbackError);
        throw error;  // 원래 에러를 던짐
      }
    }
  },

  // ✅ 검사 배정 (ViewSet action)
  assignExam: async (examId, assignmentData) => {
    try {
      console.log(`🔍 검사 배정: ID ${examId}`, assignmentData);
      const response = await api.post(`/worklists/${examId}/assign/`, assignmentData);
      console.log('✅ 배정 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 배정 실패:', error);
      throw error;
    }
  },

  // ✅ 검사 시작 (ViewSet action)
  startExam: async (examId) => {
    try {
      console.log(`🔍 검사 시작: ID ${examId}`);
      const response = await api.post(`/worklists/${examId}/start_exam/`);
      console.log('✅ 시작 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 시작 실패:', error);
      throw error;
    }
  },

  // ✅ 검사 완료 (ViewSet action)
  completeExam: async (examId) => {
    try {
      console.log(`🔍 검사 완료: ID ${examId}`);
      const response = await api.post(`/worklists/${examId}/complete_exam/`);
      console.log('✅ 완료 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 완료 실패:', error);
      throw error;
    }
  },

  // ✅ 검사 취소 (ViewSet action)
  cancelExam: async (examId) => {
    try {
      console.log(`🔍 검사 취소: ID ${examId}`);
      const response = await api.post(`/worklists/${examId}/cancel_exam/`);
      console.log('✅ 취소 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 취소 실패:', error);
      throw error;
    }
  }
};

// 개발환경 노출
if (process.env.NODE_ENV === 'development') {
  window.worklistService = worklistService;
  window.parseKoreanDate = parseKoreanDate;
  
  console.log('🔧 worklistService 준비됨 (수정된 API 엔드포인트)');
  console.log('📅 날짜별 테스트: worklistService.getWorklistByDate("2025-06-26")');
}