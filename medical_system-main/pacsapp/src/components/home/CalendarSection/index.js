// // // components/home/CalendarSection/index.js - 시간 표시 수정

// // import React, { useState, useEffect } from 'react';
// // import { useDoctor } from '../../../contexts/DoctorContext';
// // import { scheduleService } from '../../../services/scheduleService';
// // import { formatServerTimeToKST, extractTimeFromDateTime } from '../../../utils/timeUtils'; // 🔧 추가
// // import './CalendarSection.css';

// // const CalendarSection = () => {
// //   const [selectedDate, setSelectedDate] = useState(new Date());
// //   const [scheduleView, setScheduleView] = useState('전체일정');
// //   const [selectedDateSchedules, setSelectedDateSchedules] = useState(null);
// //   const [monthSchedules, setMonthSchedules] = useState({});
// //   const [loading, setLoading] = useState(false);
// //   const [selectedDay, setSelectedDay] = useState(null);

// //   const { 
// //     createPersonalSchedule, 
// //     updatePersonalSchedule, 
// //     deletePersonalSchedule,
// //     getSchedulesByDate,
// //     getMonthSchedulesSummary 
// //   } = useDoctor();

// //   // 월이 바뀔 때마다 월별 일정 요약 로드
// //   useEffect(() => {
// //     loadMonthSchedules();
// //   }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

// //   // 월별 일정 요약 로드
// //   const loadMonthSchedules = async () => {
// //     try {
// //       const year = selectedDate.getFullYear();
// //       const month = selectedDate.getMonth() + 1;
      
// //       console.log('📅 Loading month schedules for:', year, month);
      
// //       let summary;
// //       if (getMonthSchedulesSummary) {
// //         summary = await getMonthSchedulesSummary(year, month);
// //       } else {
// //         summary = await scheduleService.getMonthSchedulesSummary(year, month);
// //       }
      
// //       console.log('📅 Month summary response:', summary);
// //       setMonthSchedules(summary.schedules || {});
// //     } catch (err) {
// //       console.error('월별 일정 로드 실패:', err);
// //       setMonthSchedules({});
// //     }
// //   };

// //   // 날짜 클릭 핸들러
// //   const handleDateClick = async (day) => {
// //     if (!day) return;
    
// //     setSelectedDay(day);
// //     setLoading(true);
    
// //     try {
// //       const clickedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
// //       const dateString = clickedDate.toISOString().split('T')[0];
      
// //       console.log('🗓️ Clicked date:', dateString);
      
// //       let schedules;
// //       if (getSchedulesByDate) {
// //         schedules = await getSchedulesByDate(dateString);
// //       } else {
// //         schedules = await scheduleService.getSchedulesByDate(dateString);
// //       }
      
// //       console.log('📋 API Response:', schedules);
// //       console.log('📋 Common schedules:', schedules.common_schedules?.length || 0);
// //       console.log('📋 RIS schedules:', schedules.ris_schedules?.length || 0);
// //       console.log('📋 Personal schedules:', schedules.personal_schedules?.length || 0);
      
