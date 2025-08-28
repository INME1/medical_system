// services/noticeService.js - 페이지네이션 구조 대응 버전
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 디버깅용 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      dataStructure: {
        hasResults: !!response.data.results,
        hasData: !!response.data.data,
        resultsLength: response.data.results?.length,
        dataLength: response.data.data?.length,
        count: response.data.count
      }
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);
    return Promise.reject(error);
  }
);

export const noticeService = {
  // ✅ DRF 페이지네이션 구조에 맞게 수정
  getCommonNotices: async () => {
    try {
      console.log('📢 Common 공지사항 조회 시작');
      const response = await api.get('/notices/common/');
      
      console.log('📊 응답 구조 분석:');
      console.log('  전체 응답:', response.data);
      console.log('  결과 배열:', response.data.results);
      console.log('  데이터 개수:', response.data.count);
      
      // ✅ DRF 페이지네이션: results 배열 사용
      if (response.data && response.data.results) {
        console.log(`📢 Common 공지사항 ${response.data.results.length}개 조회 성공`);
        return response.data.results;
      } 
      // ✅ 기존 구조도 대응: data 배열 사용
      else if (response.data && response.data.data) {
        console.log(`📢 Common 공지사항 ${response.data.data.length}개 조회 성공 (기존 구조)`);
        return response.data.data;
      }
      // ✅ 직접 배열인 경우도 대응
      else if (Array.isArray(response.data)) {
        console.log(`📢 Common 공지사항 ${response.data.length}개 조회 성공 (직접 배열)`);
        return response.data;
      }
      else {
        console.warn('⚠️ 예상과 다른 응답 구조:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Common 공지사항 조회 실패:', error);
      return [];
    }
  },

  // ✅ RIS 공지사항도 동일하게 수정
  getRISNotices: async () => {
    try {
      console.log('📢 RIS 공지사항 조회 시작');
      const response = await api.get('/notices/ris/');
      
      // DRF 페이지네이션 구조 대응
      if (response.data && response.data.results) {
        console.log(`📢 RIS 공지사항 ${response.data.results.length}개 조회 성공`);
        return response.data.results;
      } 
      else if (response.data && response.data.data) {
        return response.data.data;
      }
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      else {
        console.warn('⚠️ RIS 공지사항 응답 구조가 예상과 다름:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ RIS 공지사항 조회 실패:', error);
      return [];
    }
  },

  // ✅ 시스템 공지사항 (중요/핀 공지사항 필터링)
  getSystemNotices: async () => {
    try {
      console.log('📢 시스템 공지사항 조회 시작');
      const commonNotices = await noticeService.getCommonNotices();
      
      // 중요 공지사항 또는 핀된 공지사항만 필터링
      const systemNotices = commonNotices.filter(notice => 
        notice.is_pinned === true || 
        notice.notice_type === 'important' ||
        notice.notice_type === 'update'
      );
      
      // 정렬: 핀된 것 먼저, 그 다음 최신순
      const sortedNotices = systemNotices.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      console.log(`📢 시스템 공지사항 ${sortedNotices.length}개 필터링 완료`);
      return sortedNotices.slice(0, 5); // 최대 5개
    } catch (error) {
      console.error('❌ 시스템 공지사항 조회 실패:', error);
      return [];
    }
  },

  // ✅ 타입별 공지사항 조회
  getNoticesByType: async (type) => {
    try {
      let notices = [];
      
      switch (type) {
        case 'system':
        case 'important':
          notices = await noticeService.getSystemNotices();
          break;
        case 'ris':
          notices = await noticeService.getRISNotices();
          break;
        case 'common':
        default:
          notices = await noticeService.getCommonNotices();
          break;
      }
      
      console.log(`📢 ${type} 타입 공지사항 ${notices.length}개 반환`);
      return notices;
    } catch (error) {
      console.error(`❌ ${type} 타입 공지사항 조회 실패:`, error);
      return [];
    }
  },

  // ✅ 최신 공지사항 조회 (모든 타입 통합)
  getLatestNotices: async (limit = 10) => {
    try {
      console.log('📢 최신 공지사항 통합 조회 시작');
      
      // Common과 RIS 공지사항을 모두 가져와서 통합
      const [commonNotices, risNotices] = await Promise.all([
        noticeService.getCommonNotices(),
        noticeService.getRISNotices()
      ]);
      
      // 모든 공지사항을 하나의 배열로 통합
      const allNotices = [
        ...commonNotices.map(notice => ({ ...notice, source_type: 'common' })),
        ...risNotices.map(notice => ({ ...notice, source_type: 'ris' }))
      ];
      
      // 최신순으로 정렬
      const sortedNotices = allNotices.sort((a, b) => {
        // 핀된 공지사항을 먼저
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        // 그 다음 최신순
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      const limitedNotices = sortedNotices.slice(0, limit);
      console.log(`📢 최신 공지사항 ${limitedNotices.length}개 반환`);
      
      return limitedNotices;
    } catch (error) {
      console.error('❌ 최신 공지사항 조회 실패:', error);
      return [];
    }
  },

  // ✅ 간단한 테스트 함수
  testConnection: async () => {
    try {
      console.log('🧪 API 연결 테스트 시작');
      
      const commonTest = await noticeService.getCommonNotices();
      console.log(`✅ Common: ${commonTest.length}개`);
      
      const risTest = await noticeService.getRISNotices();
      console.log(`✅ RIS: ${risTest.length}개`);
      
      const systemTest = await noticeService.getSystemNotices();
      console.log(`✅ System: ${systemTest.length}개`);
      
      return {
        common: commonTest.length,
        ris: risTest.length,
        system: systemTest.length
      };
    } catch (error) {
      console.error('❌ 연결 테스트 실패:', error);
      return null;
    }
  }
};

// 개발환경에서 전역으로 노출
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.noticeService = noticeService;
  console.log('🔧 noticeService가 window.noticeService로 노출됨');
}