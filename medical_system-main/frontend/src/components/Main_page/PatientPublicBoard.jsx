import React, { useEffect, useState } from 'react';
import axios from 'axios';

const POLL_INTERVAL_MS = 3000;

const PatientPublicBoard = () => {
  const [patients, setPatients] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_INTEGRATION_API}identifier-waiting/`);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("대기 목록 조회 실패:", err);
      setPatients([]);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: 'Arial', padding: 20, backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem' }}>🏥 환자 대기 알림판</h1>
      <table style={{ width: '100%', fontSize: '2rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#222' }}>
            <th style={{ padding: 10 }}>환자명</th>
            <th style={{ padding: 10 }}>ID</th>
            <th style={{ padding: 10 }}>상태</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: 10 }}>{p.name || p.display}</td>
              <td style={{ padding: 10 }}>{p.patient_identifier}</td>
              <td style={{ padding: 10 }}>
                {p.assigned_room ? `진료실 ${p.assigned_room} 호출됨` : '대기 중'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientPublicBoard;
