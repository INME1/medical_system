// src/components/EMR/home/WaitingStatsPanel.jsx - 깔끔한 디자인

import React from 'react';
import { Users, CheckCircle } from 'lucide-react';

const WaitingStatsPanel = ({ waitingList, completedPatients }) => {
  
  // 환자 이름에서 ID 제거 함수 (P6643 - 김아무개 → 김아무개)
  const cleanPatientName = (displayName) => {
    if (!displayName) return '';
    const parts = displayName.split(' - ');
    return parts.length > 1 ? parts[1] : displayName;
  };

  return (
    <div style={{ 
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      height: '100%'
    }}>
      <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
        {/* 대기 중 환자 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--light-gray)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--primary-purple)',
            fontWeight: '600',
            fontSize: '1rem'
          }}>
            <Users size={20} />
            <span>대기 중</span>
            <span style={{
              backgroundColor: 'var(--primary-purple)',
              color: 'var(--white)',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              marginLeft: 'auto'
            }}>
              {waitingList?.length || 0}명
            </span>
          </div>
          
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {waitingList && waitingList.length > 0
              ? waitingList.slice(0, 4).map((p, i) => (
                  <div 
                    key={p.mapping_id || p.uuid || i} 
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--white)',
                      borderRadius: '8px',
                      border: '1px solid var(--gray-200)',
                      fontSize: '0.9rem',
                      color: 'var(--gray-700)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-purple)',
                      flexShrink: 0
                    }}></div>
                    {cleanPatientName(p.display || p.name)}
                  </div>
                ))
              : <div style={{
                  textAlign: 'center',
                  color: 'var(--gray-500)',
                  fontSize: '0.9rem',
                  padding: '2rem 0'
                }}>
                  대기 중인 환자가 없습니다
                </div>
            }
          </div>
        </div>

        {/* 최근 완료 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--light-gray)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--accent-purple)',
            fontWeight: '600',
            fontSize: '1rem'
          }}>
            <CheckCircle size={20} />
            <span>최근 완료</span>
            <span style={{
              backgroundColor: 'var(--accent-purple)',
              color: 'var(--white)',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              marginLeft: 'auto'
            }}>
              {completedPatients?.length || 0}명
            </span>
          </div>
          
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {completedPatients && completedPatients.length > 0
              ? completedPatients.map((c, i) => (
                  <div 
                    key={c.name + i} 
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--white)',
                      borderRadius: '8px',
                      border: '1px solid var(--gray-200)',
                      fontSize: '0.9rem',
                      color: 'var(--gray-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-purple)',
                        flexShrink: 0
                      }}></div>
                      {cleanPatientName(c.name)}
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--gray-500)'
                    }}>
                      {c.time}
                    </span>
                  </div>
                ))
              : <div style={{
                  textAlign: 'center',
                  color: 'var(--gray-500)',
                  fontSize: '0.9rem',
                  padding: '2rem 0'
                }}>
                  완료된 진료가 없습니다
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingStatsPanel;