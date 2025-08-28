import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Bell, 
  FileText, 
  BarChart3,
  ChevronRight
} from 'lucide-react';

// 기존 컴포넌트들을 import (실제로는 이렇게 import해야 함)
import NoticeBoard from './Notics_page';              // ❗ 오타 확인: Notics vs Notices
import PatientList from './patientsList';           // ✅ 파일명 정확히 확인
import ProviderList from './Medicalemployee';     // ✅ 대소문자 일치 확인
import OCSLogPage from '../OCS/OCSLogPage';          // ✅ 상위 폴더로 이동
import StatisticsBoard from './StatisticsBoard';     // ✅ 동일 폴더 내


const AdminManagementPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    {
      id: 'dashboard',
      label: '관리 대시보드',
      icon: Settings,
      component: () => (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }} onClick={() => setActiveSection('notices')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Bell size={24} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>공지사항</h3>
              <ChevronRight size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              시스템 공지사항 작성 및 관리
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }} onClick={() => setActiveSection('patients')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Users size={24} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>환자 관리</h3>
              <ChevronRight size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              환자 목록 조회 및 관리
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }} onClick={() => setActiveSection('providers')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Users size={24} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>의료진 관리</h3>
              <ChevronRight size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              의료진 정보 조회 및 관리
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }} onClick={() => setActiveSection('logs')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <FileText size={24} color="#8b5cf6" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>시스템 로그</h3>
              <ChevronRight size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              시스템 활동 로그 모니터링
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }} onClick={() => setActiveSection('statistics')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <BarChart3 size={24} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>통계 대시보드</h3>
              <ChevronRight size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              시스템 통계 및 차트 분석
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'notices',
      label: '공지사항',
      icon: Bell,
      component: NoticeBoard
    },
    {
      id: 'patients',
      label: '환자 목록',
      icon: Users,
      component: PatientList
    },
    {
      id: 'providers',
      label: '의료진',
      icon: Users,
      component: ProviderList
    },
    {
      id: 'logs',
      label: '시스템 로그',
      icon: FileText,
      component: OCSLogPage
    },
    {
      id: 'statistics',
      label: '통계',
      icon: BarChart3,
      component: StatisticsBoard
    }
  ];

  const currentItem = menuItems.find(item => item.id === activeSection);
  const CurrentComponent = currentItem?.component;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* 헤더 */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '0.75rem'
            }}>
              <Settings size={24} color="#64748b" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                관리페이지
              </h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
                시스템 관리 및 모니터링
              </p>
            </div>
          </div>
          
          {/* 네비게이션 버튼 */}
          {activeSection !== 'dashboard' && (
            <button
              onClick={() => setActiveSection('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              ← 대시보드로 돌아가기
            </button>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={{ padding: '2rem' }}>
        {CurrentComponent && <CurrentComponent />}
      </main>
    </div>
  );
};

export default AdminManagementPage;