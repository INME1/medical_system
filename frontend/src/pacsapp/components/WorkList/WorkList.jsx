

import React, { useState, useEffect } from 'react';

const WorkList = ({ onStudySelect }) => {
  const [workList, setWorkList] = useState([]);
  const [filteredWorkList, setFilteredWorkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    patientId: '',
    patientName: '',
    modality: '',
    bodyPart: '',
    requestingPhysician: '',
    studyStatus: '',
    reportStatus: ''
  });

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchWorkList();
  }, []);

  const fetchWorkList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/worklist/work-list/`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('받은 데이터:', result);
      
      // Django work_list 함수의 응답 구조에 맞게 처리
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        setWorkList(result.data);
        setFilteredWorkList(result.data);
      } else {
        console.error('예상과 다른 데이터 구조:', result);
        setWorkList([]);
        setFilteredWorkList([]);
      }
      
    } catch (err) {
      console.error('API 호출 에러:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // const fetchWorkList = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
      
  //     const response = await fetch(`${API_BASE_URL}/study-requests/`);
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  //     }
      
  //     const result = await response.json();
  //     console.log('받은 데이터:', result);
      
  //     setWorkList(result);
  //     setFilteredWorkList(result);
      
  //   } catch (err) {
  //     console.error('API 호출 에러:', err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // 필터 적용 함수
  const applyFilters = () => {
    let filtered = workList.filter(item => {
      return (
        (filters.patientId === '' || item.patient_id?.toLowerCase().includes(filters.patientId.toLowerCase())) &&
        (filters.patientName === '' || item.patient_name?.toLowerCase().includes(filters.patientName.toLowerCase())) &&
        (filters.modality === '' || item.modality === filters.modality) &&
        (filters.bodyPart === '' || item.body_part?.toLowerCase().includes(filters.bodyPart.toLowerCase())) &&
        (filters.requestingPhysician === '' || item.requesting_physician?.toLowerCase().includes(filters.requestingPhysician.toLowerCase())) &&
        (filters.studyStatus === '' || item.study_status === filters.studyStatus) &&
        (filters.reportStatus === '' || item.report_status === filters.reportStatus)
      );
    });
    setFilteredWorkList(filtered);
  };

  // 필터 초기화 함수
  const clearFilters = () => {
    setFilters({
      patientId: '',
      patientName: '',
      modality: '',
      bodyPart: '',
      requestingPhysician: '',
      studyStatus: '',
      reportStatus: ''
    });
    setFilteredWorkList(workList);
  };

  // 필터 변경 시 자동 적용
  useEffect(() => {
    applyFilters();
  }, [filters, workList]);

  // 고유 값들 추출 (드롭다운용)
  const uniqueModalities = [...new Set(workList.map(item => item.modality).filter(Boolean))];
  const uniqueBodyParts = [...new Set(workList.map(item => item.body_part).filter(Boolean))];
  const uniqueStatuses = [...new Set(workList.map(item => item.study_status).filter(Boolean))];
  const uniqueReportStatuses = [...new Set(workList.map(item => item.report_status).filter(Boolean))];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'requested': { text: '요청됨', color: '#3498db', bg: '#e3f2fd' },
      'scheduled': { text: '예약됨', color: '#f39c12', bg: '#fff3cd' },
      'in_progress': { text: '진행중', color: '#e67e22', bg: '#ffeaa7' },
      'completed': { text: '완료됨', color: '#27ae60', bg: '#d4edda' },
      'cancelled': { text: '취소됨', color: '#e74c3c', bg: '#f8d7da' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: '#6c757d', bg: '#f8f9fa' };
    
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: statusInfo.bg,
        color: statusInfo.color
      }}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6c757d' }}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>에러가 발생했습니다</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={fetchWorkList} 
          style={{
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* 헤더 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '28px', color: '#2c3e50' }}>
          검사 요청 목록 (Work List)
        </h2>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#6c757d' }}>
            총 {workList.length}건 중 {filteredWorkList.length}건 표시
          </p>
          <button 
            onClick={fetchWorkList} 
            style={{
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            🔄 새로고침
          </button>
        </div>

        {/* 통계 정보 */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                {workList.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>총 검사 요청</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                {filteredWorkList.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>현재 표시</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                {filteredWorkList.filter(item => item.study_status === 'requested').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>요청 상태</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                {filteredWorkList.filter(item => item.study_status === 'completed').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>완료 상태</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                {filteredWorkList.filter(item => !item.interpreting_physician).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>대기 중인 판독</div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '10px',
        border: '2px solid #e9ecef',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ 
          marginTop: '0', 
          marginBottom: '20px', 
          color: '#2c3e50',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🔍 검색 필터
        </h4>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              환자번호
            </label>
            <input
              type="text"
              value={filters.patientId}
              onChange={(e) => setFilters({...filters, patientId: e.target.value})}
              placeholder="환자번호 검색..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              환자명
            </label>
            <input
              type="text"
              value={filters.patientName}
              onChange={(e) => setFilters({...filters, patientName: e.target.value})}
              placeholder="환자명 검색..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              Modality
            </label>
            <select
              value={filters.modality}
              onChange={(e) => setFilters({...filters, modality: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">전체</option>
              {uniqueModalities.map(modality => (
                <option key={modality} value={modality}>{modality}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              검사부위
            </label>
            <input
              type="text"
              value={filters.bodyPart}
              onChange={(e) => setFilters({...filters, bodyPart: e.target.value})}
              placeholder="검사부위 검색..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              요청의사
            </label>
            <input
              type="text"
              value={filters.requestingPhysician}
              onChange={(e) => setFilters({...filters, requestingPhysician: e.target.value})}
              placeholder="요청의사 검색..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              검사상태
            </label>
            <select
              value={filters.studyStatus}
              onChange={(e) => setFilters({...filters, studyStatus: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">전체</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              리포트상태
            </label>
            <select
              value={filters.reportStatus}
              onChange={(e) => setFilters({...filters, reportStatus: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">전체</option>
              {uniqueReportStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            onClick={clearFilters}
            style={{
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            🗑️ 필터 초기화
          </button>
          <span style={{ 
            padding: '12px 20px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#495057',
            fontWeight: 'bold'
          }}>
            📊 검색 결과: {filteredWorkList.length}건
          </span>
        </div>
      </div>

      {/* 테이블 섹션 */}
      {filteredWorkList.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '10px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
          <p style={{ fontSize: '18px', color: '#6c757d', margin: 0 }}>
            {workList.length === 0 ? '등록된 검사 요청이 없습니다.' : '검색 조건에 맞는 검사 요청이 없습니다.'}
          </p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          borderRadius: '10px',
          border: '2px solid #dee2e6',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>ID</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>환자번호</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>환자명</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>생년월일</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>성별</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>검사부위</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>Modality</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>요청의사</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>요청일시</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>검사일시</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>판독의사</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>Study UID</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>Accession Number</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>검사상태</th>
                <th style={{ padding: '15px 10px', border: '1px solid #34495e', fontSize: '14px', fontWeight: 'bold' }}>리포트상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkList.map((item, index) => (
                <tr 
                  key={item.id}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#fff',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#fff'}
                  onClick={() => onStudySelect && onStudySelect(item.id)}
                  title="클릭하여 상세 정보 보기"
                >
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>{item.id}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>{item.patient_id}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>{item.patient_name}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{formatDate(item.birth_date)}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.sex === 'M' ? '남성' : item.sex === 'F' ? '여성' : item.sex}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.body_part}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>{item.modality}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.requesting_physician}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontSize: '12px' }}>{formatDateTime(item.request_datetime)}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontSize: '12px' }}>{formatDateTime(item.scheduled_exam_datetime)}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.interpreting_physician || '-'}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontSize: '10px', wordBreak: 'break-all' }}>{item.study_uid || '-'}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.accession_number || '-'}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{getStatusBadge(item.study_status)}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>{getStatusBadge(item.report_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkList;