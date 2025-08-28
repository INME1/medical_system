import React, { useState, useMemo } from 'react';
import { 
  TestTube, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle,
  User,
  Calendar,
  Stethoscope,
  Activity,
  Microscope
} from 'lucide-react';

const LisRequestPanel = ({ patient, onRequestComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPanel, setSelectedPanel] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [priority, setPriority] = useState('ROUTINE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // LIS 검사 패널 정의
  const testPanels = useMemo(() => [
    {
      id: 'CBC',
      name: '천식 검사',
      icon: TestTube,
      color: '#3b82f6',
      tests: ['WBC','Neutrophil%', 'Lymphocyte%', 'Eosinophil%', 'Hemoglobin', 'Platelet']
    },
    {
      id: 'CRP',
      name: '폐렴 검사',
      icon: Activity,
      color: '#10b981',
      tests: ['CRP']
    },
    {
      id: 'NT-proBNP',
      name: '심부전 검사',
      icon: Microscope,
      color: '#f59e0b',
      tests: ['NT-proBNP']
    },
    {
      id: 'D-Dimer',
      name: '폐색전증 검사',
      icon: Stethoscope,
      color: '#8b5cf6',
      tests: ['D-Dimer']
    },
    {
      id: 'ABGA',
      name: '만성 폐쇄성 폐질환 검사',
      icon: Calendar,
      color: '#ef4444',
      tests: ['pCO2', 'pO2', 'pH', 'HCO3', 'O2_sat'],
    }
  ], []);

  const steps = [
    { title: 'Panel Selection', subtitle: '검사 패널 선택' },
    { title: 'Test Details', subtitle: '검사 상세 설정' },
    { title: 'Review & Submit', subtitle: '검토 및 제출' }
  ];

  // 유틸리티 함수들 (원래 코드에서 완전히 가져옴)
  const normalizeOpenMRSPatient = (patient) => {
    if (!patient) return null;
    
    return {
      uuid: patient.uuid,
      identifier: patient.identifiers?.[0]?.identifier || patient.identifier || patient.uuid || '',
      name: patient.display || patient.name || patient.patient_name || '',
      givenName: patient.person?.preferredName?.givenName || '',
      familyName: patient.person?.preferredName?.familyName || '',
      birthdate: patient.person?.birthdate || patient.birthdate || '',
      gender: patient.person?.gender || patient.gender || '',
      age: calculateAge(patient.person?.birthdate || patient.birthdate),
      originalData: patient
    };
  };

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

  const getGenderDisplay = (gender) => {
    if (!gender) return '미상';
    
    const genderMap = {
      'M': '남성',
      'F': '여성',
      'O': '기타',
      'U': '미상',
      'MALE': '남성',
      'FEMALE': '여성',
      'OTHER': '기타',
      'UNKNOWN': '미상'
    };
    
    return genderMap[gender.toUpperCase()] || '미상';
  };

  const validatePatientData = (patient) => {
    const errors = [];
    
    if (!patient.name && !patient.givenName) {
      errors.push('환자 이름이 필요합니다.');
    }
    
    if (!patient.identifier) {
      errors.push('환자 식별번호가 필요합니다.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleAPIError = (error, context = '') => {
    console.error(`${context} API 에러:`, error);
    
    if (error.response) {
      const status = error?.response?.status || 'No Response';
      const message = error.response.data?.message || error.response.data?.detail || error.message;
      
      switch (status) {
        case 400:
          return `잘못된 요청: ${message}`;
        case 401:
          return '인증이 필요합니다. 다시 로그인해주세요.';
        case 403:
          return '접근 권한이 없습니다.';
        case 404:
          return '요청한 리소스를 찾을 수 없습니다.';
        case 500:
          return '서버 내부 오류가 발생했습니다.';
        default:
          return `서버 오류 (${status}): ${message}`;
      }
    } else if (error.request) {
      return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
    } else {
      return `요청 오류: ${error.message}`;
    }
  };

  const saveIntegrationLog = async (action, data, result = null, error = null) => {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        data: JSON.stringify(data),
        result: result ? JSON.stringify(result) : null,
        error: error ? error.toString() : null,
        system: 'CDSS-Integration'
      };
      
      console.log('Integration Log:', logEntry);
      
    } catch (err) {
      console.error('로그 저장 실패:', err);
    }
  };

  // 환자 정보 표시용 헬퍼 함수들
  const getPatientDisplayInfo = () => {
    const normalized = normalizeOpenMRSPatient(patient);
    return normalized;
  };

  // 네비게이션
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // 패널 선택
  const handlePanelSelect = (panelId) => {
    const panel = testPanels.find(p => p.id === panelId);
    setSelectedPanel(panelId);
    setSelectedTests(panel ? panel.tests : []);
  };

  // 검사 제출 (원래 코드에서 완전히 가져옴)
  const handleSubmit = async () => {
    if (!selectedPanel || !patient) return;
    
    // 환자 데이터 정규화 및 유효성 검증
    const normalizedPatient = normalizeOpenMRSPatient(patient);
    const validation = validatePatientData(normalizedPatient);
    
    if (!validation.isValid) {
      setError(`환자 정보 오류: ${validation.errors.join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError(null);

    let orderData = null;

    try {
      const selectedPanelData = testPanels.find(p => p.id === selectedPanel);
      
      // 🔥 실제 백엔드 orders 모델에 맞춘 데이터 구조 (원래 코드 그대로)
      orderData = {
        // Order 모델의 실제 필드들에 맞춤
        patient_id: normalizedPatient.identifier,
        patient_name: normalizedPatient.name,
        
        // 검사 관련 필드 - 원래 코드처럼 selectedPanel 직접 사용
        test_type: selectedPanel,  // 검사 패널명
        test_list: selectedTests.join(', '),  // 검사 항목들
        
        // 의뢰 정보 
        doctor_id: 'system_user',
        doctor_name: 'System User',
        
        // 주문 날짜/시간 (실제 백엔드 필드명에 맞춤)
        order_date: new Date().toISOString().split('T')[0],
        order_time: new Date().toTimeString().split(' ')[0],
        
        // 상태 관리
        status: 'pending',  // 실제 백엔드에서 사용하는 상태값
        priority: priority,
        
        // 추가 메타데이터
        notes: notes || `${selectedPanel} 패널 검사 요청`,
        requesting_system: 'CDSS-EMR'
      };

      console.log('🚀 LIS 검사 주문 시작:', orderData);
      
      // 통합 로그 저장 (시작)
      await saveIntegrationLog('LIS_ORDER_START', { 
        patient: normalizedPatient.uuid, 
        panel: selectedPanel 
      });
      
      // 🔥 원래 코드와 동일한 API URL 구성
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}orders/`;
      console.log('📡 최종 API URL:', apiUrl);
      
      // 🔥 원래 코드와 동일하게 fetch 사용하되 실제 동작하도록 시뮬레이션
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData
          },
          message: errorData.message || `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      console.log('✅ LIS 검사 주문 성공:', data);
      
      // 성공 로그 저장
      await saveIntegrationLog('LIS_ORDER_SUCCESS', orderData, data);
      
      alert(`검사 주문이 성공적으로 등록되었습니다.\n주문 ID: ${data.id || data.data?.id || 'N/A'}`);

      
      // 요청 성공 후 폼 초기화 (원래 코드와 동일)
      setCurrentStep(0);
      setSelectedPanel('');
      setSelectedTests([]);
      setPriority('ROUTINE');
      setNotes('');
      
    } catch (err) {
      console.error('❌ LIS 검사 주문 실패:', err);
      console.error('📛 에러 응답:', err.response?.data);
      console.error('📛 서버 메시지:', err.response?.data?.message);
      console.error('📛 서버 traceback:', err.response?.data?.trace);
      
      // 에러 로그 저장 (orderData가 null이 아닐 때만)
      if (orderData) {
        await saveIntegrationLog('LIS_ORDER_ERROR', orderData, null, err);
      }
      
      // 🔥 원래 코드와 동일한 에러 처리
      const errorMessage = handleAPIError(err, 'LIS 검사 주문');
      setError(errorMessage);
      
    } finally {
      setLoading(false);
      // 더미 데이터 용,,,
      // if (typeof onRequestComplete === 'function') {
      //   onRequestComplete();
      // }
    }
  };

  // 환자 정보가 없는 경우
  if (!patient) {
    return (
      <div className="lis-panel">
        <style jsx>{`
          .lis-panel {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            height: 350px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            height: 100%;
            color: #6b7280;
            text-align: center;
            padding: 2rem;
          }
        `}</style>
        <div className="empty-state">
          <User size={24} />
          <span>환자를 선택해 주세요.</span>
        </div>
      </div>
    );
  }

  const selectedPanelData = testPanels.find(p => p.id === selectedPanel);
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="compact-lis-panel">
      <style jsx>{`
        .compact-lis-panel {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: 350px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          padding-bottom: 60px;
          padding-top: 0.75rem;
        }

        /* 수정: 첫 줄 3개, 둘째 줄 2개 - 컴팩트 사이즈 */
        .panel-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          height: 100%;
          grid-template-rows: auto auto;
        }

        .panel-grid .panel-option:nth-child(4) {
          grid-column: 1;
          grid-row: 2;
        }

        .panel-grid .panel-option:nth-child(5) {
          grid-column: 2;
          grid-row: 2;
        }

        .panel-option {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.6rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.3rem;
          min-height: 65px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .panel-option:hover {
          border-color: #059669;
          background: #f0fdf4;
        }

        .panel-option.selected {
          border-color: #059669;
          background: #dcfce7;
        }

        .panel-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          margin-bottom: 0.2rem;
        }

        .panel-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .panel-name {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.15rem;
          font-size: 0.75rem;
          line-height: 1.2;
        }

        .panel-count {
          font-size: 0.65rem;
          color: #6b7280;
        }

        .form-group {
          margin-bottom: 0.75rem;
        }

        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-select, .form-textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.8rem;
          box-sizing: border-box;
        }

        .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .test-list {
          background: #f9fafb;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .test-list-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }

        .test-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .test-item {
          background: #059669;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .review-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .review-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }

        .review-label {
          font-weight: 500;
          color: #6b7280;
        }

        .review-value {
          color: #374151;
        }

        .navigation-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 0.75rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50px;
          box-sizing: border-box;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-prev {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-prev:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-next {
          background: #059669;
          color: white;
        }

        .btn-next:hover:not(:disabled) {
          background: #047857;
        }

        .btn-submit {
          background: #dc2626;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #b91c1c;
        }

        .progress-text {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
      `}</style>

      {/* 내용 */}
      <div className="panel-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Step 0: 패널 선택 */}
        {currentStep === 0 && (
          <div className="panel-grid">
            {testPanels.map((panel) => {
              const PanelIcon = panel.icon;
              return (
                <div
                  key={panel.id}
                  className={`panel-option ${selectedPanel === panel.id ? 'selected' : ''}`}
                  onClick={() => handlePanelSelect(panel.id)}
                >
                  <div className="panel-icon" style={{ backgroundColor: panel.color }}>
                    <PanelIcon size={14} />
                  </div>
                  <div className="panel-info">
                    <div className="panel-name">{panel.name}</div>
                    <div className="panel-count">{panel.tests.length}개</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: 상세 설정 - 개선된 레이아웃 */}
        {currentStep === 1 && selectedPanelData && (
          <>
            <div className="test-list">
              <div className="test-list-title">선택된 검사 항목</div>
              <div className="test-items">
                {selectedTests.map((test, index) => (
                  <span key={index} className="test-item">{test}</span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">우선순위</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="ROUTINE">일반</option>
                <option value="URGENT">긴급</option>
                <option value="STAT">응급</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">특이사항 (선택)</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="특이사항 입력..."
              />
            </div>
          </>
        )}

        {/* Step 2: 검토 */}
        {currentStep === 2 && selectedPanelData && (
          <div className="review-section">
            <div className="review-item">
              <span className="review-label">환자</span>
              <span className="review-value">
                {getPatientDisplayInfo()?.name?.includes(' - ') ? 
                  getPatientDisplayInfo().name.split(' - ')[1] : 
                  getPatientDisplayInfo()?.name
                }
              </span>
            </div>
            <div className="review-item">
              <span className="review-label">검사 패널</span>
              <span className="review-value">{selectedPanelData.name}</span>
            </div>
            <div className="review-item">
              <span className="review-label">검사 항목</span>
              <span className="review-value">{selectedTests.length}개</span>
            </div>
            <div className="review-item">
              <span className="review-label">우선순위</span>
              <span className="review-value">{priority}</span>
            </div>
            {notes && (
              <div className="review-item">
                <span className="review-label">특이사항</span>
                <span className="review-value">{notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="navigation-bar">
        <button
          className="nav-btn btn-prev"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={14} />
          이전
        </button>

        <div className="progress-text">
          {selectedPanel ? `${selectedPanelData?.name || ''} 선택됨` : '패널을 선택하세요'}
        </div>

        {isLastStep ? (
          <button
            className="nav-btn btn-submit"
            onClick={handleSubmit}
            disabled={loading || !selectedPanel}
          >
            {loading ? '제출 중...' : (
              <>
                <Send size={14} />
                제출
              </>
            )}
          </button>
        ) : (
          <button
            className="nav-btn btn-next"
            onClick={handleNext}
            disabled={currentStep === 0 && !selectedPanel}
          >
            다음
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default LisRequestPanel;