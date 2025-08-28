// // pacsapp/src/components/home/NoticeSection/index.js
// // 이 파일을 완전히 새로 만들어주세요

// import React, { useState, useEffect } from 'react';
// import './NoticeSection.css';

// // 🔧 noticeService import를 안전하게 처리
// let noticeService;
// try {
//   const noticeServiceModule = require('../../../services/noticeService');
//   noticeService = noticeServiceModule.noticeService;
//   console.log('✅ noticeService import 성공');
// } catch (error) {
//   console.error('❌ noticeService import 실패:', error);
//   // 더미 서비스 생성
//   noticeService = {
//     getSystemNotices: async () => {
//       return [
//         {
//           id: 1,
//           title: '[서비스 연결 오류] noticeService를 불러올 수 없습니다',
//           content: 'noticeService 파일을 확인하세요.',
//           created_at: new Date().toISOString(),
//           is_important: true
//         }
//       ];
//     },
//     getRISNotices: async () => {
//       return [
//         {
//           id: 2,
//           title: '[서비스 연결 오류] noticeService를 불러올 수 없습니다',
//           content: 'noticeService 파일을 확인하세요.',
//           created_at: new Date().toISOString(),
//           is_important: true
//         }
//       ];
//     }
//   };
// }

// // Modal 컴포넌트를 안전하게 import
// let Modal;
// try {
//   Modal = require('../../common/Modal').default;
//   console.log('✅ Modal import 성공');
// } catch (error) {
//   console.error('❌ Modal import 실패:', error);
//   // 간단한 Modal 대체
//   Modal = ({ isOpen, onClose, title, children }) => {
//     if (!isOpen) return null;
//     return (
//       <div style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         background: 'rgba(0,0,0,0.5)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 9999
//       }} onClick={onClose}>
//         <div style={{
//           background: 'white',
//           borderRadius: '8px',
//           padding: '2rem',
//           maxWidth: '500px',
//           width: '90%',
//           maxHeight: '80vh',
//           overflow: 'auto'
//         }} onClick={(e) => e.stopPropagation()}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: '1rem'
//           }}>
//             <h3 style={{ margin: 0 }}>{title}</h3>
//             <button onClick={onClose} style={{
//               background: 'none',
//               border: 'none',
//               fontSize: '1.5rem',
//               cursor: 'pointer'
//             }}>×</button>
//           </div>
//           {children}
//         </div>
//       </div>
//     );
//   };
// }

// const NoticeSection = ({ type, title }) => {
//   const [notices, setNotices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedNotice, setSelectedNotice] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     const fetchNotices = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         console.log('📢 공지사항 조회 시작:', { type, title });
        
//         let noticeData = [];
        
//         // type에 따라 다른 서비스 함수 호출
//         if (type === 'system') {
//           console.log('🔗 Fetching system notices');
//           noticeData = await noticeService.getSystemNotices();
//         } else if (type === 'ris') {
//           console.log('🔗 Fetching RIS notices');
//           noticeData = await noticeService.getRISNotices();
//         } else {
//           console.log('🔗 Fetching default notices');
//           noticeData = await noticeService.getSystemNotices();
//         }
        
//         console.log('📢 공지사항 조회 결과:', noticeData);
        
//         // API 응답 구조에 맞게 데이터 처리
//         let processedNotices = [];
        
//         if (Array.isArray(noticeData)) {
//           processedNotices = noticeData;
//         } else if (noticeData && Array.isArray(noticeData.data)) {
//           processedNotices = noticeData.data;
//         } else {
//           console.warn('⚠️ Unexpected data structure:', noticeData);
//           processedNotices = [];
//         }
        
//         // 공지사항 정렬: 중요 공지 우선, 그 다음 최신순
//         const sortedNotices = processedNotices.sort((a, b) => {
//           if (a.is_important && !b.is_important) return -1;
//           if (!a.is_important && b.is_important) return 1;
//           return new Date(b.created_at) - new Date(a.created_at);
//         });
        
//         console.log('📢 정렬된 공지사항:', sortedNotices);
//         setNotices(sortedNotices);
        
//       } catch (err) {
//         console.error('📢 공지사항 조회 실패:', err);
//         setError(`공지사항을 불러올 수 없습니다. (${type})`);
//         setNotices([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchNotices();
//   }, [type, title]);

//   // 공지사항 클릭 핸들러
//   const handleNoticeClick = (notice) => {
//     setSelectedNotice(notice);
//     setIsModalOpen(true);
//   };

//   // 모달 닫기 핸들러
//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedNotice(null);
//   };

//   // 안전한 날짜 포맷팅
//   const formatDate = (dateString) => {
//     try {
//       if (!dateString) return '날짜 없음';
//       return new Date(dateString).toLocaleDateString('ko-KR');
//     } catch (error) {
//       return '날짜 없음';
//     }
//   };

//   // 중요도 확인 함수
//   const isImportantNotice = (notice) => {
//     return notice.is_important === true || notice.is_pinned === true;
//   };

//   if (loading) {
//     return (
//       <div className="notice-section">
//         <div className="notice-header">{title}</div>
//         <div className="loading">로딩 중...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="notice-section">
//         <div className="notice-header">{title}</div>
//         <div className="error">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="notice-section">
//       <div className="notice-header">{title}</div>
//       <div className="notice-list">
//         {notices && notices.length > 0 ? (
//           notices.map((notice) => (
//             <div 
//               key={notice.id} 
//               className={`notice-item ${isImportantNotice(notice) ? 'important' : ''}`}
//               onClick={() => handleNoticeClick(notice)}
//             >
//               <div className="notice-date">
//                 {formatDate(notice.created_at)}
//                 {isImportantNotice(notice) && (
//                   <span style={{
//                     marginLeft: '0.5rem',
//                     background: '#ef4444',
//                     color: 'white',
//                     fontSize: '0.625rem',
//                     padding: '0.125rem 0.375rem',
//                     borderRadius: '0.25rem',
//                     fontWeight: '600'
//                   }}>
//                     중요
//                   </span>
//                 )}
//               </div>
//               <div className="notice-title">{notice.title}</div>
//             </div>
//           ))
//         ) : (
//           <div className="notice-item" style={{ textAlign: 'center', color: '#6b7280' }}>
//             등록된 공지사항이 없습니다.
//           </div>
//         )}
//       </div>

//       {/* 공지사항 상세 모달 */}
//       <Modal
//         isOpen={isModalOpen}
//         onClose={handleCloseModal}
//         title={selectedNotice?.title}
//       >
//         {selectedNotice && (
//           <div>
//             <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
//               작성일: {formatDate(selectedNotice.created_at)}
//             </div>
//             <div style={{ lineHeight: '1.6', color: '#374151' }}>
//               {selectedNotice.content || '내용이 없습니다.'}
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// // 🔥 중요: default export 확실히 추가
// export default NoticeSection;

// pacsapp/src/components/home/NoticeSection/index.js
// 깔끔한 게시글 스타일 버전

import React, { useState, useEffect } from 'react';
import './NoticeSection.css';
import { noticeService } from '../../../services/noticeService';

