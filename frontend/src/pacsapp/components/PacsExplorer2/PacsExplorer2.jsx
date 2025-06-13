import React, { useState } from 'react';

const PacsExplorer2 = () => {
  const [pacsUrl, setPacsUrl] = useState('http://35.225.63.41:8042/ui/app/');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(true);
  };

  const containerStyle = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5'
  };

  const headerStyle = {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #34495e'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const urlInputStyle = {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    width: '350px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  };

  const quickButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#27ae60',
    padding: '6px 12px',
    fontSize: '12px'
  };

  const iframeContainerStyle = {
    flex: 1,
    position: 'relative',
    backgroundColor: 'white'
  };

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: error ? 'none' : 'block'
  };

  const loadingStyle = {
    display: isLoading && !error ? 'flex' : 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: '18px',
    color: '#666'
  };

  const errorStyle = {
    display: error ? 'flex' : 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    color: '#6c757d'
  };

  const refreshViewer = () => {
    setIsLoading(true);
    setError(false);
    const iframe = document.getElementById('pacs-explorer-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const setQuickUrl = (url) => {
    setPacsUrl(url);
    setIsLoading(true);
    setError(false);
  };

  const openInNewTab = () => {
    window.open(pacsUrl, '_blank');
  };

  return (
    <div style={containerStyle}>
      {/* PACS Explorer 2 iframe - 헤더 제거하고 전체 화면 */}
      <div style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        backgroundColor: 'white'
      }}>
        <iframe
          id="pacs-explorer-iframe"
          src={pacsUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: error ? 'none' : 'block'
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="PACS Explorer 2"
          allow="fullscreen"
        />

        {/* 로딩 화면 */}
        <div style={loadingStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <div>PACS Explorer 2를 불러오는 중...</div>
            <div style={{ fontSize: '14px', marginTop: '10px', color: '#999' }}>
              {pacsUrl}
            </div>
          </div>
        </div>

        {/* 에러 화면 */}
        <div style={errorStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h3 style={{ color: '#e74c3c', margin: '0 0 15px 0' }}>
              PACS Explorer 2에 연결할 수 없습니다
            </h3>
            <p style={{ margin: '0 0 20px 0' }}>
              Orthanc 서버가 실행 중인지 확인해주세요
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacsExplorer2;