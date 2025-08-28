// src/components/EMR/AssignedPatientList.jsx
// 🎨 DocDashBoard.css 스타일에 맞춰 최적화된 배정 환자 목록

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Clock, MapPin, ChevronDown, ChevronUp, UserCheck, AlertCircle } from 'lucide-react';

const AssignedPatientList = ({ onPatientSelect, selectedPatient, refreshTrigger, searchTerm }) => {
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPatients, setExpandedPatients] = useState(new Set());
  
  const API_BASE = process.env.REACT_APP_INTEGRATION_API;

  // 환자 데이터 정규화 함수
  const normalizePatientData = (patient) => {
    const birthdate = patient.person?.birthdate || patient.birthdate;
    const age = calculateAge(birthdate);
    
    return {
      id: patient.mapping_id || patient.uuid,
      name: patient.display || patient.name || patient.patient_name || '알 수 없는 환자',
      identifier: patient.patient_identifier || patient.identifier || 'N/A',
      age: age,
      birthdate: birthdate ? new Date(birthdate).toLocaleDateString('ko-KR') : 'N/A',
      gender: getGenderDisplay(patient.person?.gender || patient.gender),
      room: patient.assigned_room,
      waitTime: calculateWaitTime(patient.created_at || patient.timestamp),
      status: patient.status || 'waiting',
      originalData: patient
    };
  };

  // 나이 계산 함수
  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    try {
      const birth = new Date(birthdate);
      const today = new Date();
      if (isNaN(birth.getTime())) return null;
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  // 성별 표시 함수
  const getGenderDisplay = (gender) => {
    if (!gender) return '미상';
    const genderMap = {
      'M': '남', 'F': '여', 'MALE': '남', 'FEMALE': '여'
    };
    return genderMap[gender.toUpperCase()] || '미상';
  };

  // 대기 시간 계산 함수
  const calculateWaitTime = (timestamp) => {
    if (!timestamp) return '알 수 없음';
    try {
      const diff = Date.now() - new Date(timestamp).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}분`;
      const hours = Math.floor(minutes / 60);
      return `${hours}시간 ${minutes % 60}분`;
    } catch {
      return '알 수 없음';
    }
  };

  // 환자 목록 조회
  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}identifier-waiting/`);
      const assignedOnly = res.data
        .filter(p => p.assigned_room)
        .reduce((acc, p) => {
          const key = p.openmrs_patient_uuid || p.uuid;
          if (!acc.find(x => (x.openmrs_patient_uuid || x.uuid) === key)) {
            acc.push(normalizePatientData(p));
          }
          return acc;
        }, []);
        
      setAssignedPatients(assignedOnly);
      setError(null);
    } catch (err) {
      console.error('❌ 배정된 환자 목록 조회 실패:', err);
      setError('환자 목록을 불러올 수 없습니다.');
      setAssignedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // 환자 카드 펼치기/접기
  const togglePatientExpansion = (patientId) => {
    setExpandedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  // 환자 선택 처리
  const handlePatientSelect = (patient) => {
    onPatientSelect && onPatientSelect(patient.originalData);
  };

  // 검색 필터링
  const filteredPatients = assignedPatients.filter(patient => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(term) ||
      patient.identifier.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    fetchAssigned();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAssigned();
    }
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="patient-list-loading">
        <div className="loading-spinner"></div>
        <p>환자 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-list-error">
        <AlertCircle size={24} />
        <p>{error}</p>
        <button onClick={fetchAssigned} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="assigned-patient-list">
      {/* 헤더 */}
      <div className="patient-list-header">
        <div className="header-title">
        </div>
        <div className="patient-count">
        </div>
      </div>

      {/* 환자 목록 */}
      <div className="patient-list-content">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <User size={32} />
            <p>배정된 환자가 없습니다</p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isExpanded = expandedPatients.has(patient.id);
            const isSelected = selectedPatient?.uuid === patient.originalData?.uuid;
            
            return (
              <div 
                key={patient.id} 
                className={`collapsible-patient-card ${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected' : ''}`}
              >
                {/* 환자 카드 헤더 - 클릭시 선택만 */}
                <div 
                  className={`patient-card-header ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="patient-basic-info">
                    <div className="patient-name-header">
                      <User size={14} />
                      {/* display에서 이름만 추출 (P8060 - 김김김 -> 김김김) */}
                      {patient.name.includes(' - ') ? patient.name.split(' - ')[1] : patient.name}
                    </div>
                    <div className="patient-basic-details">
                      <span>{patient.age ? `${patient.age}세` : '나이미상'}</span>
                      <span>•</span>
                      <span>{patient.gender}</span>
                      <span>•</span>
                      <span className="room-badge">
                        <MapPin size={10} />
                        {patient.room}번실
                      </span>
                    </div>
                  </div>
                </div>

                {/* 환자 카드 상세 내용 - 삭제 */}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignedPatientList;