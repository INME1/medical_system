import React, { useState, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  User,
  Activity,
  Brain,
  ClipboardList,
  AlertCircle,
  Plus,
  X,
  FileText
} from 'lucide-react';

const DiagnosisPrescriptionPanel = ({ 
  patient, 
  onSaveSuccess, 
  initialData = null 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [soapData, setSoapData] = useState({
    S: '',
    O: '',
    A: '',
    P: ''
  });
  const [icd10Code, setIcd10Code] = useState('');
  const [diagnosisType, setDiagnosisType] = useState('PRIMARY');
  const [isSaving, setIsSaving] = useState(false);

  // SOAP 단계 정의
  const soapSteps = useMemo(() => [
    { 
      key: 'S', 
      title: 'Subjective', 
      icon: User, 
      color: '#3b82f6',
      placeholder: '환자가 호소하는 증상을 기록하세요...',
      description: '환자의 주관적 증상, 불편감, 병력 등'
    },
    { 
      key: 'O', 
      title: 'Objective', 
      icon: Activity, 
      color: '#10b981',
      placeholder: '객관적 관찰 소견을 기록하세요...',
      description: '진찰 소견, 검사 결과, 바이탈 사인 등'
    },
    { 
      key: 'A', 
      title: 'Assessment', 
      icon: Brain, 
      color: '#f59e0b',
      placeholder: '진단 및 평가를 기록하세요...',
      description: '진단명, 병태 평가, 예후 등'
    },
    { 
      key: 'P', 
      title: 'Plan', 
      icon: ClipboardList, 
      color: '#8b5cf6',
      placeholder: '치료 계획을 기록하세요...',
      description: '치료 방법, 처방, 추적 관찰 계획 등'
    }
  ], []);

  const currentStepInfo = soapSteps[currentStep];
  const IconComponent = currentStepInfo.icon;

  // 다음 단계로 이동
  const handleNext = useCallback(() => {
    if (currentStep < soapSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, soapSteps.length]);

  // 이전 단계로 이동
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // 현재 단계 데이터 업데이트
  const handleCurrentStepChange = useCallback((value) => {
    setSoapData(prev => ({
      ...prev,
      [currentStepInfo.key]: value
    }));
  }, [currentStepInfo.key]);

  // 전체 저장
  const handleSave = useCallback(async () => {
    const patientUuid = patient?.person?.uuid || patient?.uuid || patient?.openmrs_patient_uuid;
    const patientName = patient?.name || patient?.display || patient?.patient_name;
    
    if (!patientUuid) {
      alert('환자 정보가 없습니다.');
      return;
    }

    // 빈 데이터 체크
    const hasData = Object.values(soapData).some(value => value.trim() !== '');
    if (!hasData) {
      alert('저장할 SOAP 정보가 없습니다.');
      return;
    }

    // SOAP 엔트리 구성
    const allEntries = [];
    Object.keys(soapData).forEach(soapType => {
      if (soapData[soapType].trim()) {
        allEntries.push({
          soap_type: soapType,
          content: soapData[soapType],
          clinical_notes: '',
          icd10_code: soapType === 'A' ? icd10Code : '',
          icd10_name: '',
          diagnosis_type: soapType === 'A' ? diagnosisType : 'PRIMARY',
          sequence_number: 1
        });
      }
    });

    const requestData = {
      patient_uuid: patientUuid,
      doctor_uuid: 'admin',
      soap_diagnoses: allEntries
    };

    setIsSaving(true);
    try {
      const response = await fetch(`/api/openmrs/soap-diagnoses/bulk_create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`서버 에러 (${response.status})`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        alert(`${patientName}님의 SOAP 진단이 저장되었습니다.`);
        
        // 폼 초기화
        setSoapData({ S: '', O: '', A: '', P: '' });
        setIcd10Code('');
        setCurrentStep(0);
        
        if (onSaveSuccess) {
          onSaveSuccess(result);
        }
      } else {
        throw new Error(result.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [soapData, icd10Code, diagnosisType, patient, onSaveSuccess]);

  // 환자 정보가 없는 경우
  if (!patient) {
    return (
      <div className="compact-soap-panel">
        <div className="empty-state">
          <AlertCircle size={24} />
          <span>환자를 선택해 주세요.</span>
        </div>
      </div>
    );
  }

  const patientName = patient?.name || patient?.display || patient?.patient_name;
  const isLastStep = currentStep === soapSteps.length - 1;
  const canProceed = soapData[currentStepInfo.key].trim() !== '' || currentStep === 0;

  return (
    <div className="compact-soap-panel">
      <style jsx>{`
        .compact-soap-panel {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .step-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .step-counter {
          font-size: 0.8rem;
          opacity: 0.9;
          flex: 1;
        }

        .step-dots {
          display: flex;
          gap: 0.25rem;
          flex: 1;
          justify-content: center;
          margin-right: 2rem;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.2s;
        }

        .step-dot.active {
          background: white;
          transform: scale(1.2);
        }

        .step-dot.completed {
          background: rgba(255, 255, 255, 0.8);
        }

        .step-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .step-subtitle {
          font-size: 0.8rem;
          opacity: 0.9;
          margin-top: 0.25rem;
        }

        .panel-content {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding-bottom: 70px; /* 네비게이션 바 공간 확보 */
        }

        .step-description {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
          border-left: 3px solid ${currentStepInfo.color};
        }

        .input-area {
          flex: 1;
          margin-bottom: 0.75rem;
          min-height: 120px;
        }

        .textarea-main {
          width: 100%;
          height: 80px;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.9rem;
          resize: none;
          transition: border-color 0.2s;
        }

        .textarea-main:focus {
          outline: none;
          border-color: ${currentStepInfo.color};
          box-shadow: 0 0 0 3px ${currentStepInfo.color}20;
        }

        .additional-fields {
          margin-bottom: 0.75rem;
        }

        .field-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .field-group {
          flex: 1;
        }

        .field-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
          display: block;
        }

        .field-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .field-input:focus {
          outline: none;
          border-color: ${currentStepInfo.color};
          box-shadow: 0 0 0 2px ${currentStepInfo.color}20;
        }

        .navigation-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        box-sizing: border-box;
      }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 4px;
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
          background: ${currentStepInfo.color};
          color: white;
        }

        .btn-next:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-save {
          background: #059669;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #047857;
        }

        .progress-text {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #6b7280;
          text-align: center;
        }

        .patient-info {
          font-size: 0.75rem;
          opacity: 0.9;
          text-align: center;
        }

        .character-count {
          text-align: right;
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
      `}</style> 

      {/* 내용 */}
      <div className="panel-content">
        <div className="step-description">
          {currentStepInfo.description}
        </div>

        <div className="input-area">
          <textarea
            className="textarea-main"
            value={soapData[currentStepInfo.key]}
            onChange={(e) => handleCurrentStepChange(e.target.value)}
            placeholder={currentStepInfo.placeholder}
            maxLength={500}
          />
          <div className="character-count">
            {soapData[currentStepInfo.key].length} / 500
          </div>
        </div>

        {/* Assessment 단계에서만 추가 필드 표시 */}
        {currentStepInfo.key === 'A' && (
          <div className="additional-fields">
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">ICD-10 코드 (선택)</label>
                <input
                  type="text"
                  className="field-input"
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  placeholder="예: K59.0"
                />
              </div>
              <div className="field-group">
                <label className="field-label">진단 분류</label>
                <select
                  className="field-input"
                  value={diagnosisType}
                  onChange={(e) => setDiagnosisType(e.target.value)}
                >
                  <option value="PRIMARY">주진단</option>
                  <option value="SECONDARY">부진단</option>
                  <option value="PROVISIONAL">잠정진단</option>
                  <option value="DIFFERENTIAL">감별진단</option>
                </select>
              </div>
            </div>
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
          {Object.values(soapData).filter(v => v.trim()).length} / {soapSteps.length} 완료
        </div>

        {isLastStep ? (
          <button
            className="nav-btn btn-save"
            onClick={handleSave}
            disabled={isSaving || Object.values(soapData).every(v => !v.trim())}
          >
            {isSaving ? '저장 중...' : (
              <>
                <Save size={14} />
                저장
              </>
            )}
          </button>
        ) : (
          <button
            className="nav-btn btn-next"
            onClick={handleNext}
          >
            다음
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DiagnosisPrescriptionPanel;