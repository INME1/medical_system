// src/components/EMR/ReceptionPanel.jsx

import React, { useState, useEffect } from 'react';

const API_URL = 'http://35.225.63.41:8002/openmrs/ws/rest/v1/patient?q=';

const ReceptionPanel = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [receptionList, setReceptionList] = useState([]);

  // 자동완성 API 호출
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 1) return;
      try {
        const res = await fetch(`${API_URL}${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch (err) {
        console.error('❌ 자동완성 실패:', err);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (patient) => {
    setSelectedPatient(patient);
    setQuery(patient.display);
    setSuggestions([]);
  };

  const handleReception = () => {
    if (!selectedPatient) {
      alert('환자를 먼저 선택해주세요.');
      return;
    }

    const isDuplicate = receptionList.some(p => p.uuid === selectedPatient.uuid);
    if (isDuplicate) {
      alert('이미 접수된 환자입니다.');
      return;
    }

    const newEntry = {
      uuid: selectedPatient.uuid,
      display: selectedPatient.display,
      timestamp: new Date(),
      status: '대기 중',
    };

    setReceptionList(prev => [...prev, newEntry]);
    setSelectedPatient(null);
    setQuery('');
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>📝 환자 접수</h2>

      {/* 검색 및 등록 */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="이름 또는 ID 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', marginRight: '0.5rem' }}
        />
        <button onClick={handleReception} style={{ padding: '0.5rem 1rem' }}>
          접수하기
        </button>
      </div>

      {/* 자동완성 드롭다운 */}
      {suggestions.length > 0 && (
        <ul
          style={{
            border: '1px solid #ccc',
            maxWidth: '300px',
            background: 'white',
            listStyle: 'none',
            padding: 0,
            marginBottom: '1rem'
          }}
        >
          {suggestions.map((s) => (
            <li
              key={s.uuid}
              onClick={() => handleSelect(s)}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                borderBottom: '1px solid #eee'
              }}
            >
              {s.display}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* 접수 리스트 */}
      <h3>📋 접수된 환자 목록</h3>
      {receptionList.length === 0 ? (
        <p>아직 접수된 환자가 없습니다.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>이름(ID)</th>
              <th>상태</th>
              <th>접수 시각</th>
            </tr>
          </thead>
          <tbody>
            {receptionList.map((patient, idx) => (
              <tr key={idx}>
                <td>{patient.display}</td>
                <td>{patient.status}</td>
                <td>{new Date(patient.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReceptionPanel;
