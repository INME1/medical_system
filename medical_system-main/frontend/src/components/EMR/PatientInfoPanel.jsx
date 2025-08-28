import React from 'react';
import { User, Calendar, IdCard, MapPin } from 'lucide-react';
import './PatientInfoPanel.css';

const PatientInfoPanel = ({ patient, onOpenDetailModal }) => {

  return (
    <div className="compact-patient-info">
      {/* 헤더 */}
      <div className="patient-info-header">
        <div className="header-icon">
          <User size={14} />
        </div>
        <h3>환자 정보</h3>
      </div>

      {/* 세부 정보만 표시 */}
      <div className="patient-details-mini">
        <div className="detail-item">
          <div className="detail-icon id">
            <IdCard size={12} />
          </div>
          <div className="detail-content">
            <span className="detail-label">환자 ID</span>
            <span className="detail-value">{patient.patient_identifier || patient.identifier || 'N/A'}</span>
          </div>
        </div>

        <div className="detail-item">
          <div className="detail-icon birthdate">
            <Calendar size={12} />
          </div>
          <div className="detail-content">
            <span className="detail-label">생년월일</span>
            <span className="detail-value">
              {patient.person?.birthdate ? 
                new Date(patient.person.birthdate).toLocaleDateString('ko-KR') : 
                patient.birthdate ? new Date(patient.birthdate).toLocaleDateString('ko-KR') : 'N/A'
              }
            </span>
          </div>
        </div>

        <div className="detail-item">
          <div className="detail-icon address">
            <MapPin size={12} />
          </div>
          <div className="detail-content">
            <span className="detail-label">주소</span>
            <span className="detail-value">{patient.person?.address || patient.address || '주소 정보 없음'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoPanel;