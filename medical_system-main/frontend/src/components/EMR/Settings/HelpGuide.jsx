// src/components/EMR/Settings/HelpGuide.jsx
import React, { useState } from 'react';

const HelpGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section style={{ paddingLeft: '50px' }}>
      <h3>◉ 도움말 / 사용 가이드</h3>
      <p>시스템 사용법이 궁금하신가요? 버튼을 눌러 확인해보세요.</p>
      <button onClick={() => setIsOpen(true)} style={btnStyle}>사용 가이드 보기</button>

      {isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>📘 EMR 사용 가이드</h2>
            <p>이 시스템은 다음과 같은 기능을 제공합니다.</p>
            <ul style={{ textAlign: 'left', marginTop: '1rem' }}>
              <li><strong>🏠 의사 대시보드: </strong> 알림사항 및 요약 정보 확인</li>
              <li><strong>🧑‍⚕️ 진료: </strong> 환자 배정, 진료 기록, AI 분석 결과 보기</li>
              <li><strong>🔜 진료 진행도: </strong> 환자 배정, 진료 기록, AI 분석 결과 보기</li>
              <li><strong>💻 대기 화면: </strong> 총 대기 인원, 진료실 배정 상황 확인</li>
              <li><strong>📄 대기 목록: </strong> 환자 대기 목록, 진료실 배정 상황 확인</li>
              <li><strong>☑️ 완료 환자 목록: </strong> 진료가 완료된 환자들 리스트</li>
              <li><strong>⚙️ 설정: </strong> 테마, 요청 로그, 도움말/사용 가이드 등 개인 설정</li>
            </ul>
            <button onClick={() => setIsOpen(false)} style={closeStyle}>닫기</button>
          </div>
        </div>
      )}
    </section>
  );
};

const btnStyle = {
  marginTop: '0.5rem',
  padding: '8px 16px',
  borderRadius: '5px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
};

const closeStyle = {
  marginTop: '1.5rem',
  padding: '6px 12px',
  borderRadius: '5px',
  backgroundColor: '#ccc',
  border: 'none',
  cursor: 'pointer',
};

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '10px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
};

export default HelpGuide;
