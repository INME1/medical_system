// src/components/EMR/home/UrgentWidget.jsx - 깔끔한 디자인

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const UrgentWidget = ({
  showActionButtons = true,
  onShowDetail = () => {},
}) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const API_BASE = process.env.REACT_APP_INTEGRATION_API || 'http://35.225.63.41:8000/api/integration/';
  const ALERT_API_ENDPOINT = `${API_BASE}alerts/urgent/`;
  const POLL_INTERVAL_MS = 10000;

  const fetchUrgentAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(ALERT_API_ENDPOINT);
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ 긴급 알림 불러오기 실패:', err);
      setError('긴급 알림을 불러오지 못했습니다.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [ALERT_API_ENDPOINT]);

  useEffect(() => {
    fetchUrgentAlerts();
    const interval = setInterval(fetchUrgentAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUrgentAlerts]);

  const mappedUrgentEvents = alerts.map(alert => {
    let patientName = '';
    let patientId = '';
    let value = '';
    let unit = '';
    let recommended = '';
    let atTime = new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    switch(alert.type) {
        case 'SPO2':
            patientName = alert.message.includes(' - ') ? alert.message.split(' - ')[1].trim() : '환자 정보 없음';
            patientId = alert.message.match(/ID (\d+)/) ? alert.message.match(/ID (\d+)/)[1] : '';
            value = alert.message.match(/SpO₂ (.+?)%/) ? alert.message.match(/SpO₂ (.+?)%/)[1] : '';
            unit = '%';
            recommended = '산소 투여';
            break;
        case 'BP':
            patientName = alert.message.includes(' - ') ? alert.message.split(' - ')[1].trim() : '환자 정보 없음';
            patientId = alert.message.match(/ID (\d+)/) ? alert.message.match(/ID (\d+)/)[1] : '';
            const bpMatch = alert.message.match(/혈압\s*(.+)/);
            value = bpMatch && bpMatch[1] ? bpMatch[1].split(' - ')[0].trim() : '';
            unit = '';
            recommended = '혈압약 투여';
            break;
        case 'AI_ERR':
            patientName = alert.message.includes(' - ') ? alert.message.split(' - ')[1].trim() : '환자 정보 없음';
            patientId = alert.message.match(/ID (\d+)/) ? alert.message.match(/ID (\d+)/)[1] : '';
            recommended = '재시도';
            break;
        case 'DELAY':
            patientName = alert.message.includes(' - ') ? alert.message.split(' - ')[1].trim() : '환자 정보 없음';
            patientId = alert.message.match(/ID (\d+)/) ? alert.message.match(/ID (\d+)/)[1] : '';
            recommended = '담당자 확인';
            break;
        default:
            patientName = alert.message.split(' - ')[0];
            patientId = '';
            value = '';
            unit = '';
            recommended = '확인 필요';
    }

    return {
      id: alert.id,
      type: alert.type,
      patient: patientName,
      patient_id: patientId,
      value: value,
      unit: unit,
      at: atTime,
      severity: 'high',
      recommended: recommended,
      raw_message: alert.message,
    };
  });

  const handleDetailClick = async (event) => {
    setLoadingId(event.id);
    try {
      await axios.patch(`${API_BASE}alerts/${event.id}/mark-read/`, { is_read: true });
      alert(`알림 "${event.raw_message}"을(를) 읽음 처리했습니다.`);
      fetchUrgentAlerts();
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
      alert('알림 읽음 처리에 실패했습니다: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        color: 'var(--gray-700)',
        fontSize: '1rem',
        fontWeight: '600'
      }}>
        <AlertCircle size={20} style={{ color: '#ef4444' }} />
        <span>긴급 처리</span>
        {loading ? (
          <Loader2 size={16} className="spin" style={{ color: '#ef4444' }} />
        ) : error ? (
          <span style={{ color: 'red', fontSize: '0.8rem' }}> (에러)</span>
        ) : (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            marginLeft: 'auto'
          }}>
            {mappedUrgentEvents.length}
          </span>
        )}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--gray-500)',
            padding: '2rem 0',
            fontSize: '0.9rem'
          }}>
            알림 로딩 중...
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            color: '#dc2626',
            padding: '2rem 0',
            fontSize: '0.9rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        ) : mappedUrgentEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--gray-500)',
            padding: '2rem 0',
            fontSize: '0.9rem',
            backgroundColor: 'var(--light-gray)',
            borderRadius: '12px',
            border: '1px solid var(--gray-200)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={32} style={{ color: 'var(--accent-purple)' }} />
            <span>새로운 긴급 알림이 없습니다</span>
          </div>
        ) : (
          mappedUrgentEvents.map(ev => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--white)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderLeft: '4px solid #ef4444',
                borderRadius: '8px',
                padding: '1rem',
                gap: '0.75rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                flexShrink: 0,
                animation: 'pulse 2s infinite'
              }}></div>
              
              <div style={{ flex: 1, lineHeight: 1.4 }}>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: 'var(--gray-800)',
                  fontSize: '0.9rem'
                }}>
                  {ev.patient} {ev.patient_id && `(ID ${ev.patient_id})`}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--gray-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>
                    {ev.type === 'SPO2'
                      ? `SpO₂ ${ev.value}${ev.unit}`
                      : ev.type === 'BP'
                      ? `혈압 ${ev.value}`
                      : ev.type === 'AI_ERR'
                      ? 'AI 판독 오류'
                      : ev.value !== null && ev.value !== undefined
                      ? `${ev.value}${ev.unit}`
                      : ev.raw_message}
                  </span>
                  <span>•</span>
                  <span>{ev.at}</span>
                </div>
              </div>
              
              {showActionButtons && (
                <button
                  onClick={() => handleDetailClick(ev)}
                  disabled={loadingId === ev.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary-purple)',
                    color: 'white',
                    cursor: loadingId === ev.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (loadingId !== ev.id) {
                      e.target.style.backgroundColor = 'var(--primary-purple-dark)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (loadingId !== ev.id) {
                      e.target.style.backgroundColor = 'var(--primary-purple)';
                    }
                  }}
                >
                  {loadingId === ev.id ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    '확인'
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UrgentWidget;