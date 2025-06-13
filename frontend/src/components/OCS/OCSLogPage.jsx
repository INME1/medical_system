import React, { useState, useEffect, useCallback } from 'react';
import { saveLog } from '../utils/saveLog';  // utils 위치에 맞게 상대 경로 확인
import axios from 'axios';
import './OCSLogPage.css';

const OCSLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize };
      if (patientFilter) params.patient = patientFilter;
      if (doctorFilter) params.doctor = doctorFilter;

      // proxy를 package.json 에 설정했다면 이대로 사용
      const res = await axios.get('/api/logs/', { params });
        // await axios.get('http://35.225.63.41:8000/api/logs/logs/', { params });
                 
      setLogs(res.data.data);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error('로그 조회 실패:', err);
      setError('로그를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, patientFilter, doctorFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    // 1) 로그 남기기 (POST)
    saveLog({
      action: '검색 클릭',
      patient_id: null,    // UUID를 알고 있다면 이곳에 넣어 주세요
      doctor_id:  null,
      payload: { patientFilter, doctorFilter },
    });

    // 2) 검색 결과 조회
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setPatientFilter('');
    setDoctorFilter('');
    setPage(1);
    fetchLogs();
  };

  const handlePrev = () => {
    if (page > 1) setPage(p => p - 1);
  };
  const handleNext = () => {
    const maxPage = Math.ceil(totalCount / pageSize);
    if (page < maxPage) setPage(p => p + 1);
  };

  return (
    <div className="ocs-body">
      <h2 className="ocs-title">OCS 로그 조회</h2>

      <div className="ocs-controls">
        <label className="ocs-controls-label">환자:</label>
        <input
          type="text"
          className="ocs-controls-input"
          placeholder="환자 이름 검색"
          value={patientFilter}
          onChange={e => setPatientFilter(e.target.value)}
        />
        <label className="ocs-controls-label">의사:</label>
        <input
          type="text"
          className="ocs-controls-input"
          placeholder="의사 이름 검색"
          value={doctorFilter}
          onChange={e => setDoctorFilter(e.target.value)}
        />
        <button className="ocs-controls-button" onClick={handleSearch}>검색</button>
        <button className="ocs-controls-button reset" onClick={handleReset}>초기화</button>
      </div>

      {loading && <p className="ocs-loading-message">로딩 중...</p>}
      {error   && <p className="ocs-error-message">{error}</p>}
      {!loading && !error && logs.length === 0 && (
        <p className="ocs-no-logs">저장된 로그가 없습니다.</p>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="ocs-table-container">
          <table className="ocs-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>환자</th>
                <th>의사</th>
                <th>시스템</th>
                <th>Raw Data</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} className={idx % 2 === 0 ? 'ocs-table-even-row' : ''}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.raw_data.patient_name || log.patient_id}</td>
                  <td>{log.raw_data.doctor_name  || log.doctor_id}</td>
                  <td>{log.system}</td>
                  <td><pre>{JSON.stringify(log.raw_data, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="ocs-controls" style={{ justifyContent: 'space-between' }}>
          <button className="ocs-controls-button" onClick={handlePrev} disabled={page === 1}>이전</button>
          <span>Page {page} / {Math.ceil(totalCount / pageSize)}</span>
          <button className="ocs-controls-button" onClick={handleNext} disabled={page >= Math.ceil(totalCount / pageSize)}>다음</button>
        </div>
      )}
    </div>
  );
};

export default OCSLogPage;



// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './OCSLogPage.css';

// const API_BASE = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '');


// export default function OCSLogPage() {
//   const [logs, setLogs]           = useState([]);
//   const [patientId, setPatientId] = useState('');
//   const [doctorId, setDoctorId]   = useState('');
//   const [startDate, setStartDate] = useState(() => {
//     const d = new Date();
//     d.setDate(d.getDate() - 7);           // 기본 7일 전
//     return d.toISOString().slice(0, 10);
//   });
//   const [endDate, setEndDate]     = useState(() =>
//     new Date().toISOString().slice(0, 10)
//   );
//   const [loading, setLoading]     = useState(false);
//   const [error, setError]         = useState('');

//   const fetchLogs = async () => {
//   setLoading(true);
//   setError('');

//   const params = {};
//     if (patientId) params.patient_id = patientId;
//     if (doctorId)  params.doctor_id  = doctorId;
//     if (startDate) params.start_date = startDate;
//     if (endDate)   params.end_date   = endDate;

//     try {
//       const url = `${API_BASE}/logs/combined/`;
//       console.log('▶ fetchLogs() 요청 URL:', url, '파라미터:', params);

//       const res = await axios.get(url, { params });
//       console.log('▶ fetchLogs() 응답 객체:', res);
//       console.log('▶ fetchLogs() res.data:', res.data);
//       console.log('▶ fetchLogs() res.data.data:', res.data.data);

//       setLogs(res.data.data ?? res.data);
//     } catch (err) {
//       console.error('❌ 로그 조회 실패:', err);
//       setError('로그를 불러오는 데 실패했습니다.');
//       setLogs([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLogs();
//   }, [patientId, doctorId, startDate, endDate]);

//   const handleReset = () => {
//     setPatientId('');
//     setDoctorId('');
//     const today = new Date().toISOString().slice(0, 10);
//     setEndDate(today);
//     const weekAgo = new Date();
//     weekAgo.setDate(weekAgo.getDate() - 7);
//     setStartDate(weekAgo.toISOString().slice(0, 10));
//   };

//   return (
//     <div className="ocs-body">
//       <h1 className="ocs-title">로그 조회</h1>

//       <div className="ocs-controls">
//         <input
//           className="ocs-controls-input"
//           placeholder="환자 ID"
//           value={patientId}
//           onChange={e => setPatientId(e.target.value)}
//         />
//         <input
//           className="ocs-controls-input"
//           placeholder="의사 ID"
//           value={doctorId}
//           onChange={e => setDoctorId(e.target.value)}
//         />

//         <input
//           type="date"
//           className="ocs-controls-input"
//           value={startDate}
//           onChange={e => setStartDate(e.target.value)}
//         />
//         <input
//           type="date"
//           className="ocs-controls-input"
//           value={endDate}
//           onChange={e => setEndDate(e.target.value)}
//         />

//         <button
//           className="ocs-controls-button"
//           onClick={fetchLogs}
//           disabled={loading}
//         >
//           {loading ? '로딩 중…' : '검색'}
//         </button>
//         <button
//           className="ocs-controls-button reset"
//           onClick={handleReset}
//           disabled={loading}
//         >
//           초기화
//         </button>
//       </div>

//       {error && <div className="ocs-error">⚠️ {error}</div>}

//       <table className="ocs-table">
//         <thead>
//           <tr>
//             <th>NO</th>
//             <th>환자</th>
//             <th>의사</th>
//             <th>요청 종류</th>
//             <th>요청/결과</th>
//             <th>진단 상세</th>
//             <th>요청/결과 시간</th>
//           </tr>
//         </thead>
//         <tbody>
//           {logs.length > 0 ? (
//             logs.map(log => (
//               <tr key={log.no}>
//                 <td>{log.no}</td>
//                 <td>{log.patient}</td>
//                 <td>{log.doctor}</td>
//                 <td>{log.order_type}</td>
//                 <td style={{ whiteSpace: 'pre-wrap' }}>
//                   {log.order_and_result}
//                 </td>
//                 <td style={{ whiteSpace: 'pre-wrap' }}>
//                   {log.diagnosis_detail}
//                 </td>
//                 <td>{log.time}</td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="7" className="ocs-no-data">
//                 저장된 로그가 없습니다.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }



// -------------------오전(20250612)---------------------
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './OCSLogPage.css';

// // 하드코딩된 백엔드 API 기본 URL
// const API = 'http://35.225.63.41:8000/api';

// export default function OCSLogPage() {
//   const [logs, setLogs] = useState([]);
//   const [patientId, setPatientId] = useState('');
//   const [doctorId,  setDoctorId]  = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate,   setEndDate]   = useState('');

//   const fetchLogs = async () => {
//     const params = {};
//     if (patientId) params.patient_id = patientId;
//     if (doctorId)  params.doctor_id  = doctorId;
//     if (startDate) params.start_date  = startDate;
//     if (endDate)   params.end_date    = endDate;

//     try {
//       const res = await axios.get(`${API}/logs/combined/`, { params });
//       // 브라우저 콘솔에 디버그 로그 출력
//       console.log('▶ fetchLogs() 요청 URL:', `${API}/logs/combined/`, '파라미터:', params);
//       console.log('▶ fetchLogs() 응답 객체:', res);
//       console.log('▶ fetchLogs() 데이터 배열:', res.data);

//       setLogs(res.data);
//     } catch (err) {
//       console.error('❌ 로그 조회 실패:', err);
//       setLogs([]);
//     }
//   };

//   useEffect(() => {
//     fetchLogs();
//   }, []);

//   const handleReset = () => {
//     setPatientId('');
//     setDoctorId('');
//     setStartDate('');
//     setEndDate('');
//     fetchLogs();
//   };

//   return (
//     <div className="ocs-body">
//       <h1 className="ocs-title">로그 조회</h1>

//       <div className="ocs-controls">
//         <input
//           className="ocs-controls-input"
//           placeholder="환자 ID"
//           value={patientId}
//           onChange={e => setPatientId(e.target.value)}
//         />
//         <input
//           className="ocs-controls-input"
//           placeholder="의사 ID"
//           value={doctorId}
//           onChange={e => setDoctorId(e.target.value)}
//         />
//         <input
//           type="date"
//           className="ocs-controls-input"
//           value={startDate}
//           onChange={e => setStartDate(e.target.value)}
//         />
//         <input
//           type="date"
//           className="ocs-controls-input"
//           value={endDate}
//           onChange={e => setEndDate(e.target.value)}
//         />

//         <button className="ocs-controls-button" onClick={fetchLogs}>
//           검색
//         </button>
//         <button className="ocs-controls-button reset" onClick={handleReset}>
//           초기화
//         </button>
//       </div>

//       <table className="ocs-table">
//         <thead>
//           <tr>
//             <th>NO</th>
//             <th>환자</th>
//             <th>의사</th>
//             <th>요청 종류</th>
//             <th>요청/결과</th>
//             <th>진단 상세</th>
//             <th>요청/결과 시간</th>
//           </tr>
//         </thead>
//         <tbody>
//           {logs.length > 0 ? (
//             logs.map(log => (
//               <tr key={log.no}>
//                 <td>{log.no}</td>
//                 <td>{log.patient}</td>
//                 <td>{log.doctor}</td>
//                 <td>{log.order_type}</td>
//                 <td style={{ whiteSpace: 'pre-wrap' }}>{log.order_and_result}</td>
//                 <td style={{ whiteSpace: 'pre-wrap' }}>{log.diagnosis_detail}</td>
//                 <td>{log.time}</td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
//                 저장된 로그가 없습니다.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }



//------------20250611 오후-코드-------------
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './OCSLogPage.css';

// const API_BASE_URL = process.env.REACT_APP_API_URL.replace(/\/$/, '');

// const OCSLogPage = () => {
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [patientQuery, setPatientQuery] = useState('');
//   const [doctorQuery, setDoctorQuery] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [error, setError] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);

//   // 2️⃣ 환자 UUID → { id, name } 매핑 객체
//   const [patientMappings, setPatientMappings] = useState({});
//   // 3️⃣ 의사 UUID → name 매핑 객체
//   const [doctorMappings, setDoctorMappings] = useState({});

//   const logsPerPage = 10;

//   // 1️⃣ 기존 로그 가져오는 useEffect (그대로 둠)
//   useEffect(() => {
//     const fetchLogs = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/logs/combined/`);
//         setLogs(res.data);
//         setFilteredLogs(res.data);
//         setError('');
//       } catch (err) { 
//         console.error("❌ 오류 발생:", err); 
//         setError('로그 데이터를 불러오는데 실패했습니다.');
//       }
//     };
//     fetchLogs();
//   }, []);

//   // 2️⃣ 새로운 환자 이름 매핑용 useEffect (추가!)
//   useEffect(() => {
//     const fetchPatients = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/integration/openmrs-patients/`);
//         const mapping = {};
//         res.data.forEach((p) => {
//           mapping[p.uuid] = {
//             id: p.identifiers?.[0]?.identifier || '',
//             name: p.person?.display || p.display || '',
//           };
//         });
//         setPatientMappings(mapping);
//       } catch (err) {
//         console.error("❌ 환자 매핑 실패:", err);
//       }
//     };
//     fetchPatients();
//   }, []);

//   // 3️⃣ 의사 정보 받아오는 useEffect (추가!)
//   useEffect(() => {
//     const fetchDoctors = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/integration/openmrs/providers/`);
//         const mapping = {};
//         (res.data.results || res.data).forEach((d) => {
//           if (d.uuid && (d.display || d.name)) {
//             mapping[d.uuid] = d.display || d.name;
//           }
//         });
//         setDoctorMappings(mapping);
//       } catch (err) {
//         console.error("❌ 의사 매핑 실패:", err);
//       }
//     };
//     fetchDoctors();
//   }, []);

//   const handleSearch = () => {
//     const filtered = logs.filter((log) => {
//       const patientMatch = patientQuery
//         ? (
//             (log.patient_id?.toLowerCase().includes(patientQuery.toLowerCase())) ||
//             (patientMappings[log.patient_id]?.name?.toLowerCase().includes(patientQuery.toLowerCase()))
//           )
//         : true;

//       const doctorMatch = doctorQuery
//         ? (
//             (log.doctor_id?.toLowerCase().includes(doctorQuery.toLowerCase())) ||
//             (doctorMappings[log.doctor_id]?.toLowerCase().includes(doctorQuery.toLowerCase()))
//           )
//         : true;

//       const dateMatch = (() => {
//         if (!startDate && !endDate) return true;
//         const orderTimeStr = log.request_and_return_time?.split('\n')[0]; 
//         if (!orderTimeStr) return false;
//         const logDate = new Date(orderTimeStr);
//         const start = startDate ? new Date(startDate) : null;
//         const end = endDate ? new Date(endDate) : null;
//         return (!start || logDate >= start) && (!end || logDate <= end);
//       })();

//       return patientMatch && doctorMatch && dateMatch;
//     });
//     setFilteredLogs(filtered);
//     setCurrentPage(1);
//   };

//   const handleReset = () => {
//     setPatientQuery('');
//     setDoctorQuery('');
//     setStartDate('');
//     setEndDate('');
//     setFilteredLogs(logs);
//     setCurrentPage(1);
//   };

//   const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
//   const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

//   return (
//     <div className="ocs-body">
//       <h1 className="ocs-title">로그 조회</h1>

//       <div className="ocs-controls">
//         <input 
//           className="ocs-controls-input" 
//           placeholder="환자 ID 또는 이름" 
//           value={patientQuery} 
//           onChange={(e) => setPatientQuery(e.target.value)} />
//         <input 
//           className="ocs-controls-input" 
//           placeholder="의사 ID 또는 이름" 
//           value={doctorQuery} 
//           onChange={(e) => setDoctorQuery(e.target.value)} />
        
//         <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//         <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//         <button className="ocs-controls-button" onClick={handleSearch}>검색</button>
//         <button className="ocs-controls-button reset" onClick={handleReset}>초기화</button>
//       </div>

//       {error && <p className="ocs-error-message">{error}</p>}
//       {filteredLogs.length === 0 ? (
//         <p className="ocs-empty-message">저장된 로그가 없습니다.</p>
//       ) : (
//         <div className="ocs-table-container">
//           <table className="ocs-table">
//             <thead>
//               <tr>
//                 <th>NO</th>
//                 <th>환자</th>
//                 <th>의사</th>
//                 <th>요청 종류</th>
//                 <th>요청/결과</th>
//                 <th>진단 상세</th>
//                 <th>요청/결과 시간</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentLogs.map((log, idx) => (
//                 <tr key={idx}>
//                   <td>{(currentPage - 1) * logsPerPage + idx + 1}</td>
//                   <td>
//                     {/* UUID와 매핑된 이름 함께 표시 */}
//                     {log.patient_id || '-'}
//                     {patientMappings[log.patient_id]?.name
//                       ? ` (${patientMappings[log.patient_id].name})`
//                       : ''}
//                   </td>
//                   <td>
//                     {log.doctor_id || '-'}
//                     {doctorMappings[log.doctor_id]
//                       ? ` (${doctorMappings[log.doctor_id]})`
//                       : ''}
//                   </td>
//                   <td>{log.request_type || '-'}</td>
//                   <td style={{ whiteSpace: 'pre-wrap' }}>{log.request_and_result || '-'}</td>
//                   <td style={{ whiteSpace: 'pre-wrap' }}>{log.diagnosis_detail || '-'}</td>
//                   <td style={{ whiteSpace: 'pre-wrap' }}>{log.request_and_return_time || '-'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {totalPages > 1 && (
//         <div className="ocs-pagination">
//           {Array.from({ length: totalPages }, (_, i) => (
//             <button
//               key={i}
//               className={`ocs-page-button ${i + 1 === currentPage ? 'active' : ''}`}
//               onClick={() => setCurrentPage(i + 1)}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default OCSLogPage;





//---------------20250611 오전-코드 ------------------
// import React, { useState, useEffect } from 'react'
// import axios from 'axios'
// import './OCSLogPage.css'

// const API_BASE_URL = 'http://35.225.63.41:8000/api'

// const OCSLogPage = () => {
//   const [logs, setLogs]                   = useState([])
//   const [filteredLogs, setFilteredLogs]   = useState([])
//   const [patientQuery, setPatientQuery]   = useState('')
//   const [doctorQuery, setDoctorQuery]     = useState('')
//   const [startDate, setStartDate]         = useState('')
//   const [endDate, setEndDate]             = useState('')
//   const [error, setError]                 = useState('')
//   const [currentPage, setCurrentPage]     = useState(1)
//   const [patientMap, setPatientMap]       = useState({})
//   const [doctorMap, setDoctorMap]         = useState({})
//   const logsPerPage = 10

//   useEffect(() => {
//     // 1) 환자·의사 매핑 정보 로드
//     const fetchMappings = async () => {
//       try {
//         const [pRes, dRes] = await Promise.all([
//           axios.get(`${API_BASE_URL}/integration/openmrs/patients/map/`), 
//           axios.get(`${API_BASE_URL}/integration/openmrs/providers/map/`)
//         ])

//         const pm = {}
//         pRes.data.results.forEach(p => {
//           pm[p.uuid] = p.name
//           if (p.id) pm[p.id] = p.name
//         })
//         setPatientMap(pm)

//         const dm = {}
//         dRes.data.results.forEach(d => {
//           dm[d.uuid] = d.name
//         })
//         setDoctorMap(dm)

//       } catch (err) {
//         console.error('매핑 로드 실패', err)
//         setError('환자/의사 정보 로드에 실패했습니다.')
//       }
//     }

//     // 2) 통합 로그 데이터 로드
//     const fetchCombined = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/logs/combined/`)
//         setLogs(res.data)
//         setFilteredLogs(res.data)
//         setError('')
//       } catch (err) {
//         console.error('통합 로그 로드 실패', err)
//         setError('로그 데이터를 불러오는데 실패했습니다.')
//       }
//     }

//     fetchMappings()
//     fetchCombined()
//   }, [])

//   // 검색 처리
//   const handleSearch = () => {
//     const termP = patientQuery.toLowerCase()
//     const termD = doctorQuery.toLowerCase()
//     const start = startDate ? new Date(startDate) : null
//     const end   = endDate   ? new Date(endDate)   : null

//     const filtered = logs.filter(log => {
//       const pid     = log.patient_uuid || log.patient_id || ''
//       const pname   = patientMap[pid] || ''
//       const pmatch  = !patientQuery ||
//                       pid.toLowerCase().includes(termP) ||
//                       pname.toLowerCase().includes(termP)

//       const did     = log.doctor_uuid || log.doctor_id || ''
//       const dname   = doctorMap[did] || ''
//       const dmatch  = !doctorQuery ||
//                       did.toLowerCase().includes(termD) ||
//                       dname.toLowerCase().includes(termD)

//       const date    = log.request_and_return_time
//                         ? new Date(log.request_and_return_time)
//                         : null
//       const dateMatch = (!start || (date && date >= start)) &&
//                         (!end   || (date && date <= end))

//       return pmatch && dmatch && dateMatch
//     })

//     setFilteredLogs(filtered)
//     setCurrentPage(1)
//   }

//   const handleReset = () => {
//     setPatientQuery('')
//     setDoctorQuery('')
//     setStartDate('')
//     setEndDate('')
//     setFilteredLogs(logs)
//     setCurrentPage(1)
//     setError('')
//   }

//   // 페이징 계산
//   const indexOfLast = currentPage * logsPerPage
//   const indexOfFirst = indexOfLast - logsPerPage
//   const currentLogs = filteredLogs.slice(indexOfFirst, indexOfLast)
//   const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

//   // 이름 변환 헬퍼
//   const getName = (map, id) => map[id] || id || 'Unknown'

//   return (
//     <div className="ocs-body">
//       <h1 className="ocs-title">OCS 통합 로그</h1>

//       <div className="ocs-controls">
//         <input
//           className="ocs-controls-input"
//           placeholder="환자 ID 또는 이름"
//           value={patientQuery}
//           onChange={e => setPatientQuery(e.target.value)}
//         />
//         <input
//           className="ocs-controls-input"
//           placeholder="의사 ID 또는 이름"
//           value={doctorQuery}
//           onChange={e => setDoctorQuery(e.target.value)}
//         />
//         <input
//           type="datetime-local"
//           value={startDate}
//           onChange={e => setStartDate(e.target.value)}
//         />
//         <input
//           type="datetime-local"
//           value={endDate}
//           onChange={e => setEndDate(e.target.value)}
//         />
//         <button className="ocs-button" onClick={handleSearch}>검색</button>
//         <button className="ocs-button reset" onClick={handleReset}>초기화</button>
//       </div>

//       {error && <div className="ocs-error">{error}</div>}

