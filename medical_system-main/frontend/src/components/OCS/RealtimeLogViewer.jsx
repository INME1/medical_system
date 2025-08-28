import React from 'react';

/**
 * 부모 컴포넌트(EmrMainPage)로부터 'logs'를 props로 받아서
 * 실시간 요청 내용을 보여주기만 하는 간단한 컴포넌트입니다.
 */
const RealtimeLogViewer = ({ logs }) => {
  
  if (!Array.isArray(logs)) {
    return (
        <div style={styles.logContainer}>
            <p style={styles.noLogsText}>로그 데이터를 불러오는 중입니다.</p>
        </div>
    );
  }

  return (
    <div style={styles.logContainer}>
      {logs.length === 0 ? (
        <p style={styles.noLogsText}>요청 기록이 없습니다.</p>
      ) : (
        <div style={styles.logList}>
          {logs.map((log) => (
            <div key={log.timestamp} style={getLogItemStyle(log.status)}>
              <div style={styles.logHeader}>
                <strong>
                  {log.status === 'success' ? '✅ 성공' : log.status === 'error' ? '❌ 실패' : '⏳ 요청 중'}
                </strong>
                <span style={styles.timestamp}>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p style={styles.logRequestInfo}>
                {log.request.patient_name} - {log.request.modality} {log.request.body_part}
              </p>
              <details style={styles.logDetails}>
                <summary>자세히 보기</summary>
                <strong>Request:</strong>
                <pre style={styles.logContent}>{JSON.stringify(log.request, null, 2)}</pre>
                <strong>Response:</strong>
                <pre style={styles.logContent}>{JSON.stringify(log.response, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 로그 상태에 따른 스타일링 함수
const getLogItemStyle = (status) => {
  const baseStyle = {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '10px',
    borderLeft: '5px solid',
    backgroundColor: '#fff',
  };
  if (status === 'success') return { ...baseStyle, borderLeftColor: '#28a745' };
  if (status === 'error') return { ...baseStyle, borderLeftColor: '#dc3545' };
  return { ...baseStyle, borderLeftColor: '#ffc107' }; // 'pending'
};

// 스타일 객체
const styles = {
  logContainer: { padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column' },
  noLogsText: { color: '#6c757d', fontSize: '14px', textAlign: 'center', marginTop: '20px' },
  logList: { maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', paddingRight: '5px' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' },
  timestamp: { fontSize: '11px', color: '#6c757d', fontWeight: 'normal' },
  logRequestInfo: { fontSize: '13px', margin: '0 0 8px 0', color: '#495057' },
  logDetails: { fontSize: '12px', cursor: 'pointer' },
  logContent: { backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '11px', marginTop: '5px', color: '#212529', maxHeight: '200px', overflowY: 'auto' },
};

export default RealtimeLogViewer;