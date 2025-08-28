import axios from 'axios';

const API_BASE_URL = 'http://35.225.63.41:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const roomService = {
  // 검사실 목록 조회
  getRooms: async () => {
    try {
      const response = await api.get('/rooms/');
      // 🔥 DRF 페이지네이션 대응
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  // 활성화된 검사실만 조회
  getActiveRooms: async () => {
    try {
      const response = await api.get('/rooms/active_rooms/');
      // 🔥 DRF 페이지네이션 대응
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      throw error;
    }
  },
};