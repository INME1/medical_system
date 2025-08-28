// src/components/OHIFViewer/AnnotationTools/LabelModal.js
import React, { useState, useEffect } from 'react';
import styles from './LabelModal.module.css';

const LabelModal = ({ 
  isOpen, 
  onSave, 
  onCancel,
  initialLabel = '',
  title = '🏷️ 라벨 입력'
}) => {
  const [label, setLabel] = useState(initialLabel);

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (isOpen) {
      setLabel(initialLabel);
    }
  }, [isOpen, initialLabel]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  const handleSave = () => {
    const trimmedLabel = label.trim();
    if (trimmedLabel) {
      onSave(trimmedLabel);
      setLabel('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setLabel('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleOverlayClick = (e) => {
    // 오버레이 클릭 시에만 닫기 (모달 내용 클릭은 제외)
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <h4 className={styles.modalHeader}>
          {title}
        </h4>
        
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="라벨을 입력하세요"
          className={styles.labelInput}
          autoFocus
          maxLength={50}
        />
        
        <div className={styles.buttonContainer}>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            className={`${styles.button} ${styles.saveButton}`}
          >
            💾 저장
          </button>
          
          <button
            onClick={handleCancel}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            ❌ 취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelModal;