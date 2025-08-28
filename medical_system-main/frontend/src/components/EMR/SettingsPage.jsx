import React from 'react';
import ThemeSettings from './Settings/ThemeSettings';
import LogViewer from './Settings/LogViewer';
import HelpGuide from './Settings/HelpGuide';

const SettingsPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>⚙️ 설정 페이지</h2>

      <div
        style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
          marginTop: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {/* 왼쪽 박스 */}
          <div
            style={{
              flex: 1,
              minWidth: '300px',
              backgroundColor: '#f5f7fa',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ marginBottom: '1rem' }}>🎨 테마 설정</h3>
            <ThemeSettings />
          </div>

          {/* 오른쪽 박스 */}
          <div
            style={{
              flex: 1,
              minWidth: '300px',
              backgroundColor: '#eef3f8',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ marginBottom: '1rem' }}>📄 기타 설정</h3>
            <LogViewer />
            <div style={{ marginTop: '1.5rem' }}>
              <HelpGuide />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
