// LIS/ResultCdss

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './ResultCdss.css';
import CdssResultModal from './ResultModal';


const CdssResultTable = () => {
  const [allResults, setAllResults] = useState([]);
  const [sampleOptions, setSampleOptions] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedSamples, setExpandedSamples] = useState({}); 
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const fetchCdssResults = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/`);
      setAllResults(res.data); // 원본 저장
      setError('');
    } catch (err) {
      console.error('CDSS 결과 불러오기 실패:', err);
      if (err.response) {
        console.log("서버 응답 내용:", err.response.data);
      }
      setError('결과를 불러오는 데 실패했습니다.');
      setAllResults([]);
    }
  }, []);

  useEffect(() => {
    fetchCdssResults();
  }, [selectedDate, fetchCdssResults]);

  const filteredResults = allResults.filter(r =>
    (!selectedDate || r.verified_date?.slice(0, 10) === selectedDate) &&
    (!selectedSampleId || String(r.sample) === String(selectedSampleId)) &&
    (!searchKeyword || String(r.sample).includes(searchKeyword))
  );

  // 3. 샘플ID별 그룹핑
  const grouped = filteredResults.reduce((acc, curr) => {
    acc[curr.sample] = acc[curr.sample] || [];
    acc[curr.sample].push(curr);
    return acc;
  }, {});


    // 샘플 ID 목록 옵션
  useEffect(() => {
    const uniqueIds = [...new Set(
      allResults
        .filter(r => r.verified_date?.slice(0, 10) === selectedDate)
        .map(r => r.sample)
    )];
    setSampleOptions(uniqueIds);
  }, [allResults, selectedDate]);


  const handleDeleteSample = async (sampleId) => {
    console.log("삭제 요청 sampleId:", sampleId); 
    if (!window.confirm(`샘플 ID ${sampleId}의 결과 전체를 삭제하시겠습니까?`)) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}cdss/delete/${sampleId}/`);
      alert('✅ 해당 샘플 결과 전체가 삭제되었습니다.');
      fetchCdssResults();
    } catch (err) {
      console.error('❌ 삭제 실패(에러 객체):', err);
      if (err.response) {
        console.error('❌ 삭제 실패(응답 data):', err.response.data); // <-- 응답 본문 에러 메시지
      }
      alert('삭제 실패');
    }
  };

  const openResultModal = async (sampleId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/${sampleId}/`);
      setModalData(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error("모달 결과 불러오기 실패:", err);
    }
  };

  const handleToggleSample = (sampleId) => {
    setExpandedSamples(prev => ({
      ...prev,
      [sampleId]: !prev[sampleId],
    }));
  };


  return (
  <div className="result-cdss-wrapper">
    <h2 className="text-2xl font-bold mb-4">📊 CDSS 검사 결과</h2>
    {error && <p className="text-red-500 font-semibold mb-4">{error}</p>}

    {/* 검색/필터 바 */}
    <div className="filter-bar">
      <label>
        시작 날짜:
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedSampleId('');
            setSearchKeyword('');
          }}
        />
      </label>

      <label>
        🔍 Sample ID 검색:
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="샘플 ID 입력"
        />
      </label>

      <label>
        🔍 Sample ID 선택:
        <select
          value={selectedSampleId}
          onChange={(e) => setSelectedSampleId(e.target.value)}
        >
          <option value="">전체 보기</option>
          {sampleOptions.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </label>
    </div>

    {/* 결과 테이블 */}
    <div className="overflow-x-auto">
      <table className="result-table">
        <thead>
          <tr>
            <th>Sample ID</th>
            <th>Test Type</th>
            <th>Component</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Verified By</th>
            <th>Verified Date</th>
            <th>Prediction</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(grouped).length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-message">
                해당 샘플 ID에 대한 결과가 없습니다.
              </td>
            </tr>
          ) : (
            Object.keys(grouped).map((sample) => (
              <React.Fragment key={sample}>
                <tr className="group-header">
                  <td colSpan="8">
                      <span
                        className="group-toggle-btn"
                        onClick={() => handleToggleSample(sample)}
                      >
                        {expandedSamples[sample] ? '▼' : '▶'} 샘플 ID: {sample}
                      </span>
                        <button
                          className="view-result-btn"
                          onClick={() => openResultModal(sample)}
                        >
                          분석 결과 보기
                        </button>
                        <span
                          className="group-delete-btn"
                          onClick={() => handleDeleteSample(sample)}
                        >
                          전체 삭제
                        </span>
                  </td>
                </tr>

                {expandedSamples[sample] &&
                  grouped[sample].map((result, idx) => (
                    <tr key={result.id || idx} className="text-center bg-white">
                      <td>{result.sample}</td>
                      <td>{result.test_type}</td>
                      <td>{result.component_name}</td>
                      <td>{result.value}</td>
                      <td>{result.unit}</td>
                      <td>{result.verified_by}</td>
                      <td>{new Date(result.verified_date).toLocaleString()}</td>
                      <td>
                        {idx === 0 ? (
                          result.prediction === 1 ? '🔴 이상' :
                          result.prediction === 0 ? '🟢 정상' :
                          result.prediction || '-'
                        ) : ''}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>

    {modalOpen && modalData && (
      <CdssResultModal data={modalData} onClose={() => setModalOpen(false)} isModal={true} />
    )}
  </div>
);
};
export default CdssResultTable;