// 깔끔한 모달 컴포넌트
const SimpleModal = ({ isOpen, onClose, title, children, notice }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '날짜 없음';
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '날짜 없음';
    }
  };

  return (
    <div className="simple-modal-overlay" onClick={handleOverlayClick}>
      <div className="simple-modal">
        <div className="simple-modal-header">
          <h3 className="simple-modal-title">{title}</h3>
          <button className="simple-modal-close" onClick={onClose}>×</button>
        </div>
        
        {notice && (
          <div className="simple-modal-meta">
            <span className="modal-meta-item">
              작성일: {formatDate(notice.created_at)}
            </span>
            {notice.created_by && (
              <span className="modal-meta-item">
                작성자: {notice.created_by}
              </span>
            )}
            {notice.views !== undefined && (
              <span className="modal-meta-item">
                조회: {notice.views}
              </span>
            )}
          </div>
        )}
        
        <div className="simple-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

const NoticeSection = ({ type, title }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📢 공지사항 조회 시작:', { type, title });
        
        let noticeData = [];
        
        if (type === 'system' || type === 'important') {
          noticeData = await noticeService.getSystemNotices();
        } else if (type === 'ris') {
          noticeData = await noticeService.getRISNotices();
        } else if (type === 'common') {
          noticeData = await noticeService.getCommonNotices();
        } else {
          noticeData = await noticeService.getLatestNotices(5);
        }
        
        console.log('📢 공지사항 조회 결과:', noticeData);
        
        const processedNotices = Array.isArray(noticeData) ? noticeData : [];
        
        const sortedNotices = processedNotices.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          const aIsImportant = a.notice_type === 'important' || a.notice_type === 'update';
          const bIsImportant = b.notice_type === 'important' || b.notice_type === 'update';
          if (aIsImportant && !bIsImportant) return -1;
          if (!aIsImportant && bIsImportant) return 1;
          
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        setNotices(sortedNotices);
        
      } catch (err) {
        console.error('📢 공지사항 조회 실패:', err);
        setError(`공지사항을 불러올 수 없습니다.`);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [type, title]);

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotice(null);
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '오늘';
      if (diffDays === 1) return '어제';
      if (diffDays < 7) return `${diffDays}일 전`;
      
      return date.toLocaleDateString('ko-KR', { 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  };

  const getBadges = (notice) => {
    const badges = [];
    
    if (notice.is_pinned) {
      badges.push({ type: 'pinned', text: '공지' });
    }
    
    if (notice.notice_type === 'important') {
      badges.push({ type: 'important', text: '중요' });
    } else if (notice.notice_type === 'maintenance') {
      badges.push({ type: 'maintenance', text: '점검' });
    } else if (notice.notice_type === 'update') {
      badges.push({ type: 'update', text: '업데이트' });
    }
    
    return badges;
  };

  const isImportantNotice = (notice) => {
    return notice.is_pinned === true || 
           notice.notice_type === 'important' || 
           notice.notice_type === 'update';
  };

  if (loading) {
    return (
      <div className="notice-section">
        <div className="notice-header">{title}</div>
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notice-section">
        <div className="notice-header">{title}</div>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="notice-section">
      <div className="notice-header">{title}</div>
      <div className="notice-list">
        {notices && notices.length > 0 ? (
          notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`notice-item ${isImportantNotice(notice) ? 'important' : ''}`}
              onClick={() => handleNoticeClick(notice)}
            >
              <div className="notice-title-area">
                <div className="notice-badges">
                  {getBadges(notice).map((badge, index) => (
                    <span key={index} className={`badge ${badge.type}`}>
                      {badge.text}
                    </span>
                  ))}
                </div>
                <div className="notice-title" title={notice.title}>
                  {notice.title}
                </div>
              </div>
              <div className="notice-date">
                {formatDate(notice.created_at)}
              </div>
            </div>
          ))
        ) : (
          <div className="notice-item" style={{ 
            textAlign: 'center', 
            color: '#9ca3af',
            cursor: 'default'
          }}>
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedNotice?.title}
        notice={selectedNotice}
      >
        {selectedNotice && (
          <div className="simple-modal-text">
            {selectedNotice.content ? 
              selectedNotice.content.split('\n').map((line, index) => (
                <div key={index} className="modal-content-line">
                  {line}
                </div>
              )) : 
              '내용이 없습니다.'
            }
          </div>
        )}
      </SimpleModal>
    </div>
  );
};

export default NoticeSection;