// //       setSelectedDateSchedules(schedules);
// //     } catch (err) {
// //       console.error('날짜별 일정 로드 실패:', err);
// //       alert('일정을 불러오는데 실패했습니다.');
// //       setSelectedDateSchedules({
// //         common_schedules: [],
// //         ris_schedules: [],
// //         personal_schedules: []
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const getDaysInMonth = (date) => {
// //     const year = date.getFullYear();
// //     const month = date.getMonth();
// //     const firstDay = new Date(year, month, 1);
// //     const lastDay = new Date(year, month + 1, 0);
// //     const daysInMonth = lastDay.getDate();
// //     const startingDayOfWeek = firstDay.getDay();

// //     const days = [];
    
// //     // 이전 달의 빈 칸들
// //     for (let i = 0; i < startingDayOfWeek; i++) {
// //       days.push(null);
// //     }
    
// //     // 현재 달의 날짜들
// //     for (let day = 1; day <= daysInMonth; day++) {
// //       days.push(day);
// //     }
    
// //     return days;
// //   };

// //   // 날짜에 일정이 있는지 확인
// //   const hasScheduleOnDate = (day) => {
// //     const hasSchedule = monthSchedules[day]?.total > 0;
// //     if (hasSchedule) {
// //       console.log(`📅 Day ${day} has schedules:`, monthSchedules[day]);
// //     }
// //     return hasSchedule;
// //   };

// //   // 현재 탭에 맞는 일정들 필터링
// //   const getCurrentSchedules = () => {
// //     if (!selectedDateSchedules) return [];
    
// //     try {
// //       const allSchedules = [];
      
// //       switch (scheduleView) {
// //         case '전체일정':
// //           allSchedules.push(
// //             ...(selectedDateSchedules.common_schedules || []).map(s => ({...s, type: 'common'})),
// //             ...(selectedDateSchedules.ris_schedules || []).map(s => ({...s, type: 'ris'})),
// //             ...(selectedDateSchedules.personal_schedules || []).map(s => ({...s, type: 'personal'}))
// //           );
// //           break;
        
// //         case '부서일정':
// //           allSchedules.push(
// //             ...(selectedDateSchedules.common_schedules || []).map(s => ({...s, type: 'common'})),
// //             ...(selectedDateSchedules.ris_schedules || []).map(s => ({...s, type: 'ris'}))
// //           );
// //           break;
        
// //         case '개인일정':
// //           allSchedules.push(
// //             ...(selectedDateSchedules.personal_schedules || []).map(s => ({...s, type: 'personal'}))
// //           );
// //           break;
        
// //         default:
// //           break;
// //       }
      
// //       const sortedSchedules = allSchedules.sort((a, b) => {
// //         const aDate = new Date(a.datetime);
// //         const bDate = new Date(b.datetime);
// //         return aDate - bDate;
// //       });
      
// //       console.log(`📋 ${scheduleView} - Filtered schedules:`, sortedSchedules);
      
// //       return sortedSchedules;
// //     } catch (err) {
// //       console.error('일정 필터링 오류:', err);
// //       return [];
// //     }
// //   };

// //   // 일정 타입에 따른 스타일 클래스
// //   const getScheduleTypeClass = (type) => {
// //     switch (type) {
// //       case 'common': return 'schedule-common';
// //       case 'ris': return 'schedule-ris';
// //       case 'personal': return 'schedule-personal';
// //       default: return '';
// //     }
// //   };

// //   // 일정 타입 표시 텍스트
// //   const getScheduleTypeText = (type) => {
// //     switch (type) {
// //       case 'common': return '전체';
// //       case 'ris': return '부서';
// //       case 'personal': return '개인';
// //       default: return '';
// //     }
// //   };

// //   // 🔧 시간 표시 함수 개선
// //   const getDisplayTime = (schedule) => {
// //     // 1. time_display가 있으면 우선 사용
// //     if (schedule.time_display) {
// //       return schedule.time_display;
// //     }
    
// //     // 2. datetime이 있으면 KST로 변환하여 시간만 추출
// //     if (schedule.datetime) {
// //       return extractTimeFromDateTime(schedule.datetime);
// //     }
    
// //     // 3. 둘 다 없으면 기본값
// //     return '시간 미정';
// //   };

// //   // 개인일정 수정
// //   const handleEditPersonalSchedule = async (schedule) => {
// //     const newTitle = prompt('새 제목을 입력하세요:', schedule.title);
// //     if (newTitle && newTitle !== schedule.title) {
// //       try {
// //         if (updatePersonalSchedule) {
// //           await updatePersonalSchedule(schedule.id, { ...schedule, title: newTitle });
// //         } else {
// //           await scheduleService.updatePersonalSchedule(schedule.id, { ...schedule, title: newTitle });
// //         }
        
// //         // 현재 날짜 일정 다시 로드
// //         handleDateClick(selectedDay);
// //         // 월별 요약도 다시 로드
// //         loadMonthSchedules();
// //       } catch (err) {
// //         console.error('일정 수정 실패:', err);
// //         alert('일정 수정에 실패했습니다.');
// //       }
// //     }
// //   };

// //   // 개인일정 삭제
// //   const handleDeletePersonalSchedule = async (scheduleId) => {
// //     if (window.confirm('이 개인일정을 삭제하시겠습니까?')) {
// //       try {
// //         if (deletePersonalSchedule) {
// //           await deletePersonalSchedule(scheduleId);
// //         } else {
// //           await scheduleService.deletePersonalSchedule(scheduleId);
// //         }
        
// //         // 현재 날짜 일정 다시 로드
// //         handleDateClick(selectedDay);
// //         // 월별 요약도 다시 로드
// //         loadMonthSchedules();
// //       } catch (err) {
// //         console.error('일정 삭제 실패:', err);
// //         alert('일정 삭제에 실패했습니다.');
// //       }
// //     }
// //   };

// //   return (
// //     <div className="calendar-schedule-container">
// //       {/* 달력 섹션 */}
// //       <div className="calendar-grid-section">
// //         <div className="calendar-header">
// //           <h3>📅 달력</h3>
// //           <div className="calendar-nav">
// //             <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}>‹</button>
// //             <span>{selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월</span>
// //             <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}>›</button>
// //           </div>
// //         </div>
        
// //         <div className="calendar-grid">
// //           <div className="calendar-weekdays">
// //             {['일', '월', '화', '수', '목', '금', '토'].map(day => (
// //               <div key={day} className="weekday">{day}</div>
// //             ))}
// //           </div>
// //           <div className="calendar-days">
// //             {getDaysInMonth(selectedDate).map((day, index) => (
// //               <div 
// //                 key={index} 
// //                 className={`calendar-day ${day ? '' : 'empty'} ${hasScheduleOnDate(day) ? 'has-schedule' : ''} ${selectedDay === day ? 'selected' : ''}`}
// //                 onClick={() => handleDateClick(day)}
// //               >
// //                 {day && (
// //                   <>
// //                     <span className="day-number">{day}</span>
// //                     {hasScheduleOnDate(day) && (
// //                       <div className="schedule-dots">
// //                         {monthSchedules[day]?.common > 0 && <div className="dot dot-common"></div>}
// //                         {monthSchedules[day]?.ris > 0 && <div className="dot dot-ris"></div>}
// //                         {monthSchedules[day]?.personal > 0 && <div className="dot dot-personal"></div>}
// //                       </div>
// //                     )}
// //                   </>
// //                 )}
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* 일정 섹션 */}
// //       <div className="schedule-section">
// //         <div className="schedule-header">
// //           <h3>📋 일정 관리</h3>
// //           <div className="schedule-tabs">
// //             <button 
// //               className={`tab-btn ${scheduleView === '전체일정' ? 'active' : ''}`}
// //               onClick={() => setScheduleView('전체일정')}
// //             >
// //               전체일정
// //             </button>
// //             <button 
// //               className={`tab-btn ${scheduleView === '부서일정' ? 'active' : ''}`}
// //               onClick={() => setScheduleView('부서일정')}
// //             >
// //               부서일정
// //             </button>
// //             <button 
// //               className={`tab-btn ${scheduleView === '개인일정' ? 'active' : ''}`}
// //               onClick={() => setScheduleView('개인일정')}
// //             >
// //               개인일정
// //             </button>
// //           </div>
// //         </div>
        
