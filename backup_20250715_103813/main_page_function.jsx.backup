// frontend/src/components/Main_page/main_page_function.jsx

import React, { useState, useEffect } from 'react';
import NoticeBoard from './Notics_page';
import './titlepage.css';

// API 서비스 클래스
class MainPageFunctionAPI {
  // ✅ 올바른 BASE_URL 사용
  static BASE_URL = process.env.REACT_APP_API_URL || 'http://35.225.63.41:8000/api/';

  static async request(endpoint, options = {}) {
    try {
      // ✅ main-page-function 경로로 수정
      const response = await fetch(`${this.BASE_URL}main-page-function${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 헬스 체크
  static async healthCheck() {
    return await this.request('/health-check/');
  }

  // 공지사항 관련 API들
  static async getNoticesBoard(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/notices/board/?${queryString}`);
  }

  static async getNoticeDetail(noticeId) {
    return await this.request(`/notices/${noticeId}/`);
  }

  static async createNotice(data) {
    return await this.request('/notices/create/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateNotice(noticeId, data) {
    return await this.request(`/notices/${noticeId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteNotice(noticeId) {
    return await this.request(`/notices/${noticeId}/delete/`, {
      method: 'DELETE'
    });
  }
}

const MainPageFunction = ({ setCurrentTab }) => {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, notices
  const [systemStatus, setSystemStatus] = useState({
    status: 'unknown',
    message: '시스템 상태 확인 중...',
    lastCheck: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // 시스템 상태 확인
  const checkSystemHealth = async () => {
    try {
      const response = await MainPageFunctionAPI.healthCheck();
      setSystemStatus({
        status: response.status,
        message: response.message,
        lastCheck: new Date(response.timestamp)
      });
    } catch (error) {
      console.error('시스템 상태 확인 실패:', error);
      setSystemStatus({
        status: 'error',
        message: '시스템 상태 확인에 실패했습니다.',
        lastCheck: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    checkSystemHealth();
    
    // 5분마다 상태 확인
    const interval = setInterval(checkSystemHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 상태 색상
  const getStatusColor = (status) => {
    const colors = {
      'healthy': '#2ecc71',
      'error': '#e74c3c',
      'unknown': '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  // 상태 아이콘
  const getStatusIcon = (status) => {
    const icons = {
      'healthy': '✅',
      'error': '❌',
      'unknown': '❓'
    };
    return icons[status] || '❓';
  };

  // 뷰 변경 핸들러
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // 메인 대시보드 렌더링
  const renderDashboard = () => (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#2c3e50',
              margin: 0,
              background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🏥 메인 페이지 기능
            </h1>
            <p style={{ color: '#7f8c8d', margin: '0.5rem 0 0 0' }}>
              EMR 시스템의 핵심 기능들을 관리합니다
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={checkSystemHealth}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? '🔄 확인 중...' : '🔄 상태 확인'}
            </button>
          </div>
        </div>
      </div>

      {/* 시스템 상태 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50', marginBottom: '1rem' }}>
          🔧 시스템 상태
        </h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: `rgba(${systemStatus.status === 'healthy' ? '46, 204, 113' : systemStatus.status === 'error' ? '231, 76, 60' : '149, 165, 166'}, 0.1)`,
          borderRadius: '12px',
          border: `1px solid rgba(${systemStatus.status === 'healthy' ? '46, 204, 113' : systemStatus.status === 'error' ? '231, 76, 60' : '149, 165, 166'}, 0.3)`
        }}>
          <div style={{ fontSize: '2rem' }}>
            {getStatusIcon(systemStatus.status)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: getStatusColor(systemStatus.status),
              marginBottom: '0.3rem'
            }}>
              {systemStatus.status === 'healthy' ? '시스템 정상' : 
               systemStatus.status === 'error' ? '시스템 오류' : '상태 확인 중'}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
              {systemStatus.message}
            </div>
            {systemStatus.lastCheck && (
              <div style={{ color: '#95a5a6', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                마지막 확인: {systemStatus.lastCheck.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 기능 메뉴 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50', marginBottom: '1.5rem' }}>
          📋 기능 메뉴
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* 공지사항 게시판 카드 */}
          <div
            onClick={() => handleViewChange('notices')}
            style={{
              background: 'rgba(52, 152, 219, 0.05)',
              border: '1px solid rgba(52, 152, 219, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #3498db'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(52, 152, 219, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#2c3e50', 
              marginBottom: '0.5rem' 
            }}>
              공지사항 게시판
            </h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.95rem', lineHeight: '1.5' }}>
              시스템 공지사항을 작성, 수정, 삭제하고 관리할 수 있습니다.
              중요한 공지는 상단에 고정하여 모든 사용자가 볼 수 있도록 합니다.
            </p>
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3498db',
              color: 'white',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              게시판 열기 →
            </div>
          </div>

          {/* 통계 대시보드 카드 */}
          <div
            onClick={() => setCurrentTab && setCurrentTab('statistics')}
            style={{
              background: 'rgba(243, 156, 18, 0.05)',
              border: '1px solid rgba(243, 156, 18, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #f39c12'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(243, 156, 18, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#2c3e50', 
              marginBottom: '0.5rem' 
            }}>
              통계 대시보드
            </h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.95rem', lineHeight: '1.5' }}>
              EMR 시스템의 전체적인 통계와 현황을 실시간으로 확인할 수 있습니다.
              환자 분포, 의사별 진료 현황, AI 시스템 성능 등을 모니터링합니다.
            </p>
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#f39c12',
              color: 'white',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              대시보드 열기 →
            </div>
          </div>

          {/* 시스템 설정 카드 */}
          <div
            style={{
              background: 'rgba(155, 89, 182, 0.05)',
              border: '1px solid rgba(155, 89, 182, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #9b59b6',
              opacity: 0.7
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#2c3e50', 
              marginBottom: '0.5rem' 
            }}>
              시스템 설정
            </h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.95rem', lineHeight: '1.5' }}>
              EMR 시스템의 전반적인 설정을 관리합니다.
              사용자 권한, 데이터베이스 설정, API 연동 등을 구성할 수 있습니다.
            </p>
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#95a5a6',
              color: 'white',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              준비 중...
            </div>
          </div>

          {/* 사용자 관리 카드 */}
          <div
            style={{
              background: 'rgba(46, 204, 113, 0.05)',
              border: '1px solid rgba(46, 204, 113, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #2ecc71',
              opacity: 0.7
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#2c3e50', 
              marginBottom: '0.5rem' 
            }}>
              사용자 관리
            </h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.95rem', lineHeight: '1.5' }}>
              의사, 간호사, 관리자 등 시스템 사용자들의 계정과 권한을 관리합니다.
              새로운 사용자 등록, 권한 변경, 계정 비활성화 등을 처리합니다.
            </p>
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#95a5a6',
              color: 'white',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              준비 중...
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 공지사항 게시판 렌더링
  const renderNoticeBoard = () => (
    <div>
      {/* 뒤로 가기 버튼 */}
      <div style={{
        padding: '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => handleViewChange('dashboard')}
          style={{
            padding: '0.5rem 1rem',
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#7f8c8d'}
          onMouseOut={(e) => e.target.style.background = '#95a5a6'}
        >
          ← 메인으로 돌아가기
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3rem' }}>
          공지사항 게시판
        </h2>
      </div>
      
      {/* 공지사항 게시판 컴포넌트 */}
      <NoticeBoard />
    </div>
  );

  return (
    <div>
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'notices' && renderNoticeBoard()}
    </div>
  );
};

export default MainPageFunction;