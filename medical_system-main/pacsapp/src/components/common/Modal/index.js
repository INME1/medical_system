// components/common/Modal.js
import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  overlayStyle = {}, // ✅ 오버레이 스타일 props 추가
  contentStyle = {}  // ✅ 컨텐츠 스타일 props 추가
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ✅ 기본 오버레이 스타일 (덜 어둡게)
  const defaultOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)', // ✅ 30% 투명도 (덜 어둡게)
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000, // ✅ 로딩 오버레이보다 높게
  };

  // ✅ 기본 컨텐츠 스타일
  const defaultContentStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    position: 'relative',
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        ...defaultOverlayStyle,
        ...overlayStyle // ✅ 커스텀 오버레이 스타일 적용
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          ...defaultContentStyle,
          ...contentStyle // ✅ 커스텀 컨텐츠 스타일 적용
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="modal-close-button"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0.25rem',
            borderRadius: '4px',
            lineHeight: 1,
            transition: 'color 0.2s, background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.color = '#374151';
            e.target.style.backgroundColor = '#f3f4f6';
          }}
          onMouseOut={(e) => {
            e.target.style.color = '#6b7280';
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>

        {/* 모달 헤더 */}
        {title && (
          <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              {title}
            </h2>
          </div>
        )}

        {/* 모달 컨텐츠 */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;