// //         <div className="schedule-list-container">
// //           {loading ? (
// //             <div className="schedule-loading">일정을 불러오는 중...</div>
// //           ) : selectedDay ? (
// //             <div>
// //               <div className="selected-date-title">
// //                 {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDay}일 일정
// //               </div>
// //               {getCurrentSchedules().length > 0 ? (
// //                 getCurrentSchedules().map((schedule, index) => (
// //                   <div key={`${schedule.type}-${schedule.id}-${index}`} className={`schedule-list-item ${getScheduleTypeClass(schedule.type)}`}>
// //                     <div className="schedule-date-time">
// //                       <div className="schedule-type-badge">{getScheduleTypeText(schedule.type)}</div>
// //                       <div className="schedule-time">
// //                         {getDisplayTime(schedule)} {/* 🔧 개선된 시간 표시 함수 사용 */}
// //                       </div>
// //                     </div>
// //                     <div className="schedule-details">
// //                       <div className="schedule-title">{schedule.title || '제목 없음'}</div>
// //                       {schedule.description && (
// //                         <div className="schedule-description">{schedule.description}</div>
// //                       )}
// //                     </div>
// //                     {schedule.type === 'personal' && (
// //                       <div className="schedule-actions">
// //                         <button 
// //                           onClick={() => handleEditPersonalSchedule(schedule)}
// //                           className="edit-btn"
// //                           title="수정"
// //                         >
// //                           ✏️
// //                         </button>
// //                         <button 
// //                           onClick={() => handleDeletePersonalSchedule(schedule.id)}
// //                           className="delete-btn"
// //                           title="삭제"
// //                         >
// //                           🗑️
// //                         </button>
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))
// //               ) : (
// //                 <div className="no-schedules">
// //                   선택한 날짜에 {scheduleView}이 없습니다.
// //                 </div>
// //               )}
// //             </div>
// //           ) : (
// //             <div className="select-date-message">
// //               달력에서 날짜를 선택하여 일정을 확인하세요.
// //             </div>
// //           )}
// //         </div>
// //       </div>
      
// //       {/* 🔧 개발 모드에서 시간 디버깅 정보 표시 */}
// //       {process.env.NODE_ENV === 'development' && selectedDateSchedules && (
// //         <div style={{
// //           position: 'fixed',
// //           bottom: '10px',
// //           right: '10px',
// //           background: 'rgba(0,0,0,0.8)',
// //           color: 'white',
// //           padding: '0.5rem',
// //           borderRadius: '0.25rem',
// //           fontSize: '0.75rem',
// //           maxWidth: '300px',
// //           zIndex: 1000
// //         }}>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default CalendarSection;

// // components/home/CalendarSection/index.js - 일정 표시 수정

// // components/home/CalendarSection/index.js - 디버깅 추가된 버전

// import React, { useState, useEffect } from 'react';
// import { useDoctor } from '../../../contexts/DoctorContext';
// import { scheduleService } from '../../../services/scheduleService';
// import { formatServerTimeToKST, extractTimeFromDateTime } from '../../../utils/timeUtils';
// import './CalendarSection.css';

// const CalendarSection = () => {
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [scheduleView, setScheduleView] = useState('전체일정');
//   const [selectedDateSchedules, setSelectedDateSchedules] = useState(null);
//   const [monthSchedules, setMonthSchedules] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const { 
//     createPersonalSchedule, 
//     updatePersonalSchedule, 
//     deletePersonalSchedule,
//     getSchedulesByDate,
//     getMonthSchedulesSummary 
//   } = useDoctor();

//   // 월이 바뀔 때마다 월별 일정 요약 로드
//   useEffect(() => {
//     loadMonthSchedules();
//   }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

//   // 월별 일정 요약 로드
//   const loadMonthSchedules = async () => {
//     try {
//       const year = selectedDate.getFullYear();
//       const month = selectedDate.getMonth() + 1;
      
//       console.log('📅 Loading month schedules for:', year, month);
      
//       let summary;
//       if (getMonthSchedulesSummary) {
//         summary = await getMonthSchedulesSummary(year, month);
//       } else {
//         summary = await scheduleService.getMonthSchedulesSummary(year, month);
//       }
      
//       console.log('📅 Month summary response:', summary);
//       console.log('📅 Raw schedules data:', summary.schedules || summary);
      
//       // 데이터 정규화 - 다양한 형식 지원
//       const scheduleData = summary.schedules || summary.data || summary || {};
//       console.log('📅 Processed schedule data:', scheduleData);
//       console.log('📅 Keys in schedule data:', Object.keys(scheduleData));
      
//       setMonthSchedules(scheduleData);
//     } catch (err) {
//       console.error('월별 일정 로드 실패:', err);
//       setMonthSchedules({});
//     }
//   };

//   // 🔧 날짜 클릭 핸들러 - 날짜 계산 수정
//   const handleDateClick = async (day) => {
//     if (!day) return;
    
//     setSelectedDay(day);
//     setLoading(true);
    
//     try {
//       // 🔧 정확한 날짜 문자열 생성 (시간대 문제 해결)
//       const year = selectedDate.getFullYear();
//       const month = selectedDate.getMonth() + 1; // 0-11 → 1-12
//       const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
//       console.log('🗓️ Clicked day:', day);
//       console.log('🗓️ Current selectedDate:', selectedDate);
//       console.log('🗓️ Generated dateString:', dateString);
      
//       let schedules;
//       if (getSchedulesByDate) {
//         schedules = await getSchedulesByDate(dateString);
//       } else {
//         schedules = await scheduleService.getSchedulesByDate(dateString);
//       }
      
//       console.log('📋 API Response:', schedules);
//       console.log('📋 Common schedules:', schedules.common_schedules?.length || 0);
//       console.log('📋 RIS schedules:', schedules.ris_schedules?.length || 0);
//       console.log('📋 Personal schedules:', schedules.personal_schedules?.length || 0);
      
//       // 🔧 추가 디버깅
//       console.log('🔍 Debug - Full schedules object:', schedules);
//       console.log('🔍 Debug - ris_schedules content:', schedules.ris_schedules);
//       console.log('🔍 Debug - common_schedules content:', schedules.common_schedules);
//       console.log('🔍 Debug - personal_schedules content:', schedules.personal_schedules);
      
//       setSelectedDateSchedules(schedules);
      
