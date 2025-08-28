// src/components/EMR/home/CurrentWaitTime.jsx - 깔끔한 디자인

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const CurrentWaitTime = ({ waitingList }) => {
  const [avgWait, setAvgWait] = useState(null);

  useEffect(() => {
    if (!waitingList || waitingList.length === 0) {
      setAvgWait(0);
      return;
    }
    
    const validWaitTimes = waitingList
      .map(p => {
        const waitMinutes = typeof p.waitTime === 'number' && !isNaN(p.waitTime) ? p.waitTime : null;
        return waitMinutes;
      })
      .filter(d => d !== null);

    setAvgWait(
      validWaitTimes.length === 0
        ? 0
        : Math.round(validWaitTimes.reduce((a,c) => a+c,0) / validWaitTimes.length)
    );
  }, [waitingList]);

  return (
    <div style={{
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--light-gray)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        border: '1px solid var(--gray-200)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          color: 'var(--primary-purple-light)',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          <Clock size={24} />
          <span>평균 대기시간</span>
        </div>
        
        <div style={{
          fontSize: '3rem',
          fontWeight: '800',
          color: 'var(--primary-purple)',
          lineHeight: '1',
          marginBottom: '0.5rem'
        }}>
          {avgWait === null 
            ? '...'
            : avgWait === 0
              ? '0'
              : avgWait
          }
        </div>
        
        <div style={{
          fontSize: '1.2rem',
          color: 'var(--gray-600)',
          fontWeight: '500'
        }}>
          {avgWait === null 
            ? '로딩 중'
            : avgWait === 0
              ? '대기 환자 없음'
              : '분'
          }
        </div>
        
        {avgWait > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: avgWait > 30 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: avgWait > 30 ? '#dc2626' : '#16a34a',
            fontWeight: '500'
          }}>
            {avgWait > 30 ? '⚠️ 대기시간이 길어요' : '✅ 원활한 진료중'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentWaitTime;