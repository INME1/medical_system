import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SampleListPage.css';
import SlidePanel from './LisSlidePanel';
import ResultInputFrom from './ResultInputForm';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SampleListPage = () => {
  const navigate = useNavigate();
  const [samples, setSamples] = useState([]);
  const [cdssSampleIds, setCdssSampleIds] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // 오늘 날짜
  const [showResultPanel, setShowResultPanel] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState(null);

  // 삭제 모달 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetSampleId, setTargetSampleId] = useState(null);

  const fetchSamples = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}samples/`);
        const sorted = res.data.sort((a, b) => new Date(b.collection_date) - new Date(a.collection_date));
        setSamples(sorted);
      } catch (err) {
        console.error('샘플 목록 불러오기 실패:', err);

        if (err.response?.data) {
         console.log("💡 백엔드 오류 응답 내용:", err.response.data);
        }
      }
    };

  const fetchCdssResults = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}cdss/results/`);
        const ids = res.data.map(r => r.sample);
        setCdssSampleIds(ids);
      } catch (err) {
        console.error('CDSS 결과 불러오기 실패:', err);

        if (err.response?.data) {
         console.log("💡 백엔드 오류 응답 내용:", err.response.data);
        }
      }
    };

    
  
     const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}samples/delete/${targetSampleId}`);
      setSamples(prev => prev.filter(s => s.id !== targetSampleId));
      setShowConfirmModal(false);
      setTargetSampleId(null);
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('샘플 삭제에 실패했습니다.');
    }
  }

  useEffect(() => {
    fetchSamples();
    fetchCdssResults();
  }, []);

  // [OCS] 추가된 handleResultClick 함수 
  const handleResultClick = async (sample) => {
    try {
      // 1. 오더 정보 조회
      const patient_id = sample.order?.patient_id || 'UNKNOWN';
      const doctor_id = sample.order?.doctor_id || 'UNKNOWN';
      
      // 2. 로그 전송 payload 구성
      const payload = {
        patient_id,
        doctor_id,
        order_id: sample.order?.order_id || sample.order,
        sample_id: sample.id,
        step: 'result',
        result_detail: `${sample.test_type || '기타'} 결과 등록`
      };

      console.log("보내는 로그:", payload); // 확인용
      // await axios.post(`${API_BASE_URL}logs/create/`, payload);
      console.log("✅ 로그 저장 성공");
      setSelectedSampleId(sample.id);
      setShowResultPanel(true);
    } catch (err) {
      console.error("❌ 로그 저장 실패:", err.response?.data || err.message);
    } 
  };

  const requestDelete = (sampleId) => {
    setTargetSampleId(sampleId);
    setShowConfirmModal(true);
  };

  const formatDate = (isoDateString) => {
    const date = new Date(isoDateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
 
  const filteredSamples = samples
    .filter(sample => sample.collection_date?.startsWith(selectedDate))
    .filter(sample => sample.id.toString().includes(searchKeyword));


return (
    <div className="sample-wrapper">
      <div className="sample-container">
        <h2 className="sample-title">🧪 샘플 목록</h2>

        {/* 날짜 + 검색 필터 */}
        <div className="sample-filter">
          <div className="filter-item">
            <label>📅 날짜 선택:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>🔍 Sample ID 검색:</label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="샘플 ID 입력"
            />
          </div>
        </div>

        {/* 테이블 */}
        <div className="sample-table-wrapper">
          <table className="sample-table">
            <thead>
              <tr>
                <th>샘플 ID</th>
                <th>오더 ID</th>
                <th>검체 종류</th>
                <th>검사 항목</th>
                <th>LOINC 코드</th>
                <th>채취일시</th>
                <th>상태</th>
                <th>결과 상태</th>
                <th>결과 등록</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map(sample => {
                const isRegistered = cdssSampleIds.includes(sample.id);
                return (
                  <tr key={sample.id}>
                    <td>{sample.id}</td>
                    <td>{sample.order}</td>
                    <td>{sample.sample_type}</td>
                    <td>{sample.test_type}</td>
                    <td>{sample.loinc_code}</td>
                    <td>{formatDate(sample.collection_date)}</td>
                    <td>
                      <span className="status-badge">{sample.sample_status}</span>
                    </td>
                    <td>
                      <span className={isRegistered ? 'badge-done' : 'badge-processing'}>
                        {isRegistered ? '검사 완료' : '검사 중'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleResultClick(sample)}
                        disabled={isRegistered}
                        className={isRegistered ? 'button-disabled' : 'button-register'}
                      >
                        {isRegistered ? '등록 완료' : '결과 등록'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => requestDelete(sample.id)}
                        className="button-delete"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSamples.length === 0 && (
                <tr>
                  <td colSpan="10" className="no-data">표시할 샘플이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>샘플 ID {targetSampleId}을(를) 삭제하시겠습니까?</p>
            <div className="modal-buttons">
              <button onClick={confirmDelete} className="btn-confirm">삭제</button>
              <button onClick={() => setShowConfirmModal(false)} className="btn-cancel">취소</button>
            </div>
          </div>
        </div>
      )}
      <SlidePanel isOpen={showResultPanel} onClose={() => setShowResultPanel(false)}>
        <ResultInputFrom sampleId={selectedSampleId} onClose={() => setShowResultPanel(false)} />      
      </SlidePanel>
    </div>
  );
};



export default SampleListPage;
