// src/components/EMR/AssignedPatientList.jsx
// 진료실에 배정된 환자만 표시하는 전용 컴포넌트

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AssignedPatientList = ({ onPatientSelect, selectedPatient, refreshTrigger }) => {
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_INTEGRATION_API || 'http://35.225.63.41:8000/api/integration/';

  // 🔥 배정된 환자만 가져오기 (identifier-waiting API 직접 사용)
  const fetchAssignedPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🏥 배정된 환자 목록 조회 시작...');
      const response = await axios.get(`${API_BASE}identifier-waiting/`);
      const allPatients = Array.isArray(response.data) ? response.data : [];
      
      // 진료실 배정된 환자들만 필터링
      const assigned = allPatients.filter(patient => patient.assigned_room);
      
      console.log('🏥 전체 환자 수:', allPatients.length);
      console.log('🏥 배정된 환자 수:', assigned.length);
      console.log('✅ 배정된 환자 조회 성공:', assigned);
      
      setAssignedPatients(assigned);
      
    } catch (err) {
      console.error('❌ 배정된 환자 목록 조회 실패:', err);
      setError('배정된 환자 목록을 불러오는데 실패했습니다.');
      setAssignedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPatients();
    
    // 10초마다 자동 새로고침
    const interval = setInterval(fetchAssignedPatients, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 refreshTrigger가 변경될 때마다 새로고침
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 refreshTrigger 감지, 배정된 환자 목록 새로고침');
      fetchAssignedPatients();
    }
  }, [refreshTrigger]);

  // 환자 선택 시 다른 컴포넌트와 호환되는 형식으로 변환
  const handlePatientClick = (patient) => {
    console.log('👤 선택된 환자 (원본):', patient);
    
    // 🔥 다른 컴포넌트들이 기대하는 형식으로 변환
    const formattedPatient = {
      // 기본 식별자들
      patient_identifier: patient.patient_identifier,
      uuid: patient.openmrs_patient_uuid,
      mapping_id: patient.mapping_id,
      display: patient.display || patient.name,
      assigned_room: patient.assigned_room,
      
      // person 객체 형식 (ImagingRequestPanel, PatientInfoPanel에서 필요)
      person: {
        age: patient.age,
        gender: patient.gender,
        birthdate: patient.birthdate
      },
      
      // identifiers 배열 (영상검사 요청에서 사용)
      identifiers: [{
        identifier: patient.patient_identifier,
        identifierType: 'OpenMRS ID',
        preferred: true
      }],
      
      // 원본 데이터도 보존
      ...patient
    };
    
    console.log('✅ 변환된 환자 데이터:', formattedPatient);
    onPatientSelect(formattedPatient);
  };

  // 스타일링 (컴팩트 버전)
  const containerStyle = {
    padding: '0.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa'
  };

  const headerStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const listContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '6px',
    padding: '4px'
  };

  const patientCardStyle = (isSelected) => ({
    backgroundColor: isSelected ? '#e3f2fd' : '#fff',
    border: isSelected ? '2px solid #2196f3' : '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isSelected ? '0 2px 8px rgba(33,150,243,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
    minHeight: '80px'
  });

  const roomBadgeStyle = (roomNumber) => ({
    position: 'absolute',
    top: '4px',
    right: '4px',
    padding: '2px 4px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: roomNumber === 1 ? '#4caf50' : '#2196f3'
  });

  const patientNameStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#333',
    lineHeight: '1.2'
  };

  const patientInfoStyle = {
    fontSize: '10px',
    color: '#666',
    marginBottom: '2px',
    lineHeight: '1.1'
  };

  const refreshButtonStyle = {
    padding: '6px 10px',
    fontSize: '11px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const emptyStateStyle = {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999'
  };

  const errorStyle = {
    padding: '10px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '12px'
  };

  if (loading && assignedPatients.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ ...headerStyle, justifyContent: 'center' }}>
          🔄 배정된 환자 목록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 헤더 */}
      <div style={headerStyle}>
        <span>🧑‍⚕️ 진료실 배정된 환자 ({assignedPatients.length}명)</span>
        <button 
          onClick={fetchAssignedPatients}
          style={refreshButtonStyle}
          disabled={loading}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2196f3'}
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={errorStyle}>
          ⚠️ {error}
        </div>
      )}

      {/* 환자 카드 목록 */}
      <div style={listContainerStyle}>
        {assignedPatients.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏥</div>
            <div style={{ fontSize: '16px', marginBottom: '6px' }}>
              현재 배정된 환자가 없습니다
            </div>
            <div style={{ fontSize: '12px', color: '#ccc' }}>
              대기 목록에서 환자를 진료실에 배정해주세요
            </div>
          </div>
        ) : (
          assignedPatients.map((patient) => (
            <div
              key={patient.mapping_id}
              style={patientCardStyle(selectedPatient?.mapping_id === patient.mapping_id)}
              onClick={() => handlePatientClick(patient)}
              onMouseEnter={(e) => {
                if (selectedPatient?.mapping_id !== patient.mapping_id) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPatient?.mapping_id !== patient.mapping_id) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              {/* 진료실 번호 뱃지 */}
              <div style={roomBadgeStyle(patient.assigned_room)}>
                {patient.assigned_room}번
              </div>

              {/* 환자 이름 */}
              <div style={patientNameStyle}>
                👤 {patient.display || patient.name || patient.patient_identifier || 'Untitled'}
              </div>

              {/* 환자 기본 정보 */}
              <div style={patientInfoStyle}>
                🆔 {patient.patient_identifier || '-'}
              </div>
              <div style={patientInfoStyle}>
                👥 {patient.gender === 'M' ? '남성' : patient.gender === 'F' ? '여성' : '-'} | 
                🎂 {patient.age ? `${patient.age}세` : '-'}
              </div>
              <div style={patientInfoStyle}>
                📅 {patient.birthdate || '-'}
              </div>
              {patient.waitTime > 0 && (
                <div style={patientInfoStyle}>
                  ⏰ 대기: {patient.waitTime}분
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignedPatientList;