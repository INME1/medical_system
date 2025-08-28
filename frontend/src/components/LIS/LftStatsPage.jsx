import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ShapContributionChart from './ShapContributionChart';
import SimulationPanel from './SimulationPanel';
import ShapSummaryText from './ShapSummaryText';

const safeNumber = (n) => {
  const parsed = parseFloat(n);
  return isNaN(parsed) ? 0 : parsed;
};

const CdssVisualizationPage = () => {
  const [sampleList, setSampleList] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [sampleDetail, setSampleDetail] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/`)
      .then(res => {
        const ids = [...new Set(res.data.map(r => r.sample))];
        setSampleList(ids);
      });
  }, []);

  useEffect(() => {
    if (selectedSample) {
      axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/${selectedSample}/`)
        .then(res => {
          setSampleDetail(res.data);
        })
        .catch(err => {
          console.error('❌ 샘플 예측 결과 불러오기 실패:', err);
          setSampleDetail(null);
        });
    } else {
      setSampleDetail(null);
    }
  }, [selectedSample]);

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f9fafb' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>🧾 CDSS 시각화</h1>

      <label htmlFor="sample-select" style={{ display: 'block', marginBottom: '0.5rem' }}>샘플을 선택하세요:</label>
      <select
        id="sample-select"
        value={selectedSample}
        onChange={e => setSelectedSample(e.target.value)}
        style={{ padding: '0.5rem', marginBottom: '2rem', minWidth: '200px' }}
      >
        <option value=''>-- 샘플 선택 --</option>
        {sampleList.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2>🧬 샘플 결과 ({selectedSample || '선택 안 됨'})</h2>
        {sampleDetail ? (
          <>
            <p>{sampleDetail.prediction === 1 ? '🔴 이상 소견' : '🟢 정상 소견'}</p>
            <ShapContributionChart shapData={sampleDetail?.shap_data} />
            <ShapSummaryText predictionProb={sampleDetail?.prediction_prob} shapData={sampleDetail?.shap_data} />
            <SimulationPanel
              sampleId={selectedSample}
              testType={sampleDetail?.test_type}
              initialValues={sampleDetail?.results?.length
                ? Object.fromEntries(
                    sampleDetail.results.map(r => [r.component_name, safeNumber(r.value)])
                  )
                : {}
              }
            />
          </>
        ) : (
          <p style={{ color: '#6b7280' }}>📭 SHAP 데이터가 없습니다.<br />🛠️ 시뮬레이션 패널 준비 중입니다.</p>
        )}
      </div>
    </div>
  );
};

export default CdssVisualizationPage;