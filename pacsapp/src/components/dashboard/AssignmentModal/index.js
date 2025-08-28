import React from 'react';
import Modal from '../../common/Modal';
import './AssignmentModal.css';

const AssignmentModal = ({
  isOpen,
  onClose,
  modalData,
  rooms = [],        // 🔧 기본값 추가
  radiologists = [], // 🔧 기본값 추가
  selectedRadiologist,
  selectedTime,
  estimatedDuration,
  onRadiologistChange,
  onTimeChange,
  onDurationChange,
  onConfirm
}) => {
  // 🔧 안전한 데이터 확인
  if (!modalData || !modalData.exam) {
    return null;
  }

  // 🔧 안전한 방식으로 검사실 찾기
  const selectedRoom = rooms.find(r => r.id === modalData.roomId) || { name: '알 수 없음' };

  // ✅ timeSlot을 안전하게 처리하고 드롭된 시간대 사용
  const getTimeOptions = () => {
    try {
      let baseHour = 9;
      let baseMinute = 0;
      
      // modalData.timeSlot에서 드롭된 실제 시간 사용
      if (modalData?.timeSlot && typeof modalData.timeSlot === 'string') {
        const parts = modalData.timeSlot.split(':');
        baseHour = parseInt(parts[0]) || 9;
        baseMinute = parseInt(parts[1]) || 0;
        
        console.log('🕐 모달 기준 시간:', modalData.timeSlot, { baseHour, baseMinute });
      }
      
      // 드롭된 시간 주변 ±30분 범위의 시간 옵션 생성
      const options = [];
      for (let i = -3; i <= 3; i++) {
        let minute = baseMinute + (i * 10);
        let hour = baseHour;
        
        // 분 단위 조정
        if (minute >= 60) {
          hour += Math.floor(minute / 60);
          minute = minute % 60;
        } else if (minute < 0) {
          hour -= 1;
          minute = 60 + minute;
        }
        
        // 운영시간 내에서만 (9시-17시)
        if (hour >= 9 && hour <= 17) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          options.push(timeString);
        }
      }
      
      console.log('🕐 생성된 시간 옵션:', options);
      return options;
      
    } catch (error) {
      console.error('시간 옵션 생성 에러:', error);
      return ['09:00', '09:10', '09:20', '09:30', '09:40', '09:50'];
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="검사 배정"
      // ✅ Modal 컴포넌트에 직접 스타일 전달 (오버레이 투명도 수정)
      overlayStyle={{
        background: 'rgba(0, 0, 0, 0.3)', // 30% 투명도로 덜 어둡게
        zIndex: 10000 // 로딩 오버레이보다 높게
      }}
      contentStyle={{
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="assignment-content">
        <div className="assignment-info">
          <p className="room-info">
            검사실 {selectedRoom.name}에 배정
          </p>
          <p className="patient-info">
            환자: {modalData.exam.patientName} - {modalData.exam.examPart} {modalData.exam.modality}
          </p>
        </div>
        
        <div className="form-group">
          <label>담당 방사선사 선택</label>
          <select
            value={selectedRadiologist}
            onChange={(e) => onRadiologistChange(e.target.value)}
            className="assignment-select"
            required
          >
            <option value="">담당의를 선택하세요</option>
            {radiologists.map(radiologist => (
              <option key={radiologist.id} value={radiologist.id}>
                Dr. {radiologist.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>검사 시작 시간 (10분 단위)</label>
          <select
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="assignment-select"
            required
          >
            <option value="">시간을 선택하세요</option>
            {getTimeOptions().map(timeString => (
              <option key={timeString} value={timeString}>
                {timeString}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>예상 소요시간 (10분 단위)</label>
          <select
            value={estimatedDuration}
            onChange={(e) => onDurationChange(e.target.value)}
            className="assignment-select"
            required
          >
            <option value="10">10분</option>
            <option value="20">20분</option>
            <option value="30">30분</option>
            <option value="40">40분</option>
            <option value="50">50분</option>
            <option value="60">60분</option>
          </select>
        </div>
        
        <div className="assignment-actions">
          <button onClick={onClose} className="cancel-button">
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedRadiologist || !selectedTime || !estimatedDuration}
            className="confirm-button"
          >
            배정 확정
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignmentModal;