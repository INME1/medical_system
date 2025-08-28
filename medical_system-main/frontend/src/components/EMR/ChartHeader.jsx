/// frontend/src/components/EMR/ChartHeader.jsx - URL 수정

import React, { useState } from 'react';
import axios from 'axios';
import PatientRegistrationForm from './PatientRegistrationForm';

// URL 수정: 슬래시 3개 → 2개
const API_BASE = 'http://localhost:8000/api/integration/';

const ChartHeader = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 API 호출:', `${API_BASE}openmrs/patients/search/?q=${query.trim()}`);
      
      const response = await axios.get(`${API_BASE}openmrs/patients/search/`, {
        params: { q: query.trim() }
      });

      const data = response.data;
      console.log('📥 서버 응답:', data);

      if (data.results && data.results.length > 0) {
        const patient = data.results[0];
        
        const formattedPatient = {
          uuid: patient.uuid,
          display: patient.display || patient.name,
          person: {
            gender: patient.gender,
            birthdate: patient.birthdate,
            age: patient.age
          },
          identifiers: patient.identifiers || []
        };
        
        console.log('👤 선택된 환자:', formattedPatient);
        onSearch(formattedPatient);
      } else {
        alert('검색 결과가 없습니다');
      }
    } catch (err) {
      console.error('❌ 검색 실패:', err);
      
      if (err.response) {
        console.error('응답 상태:', err.response.status);
        console.error('응답 데이터:', err.response.data);
        alert(`검색 실패: ${err.response.data?.error || '서버 오류'}`);
      } else {
        alert('서버 연결 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleNewPatient = () => {
    setShowRegistrationForm(true);
  };

  const handlePatientCreated = (newPatient) => {
    onSearch(newPatient);
    setShowRegistrationForm(false);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 환자 이름 또는 ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ 
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          disabled={loading}
        />
        <button 
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? '검색중...' : '검색'}
        </button>
        <button 
          onClick={handleNewPatient}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + 신규 환자
        </button>
      </div>

      {showRegistrationForm && (
        <PatientRegistrationForm
          onClose={() => setShowRegistrationForm(false)}
          onPatientCreated={handlePatientCreated}
        />
      )}
    </>
  );
};

export default ChartHeader;