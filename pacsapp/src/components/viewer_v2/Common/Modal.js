import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  className = ''
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="mv-modal-overlay" onClick={handleOverlayClick}>
      <div className={`mv-modal mv-modal-${size} ${className}`}>
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="mv-modal-header">
            {title && <h3 className="mv-modal-title">{title}</h3>}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="small"
                icon={X}
                onClick={onClose}
                className="mv-modal-close"
              />
            )}
          </div>
        )}

        {/* 내용 */}
        <div className="mv-modal-content">
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className="mv-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;