// src/components/PatientDetailModal.jsx

import React, { useState } from 'react';
import axios from 'axios';
// import LisRequestPanel from './LisRequestPanel';

const PatientDetailModal = ({ patient, doctorId, onClose, onPatientDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  if (!patient) return null;

  const { display, person, uuid, mapping_id } = patient;
  const API_INTEGRATION_BASE = process.env.REACT_APP_INTEGRATION_API || 'http://35.225.63.41:8000/api/integration/';

  const handleDelete = async () => {
    if (!mapping_id) {
      alert('매핑 ID가 없어 환자 매핑을 삭제할 수 없습니다.');
      console.error('삭제 실패: mapping_id가 없습니다.', patient);
      return;
    }

    if (!window.confirm(`${display} 환자의 매핑을 정말 삭제(비활성화)하시겠습니까?`)) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_INTEGRATION_BASE}patient-mappings/${mapping_id}/delete/`);
      alert(`✅ ${display} 환자의 매핑이 성공적으로 비활성화되었습니다.`);
      onPatientDeleted && onPatientDeleted();
      onClose();
    } catch (err) {
      console.error('환자 매핑 삭제 실패:', err.response?.data || err);
      alert('환자 매핑 삭제에 실패했습니다: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>👤 환자 상세 정보</h2>
        <p><strong>이름:</strong> {display}</p>
        <p><strong>성별:</strong> {person.gender === 'M' ? '남' : '여'}</p>
        <p><strong>나이:</strong> {person.age !== null && person.age !== undefined ? `${person.age}세` : '-'}</p>
        <p><strong>생년월일:</strong> {person.birthdate}</p>
        <p><strong>UUID:</strong> {uuid}</p>
        <p><strong>매핑 ID:</strong> {mapping_id || '-'}</p>


        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={handleDelete}
            style={deleteButtonStyle}
            disabled={deleting}
          >
            {deleting ? '삭제 중…' : '환자 매핑 비활성화'}
          </button>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            disabled={deleting}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 999,
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '10px',
  width: '800px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  textAlign: 'left',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const closeButtonStyle = {
  padding: '0.5rem 1rem',
  fontSize: '14px',
  backgroundColor: '#777',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const deleteButtonStyle = {
  padding: '0.5rem 1rem',
  fontSize: '14px',
  backgroundColor: '#d32f2f',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default PatientDetailModal;