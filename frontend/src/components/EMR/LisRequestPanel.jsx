// src/components/EMR/LisRequestPanel.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { 
  panelComponents, 
  LIS_API, 
  getFullApiUrl, 
  panelToOrderMapping,
  PRIORITY_LEVELS,
  SAMPLE_TYPES 
} from './lisConfig';

const LisRequestPanel = ({ patient }) => {
  const [selectedPanel, setSelectedPanel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 필요한 유틸리티 함수들을 컴포넌트 내부에 정의
  const normalizeOpenMRSPatient = (patient) => {
    if (!patient) return null;
    
    return {
      uuid: patient.uuid,
      identifier: patient.identifiers?.[0]?.identifier || patient.identifier || '',
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
    } catch (error) {
      console.warn('나이 계산 실패:', birthdate, error);
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

  // 🔥 FIX: handleAPIError 함수를 handleSubmit 위에 정의
  const handleAPIError = (error, context = '') => {
    console.error(`${context} API 에러:`, error);
    
    if (error.response) {
      const status = error.response.status;
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

    // 🔥 orderData를 try 블록 외부에서 선언
    let orderData = null;

    try {
      // 🔥 실제 백엔드 orders 모델에 맞춘 데이터 구조
      orderData = {
        // Order 모델의 실제 필드들에 맞춤 (OrderListPage.jsx 참고)
        patient_id: normalizedPatient.identifier,
        patient_name: normalizedPatient.name,
        
        // 검사 관련 필드
        test_type: selectedPanel,  // 검사 패널명
        test_list: panelComponents[selectedPanel].join(', '),  // 검사 항목들
        
        // 의뢰 정보 
        doctor_id: 'system_user',
        doctor_name: 'System User',
        
        // 주문 날짜/시간 (실제 백엔드 필드명에 맞춤)
        order_date: new Date().toISOString().split('T')[0],
        order_time: new Date().toTimeString().split(' ')[0],
        
        // 상태 관리
        status: 'pending',  // 실제 백엔드에서 사용하는 상태값
        
        // 추가 메타데이터
        notes: `${selectedPanel} 패널 검사 요청`,
        requesting_system: 'CDSS-EMR'
      };

      console.log('🚀 LIS 검사 주문 시작:', orderData);
      
      // 통합 로그 저장 (시작)
      await saveIntegrationLog('LIS_ORDER_START', { 
        patient: normalizedPatient.uuid, 
        panel: selectedPanel 
      });
      
      // 🔥 FIX: API URL 통일 - 환경변수 사용하고 슬래시 추가
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}orders/`;
      console.log('📡 최종 API URL:', apiUrl);
      
      const response = await axios.post(apiUrl, orderData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ LIS 검사 주문 성공:', response.data);
      
      // 성공 로그 저장
      await saveIntegrationLog('LIS_ORDER_SUCCESS', orderData, response.data);
      
      alert(`검사 주문이 성공적으로 등록되었습니다.\n주문 ID: ${response.data.id || response.data.data?.id || 'N/A'}`);
      
      // 요청 성공 후 폼 초기화
      setSelectedPanel('');
      
    } catch (err) {
      console.error('❌ LIS 검사 주문 실패:', err);
      
      // 에러 로그 저장 (orderData가 null이 아닐 때만)
      if (orderData) {
        await saveIntegrationLog('LIS_ORDER_ERROR', orderData, null, err);
      }
      
      // 🔥 이제 handleAPIError가 정의되어 있으므로 호출 가능
      const errorMessage = handleAPIError(err, 'LIS 검사 주문');
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // 환자 정보 표시용 헬퍼 함수들
  const getPatientDisplayInfo = () => {
    const normalized = normalizeOpenMRSPatient(patient);
    return normalized;
  };

  return (
    <div className="lis-request-panel" style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      {!patient ? (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          color: '#6c757d',
          fontSize: '14px'
        }}>
          환자를 선택하면 LIS 검사를 요청할 수 있습니다.
        </div>
      ) : (
        <>
          {/* 환자 정보 표시 */}
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <div><strong>환자:</strong> {getPatientDisplayInfo()?.name || 'Unknown'}</div>
            <div><strong>ID:</strong> {getPatientDisplayInfo()?.identifier || 'N/A'}</div>
            <div><strong>성별:</strong> {getGenderDisplay(getPatientDisplayInfo()?.gender)}</div>
            <div><strong>나이:</strong> {getPatientDisplayInfo()?.age ? `${getPatientDisplayInfo().age}세` : '미상'}</div>
          </div>

          {/* 검사 패널 선택 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#495057'
            }}>
              🔬 검사 패널 선택
            </label>
            <select
              value={selectedPanel}
              onChange={(e) => setSelectedPanel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">검사 패널을 선택하세요</option>
              {Object.keys(panelComponents).map(panel => (
                <option key={panel} value={panel}>
                  {panel} ({panelComponents[panel].length}개 항목)
                </option>
              ))}
            </select>
          </div>

          {/* 선택된 패널의 검사 항목 표시 */}
          {selectedPanel && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#d1ecf1', 
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                📋 {selectedPanel} 검사 항목:
              </div>
              <div style={{ color: '#0c5460' }}>
                {panelComponents[selectedPanel].join(', ')}
              </div>
            </div>
          )}

          {/* 검사 요청 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedPanel}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#6c757d' : (!selectedPanel ? '#ced4da' : '#28a745'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || !selectedPanel ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '검사 주문 중...' : '검사 주문 등록'}
          </button>

          {/* 에러 메시지 */}
          {error && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* 성공 후 안내 */}
          {!error && !loading && (
            <div style={{ 
              marginTop: '16px', 
              padding: '8px', 
              fontSize: '12px', 
              color: '#6c757d',
              textAlign: 'center'
            }}>
              💡 검사 주문 후 LIS 시스템에서 샘플 수집 및 분석이 진행됩니다.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LisRequestPanel;