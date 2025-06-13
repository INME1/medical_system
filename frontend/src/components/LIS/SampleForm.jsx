// LIS > SampleForm.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// log 
import { saveLog } from '../utils/saveLog';

const SampleForm = () => {
  const navigate = useNavigate();
  const [aliasMappings, setAliasMappings] = useState({});
  const [selectedAlias, setSelectedAlias] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('');  
  const [sampleType, setSampleType] = useState('');
  const [testTypeOptions, setTestTypeOptions] = useState([]);
  const [collectionDate, setCollectionDate] = useState('');
  const { orderId: paramOrderId } = useParams();
  const [orderId, setOrderId] = useState('');
  const [loincCode, setLoincCode] = useState('');
  const [sampleStatus] = useState('collected');
  

  useEffect(() => {
    if (paramOrderId) {
      setOrderId(paramOrderId);
    }
  }, [paramOrderId]);

  // alias-mapping 불러오기
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}samples/alias-mapping`)
      .then(res => {
        console.log('✅ aliasMappings 불러오기 성공:', res.data);
        setAliasMappings(res.data);
      })
      .catch(err => console.error('❌ aliasMappings 불러오기 실패:', err));
  }, []);

  useEffect(() => {
    if (selectedAlias && sampleType) {
      axios.get(`${process.env.REACT_APP_API_BASE_URL}samples/test-types-by-alias/`, {
        params: {
          sample_type: sampleType,
          alias_name: selectedAlias
        }
      })
      .then(res => {
        console.log('🧪 test_type 목록:', res.data);
        setTestTypeOptions(res.data); // test_type 목록
      })
      .catch(err => {
        console.error('❌ test_type 목록 불러오기 실패:', err);
      });
    }
  }, [selectedAlias, sampleType]);

  // alias 선택 시 loinc-code 자동 매핑
  useEffect(() => {
    if (selectedTestType && sampleType) {
      console.log('📦 LOINC 매핑 요청:', { sample_type: sampleType, test_type: selectedTestType });
      axios.get(`${process.env.REACT_APP_API_URL}samples/loinc-by-sample-type`, {
        params: { sample_type: sampleType, test_type: selectedTestType }
      })
        .then(res => {
          console.log('✅ LOINC 매핑 응답:', res.data);
          const loinc = res.data.find(item => item.test_type === selectedTestType);
          setLoincCode(loinc?.loinc_code || '');
          setSelectedTestType(loinc?.test_type || selectedTestType);
        })
        .catch(err => {
          console.error('❌ LOINC 코드 매핑 실패:', err);
        });
    }
  }, [selectedTestType, sampleType]);
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      order: parseInt(orderId),
      sample_type: sampleType,
      test_type: selectedAlias,  // ✅ 고침
      collection_date: collectionDate,
      loinc_code: loincCode,
      sample_status: sampleStatus
    };


    console.log('📦 보낼 payload:', payload);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}samples/create`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      alert('✅ 샘플 등록 성공!');
      console.log('🎉 등록된 샘플:', res.data);

       // 로그 저장 추가
      const orderRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}orders/${orderId}/`);
      const orderInfo = orderRes.data;

      const patient_id = orderInfo.patient_id || 'UNKNOWN';
      const doctor_id = orderInfo.doctor_id || 'UNKNOWN';

      await saveLog({
        patient_id,
        doctor_id,
        order_id: orderId,
        sample_id: res.data.id,
        step: 'sample',
        request_detail: `샘플: ${selectedAlias}, 세부: ${selectedTestType}, LOINC: ${loincCode}`
      }); // 


      navigate('/lis/samples');
    } catch (error) {
      console.error('❌ 샘플 등록 실패:', error);
      alert('샘플 등록 중 오류가 발생했습니다.');

      if (error.response?.data) {
         console.log("💡 백엔드 오류 응답 내용:", error.response.data);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
      <h2>💉 샘플 등록</h2>

      <label>🧾 오더 ID</label><br />
      <input
        type="text"
        value={orderId}
        onChange={e => setOrderId(e.target.value)}
        placeholder="Order ID"
        required
      /><br />

      <label>📅 채취일시</label><br />
      <input
        type="datetime-local"
        value={collectionDate}
        onChange={e => setCollectionDate(e.target.value)}
        required
      /><br />

      <label>🧪 검체 종류</label><br />
      <select value={sampleType} onChange={e => {
        setSampleType(e.target.value);
        setSelectedAlias(''); // sampleType 바꾸면 alias 초기화
      }} required>
        <option value="">Sample Type 선택</option>
        {Object.keys(aliasMappings).map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select><br/>

      <label>📁 검사 종류</label><br />
      <select value={selectedAlias} onChange={e => setSelectedAlias(e.target.value)} required>
        <option value="">Test Type 선택</option>
        {sampleType &&
          Object.keys(aliasMappings[sampleType] || {}).map(alias => (
            <option key={alias} value={alias}>{alias}</option>
          ))}
      </select><br/>

      <label>📂 세부 검사</label><br />
      <select value={selectedTestType} onChange={e => setSelectedTestType(e.target.value)} required>
        <option value="">Detail Type 선택</option>
        {testTypeOptions.map((tt, idx) => (
          <option key={idx} value={tt}>{tt}</option>
        ))}
      </select><br/>


      <p>🔎 자동 매핑된 LOINC 코드: <strong>{loincCode || '없음'}</strong></p>

      <button type="submit">샘플 등록</button>
    </form>
  );
};

export default SampleForm;