//     } catch (err) {
//       console.error('날짜별 일정 로드 실패:', err);
//       alert('일정을 불러오는데 실패했습니다.');
//       setSelectedDateSchedules({
//         common_schedules: [],
//         ris_schedules: [],
//         personal_schedules: []
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getDaysInMonth = (date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const daysInMonth = lastDay.getDate();
//     const startingDayOfWeek = firstDay.getDay();

//     const days = [];
    
//     // 이전 달의 빈 칸들
//     for (let i = 0; i < startingDayOfWeek; i++) {
//       days.push(null);
//     }
    
//     // 현재 달의 날짜들
//     for (let day = 1; day <= daysInMonth; day++) {
//       days.push(day);
//     }
    
//     return days;
//   };

//   // 날짜에 일정이 있는지 확인 - 개선된 버전
//   const hasScheduleOnDate = (day) => {
//     if (!day || !monthSchedules) {
//       return false;
//     }
    
//     // 다양한 키 형식 시도
//     const possibleKeys = [
//       day,                           // 1, 2, 3...
//       day.toString(),                // "1", "2", "3"...
//       day.toString().padStart(2, '0'), // "01", "02", "03"...
//       `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` // "2025-06-01"
//     ];
    
//     for (const key of possibleKeys) {
//       const dayData = monthSchedules[key];
      
//       if (dayData) {
//         console.log(`📅 Found data for day ${day} with key "${key}":`, dayData);
        
//         // total 속성이 있는 경우
//         if (dayData.total !== undefined) {
//           return dayData.total > 0;
//         }
        
//         // 개별 카운트가 있는 경우
//         if (dayData.common !== undefined || dayData.ris !== undefined || dayData.personal !== undefined) {
//           const total = (dayData.common || 0) + (dayData.ris || 0) + (dayData.personal || 0);
//           return total > 0;
//         }
        
//         // 배열인 경우
//         if (Array.isArray(dayData)) {
//           return dayData.length > 0;
//         }
        
//         // 객체가 비어있지 않은 경우
//         if (typeof dayData === 'object' && Object.keys(dayData).length > 0) {
//           return true;
//         }
        
//         // 숫자나 불린값인 경우
//         if (typeof dayData === 'number') {
//           return dayData > 0;
//         }
        
//         if (typeof dayData === 'boolean') {
//           return dayData;
//         }
//       }
//     }
    
//     return false;
//   };

//   // 현재 탭에 맞는 일정들 필터링 - 강화된 디버깅
//   const getCurrentSchedules = () => {
//     console.log('🔍 getCurrentSchedules 시작');
//     console.log('🔍 selectedDateSchedules:', selectedDateSchedules);
//     console.log('🔍 scheduleView:', scheduleView);
    
//     if (!selectedDateSchedules) {
//       console.log('🔍 selectedDateSchedules가 null/undefined');
//       return [];
//     }
    
//     try {
//       const allSchedules = [];
      
//       console.log('🔍 Switch case:', scheduleView);
//       console.log('🔍 common_schedules 배열:', selectedDateSchedules.common_schedules);
//       console.log('🔍 ris_schedules 배열:', selectedDateSchedules.ris_schedules);
//       console.log('🔍 personal_schedules 배열:', selectedDateSchedules.personal_schedules);
      
//       switch (scheduleView) {
//         case '전체일정':
//           console.log('🔍 전체일정 케이스');
//           if (selectedDateSchedules.common_schedules) {
//             const commonWithType = selectedDateSchedules.common_schedules.map(s => ({...s, type: 'common'}));
//             console.log('🔍 Common schedules with type:', commonWithType);
//             allSchedules.push(...commonWithType);
//           }
//           if (selectedDateSchedules.ris_schedules) {
//             const risWithType = selectedDateSchedules.ris_schedules.map(s => ({...s, type: 'ris'}));
//             console.log('🔍 RIS schedules with type:', risWithType);
//             allSchedules.push(...risWithType);
//           }
//           if (selectedDateSchedules.personal_schedules) {
//             const personalWithType = selectedDateSchedules.personal_schedules.map(s => ({...s, type: 'personal'}));
//             console.log('🔍 Personal schedules with type:', personalWithType);
//             allSchedules.push(...personalWithType);
//           }
//           break;
        
//         case '부서일정':
//           console.log('🔍 부서일정 케이스');
//           if (selectedDateSchedules.common_schedules) {
//             const commonWithType = selectedDateSchedules.common_schedules.map(s => ({...s, type: 'common'}));
//             console.log('🔍 Common schedules with type:', commonWithType);
//             allSchedules.push(...commonWithType);
//           }
//           if (selectedDateSchedules.ris_schedules) {
//             const risWithType = selectedDateSchedules.ris_schedules.map(s => ({...s, type: 'ris'}));
//             console.log('🔍 RIS schedules with type:', risWithType);
//             allSchedules.push(...risWithType);
//           }
//           break;
        
//         case '개인일정':
//           console.log('🔍 개인일정 케이스');
//           if (selectedDateSchedules.personal_schedules) {
//             const personalWithType = selectedDateSchedules.personal_schedules.map(s => ({...s, type: 'personal'}));
//             console.log('🔍 Personal schedules with type:', personalWithType);
//             allSchedules.push(...personalWithType);
//           }
//           break;
        
//         default:
//           console.log('🔍 Default 케이스');
//           break;
//       }
      
//       console.log('🔍 All schedules before sorting:', allSchedules);
      
//       const sortedSchedules = allSchedules.sort((a, b) => {
//         const aDate = new Date(a.datetime);
//         const bDate = new Date(b.datetime);
//         return aDate - bDate;
//       });
      
//       console.log(`📋 ${scheduleView} - Final filtered schedules:`, sortedSchedules);
      
//       return sortedSchedules;
//     } catch (err) {
//       console.error('일정 필터링 오류:', err);
//       console.error('Error stack:', err.stack);
//       return [];
//     }
//   };

//   // 일정 타입에 따른 스타일 클래스
//   const getScheduleTypeClass = (type) => {
//     switch (type) {
//       case 'common': return 'schedule-common';
//       case 'ris': return 'schedule-ris';
//       case 'personal': return 'schedule-personal';
//       default: return '';
//     }
//   };

//   // 일정 타입 표시 텍스트
//   const getScheduleTypeText = (type) => {
//     switch (type) {
//       case 'common': return '전체';
//       case 'ris': return '부서';
//       case 'personal': return '개인';
//       default: return '';
//     }
//   };

//   // 시간 표시 함수 개선
//   const getDisplayTime = (schedule) => {
//     // 1. time_display가 있으면 우선 사용
//     if (schedule.time_display) {
//       return schedule.time_display;
//     }
    
//     // 2. datetime이 있으면 KST로 변환하여 시간만 추출
//     if (schedule.datetime) {
//       return extractTimeFromDateTime(schedule.datetime);
//     }
    
//     // 3. 둘 다 없으면 기본값
//     return '시간 미정';
//   };

//   // 개인일정 수정
//   const handleEditPersonalSchedule = async (schedule) => {
//     const newTitle = prompt('새 제목을 입력하세요:', schedule.title);
//     if (newTitle && newTitle !== schedule.title) {
//       try {
//         if (updatePersonalSchedule) {
//           await updatePersonalSchedule(schedule.id, { ...schedule, title: newTitle });
//         } else {
//           await scheduleService.updatePersonalSchedule(schedule.id, { ...schedule, title: newTitle });
//         }
        
//         // 현재 날짜 일정 다시 로드
//         handleDateClick(selectedDay);
//         // 월별 요약도 다시 로드
//         loadMonthSchedules();
//       } catch (err) {
//         console.error('일정 수정 실패:', err);
//         alert('일정 수정에 실패했습니다.');
//       }
//     }
//   };

//   // 개인일정 삭제
//   const handleDeletePersonalSchedule = async (scheduleId) => {
//     if (window.confirm('이 개인일정을 삭제하시겠습니까?')) {
//       try {
//         if (deletePersonalSchedule) {
//           await deletePersonalSchedule(scheduleId);
//         } else {
//           await scheduleService.deletePersonalSchedule(scheduleId);
//         }
        
//         // 현재 날짜 일정 다시 로드
//         handleDateClick(selectedDay);
//         // 월별 요약도 다시 로드
//         loadMonthSchedules();
//       } catch (err) {
//         console.error('일정 삭제 실패:', err);
//         alert('일정 삭제에 실패했습니다.');
//       }
//     }
//   };

//   return (
//     <div className="calendar-schedule-container">
//       {/* 달력 섹션 */}
//       <div className="calendar-grid-section">
//         <div className="calendar-header">
//           <h3>📅 달력</h3>
//           <div className="calendar-nav">
//             <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}>‹</button>
//             <span>{selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월</span>
//             <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}>›</button>
//           </div>
//         </div>
        
//         <div className="calendar-grid">
//           <div className="calendar-weekdays">
//             {['일', '월', '화', '수', '목', '금', '토'].map(day => (
//               <div key={day} className="weekday">{day}</div>
//             ))}
//           </div>
//           <div className="calendar-days">
//             {getDaysInMonth(selectedDate).map((day, index) => {
//               const hasSchedule = hasScheduleOnDate(day);
              
//               // 개발 모드에서 디버깅 정보 출력
//               if (process.env.NODE_ENV === 'development' && day && hasSchedule) {
//                 console.log(`📅 Day ${day} marked as having schedule`);
//               }
              
//               return (
//                 <div 
//                   key={index} 
//                   className={`calendar-day ${day ? '' : 'empty'} ${hasSchedule ? 'has-schedule' : ''} ${selectedDay === day ? 'selected' : ''}`}
//                   onClick={() => handleDateClick(day)}
//                 >
//                   {day && (
//                     <>
//                       <span className="day-number">{day}</span>
//                       {hasSchedule && (
//                         <div className="schedule-dots">
//                           {monthSchedules[day]?.common > 0 && <div className="dot dot-common"></div>}
//                           {monthSchedules[day]?.ris > 0 && <div className="dot dot-ris"></div>}
//                           {monthSchedules[day]?.personal > 0 && <div className="dot dot-personal"></div>}
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* 일정 섹션 */}
//       <div className="schedule-section">
//         <div className="schedule-header">
//           <h3>📋 일정 관리</h3>
//           <div className="schedule-tabs">
//             <button 
//               className={`tab-btn ${scheduleView === '전체일정' ? 'active' : ''}`}
//               onClick={() => setScheduleView('전체일정')}
//             >
//               전체일정
//             </button>
//             <button 
//               className={`tab-btn ${scheduleView === '부서일정' ? 'active' : ''}`}
//               onClick={() => setScheduleView('부서일정')}
//             >
//               부서일정
//             </button>
//             <button 
//               className={`tab-btn ${scheduleView === '개인일정' ? 'active' : ''}`}
//               onClick={() => setScheduleView('개인일정')}
//             >
//               개인일정
//             </button>
//           </div>
//         </div>
        
//         <div className="schedule-list-container">
//           {loading ? (
//             <div className="schedule-loading">일정을 불러오는 중...</div>
//           ) : selectedDay ? (
//             <div>
//               <div className="selected-date-title">
//                 {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDay}일 일정
//               </div>
//               {getCurrentSchedules().length > 0 ? (
//                 getCurrentSchedules().map((schedule, index) => (
//                   <div key={`${schedule.type}-${schedule.id}-${index}`} className={`schedule-list-item ${getScheduleTypeClass(schedule.type)}`}>
//                     <div className="schedule-date-time">
//                       <div className="schedule-type-badge">{getScheduleTypeText(schedule.type)}</div>
//                       <div className="schedule-time">
//                         {getDisplayTime(schedule)}
//                       </div>
//                     </div>
//                     <div className="schedule-details">
//                       <div className="schedule-title">{schedule.title || '제목 없음'}</div>
//                       {schedule.description && (
//                         <div className="schedule-description">{schedule.description}</div>
//                       )}
//                     </div>
//                     {schedule.type === 'personal' && (
//                       <div className="schedule-actions">
//                         <button 
//                           onClick={() => handleEditPersonalSchedule(schedule)}
//                           className="edit-btn"
//                           title="수정"
//                         >
//                           ✏️
//                         </button>
//                         <button 
//                           onClick={() => handleDeletePersonalSchedule(schedule.id)}
//                           className="delete-btn"
//                           title="삭제"
//                         >
//                           🗑️
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 ))
//               ) : (
//                 <div className="no-schedules">
//                   선택한 날짜에 {scheduleView}이 없습니다.
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="select-date-message">
//               달력에서 날짜를 선택하여 일정을 확인하세요.
//             </div>
//           )}
//         </div>
//       </div>
      
//       {/* 개발 모드에서 디버깅 정보 표시 */}
//       {process.env.NODE_ENV === 'development' && (
//         <div style={{
//           position: 'fixed',
//           bottom: '10px',
//           right: '10px',
//           background: 'rgba(0,0,0,0.8)',
//           color: 'white',
//           padding: '0.5rem',
//           borderRadius: '0.25rem',
//           fontSize: '0.75rem',
//           maxWidth: '300px',
//           zIndex: 1000
//         }}>
//           <div>Month Schedules Keys: {Object.keys(monthSchedules).join(', ')}</div>
//           <div>Selected Date: {selectedDate.getFullYear()}-{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}</div>
//           <div>Selected Schedules: {selectedDateSchedules ? 'Object with ' + ((selectedDateSchedules.common_schedules?.length || 0) + (selectedDateSchedules.ris_schedules?.length || 0) + (selectedDateSchedules.personal_schedules?.length || 0)) + ' total' : 'None'}</div>
//           <div>Current View: {scheduleView}</div>
//           <div>Current Schedules: {getCurrentSchedules().length}</div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CalendarSection;


// components/home/CalendarSection/index.js - 클래스명 수정된 버전

import React, { useState, useEffect } from 'react';
import { useDoctor } from '../../../contexts/DoctorContext';
import { scheduleService } from '../../../services/scheduleService';
import { formatServerTimeToKST, extractTimeFromDateTime } from '../../../utils/timeUtils';
import './CalendarSection.css';

const CalendarSection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleView, setScheduleView] = useState('전체일정');
  const [selectedDateSchedules, setSelectedDateSchedules] = useState(null);
  const [monthSchedules, setMonthSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const { 
    createPersonalSchedule, 
    updatePersonalSchedule, 
    deletePersonalSchedule,
    getSchedulesByDate,
    getMonthSchedulesSummary 
  } = useDoctor();

  // 월이 바뀔 때마다 월별 일정 요약 로드
  useEffect(() => {
    loadMonthSchedules();
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  // 월별 일정 요약 로드
  const loadMonthSchedules = async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      console.log('📅 Loading month schedules for:', year, month);
      
      let summary;
      if (getMonthSchedulesSummary) {
        summary = await getMonthSchedulesSummary(year, month);
      } else {
        summary = await scheduleService.getMonthSchedulesSummary(year, month);
      }
      
      console.log('📅 Month summary response:', summary);
      console.log('📅 Raw schedules data:', summary.schedules || summary);
      
      // 데이터 정규화 - 다양한 형식 지원
      const scheduleData = summary.schedules || summary.data || summary || {};
      console.log('📅 Processed schedule data:', scheduleData);
      console.log('📅 Keys in schedule data:', Object.keys(scheduleData));
      
      setMonthSchedules(scheduleData);
    } catch (err) {
      console.error('월별 일정 로드 실패:', err);
      setMonthSchedules({});
    }
  };

  // 날짜 클릭 핸들러 - 날짜 계산 수정
  const handleDateClick = async (day) => {
    if (!day) return;
    
    setSelectedDay(day);
    setLoading(true);
    
    try {
      // 정확한 날짜 문자열 생성 (시간대 문제 해결)
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1; // 0-11 → 1-12
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      console.log('🗓️ Clicked day:', day);
      console.log('🗓️ Current selectedDate:', selectedDate);
      console.log('🗓️ Generated dateString:', dateString);
      
      let schedules;
      if (getSchedulesByDate) {
        schedules = await getSchedulesByDate(dateString);
      } else {
        schedules = await scheduleService.getSchedulesByDate(dateString);
      }
      
      console.log('📋 API Response:', schedules);
      console.log('📋 Common schedules:', schedules.common_schedules?.length || 0);
      console.log('📋 RIS schedules:', schedules.ris_schedules?.length || 0);
      console.log('📋 Personal schedules:', schedules.personal_schedules?.length || 0);
      
      setSelectedDateSchedules(schedules);
      
    } catch (err) {
      console.error('날짜별 일정 로드 실패:', err);
      alert('일정을 불러오는데 실패했습니다.');
      setSelectedDateSchedules({
        common_schedules: [],
        ris_schedules: [],
        personal_schedules: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // 날짜에 일정이 있는지 확인 - 개선된 버전
  const hasScheduleOnDate = (day) => {
    if (!day || !monthSchedules) {
      return false;
    }
    
    // 다양한 키 형식 시도
    const possibleKeys = [
      day,                           // 1, 2, 3...
      day.toString(),                // "1", "2", "3"...
      day.toString().padStart(2, '0'), // "01", "02", "03"...
      `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` // "2025-06-01"
    ];
    
    for (const key of possibleKeys) {
      const dayData = monthSchedules[key];
      
      if (dayData) {
        console.log(`📅 Found data for day ${day} with key "${key}":`, dayData);
        
        // total 속성이 있는 경우
        if (dayData.total !== undefined) {
          return dayData.total > 0;
        }
        
        // 개별 카운트가 있는 경우
        if (dayData.common !== undefined || dayData.ris !== undefined || dayData.personal !== undefined) {
          const total = (dayData.common || 0) + (dayData.ris || 0) + (dayData.personal || 0);
          return total > 0;
        }
        
        // 배열인 경우
        if (Array.isArray(dayData)) {
          return dayData.length > 0;
        }
        
        // 객체가 비어있지 않은 경우
        if (typeof dayData === 'object' && Object.keys(dayData).length > 0) {
          return true;
        }
        
        // 숫자나 불린값인 경우
        if (typeof dayData === 'number') {
          return dayData > 0;
        }
        
        if (typeof dayData === 'boolean') {
          return dayData;
        }
      }
    }
    
    return false;
  };

  // 현재 탭에 맞는 일정들 필터링
  const getCurrentSchedules = () => {
    if (!selectedDateSchedules) return [];
    
    try {
      const allSchedules = [];
      
      switch (scheduleView) {
        case '전체일정':
          allSchedules.push(
            ...(selectedDateSchedules.common_schedules || []).map(s => ({...s, type: 'common'})),
            ...(selectedDateSchedules.ris_schedules || []).map(s => ({...s, type: 'ris'})),
            ...(selectedDateSchedules.personal_schedules || []).map(s => ({...s, type: 'personal'}))
          );
          break;
        
        case '부서일정':
          allSchedules.push(
            ...(selectedDateSchedules.common_schedules || []).map(s => ({...s, type: 'common'})),
            ...(selectedDateSchedules.ris_schedules || []).map(s => ({...s, type: 'ris'}))
          );
          break;
        
        case '개인일정':
          allSchedules.push(
            ...(selectedDateSchedules.personal_schedules || []).map(s => ({...s, type: 'personal'}))
          );
          break;
        
        default:
          break;
      }
      
      const sortedSchedules = allSchedules.sort((a, b) => {
        const aDate = new Date(a.datetime);
        const bDate = new Date(b.datetime);
        return aDate - bDate;
      });
      
      console.log(`📋 ${scheduleView} - Final filtered schedules:`, sortedSchedules);
      
      return sortedSchedules;
    } catch (err) {
      console.error('일정 필터링 오류:', err);
      return [];
    }
  };

  // 일정 타입에 따른 스타일 클래스
  const getScheduleTypeClass = (type) => {
    switch (type) {
      case 'common': return 'schedule-common';
      case 'ris': return 'schedule-ris';
      case 'personal': return 'schedule-personal';
      default: return '';
    }
  };

  // 일정 타입 표시 텍스트
  const getScheduleTypeText = (type) => {
    switch (type) {
      case 'common': return '전체';
      case 'ris': return '부서';
      case 'personal': return '개인';
      default: return '';
    }
  };

  // 시간 표시 함수 개선
  const getDisplayTime = (schedule) => {
    // 1. time_display가 있으면 우선 사용
    if (schedule.time_display) {
      return schedule.time_display;
    }
    
    // 2. datetime이 있으면 KST로 변환하여 시간만 추출
    if (schedule.datetime) {
      return extractTimeFromDateTime(schedule.datetime);
    }
    
    // 3. 둘 다 없으면 기본값
    return '시간 미정';
  };

  // 개인일정 수정
  const handleEditPersonalSchedule = async (schedule) => {
    const newTitle = prompt('새 제목을 입력하세요:', schedule.title);
    if (newTitle && newTitle !== schedule.title) {
      try {
        if (updatePersonalSchedule) {
          await updatePersonalSchedule(schedule.id, { ...schedule, title: newTitle });
        } else {
          await scheduleService.updatePersonalSchedule(schedule.id, { ...schedule, title: newTitle });
        }
        
        // 현재 날짜 일정 다시 로드
        handleDateClick(selectedDay);
        // 월별 요약도 다시 로드
        loadMonthSchedules();
      } catch (err) {
        console.error('일정 수정 실패:', err);
        alert('일정 수정에 실패했습니다.');
      }
    }
  };

  // 개인일정 삭제
  const handleDeletePersonalSchedule = async (scheduleId) => {
    if (window.confirm('이 개인일정을 삭제하시겠습니까?')) {
      try {
        if (deletePersonalSchedule) {
          await deletePersonalSchedule(scheduleId);
        } else {
          await scheduleService.deletePersonalSchedule(scheduleId);
        }
        
        // 현재 날짜 일정 다시 로드
        handleDateClick(selectedDay);
        // 월별 요약도 다시 로드
        loadMonthSchedules();
      } catch (err) {
        console.error('일정 삭제 실패:', err);
        alert('일정 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="calendar-schedule-container">
      {/* 달력 섹션 */}
      <div className="calendar-grid-section">
        <div className="calendar-header">
          <h3>📅 달력</h3>
          <div className="calendar-nav">
            <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}>‹</button>
            <span>{selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월</span>
            <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}>›</button>
          </div>
        </div>
        
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {getDaysInMonth(selectedDate).map((day, index) => {
              const hasSchedule = hasScheduleOnDate(day);
              
              return (
                <div 
                  key={index} 
                  className={`calendar-day ${day ? '' : 'empty'} ${hasSchedule ? 'has-schedule' : ''} ${selectedDay === day ? 'selected' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  {day && (
                    <>
                      <span className="day-number">{day}</span>
                      {hasSchedule && (
                        <div className="schedule-dots">
                          {monthSchedules[day]?.common > 0 && <div className="dot dot-common"></div>}
                          {monthSchedules[day]?.ris > 0 && <div className="dot dot-ris"></div>}
                          {monthSchedules[day]?.personal > 0 && <div className="dot dot-personal"></div>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🔧 일정 섹션 - 클래스명 변경 */}
      <div className="calendar-schedule-content">
        <div className="calendar-schedule-header">
          <h3>📋 일정 관리</h3>
          <div className="calendar-schedule-tabs">
            <button 
              className={`calendar-tab-btn ${scheduleView === '전체일정' ? 'active' : ''}`}
              onClick={() => setScheduleView('전체일정')}
            >
              전체일정
            </button>
            <button 
              className={`calendar-tab-btn ${scheduleView === '부서일정' ? 'active' : ''}`}
              onClick={() => setScheduleView('부서일정')}
            >
              부서일정
            </button>
            <button 
              className={`calendar-tab-btn ${scheduleView === '개인일정' ? 'active' : ''}`}
              onClick={() => setScheduleView('개인일정')}
            >
              개인일정
            </button>
          </div>
        </div>
        
        <div className="calendar-schedule-list-container">
          {loading ? (
            <div className="schedule-loading">일정을 불러오는 중...</div>
          ) : selectedDay ? (
            <div>
              <div className="selected-date-title">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDay}일 일정
              </div>
              {getCurrentSchedules().length > 0 ? (
                getCurrentSchedules().map((schedule, index) => (
                  <div key={`${schedule.type}-${schedule.id}-${index}`} className={`schedule-list-item ${getScheduleTypeClass(schedule.type)}`}>
                    <div className="schedule-date-time">
                      <div className="schedule-type-badge">{getScheduleTypeText(schedule.type)}</div>
                      <div className="schedule-time">
                        {getDisplayTime(schedule)}
                      </div>
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-title">{schedule.title || '제목 없음'}</div>
                      {schedule.description && (
                        <div className="schedule-description">{schedule.description}</div>
                      )}
                    </div>
                    {schedule.type === 'personal' && (
                      <div className="schedule-actions">
                        <button 
                          onClick={() => handleEditPersonalSchedule(schedule)}
                          className="edit-btn"
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeletePersonalSchedule(schedule.id)}
                          className="delete-btn"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-schedules">
                  선택한 날짜에 {scheduleView}이 없습니다.
                </div>
              )}
            </div>
          ) : (
            <div className="select-date-message">
              달력에서 날짜를 선택하여 일정을 확인하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSection;