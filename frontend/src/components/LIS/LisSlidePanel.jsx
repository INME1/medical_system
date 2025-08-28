// src/components/LIS/LisSlidePanel.jsx
import React from 'react';
import './LisSidePanel.css';

const SlidePanel = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="slide-panel-overlay">
      <div className="slide-panel">
        <button className="slide-close-btn" onClick={onClose}>✖ 닫기</button>
        {children}
      </div>
    </div>
  );
};

export default SlidePanel;
