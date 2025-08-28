// // D:\250619\radiology-system\frontend\src\components\home\ProfileCard\index.js
// import React, { useState, useEffect } from 'react';
// import { useDoctor } from '../../../contexts/DoctorContext';
// import './ProfileCard.css';

// const ProfileCard = () => {
//   const { 
//     doctor, 
//     loading, 
//     error, 
//     updateDoctorStatus,
//     todaySchedules,  // 🆕 오늘 개인일정
//     schedulesLoading,  // 🆕 일정 로딩 상태
//     createPersonalSchedule,  // 🆕 일정 생성
//     updatePersonalSchedule,  // 🆕 일정 수정
//     deletePersonalSchedule,   // 🆕 일정 삭제
//     // 🆕 통계 관련 값들 추가
//     dashboardStats,
//     statsLoading,
//     statsError,
//     refreshDashboardStats
//   } = useDoctor();
  
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [showScheduleModal, setShowScheduleModal] = useState(false);  // 🆕 일정 모달
//   const [editingSchedule, setEditingSchedule] = useState(null);  // 🆕 수정중인 일정

//   // 🆕 30초마다 통계 자동 새로고침
//   useEffect(() => {
//     if (!doctor) return;

//     // 초기 로드 후 30초마다 통계 새로고침
//     const statsInterval = setInterval(() => {
//       console.log('🔄 ProfileCard: 30초 주기 통계 새로고침');
//       refreshDashboardStats();
//     }, 30000); // 30초

//     return () => {
//       clearInterval(statsInterval);
//     };
//   }, [doctor, refreshDashboardStats]);

//   // 상태 토글 함수
//   const handleStatusToggle = async (newStatus) => {
//     if (isUpdating) return;
//     setIsUpdating(true);
    
//     try {
//       await updateDoctorStatus(newStatus);
//     } catch (err) {
//       alert('상태 업데이트에 실패했습니다.');
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   // 🆕 일정 추가 버튼 클릭
//   const handleAddSchedule = () => {
//     setEditingSchedule(null);
//     setShowScheduleModal(true);
//   };

//   // 🆕 일정 수정 버튼 클릭
//   const handleEditSchedule = (schedule) => {
//     setEditingSchedule(schedule);
//     setShowScheduleModal(true);
//   };

//   // 🆕 일정 삭제
//   const handleDeleteSchedule = async (scheduleId) => {
//     if (window.confirm('이 일정을 삭제하시겠습니까?')) {
//       try {
//         await deletePersonalSchedule(scheduleId);
//       } catch (err) {
//         alert('일정 삭제에 실패했습니다.');
//       }
//     }
//   };

//   // 🆕 통계 수동 새로고침
//   const handleStatsRefresh = () => {
//     console.log('🔄 ProfileCard: 수동 통계 새로고침');
//     refreshDashboardStats();
//   };

//   // 🆕 통계 데이터 추출 (에러 처리 포함)
//   const getStatsDisplay = () => {
//     if (statsLoading) {
//       return {
//         todayTotal: '로딩...',
//         examStatus: '로딩...',
//         reportStatus: '로딩...'
//       };
//     }

//     if (statsError || !dashboardStats) {
//       return {
//         todayTotal: '오류',
//         examStatus: '오류',
//         reportStatus: '오류'
//       };
//     }

//     return {
//       todayTotal: dashboardStats.display?.today_total_display || '0',
//       examStatus: dashboardStats.display?.exam_status_display || '0/0',
//       reportStatus: dashboardStats.display?.report_status_display || '0/0'
//     };
//   };

//   if (loading) {
//     return (
//       <div className="profile-card">
//         <div className="loading">로딩 중...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="profile-card">
//         <div className="error">{error}</div>
//       </div>
//     );
//   }

//   const isOnline = doctor?.status === '온라인';
//   const statsDisplay = getStatsDisplay();

//   return (
//     <div className="profile-card">
//       <div className="profile-header">
//         <div className="profile-avatar">
//           <div className="avatar-circle">{doctor?.name?.charAt(0) || 'U'}</div>
//         </div>
//         <div className="profile-info">
//           <div className="profile-name">{doctor?.name || '사용자'}</div>
//           <div className="profile-department">{doctor?.department || '진료과'}</div>
//           <div className="profile-department">{doctor?.role || '역할'}</div>
//           <div className="profile-status">
//             <span className={`status-dot ${doctor?.status === '온라인' ? 'online' : 'offline'}`}></span>
//             {doctor?.status || '상태'}
//           </div>
//         </div>
//       </div>
      
//       {/* 🆕 실시간 통계 데이터 적용 */}
//       <div className="profile-stats">
//         <div className="stat-item">
//           <div className={`stat-number ${statsLoading ? 'loading' : ''}`}>
//             {statsDisplay.todayTotal}
//           </div>
//           <div className="stat-label">
//             금일 영상 검사
//             {/* 🆕 새로고침 버튼 추가 */}
//             <button 
//               onClick={handleStatsRefresh}
//               className="refresh-btn"
//               title="통계 새로고침"
//               disabled={statsLoading}
//               style={{
//                 marginLeft: '5px',
//                 border: 'none',
//                 background: 'none',
//                 cursor: 'pointer',
//                 fontSize: '12px'
//               }}
//             >
//               🔄
//             </button>
//           </div>
//         </div>
//         <div className="stat-item">
//           <div className={`stat-number ${statsLoading ? 'loading' : ''}`}>
//             {statsDisplay.examStatus}
//           </div>
//           <div className="stat-label">검사현황</div>
//           <div className="stat-sublabel" style={{ fontSize: '10px', color: '#666' }}>
//             완료/전체
//           </div>
//         </div>
//         <div className="stat-item">
//           <div className={`stat-number ${statsLoading ? 'loading' : ''}`}>
//             {statsDisplay.reportStatus}
//           </div>
//           <div className="stat-label">레포트 현황</div>
//           <div className="stat-sublabel" style={{ fontSize: '10px', color: '#666' }}>
//             완료/전체
//           </div>
//         </div>
//       </div>

//       {/* 🆕 통계 에러 표시 */}
//       {statsError && (
//         <div className="stats-error" style={{
//           padding: '8px',
//           backgroundColor: '#ffebee',
//           borderRadius: '4px',
//           marginBottom: '16px'
//         }}>
//           <small style={{ color: '#d32f2f' }}>⚠️ {statsError}</small>
//           <button 
//             onClick={handleStatsRefresh}
//             style={{
//               marginLeft: '8px',
//               padding: '2px 6px',
//               fontSize: '11px',
//               border: '1px solid #d32f2f',
//               background: 'white',
//               color: '#d32f2f',
//               borderRadius: '3px',
//               cursor: 'pointer'
//             }}
//           >
//             재시도
//           </button>
//         </div>
//       )}

//       {/* 🆕 오늘 일정 - 실제 데이터 */}
//       <div className="today-schedule">
//         <div className="schedule-title">
//           오늘 일정
//           <button 
//             onClick={handleAddSchedule}
//             className="add-schedule-btn"
//             title="일정 추가"
//           >
//             +
//           </button>
//         </div>
//         <div className="schedule-list">
//           {schedulesLoading ? (
//             <div className="schedule-loading">일정 로딩 중...</div>
//           ) : todaySchedules && todaySchedules.length > 0 ? (
//             todaySchedules.map((schedule) => (
//               <div key={schedule.id} className="schedule-item">
//                 <span className="schedule-time">
//                   {schedule.time_display}  {/* 🆕 "09:00 ~ 10:30" 형태 */}
//                 </span>
//                 <span className="schedule-content">{schedule.title}</span>
//                 <div className="schedule-actions">
//                   <button 
//                     onClick={() => handleEditSchedule(schedule)}
//                     className="edit-btn"
//                     title="수정"
//                   >
//                     ✏️
//                   </button>
//                   <button 
//                     onClick={() => handleDeleteSchedule(schedule.id)}
//                     className="delete-btn"
//                     title="삭제"
//                   >
//                     🗑️
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="schedule-item no-schedule">
//               오늘 개인 일정이 없습니다.
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="quick-actions">
//         <button 
//           className={`action-btn ${isOnline ? 'primary' : 'secondary'}`}
//           onClick={() => handleStatusToggle('온라인')}
//           disabled={isUpdating}
//         >
//           {isUpdating && !isOnline ? '변경 중...' : '온라인'}
//         </button>
//         <button 
//           className={`action-btn ${!isOnline ? 'primary' : 'secondary'}`}
//           onClick={() => handleStatusToggle('자리 비움')}
//           disabled={isUpdating}
//         >
//           {isUpdating && isOnline ? '변경 중...' : '자리 비움'}
//         </button>
//       </div>

//       {/* 🆕 일정 추가/수정 모달 (간단 버전) */}
//       {showScheduleModal && (
//         <ScheduleModal
//           isOpen={showScheduleModal}
//           onClose={() => setShowScheduleModal(false)}
//           editingSchedule={editingSchedule}
//           onSave={editingSchedule ? updatePersonalSchedule : createPersonalSchedule}
//         />
//       )}
//     </div>
//   );
// };

// // 🆕 간단한 일정 모달 컴포넌트
// const ScheduleModal = ({ isOpen, onClose, editingSchedule, onSave }) => {
//   const [formData, setFormData] = useState({
//     title: editingSchedule?.title || '',
//     datetime: editingSchedule?.datetime
//       ? editingSchedule.datetime.slice(0, 16) // ✅ 그냥 자르기만
//       : '',
//     end_datetime: editingSchedule?.end_datetime
//       ? editingSchedule.end_datetime.slice(0, 16)
//       : '',
//     description: editingSchedule?.description || ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (editingSchedule) {
//         await onSave(editingSchedule.id, formData);
//       } else {
//         await onSave(formData);
//       }
//       onClose();
//     } catch (err) {
//       alert('일정 저장에 실패했습니다.');
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//         <h3>{editingSchedule ? '일정 수정' : '일정 추가'}</h3>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>제목</label>
//             <input
//               type="text"
//               value={formData.title}
//               onChange={(e) => setFormData({...formData, title: e.target.value})}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>시작시간</label>
//             <input
//               type="datetime-local"
//               value={formData.datetime}
//               onChange={(e) => setFormData({...formData, datetime: e.target.value})}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>종료시간 (선택사항)</label>
//             <input
//               type="datetime-local"
//               value={formData.end_datetime}
//               onChange={(e) => setFormData({...formData, end_datetime: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>설명</label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({...formData, description: e.target.value})}
//             />
//           </div>
//           <div className="modal-actions">
//             <button type="button" onClick={onClose}>취소</button>
//             <button type="submit">저장</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ProfileCard;


// src/components/home/ProfileCard/index.js
import React, { useState, useEffect } from 'react';
import { useDoctor } from '../../../contexts/DoctorContext';
import './ProfileCard.css';

