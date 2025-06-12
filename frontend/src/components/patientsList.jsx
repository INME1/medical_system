// fronted > src > components > parientsList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PatientList = () => {
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [waitingRegistered, setWaitingRegistered] = useState({});

  const BASE_API_URL =
    process.env.REACT_APP_INTEGRATION_API || 'http://35.255.36.41:8000/api/integration'; //localhost
  const GET_URL = `${BASE_API_URL.replace(/\/+$/, '')}/openmrs-patients/`;
  const POST_URL = `${BASE_API_URL.replace(/\/+$/, '')}/identifier-based/`;

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(GET_URL);
      setAllPatients(response.data || []);
      setFilteredPatients(response.data || []);
    } catch (err) {
      setError('환자 목록을 불러오는데 실패했습니다.');
      console.error('❌ 환자 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendToWaitingList = async (patient) => {
    const identifier = patient.identifiers?.[0]?.identifier;
    const uuid = patient.uuid;

    // ❌ 기존 로직: orthanc_patient_id 없으면 차단
    /*
    const orthancId = patient.orthanc_patient_id;
    if (!identifier || !uuid || !orthancId) {
      alert('❗ 식별자, UUID 또는 Orthanc ID가 없어 대기 등록할 수 없습니다.');
      return;
    }
    */

    // ✅ 테스트용 우회: DUMMY orthanc ID 생성
    const fakeOrthancId = patient.orthanc_patient_id || `DUMMY-${Date.now()}`;

    const payload = {
      openmrs_patient_uuid: uuid,
      patient_identifier: identifier,
      orthanc_patient_id: fakeOrthancId,
    };

    try {
      await axios.post(POST_URL, payload);
      alert('✅ 대기 등록 완료!');
      setWaitingRegistered((prev) => ({
        ...prev,
        [uuid]: true,
      }));
    } catch (err) {
      console.error('❌ 대기 등록 실패:', err);
      const message = err.response?.data?.error || err.message;
      alert(`❌ 대기 등록 실패: ${message}`);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPatients(allPatients);
    } else {
      setFilteredPatients(
        allPatients.filter((patient) =>
          (patient.person?.display || patient.display || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, allPatients]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const formatBirthdate = (birthdate) => {
    try {
      return new Date(birthdate).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) return <p>🔄 환자 목록을 불러오는 중입니다...</p>;
  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <h3>🚨 오류 발생</h3>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 환자 목록 (OpenMRS 연동)</h2>
      <input
        type="text"
        placeholder="환자 이름 검색"
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ padding: '8px', marginBottom: '16px', width: '300px' }}
      />

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>식별자</th>
            <th>이름</th>
            <th>성별</th>
            <th>나이</th>
            <th>생년월일</th>
            <th>UUID</th>
            <th>대기 등록</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((patient) => {
            const uuid = patient.uuid;
            const isRegistered = waitingRegistered[uuid] === true;

            return (
              <tr key={uuid}>
                <td>{patient.identifiers?.[0]?.identifier || 'N/A'}</td>
                <td>{patient.person?.display || patient.display || 'N/A'}</td>
                <td>{patient.person?.gender || 'N/A'}</td>
                <td>{calculateAge(patient.person?.birthdate)}</td>
                <td>{formatBirthdate(patient.person?.birthdate)}</td>
                <td>{uuid}</td>
                <td>
                  {isRegistered ? (
                    <span style={{ color: 'green' }}>✅ 등록됨</span>
                  ) : (
                    <button
                      onClick={() => sendToWaitingList(patient)}
                      style={{ backgroundColor: '#4caf50', color: 'white' }}
                    >
                      대기 등록
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
