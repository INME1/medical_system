// frontend/src/components/DocDashBoard/DocDashBoard.jsx
// 🔥 업데이트된 의사 대시보드 - 개선된 패널들 적용
// frontend/src/components/DocDashBoard/DocDashBoard.jsx
// 🔥 업데이트된 의사 대시보드 - 개선된 패널들 적용

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  Monitor,
  FileText, 
  Activity, 
  Brain,
  Calendar,
  Search,
  Stethoscope,
  TestTube,
  Camera,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  LogOut,
  Save,
  AlertCircle,
  Phone,
  MapPin,
  UserCheck,
  X
} from 'lucide-react';

// 개별 컴포넌트들 import
import AssignedPatientList from '../EMR/AssignedPatientList';
import PatientInfoPanel from '../EMR/PatientInfoPanel';
import LisRequestPanel from '../EMR/LisRequestPanel';
import ImagingRequestPanel from '../EMR/ImagingRequestPanel';
import { DEFAULT_DOCTOR_ID } from '../EMR/lisConfig';
import ResultModal from '../LIS/ResultModal';
import { useParams } from 'react-router-dom';
import { generateCdssDummyResult } from '../utils/dummy';

// 개선된 패널들 import
import VisitHistoryPanel from '../EMR/VisitHistoryPanel';
import DiagnosisPrescriptionPanel from '../EMR/DiagnosisPrescriptionPanel';

// CSS 파일 import
import './DocDashBoard.css';

const DocDashBoard = ({ patient }) => {
  // 🔥 상태 관리
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('assigned');
  const [allSearchResults, setAllSearchResults] = useState([]);
  const [isSearchingAllPatients, setIsSearchingAllPatients] = useState(false);
  const [allSearchError, setAllSearchError] = useState(null);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
  const [assignedPatients, setAssignedPatients] = useState({});
  const [personUUID, setPersonUUID] = useState(null);
  const [uuidLoading, setUuidLoading] = useState(false);
  const [uuidError, setUuidError] = useState(null);
  const [cdssResult, setCdssResult] = useState(null);
  const [cdssDummy, setCdssDummy] = useState(null);
  const { sampleId } = useParams();

  // 🩺 의사 정보 상태
  const [doctorInfo, setDoctorInfo] = useState({
    name: '김의사',
    department: '내과',
    status: '진료중',
    patientCount: 0
  });

  // 🔥 드롭다운 상태 관리
  const [dropdownStates, setDropdownStates] = useState({
    consultation: false,
    history: false,
    diagnosis: false
  });

  // 🔥 환자 카드 펼침 상태 관리
  const [expandedPatients, setExpandedPatients] = useState(new Set());

  const API_BASE = process.env.REACT_APP_INTEGRATION_API;

  // 🔥 현재 시간 상태
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🔥 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 🔥 의사 정보 업데이트 (환자 수 반영)
  useEffect(() => {
    const patientCount = Object.values(assignedPatients).filter(p => p !== null).length;
    setDoctorInfo(prev => ({
      ...prev,
      patientCount
    }));
  }, [assignedPatients]);

  // 🔥 드롭다운 토글 함수
  const toggleDropdown = (cardName) => {
    setDropdownStates(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  // 🔥 환자 카드 펼침 토글 함수
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

  // 🔥 전체 환자 검색 함수
  const fetchAllPatientsFromBackend = async () => {
    if (searchTerm.trim() === '') {
      setAllSearchResults([]);
      return;
    }
    setIsSearchingAllPatients(true);
    setAllSearchError(null);
    try {
      const res = await axios.get(`${API_BASE}openmrs/patients/search/?q=${searchTerm}`);
      setAllSearchResults(Array.isArray(res.data.results) ? res.data.results : []);
    } catch (err) {
      console.error('전체 환자 검색 실패:', err.response ? err.response.data : err.message);
      setAllSearchError('전체 환자 검색 중 오류가 발생했습니다. 백엔드 연결 및 API 경로를 확인하세요.');
      setAllSearchResults([]);
    } finally {
      setIsSearchingAllPatients(false);
    }
  };

  // 🔥 환자 진료실 배정 함수
  const handleAssignToRoom = async (patientToAssign, roomNumber) => {
    if (!patientToAssign) {
      alert('환자를 먼저 선택해주세요.');
      return;
    }
    if (assignedPatients[roomNumber]) {
      alert(`진료실 ${roomNumber}번에 이미 환자가 배정되어 있습니다.`);
      return;
    }
    
    try {
      const newMappingResponse = await axios.post(`${API_BASE}create-identifier-based-mapping/`, {
        openmrs_patient_uuid: patientToAssign.uuid,
        patient_identifier: patientToAssign.patient_identifier,
      });

      if (newMappingResponse.data.success) {
        const newMappingId = newMappingResponse.data.mapping_id;
        
        const assignResponse = await axios.post(`${API_BASE}assign-room/`, {
          mapping_id: newMappingId,
          room: roomNumber
        });

        if (assignResponse.data.success) {
          alert(`${patientToAssign.name}님이 진료실 ${roomNumber}번에 배정되었습니다.`);
          setSelectedPatient(null);
          setScheduleRefresh(prev => prev + 1);
        } else {
          throw new Error(assignResponse.data.error || '배정에 실패했습니다.');
        }
      } else {
        alert('환자 매핑 생성에 실패했습니다: ' + (newMappingResponse.data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('환자 매핑 생성 및 배정 실패:', error.response?.data || error.message);
      alert('환자 매핑 생성 및 배정에 실패했습니다: ' + (error.response?.data?.error || error.message));
    }
  };

  // 🔥 진료 종료 함수
  const handleEndConsultation = async () => {
    if (!selectedPatient) {
      alert('진료를 종료할 환자가 선택되지 않았습니다.');
      return;
    }

    const patientName = selectedPatient.name || selectedPatient.display || selectedPatient.patient_name || '알 수 없는 환자';
    const mappingId = selectedPatient.mapping_id || selectedPatient.id;
    const currentRoom = selectedPatient.assigned_room;

    if (!mappingId) {
      alert('환자의 매핑 정보를 찾을 수 없습니다.\n환자가 올바르게 배정되었는지 확인해주세요.');
      return;
    }

    if (!currentRoom) {
      alert('환자의 진료실 정보를 찾을 수 없습니다.\n환자가 진료실에 배정되었는지 확인해주세요.');
      return;
    }

    const confirmMessage = `${patientName}님의 진료를 완료하시겠습니까?\n\n` +
                          `📍 진료실: ${currentRoom}번\n` +
                          `⚠️ 진료 완료 후에는 되돌릴 수 없습니다.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const requestData = {
        mapping_id: mappingId,
        room: currentRoom
      };

      const response = await axios.post(`${API_BASE}complete-treatment/`, requestData);

      if (response.data.success) {
        alert(`✅ ${patientName}님의 진료가 성공적으로 완료되었습니다.\n진료실 ${currentRoom}번이 해제되었습니다.`);
        
        setSelectedPatient(null);
        setPersonUUID(null);
        setUuidError(null);
        
        setDropdownStates({
          consultation: false,
          history: false,
          diagnosis: false
        });

        setScheduleRefresh(prev => prev + 1);
        
        try {
          const channel = new BroadcastChannel('patient_channel');
          channel.postMessage({
            type: 'TREATMENT_COMPLETED',
            patient: patientName,
            room: currentRoom,
            timestamp: new Date().toISOString()
          });
          channel.close();
        } catch (bcError) {
          console.error('BroadcastChannel 알림 실패:', bcError);
        }

      } else {
        const errorMessage = response.data.error || '진료 완료 처리에 실패했습니다.';
        alert(`❌ 진료 완료 처리 실패:\n${errorMessage}`);
      }

    } catch (error) {
      console.error('❌ 진료 완료 API 호출 실패:', error);
      
      let errorMessage = '진료 완료 처리 중 오류가 발생했습니다.';
      
      if (error.response) {
        const serverError = error.response.data?.error || error.response.data?.message || '서버 오류';
        errorMessage = `서버 오류 (${error.response.status}): ${serverError}`;
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
      } else {
        errorMessage = `요청 오류: ${error.message}`;
      }

      alert(`❌ 진료 완료 실패:\n${errorMessage}\n\n관리자에게 문의하시거나 잠시 후 다시 시도해주세요.`);
    }
  };

  // 검색 실행
  const handleMainSearch = () => {
    if (searchMode === 'all') {
      fetchAllPatientsFromBackend();
    }
  };

  // const handleLisRequestComplete = () => {
  //   setTimeout(() => {
  //     const dummy = generateCdssDummyResult(selectedPatient);
  //     setCdssResult(dummy);
  //   }, 15000);
  // };

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    if (searchMode === 'all') {
      const handler = setTimeout(() => {
        fetchAllPatientsFromBackend();
      }, 300);
      return () => clearTimeout(handler);
    } else {
      setAllSearchResults([]);
    }
  }, [searchTerm, searchMode]);

  // UUID 조회
  useEffect(() => {
    const fetchPersonUUID = async () => {
      if (!selectedPatient || !selectedPatient.patient_identifier) {
        setPersonUUID(null);
        return;
      }

      setUuidLoading(true);
      setUuidError(null);

      try {
        const res = await axios.get(
          `${API_BASE}person-uuid-by-identifier/${selectedPatient.patient_identifier}/`
        );

        if (res.data.success) {
          setPersonUUID(res.data.person_uuid);
        } else {
          setUuidError(res.data.error || 'UUID 조회 실패');
          setPersonUUID(null);
        }
      } catch (err) {
        console.error('UUID 조회 실패:', err);
        console.log("📛 fetchCdssResult에 사용된 sampleId:", sampleId);
        setUuidError('서버와의 통신에 실패했습니다.');
        setPersonUUID(null);
      } finally {
        setUuidLoading(false);
      }
    };

    fetchPersonUUID();
  }, [selectedPatient]);

  useEffect(() => {
  if (!selectedPatient || !selectedPatient.patient_identifier) return;

  axios.get(`${API_BASE}cdss_result/?patient_id=${selectedPatient.patient_identifier}`)
    .then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCdssResult(res.data[0]);  // 최신 결과만 표시
      } else {
        setCdssResult(null);
      }
    })
    .catch(err => {
      console.error('❌ CDSS 결과 가져오기 실패:', err);
      setCdssResult(null);
    });
}, [selectedPatient]);

  // 🔥 슬림한 환자 카드 컴포넌트
  const CollapsiblePatientCard = ({ 
    patient, 
    isSelected, 
    onSelect, 
    onAssign, 
    onComplete 
  }) => {
    const patientId = patient.uuid || patient.mapping_id;
    const isExpanded = expandedPatients.has(patientId);

    const handleHeaderClick = (e) => {
      e.stopPropagation();
      onSelect(patient);
      togglePatientExpansion(patientId);
    };

    const handleAssignClick = (e) => {
      e.stopPropagation();
      if (onAssign) {
        onAssign(patient, 1);
      }
    };

    const handleCompleteClick = (e) => {
      e.stopPropagation();
      if (onComplete) {
        onComplete(patient);
      }
    };

    const getPatientStatus = () => {
      if (patient.assigned_room) {
        return { status: 'in-progress', label: '진료중' };
      } else if (patient.waiting) {
        return { status: 'waiting', label: '대기중' };
      } else {
        return { status: 'completed', label: '완료' };
      }
    };

    const { status, label } = getPatientStatus();

    return (
      <div className={`collapsible-patient-card ${isSelected ? 'selected' : ''} ${!isExpanded ? 'collapsed' : ''}`}>
        <div 
          className={`patient-card-header ${isSelected ? 'selected' : ''}`}
          onClick={handleHeaderClick}
        >
          <div className="patient-basic-info">
            <div className="patient-name-header">
              <User size={12} />
              {patient.display || patient.name || 'Unknown Patient'}
            </div>
            <div className="patient-id-header">
              ID: {patient.patient_identifier || patient.uuid?.substring(0, 8) || 'N/A'}
            </div>
            <div className="patient-basic-details">
              <span>{patient.person?.gender === 'M' ? '남성' : '여성'}</span>
              <span>{patient.person?.age || '나이 미상'}세</span>
              <div className={`patient-status-badge ${status}`}>
                {label}
              </div>
            </div>
          </div>
          <ChevronDown 
            size={14} 
            className={`patient-toggle-icon ${isExpanded ? 'expanded' : ''}`}
          />
        </div>

        <div className={`patient-card-content ${isExpanded ? 'expanded' : ''}`}>
          <div className="patient-card-body">
            <div className="patient-detail-section">
              <div className="patient-detail-row">
                <span className="detail-label">
                  <Calendar size={10} /> 생년월일
                </span>
                <span className="detail-value">
                  {patient.person?.birthdate ? 
                    new Date(patient.person.birthdate).toLocaleDateString('ko-KR') : 
                    '1995-07-15'
                  }
                </span>
              </div>
              
              <div className="patient-detail-row">
                <span className="detail-label">
                  <Phone size={10} /> 연락처
                </span>
                <span className="detail-value">
                  {patient.person?.phone || '010-0000-0000'}
                </span>
              </div>
              
              <div className="patient-detail-row">
                <span className="detail-label">
                  <Activity size={10} /> 진료실
                </span>
                <span className="detail-value">
                  {patient.assigned_room ? `${patient.assigned_room}번` : '미배정'}
                </span>
              </div>
            </div>

            <div className="patient-detail-section">
              <select className="patient-dropdown-select">
                <option value="">검사 패널 선택</option>
                <option value="basic">기본 검사</option>
                <option value="comprehensive">종합 검사</option>
                <option value="cardiac">심장 검사</option>
              </select>
            </div>

            <button className="patient-order-button">
              <Activity size={12} />
              검사 주문
            </button>

            <div className="patient-actions">
              {!patient.assigned_room ? (
                <button 
                  className="patient-action-btn assign"
                  onClick={handleAssignClick}
                >
                  <UserCheck size={12} />
                  배정
                </button>
              ) : (
                <button 
                  className="patient-action-btn complete"
                  onClick={handleCompleteClick}
                >
                  <X size={12} />
                  완료
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔥 슬림한 드롭다운 카드 컴포넌트
  const DropdownCard = ({ 
    cardKey, 
    title, 
    icon: Icon, 
    children, 
    className = '' 
  }) => (
    <div className={`dropdown-card ${className}`}>
      <div 
        className="dropdown-header"
        onClick={() => toggleDropdown(cardKey)}
      >
        <div className="dropdown-title">
          <Icon size={18} />
          <span>{title}</span>
        </div>
        <div className={`dropdown-toggle ${dropdownStates[cardKey] ? 'expanded' : ''}`}>
          {dropdownStates[cardKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      <div className={`dropdown-content ${dropdownStates[cardKey] ? 'expanded' : ''}`}>
        <div className="dropdown-body">
          {children}
        </div>
      </div>
    </div>
  );

  // 🔥 환자 카드 리스트 렌더링
  const renderPatientList = () => {
    if (searchMode === 'assigned') {
      return (
        <AssignedPatientList
          onPatientSelect={setSelectedPatient}
          selectedPatient={selectedPatient}
          refreshTrigger={scheduleRefresh}
          searchTerm={searchTerm}
        />
      );
    } else {
      return (
        <div className="all-patients-grid">
          {isSearchingAllPatients && (
            <div className="loading-message">검색 중...</div>
          )}
          {allSearchError && (
            <div className="error-message">⚠️ {allSearchError}</div>
          )}
          {!isSearchingAllPatients && !allSearchError && allSearchResults.length === 0 && searchTerm.trim() !== '' ? (
            <div className="no-results">검색 결과가 없습니다.</div>
          ) : (
            !isSearchingAllPatients && allSearchResults.map(p => {
              const patientUniqueId = p.uuid;
              const isSelected = selectedPatient?.uuid === patientUniqueId;

              return (
                <CollapsiblePatientCard
                  key={patientUniqueId}
                  patient={{
                    uuid: patientUniqueId,
                    mapping_id: null,
                    display: p.name,
                    name: p.name,
                    assigned_room: null,
                    person: { age: p.age, gender: p.gender, birthdate: p.birthdate },
                    identifiers: [{ identifier: p.patient_identifier, identifierType: 'OpenMRS ID', preferred: true }],
                    patient_identifier: p.patient_identifier,
                    ...p
                  }}
                  isSelected={isSelected}
                  onSelect={(patient) => setSelectedPatient(patient)}
                  onAssign={handleAssignToRoom}
                  onComplete={(patient) => console.log('Complete:', patient)}
                />
              );
            })
          )}
          {!isSearchingAllPatients && !allSearchError && allSearchResults.length === 0 && searchTerm.trim() === '' && (
            <div className="search-prompt">
              이름 또는 ID를 입력하여 검색합니다.
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="doctor-dashboard">
      {/* 🔥 슬림한 대시보드 헤더 - 의사 정보 포함 */}
      <div className="dashboard-header">
        <div className="header-left">
          <Stethoscope className="header-icon" />
          <h1 className="dashboard-title">의사 대시보드</h1>
          
          {/* 🩺 의사 정보 패널 */}
          <div className="doctor-info-panel">
            <div className="doctor-avatar">
              <Stethoscope size={18} />
            </div>
            <div className="doctor-details">
              <h4>Dr. {doctorInfo.name}</h4>
              <p>{doctorInfo.department} • 환자 {doctorInfo.patientCount}명 • {doctorInfo.status}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <Clock className="time-icon" />
          <span className="current-time">
            {currentTime.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* 🔥 슬림한 메인 컨테이너 */}
      <div className="dashboard-main">
        {/* 🔥 좌측 사이드바 - 환자 검색 */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <Search className="section-icon" />
              <h3>환자 검색</h3>
              <div className="search-mode-toggle">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="searchMode"
                    value="assigned"
                    checked={searchMode === 'assigned'}
                    onChange={() => {
                      setSearchMode('assigned');
                      setAllSearchResults([]);
                      setSearchTerm('');
                    }}
                  />
                  배정 환자
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="searchMode"
                    value="all"
                    checked={searchMode === 'all'}
                    onChange={() => {
                      setSearchMode('all');
                      setAllSearchResults([]);
                      setSearchTerm('');
                    }}
                  />
                  전체 환자
                </label>
              </div>
            </div>

            <div className="search-controls">
              <input
                type="text"
                placeholder="이름 또는 ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') handleMainSearch(); }}
                className="search-input"
              />
              <button
                onClick={handleMainSearch}
                className="search-button"
              >
                검색
              </button>
            </div>

            <div className="search-results">
              {renderPatientList()}
            </div>
          </div>
        </div>

        {/* 🔥 메인 콘텐츠 상단 - 진단 결과 */}
        <div className="main-content-top">
          {selectedPatient ? (
            <DropdownCard
              cardKey="consultation"
              title="진단 결과 및 전문 내용"
              icon={Activity}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <PatientInfoPanel 
                    patient={selectedPatient} 
                    onOpenDetailModal={() => {}} 
                  />
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <Brain size={16} />
                    AI 분석 결과
                  </h4>
                  {cdssResult ? (
                    <ResultModal data={cdssResult} onClose={() => setCdssResult(null)} isModal={false} />
                  ) : (
                    <div style={{ 
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: 'var(--text-medium)'
                    }}>
                      <Activity size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>AI 분석이 진행 중입니다...</p>
                    </div>
                  )}
                </div>
              </div>
            </DropdownCard>
          ) : (
            <div className="no-patient-selected">
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <h3>환자를 선택해주세요</h3>
                <p>좌측에서 환자를 검색하고 선택하면 진료를 시작할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 🔥 메인 콘텐츠 하단 - 2개 카드 (개선된 패널들 사용) */}
        <div className="main-content-bottom">
          <DropdownCard
            cardKey="history"
            title="내원 이력"
            icon={FileText}
          >
            <VisitHistoryPanel patient={selectedPatient} />
          </DropdownCard>

          <DropdownCard
            cardKey="diagnosis"
            title="진단 및 처방"
            icon={Brain}
          >
            <DiagnosisPrescriptionPanel 
              patient={selectedPatient} 
              onSaveSuccess={(result) => {
                console.log('SOAP 저장 성공:', result);
              }}
            />
          </DropdownCard>
        </div>

        {/* 🔥 우측 컨트롤 패널 */}
        <div className="dashboard-controls">
          {/* LIS 검사 요청 */}
          <div className="control-card">
            <div className="control-header">
              <TestTube size={14} />
              LIS 검사요청
            </div>
            <div className="control-content">
              {selectedPatient ? (
                uuidLoading ? (
                  <div style={{ color: 'var(--text-medium)', fontSize: '0.75rem' }}>UUID 조회 중...</div>
                ) : uuidError ? (
                  <div style={{ color: 'var(--danger-red)', fontSize: '0.75rem' }}>⚠️ {uuidError}</div>
                ) : (
                  <LisRequestPanel
                    patient={selectedPatient}
                    doctorId={DEFAULT_DOCTOR_ID}
                    personUuid={personUUID}
                    compact={true}
                    // onRequestComplete={handleLisRequestComplete}
                  />
                )
              ) : (
                <div style={{ color: 'var(--text-medium)', fontSize: '0.75rem' }}>
                  환자 선택 후<br />이용 가능
                </div>
              )}
            </div>
          </div>
          
          {/* 영상 검사요청 */}
          <div className="control-card">
            <div className="control-header">
              <Camera size={14} />
              영상 검사요청
            </div>
            <div className="control-content">
              {selectedPatient ? (
                <ImagingRequestPanel 
                  selectedPatient={selectedPatient}
                  compact={true}
                />
              ) : (
                <div style={{ color: 'var(--text-medium)', fontSize: '0.75rem' }}>
                  환자 선택 후<br />이용 가능
                </div>
              )}
            </div>
          </div>

          {/* 알림 카드 */}
          <div className="control-card">
            <div className="control-header">
              <AlertCircle size={14} />
              알림
            </div>
            <div className="control-content">
              <div style={{ color: 'var(--text-medium)', fontSize: '0.75rem' }}>
                새로운 알림이<br />없습니다.
              </div>
            </div>
          </div>

          {/* 오늘 진료 요약 카드 */}
          <div className="control-card">
            <div className="control-header">
              <Activity size={14} />
              오늘 요약
            </div>
            <div className="control-content">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.25rem',
                fontSize: '0.7rem',
                color: 'var(--text-dark)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>진료 완료:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success-green)' }}>8명</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>대기 중:</span>
                  <span style={{ fontWeight: 600, color: 'var(--warning-orange)' }}>3명</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>평균 시간:</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>15분</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 슬림한 진료 종료 버튼 */}
      {selectedPatient && (
        <button 
          className="end-consultation-btn"
          onClick={handleEndConsultation}
        >
          <LogOut size={18} />
          진료 종료
        </button>
      )}
    </div>
  );
};

export default DocDashBoard;