
// import React from 'react';
// import ScheduleHeader from './ScheduleHeader';
// import ScheduleTable from './ScheduleTable';
// import { getEndTime } from '../../../utils/timeUtils';
// import './SchedulePanel.css';

// const SchedulePanel = ({ 
//   draggedExam, 
//   onDragOver, 
//   onExamUpdated,
//   roomSchedules = {},  // Dashboard에서 받음
//   rooms = [],          // Dashboard에서 받음
//   radiologists = [],   // Dashboard에서 받음
//   onStartExam,         // 추가
//   onCompleteExam,      // 추가
//   onCancelExam         // 추가
// }) => {
//   // console.log('SchedulePanel 렌더링:', { roomSchedules, rooms, radiologists }); // 🔍 디버깅 - 무한 로그 방지

//   // 드래그앤드롭 핸들러
//   const handleDrop = async (roomId, event) => {
//     if (!draggedExam) {
//       console.log('드래그된 검사가 없습니다.');
//       return;
//     }

//     // ✅ 드롭 위치에서 실제 시간 계산
//     const rect = event.currentTarget.getBoundingClientRect();
//     const dropY = event.clientY - rect.top;
    
//     // 시간 계산: 108px = 1시간, 1.8px = 1분
//     const totalMinutes = Math.floor(dropY / 1.8) + 540; // 540 = 9시 * 60분
//     const dropHour = Math.floor(totalMinutes / 60);
//     const dropMinute = Math.floor((totalMinutes % 60) / 10) * 10; // 10분 단위로 정렬
    
//     // 운영시간 내로 제한 (9시-17시)
//     const finalHour = Math.max(9, Math.min(17, dropHour));
//     const finalMinute = Math.max(0, Math.min(50, dropMinute));
    
//     const timeSlot = `${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
    
//     console.log('드롭 처리:', { 
//       examId: draggedExam.id, 
//       roomId, 
//       dropY, 
//       totalMinutes, 
//       dropHour, 
//       dropMinute,
//       timeSlot 
//     });

//     try {
//       if (onExamUpdated) {
//         onExamUpdated('assignment_requested', {
//           exam: draggedExam,
//           roomId,
//           timeSlot // ✅ 계산된 실제 시간 전달
//         });
//       }
//     } catch (error) {
//       console.error('검사 배정 실패:', error);
//       alert('검사 배정에 실패했습니다.');
//     }
//   };

//   // ✅ 더 강화된 로딩 조건
//   if (rooms.length === 0) {
//     return (
//       <div className="schedule-panel">
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'center', 
//           alignItems: 'center', 
//           height: '200px',
//           color: '#6b7280'
//         }}>
//           검사실 데이터를 불러오는 중...
//         </div>
//       </div>
//     );
//   }

//   // ✅ roomSchedules가 비어있으면 빈 스케줄로 초기화
//   const hasScheduleData = roomSchedules && Object.keys(roomSchedules).length > 0;
//   const safeRoomSchedules = hasScheduleData ? roomSchedules : (() => {
//     const emptySchedules = {};
//     rooms.forEach(room => {
//       emptySchedules[room.id] = [];
//     });
//     return emptySchedules;
//   })();

//   return (
//     <div className="schedule-panel">
//       <ScheduleHeader radiologists={radiologists} />
      
//       <ScheduleTable
//         roomSchedules={safeRoomSchedules}
//         radiologists={radiologists}
//         rooms={rooms}
//         onDragOver={onDragOver}
//         onDrop={handleDrop}
//         onStartExam={onStartExam}
//         onCompleteExam={onCompleteExam}
//         onCancelExam={onCancelExam}
//         getEndTime={getEndTime}
//       />
      
//       {/* 🔍 디버그 정보 */}
//       {process.env.NODE_ENV === 'development' && (
//         <div style={{ 
//           position: 'fixed', 
//           bottom: '60px', 
//           right: '10px', 
//           background: 'rgba(0,0,0,0.8)', 
//           color: 'white', 
//           padding: '0.5rem',
//           borderRadius: '0.25rem',
//           fontSize: '0.75rem'
//         }}>
//           검사실: {rooms.length} | 영상전문의: {radiologists.length} | 
//           스케줄: {Object.keys(safeRoomSchedules).map(roomId => 
//             `${roomId}(${safeRoomSchedules[roomId].length})`
//           ).join(', ')} | 
//           원본스케줄: {hasScheduleData ? 'O' : 'X'}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SchedulePanel;

import React from 'react';
import ScheduleHeader from './ScheduleHeader';
import ScheduleTable from './ScheduleTable';
import { getEndTime } from '../../../utils/timeUtils';
import './SchedulePanel.css';

const SchedulePanel = ({ 
  draggedExam, 
  onDragOver, 
  onExamUpdated,
  roomSchedules = {},  // Dashboard에서 받음
  rooms = [],          // Dashboard에서 받음
  radiologists = [],   // Dashboard에서 받음
  onStartExam,
  onCompleteExam,
  onCancelExam
}) => {

  // 드래그앤드롭 핸들러
  const handleDrop = async (roomId, event) => {
    if (!draggedExam) {
      console.log('드래그된 검사가 없습니다.');
      return;
    }

    // ✅ 드롭 위치에서 실제 시간 계산
    const rect = event.currentTarget.getBoundingClientRect();
    const dropY = event.clientY - rect.top;
    
    // 시간 계산: 108px = 1시간, 1.8px = 1분
    const totalMinutes = Math.floor(dropY / 1.8) + 540; // 540 = 9시 * 60분
    const dropHour = Math.floor(totalMinutes / 60);
    const dropMinute = Math.floor((totalMinutes % 60) / 10) * 10; // 10분 단위로 정렬
    
    // 운영시간 내로 제한 (9시-17시)
    const finalHour = Math.max(9, Math.min(17, dropHour));
    const finalMinute = Math.max(0, Math.min(50, dropMinute));
    
    const timeSlot = `${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
    
    console.log('드롭 처리:', { 
      examId: draggedExam.id, 
      roomId, 
      dropY, 
      totalMinutes, 
      dropHour, 
      dropMinute,
      timeSlot 
    });

    try {
      if (onExamUpdated) {
        onExamUpdated('assignment_requested', {
          exam: draggedExam,
          roomId,
          timeSlot // ✅ 계산된 실제 시간 전달
        });
      }
    } catch (error) {
      console.error('검사 배정 실패:', error);
      alert('검사 배정에 실패했습니다.');
    }
  };

  // ✅ 배정 취소 핸들러 (워크리스트로 복귀)
  const handleUnassignExam = async (examId, roomId) => {
    console.log('🔄 배정 취소 요청:', { examId, roomId });
    
    try {
      if (onExamUpdated) {
        onExamUpdated('unassignment_requested', {
          examId,
          roomId,
          action: 'unassign' // 배정 취소 플래그
        });
      }
    } catch (error) {
      console.error('배정 취소 실패:', error);
      alert('배정 취소에 실패했습니다.');
    }
  };

  // ✅ 더 강화된 로딩 조건
  if (rooms.length === 0) {
    return (
      <div className="schedule-panel">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          검사실 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  // ✅ roomSchedules가 비어있으면 빈 스케줄로 초기화
  const hasScheduleData = roomSchedules && Object.keys(roomSchedules).length > 0;
  const safeRoomSchedules = hasScheduleData ? roomSchedules : (() => {
    const emptySchedules = {};
    rooms.forEach(room => {
      emptySchedules[room.id] = [];
    });
    return emptySchedules;
  })();

  return (
    <div className="schedule-panel">
      <ScheduleHeader radiologists={radiologists} />
      
      <ScheduleTable
        roomSchedules={safeRoomSchedules}
        radiologists={radiologists}
        rooms={rooms}
        onDragOver={onDragOver}
        onDrop={handleDrop}
        onStartExam={onStartExam}
        onCompleteExam={onCompleteExam}
        onCancelExam={onCancelExam}
        onUnassignExam={handleUnassignExam} // ✅ 배정 취소 함수 전달
        getEndTime={getEndTime}
      />
      
      {/* 🔍 디버그 정보 */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '60px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem'
        }}>
          검사실: {rooms.length} | 영상전문의: {radiologists.length} | 
          스케줄: {Object.keys(safeRoomSchedules).map(roomId => 
            `${roomId}(${safeRoomSchedules[roomId].length})`
          ).join(', ')} | 
          원본스케줄: {hasScheduleData ? 'O' : 'X'}
        </div>
      )} */}
    </div>
  );
};

export default SchedulePanel;