// contexts/DoctorContext.js
// 🆕 통계 API 추가된 최종 버전

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';
import { scheduleService } from '../services/scheduleService';

const DoctorContext = createContext();

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};

export const DoctorProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 일정 관련 상태들
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // 🆕 통계 관련 상태들
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  useEffect(() => {
    // 일정 새로고침 트리거 변경 시 오늘 일정 재조회
    if (doctor) {
      fetchTodaySchedules();
    }
  }, [scheduleRefreshTrigger, doctor]);

  // 🆕 의사 정보 로드 후 통계도 함께 조회
  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const doctorData = await doctorService.getCurrentUser();
      setDoctor(doctorData);
      
      // 의사 정보 로드 후 오늘 일정과 통계 조회
      await Promise.all([
        fetchTodaySchedules(),
        fetchDashboardStats(doctorData.name) // 🆕 통계 조회 추가
      ]);
    } catch (err) {
      console.error('❌ 의사 정보 로딩 실패:', err);
      console.error('에러 응답 상태:', err?.response?.status);
      setError('의사 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 판독의별 대시보드 통계 조회
  const fetchDashboardStats = async (doctorName = null) => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      // 의사 이름이 없으면 현재 doctor 상태에서 가져오거나 디폴트 사용
      const targetDoctorName = doctorName || doctor?.name || '심보람';
      
      console.log('📊 통계 조회 시작:', targetDoctorName);
      
      // API URL 생성 및 로깅 (절대 URL 사용)
      const apiUrl = `http://35.225.63.41:8000/api/worklists/doctor-stats/?doctor_name=${encodeURIComponent(targetDoctorName)}`;
      console.log('🔗 API URL:', apiUrl);
      
      // API 호출
      const response = await fetch(apiUrl);
      
      console.log('📡 응답 상태:', response.status);
      console.log('📡 응답 헤더:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ 에러 응답 내용:', errorText);
        throw new Error(`통계 API 호출 실패: ${response.status} - ${errorText}`);
      }
      
      const statsData = await response.json();
      
      console.log('✅ 통계 조회 성공:', statsData);
      
      setDashboardStats(statsData);
      return statsData;
      
    } catch (err) {
      console.error('❌ 통계 조회 실패:', err);
      setStatsError(`통계 데이터를 불러올 수 없습니다: ${err.message}`);
      
      // 에러 시 기본값 설정
      setDashboardStats({
        status: 'error',
        stats: {
          today_total: 0,
          exam_completed: 0,
          exam_total: 0,
          report_completed: 0,
          report_total: 0
        },
        display: {
          today_total_display: '0',
          exam_status_display: '0/0',
          report_status_display: '0/0'
        }
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // 🆕 통계 새로고침 함수
  const refreshDashboardStats = () => {
    console.log('🔄 통계 새로고침');
    fetchDashboardStats();
  };

  const fetchTodaySchedules = async () => {
    try {
      setSchedulesLoading(true);
      
      console.log('🕐 DoctorContext: 오늘 일정 조회 시작');
      
      const today = scheduleService.getTodayKST();
      console.log('🕐 KST 기준 오늘 날짜:', today);
      
      const todayData = await scheduleService.getSchedulesByDate(today);
      const personalSchedules = todayData.personal_schedules || [];
      
      console.log('✅ 오늘 일정 조회 성공:', personalSchedules);
      console.log(`📊 조회된 일정 수: ${personalSchedules.length}개`);
      
      setTodaySchedules(personalSchedules);
      
      try {
        const serverTodaySchedules = await scheduleService.getTodayPersonalSchedules();
        console.log('🔍 서버 today_schedules 비교:', serverTodaySchedules);
        console.log(`📊 서버 today_schedules 수: ${serverTodaySchedules.length}개`);
      } catch (serverError) {
        console.log('🔍 서버 today_schedules 조회 실패:', serverError);
      }
      
    } catch (err) {
      console.error('❌ 오늘 일정 조회 실패:', err);
      console.error('  에러 상세:', {
        message: err.message,
        status: err.response?.status,
        url: err.config?.url
      });
      
      setTodaySchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const updateDoctorStatus = async (newStatus) => {
    try {
      const updatedDoctor = await doctorService.updateStatus(newStatus);
      setDoctor(prev => ({ ...prev, status: updatedDoctor.status }));
      return updatedDoctor;
    } catch (err) {
      throw err;
    }
  };

  const refreshSchedules = () => {
    console.log('🔄 일정 새로고침 트리거');
    setScheduleRefreshTrigger(prev => prev + 1);
  };

  const createPersonalSchedule = async (scheduleData) => {
    try {
      console.log('📅 개인일정 생성 시작:', scheduleData);
      
      const newSchedule = await scheduleService.createPersonalSchedule(scheduleData);
      
      console.log('✅ 개인일정 생성 성공:', newSchedule);
      console.log('🔄 오늘 일정 새로고침 시작');
      
      refreshSchedules();
      
      return newSchedule;
    } catch (err) {
      console.error('❌ 개인일정 생성 실패:', err);
      throw err;
    }
  };

  const updatePersonalSchedule = async (scheduleId, scheduleData) => {
    try {
      console.log('📅 개인일정 수정 시작:', scheduleId, scheduleData);
      
      const updatedSchedule = await scheduleService.updatePersonalSchedule(scheduleId, scheduleData);
      
      console.log('✅ 개인일정 수정 성공:', updatedSchedule);
      refreshSchedules();
      
      return updatedSchedule;
    } catch (err) {
      console.error('❌ 개인일정 수정 실패:', err);
      throw err;
    }
  };

  const deletePersonalSchedule = async (scheduleId) => {
    try {
      console.log('📅 개인일정 삭제 시작:', scheduleId);
      
      await scheduleService.deletePersonalSchedule(scheduleId);
      
      console.log('✅ 개인일정 삭제 성공');
      refreshSchedules();
      
    } catch (err) {
      console.error('❌ 개인일정 삭제 실패:', err);
      throw err;
    }
  };

  const getSchedulesByDate = async (date) => {
    try {
      console.log('📅 날짜별 일정 조회:', date);
      
      const schedules = await scheduleService.getSchedulesByDate(date);
      
      console.log('✅ 날짜별 일정 조회 성공:', schedules);
      return schedules;
    } catch (err) {
      console.error('❌ 날짜별 일정 조회 실패:', err);
      throw err;
    }
  };

  const getMonthSchedulesSummary = async (year, month) => {
    try {
      console.log('📅 월별 일정 요약 조회:', year, month);
      
      const summary = await scheduleService.getMonthSchedulesSummary(year, month);
      
      console.log('✅ 월별 일정 요약 조회 성공:', summary);
      return summary;
    } catch (err) {
      console.error('❌ 월별 일정 요약 조회 실패:', err);
      throw err;
    }
  };

  const debugScheduleData = () => {
    console.log('🔍 DoctorContext 디버깅 정보:');
    console.log('  현재 의사:', doctor);
    console.log('  오늘 일정:', todaySchedules);
    console.log('  일정 로딩 상태:', schedulesLoading);
    console.log('  새로고침 트리거:', scheduleRefreshTrigger);
    console.log('  KST 오늘 날짜:', scheduleService.getTodayKST());
    console.log('  📊 대시보드 통계:', dashboardStats);
    console.log('  📊 통계 로딩 상태:', statsLoading);
    
    return {
      doctor,
      todaySchedules,
      schedulesLoading,
      scheduleRefreshTrigger,
      kstToday: scheduleService.getTodayKST(),
      dashboardStats,
      statsLoading
    };
  };
  
  const value = {
    // 기존 값들
    doctor,
    loading,
    error,
    updateDoctorStatus,
    
    // 일정 관련 값들
    todaySchedules,
    schedulesLoading,
    refreshSchedules,
    
    // 🆕 통계 관련 값들 추가
    dashboardStats,
    statsLoading,
    statsError,
    refreshDashboardStats,
    
    // 일정 CRUD 함수들
    createPersonalSchedule,
    updatePersonalSchedule,
    deletePersonalSchedule,
    getSchedulesByDate,
    getMonthSchedulesSummary,
    
    // 디버깅용 함수
    debugScheduleData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {children}
    </DoctorContext.Provider>
  );
};