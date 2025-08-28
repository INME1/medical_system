// src/components/OHIFViewer/AnnotationTools/AnnotationOverlay.js

import React from 'react';
import styles from './AnnotationOverlay.module.css';

const AnnotationOverlay = ({
  // 상태
  drawingMode,
  currentBox,
  annotationBoxes,
  showAnnotations,
  overlayRef,
  
  // 마우스 이벤트 핸들러
  onMouseDown,
  onMouseMove,
  onMouseUp,
  
  // 어노테이션 관리
  onDeleteAnnotation,
  
  // 🔥 동적 z-index 관련 콜백들
  onDrawingStart,
  onModalOpen
}) => {
  
  // 🔥 마우스 다운 이벤트 핸들러 (기존 핸들러 + 레이어 활성화)
  const handleMouseDown = (e) => {
    if (drawingMode && onDrawingStart) {
      console.log('✏️ 어노테이션 그리기 시작 - 어노테이션 레이어 활성화');
      onDrawingStart(); // 어노테이션 레이어 활성화
    }
    
    // 기존 마우스 다운 핸들러 호출
    if (onMouseDown) {
      onMouseDown(e);
    }
  };

  // 🔥 어노테이션 박스 클릭 핸들러 (어노테이션 레이어 활성화)
  const handleAnnotationClick = (e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    console.log('🖱️ 어노테이션 박스 클릭 - 어노테이션 레이어 활성화');
    if (onDrawingStart) {
      onDrawingStart(); // 어노테이션 레이어 활성화
    }
  };

  // 🔥 삭제 버튼 클릭 핸들러 (모달 열릴 가능성 대비)
  const handleDeleteClick = (e, boxId) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    
    // 만약 삭제 시 확인 모달이 열린다면 모달 레이어 활성화
    if (onModalOpen) {
      console.log('🗑️ 삭제 버튼 클릭 - 모달이 열릴 수 있음');
      onModalOpen();
    }
    
    // 기존 삭제 핸들러 호출
    if (onDeleteAnnotation) {
      onDeleteAnnotation(boxId);
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlayContainer} ${
        drawingMode ? styles.drawingMode : styles.normalMode
      }`}
      onMouseDown={handleMouseDown} // 🔥 수정된 핸들러 사용
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* 현재 그리고 있는 박스 */}
      {currentBox && (
        <div
          className={styles.currentBox}
          style={{
            left: Math.min(currentBox.startX, currentBox.endX) + 'px',
            top: Math.min(currentBox.startY, currentBox.endY) + 'px',
            width: Math.abs(currentBox.endX - currentBox.startX) + 'px',
            height: Math.abs(currentBox.endY - currentBox.startY) + 'px'
          }}
        />
      )}
      
      {/* 저장된 어노테이션 박스들 */}
      {showAnnotations && annotationBoxes.map((box) => (
        <div
          key={box.id}
          className={`${styles.annotationBox} ${
            drawingMode ? styles.drawingMode : styles.normalMode
          }`}
          style={{
            left: box.left + 'px',
            top: box.top + 'px',
            width: box.width + 'px',
            height: box.height + 'px'
          }}
          onClick={handleAnnotationClick} // 🔥 어노테이션 박스 클릭 핸들러 추가
        >
          <div className={styles.annotationLabel}>
            {box.label}
            <button
              onClick={(e) => handleDeleteClick(e, box.id)} // 🔥 수정된 삭제 핸들러 사용
              className={styles.deleteButton}
              title={`"${box.label}" 어노테이션 삭제`}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnotationOverlay;