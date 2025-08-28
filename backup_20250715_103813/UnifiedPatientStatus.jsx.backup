import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Users, CheckCircle, Search, UserX, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import './UnifiedPatientStatus.css'; // 새로운 CSS 파일 사용

const API_BASE = 'http://35.225.63.41:8000/api/integration/';
const OPENMRS_API_MASTER = 'http://35.225.63.41:8000/api/integration/openmrs-patients/';
const MAPPING_API = 'http://35.225.63.41:8000/api/integration/identifier-based/';

const UnifiedPatientStatus = () => {
  // 상태 관리 - 기존 코드 그대로
  const [patientsMaster, setPatientsMaster] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState({});
  const [completedPatients, setCompletedPatients] = useState([]);
  const [receptionList, setReceptionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // 환자 이름에서 ID 제거 함수 (기존 코드)
  const cleanPatientName = (displayName) => {
    if (!displayName) return '';
    const parts = displayName.split(' - ');
    return parts.length > 1 ? parts[1] : displayName;
  };

  // 🔥 데이터 가져오기 - 기존 코드 그대로 복사
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // 🔥 대기 중 환자 목록 (완료된 환자 제외)
      const waitingRes = await axios.get(`${API_BASE}identifier-waiting/`);
      const waitingData = Array.isArray(waitingRes.data) ? waitingRes.data : [];
      
      // 🔥 완료된 환자 필터링 (status='complete' 제외)
      const activeWaitingData = waitingData.filter(p => p.status !== 'complete' && p.is_active);
      setWaitingList(activeWaitingData);
      
      // 배정된 환자들 (waiting list에서 assigned_room이 있는 환자들)
      const assigned = {};
      activeWaitingData
        .filter(p => p.assigned_room)
        .forEach(p => {
          assigned[p.assigned_room] = p;
        });
      setAssignedPatients(assigned);
      
      // 🔥 완료된 환자 목록 (별도 API 호출)
      const completedRes = await axios.get(`${API_BASE}completed-patients/`);
      setCompletedPatients(Array.isArray(completedRes.data.completed_patients) ? completedRes.data.completed_patients : []);
      
    } catch (error) {
      console.error('환자 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // ReceptionPanel 데이터 가져오기 - 기존 코드 그대로
  const fetchPatientData = async () => {
    try {
      // 전체 OpenMRS 환자 목록
      const masterRes = await axios.get(OPENMRS_API_MASTER);
      setPatientsMaster(masterRes.data);

      // 오늘 접수된 환자 목록
      const receptionRes = await axios.get(`${API_BASE}reception-list/`);
      const list = receptionRes.data.map(item => {
        let displayStatus = item.status; // 기본적으로 백엔드 status 사용

        switch (item.status) {
          case 'waiting':
            displayStatus = item.assigned_room ? `🧍 진료실 ${item.assigned_room}번 배정` : '⏳ 대기중';
            break;
          case 'in_progress':
            displayStatus = '💉 진료 중';
            break;
          case 'complete':
            displayStatus = '✅ 진료 완료';
            break;
          default:
            displayStatus = `❓ ${item.status || '알 수 없음'}`;
        }

        return {
          ...item,
          status: displayStatus, // 변환된 한글 상태 값
          timestamp: item.created_at, // created_at을 timestamp로 사용
        };
      });
      setReceptionList(list);
    } catch (err) {
      console.error('환자/접수 목록 불러오기 실패', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchPatientData();
    const interval = setInterval(() => {
      fetchAllData();
      fetchPatientData();
    }, 5000); // 5초마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 자동완성 제안 - 기존 코드 그대로
  useEffect(() => {
    const q = query.trim().toLowerCase();
    setSuggestions(
      q
        ? patientsMaster.filter(p =>
            p.display.toLowerCase().includes(q) ||
            p.identifiers?.[0]?.identifier.includes(q)
          )
        : []
    );
  }, [query, patientsMaster]);

  // 접수 처리 - 기존 코드 그대로
  const handleReception = async (patientRow = null) => {
    const patient = patientRow || patientsMaster.find(p => p.display === query.trim());
    if (!patient) {
      return alert('환자 이름을 목록에서 클릭하거나 정확히 입력해주세요.');
    }
    const id = patient.identifiers?.[0]?.identifier;
    if (receptionList.some(r => r.patient_identifier === id)) {
      return alert('이미 접수된 환자입니다.');
    }
    
    setActionLoading(id);
    
    try {
      const res = await axios.post(MAPPING_API, {
        openmrs_patient_uuid: patient.uuid,
        patient_identifier: id
      });
      if (!res.data.success) throw new Error(res.data.error || '매핑 실패');

      // 로컬에도 추가 (방금 매핑된 시각을 사용)
      setReceptionList(prev => [
        ...prev,
        {
          mapping_id: res.data.mapping_id, // 새로 생성된 매핑 ID
          patient_identifier: id,
          display: patient.display,
          status: '⏳ 대기중', // 초기 접수 상태
          timestamp: new Date().toISOString()
        }
      ]);
      setQuery('');
      setSuggestions([]);
      alert(`✅ ${cleanPatientName(patient.display)} 환자가 대기 목록에 추가되었습니다.`);
      fetchAllData(); // 데이터 갱신
    } catch (err) {
      console.error('접수 실패', err);
      alert(`접수 실패: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 대기등록 취소 기능 - 기존 코드 그대로
  const handleCancelWaiting = async (mappingId) => {
    const patient = waitingList.find(p => p.mapping_id === mappingId);
    const patientName = patient?.name || patient?.display || '알 수 없는 환자';

    if (!window.confirm(`${patientName}님의 대기등록을 취소하시겠습니까?\n(완전히 삭제되며 되돌릴 수 없습니다)`)) {
      return;
    }

    setActionLoading(mappingId);

    try {
      const response = await axios.delete(`${API_BASE}cancel-waiting/${mappingId}/`);
      
      if (response.data.success) {
        alert(`${patientName}님의 대기등록이 취소되었습니다.`);
        fetchAllData(); // 목록 새로고침
      } else {
        throw new Error(response.data.error || '대기등록 취소에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 대기등록 취소 실패:', error);
      const errorMessage = error.response?.data?.error || error.message || '대기등록 취소에 실패했습니다.';
      alert(`취소 실패: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 진료 완료 처리 - 기존 코드 그대로
  const handleCompleteTreatment = async (patient) => {
    const patientName = patient.name || patient.display || '알 수 없는 환자';
    const mappingId = patient.mapping_id;
    const currentRoom = patient.assigned_room;

    if (!mappingId) {
      alert('환자의 매핑 ID를 찾을 수 없습니다.');
      return;
    }

    if (!window.confirm(`${patientName}님의 진료를 완료 처리하시겠습니까?\n(완료 목록으로 이동됩니다)`)) {
      return;
    }

    setActionLoading(mappingId);

    try {
      const requestData = {
        mapping_id: mappingId,
        room: currentRoom
      };

      const response = await axios.post(`${API_BASE}complete-treatment/`, requestData);

      if (response.data.success) {
        alert(`${patientName}님의 진료가 완료되어 완료 목록으로 이동되었습니다.`);
        fetchAllData(); // 완료 후 목록 새로고침
      } else {
        throw new Error(response.data.error || '진료 완료 처리에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 진료 완료 처리 실패:', error);
      const errorMessage = error.response?.data?.error || error.message || '진료 완료 처리에 실패했습니다.';
      alert(`완료 처리 실패: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 검색 필터링 - 기존 코드 그대로
  const filterPatients = (patients) => {
    if (!searchTerm) return patients;
    return patients.filter(p => 
      (p.name || p.display || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patient_identifier || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 🔥 환자 배정 처리 - 간소화된 버전 (카드에서만 사용)
  const handleAssign = async (patient, roomNumber) => {
    if (assignedPatients[roomNumber]) {
      alert(`진료실 ${roomNumber}번에 이미 환자가 배정되어 있습니다.`);
      return;
    }

    setActionLoading(patient.mapping_id);

    try {
      const response = await axios.post(`${API_BASE}assign-room/`, {
        mapping_id: patient.mapping_id,
        room: roomNumber
      });

      if (response.data.success) {
        alert(`${patient.name || patient.display}님이 진료실 ${roomNumber}번에 배정되었습니다.`);
        fetchAllData();
      } else {
        throw new Error(response.data.error || '배정에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 환자 배정 실패:', error);
      const errorMessage = error.response?.data?.error || error.message || '환자 배정에 실패했습니다.';
      alert(`배정 실패: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 대기 중 환자 목록 렌더링 - 카드 스타일로 업데이트
  const renderWaitingList = () => {
    const waitingOnly = waitingList.filter(p => !p.assigned_room);
    const filteredWaiting = filterPatients(waitingOnly);

    return (
      <>
        {filteredWaiting.map((patient, index) => (
          <div 
            key={patient.mapping_id || index}
            className="patient-status-card waiting"
          >
            <div className="status-card-header">
              <div className="status-card-name">{patient.display || patient.name}</div>
              <div className="status-card-meta">
                ID: {patient.patient_identifier} | {patient.gender === 'M' ? '남성' : '여성'} | {patient.age}세
                <br />
                대기시간: {patient.wait_time_minutes || 0}분
              </div>
            </div>
            
            <div className="status-card-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssign(patient, 1);
                }}
                disabled={actionLoading === patient.mapping_id || !!assignedPatients[1]}
                className="action-btn primary"
              >
                {!!assignedPatients[1] ? '1번실 사용중' : '1번실 배정'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssign(patient, 2);
                }}
                disabled={actionLoading === patient.mapping_id || !!assignedPatients[2]}
                className="action-btn primary"
              >
                {!!assignedPatients[2] ? '2번실 사용중' : '2번실 배정'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelWaiting(patient.mapping_id);
                }}
                disabled={actionLoading === patient.mapping_id}
                className="action-btn danger"
              >
                {actionLoading === patient.mapping_id ? '취소중...' : '대기취소'}
              </button>
            </div>
          </div>
        ))}
      </>
    );
  };

  // 🔥 배정된 환자 목록 렌더링 - 카드 스타일로 업데이트
  const renderAssignedList = () => {
    const assignedList = Object.values(assignedPatients);
    const filteredAssigned = filterPatients(assignedList);

    return (
      <>
        {filteredAssigned.map((patient, index) => (
          <div 
            key={patient.mapping_id || index}
            className="patient-status-card assigned"
          >
            <div className="status-card-header">
              <div className="status-card-name">{patient.name || patient.display}</div>
              <div className="status-card-meta">
                ID: {patient.patient_identifier} | {patient.gender === 'M' ? '남성' : '여성'} | {patient.age}세
                <br />
                진료실: {patient.assigned_room}번
              </div>
            </div>
            
            <div className="status-card-actions">
              <button
                onClick={() => handleCompleteTreatment(patient)}
                disabled={actionLoading === patient.mapping_id}
                className="action-btn success"
              >
                {actionLoading === patient.mapping_id ? '완료중...' : '진료완료'}
              </button>
            </div>
          </div>
        ))}
      </>
    );
  };

  // 🔥 완료된 환자 목록 렌더링 - 카드 스타일로 업데이트
  const renderCompletedList = () => {
    const filteredCompleted = filterPatients(completedPatients);

    return (
      <>
        {filteredCompleted.map((patient, index) => (
          <div 
            key={patient.mapping_id || index}
            className="patient-status-card completed"
          >
            <div className="status-card-header">
              <div className="status-card-name">{cleanPatientName(patient.name || patient.display)}</div>
              <div className="status-card-meta">
                {patient.gender === 'M' ? '남성' : '여성'} | {patient.age}세
                <br />
                완료시간: {patient.completion_time ? new Date(patient.completion_time).toLocaleTimeString() : 
                          patient.completed_at ? new Date(patient.completed_at).toLocaleTimeString() : '-'}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 왼쪽 패널 - 환자 목록 (ReceptionPanel 기능) */}
      <div style={{ 
        width: '35%', 
        background: 'white', 
        borderRight: '1px solid #e0e6ed',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 헤더 */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e0e6ed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ 
              margin: '0 0 15px 0', 
              color: '#2c3e50',
              fontSize: '18px'
            }}>
              환자 목록
            </h2>
            
            {/* 검색창 */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} 
              />
              <input
                type="text"
                placeholder="환자명 또는 ID로 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 35px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          
          {/* 환자 등록 버튼 */}
          <button
            onClick={() => setShowRegistrationForm(true)}
            style={{
              padding: '8px 12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            환자등록
          </button>
        </div>

        {/* 환자 목록 */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '8px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              로딩 중...
            </div>
          ) : (
            patientsMaster.map((patient) => {
              const patientId = patient.identifiers?.[0]?.identifier;
              const isRegistered = receptionList.some(r => r.patient_identifier === patientId);
              
              return (
                <div 
                  key={patient.uuid}
                  style={{
                    background: 'white',
                    border: '1px solid #e0e6ed',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '6px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#1f2937',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>
                        {cleanPatientName(patient.display)}
                      </div>
                      <div style={{ 
                        color: '#64748b',
                        lineHeight: '1.3'
                      }}>
                        <div>성별: {patient.person?.gender === 'M' ? '남성' : patient.person?.gender === 'F' ? '여성' : '-'}</div>
                        <div>생년월일: {patient.person?.birthdate ? new Date(patient.person.birthdate).toLocaleDateString('ko-KR') : '-'}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleReception(patient)}
                      disabled={isRegistered || actionLoading === patientId}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        background: isRegistered ? '#e5e7eb' : '#10b981',
                        color: isRegistered ? '#6b7280' : 'white',
                        fontSize: '11px',
                        cursor: isRegistered ? 'not-allowed' : 'pointer',
                        minWidth: '70px'
                      }}
                    >
                      {actionLoading === patientId ? '등록중...' : 
                       isRegistered ? '등록됨' : '대기등록'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 오른쪽 패널 - 상태별 환자 관리 (UnifiedPatientStatus 기능) */}
      <div style={{ 
        width: '65%', 
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 탭 네비게이션 */}
        <div style={{ 
          display: 'flex', 
          background: 'white',
          borderBottom: '1px solid #e0e6ed'
        }}>
          <div style={{
            flex: 1,
            padding: '16px',
            textAlign: 'center',
            borderRight: '1px solid #e0e6ed',
            background: '#fff7ed'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Clock size={18} color="#f59e0b" />
              <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '15px' }}>
                대기중 ({waitingList.filter(p => !p.assigned_room).length})
              </h3>
            </div>
          </div>
          
          <div style={{
            flex: 1,
            padding: '16px',
            textAlign: 'center',
            borderRight: '1px solid #e0e6ed',
            background: '#eff6ff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Users size={18} color="#3b82f6" />
              <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '15px' }}>
                진료실 배정 ({Object.keys(assignedPatients).length})
              </h3>
            </div>
          </div>
          
          <div style={{
            flex: 1,
            padding: '16px',
            textAlign: 'center',
            background: '#f0fdf4'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CheckCircle size={18} color="#10b981" />
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '15px' }}>
                완료 ({completedPatients.length})
              </h3>
            </div>
          </div>
        </div>

        {/* 상태별 환자 리스트 */}
        <div className="status-lists-container">
          {/* 대기중 */}
          <div className="status-list">
            {renderWaitingList()}
          </div>

          {/* 진료실 배정 */}
          <div className="status-list">
            {renderAssignedList()}
          </div>

          {/* 완료 */}
          <div className="status-list">
            {renderCompletedList()}
          </div>
        </div>
      </div>

      {/* PatientRegistrationForm 토스트 */}
      {showRegistrationForm && (
        <div className={`registration-toast ${showRegistrationForm ? 'show' : ''}`}>
          <PatientRegistrationForm 
            onClose={() => setShowRegistrationForm(false)}
            onPatientCreated={(newPatient) => {
              setPatientsMaster(prev => [...prev, newPatient]);
              setShowRegistrationForm(false);
              fetchAllData();
              fetchPatientData();
            }}
          />
        </div>
      )}
    </div>
  );
};

// PatientRegistrationForm 컴포넌트 (기존 코드 그대로 복사)
const PatientRegistrationForm = ({ onClose, onPatientCreated }) => {
  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    middleName: '',
    gender: '',
    birthdate: '',
    address: {
      address1: '',
      address2: '',
      cityVillage: '',
      stateProvince: '',
      country: '',
      postalCode: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('http://35.225.63.41:8000/api/integration/patients/create-auto-id/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const autoGeneratedId = data.patient.patient_identifier;
        const mappingInfo = data.mapping_created ? ' (환자 매핑 생성됨)' : '';
        const idGenInfo = data.openmrs_idgen_used ? ' (OpenMRS IdGen 사용)' : '';
        
        setMessage({
          type: 'success',
          text: `✅ 환자 등록 성공! 자동 생성 ID: ${autoGeneratedId}${mappingInfo}${idGenInfo}`
        });
        
        // 폼 초기화
        resetForm();
        
        // 부모 컴포넌트에 새 환자 생성 알림
        if (onPatientCreated) {
          onPatientCreated(data.patient);
        }
        
      } else {
        setMessage({
          type: 'error',
          text: data.error || '환자 등록에 실패했습니다.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `서버 연결 오류: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      givenName: '',
      familyName: '',
      middleName: '',
      gender: '',
      birthdate: '',
      address: {
        address1: '',
        address2: '',
        cityVillage: '',
        stateProvince: '',
        country: '',
        postalCode: ''
      }
    });
    setMessage('');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="toast-content">
      {/* 헤더 */}
      <div className="toast-header">
        <h2 className="toast-title">환자 등록</h2>
        <button onClick={onClose} className="toast-close-btn">
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* 자동 ID 생성 안내 */}
        <div className="form-notice">
          <div className="notice-title">🆔 자동 ID 생성</div>
          <p className="notice-text">
            환자 ID는 OpenMRS에서 자동으로 생성됩니다.
          </p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 필수 정보 */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">필수 정보</legend>
            
            <div className="form-group">
              <label className="form-label">이름 *:</label>
              <input
                type="text"
                value={formData.givenName}
                onChange={(e) => handleInputChange('givenName', e.target.value)}
                required
                placeholder="환자의 이름을 입력하세요"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">성 *:</label>
              <input
                type="text"
                value={formData.familyName}
                onChange={(e) => handleInputChange('familyName', e.target.value)}
                required
                placeholder="환자의 성을 입력하세요"
                className="form-input"
              />
            </div>

            {/* <div className="form-group">
              <label className="form-label">중간 이름:</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                placeholder="중간 이름 (선택사항)"
                className="form-input"
              />
            </div> */}

            <div className="form-group">
              <label className="form-label">성별 *:</label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                required
                className="form-select"
              >
                <option value="">성별을 선택하세요</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">생년월일 *:</label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
                required
                className="form-input"
              />
            </div>
          </fieldset>

          {/* 주소 정보 */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">주소 정보</legend>
            
            <div className="form-group">
              <label className="form-label">주소 1:</label>
              <input
                type="text"
                value={formData.address.address1}
                onChange={(e) => handleInputChange('address.address1', e.target.value)}
                placeholder="기본 주소"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">시/구:</label>
              <input
                type="text"
                value={formData.address.cityVillage}
                onChange={(e) => handleInputChange('address.cityVillage', e.target.value)}
                placeholder="시/구"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">국가:</label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                placeholder="국가"
                className="form-input"
              />
            </div>
          </fieldset>

          {/* 버튼들 */}
          <div className="form-buttons">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="form-btn primary"
            >
              {isSubmitting ? '등록 중...' : '환자 등록'}
            </button>
            
            <button 
              type="button" 
              onClick={resetForm}
              disabled={isSubmitting}
              className="form-btn secondary"
            >
              초기화
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedPatientStatus;