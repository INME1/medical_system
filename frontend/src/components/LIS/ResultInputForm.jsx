import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveLog } from '../utils/saveLog';
import './ResultInputForm.css';

const aliasToPanelName = {
  asthma: 'CBC',
  pneumonia: 'CRP',
  chf: 'NT-proBNP',
  pe: 'D-Dimer',
  copd: 'ABGA',
};

const panelComponents = {
  CRP: ['CRP'],
  CBC: [
    'WBC',
    'Neutrophils',
    'Lymphocytes',
    'Eosinophils',
    'Hemoglobin',
    'Platelet Count'
  ],
  ABGA: ['pCO2', 'pO2', 'pH'],
  'NT-proBNP': ['NT-proBNP'],
  'D-Dimer': ['D-Dimer'],
};

const componentUnits = {
  // CRP 기반 (폐렴)
  CRP: 'mg/L',
  // NT-proBNP 기반 (심부전)
  'NT-proBNP': 'pg/mL',
  // D-dimer 기반 (폐색전증)
  'D-Dimer': 'ng/mL FEU', // 또는 'μg/mL FEU'도 있음 → 단위 통일 필요
  // ABGA 기반 (COPD 등)
  pCO2: 'mmHg',
  pO2: 'mmHg',
  pH: '-',             // 단위 없음 (수소 이온 농도 지수)
  // CBC 기반 (천식)
  WBC: '10^3/uL',
  Neutrophils: '%',
  Lymphocytes: '%',
  Eosinophils: '%',
  Hemoglobin: 'g/dL',
  'Platelet Count': '10^3/uL',
};
const ResultInputForm = ({ sampleId: propSampleId, onClose }) => {
  const navigate = useNavigate();
  const [selectedPanel, setSelectedPanel] = useState('');
  const [results, setResults] = useState({});
  const [sampleId, setSampleId] = useState('');
  const [sampleList, setSampleList] = useState([]);
  const [sample, setSample] = useState(null);    // 샘플 전체 객체
  const [values, setValues] = useState([]);      // 샘플에 저장된 기존 결과
  const [error, setError] = useState(null);   

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}samples/`)
      .then(res => {
        const validSamples = res.data.filter(sample => sample.sample_status !== 'deleted'); // 또는 sample.is_deleted === false
        setSampleList(validSamples);
      })
      .catch(err => console.error('샘플 목록 불러오기 실패:', err));
  }, []);

  useEffect(() => {
    if (propSampleId) {
      setSampleId(propSampleId);
    }
  }, [propSampleId]);

  useEffect(() => {
  const fetchSample = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}samples/get/${sampleId}/`);
      setSample(res.data);
      setValues(res.data.results || []);

      // 🔥 alias -> 패널명 변환
      const alias = res.data.test_type;
      const panelName = aliasToPanelName[alias];
      if (panelName && panelComponents[panelName]) {
        setSelectedPanel(panelName);
      } else {
        setSelectedPanel('');
      }

     } catch (err) {
    //   console.log('샘플 ID:', sampleId);
    //   console.log('test_type:', alias);
    //   console.log('패널명 변환 결과:', panelName);
    //   console.log('패널 구성 존재 여부:', !!panelComponents[panelName]);

      console.error('샘플 불러오기 실패:', err);
      setError('샘플 데이터를 불러오는 데 실패했습니다.');
    }
  };

  if (sampleId) {
    fetchSample();
  }
}, [sampleId]);

  const handleChange = (component, value) => {
    setResults((prev) => ({ ...prev, [component]: value }));
  };

  const handleSubmit = async () => {
    const entries = Object.entries(results);
    const expectedComponents = panelComponents[selectedPanel] || [];
    const hasAllValues = expectedComponents.every((comp) => results[comp]?.trim());

    if (!hasAllValues) {
      alert('❗ 모든 검사 항목을 입력해야 합니다.');
      return;
    }
    try {
      // 중복 제출 방지를 위한 검사
      const allCdssResults = await axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/`);
      const exists = allCdssResults.data.some(r => String(r.sample) === String(sampleId));
      if (exists) {
        alert('⚠ 이미 CDSS로 전송된 샘플입니다. 결과를 다시 등록할 수 없습니다.');
        return;
      }


      // 🆕 CDSS 예측 통합 전송
          const cdssPayload = {
            sample: sampleId,
            test_type: selectedPanel,
            values: results,
            verified_by: 1,
            verified_date: new Date().toISOString(),
            patient_id: sample?.patient_id
          }; 

          console.log("🚀 CDSS 전송 시작 ===");
          console.log("📦 sampleId:", sampleId);
          console.log("📦 selectedPanel (test_type):", selectedPanel);
          console.log("📦 payload:", cdssPayload);

          await axios.post(`${process.env.REACT_APP_API_BASE_URL}cdss/predict/`, cdssPayload)
            .then(res => {
              console.log("✅ CDSS 응답:", res.data);
              if (res.data.debug) {
                console.log("🐛 [CDSS DEBUG INFO]");
                console.log("📄 test_type 요청:", res.data.debug.requested_test_type);
                console.log("🔁 매핑된 모델명:", res.data.debug.mapped_test_type);
                console.log("📦 등록된 모델 키:", res.data.debug.model_keys);
                console.log("🔬 입력된 피처 목록:", res.data.debug.input_features);
                console.log("🚨 에러 메시지:", res.data.debug.error);
              }
              if (res.data.prediction !== undefined) {
                console.log("🔍 예측 결과:", res.data.prediction);
              }
              if (res.data.shap_data) {
                console.log("📊 SHAP 데이터 있음");
              }
            })
            .catch(err => {
              console.error('❌ CDSS POST error:', err?.response?.data || err);
              throw err;
            });
          

      // 로그 저장
      try {
        const allLogs = await axios.get(`${process.env.REACT_APP_API_BASE_URL}logs/`);
        const matched = allLogs.data.find(
          log =>
            log.sample_status?.toString() === sampleId?.toString() &&
            log.step === 'sample'
        );

        const patient_id = matched?.patient_id || 'UNKNOWN';
        const doctor_id = matched?.doctor_id || 'UNKNOWN';

        const resultText = entries.map(
          ([comp, val]) => `${comp}: ${val} ${componentUnits[comp] || ''}`
        ).join(', ');

        await saveLog({
          patient_id,
          doctor_id,
          sample: sampleId,
          step: 'result',
          result_detail: resultText
        });

      } catch (logErr) {
        console.warn('❗ 로그 저장 중 오류:', logErr);
      } //

      alert('모든 결과가 성공적으로 등록 및 CDSS 전송되었습니다.');
      navigate('/lis/result-list');
    } catch (error) {
      console.error('등록 또는 전송 실패:', error);
      alert('일부 또는 전체 결과 등록 실패');
    }
  };

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-bold mb-2">결과 입력</h2>
//       <select
//         value={sampleId}
//         onChange={(e) => setSampleId(e.target.value)}
//         className="mb-4 border px-2 py-1 rounded w-60"
//       >
//         <option value="">샘플을 선택하세요</option>
//         {sampleList.map((sample) => (
//           <option key={sample.id} value={sample.id}>
//             {`ID ${sample.id} - ${sample.test_type}`}
//           </option>
//         ))}
//       </select>

//       {selectedPanel && (
//         <div>
//           <h3 className="font-semibold mb-2">{selectedPanel} 항목 입력</h3>
//           <div className="space-y-2">
//             {panelComponents[selectedPanel].map((component) => (
//               <div key={component} className="flex gap-2 items-center">
//                 <label className="w-48">{component} ({componentUnits[component] || '-'})</label>
//                 <input
//                   type="text"
//                   value={results[component] || ''}
//                   onChange={(e) => handleChange(component, e.target.value)}
//                   className="border px-2 py-1 rounded w-40"
//                   placeholder="값 입력"
//                   required 
//                 />
//               </div>
//             ))}
//             <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
//               결과 등록
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

  return (
    <div className="result-form-container">
      <h2>🧪 결과 입력</h2>

      <label className="sample-select-label">샘플 선택</label>
      {!propSampleId && (
      <select
        value={sampleId}
        onChange={(e) => setSampleId(e.target.value)}
        className="sample-select"
      >
        <option value="">샘플을 선택하세요</option>
        {sampleList.map((sample) => (
          <option key={sample.id} value={sample.id}>
            {`ID ${sample.id} - ${sample.test_type}`}
          </option>
        ))}
      </select>
      )}

      {selectedPanel && (
        <>
          <h3 className="panel-title">{selectedPanel} 항목 입력</h3>
          {panelComponents[selectedPanel].map((component) => (
            <div className="result-row" key={component}>
              <label className="result-label">
                {component} ({componentUnits[component] || '-'})
              </label>
              <input
                type="text"
                value={results[component] || ''}
                onChange={(e) => handleChange(component, e.target.value)}
                className="result-input"
                placeholder="값 입력"
                required
              />
            </div>
          ))}
          <button onClick={handleSubmit} className="submit-button">결과 등록</button>
        </>
      )}
    </div>
  );
};


export default ResultInputForm;
