// src/components/PatientDetailModal.jsx
import React from 'react';

const PatientDetailModal = ({ patient, onClose }) => {
  if (!patient) return null;

  const { display, person } = patient;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>👤 환자 상세 정보</h2>
        <p><strong>이름:</strong> {display}</p>
        <p><strong>성별:</strong> {person.gender === 'M' ? '남' : '여'}</p>
        <p><strong>나이:</strong> {person.age}세</p>
        <p><strong>생년월일:</strong> {person.birthdate}</p>
        <p><strong>UUID:</strong> {patient.uuid}</p>

        <button onClick={onClose} style={closeButtonStyle}>닫기</button>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '10px',
  width: '300px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  textAlign: 'left',
};

const closeButtonStyle = {
  marginTop: '1rem',
  padding: '0.5rem 1rem',
  fontSize: '14px',
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default PatientDetailModal;
