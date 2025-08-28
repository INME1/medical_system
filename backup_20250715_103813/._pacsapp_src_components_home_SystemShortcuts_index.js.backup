// pacsapp/src/components/home/SystemShortcuts/index.js - 개선된 버전
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SystemShortcuts.css';

const BASE_URL = 'http://35.225.63.41:3000/'
const SystemShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts = [
    {
      id: 'emr',
      icon: '🏥',
      title: 'EMR',
      subtitle: 'Electronic Medical Record',
      description: '전자의무기록 시스템',
      action: () => {
        console.log('🏥 EMR 시스템으로 이동');
        window.location.href = `${BASE_URL}emr`;
      },
      color: '#3b82f6',
      external: true
    },
    {
      id: 'lis',
      icon: '🧪',
      title: 'LIS',
      subtitle: 'Laboratory Information System',
      description: '검사실 정보 시스템',
      action: () => {
        console.log('🧪 LIS 시스템으로 이동');
        window.location.href = `${BASE_URL}lis`;
      },
      color: '#10b981',
      external: true
    },
    {
      id: 'control',
      icon: '🎛️',
      title: 'Control Page',
      subtitle: 'System Control Panel',
      description: '시스템 제어 패널',
      action: () => {
        console.log('🎛️ Control Page로 이동');
        window.location.href = `${BASE_URL}Main_page/main_page_function`;
      },
      color: '#8b5cf6',
      external: true
    },
    {
      id: 'main',
      icon: '🏠',
      title: 'Main',
      subtitle: 'Main Dashboard',
      description: '메인 대시보드',
      action: () => {
        console.log('🏠 Main으로 이동');
        window.location.href = `${BASE_URL}Main_page/TitlePage`;
      },
      color: '#6b7280',
      external: true
    }
  ];

  const handleShortcutClick = (shortcut) => {
    console.log(`🔗 ${shortcut.title} 버튼 클릭됨`);
    
    // 버튼 클릭 효과
    const button = document.querySelector(`[data-shortcut-id="${shortcut.id}"]`);
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }
    
    // 각 버튼의 정의된 action 실행
    if (shortcut.action) {
      setTimeout(() => {
        shortcut.action();
      }, 100);
    }
  };

  return (
    <div className="shortcuts-container">
      <div className="shortcuts-header">
        🚀 바로가기
      </div>
      
      <div className="shortcuts-grid">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            data-shortcut-id={shortcut.id}
            data-id={shortcut.id}
            className="shortcut-card"
            onClick={() => handleShortcutClick(shortcut)}
            style={{ '--card-color': shortcut.color }}
            title={`${shortcut.title} - ${shortcut.description}`}
          >
            <div className="shortcut-icon">{shortcut.icon}</div>
            <div className="shortcut-content">
              <div className="shortcut-title">{shortcut.title}</div>
              <div className="shortcut-subtitle">{shortcut.subtitle}</div>
            </div>
            
            {/* 🆕 외부 링크 표시 아이콘 */}
            {shortcut.external && (
              <div className="external-link-icon">↗</div>
            )}
          </div>
        ))}
      </div>
          
      {/* 🆕 시스템 상태 표시 */}
      <div className="system-status">
        <div className="status-item">
          <span className="status-dot online"></span>
          <span>모든 시스템 정상</span>
        </div>
      </div>
    </div>
  );
};

export default SystemShortcuts;