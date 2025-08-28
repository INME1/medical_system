import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const WaitingBoard = () => {
  const [data, setData] = useState({ waiting: [], assigned_recent: null });
  const [showAlert, setShowAlert] = useState(false);
  const [alertName, setAlertName] = useState('');
  const alertCount = useRef(0);
  const prevAssignedRef = useRef(null);
  const alertTimer = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_INTEGRATION_API}waiting-board/`);
      const newData = res.data;
      
      // ✅ 디버깅을 위한 로그 추가
      console.log('WaitingBoard API Response:', newData);
      
      const prev = prevAssignedRef.current;
      const curr = newData.assigned_recent;

      const isNewAssigned =
        curr && (!prev || prev.name !== curr.name || prev.room !== curr.room);

      if (isNewAssigned && alertCount.current < 3) {
        setAlertName(curr.name);
        setShowAlert(true);
        alertCount.current += 1;

        if (alertTimer.current) clearTimeout(alertTimer.current);
        alertTimer.current = setTimeout(() => setShowAlert(false), 5000);

        prevAssignedRef.current = curr;
      }

      setData(newData);
    } catch (err) {
      console.error('대기 목록 로딩 실패:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(alertTimer.current);
    };
  }, []);

  // ✅ 환자 이름 추출 함수
  const getPatientName = (patient) => {
    // 백엔드에서 실제 환자 이름을 보내주므로 간단히 처리
    if (patient.name) return patient.name;
    if (patient.display) return patient.display;
    
    // 그래도 혹시 모르니 identifier로 fallback
    const identifier = patient.patient_identifier || patient.identifier;
    if (identifier && identifier !== patient.uuid) {
      return identifier;
    }
    
    return '이름 없음';
  };

  const maskName = (name) => {
    if (!name || name.length <= 1) return name;
    
    // 실제 환자 이름이므로 일반적인 마스킹만 적용
    return name
      .split(' ')
      .map(part => {
        if (part.length <= 1) return part;
        if (part.length === 2) return part[0] + '*';
        return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
      })
      .join(' ');
  };

  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'Arial, sans-serif',
      height: '100vh',
      padding: '1rem',
      backgroundColor: '#f5f8fa',
    },
    waitingArea: {
      flex: 3,
      paddingRight: '1rem',
    },
    examRooms: {
      flex: 1,
      borderLeft: '1px solid #ccc',
      paddingLeft: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    title: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '0.8rem',
    },
    patientBox: {
      background: '#eee',
      padding: '0.6rem',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      fontSize: '1rem',
      textAlign: 'center',
    },
    roomBox: {
      background: '#e2f0ff',
      padding: '0.7rem',
      borderRadius: '6px',
      fontSize: '0.95rem',
    },
    roomTitle: {
      fontWeight: 'bold',
      marginBottom: '0.3rem',
    },
    alert: {
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#ffecd2',
      padding: '1.5rem 3rem',
      borderRadius: '12px',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'fadeInOut 5s ease-in-out',
    },
    debugInfo: {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#fff',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '12px',
      maxWidth: '300px',
      opacity: 0.8,
      zIndex: 1000,
    },
  };

  // ✅ return 문이 WaitingBoard 함수 안에 있어야 함
  return (
    <div style={styles.wrapper}>
      {/* ✅ 디버깅 정보 표시 (개발 시에만 사용) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={styles.debugInfo}>
          <strong>디버그 정보:</strong><br/>
          대기 환자 수: {data.waiting.length}<br/>
          최근 배정: {data.assigned_recent ? JSON.stringify(data.assigned_recent) : '없음'}
        </div>
      )}

      {showAlert && (
        <div style={styles.alert}>
          {maskName(alertName)}님 진료실로 입장해주세요
        </div>
      )}

      {/* 좌측 - 대기환자 목록 */}
      <div style={styles.waitingArea}>
        <div style={styles.title}>총 대기 인원: {data.waiting.length}명</div>
        {data.waiting.length > 0 ? (
          data.waiting.map((p, i) => {
            // ✅ 환자 이름 추출 및 마스킹
            const patientName = getPatientName(p);
            const maskedName = maskName(patientName);
            
            return (
              <div key={i} style={styles.patientBox}>
                {maskedName}
                {/* ✅ 개발 환경에서만 원본 데이터 표시 */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                    원본: {JSON.stringify(p, null, 2)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ color: '#888', textAlign: 'center' }}>대기 중인 환자 없음</div>
        )}
      </div>

      {/* 우측 - 진료실 */}
      <div style={styles.examRooms}>
        {[1, 2].map((room) => {
          const matched = data.assigned_recent?.room === room;
          const assignedPatientName = matched ? 
            getPatientName(data.assigned_recent) : null;
          
          return (
            <div key={room} style={styles.roomBox}>
              <div style={styles.roomTitle}>진료실 {room}</div>
              <div>
                {assignedPatientName ? maskName(assignedPatientName) : '환자 없음'}
              </div>
              {/* ✅ 개발 환경에서만 원본 데이터 표시 */}
              {process.env.NODE_ENV === 'development' && matched && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  원본: {JSON.stringify(data.assigned_recent, null, 2)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ CSS 애니메이션 추가 */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `}</style>
    </div>
  );
}; // ✅ WaitingBoard 함수가 여기서 끝남

export default WaitingBoard;