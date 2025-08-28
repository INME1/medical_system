// src/components/EMR/ReceptionPanel.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmrMainPage.css'; // 공통 테이블 스타일 로드
import PatientRegistrationForm from './PatientRegistrationForm'; // PatientRegistrationForm 임포트 추가
import { Plus } from 'lucide-react';


const OPENMRS_API_MASTER = 'http://35.225.63.41:8000/api/integration/openmrs-patients/';
const RECEPTION_API = 'http://35.225.63.41:8000/api/integration/reception-list/';
const MAPPING_API          = 'http://35.225.63.41:8000/api/integration/identifier-based/';

const ReceptionPanel = () => {
  const [query, setQuery]              = useState('');
  const [patientsMaster, setPatientsMaster] = useState([]);
  const [suggestions, setSuggestions]        = useState([]);
  const [receptionList, setReceptionList]   = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false); // 새로운 상태: 등록 폼 모달 표시 여부

  // 1) 전체 환자 & 이미 접수된 환자 목록 불러오기 (초기 및 갱신 시)
  const fetchPatientData = async () => {
    try {
      // 전체 OpenMRS 환자 목록
      const masterRes = await axios.get(OPENMRS_API_MASTER);
      setPatientsMaster(masterRes.data);

      // 오늘 접수된 환자 목록
      const receptionRes = await axios.get(RECEPTION_API);
      const list = receptionRes.data.map(item => {
        let displayStatus = item.status; // 기본적으로 백엔드 status 사용

        // 이 switch-case 로직 수정함.
        // PatientMapping 모델의 status_choices와 assigned_room을 활용합니다.
        switch (item.status) {
          case 'waiting':
            // 'waiting' 상태일 때 assigned_room 값에 따라 '대기 중' 또는 '진료실 배정'으로 구분
            displayStatus = item.assigned_room ? `🧍 진료실 ${item.assigned_room}번 배정` : '⏳ 대기중';
            break;
          case 'in_progress':
            displayStatus = '💉 진료 중';
            break;
          case 'complete':
            displayStatus = '✅ 진료 완료';
            break;
          default:
            // 예상치 못한 상태 값일 경우
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
      // 필요에 따라 setError 상태 설정
    }
  };

  useEffect(() => {
    fetchPatientData();
    // 주기적인 갱신이 필요하다면 여기에 setInterval 추가
  }, []);

  // 2) 자동완성 제안
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

  // 3) 접수 처리 (기존 로직 유지)
  const handleReception = async (patientRow = null) => {
    const patient = patientRow || patientsMaster.find(p => p.display === query.trim());
    if (!patient) {
      return alert('환자 이름을 목록에서 클릭하거나 정확히 입력해주세요.');
    }
    const id = patient.identifiers?.[0]?.identifier;
    if (receptionList.some(r => r.patient_identifier === id)) {
      return alert('이미 접수된 환자입니다.');
    }
    try {
      const res = await axios.post(MAPPING_API, {
        openmrs_patient_uuid: patient.uuid,
        patient_identifier:   id
      });
      if (!res.data.success) throw new Error(res.data.error || '매핑 실패');

      // 로컬에도 추가 (방금 매핑된 시각을 사용)
      setReceptionList(prev => [
        ...prev,
        {
          mapping_id: res.data.mapping_id, // 새로 생성된 매핑 ID
          patient_identifier: id,
          display: patient.display,
          status: '대기 중', // 초기 접수 상태
          timestamp: new Date().toISOString()
        }
      ]);
      setQuery('');
      setSuggestions([]);
      alert(`✅ ${patient.display} 환자가 대기 목록에 추가되었습니다.`);
      // onReceptionSuccess가 있다면 여기서 호출
    } catch (err) {
      console.error('접수 실패', err);
      alert(`접수 실패: ${err.message}`);
    }
  };

  // 4) 신규 환자 등록 폼에서 환자 생성 성공 시 호출될 콜백 함수
  const handleNewPatientCreated = (newPatient) => {
    // 폼에서 등록된 새 환자 정보를 받아서 처리
    // 1. patientsMaster에 새 환자 추가 (검색/대기 등록 테이블에 나타나도록)
    setPatientsMaster(prev => [...prev, newPatient]);

    // 2. 새로 등록된 환자를 바로 접수 목록에 추가 (handleReception 재활용)
    // 이때, handleReception은 이미 중복 체크를 하므로, 신규 환자는 문제 없이 추가됨.
    handleReception(newPatient); // <-- 중요: 새로 등록된 환자를 바로 접수 처리
  };


  return (
    <div className="page-container-full">
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>📝 환자 접수</h2>

        {/* 신규 환자 등록 버튼 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1.5rem'
          }}
        >
          <button
            onClick={() => setShowRegistrationForm(true)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              border: 'none',
              background: '#1890ff',
              color: '#fff', // 텍스트 색상 (아이콘에도 적용되어야 함)
              cursor: 'pointer',
              fontSize: '1rem', // 글씨 크기
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex', // 아이콘과 텍스트를 나란히 정렬하기 위해 추가
              alignItems: 'center', // 아이콘과 텍스트를 세로 중앙 정렬하기 위해 추가
              gap: '0.5rem', // 아이콘과 텍스트 사이 간격
            }}
          >
            <Plus size={20} color="white" /> {/* 이모티콘 대신 Plus 아이콘 컴포넌트 사용 */}
            신규 환자 등록
          </button>
        </div>


        {/* 검색 & 접수 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            style={{ flex: '1 0 300px', padding: '0.5rem' }}
            type="text"
            placeholder="환자 이름 또는 ID 입력"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={() => handleReception()} // 검색창 접수 버튼 클릭 시 인자 없이 호출
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #1890ff',
              background: '#fff',
              color: '#1890ff', // 색상 통일
              cursor: 'pointer'
            }}
          >
            접수하기
          </button>
        </div>

        {/* 자동완성 */}
        {suggestions.length > 0 && (
          <ul style={{
            border: '1px solid #ccc',
            maxWidth: 300,
            margin: '0 0 1.5rem',
            padding: 0,
            listStyle: 'none',
            background: '#fff',
            maxHeight: '200px', // 스크롤바 추가
            overflowY: 'auto'
          }}>
            {suggestions.map(p => (
              <li
                key={p.uuid}
                onClick={() => setQuery(p.display)}
                style={{ padding: '0.5rem', borderBottom: '1px solid #eee', cursor: 'pointer' }}
              >
                {p.display} ({p.identifiers?.[0]?.identifier})
              </li>
            ))}
          </ul>
        )}

        {/* 전체 환자 테이블 */}
        <h3 style={{ marginBottom: '1rem' }}>환자 목록 (OpenMRS 연동)</h3>
        <div className="order-table-wrapper">
          <table className="order-table">
            <thead>
              <tr>
                <th>환자 식별자</th>
                <th>이름</th>
                <th>성별</th>
                <th>생년월일</th>
                <th>UUID</th>
                <th>대기 등록</th>
              </tr>
            </thead>
            <tbody>
              {patientsMaster.map(p => {
                const id = p.identifiers?.[0]?.identifier || '-';
                const disabled = receptionList.some(r => r.patient_identifier === id);
                return (
                  <tr key={p.uuid}>
                    <td>{id}</td>
                    <td>{p.display}</td>
                    <td>{p.person?.gender === 'M' ? '남성' : p.person?.gender === 'F' ? '여성' : '-'}</td>
                    <td>{p.person?.birthdate ? new Date(p.person.birthdate).toLocaleDateString() : '-'}</td>
                    <td>{p.uuid}</td>
                    <td>
                      <button
                        onClick={() => !disabled && handleReception(p)}
                        disabled={disabled}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '4px',
                          border: 'none',
                          background: disabled ? '#ccc' : '#52c41a',
                          color: disabled ? '#666' : '#fff',
                          cursor: disabled ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {disabled ? '등록됨' : '대기 등록'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 접수된 환자 테이블 */}
        <h3 style={{ margin: '1rem 0' }}>
          접수된 환자 목록 ({receptionList.length}명)
        </h3>
        <div className="order-table-wrapper">
          <table className="order-table">
            <thead>
              <tr>
                <th>환자 식별자</th>
                <th>이름</th>
                <th>상태</th>
                <th>접수 시각</th>
              </tr>
            </thead>
            <tbody>
              {receptionList.map(r => (
                <tr key={r.patient_identifier}>
                  <td>{r.patient_identifier}</td>
                  <td>{r.display}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.timestamp
                      ? new Date(r.timestamp).toLocaleTimeString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* PatientRegistrationForm 모달 조건부 렌더링 */}
      {showRegistrationForm && (
        <PatientRegistrationForm
          onClose={() => setShowRegistrationForm(false)} // 모달 닫기 함수
          onPatientCreated={handleNewPatientCreated}     // 환자 생성 성공 시 콜백
        />
      )}
    </div>
  );
};

export default ReceptionPanel;