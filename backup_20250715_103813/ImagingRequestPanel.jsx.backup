import React, { useState, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';

const ImagingRequestPanel = ({ selectedPatient, onRequestSuccess, onNewRequest, onUpdateLog }) => {
  const [formData, setFormData] = useState({
    modality: '',
    body_part: '',
    study_description: '',
    clinical_info: '',
    priority: '일반',
    requesting_physician: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalityOptions = [
    { value: 'CR', label: 'Chest X-ray' },
    { value: 'CT', label: 'CT Scan' },
    { value: 'MR', label: 'MRI' },
    { value: 'US', label: 'Ultrasound' },
    { value: 'NM', label: 'Nuclear Medicine' },
    { value: 'PT', label: 'PET Scan' },
    { value: 'MG', label: 'Mammography' },
    { value: 'DX', label: 'Digital X-ray' },
    { value: 'RF', label: 'Fluoroscopy' }
  ];

  const bodyPartOptions = [
    'CHEST', 'ABDOMEN', 'PELVIS', 'HEAD', 'NECK', 'SPINE', 
    'EXTREMITY', 'HEART', 'BRAIN', 'LIVER', 'KIDNEY', 'LUNG',
    'BONE', 'JOINT', 'MUSCLE', 'VESSEL'
  ];

  // 의사 정보 자동 설정
  useEffect(() => {
    const doctorName = localStorage.getItem('doctor_name') || 
                     localStorage.getItem('username') || 
                     'Dr. Current User';
    setFormData(prev => ({
      ...prev,
      requesting_physician: doctorName
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const extractPatientInfo = (patient) => {
    console.log('🔍 환자 원본 데이터:', patient);

    // 다양한 형태의 환자 데이터 구조에 대응
    const patientId =patient.patient_identifier || 
                     patient.mapping_id || 
                     'UNKNOWN_ID';

    const patientName = patient.name || 
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

  // 날짜 형식 변환 함수
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('환자가 선택되지 않았습니다.');
      return;
    }

    if (!formData.modality || !formData.body_part) {
      setError('검사종류와 부위를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const patientInfo = extractPatientInfo(selectedPatient);
      
      // 🔥 실제 API에 맞춘 데이터 구조 (원본 코드 참고)
      const requestData = {
        // 자동으로 채워지는 필드들
        patient_id: patientInfo.patient_id,
        patient_name: patientInfo.patient_name,
        birth_date: patientInfo.birth_date,
        sex: patientInfo.sex,
        
        // 사용자가 입력하는 필드들
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
        patient_room: patientInfo.assigned_room || null
      };

      console.log('🚀 영상검사 요청 데이터:', requestData);

      // 🔥 원본 코드와 동일한 API 호출
      const response = await fetch('http://35.225.63.41:8000/api/worklist/create-from-emr/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (result.success) {
        // 폼 초기화 (의사명 제외)
        const doctorName = formData.requesting_physician;
        setFormData({
          modality: '',
          body_part: '',
          study_description: '',
          clinical_info: '',
          priority: '일반',
          requesting_physician: doctorName
        });

        alert('✅ 영상검사 요청이 성공적으로 등록되었습니다!');
        
        // 🔥 BroadcastChannel로 다른 컴포넌트에 알림
        try {
          const channel = new BroadcastChannel('order_channel');
          channel.postMessage('newOrderCreated');
          channel.close();
        } catch (bcError) {
          console.error('BroadcastChannel 신호 보내기 실패:', bcError);
        }
        
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

  return (
    <div style={styles.container}>
      {/* 에러 메시지 */}
      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={14} style={{ marginRight: '0.25rem' }} />
          {error}
        </div>
      )}

      {/* 영상검사 요청 폼 */}
      <div style={styles.form}>
        {/* 검사종류 & 검사부위 */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>검사종류</label>
            <select
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">선택</option>
              <option value="CR">X-ray</option>
              <option value="CT">CT</option>
              <option value="MR">MRI</option>
              <option value="US">초음파</option>
              <option value="NM">핵의학</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>부위</label>
            <select
              name="body_part"
              value={formData.body_part}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">선택</option>
              <option value="CHEST">흉부</option>
              <option value="ABDOMEN">복부</option>
              <option value="HEAD">두부</option>
              <option value="SPINE">척추</option>
              <option value="EXTREMITY">사지</option>
            </select>
          </div>
        </div>

        {/* 우선순위 & 의뢰의사 */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>우선순위</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="일반">일반</option>
              <option value="urgent">긴급</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>의사</label>
            <input
              type="text"
              name="requesting_physician"
              value={formData.requesting_physician}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        {/* 검사설명 & 임상정보 */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>검사설명</label>
            <input
              type="text"
              name="study_description"
              value={formData.study_description}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>임상정보</label>
            <input
              type="text"
              name="clinical_info"
              value={formData.clinical_info}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.modality || !formData.body_part}
          style={{
            ...styles.submitButton,
            backgroundColor: loading ? '#ccc' : (!formData.modality || !formData.body_part) ? '#ccc' : '#3498db',
            cursor: loading || !formData.modality || !formData.body_part ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳' : '요청'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    padding: '0'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '2px',
    fontSize: '0.6rem',
    marginBottom: '0.25rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.3rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '0.6rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.1rem'
  },
  input: {
    padding: '0.25rem',
    border: '1px solid #d1d5db',
    borderRadius: '2px',
    fontSize: '0.6rem',
    outline: 'none',
    height: '24px',
    boxSizing: 'border-box'
  },
  select: {
    padding: '0.25rem',
    border: '1px solid #d1d5db',
    borderRadius: '2px',
    fontSize: '0.6rem',
    backgroundColor: '#fff',
    outline: 'none',
    height: '24px',
    boxSizing: 'border-box'
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.3rem',
    fontSize: '0.6rem',
    fontWeight: '600',
    color: '#fff',
    border: 'none',
    borderRadius: '2px',
    marginTop: '0.1rem',
    transition: 'all 0.2s ease',
    height: '28px'
  }
};

export default ImagingRequestPanel;