const ProfileCard = () => {
  const { 
    doctor, 
    loading, 
    error, 
    updateDoctorStatus,
    todaySchedules,
    schedulesLoading,
    createPersonalSchedule,
    updatePersonalSchedule,
    deletePersonalSchedule,
    dashboardStats,
    statsLoading,
    statsError,
    refreshDashboardStats
  } = useDoctor();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // 🔥 새로 추가: 레포트 관련 이벤트 리스너
  useEffect(() => {
    const handleReportSaved = (event) => {
      console.log('📡 ProfileCard - 레포트 저장 이벤트 수신:', event.detail);
      console.log('🔄 ProfileCard - 통계 새로고침 실행');
      refreshDashboardStats();
    };

    const handleReportStatusUpdated = (event) => {
      console.log('📡 ProfileCard - 레포트 상태 업데이트 이벤트 수신:', event.detail);
      console.log('🔄 ProfileCard - 통계 새로고침 실행');
      refreshDashboardStats();
    };

    const handleDashboardRefresh = (event) => {
      console.log('📡 ProfileCard - 대시보드 새로고침 이벤트 수신:', event.detail);
      console.log('🔄 ProfileCard - 통계 새로고침 실행');
      refreshDashboardStats();
    };

    // 🔥 이벤트 리스너 등록
    window.addEventListener('reportSaved', handleReportSaved);
    window.addEventListener('reportStatusUpdated', handleReportStatusUpdated);
    window.addEventListener('dashboardRefresh', handleDashboardRefresh);

    console.log('📡 ProfileCard 이벤트 리스너 등록 완료');

    // 🔥 정리 함수
    return () => {
      window.removeEventListener('reportSaved', handleReportSaved);
      window.removeEventListener('reportStatusUpdated', handleReportStatusUpdated);
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
      console.log('📡 ProfileCard 이벤트 리스너 해제 완료');
    };
  }, [refreshDashboardStats]);

  // 🆕 30초마다 통계 자동 새로고침
  useEffect(() => {
    if (!doctor) return;

    // 초기 로드 후 30초마다 통계 새로고침
    const statsInterval = setInterval(() => {
      console.log('🔄 ProfileCard: 30초 주기 통계 새로고침');
      refreshDashboardStats();
    }, 30000); // 30초

    return () => {
      clearInterval(statsInterval);
    };
  }, [doctor, refreshDashboardStats]);

  // 상태 토글 함수
  const handleStatusToggle = async (newStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      await updateDoctorStatus(newStatus);
    } catch (err) {
      alert('상태 업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 🆕 일정 추가 버튼 클릭
  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setShowScheduleModal(true);
  };

  // 🆕 일정 수정 버튼 클릭
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setShowScheduleModal(true);
  };

  // 🆕 일정 삭제
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      try {
        await deletePersonalSchedule(scheduleId);
      } catch (err) {
        alert('일정 삭제에 실패했습니다.');
      }
    }
  };

  // 🆕 통계 수동 새로고침
  const handleStatsRefresh = () => {
    console.log('🔄 ProfileCard: 수동 통계 새로고침');
    refreshDashboardStats();
  };

  // 🆕 통계 데이터 추출 (에러 처리 포함)
  const getStatsDisplay = () => {
    if (statsLoading) {
      return {
        todayTotal: '로딩...',
        examStatus: '로딩...',
        reportStatus: '로딩...'
      };
    }

    if (statsError || !dashboardStats) {
      return {
        todayTotal: '오류',
        examStatus: '오류',
        reportStatus: '오류'
      };
    }

    return {
      todayTotal: dashboardStats.display?.today_total_display || '0',
      examStatus: dashboardStats.display?.exam_status_display || '0/0',
      reportStatus: dashboardStats.display?.report_status_display || '0/0'
    };
  };

  if (loading) {
    return (
      <div className="profile-card">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-card">
        <div className="error">{error}</div>
      </div>
    );
  }

  const isOnline = doctor?.status === '온라인';
  const statsDisplay = getStatsDisplay();

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">{doctor?.name?.charAt(0) || 'U'}</div>
        </div>
        <div className="profile-info">
          <div className="profile-name">{doctor?.name || '사용자'}</div>
          <div className="profile-department">{doctor?.department || '진료과'}</div>
          <div className="profile-department">{doctor?.role || '역할'}</div>
          <div className="profile-status">
            <span className={`status-dot ${doctor?.status === '온라인' ? 'online' : 'offline'}`}></span>
            {doctor?.status || '상태'}
          </div>
        </div>
      </div>
      
      {/* 🆕 실시간 통계 데이터 적용 */}
      <div className="profile-stats">
        <div className="stat-item">
          <div className={`stat-number ${statsLoading ? 'loading' : ''}`}>
            {statsDisplay.todayTotal}
          </div>
          <div className="stat-label">
            금일 영상 검사
            {/* 🆕 새로고침 버튼 추가 */}
            <button 
              onClick={handleStatsRefresh}
              className="refresh-btn"
              title="통계 새로고침"
              disabled={statsLoading}
              style={{
                marginLeft: '5px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄
            </button>
          </div>
        </div>
        <div className="stat-item">
          <div className={`stat-number ${statsLoading ? 'loading' : ''}`}>
            {statsDisplay.examStatus}
          </div>
          <div className="stat-label">검사현황</div>
          <div className="stat-sublabel" style={{ fontSize: '10px', color: '#666' }}>
            완료/전체
          </div>
        </div>
        <div className="stat-item">
          <div className={`stat-number ${statsLoading ? 'loading' : ''}`}>
            {statsDisplay.reportStatus}
          </div>
          <div className="stat-label">레포트 현황</div>
          <div className="stat-sublabel" style={{ fontSize: '10px', color: '#666' }}>
            완료/전체
          </div>
        </div>
      </div>

      {/* 🆕 통계 에러 표시 */}
      {statsError && (
        <div className="stats-error" style={{
          padding: '8px',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <small style={{ color: '#d32f2f' }}>⚠️ {statsError}</small>
          <button 
            onClick={handleStatsRefresh}
            style={{
              marginLeft: '8px',
              padding: '2px 6px',
              fontSize: '11px',
              border: '1px solid #d32f2f',
              background: 'white',
              color: '#d32f2f',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            재시도
          </button>
        </div>
      )}

      {/* 🆕 오늘 일정 - 실제 데이터 */}
      <div className="today-schedule">
        <div className="schedule-title">
          오늘 일정
          <button 
            onClick={handleAddSchedule}
            className="add-schedule-btn"
            title="일정 추가"
          >
            +
          </button>
        </div>
        <div className="schedule-list">
          {schedulesLoading ? (
            <div className="schedule-loading">일정 로딩 중...</div>
          ) : todaySchedules && todaySchedules.length > 0 ? (
            todaySchedules.map((schedule) => (
              <div key={schedule.id} className="schedule-item">
                <span className="schedule-time">
                  {schedule.time_display}
                </span>
                <span className="schedule-content">{schedule.title}</span>
                <div className="schedule-actions">
                  <button 
                    onClick={() => handleEditSchedule(schedule)}
                    className="edit-btn"
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="delete-btn"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="schedule-item no-schedule">
              오늘 개인 일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <button 
          className={`action-btn ${isOnline ? 'primary' : 'secondary'}`}
          onClick={() => handleStatusToggle('온라인')}
          disabled={isUpdating}
        >
          {isUpdating && !isOnline ? '변경 중...' : '온라인'}
        </button>
        <button 
          className={`action-btn ${!isOnline ? 'primary' : 'secondary'}`}
          onClick={() => handleStatusToggle('자리 비움')}
          disabled={isUpdating}
        >
          {isUpdating && isOnline ? '변경 중...' : '자리 비움'}
        </button>
      </div>

      {/* 🆕 일정 추가/수정 모달 (간단 버전) */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          editingSchedule={editingSchedule}
          onSave={editingSchedule ? updatePersonalSchedule : createPersonalSchedule}
        />
      )}
    </div>
  );
};

// 🆕 간단한 일정 모달 컴포넌트
const ScheduleModal = ({ isOpen, onClose, editingSchedule, onSave }) => {
  const [formData, setFormData] = useState({
    title: editingSchedule?.title || '',
    datetime: editingSchedule?.datetime
      ? editingSchedule.datetime.slice(0, 16)
      : '',
    end_datetime: editingSchedule?.end_datetime
      ? editingSchedule.end_datetime.slice(0, 16)
      : '',
    description: editingSchedule?.description || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await onSave(editingSchedule.id, formData);
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err) {
      alert('일정 저장에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editingSchedule ? '일정 수정' : '일정 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>시작시간</label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) => setFormData({...formData, datetime: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>종료시간 (선택사항)</label>
            <input
              type="datetime-local"
              value={formData.end_datetime}
              onChange={(e) => setFormData({...formData, end_datetime: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>취소</button>
            <button type="submit">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCard;