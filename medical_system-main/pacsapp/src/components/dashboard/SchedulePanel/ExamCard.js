// import React from 'react';

// const ExamCard = ({
//   exam,
//   radiologist,
//   endTime,
//   topPosition,
//   cardHeight,
//   onStartExam,
//   onCompleteExam,
//   onCancelExam,
//   roomId
// }) => {

//   // ✅ 1. 시간 보정 함수
//   const normalizeTime = (timeStr) => {
//     if (!timeStr || timeStr === '00:00' || timeStr === '시간 없음') return '09:00';
//     const [h, m] = timeStr.split(':').map(Number);
//     if (h < 6 || h > 18) return '09:00';
//     return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
//   };

//   // ✅ 2. 종료 시간 계산 함수
//   const getEndTime = (startTime, duration = 30) => {
//     const [h, m] = startTime.split(':').map(Number);
//     const startDate = new Date(0, 0, 0, h, m);
//     const endDate = new Date(startDate.getTime() + duration * 60000);
//     const hh = String(endDate.getHours()).padStart(2, '0');
//     const mm = String(endDate.getMinutes()).padStart(2, '0');
//     return `${hh}:${mm}`;
//   };

//   // ✅ 3. 디버깅 로그
//   console.log('🔍 ExamCard 렌더링:', { 
//     patientName: exam.patientName, 
//     time: exam.time, 
//     topPosition, 
//     cardHeight,
//     exam, 
//     roomId 
//   });


//   // 🔧 필수 데이터 검증
//   if (!exam || !exam.patientName) {
//     console.warn('⚠️ ExamCard: 필수 데이터 누락', exam);
//     return null;
//   }
//   const normalizedTime = normalizeTime(exam.time);
//   // 🔧 안전한 기본값 설정
//   const safeExam = {
//   patientName: exam.patientName || '환자명 없음',
//   examType: exam.examType || exam.type || '검사명 없음',
//   time: normalizedTime,
//   status: exam.status || '검사대기',
//   examId: exam.examId || exam.id || `temp-${Date.now()}`,
//   duration: exam.duration || 30
// };

//   const safeRadiologist = radiologist || { 
//     name: '미배정', 
//     color: 'radiologist-blue' 
//   };

//   // 🔧 최소 높이 보장
//   const minHeight = 80;
//   const finalHeight = Math.max(cardHeight || minHeight, minHeight);
//   const finalTopPosition = Math.max(topPosition || 0, 0);

//   // 🔧 상태별 스타일
//   const getStatusStyle = (status) => {
//     const baseStyle = {
//       fontSize: '0.75rem',
//       padding: '0.25rem 0.5rem',
//       borderRadius: '0.25rem',
//       fontWeight: '500',
//       whiteSpace: 'nowrap',
//       textAlign: 'center',
//       minWidth: '60px',
//       maxWidth: '60px',
//       width: '60px',
//       height: '24px',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       cursor: status === '검사완료' ? 'default' : 'pointer',
//       opacity: status === '검사완료' ? 0.7 : 1,
//       transition: 'all 0.2s ease',
//       userSelect: 'none',
//       boxSizing: 'border-box',
//       border: 'none',
//       outline: 'none'
//     };

//     switch (status) {
//       case '검사대기':
//         return { ...baseStyle, background: '#dbeafe', color: '#2563eb' };
//       case '검사중':
//         return { ...baseStyle, background: '#dcfce7', color: '#16a34a' };
//       case '검사완료':
//         return { ...baseStyle, background: '#f3e8ff', color: '#9333ea' };
//       default:
//         return { ...baseStyle, background: '#f3f4f6', color: '#6b7280' };
//     }
//   };

//   const handleStatusClick = () => {
//     if (safeExam.status === '검사대기') {
//       console.log('🔄 검사대기 → 검사중:', { roomId, examId: safeExam.examId });
//       onStartExam?.(roomId, safeExam.examId);
//     } else if (safeExam.status === '검사중') {
//       console.log('🔄 검사중 → 검사완료:', { roomId, examId: safeExam.examId });
//       onCompleteExam?.(roomId, safeExam.examId);
//     }
//   };

//   const handleCancelClick = (e) => {
//     e.stopPropagation();
//     console.log('❌ 검사 취소:', safeExam.examId);
//     onCancelExam?.(safeExam.examId);
//   };

//   const handleMouseEnter = (e) => {
//     if (safeExam.status !== '검사완료') {
//       e.target.style.transform = 'translateY(-1px)';
//       e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
//     }
//   };

//   const handleMouseLeave = (e) => {
//     if (safeExam.status !== '검사완료') {
//       e.target.style.transform = 'translateY(0)';
//       e.target.style.boxShadow = 'none';
//     }
//   };

//   return (
//     <div 
//       className={`exam-card ${safeRadiologist.color}`}
//       style={{ 
//         position: 'absolute',
//         top: `${finalTopPosition}px`,
//         left: '0',
//         right: '0',
//         height: `${finalHeight}px`,
//         minHeight: `${minHeight}px`,
//         background: 'white',
//         borderRadius: '0.375rem',
//         boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
//         borderLeft: `4px solid ${
//           safeRadiologist.color === 'radiologist-blue' ? '#3b82f6' :
//           safeRadiologist.color === 'radiologist-green' ? '#10b981' :
//           safeRadiologist.color === 'radiologist-purple' ? '#8b5cf6' :
//           safeRadiologist.color === 'radiologist-orange' ? '#f59e0b' : '#6b7280'
//         }`,
//         overflow: 'hidden',
//         zIndex: 2,
//         transition: 'box-shadow 0.2s'
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
//       }}
//     >
//       <div 
//         className="exam-card-content" 
//         style={{
//           padding: '0.75rem',
//           height: '100%',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'flex-start',
//           gap: '0.5rem'
//         }}
//       >
//         {/* 왼쪽 정보 영역 */}
//         <div 
//           className="exam-info" 
//           style={{
//             flex: 1,
//             minWidth: 0,
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '0.25rem'
//           }}
//         >
//           {/* 환자명 */}
//           <div style={{
//             fontWeight: '600',
//             color: '#1e293b',
//             fontSize: '0.875rem',
//             whiteSpace: 'nowrap',
//             overflow: 'hidden',
//             textOverflow: 'ellipsis'
//           }}>
//             {safeExam.patientName}
//           </div>
          
//           {/* 검사 정보 */}
//           <div style={{
//             color: '#6b7280',
//             fontSize: '0.75rem',
//             whiteSpace: 'nowrap',
//             overflow: 'hidden',
//             textOverflow: 'ellipsis'
//           }}>
//             {safeExam.examType}
//           </div>
          
//           {/* 시간 정보 */}
//           <div style={{
//             color: '#3b82f6',
//             fontSize: '0.75rem',
//             fontWeight: '500'
//           }}>
//             {safeExam.time} ~ {endTime || '시간 미정'}
//           </div>
          
//           {/* 판독의 */}
//           <div style={{
//             color: '#374151',
//             fontSize: '0.75rem',
//             whiteSpace: 'nowrap',
//             overflow: 'hidden',
//             textOverflow: 'ellipsis'
//           }}>
//             Dr. {safeRadiologist.name}
//           </div>
//         </div>
        
//         {/* 오른쪽 상태/버튼 영역 */}
//         <div style={{
//           position: 'relative',
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'flex-end',
//           justifyContent: 'center',
//           flexShrink: 0,
//           minWidth: '65px',
//           height: '100%'
//         }}>
//           {/* 상태 버튼 */}
//           <div
//             onClick={handleStatusClick}
//             style={getStatusStyle(safeExam.status)}
//             onMouseEnter={handleMouseEnter}
//             onMouseLeave={handleMouseLeave}
//           >
//             {safeExam.status}
//           </div>
          
//           {/* 취소 버튼 */}
//           <div 
//             onClick={handleCancelClick}
//             title="검사 취소"
//             style={{
//               position: 'absolute',
//               top: '5px',
//               right: '5px',
//               width: '18px',
//               height: '18px',
//               backgroundColor: '#ef4444',
//               color: 'white',
//               borderRadius: '50%',
//               fontSize: '12px',
//               fontWeight: 'bold',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               lineHeight: '1',
//               zIndex: '999',
//               transition: 'all 0.2s ease',
//               userSelect: 'none',
//               border: '1px solid white',
//               boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
//             }}
//             onMouseEnter={(e) => {
//               e.target.style.backgroundColor = '#dc2626';
//               e.target.style.transform = 'scale(1.1)';
//             }}
//             onMouseLeave={(e) => {
//               e.target.style.backgroundColor = '#ef4444';
//               e.target.style.transform = 'scale(1)';
//             }}
//           >
//             ×
//           </div>
//         </div>
//       </div>  
//     </div>
//   );
// };

// export default ExamCard;

import React from 'react';

const ExamCard = ({
  exam,
  radiologist,
  endTime,
  topPosition,
  cardHeight,
  onStartExam,
  onCompleteExam,
  onCancelExam,
  onUnassignExam, // ✅ 배정 취소 함수
  roomId
}) => {

  // ✅ 1. 시간 보정 함수
  const normalizeTime = (timeStr) => {
    if (!timeStr || timeStr === '00:00' || timeStr === '시간 없음') return '09:00';
    const [h, m] = timeStr.split(':').map(Number);
    if (h < 6 || h > 18) return '09:00';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // ✅ 2. 종료 시간 계산 함수
  const getEndTime = (startTime, duration = 30) => {
    const [h, m] = startTime.split(':').map(Number);
    const startDate = new Date(0, 0, 0, h, m);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const hh = String(endDate.getHours()).padStart(2, '0');
    const mm = String(endDate.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // ✅ 3. 디버깅 로그
  console.log('🔍 ExamCard 렌더링:', { 
    patientName: exam.patientName, 
    time: exam.time, 
    topPosition, 
    cardHeight,
    exam, 
    roomId 
  });

  // 🔧 필수 데이터 검증
  if (!exam || !exam.patientName) {
    console.warn('⚠️ ExamCard: 필수 데이터 누락', exam);
    return null;
  }
  
  const normalizedTime = normalizeTime(exam.time);
  
  // 🔧 안전한 기본값 설정
  const safeExam = {
    patientName: exam.patientName || '환자명 없음',
    examType: exam.examType || exam.type || '검사명 없음',
    time: normalizedTime,
    status: exam.status || '검사대기',
    examId: exam.examId || exam.id || `temp-${Date.now()}`,
    duration: exam.duration || 30
  };

  const safeRadiologist = radiologist || { 
    name: '미배정', 
    color: 'radiologist-blue' 
  };

  // 🔧 최소 높이 보장
  const minHeight = 80;
  const finalHeight = Math.max(cardHeight || minHeight, minHeight);
  const finalTopPosition = Math.max(topPosition || 0, 0);

  // 🔧 상태별 스타일
  const getStatusStyle = (status) => {
    const baseStyle = {
      fontSize: '0.75rem',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      minWidth: '60px',
      maxWidth: '60px',
      width: '60px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: status === '검사완료' ? 'default' : 'pointer',
      opacity: status === '검사완료' ? 0.7 : 1,
      transition: 'all 0.2s ease',
      userSelect: 'none',
      boxSizing: 'border-box',
      border: 'none',
      outline: 'none'
    };

    switch (status) {
      case '검사대기':
        return { ...baseStyle, background: '#dbeafe', color: '#2563eb' };
      case '검사중':
        return { ...baseStyle, background: '#dcfce7', color: '#16a34a' };
      case '검사완료':
        return { ...baseStyle, background: '#f3e8ff', color: '#9333ea' };
      default:
        return { ...baseStyle, background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const handleStatusClick = () => {
    if (safeExam.status === '검사대기') {
      console.log('🔄 검사대기 → 검사중:', { roomId, examId: safeExam.examId });
      onStartExam?.(roomId, safeExam.examId);
    } else if (safeExam.status === '검사중') {
      console.log('🔄 검사중 → 검사완료:', { roomId, examId: safeExam.examId });
      onCompleteExam?.(roomId, safeExam.examId);
    }
  };

  // ✅ 배정 취소 처리 (X 버튼) - 무조건 워크리스트 복귀
  const handleUnassignClick = (e) => {
    e.stopPropagation();
    
    // ✅ 검사 상태 상관없이 무조건 배정 취소 (워크리스트로 복귀)
    console.log('🔄 배정 취소 (워크리스트로 복귀):', safeExam.examId, '상태:', safeExam.status);
    onUnassignExam?.(safeExam.examId, roomId);
  };

  const handleMouseEnter = (e) => {
    if (safeExam.status !== '검사완료') {
      e.target.style.transform = 'translateY(-1px)';
      e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }
  };

  const handleMouseLeave = (e) => {
    if (safeExam.status !== '검사완료') {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'none';
    }
  };

  return (
    <div 
      className={`exam-card ${safeRadiologist.color}`}
      style={{ 
        position: 'absolute',
        top: `${finalTopPosition}px`,
        left: '0',
        right: '0',
        height: `${finalHeight}px`,
        minHeight: `${minHeight}px`,
        background: 'white',
        borderRadius: '0.375rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        borderLeft: `4px solid ${
          safeRadiologist.color === 'radiologist-blue' ? '#3b82f6' :
          safeRadiologist.color === 'radiologist-green' ? '#10b981' :
          safeRadiologist.color === 'radiologist-purple' ? '#8b5cf6' :
          safeRadiologist.color === 'radiologist-orange' ? '#f59e0b' : '#6b7280'
        }`,
        overflow: 'hidden',
        zIndex: 2,
        transition: 'box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
      }}
    >
      <div 
        className="exam-card-content" 
        style={{
          padding: '0.75rem',
          height: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}
      >
        {/* 왼쪽 정보 영역 */}
        <div 
          className="exam-info" 
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          {/* 환자명 */}
          <div style={{
            fontWeight: '600',
            color: '#1e293b',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {safeExam.patientName}
          </div>
          
          {/* 검사 정보 */}
          <div style={{
            color: '#6b7280',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {safeExam.examType}
          </div>
          
          {/* 시간 정보 */}
          <div style={{
            color: '#3b82f6',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {safeExam.time} ~ {endTime || '시간 미정'}
          </div>
          
          {/* 판독의 */}
          <div style={{
            color: '#374151',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Dr. {safeRadiologist.name}
          </div>
        </div>
        
        {/* 오른쪽 상태/버튼 영역 */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          flexShrink: 0,
          minWidth: '65px',
          height: '100%'
        }}>
          {/* 상태 버튼 */}
          <div
            onClick={handleStatusClick}
            style={getStatusStyle(safeExam.status)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {safeExam.status}
          </div>
          
          {/* ✅ 배정 취소 버튼 - 항상 워크리스트 복귀 */}
          <div 
            onClick={handleUnassignClick}
            title="배정 취소 (워크리스트로 복귀)"
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '18px',
              height: '18px',
              backgroundColor: '#f59e0b', // 항상 주황색 - 배정 취소
              color: 'white',
              borderRadius: '50%',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              zIndex: '999',
              transition: 'all 0.2s ease',
              userSelect: 'none',
              border: '1px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#d97706'; // 더 진한 주황색
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f59e0b'; // 원래 주황색
              e.target.style.transform = 'scale(1)';
            }}
          >
            ×
          </div>
        </div>
      </div>  
    </div>
  );
};

export default ExamCard;