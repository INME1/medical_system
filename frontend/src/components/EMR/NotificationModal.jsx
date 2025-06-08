// src/components/EMR/NotificationModal.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationModal = ({ onClose, onMark }) => {
  const [alerts, setAlerts] = useState([]);
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    // 모달 열 때 최신 알림 로드
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/integration/alerts/urgent/`
      );
      setAlerts(res.data);
    } catch (err) {
      console.error('알림 목록 조회 실패', err);
    }
  };

  const markRead = async (id) => {
    setLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/integration/alerts/${id}/mark-read/`,
        { is_read: true }
      );
      // 읽음 처리된 알림 제거
      setAlerts(prev => prev.filter(a => a.id !== id));
      onMark(); // 벨 카운트 갱신
    } catch (err) {
      console.error('읽음 처리 실패', err);
      alert('읽음 처리 중 오류가 발생했습니다.');
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🔔 알림</h2>
          <button onClick={onClose} aria-label="닫기">✕</button>
        </header>
        <div style={{ maxHeight: '60vh', overflowY: 'auto', marginTop: 8 }}>
          {alerts.length === 0 ? (
            <p>새로운 알림이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {alerts.map(a => (
                <li key={a.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                  <div>
                    <strong>[{a.type}]</strong> {a.message}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                  <button
                    onClick={() => markRead(a.id)}
                    disabled={loadingMap[a.id]}
                    style={{
                      marginTop: 4,
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      cursor: loadingMap[a.id] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loadingMap[a.id] ? '처리 중...' : '읽음 표시'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
