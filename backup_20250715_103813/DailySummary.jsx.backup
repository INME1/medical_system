// src/components/EMR/home/DailySummary.jsx - 깔끔한 디자인

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Brain, Camera } from 'lucide-react';

const DailySummary = () => {
  const [summaryStats, setSummaryStats] = useState({
    total_consultations: '-',
    ai_analysis_count: 2,
    imaging_exam_count: 3,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_INTEGRATION_API || 'http://35.225.63.41:8000/api/integration/';
  const COMPLETED_PATIENTS_API = `${API_BASE}completed-patients/`;
  const POLL_INTERVAL_MS = 15000;

  const fetchSummaryStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const completedRes = await axios.get(COMPLETED_PATIENTS_API);
      let completedCount = 0;
      
      if (completedRes.data.success) {
        completedCount = completedRes.data.total_completed || 0;
      }

      setSummaryStats({
        total_consultations: completedCount,
        ai_analysis_count: 2,
        imaging_exam_count: 3,
      });
      
    } catch (err) {
      console.error('❌ 일일 요약 통계 불러오기 실패:', err);
      setError('통계 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryStats();
    const interval = setInterval(fetchSummaryStats, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const summaryItems = [
    {
      icon: FileText,
      label: '총 진료 건수',
      value: loading ? '...' : error ? '오류' : `${summaryStats.total_consultations}`,
      unit: '건',
      description: '완료된 진료 건수',
      color: 'var(--primary-purple)',
      bgColor: 'rgba(139, 90, 150, 0.1)'
    },
    {
      icon: Brain,
      label: 'AI 분석 건수',
      value: loading ? '...' : error ? '오류' : `${summaryStats.ai_analysis_count}`,
      unit: '건',
      description: 'CDSS 활용도',
      color: 'var(--accent-purple)',
      bgColor: 'rgba(187, 143, 206, 0.1)'
    },
    {
      icon: Camera,
      label: '영상 검사 수',
      value: loading ? '...' : error ? '오류' : `${summaryStats.imaging_exam_count}`,
      unit: '건',
      description: 'Radiology 활용률',
      color: 'var(--primary-purple-dark)',
      bgColor: 'rgba(125, 60, 152, 0.1)'
    }
  ];

  return (
    <div style={{ 
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%'
    }}>
      {summaryItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div 
            key={index}
            style={{
              flex: 1,
              background: item.bgColor,
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${item.color}20`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 4px 12px ${item.color}20`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <div style={{
              backgroundColor: item.color,
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={24} color="white" />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--gray-600)',
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>
                {item.label}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: '800',
                  color: item.color,
                  lineHeight: '1'
                }}>
                  {item.value}
                </span>
                <span style={{
                  fontSize: '1rem',
                  color: 'var(--gray-600)',
                  fontWeight: '500'
                }}>
                  {item.unit}
                </span>
              </div>
              
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--gray-500)'
              }}>
                {item.description}
              </div>
            </div>
          </div>
        );
      })}
      
      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#dc2626',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default DailySummary;