//       {filteredLogs.length === 0 ? (
//         <div className="ocs-empty">로그가 없습니다.</div>
//       ) : (
//         <table className="ocs-table">
//           <thead>
//             <tr>
//               <th>NO</th>
//               <th>환자</th>
//               <th>의사</th>
//               <th>요청종류</th>
//               <th>요청/결과</th>
//               <th>진단상세</th>
//               <th>시간</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentLogs.map((log, idx) => (
//               <tr key={idx}>
//                 <td>{indexOfFirst + idx + 1}</td>
//                 <td>
//                   {(log.patient_uuid || log.patient_id) || '-'}
//                   {patientMap[log.patient_uuid || log.patient_id] &&
//                     ` (${patientMap[log.patient_uuid || log.patient_id]})`}
//                 </td>
//                 <td>
//                   {(log.doctor_uuid || log.doctor_id) || '-'}
//                   {doctorMap[log.doctor_uuid || log.doctor_id] &&
//                     ` (${doctorMap[log.doctor_uuid || log.doctor_id]})`}
//                 </td>
//                 <td>{log.request_type}</td>
//                 <td style={{ whiteSpace: 'pre-wrap' }}>
//                   {log.request_and_result}
//                 </td>
//                 <td style={{ whiteSpace: 'pre-wrap' }}>
//                   {log.diagnosis_detail}
//                 </td>
//                 <td>{log.request_and_return_time}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {totalPages > 1 && (
//         <div className="ocs-pagination">
//           {Array.from({ length: totalPages }, (_, i) => (
//             <button
//               key={i}
//               className={`ocs-page-button ${i + 1 === currentPage ? 'active' : ''}`}
//               onClick={() => setCurrentPage(i + 1)}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export default OCSLogPage



//--------------------기존 코드----------------------------
// // OCSLogPage.jsx 파일 (전체 코드, 주석 없이)

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './OCSLogPage.css';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '');

// const OCSLogPage = () => {
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [patientQuery, setPatientQuery] = useState('');
//   const [doctorQuery, setDoctorQuery] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [error, setError] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [patientMappings, setPatientMappings] = useState({});
//   const [doctorMappings, setDoctorMappings] = useState({});
//   const logsPerPage = 10;

//   // 1️⃣ 기존 로그 가져오는 useEffect (그대로 둠)
//   useEffect(() => {
//     const fetchLogs = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/logs/combined/`);
//         setLogs(res.data);
//         setFilteredLogs(res.data);
//         setError('');
//       } catch (err) { 
//         console.error("❌ 오류 발생:", err); 
//         setError('로그 데이터를 불러오는데 실패했습니다.');
//       }
//     };
//     fetchLogs();
//   }, []);

//   // 2️⃣ 새로운 환자 이름 매핑용 useEffect (추가!)
//   useEffect(() => {
//     const fetchPatients = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/integration/openmrs/patients/`);
//         const mapping = {};
//         res.data.forEach((p) => {
//           mapping[p.uuid] = {
//             id: p.identifier,
//             name: p.display,
//           };
//         });
//         setPatientMappings(mapping);
//       } catch (err) {
//         console.error("❌ 환자 매핑 실패:", err);
//       }
//     };
//     fetchPatients();
//   }, []);

//   // 3️⃣ 의사 정보 받아오는 useEffect 추가
//   useEffect(() => {
//     const fetchDoctors = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/integration/openmrs/providers/`);
//         const mapping = {};
//         res.data.results?.forEach((d) => {
//           if (d.uuid && d.display) { // .toLowerCase().includes("doctor")) { // 의사만 필터링
//             mapping[d.uuid] = d.display;
//           }
//         });
//         setDoctorMappings(mapping);
//       } catch (err) {
//         console.error("❌ 의사 매핑 실패:", err);
//       }
//     };
//     fetchDoctors();
//   }, []);


//   const handleSearch = () => {
//     const filtered = logs.filter((log) => {
//       const patientMatch = patientQuery
//         ? (
//             (log.patient_id?.toLowerCase().includes(patientQuery.toLowerCase())) ||
//             (patientMappings[log.patient_id]?.name?.toLowerCase().includes(patientQuery.toLowerCase()))
//           )
//         : true;

//       const doctorMatch = doctorQuery
//         ? (
//             (log.doctor_id?.toLowerCase().includes(doctorQuery.toLowerCase())) ||
//             (log.doctor_name?.toLowerCase().includes(doctorQuery.toLowerCase())) ||
//             (doctorMappings[log.doctor_id]?.toLowerCase().includes(doctorQuery.toLowerCase()))
//           )
//         : true;

//       const dateMatch = (() => {
//         if (!startDate && !endDate) return true;

//         // 'request_and_return_time' 필드에서 첫 번째 시간 (오더한 시간)을 기준으로 필터링
//         const orderTimeStr = log.request_and_return_time?.split('\n')[0]; 
        
//         if (!orderTimeStr) return false;

//         const logDate = new Date(orderTimeStr);
        
//         const start = startDate ? new Date(startDate) : null;
//         const end = endDate ? new Date(endDate) : null;

//         return (!start || logDate >= start) && (!end || logDate <= end);
//       })();

//       return patientMatch && doctorMatch && dateMatch;
//     });
//     setFilteredLogs(filtered);
//     setCurrentPage(1);
//   };

//   const handleReset = () => {
//     setPatientQuery('');
//     setDoctorQuery('');
//     setStartDate('');
//     setEndDate('');
//     setFilteredLogs(logs);
//     setCurrentPage(1);
//   };

//   const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
//   const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

//   return (
//     <div className="ocs-body">
//       <h1 className="ocs-title">로그 조회</h1>

//       <div className="ocs-controls">
//         <input 
//           className="ocs-controls-input" 
//           placeholder="환자 ID 또는 이름" 
//           value={patientQuery} 
//           onChange={(e) => setPatientQuery(e.target.value)} />
//         <input 
//           className="ocs-controls-input" 
//           placeholder="의사 ID 또는 이름" 
//           value={doctorQuery} 
//           onChange={(e) => setDoctorQuery(e.target.value)} />
          
//         <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//         <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//         <button className="ocs-controls-button" onClick={handleSearch}>검색</button>
//         <button className="ocs-controls-button reset" onClick={handleReset}>초기화</button>
//       </div>

//       {error && <p className="ocs-error-message">{error}</p>}
//       {filteredLogs.length === 0 ? (
//         <p className="ocs-empty-message">저장된 로그가 없습니다.</p>
//       ) : (
//         <div className="ocs-table-container">
//           <table className="ocs-table">
//             <thead>
//               <tr>
//                 <th>NO</th>
//                 <th>환자</th>
//                 <th>의사</th>
//                 <th>요청 종류</th>
//                 <th>요청/결과</th> {/* 필드명 변경 */}
//                 <th>진단 상세</th> {/* 필드명 변경 */}
//                 <th>요청/결과 시간</th> {/* 필드명 변경 */}
//               </tr>
//             </thead>
//             <tbody>
//               {currentLogs.map((log, idx) => (
//                 <tr key={idx}>
//                   <td>{(currentPage - 1) * logsPerPage + idx + 1}</td>
//                   <td>{log.patient_id || '-'}{' '}{patientMappings[log.patient_id]?.name ? `(${patientMappings[log.patient_id].name})` : ''}</td>
//                   <td>{log.doctor_id || '-'}{' '}{doctorMappings[log.doctor_id] ? `(${doctorMappings[log.doctor_id]})` : ''}</td>
//                   <td>{log.request_type || '-'}</td>
//                   {/* 새로운 필드명과 스타일 적용 */}
//                   <td style={{ whiteSpace: 'pre-wrap' }}>{log.request_and_result || '-'}</td>
//                   {/* 새로운 필드명 */}
//                   <td style={{ whiteSpace: 'pre-wrap' }}>{log.diagnosis_detail || '-'}</td> 
//                   {/* 새로운 필드명과 스타일 적용 */}
//                   <td style={{ whiteSpace: 'pre-wrap' }}>{log.request_and_return_time || '-'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {totalPages > 1 && (
//         <div className="ocs-pagination">
//           {Array.from({ length: totalPages }, (_, i) => (
//             <button key={i} className={`ocs-page-button ${i + 1 === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default OCSLogPage;