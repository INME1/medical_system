// /home/medical_system/pacsapp/src/components/home/ImagePopup.jsx

import React, { useState, useEffect } from 'react';
import popupImage from '../../assets/images/popup.png';

const ImagePopup = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [dontShowTodayPopup, setDontShowTodayPopup] = useState(false);

  // 컴포넌트 마운트 시 팝업 표시 여부 확인
  useEffect(() => {
    const hideToday = localStorage.getItem('hideImagePopupToday');
    const today = new Date().toDateString();
    
    if (hideToday !== today) {
      setIsPopupVisible(true);
    }
  }, []);

  // 팝업 닫기
  const closeImagePopup = () => {
    if (dontShowTodayPopup) {
      const today = new Date().toDateString();
      localStorage.setItem('hideImagePopupToday', today);
    }
    setIsPopupVisible(false);
  };

  // 배경 클릭 시 팝업 닫기
  const handlePopupBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      closeImagePopup();
    }
  };

  // 팝업이 보이지 않으면 렌더링하지 않음
  if (!isPopupVisible) {
    return null;
  }

  return (
    <div 
      className="image-popup-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={handlePopupBackgroundClick}
    >
      <div 
        className="image-popup-container"
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          width: '500px',
          height: 'auto',
          margin: '0 auto'
        }}
      >
        {/* X 버튼 - 왼쪽 상단 */}
        <button
          onClick={closeImagePopup}
          className="image-popup-close-x"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.target.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.target.style.color = '#6b7280';
          }}
        >
          ✕
        </button>

        {/* 이미지 */}
        <img
          src={popupImage}
          alt="공지사항"
          className="image-popup-image"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            maxWidth: '500px',
            display: 'block'
          }}
        />

        {/* 하단 컨트롤 영역 - 검은색 박스 */}
        <div 
          className="image-popup-controls"
          style={{
            padding: '12px 16px',
            backgroundColor: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <label 
            className="image-popup-checkbox-label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'white'
            }}
          >
            <input
              type="checkbox"
              checked={dontShowTodayPopup}
              onChange={(e) => setDontShowTodayPopup(e.target.checked)}
              className="image-popup-checkbox"
              style={{
                borderRadius: '4px'
              }}
            />
            <span>오늘 하루동안 열지않기</span>
          </label>
          
          <button
            onClick={closeImagePopup}
            className="image-popup-close-btn"
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6b7280';
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePopup;