import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// log
import { saveLog } from '../utils/saveLog';

const OrderForm = () => {
  const [aliasOptions, setAliasOptions] = useState([]);
  const navigate = useNavigate();
  const [selectedAlias, setSelectedAlias] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}samples/alias-mapping/`)
      .then(res => {
        const rawData = res.data;
        const aliases = [];

        Object.entries(rawData).forEach(([sampleType, aliasMap]) => {
          Object.keys(aliasMap).forEach(alias => {
            aliases.push(alias);
          });
        });

        setAliasOptions(aliases);
      })
      .catch(err => {
        console.error('❌ alias 목록 로딩 실패:', err);
      });
  }, []);

  // ❗ 사용되지 않는 함수 주석 처리 (필요시 상태 통합 방식으로 활용 가능)
  /*
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      patient_id: patientId,
      doctor_id: doctorId,
      test_type: selectedAlias, // alias_name으로 전달
      order_date: new Date(orderDate).toISOString(),
    };
    
    console.log("보내는 payload:", payload);
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}orders/create/`, payload);
      
      alert('✅ 주문 생성 성공!');
      console.log('Created:', res.data);

      
      // 로그 저장 (LISLog 구조 기반)
      await saveLog({
        patient_id: patientId,
        doctor_id: doctorId,
        order_id: res.data.id,
        step: 'order',
        request_detail: `검사: ${selectedAlias}, 날짜: ${orderDate}`
      }); //

      navigate('/lis/orders');
    } catch (err) {
      alert('❌ 주문 생성 실패');
      console.error(err);
      if (err.response?.data) {
         console.log("💡 백엔드 오류 응답 내용:", err.response.data);
        }
      
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
      <h2>📝 오더 생성</h2>

      <label>👤 환자 ID</label><br />
      <input value={patientId} onChange={e => setPatientId(e.target.value)} required /><br />

      <label>🧑‍⚕️ 의사 ID</label><br />
      <input value={doctorId} onChange={e => setDoctorId(e.target.value)} required /><br />

      <label>🔬 검사 종류</label><br />
      <select value={selectedAlias} onChange={e => setSelectedAlias(e.target.value)} required>
        <option value="">Test Type 선택</option>
        {aliasOptions.map(alias => (
          <option key={alias} value={alias}>{alias}</option>
        ))}
      </select><br />

      <label>🕒 주문 날짜</label><br />
      <input type="datetime-local" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} required /><br /><br />

      <button type="submit">생성하기</button>
    </form>
  );
};

export default OrderForm;
