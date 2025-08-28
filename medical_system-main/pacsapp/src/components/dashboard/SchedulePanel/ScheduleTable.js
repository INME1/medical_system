// import React from 'react';
// import ExamCard from './ExamCard';

// const ScheduleTable = ({
//   roomSchedules,
//   radiologists,
//   rooms,
//   onDragOver,
//   onDrop,
//   onStartExam,
//   onCompleteExam,
//   onCancelExam,
//   getEndTime
// }) => {
//   console.log('🔍 ScheduleTable 렌더링 데이터:');
//   console.log('🔍 - roomSchedules:', roomSchedules);
//   console.log('🔍 - roomSchedules keys:', Object.keys(roomSchedules || {}));
//   console.log('🔍 전체 roomSchedules 구조:', JSON.stringify(roomSchedules, null, 2));
//   console.log('🔍 - rooms:', rooms);
//   console.log('🔍 - radiologists:', radiologists);

//   const findRoomData = (room) => {
//     if (!roomSchedules) return [];
//     const possibleKeys = [
//       room.id,
//       String(room.id),
//       room.name,
//       String(room.name),
//       room.name?.replace('실', ''),
//       room.name?.replace(/\D/g, ''),
//       `ROOM${room.id}`,
//       `room${room.id}`,
//     ].filter(Boolean);

//     console.log(`🔍 Room ${room.id} (${room.name}) 키 후보:`, possibleKeys);

//     for (const key of possibleKeys) {
//       if (roomSchedules[key] && Array.isArray(roomSchedules[key])) {
//         console.log(`✅ 매칭된 키: ${key}, 데이터:`, roomSchedules[key]);
//         return roomSchedules[key];
//       }
//     }

//     console.log(`❌ Room ${room.id}에 대한 데이터 없음`);
//     return [];
//   };

//   // ✅ 시간 파싱 함수 개선
//   const parseTimeForPosition = (timeString) => {
//     if (!timeString) return { hour: 9, minute: 0 };
    
//     try {
//       const [hourStr, minuteStr] = timeString.split(':');
//       let hour = parseInt(hourStr);
//       let minute = parseInt(minuteStr) || 0;
      
//       // ✅ 자정(0시)인 경우만 9시로 보정, 나머지는 그대로
//       if (hour === 0 && minute === 0) {
//         hour = 9;
//       }
      
//       // ✅ 운영시간 외 체크만 하고 강제 보정은 하지 않음
//       // if (hour < 9 || hour >= 18) {
//       //   console.warn(`⚠️ 운영시간 외: ${timeString}`);
//       // }
      
//       return { hour, minute };
//     } catch (error) {
//       console.error('시간 파싱 에러:', error, timeString);
//       return { hour: 9, minute: 0 };
//     }
//   };

//   // ✅ duration 보정 함수
//   const fixDuration = (duration) => {
//     if (!duration || duration > 1000) {
//       // 비정상적으로 큰 값이면 기본값 30분
//       return 30;
//     }
//     return Math.max(10, Math.min(duration, 180)); // 10분~3시간 사이
//   };

//   return (
//     <div className="schedule-table-container">
//       <table 
//         className="schedule-table"
//         style={{
//           width: '100%',
//           borderCollapse: 'collapse',
//           tableLayout: 'fixed',
//           minWidth: '800px'
//         }}
//       >
//         <thead>
//           <tr>
//             <th style={{ width: '80px' }}>시간</th>
//             {rooms.map(room => (
//               <th key={room.id} style={{ minWidth: '150px' }}>
//                 검사실 {room.name}<br/>
//                 <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({room.type})</span>
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td style={{ width: '80px', background: '#f8fafc' }}>
//               <div style={{ position: 'relative', height: '1080px' }}>
//                 {Array.from({ length: 10 }, (_, i) => {
//                   const hour = 9 + i;
//                   const label = `${hour.toString().padStart(2, '0')}:00`;
//                   return (
//                     <div key={label} style={{ height: '108px', borderBottom: '1px solid #eee', fontSize: '12px', textAlign: 'center' }}>{label}</div>
//                   );
//                 })}
//               </div>
//             </td>
//             {rooms.map(room => {
//               const roomData = findRoomData(room);
//               return (
//                 <td
//                   key={room.id}
//                   style={{ position: 'relative', height: '1080px', borderLeft: '1px solid #e5e7eb' }}
//                   onDragOver={(e) => e.preventDefault()}
//                   onDrop={(e) => onDrop(room.id, e)} // ✅ event 객체 전달
//                 >
//                   {roomData && roomData.map((exam, index) => {
//                     if (!exam.time) return null;
                    
//                     // ✅ 시간 파싱 개선
//                     const { hour, minute } = parseTimeForPosition(exam.time);
                    
//                     // ✅ 새벽 시간을 낮 시간으로 보정
//                     let displayHour = hour;
//                     if (hour >= 0 && hour <= 8) {
//                       displayHour = hour + 9; // 0시→9시, 1시→10시, 2시→11시...
//                       console.log(`🔧 시간 보정: ${hour}:${minute} → ${displayHour}:${minute}`);
//                     }
                    
//                     const startMinutes = displayHour * 60 + minute;
//                     const top = (startMinutes - 540) * 1.8; // 9:00 기준 (9*60=540)
                    
//                     // ✅ duration 보정
//                     const safeDuration = fixDuration(exam.duration);
//                     const height = safeDuration * 1.8;
                    
//                     const radiologist = radiologists.find(r => r.id === exam.radiologistId);
//                     const endTime = getEndTime(`${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, safeDuration);

//                     console.log(`🔍 ExamCard 위치 계산:`, {
//                       exam: exam.patientName,
//                       originalTime: exam.time,
//                       parsedTime: `${hour}:${minute}`,
//                       displayTime: `${displayHour}:${minute}`,
//                       startMinutes,
//                       top,
//                       originalDuration: exam.duration,
//                       safeDuration,
//                       height
//                     });

//                     return (
//                       <ExamCard
//                         key={`${exam.examId || exam.id}-${index}`}
//                         exam={{
//                           ...exam,
//                           time: `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
//                           duration: safeDuration
//                         }}
//                         radiologist={radiologist}
//                         endTime={endTime}
//                         topPosition={Math.max(0, top)} // 음수 방지
//                         cardHeight={height}
//                         onStartExam={onStartExam}
//                         onCompleteExam={onCompleteExam}
//                         onCancelExam={onCancelExam}
//                         roomId={room.id}
//                       />
//                     );
//                   })}
//                 </td>
//               );
//             })}
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ScheduleTable;

import React from 'react';
import ExamCard from './ExamCard';

const ScheduleTable = ({
  roomSchedules,
  radiologists,
  rooms,
  onDragOver,
  onDrop,
  onStartExam,
  onCompleteExam,
  onCancelExam,
  onUnassignExam, // ✅ 배정 취소 함수
  getEndTime
}) => {
  console.log('🔍 ScheduleTable 렌더링 데이터:');
  console.log('🔍 - roomSchedules:', roomSchedules);
  console.log('🔍 - roomSchedules keys:', Object.keys(roomSchedules || {}));
  console.log('🔍 전체 roomSchedules 구조:', JSON.stringify(roomSchedules, null, 2));
  console.log('🔍 - rooms:', rooms);
  console.log('🔍 - radiologists:', radiologists);

  const findRoomData = (room) => {
    if (!roomSchedules) return [];
    const possibleKeys = [
      room.id,
      String(room.id),
      room.name,
      String(room.name),
      room.name?.replace('실', ''),
      room.name?.replace(/\D/g, ''),
      `ROOM${room.id}`,
      `room${room.id}`,
    ].filter(Boolean);

    console.log(`🔍 Room ${room.id} (${room.name}) 키 후보:`, possibleKeys);

    for (const key of possibleKeys) {
      if (roomSchedules[key] && Array.isArray(roomSchedules[key])) {
        console.log(`✅ 매칭된 키: ${key}, 데이터:`, roomSchedules[key]);
        return roomSchedules[key];
      }
    }

    console.log(`❌ Room ${room.id}에 대한 데이터 없음`);
    return [];
  };

  // ✅ 시간 파싱 함수 개선
  const parseTimeForPosition = (timeString) => {
    if (!timeString) return { hour: 9, minute: 0 };
    
    try {
      const [hourStr, minuteStr] = timeString.split(':');
      let hour = parseInt(hourStr);
      let minute = parseInt(minuteStr) || 0;
      
      // ✅ 자정(0시)인 경우만 9시로 보정, 나머지는 그대로
      if (hour === 0 && minute === 0) {
        hour = 9;
      }
      
      return { hour, minute };
    } catch (error) {
      console.error('시간 파싱 에러:', error, timeString);
      return { hour: 9, minute: 0 };
    }
  };

  // ✅ duration 보정 함수
  const fixDuration = (duration) => {
    if (!duration || duration > 1000) {
      // 비정상적으로 큰 값이면 기본값 30분
      return 30;
    }
    return Math.max(10, Math.min(duration, 180)); // 10분~3시간 사이
  };

  return (
    <div className="schedule-table-container">
      <table 
        className="schedule-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: '800px'
        }}
      >
        <thead>
          <tr>
            <th style={{ width: '80px' }}>시간</th>
            {rooms.map(room => (
              <th key={room.id} style={{ minWidth: '150px' }}>
                검사실 {room.name}<br/>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({room.type})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: '80px', background: '#f8fafc' }}>
              <div style={{ position: 'relative', height: '1080px' }}>
                {Array.from({ length: 10 }, (_, i) => {
                  const hour = 9 + i;
                  const label = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <div key={label} style={{ height: '108px', borderBottom: '1px solid #eee', fontSize: '12px', textAlign: 'center' }}>{label}</div>
                  );
                })}
              </div>
            </td>
            {rooms.map(room => {
              const roomData = findRoomData(room);
              return (
                <td
                  key={room.id}
                  style={{ position: 'relative', height: '1080px', borderLeft: '1px solid #e5e7eb' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(room.id, e)}
                >
                  {roomData && roomData.map((exam, index) => {
                    if (!exam.time) return null;
                    
                    // ✅ 시간 파싱 개선
                    const { hour, minute } = parseTimeForPosition(exam.time);
                    
                    // ✅ 새벽 시간을 낮 시간으로 보정
                    let displayHour = hour;
                    if (hour >= 0 && hour <= 8) {
                      displayHour = hour + 9; // 0시→9시, 1시→10시, 2시→11시...
                      console.log(`🔧 시간 보정: ${hour}:${minute} → ${displayHour}:${minute}`);
                    }
                    
                    const startMinutes = displayHour * 60 + minute;
                    const top = (startMinutes - 540) * 1.8; // 9:00 기준 (9*60=540)
                    
                    // ✅ duration 보정
                    const safeDuration = fixDuration(exam.duration);
                    const height = safeDuration * 1.8;
                    
                    const radiologist = radiologists.find(r => r.id === exam.radiologistId);
                    const endTime = getEndTime(`${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, safeDuration);

                    console.log(`🔍 ExamCard 위치 계산:`, {
                      exam: exam.patientName,
                      originalTime: exam.time,
                      parsedTime: `${hour}:${minute}`,
                      displayTime: `${displayHour}:${minute}`,
                      startMinutes,
                      top,
                      originalDuration: exam.duration,
                      safeDuration,
                      height
                    });

                    return (
                      <ExamCard
                        key={`${exam.examId || exam.id}-${index}`}
                        exam={{
                          ...exam,
                          time: `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                          duration: safeDuration
                        }}
                        radiologist={radiologist}
                        endTime={endTime}
                        topPosition={Math.max(0, top)} // 음수 방지
                        cardHeight={height}
                        onStartExam={onStartExam}
                        onCompleteExam={onCompleteExam}
                        onCancelExam={onCancelExam}
                        onUnassignExam={onUnassignExam} // ✅ 배정 취소 함수 전달
                        roomId={room.id}
                      />
                    );
                  })}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;