// // /home/medical_system/pacsapp/src/services/scheduleService.js

// import axios from 'axios';
// import { getTodayKST, formatDateTimeForServer } from '../utils/timeUtils';

// const API_BASE_URL = 'http://35.225.63.41:8000/api';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // 에러 응답 인터셉터
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error('API Error:', error);
//     if (error.response) {
//       console.error('Status:', error.response.status);
//       console.error('Data:', error.response.data);
//     }
//     return Promise.reject(error);
//   }
// );

// export const scheduleService = {
//   getTodayKST,

//   // 전체 일정 조회
//   getCommonSchedules: async () => {
//     try {
//       const response = await api.get('/schedules/common/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching common schedules:', error);
//       throw error;
//     }
//   },

//   // 부서 일정 조회
//   getRISSchedules: async () => {
//     try {
//       const response = await api.get('/schedules/ris/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching RIS schedules:', error);
//       throw error;
//     }
//   },

//   // 개인 일정 조회
//   getPersonalSchedules: async () => {
//     try {
//       const response = await api.get('/schedules/personal/my_schedules/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching personal schedules:', error);
//       throw error;
//     }
//   },

//   // 오늘 개인 일정 조회
//   getTodayPersonalSchedules: async () => {
//     try {
//       const response = await api.get('/schedules/personal/today_schedules/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching today personal schedules:', error);
//       throw error;
//     }
//   },

//   // 🔧 개인 일정 생성 - 시간 처리 수정
//   createPersonalSchedule: async (scheduleData) => {
//     try {
//       console.log('🕐 Creating personal schedule (원본):', scheduleData);
      
//       // timeUtils를 사용하여 올바른 시간 변환
//       const cleanData = {
//         title: scheduleData.title,
//         datetime: formatDateTimeForServer(scheduleData.datetime), // 🔧 수정
//         description: scheduleData.description || '',
//       };
      
//       // end_datetime 처리
//       if (scheduleData.end_datetime && scheduleData.end_datetime !== '') {
//         cleanData.end_datetime = formatDateTimeForServer(scheduleData.end_datetime); // 🔧 수정
//       }
      
//       console.log('🕐 Server로 보낼 데이터 (KST):', cleanData);
      
//       const response = await api.post('/schedules/personal/', cleanData);
//       console.log('🕐 Server 응답:', response.data);
      
//       return response.data;
//     } catch (error) {
//       console.error('Error creating personal schedule:', error);
      
//       if (error.response) {
//         console.error('Server Error Details:');
//         console.error('Status:', error.response.status);
//         console.error('Data:', error.response.data);
        
//         if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
//           console.error('Server returned HTML error page - check Django server logs');
//         }
//       }
      
//       throw error;
//     }
//   },

//   // 🔧 개인 일정 수정 - 시간 처리 수정
//   updatePersonalSchedule: async (id, scheduleData) => {
//     try {
//       console.log('🕐 Updating personal schedule:', id, scheduleData);
      
//       // timeUtils를 사용하여 올바른 시간 변환
//       const cleanData = {
//         title: scheduleData.title,
//         datetime: formatDateTimeForServer(scheduleData.datetime), // 🔧 수정
//         description: scheduleData.description || '',
//       };
      
//       // end_datetime 처리
//       if (scheduleData.end_datetime && scheduleData.end_datetime !== '') {
//         cleanData.end_datetime = formatDateTimeForServer(scheduleData.end_datetime); // 🔧 수정
//       }
      
//       console.log('🕐 Update data (KST):', cleanData);
      
//       const response = await api.put(`/schedules/personal/${id}/`, cleanData);
//       return response.data;
//     } catch (error) {
//       console.error('Error updating personal schedule:', error);
//       throw error;
//     }
//   },

//   // 개인 일정 삭제
//   deletePersonalSchedule: async (id) => {
//     try {
//       console.log('Deleting personal schedule:', id);
//       await api.delete(`/schedules/personal/${id}/`);
//     } catch (error) {
//       console.error('Error deleting personal schedule:', error);
//       throw error;
//     }
//   },

//   // 특정 날짜의 모든 일정 조회
//   getSchedulesByDate: async (dateString) => {
//     try {
//       console.log('Getting schedules for date:', dateString);
      
//       const response = await api.get(`/schedules/personal/date/${dateString}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error getting schedules by date:', error);
      
//       return {
//         date: dateString,
//         common_schedules: [],
//         ris_schedules: [],
//         personal_schedules: []
//       };
//     }
//   },

//   // 월별 일정 요약 조회
//   getMonthSchedulesSummary: async (year, month) => {
//     try {
//       console.log('Getting month schedules summary:', year, month);
      
//       const response = await api.get(`/schedules/personal/month/${year}/${month}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error getting month schedules summary:', error);
      
//       return {
//         year: year,
//         month: month,
//         schedules: {}
//       };
//     }
//   },

//   // 오늘의 모든 일정 조회
//   getTodaySchedules: async () => {
//     try {
//       console.log('Getting today schedules');
//       const today = getTodayKST();
//       return await scheduleService.getSchedulesByDate(today);
//     } catch (error) {
//       console.error('Error getting today schedules:', error);
//       return {
//         common_schedules: [],
//         ris_schedules: [],
//         personal_schedules: []
//       };
//     }
//   },

//   // 검사실 스케줄 조회
//   getRoomSchedules: async (date = null, rooms = null) => {
//     try {
//       console.log('Getting room schedules for date:', date, 'rooms:', rooms);
      
//       let url = '/schedules/room-schedules/';
//       const params = new URLSearchParams();
      
//       if (date) params.append('date', date);
//       if (rooms && rooms.length > 0) params.append('rooms', rooms.join(','));
      
//       if (params.toString()) url += '?' + params.toString();
      
//       const response = await api.get(url);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching room schedules:', error);
      
//       return {
//         date: date || getTodayKST(),
//         room_schedules: {},
//         total_count: 0
//       };
//     }
//   },

//   // 검사실 스케줄 요약
//   getRoomSchedulesSummary: async (date = null) => {
//     try {
//       console.log('Getting room schedules summary for date:', date);
      
//       let url = '/schedules/room-schedules-summary/';
//       if (date) url += `?date=${date}`;
      
//       const response = await api.get(url);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching room schedules summary:', error);
      
//       return {
//         date: date || getTodayKST(),
//         room_statistics: []
//       };
//     }
//   },

//   // 검사실 목록 조회
//   getExamRooms: async () => {
//     try {
//       const response = await api.get('/rooms/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching exam rooms:', error);
//       throw error;
//     }
//   },

//   // 활성화된 검사실만 조회
//   getActiveExamRooms: async () => {
//     try {
//       const response = await api.get('/rooms/active_rooms/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching active exam rooms:', error);
//       throw error;
//     }
//   }
// };

// // 개발환경에서 전역 노출
// if (process.env.NODE_ENV === 'development') {
//   window.scheduleService = scheduleService;
//   console.log('🔧 scheduleService가 window.scheduleService로 노출됨');
// }

// /home/medical_system/pacsapp/src/services/scheduleService.js

// /home/medical_system/pacsapp/src/services/scheduleService.js

import axios from 'axios';
import { getTodayKST, formatDateTimeForServer } from '../utils/timeUtils';

const API_BASE_URL = 'http://35.225.63.41:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export const scheduleService = {
  getTodayKST,

  // 전체 일정 조회
  getCommonSchedules: async () => {
    try {
      const response = await api.get('/schedules/common/');
      return response.data;
    } catch (error) {
      console.error('Error fetching common schedules:', error);
      throw error;
    }
  },

  // 부서 일정 조회
  getRISSchedules: async () => {
    try {
      const response = await api.get('/schedules/ris/');
      return response.data;
    } catch (error) {
      console.error('Error fetching RIS schedules:', error);
      throw error;
    }
  },

  // 개인 일정 조회
  getPersonalSchedules: async () => {
    try {
      const response = await api.get('/schedules/personal/my_schedules/');
      return response.data;
    } catch (error) {
      console.error('Error fetching personal schedules:', error);
      throw error;
    }
  },

  // 오늘 개인 일정 조회
  getTodayPersonalSchedules: async () => {
    try {
      const response = await api.get('/schedules/personal/today_schedules/');
      return response.data;
    } catch (error) {
      console.error('Error fetching today personal schedules:', error);
      throw error;
    }
  },

  // 🔧 개인 일정 생성 - 시간 처리 수정
  createPersonalSchedule: async (scheduleData) => {
    try {
      console.log('🕐 Creating personal schedule (원본):', scheduleData);
      
      // timeUtils를 사용하여 올바른 시간 변환
      const cleanData = {
        title: scheduleData.title,
        datetime: formatDateTimeForServer(scheduleData.datetime), // 🔧 수정
        description: scheduleData.description || '',
      };
      
      // end_datetime 처리
      if (scheduleData.end_datetime && scheduleData.end_datetime !== '') {
        cleanData.end_datetime = formatDateTimeForServer(scheduleData.end_datetime); // 🔧 수정
      }
      
      console.log('🕐 Server로 보낼 데이터 (KST):', cleanData);
      
      const response = await api.post('/schedules/personal/', cleanData);
      console.log('🕐 Server 응답:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating personal schedule:', error);
      
      if (error.response) {
        console.error('Server Error Details:');
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        
        if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
          console.error('Server returned HTML error page - check Django server logs');
        }
      }
      
      throw error;
    }
  },

  // 🔧 개인 일정 수정 - 시간 처리 수정
  updatePersonalSchedule: async (id, scheduleData) => {
    try {
      console.log('🕐 Updating personal schedule:', id, scheduleData);
      
      // timeUtils를 사용하여 올바른 시간 변환
      const cleanData = {
        title: scheduleData.title,
        datetime: formatDateTimeForServer(scheduleData.datetime), // 🔧 수정
        description: scheduleData.description || '',
      };
      
      // end_datetime 처리
      if (scheduleData.end_datetime && scheduleData.end_datetime !== '') {
        cleanData.end_datetime = formatDateTimeForServer(scheduleData.end_datetime); // 🔧 수정
      }
      
      console.log('🕐 Update data (KST):', cleanData);
      
      const response = await api.put(`/schedules/personal/${id}/`, cleanData);
      return response.data;
    } catch (error) {
      console.error('Error updating personal schedule:', error);
      throw error;
    }
  },

  // 개인 일정 삭제
  deletePersonalSchedule: async (id) => {
    try {
      console.log('Deleting personal schedule:', id);
      await api.delete(`/schedules/personal/${id}/`);
    } catch (error) {
      console.error('Error deleting personal schedule:', error);
      throw error;
    }
  },

  // 🔧 특정 날짜의 모든 일정 조회 (통합 API 사용)
  getSchedulesByDate: async (dateString) => {
    try {
      console.log('🔍 Getting ALL schedules for date:', dateString);
      
      // 🔧 새로운 통합 API 호출
      const response = await api.get(`/schedules/all/date/${dateString}/`);
      
      console.log(`📋 API Response for ${dateString}:`, response.data);
      
      // 🔧 원본 형식 그대로 반환 (객체 형식 유지)
      return response.data;
      
    } catch (error) {
      console.error('❌ Error fetching schedules for date:', error);
      return {
        date: dateString,
        common_schedules: [],
        ris_schedules: [],
        personal_schedules: []
      };
    }
  },

  // 🔧 월별 모든 일정 요약 조회 (통합 API 사용)
  getMonthSchedulesSummary: async (year, month) => {
    try {
      console.log('🔍 Getting ALL month schedules summary for:', year, month);
      
      // 🔧 새로운 통합 API 호출
      const response = await api.get(`/schedules/all/month/${year}/${month}/`);
      
      console.log(`📊 Month summary for ${year}-${month}:`, response.data);
      
      // 🔧 원본 형식 그대로 반환
      return response.data;
      
    } catch (error) {
      console.error('❌ Error fetching month schedules summary:', error);
      return {
        year: year,
        month: month,
        schedules: {}
      };
    }
  },

  // 🔧 개인 일정만 조회하는 새로운 함수 추가
  getPersonalSchedulesByDate: async (dateString) => {
    try {
      console.log('Getting personal schedules for date:', dateString);
      
      const response = await api.get(`/schedules/personal/date/${dateString}/`);
      return response.data.personal_schedules || [];
    } catch (error) {
      console.error('Error getting personal schedules by date:', error);
      return [];
    }
  },

  // 🔧 개인 일정 월별 요약만 조회하는 새로운 함수 추가
  getPersonalMonthSchedulesSummary: async (year, month) => {
    try {
      console.log('Getting personal month schedules summary:', year, month);
      
      const response = await api.get(`/schedules/personal/month/${year}/${month}/`);
      return response.data.schedules || {};
    } catch (error) {
      console.error('Error getting personal month schedules summary:', error);
      return {};
    }
  },

  // 오늘의 모든 일정 조회
  getTodaySchedules: async () => {
    try {
      console.log('Getting today schedules');
      const today = getTodayKST();
      const schedules = await scheduleService.getSchedulesByDate(today);
      
      // 객체 형식에서 배열로 변환해서 반환
      const allSchedules = [
        ...(schedules.common_schedules || []).map(s => ({...s, type: 'common', category: '부서'})),
        ...(schedules.ris_schedules || []).map(s => ({...s, type: 'ris', category: 'RIS'})),
        ...(schedules.personal_schedules || []).map(s => ({...s, type: 'personal', category: '개인'}))
      ];
      
      return allSchedules;
    } catch (error) {
      console.error('Error getting today schedules:', error);
      return [];
    }
  },

  // 검사실 스케줄 조회
  getRoomSchedules: async (date = null, rooms = null) => {
    try {
      console.log('Getting room schedules for date:', date, 'rooms:', rooms);
      
      let url = '/schedules/room-schedules/';
      const params = new URLSearchParams();
      
      if (date) params.append('date', date);
      if (rooms && rooms.length > 0) params.append('rooms', rooms.join(','));
      
      if (params.toString()) url += '?' + params.toString();
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching room schedules:', error);
      
      return {
        date: date || getTodayKST(),
        room_schedules: {},
        total_count: 0
      };
    }
  },

  // 검사실 스케줄 요약
  getRoomSchedulesSummary: async (date = null) => {
    try {
      console.log('Getting room schedules summary for date:', date);
      
      let url = '/schedules/room-schedules-summary/';
      if (date) url += `?date=${date}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching room schedules summary:', error);
      
      return {
        date: date || getTodayKST(),
        room_statistics: []
      };
    }
  },

  // 검사실 목록 조회
  getExamRooms: async () => {
    try {
      const response = await api.get('/rooms/');
      return response.data;
    } catch (error) {
      console.error('Error fetching exam rooms:', error);
      throw error;
    }
  },

  // 활성화된 검사실만 조회
  getActiveExamRooms: async () => {
    try {
      const response = await api.get('/rooms/active_rooms/');
      return response.data;
    } catch (error) {
      console.error('Error fetching active exam rooms:', error);
      throw error;
    }
  }
};

// 개발환경에서 전역 노출
if (process.env.NODE_ENV === 'development') {
  window.scheduleService = scheduleService;
  console.log('🔧 scheduleService가 window.scheduleService로 노출됨');
}