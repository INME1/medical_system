// src/components/EMR/ImagingRequestPanel.jsx
import React, { useState, useEffect } from 'react';

const ImagingRequestPanel = ({ selectedPatient, onRequestSuccess }) => {
  const [formData, setFormData] = useState({
    modality: '',
    body_part: '',
    study_description: '',
    clinical_info: '',
    priority: 'routine',
    requesting_physician: '' // 🔥 의사 정보 자동 채우기
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoFilledData, setAutoFilledData] = useState(null); // 🔥 자동 채워진 환자 정보

  const modalityOptions = [
    { value: 'CR', label: 'Chest X-ray (흉부 X선)' },
    { value: 'CT', label: 'CT Scan (컴퓨터 단층촬영)' },
    { value: 'MR', label: 'MRI (자기공명영상)' },
    { value: 'US', label: 'Ultrasound (초음파)' },
    { value: 'NM', label: 'Nuclear Medicine (핵의학)' },
    { value: 'PT', label: 'PET Scan (양전자방출단층촬영)' },
    { value: 'MG', label: 'Mammography (유방촬영술)' },
    { value: 'DX', label: 'Digital Radiography (디지털 X선)' },
    { value: 'RF', label: 'Radiofluoroscopy (투시촬영)' }
  ];

  const bodyPartOptions = [
    'CHEST', 'ABDOMEN', 'PELVIS', 'HEAD', 'NECK', 'SPINE', 
    'EXTREMITY', 'HEART', 'BRAIN', 'LIVER', 'KIDNEY', 'LUNG',
    'BONE', 'JOINT', 'MUSCLE', 'VESSEL'
  ];

  // 🔥 환자 선택 시 자동으로 정보 구성
  useEffect(() => {
    if (selectedPatient) {
      const autoData = extractPatientInfo(selectedPatient);
      setAutoFilledData(autoData);
      
      // 의사 정보 자동 설정
      const doctorName = localStorage.getItem('doctor_name') || 
                       localStorage.getItem('username') || 
                       'Dr. Current User';
      setFormData(prev => ({
        ...prev,
        requesting_physician: doctorName
      }));
      
      console.log('🔥 자동 채워진 환자 정보:', autoData);
    } else {
      setAutoFilledData(null);
    }
  }, [selectedPatient]);

  // 🔥 환자 정보 추출 및 표준화 함수
  const extractPatientInfo = (patient) => {
    console.log('🔍 환자 원본 데이터:', patient);

    // 다양한 형태의 환자 데이터 구조에 대응
    const patientId = patient.uuid || 
                     patient.openmrs_patient_uuid || 
                     patient.patient_identifier || 
                     patient.mapping_id || 
                     'UNKNOWN_ID';

    const patientName = patient.display || 
                       patient.name || 
                       patient.patient_name || 
                       '이름 없음';

    // 생년월일 처리 - 다양한 형식 지원
    let birthDate = '';
    if (patient.person?.birthdate) {
      birthDate = formatBirthDate(patient.person.birthdate);
    } else if (patient.birthdate) {
      birthDate = formatBirthDate(patient.birthdate);
    } else if (patient.birth_date) {
      birthDate = formatBirthDate(patient.birth_date);
    }

    // 성별 처리
    const gender = patient.person?.gender || 
                  patient.gender || 
                  patient.sex || 
                  'U';

    // 나이 계산
    let age = patient.person?.age || patient.age;
    if (!age && birthDate) {
      age = calculateAge(birthDate);
    }

    return {
      patient_id: patientId,
      patient_name: patientName,
      birth_date: birthDate,
      sex: gender,
      age: age,
      // 추가 정보
      patient_identifier: patient.patient_identifier,
      assigned_room: patient.assigned_room
    };
  };

  // 🔥 날짜 형식 변환 함수 개선
  const formatBirthDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      
      // 이미 YYYY-MM-DD 형식인지 확인
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // ISO 형식 (YYYY-MM-DDTHH:mm:ss.sssZ) 처리
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // 다른 형식들 시도
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('날짜 변환 실패:', dateString);
        return '';
      }
      
      // YYYY-MM-DD 형식으로 변환
      return date.toISOString().split('T')[0];
      
    } catch (error) {
      console.warn('날짜 변환 오류:', dateString, error);
      return '';
    }
  };

  // 🔥 나이 계산 함수
  const calculateAge = (birthDate) => {
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.warn('나이 계산 오류:', error);
      return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // 에러 메시지 클리어
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('환자를 먼저 선택해주세요.');
      return;
    }

    if (!autoFilledData) {
      setError('환자 정보를 불러올 수 없습니다.');
      return;
    }

    if (!formData.modality || !formData.body_part) {
      setError('검사 종류와 검사 부위를 선택해주세요.');
      return;
    }

    if (!formData.requesting_physician) {
      setError('의사 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    console.log('🚀 영상검사 요청 시작:', {
      autoFilledData,
      formData,
      selectedPatient
    });

    try {
      // 🔥 완전히 자동화된 요청 데이터 구성
      const requestData = {
        // 🔥 자동으로 채워지는 필드들
        patient_id: autoFilledData.patient_id,
        patient_name: autoFilledData.patient_name,
        birth_date: autoFilledData.birth_date,
        sex: autoFilledData.sex,
        
        // 🔥 사용자가 입력하는 필드들
        modality: formData.modality,
        body_part: formData.body_part,
        requesting_physician: formData.requesting_physician,
        
        // 선택적 필드들
        study_description: formData.study_description || `${formData.modality} - ${formData.body_part}`,
        clinical_info: formData.clinical_info || '진료 의뢰',
        priority: formData.priority,
        
        // 메타데이터
        created_by: 'emr_user',
        request_source: 'EMR_SYSTEM',
        patient_room: autoFilledData.assigned_room || null
      };

      console.log('📤 최종 전송 데이터:', requestData);

      // 백엔드 API 호출
      const response = await fetch('http://35.225.63.41:8000/api/worklist/create-from-emr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('📥 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 응답 오류:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 성공 응답:', result);

      // 성공 처리
      if (result.success) {
        // 🔥 폼 초기화 (환자 정보는 유지)
        setFormData(prev => ({
          modality: '',
          body_part: '',
          study_description: '',
          clinical_info: '',
          priority: 'routine',
          requesting_physician: prev.requesting_physician // 의사명은 유지
        }));

        // 성공 알림
        alert(`✅ 영상검사 요청이 성공적으로 등록되었습니다!\n\n환자: ${autoFilledData.patient_name}\n검사: ${formData.modality} - ${formData.body_part}`);

        if (onRequestSuccess) {
          onRequestSuccess(result);
        }
      } else {
        throw new Error(result.error || '요청 처리 중 오류가 발생했습니다.');
      }

    } catch (error) {
      console.error('❌ 영상검사 요청 실패:', error);
      setError(`요청 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 환자가 선택되지 않은 경우
  if (!selectedPatient) {
    return (
      <div style={styles.noPatientContainer}>
        <div style={styles.noPatientIcon}>🏥</div>
        <p style={styles.noPatientText}>환자를 선택하면 영상검사를 요청할 수 있습니다.</p>
      </div>
    );
  }

  // 자동 채워진 데이터가 없는 경우
  if (!autoFilledData) {
    return (
      <div style={styles.noPatientContainer}>
        <div style={styles.noPatientIcon}>⚠️</div>
        <p style={styles.noPatientText}>환자 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 🔥 자동 채워진 환자 정보 표시 */}
      <div style={styles.patientInfo}>
        <div style={styles.patientCard}>
          <div style={styles.patientHeader}>
            <strong>👤 {autoFilledData.patient_name}</strong>
            <span style={styles.autoFillBadge}>자동 입력됨</span>
          </div>
          <div style={styles.patientDetails}>
            <div>🆔 {autoFilledData.patient_id}</div>
            <div>
              👥 {autoFilledData.sex === 'M' ? '남성' : autoFilledData.sex === 'F' ? '여성' : '미상'} | 
              🎂 {autoFilledData.age ? `${autoFilledData.age}세` : '나이 미상'}
            </div>
            <div>📅 {autoFilledData.birth_date || '생년월일 미상'}</div>
            {autoFilledData.assigned_room && (
              <div>🏥 진료실 {autoFilledData.assigned_room}번</div>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 영상검사 요청 폼 */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>검사 종류 *</label>
            <select
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">선택하세요</option>
              {modalityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>검사 부위 *</label>
            <select
              name="body_part"
              value={formData.body_part}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">선택하세요</option>
              {bodyPartOptions.map(part => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>우선순위</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="routine">일반</option>
              <option value="urgent">긴급</option>
              <option value="stat">응급</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>의뢰 의사 *</label>
            <input
              type="text"
              name="requesting_physician"
              value={formData.requesting_physician}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="의사명을 입력하세요"
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>검사 설명</label>
          <input
            type="text"
            name="study_description"
            value={formData.study_description}
            onChange={handleChange}
            placeholder="예: Chest PA/Lateral, Brain MRI with contrast"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>임상 정보</label>
          <textarea
            name="clinical_info"
            value={formData.clinical_info}
            onChange={handleChange}
            placeholder="환자의 증상, 의심 질환, 검사 사유 등"
            rows={3}
            style={styles.textarea}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitButton,
            backgroundColor: loading ? '#ccc' : '#28a745',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ 요청 중...' : '🏥 영상검사 요청'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    width: '100%'
  },
  noPatientContainer: {
    textAlign: 'center',
    padding: '20px',
    color: '#666'
  },
  noPatientIcon: {
    fontSize: '32px',
    marginBottom: '10px'
  },
  noPatientText: {
    fontSize: '14px',
    margin: 0
  },
  patientInfo: {
    marginBottom: '15px',
    padding: '12px',
    backgroundColor: '#e8f5e8',
    borderRadius: '8px',
    border: '2px solid #4caf50'
  },
  patientCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  patientHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  autoFillBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: '#4caf50',
    color: 'white',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  patientDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '11px',
    color: '#2e7d32'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: '4px'
  },
  input: {
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '12px'
  },
  select: {
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: '#fff'
  },
  textarea: {
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '12px',
    resize: 'vertical'
  },
  errorMessage: {
    padding: '8px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    fontSize: '12px'
  },
  submitButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    marginTop: '8px',
    transition: 'all 0.2s ease'
  }
};

export default ImagingRequestPanel;