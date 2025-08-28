import React from 'react';
// 페이지 이동을 위해 react-router-dom에서 useNavigate를 가져옵니다.
import { useNavigate } from 'react-router-dom';

const LogViewer = () => {
  // navigate 함수를 사용하기 위해 초기화합니다.
  const navigate = useNavigate();

  // 버튼 클릭 시 '/logs' 경로로 이동시키는 함수입니다.
  const handleGoToLogPage = () => {
    navigate('/logs');
  };

  return (
    <section>
      <h3 style={{ marginBottom: '1rem' }}>◉ 요청 로그 확인</h3>
      
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '1rem' }}>
        전체 오더 내역을 확인하려면 아래 버튼을 클릭하세요.
      </p>

      {/* 버튼 클릭 시 handleGoToLogPage 함수가 실행됩니다. */}
      <button onClick={handleGoToLogPage} style={btnStyle}>
        전체 오더 로그 페이지로 이동
      </button>
    </section>
  );
};

// 버튼에 적용될 스타일
const btnStyle = {
  padding: '10px 15px',
  borderRadius: '5px',
  border: '1px solid #0066cc',
  backgroundColor: '#e3f2fd',
  color: '#0066cc',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'all 0.2s',
};

export default LogViewer;