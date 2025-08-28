import React, { useState } from "react";

const StudyRequestForm = () => {
  const [form, setForm] = useState({
    patient_id: "",
    patient_name: "",
    birth_date: "",
    sex: "M",
    body_part: "",
    modality: "",
    requesting_physician: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const required = ['patient_id', 'patient_name', 'birth_date', 'body_part', 'modality', 'requesting_physician'];
    for (let field of required) {
      if (!form[field]) {
        alert(`${field}을(를) 입력해주세요.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log("전송 데이터:", form);
      
      const response = await fetch("http://127.0.0.1:8000/api/study-requests/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      console.log("응답:", data);
      
      if (response.ok) {
        alert("검사 요청이 성공적으로 등록되었습니다!");

        // ✅ BroadcastChannel을 통해 로그 갱신 알림 전송
        const bc = new BroadcastChannel("order_channel");
        bc.postMessage({
          type: "newOrderCreated",
          data: {
            patient_id: form.patient_id,
            modality: form.modality,
            body_part: form.body_part,
            timestamp: new Date().toISOString()
          }
        }); // ✅
        
        // 폼 리셋
        setForm({
          patient_id: "",
          patient_name: "",
          birth_date: "",
          sex: "M",
          body_part: "",
          modality: "",
          requesting_physician: "",
        });
      } else {
        throw new Error(data.message || '요청 실패');
      }
      
    } catch (error) {
      console.error("에러:", error);
      alert(`요청 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'white',
    fontFamily: 'Arial, sans-serif'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '2px solid #333'
  };

  const thStyle = {
    border: '1px solid #333',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold'
  };

  const tdStyle = {
    border: '1px solid #333',
    padding: '4px'
  };

  const inputStyle = {
    width: '100%',
    padding: '4px',
    border: 'none',
    fontSize: '13px',
    outline: 'none'
  };

  const selectStyle = {
    width: '100%',
    padding: '4px',
    border: 'none',
    fontSize: '13px',
    outline: 'none'
  };

  const buttonStyle = {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: loading ? '#ccc' : '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: loading ? 'not-allowed' : 'pointer'
  };

  const debugStyle = {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>영상 검사 요청 서식</h2>
      
      {/* 테이블 형태의 폼 */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>환자 번호</th>
            <th style={thStyle}>환자 이름</th>
            <th style={thStyle}>생년월일</th>
            <th style={thStyle}>성별</th>
            <th style={thStyle}>검사 부위</th>
            <th style={thStyle}>Modality</th>
            <th style={thStyle}>요청 의사</th>
            <th style={thStyle}>등록</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>
              <input
                type="text"
                name="patient_id"
                value={form.patient_id}
                onChange={handleChange}
                style={inputStyle}
                placeholder="P001234"
              />
            </td>
            <td style={tdStyle}>
              <input
                type="text"
                name="patient_name"
                value={form.patient_name}
                onChange={handleChange}
                style={inputStyle}
                placeholder="환자명"
              />
            </td>
            <td style={tdStyle}>
              <input
                type="date"
                name="birth_date"
                value={form.birth_date}
                onChange={handleChange}
                style={inputStyle}
              />
            </td>
            <td style={tdStyle}>
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="M">남</option>
                <option value="F">여</option>
              </select>
            </td>
            <td style={tdStyle}>
              <input
                type="text"
                name="body_part"
                value={form.body_part}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Chest"
              />
            </td>
            <td style={tdStyle}>
              <select
                name="modality"
                value={form.modality}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="">선택</option>
                <option value="CR">CR</option>
                <option value="CT">CT</option>
                <option value="MR">MR</option>
                <option value="US">US</option>
                <option value="NM">NM</option>
                <option value="PT">PT</option>
                <option value="DX">DX</option>
                <option value="XA">XA</option>
                <option value="MG">MG</option>
              </select>
            </td>
            <td style={tdStyle}>
              <input
                type="text"
                name="requesting_physician"
                value={form.requesting_physician}
                onChange={handleChange}
                style={inputStyle}
                placeholder="의사명"
              />
            </td>
            <td style={tdStyle}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={buttonStyle}
              >
                {loading ? "등록중" : "등록"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 디버깅용 데이터 표시 */}
      <div style={debugStyle}>
        <h3 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '10px'}}>
          현재 입력 데이터:
        </h3>
        <pre style={{fontSize: '12px', color: '#666'}}>
          {JSON.stringify(form, null, 2)}
        </pre>
      </div>

      {/* 상태 표시 */}
      <div style={{marginTop: '15px', fontSize: '12px', color: '#666'}}>
        <p>• 요청일시는 등록 버튼 클릭 시 자동으로 현재 시간으로 설정됩니다.</p>
        <p>• 모든 필드는 필수 입력 항목입니다.</p>
      </div>
    </div>
  );
};

export default StudyRequestForm;