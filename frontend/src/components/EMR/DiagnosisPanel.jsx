// src/components/DiagnosisPanel.jsx
import React from 'react';

const DiagnosisPanel = ({ patient }) => {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', marginLeft: '1rem', minWidth: '300px' }}>
      <h3>🧠 AI 진단 및 판독</h3>
      {patient ? (
        <>
          <p><strong>환자:</strong> {patient.display}</p>
          <p><strong>성별:</strong> {patient.person.gender === 'M' ? '남' : '여'}</p>
          <p><strong>나이:</strong> {patient.person.age}세</p>
          <hr />
          <p><em>AI 분석 결과 및 진단 정보는 이곳에 표시됩니다.</em></p>
        </>
      ) : (
        <p>환자가 배정되지 않았습니다.</p>
      )}
    </div>
  );
};

export default DiagnosisPanel;