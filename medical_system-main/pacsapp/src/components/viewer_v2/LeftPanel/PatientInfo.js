import React from 'react';
import { User } from 'lucide-react';
import './PatientInfo.css';

const PatientInfo = ({ patientData = null }) => {
  // 나이 계산 함수
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    
    let birth;
    
    // YYYYMMDD 형식 (19940101) 처리
    if (typeof birthDate === 'string' && birthDate.length === 8) {
      const year = parseInt(birthDate.substring(0, 4));
      const month = parseInt(birthDate.substring(4, 6)) - 1; // month는 0부터 시작
      const day = parseInt(birthDate.substring(6, 8));
      birth = new Date(year, month, day);
    } else {
      birth = new Date(birthDate);
    }
    
    if (isNaN(birth.getTime())) return 'N/A';
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // 성별 변환 함수
  const formatGender = (sex) => {
    if (sex === 'M') return '남';
    if (sex === 'F') return '여';
    return 'N/A';
  };

  // 생년월일 포맷 함수 (YYYY/MM/DD)
  const formatBirthDate = (birthDate) => {
    if (!birthDate) return 'N/A';
    
    // YYYYMMDD 형식 (19940101) 처리
    if (typeof birthDate === 'string' && birthDate.length === 8) {
      const year = birthDate.substring(0, 4);
      const month = birthDate.substring(4, 6);
      const day = birthDate.substring(6, 8);
      return `${year}/${month}/${day}`;
    }
    
    // 기존 날짜 형식 처리
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return 'N/A';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  };

  // 데이터가 없을 때 기본값
  if (!patientData) {
    return (
      <div className="mv-patient-info-container">
        <div className="mv-patient-info-header">
          <User size={16} />
          <h3 className="mv-patient-info-title">환자 정보</h3>
        </div>

        <div className="mv-patient-info-list">
          <div className="mv-patient-info-row">
            <span className="mv-patient-info-label">환자 정보를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  const age = calculateAge(patientData.patientBirthDate);
  const gender = formatGender(patientData.patientSex);
  const birthDate = formatBirthDate(patientData.patientBirthDate);

  return (
    <div className="mv-patient-info-container">
      <div className="mv-patient-info-header">
        <User size={16} />
        <h3 className="mv-patient-info-title">환자 정보</h3>
      </div>

      <div className="mv-patient-info-list">
        <div className="mv-patient-info-row">
          <span className="mv-patient-info-label">환자 ID:</span>
          <span className="mv-patient-info-value mv-patient-info-id">
            {patientData.patientID || 'N/A'}
          </span>
        </div>

        <div className="mv-patient-info-row">
          <span className="mv-patient-info-label">환자:</span>
          <span className="mv-patient-info-value">
            {patientData.patientName || 'N/A'}
          </span>
        </div>

        <div className="mv-patient-info-row">
          <span className="mv-patient-info-label">생년월일/성별:</span>
          <span className="mv-patient-info-value">
            {birthDate !== 'N/A' && gender !== 'N/A' ? (
              <span>{birthDate} ({gender})</span>
            ) : (
              'N/A'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;