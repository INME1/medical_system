import React, { useState, useEffect } from 'react';

// API 서비스 클래스
class NoticeAPI {
  // ✅ 올바른 BASE_URL 설정
  static BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

  static async request(endpoint, options = {}) {
    try {
      // ✅ 슬래시 처리 개선 - main-page-function/ 으로 수정
      const url = `${this.BASE_URL.replace(/\/$/, '')}/main-page-function${endpoint}`;
      console.log('🔍 API 요청 URL:', url); // 디버깅용
      
      const response = await fetch(url, {
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

  // 공지사항 목록 조회
  static async getNoticesBoard(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/notices/board/?${queryString}`);
  }

  // 공지사항 상세 조회
  static async getNoticeDetail(noticeId) {
    return await this.request(`/notices/${noticeId}/`);
  }

  // 공지사항 생성
  static async createNotice(data) {
    return await this.request('/notices/create/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 공지사항 수정
  static async updateNotice(noticeId, data) {
    return await this.request(`/notices/${noticeId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // 공지사항 삭제
  static async deleteNotice(noticeId) {
    return await this.request(`/notices/${noticeId}/delete/`, {
      method: 'DELETE'
    });
  }
}

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 10,
    search: '',
    type: '',
    show_inactive: false
  });
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 공지사항 목록 로드
  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await NoticeAPI.getNoticesBoard(filters);
      
      if (response.status === 'success') {
        setNotices(response.data);
        setPagination(response.pagination);
        setStatistics(response.statistics);
        setError(null);
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // 페이지 외 필터 변경 시 1페이지로
    }));
  };

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    loadNotices();
  };

  // 공지사항 상세 보기
  const handleViewDetail = async (noticeId) => {
    try {
      const response = await NoticeAPI.getNoticeDetail(noticeId);
      if (response.status === 'success') {
        setSelectedNotice(response.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('공지사항 상세 조회 실패:', error);
      alert('공지사항을 불러올 수 없습니다.');
    }
  };

  // 공지사항 타입별 색상
  const getTypeColor = (type) => {
    const colors = {
      'important': '#e74c3c',
      'update': '#3498db',
      'maintenance': '#f39c12',
      'general': '#95a5a6'
    };
    return colors[type] || '#95a5a6';
  };

  // 공지사항 타입별 아이콘
  const getTypeIcon = (type) => {
    const icons = {
      'important': '🚨',
      'update': '🔄',
      'maintenance': '🔧',
      'general': '📢'
    };
    return icons[type] || '📢';
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '오늘';
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  // 초기 로드
  useEffect(() => {
    loadNotices();
  }, [filters]);

  return (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#2c3e50',
            margin: 0,
            background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📢 공지사항
          </h1>
          
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#2980b9'}
            onMouseOut={(e) => e.target.style.background = '#3498db'}
          >
            + 새 공지사항
          </button>
        </div>

        {/* 통계 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3498db' }}>
              {statistics.total_count || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>전체</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
              {statistics.active_count || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>활성</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(243, 156, 18, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
              {statistics.pinned_count || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>고정</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e74c3c' }}>
              {statistics.type_counts?.important || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>중요</div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input
              type="text"
              placeholder="제목, 내용, 작성자 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.75rem 1rem',
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🔍 검색
            </button>
          </form>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '0.95rem'
            }}
          >
            <option value="">모든 유형</option>
            <option value="important">중요</option>
            <option value="update">업데이트</option>
            <option value="maintenance">점검</option>
            <option value="general">일반</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={filters.show_inactive}
              onChange={(e) => handleFilterChange('show_inactive', e.target.checked)}
            />
            비활성 포함
          </label>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(52, 152, 219, 0.3)',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>공지사항을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#e74c3c' }}>
            <p>⚠️ {error}</p>
            <button
              onClick={loadNotices}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
          </div>
        ) : notices.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#7f8c8d' }}>
            <p>📭 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div>
            {notices.map((notice, index) => (
              <div
                key={notice.id}
                onClick={() => handleViewDetail(notice.id)}
                style={{
                  padding: '1.5rem',
                  borderBottom: index < notices.length - 1 ? '1px solid rgba(230, 230, 228, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: notice.is_pinned ? 'rgba(241, 196, 15, 0.05)' : 'transparent'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(52, 152, 219, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = notice.is_pinned ? 'rgba(241, 196, 15, 0.05)' : 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* 타입 아이콘 */}
                  <div style={{
                    fontSize: '1.5rem',
                    minWidth: '2rem',
                    textAlign: 'center'
                  }}>
                    {getTypeIcon(notice.notice_type)}
                  </div>

                  {/* 공지사항 내용 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      {/* 고정 표시 */}
                      {notice.is_pinned && (
                        <span style={{
                          background: '#f39c12',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '8px',
                          fontWeight: '600'
                        }}>
                          📌 고정
                        </span>
                      )}

                      {/* 타입 배지 */}
                      <span style={{
                        background: getTypeColor(notice.notice_type),
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        {notice.notice_type_display}
                      </span>

                      {/* 상태 표시 */}
                      {!notice.is_valid && (
                        <span style={{
                          background: '#95a5a6',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '8px',
                          fontWeight: '600'
                        }}>
                          만료
                        </span>
                      )}
                    </div>

                    {/* 제목 */}
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4'
                    }}>
                      {notice.title}
                    </h3>

                    {/* 메타 정보 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.85rem',
                      color: '#7f8c8d'
                    }}>
                      <span>👤 {notice.created_by}</span>
                      <span>📅 {formatDate(notice.created_at)}</span>
                      <span>👀 {notice.views || 0}회</span>
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div style={{
                    fontSize: '1.2rem',
                    color: '#bdc3c7',
                    minWidth: '1.5rem',
                    textAlign: 'center'
                  }}>
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.total_pages > 1 && (
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(230, 230, 228, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => handleFilterChange('page', pagination.current_page - 1)}
              disabled={!pagination.has_previous}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: pagination.has_previous ? 'white' : '#f8f9fa',
                color: pagination.has_previous ? '#2c3e50' : '#95a5a6',
                cursor: pagination.has_previous ? 'pointer' : 'not-allowed'
              }}
            >
              이전
            </button>

            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const page = i + Math.max(1, pagination.current_page - 2);
              if (page > pagination.total_pages) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => handleFilterChange('page', page)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: page === pagination.current_page ? '#3498db' : 'white',
                    color: page === pagination.current_page ? 'white' : '#2c3e50',
                    cursor: 'pointer',
                    fontWeight: page === pagination.current_page ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handleFilterChange('page', pagination.current_page + 1)}
              disabled={!pagination.has_next}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: pagination.has_next ? 'white' : '#f8f9fa',
                color: pagination.has_next ? '#2c3e50' : '#95a5a6',
                cursor: pagination.has_next ? 'pointer' : 'not-allowed'
              }}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 공지사항 상세 모달 */}
      {showDetail && selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => {
            setShowDetail(false);
            setSelectedNotice(null);
          }}
          onUpdate={loadNotices}
        />
      )}

      {/* 공지사항 작성 모달 */}
      {showCreateForm && (
        <NoticeCreateModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadNotices();
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// 공지사항 상세 모달 컴포넌트
const NoticeDetailModal = ({ notice, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: notice.title,
    content: notice.content,
    notice_type: notice.notice_type,
    is_active: notice.is_active,
    is_pinned: notice.is_pinned
  });

  const handleUpdate = async () => {
    try {
      await NoticeAPI.updateNotice(notice.id, editData);
      alert('공지사항이 수정되었습니다.');
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (error) {
      alert('수정에 실패했습니다: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        await NoticeAPI.deleteNotice(notice.id);
        alert('공지사항이 삭제되었습니다.');
        onUpdate();
        onClose();
      } catch (error) {
        alert('삭제에 실패했습니다: ' + error.message);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                style={{
                  width: '100%',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#2c3e50',
                margin: 0
              }}>
                {notice.title}
              </h2>
            )}
            
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              fontSize: '0.9rem',
              color: '#7f8c8d'
            }}>
              <span>👤 {notice.created_by}</span>
              <span>📅 {new Date(notice.created_at).toLocaleString('ko-KR')}</span>
              <span>👀 {notice.views}회</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  삭제
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#95a5a6'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div style={{ padding: '2rem' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  공지 유형
                </label>
                <select
                  value={editData.notice_type}
                  onChange={(e) => setEditData({...editData, notice_type: e.target.value})}
                  style={{
                    width: '200px',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                >
                  <option value="general">일반</option>
                  <option value="important">중요</option>
                  <option value="update">업데이트</option>
                  <option value="maintenance">점검</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  내용
                </label>
                <textarea
                  value={editData.content}
                  onChange={(e) => setEditData({...editData, content: e.target.value})}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={editData.is_active}
                    onChange={(e) => setEditData({...editData, is_active: e.target.checked})}
                  />
                  활성화
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={editData.is_pinned}
                    onChange={(e) => setEditData({...editData, is_pinned: e.target.checked})}
                  />
                  상단 고정
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.8',
              color: '#2c3e50',
              whiteSpace: 'pre-wrap'
            }}>
              {notice.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 공지사항 작성 모달 컴포넌트
const NoticeCreateModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notice_type: 'general',
    is_active: true,
    is_pinned: false,
    created_by: 'admin'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      await NoticeAPI.createNotice(formData);
      alert('공지사항이 생성되었습니다.');
      onSuccess();
    } catch (error) {
      alert('생성에 실패했습니다: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>
            새 공지사항 작성
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#95a5a6'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                공지 유형
              </label>
              <select
                value={formData.notice_type}
                onChange={(e) => setFormData({...formData, notice_type: e.target.value})}
                style={{
                  width: '200px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              >
                <option value="general">일반</option>
                <option value="important">중요</option>
                <option value="update">업데이트</option>
                <option value="maintenance">점검</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                내용 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                즉시 활성화
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({...formData, is_pinned: e.target.checked})}
                />
                상단 고정
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                공지사항 등록
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoticeBoard;