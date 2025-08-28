// frontend/src/components/OCS/OCSLogPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OCSLogPage.css';

export default function OCSLogPage() {
  const [lisLogs, setLisLogs] = useState([]);
  const [risLogs, setRisLogs] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return weekAgo.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalLisCount, setTotalLisCount] = useState(0);
  const [totalRisCount, setTotalRisCount] = useState(0);
  const [loading, setLoading] = useState({ lis: false, ris: false });
  const [error, setError] = useState(null);
  const [testTypeFilter, setTestTypeFilter] = useState('');

  const API = process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '');

  const fetchLisLogs = useCallback(async () => {
    setLoading(prev => ({ ...prev, lis: true }));
    try {
      const params = {
        page, page_size: pageSize, start_date: startDate, end_date: endDate,
        order_type: 'LIS',
      };
      if (patientFilter) params.patient_id = patientFilter;
      if (doctorFilter) params.doctor_id = doctorFilter;
      if (testTypeFilter) params.test_type = testTypeFilter;

      const res = await axios.get(`${API}/orders/logs/`, { params });
      setLisLogs(res.data.data || []);
      setTotalLisCount(res.data.total);
    } catch (err) {
      console.error('LIS 로그 조회 실패:', err);
      setError('진단검사 로그를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(prev => ({ ...prev, lis: false }));
    }
  }, [page, pageSize, patientFilter, doctorFilter, testTypeFilter, startDate, endDate, API]);

  const fetchRisLogs = useCallback(async () => {
    setLoading(prev => ({ ...prev, ris: true }));
    try {
      const params = {
        page,
        page_size: pageSize,
        patient_id: patientFilter,
        doctor_id: doctorFilter,
        start_date: startDate,
        end_date: endDate,
      };
      const res = await axios.get(`${API}/worklist/study-requests/`, { params });
      setRisLogs(res.data.data || []);
      setTotalRisCount(res.data.total);
    } catch (err) {
      console.error('RIS 로그 조회 실패:', err);
      setError('영상의학 로그를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(prev => ({ ...prev, ris: false }));
    }
  }, [page, pageSize, patientFilter, doctorFilter, testTypeFilter, startDate, endDate, API]);

  useEffect(() => {
    fetchLisLogs();
  }, [fetchLisLogs]);

  useEffect(() => {
    fetchRisLogs();
  }, [fetchRisLogs]);

  useEffect(() => {
    const channel = new BroadcastChannel('order_channel');
    channel.onmessage = (event) => {
      if (event.data === 'newOrderCreated') {
        console.log('📢 RIS 목록 새로고침');
        fetchRisLogs();
      }
    };
    return () => { channel.close(); };
  }, [fetchRisLogs]);

  const handleSearch = () => setPage(1);

  const handleReset = () => {
    setPatientFilter(''); setDoctorFilter(''); setTestTypeFilter('');
    const today = new Date(); const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    setStartDate(weekAgo.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
    setPage(1);
  };

  const handlePrev = () => page > 1 && setPage(p => p - 1);
  const handleNext = () => {
    const maxPage = Math.ceil(totalLisCount / pageSize);
    page < maxPage && setPage(p => p + 1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ko-KR', {
        year: '2-digit', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch { return dateString; }
  };

  const getStatusClassName = (status) => `status-badge status-${status?.toLowerCase() || 'unknown'}`;

  return (
    <div className="ocs-log-wrapper">
      {/* 🔹 상단 탭 메뉴 추가 */}
      <div className="ocs-tab-nav">
        <button className="tab-button active">메디시스 v3.0</button>
        <button className="tab-button" onClick={() => navigate('/lis')}>LIS</button>
        <button className="tab-button" onClick={() => navigate('/RISPage')}>RIS</button>
      </div>
      <button
        className="back-button"
        onClick={() => navigate(-1)}
        title="돌아가기"
      >
        <img
          src="/back-icon.png"
          alt="뒤로가기"
          style={{ width: '20px', height: '20px' }}
        />
      </button>

      <div className="ocs-log-container">
        <h2 className="ocs-log-title">
          <span role="img" aria-label="log-icon" style={{ marginRight: '10px' }}>📋</span>
          요청 내역 확인
        </h2>

        <div className="ocs-filter-box">
          <div className="filter-group">
            <div className="filter-item">
              <label htmlFor="patient-id">환자 ID</label>
              <input id="patient-id" type="text" placeholder="환자 ID 입력" value={patientFilter} onChange={e => setPatientFilter(e.target.value)} />
            </div>
            <div className="filter-item">
              <label htmlFor="doctor-id">의사 ID</label>
              <input id="doctor-id" type="text" placeholder="의사 ID 입력" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} />
            </div>
            <div className="filter-item">
              <label htmlFor="test-type">검사 타입</label>
              <input id="test-type" type="text" placeholder="예: CBC, RFT, CR 등" value={testTypeFilter} onChange={e => setTestTypeFilter(e.target.value)} />
            </div>
            <div className="filter-item">
              <label htmlFor="start-date">시작 날짜</label>
              <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="filter-item">
              <label htmlFor="end-date">종료 날짜</label>
              <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-primary" onClick={handleSearch} disabled={loading.lis || loading.ris}>🔍 검색</button>
            <button className="btn-secondary" onClick={handleReset} disabled={loading.lis || loading.ris}>🔄 초기화</button>
          </div>
        </div>

        <div className="ocs-table-container">
          <h3>🧪 진단검사 로그 (LIS)</h3>
          <table className="ocs-log-table">
            <thead>
              <tr>
                <th>No.</th><th>환자 ID</th><th>의사 ID</th><th>검사 타입</th><th>검사 항목</th><th>오더 날짜</th><th>상태</th><th>생성 시각</th>
              </tr>
            </thead>
            <tbody>
              {loading.lis ? (<tr><td colSpan="8" className="message-cell">로딩 중...</td></tr>)
              : error ? (<tr><td colSpan="8" className="message-cell error">{error}</td></tr>)
              : lisLogs.length === 0 ? (<tr><td colSpan="8" className="message-cell">LIS 로그가 없습니다.</td></tr>)
              : lisLogs.map(log => (
                <tr key={`lis-${log.order_id}`}>
                  <td>{log.order_id}</td><td>{log.patient_id}</td><td>{log.doctor_id}</td><td>{log.panel}</td>
                  <td>{Array.isArray(log.tests) ? log.tests.join(', ') : log.tests}</td>
                  <td>{log.order_date}</td>
                  <td><span className={getStatusClassName(log.status)}>{log.status}</span></td>
                  <td>{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ocs-table-container" style={{ marginTop: '40px' }}>
          <h3>🖼️ 영상의학 검사 로그 (RIS)</h3>
          <table className="ocs-log-table">
            <thead>
              <tr>
                <th>No.</th><th>환자 ID</th><th>요청의사</th><th>검사부위</th><th>모달리티</th><th>검사설명</th><th>상태</th><th>생성 시각</th>
              </tr>
            </thead>
            <tbody>
              {loading.ris ? (<tr><td colSpan="8" className="message-cell">로딩 중...</td></tr>)
              : error ? (<tr><td colSpan="8" className="message-cell error">{error}</td></tr>)
              : risLogs.length === 0 ? (<tr><td colSpan="8" className="message-cell">RIS 로그가 없습니다.</td></tr>)
              : risLogs.map(log => (
                <tr key={`ris-${log.order_id}`}>
                  <td>{log.order_id}</td><td>{log.patient_id}</td><td>{log.doctor_id}</td><td>{log.body_part || '-'}</td>
                  <td>{log.panel}</td><td>{Array.isArray(log.tests) ? log.tests.join(', ') : log.tests}</td>
                  <td><span className={getStatusClassName(log.status)}>{log.status}</span></td>
                  <td>{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(totalLisCount + totalRisCount) > -1 && (
          <div className="ocs-pagination">
            <button onClick={handlePrev} disabled={page === 1 || loading.lis}>이전</button>
            <span> Page {page} / {Math.ceil(totalLisCount / pageSize)} </span>
            <button onClick={handleNext} disabled={page >= Math.ceil(totalLisCount / pageSize) || loading.lis}>다음</button>
          </div>
        )}

        <footer className="ocs-footer">
          <p>
            © 2025 LaCID. 모든 권리 보유. |
            <a href="#/privacy"> 개인정보처리방침</a> |
            <a href="#/terms"> 이용약관</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
