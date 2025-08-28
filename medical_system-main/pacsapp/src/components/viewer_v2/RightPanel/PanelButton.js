import React from 'react';
import './RightPanel.css';

const PanelButton = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`mv-panel-btn ${isActive ? 'mv-active' : ''}`}
      title={label}
    >
      <Icon size={18} />
    </button>
  );
};

export default PanelButton;