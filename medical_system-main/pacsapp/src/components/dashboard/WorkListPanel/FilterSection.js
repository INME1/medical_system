// // E:\250619\radiology-system\frontend\src\components\dashboard\WorkListPanel\FilterSection.js

// import React from 'react';

// const FilterSection = ({
//   filters,
//   onFilterChange,
//   onClearFilters,
//   filteredCount,
//   selectedDate,      // 🆕 추가
//   onDateChange      // 🆕 추가
// }) => {
//   // 오늘 날짜를 기본값으로
//   const today = new Date().toISOString().split('T')[0];

//   return (
//     <div className="filter-section">
//       <h3>검사 필터</h3>
      
//       {/* 🆕 날짜 선택 영역 */}
//       <div className="date-filter-row">
//         <div className="date-picker-container">
//           <span className="calendar-icon">📅</span>
//           <input
//             type="date"
//             value={selectedDate || today}
//             onChange={(e) => onDateChange(e.target.value)}
//             className="date-input"
//           />
//           <span className="date-label">검사 필터</span>
//         </div>
        
//         <button 
//           onClick={onClearFilters}
//           className="clear-filters-btn"
//         >
//           필터 초기화
//         </button>
//       </div>
      
//       <div className="filter-grid-top">
//         <input
//           type="text"
//           placeholder="환자 ID"
//           value={filters.patientId}
//           onChange={(e) => onFilterChange('patientId', e.target.value)}
//           className="filter-input"
//         />
//         <input
//           type="text"
//           placeholder="환자명"
//           value={filters.patientName}
//           onChange={(e) => onFilterChange('patientName', e.target.value)}
//           className="filter-input"
//         />
//         <select
//           value={filters.modality}
//           onChange={(e) => onFilterChange('modality', e.target.value)}
//           className="filter-select"
//         >
//           <option value="">모든 모달리티</option>
//           <option value="CR">CR (X-ray)</option>
//           <option value="CT">CT</option>
//           <option value="MR">MR (MRI)</option>
//           <option value="US">US (초음파)</option>
//           <option value="NM">NM</option>
//           <option value="PT">PT</option>
//           <option value="DX">DX</option>
//           <option value="XA">XA</option>
//           <option value="MG">MG</option>
//         </select>
//       </div>
      
//       <div className="filter-grid-bottom">
//         <select
//           value={filters.examStatus}
//           onChange={(e) => onFilterChange('examStatus', e.target.value)}
//           className="filter-select"
//         >
//           <option value="">모든 검사 상태</option>
//           <option value="대기">대기</option>
//           <option value="검사대기">검사대기</option>
//           <option value="검사중">검사중</option>
//           <option value="검사완료">검사완료</option>
//           <option value="취소">취소</option>
//         </select>
//         <select
//           value={filters.reportStatus}
//           onChange={(e) => onFilterChange('reportStatus', e.target.value)}
//           className="filter-select"
//         >
//           <option value="">모든 리포트 상태</option>
//           <option value="대기">대기</option>
//           <option value="작성중">작성중</option>
//           <option value="작성완료">작성완료</option>
//         </select>
//       </div>
      
//       <div className="filter-result">
//         총 {filteredCount}건 검색됨
//       </div>
//     </div>
//   );
// };

// export default FilterSection;

// E:\250619\radiology-system\frontend\src\components\dashboard\WorkListPanel\FilterSection.js
// 날짜 변경 기능 수정 버전

import React, { useMemo } from 'react';

const FilterSection = ({
  filters,
  onFilterChange,
  onClearFilters,
  filteredCount,
  selectedDate,
  onDateChange,
  worklist = []  // ✅ 전체 워크리스트 데이터를 props로 받기
}) => {
  // ✅ 날짜 변경 핸들러
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    console.log('📅 FilterSection 날짜 변경:', newDate);
    
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      console.error('❌ onDateChange 핸들러가 없습니다!');
    }
  };

  // ✅ 실제 데이터에서 의사 목록 추출
  const doctorOptions = useMemo(() => {
    const requestDoctors = new Set();
    const reportingDoctors = new Set();
    const examParts = new Set();
    const modalities = new Set();

    worklist.forEach(exam => {
      // 요청의 추출
      if (exam.requestDoctor && exam.requestDoctor !== '-') {
        requestDoctors.add(exam.requestDoctor);
      }
      
      // 판독의 추출
      if (exam.reportingDoctor && exam.reportingDoctor !== '-' && exam.reportingDoctor !== null) {
        reportingDoctors.add(exam.reportingDoctor);
      }
      
      // 검사부위 추출
      if (exam.examPart && exam.examPart !== '-') {
        examParts.add(exam.examPart);
      }
      
      // 모달리티 추출
      if (exam.modality && exam.modality !== '-') {
        modalities.add(exam.modality);
      }
    });

    return {
      requestDoctors: Array.from(requestDoctors).sort(),
      reportingDoctors: Array.from(reportingDoctors).sort(),
      examParts: Array.from(examParts).sort(),
      modalities: Array.from(modalities).sort()
    };
  }, [worklist]);

  // ✅ 오늘 날짜를 기본값으로
  const today = new Date().toISOString().split('T')[0];
  const currentDate = selectedDate || today;

  return (
    <div className="filter-section">
      <h3>검사 필터</h3>
      
      {/* ✅ 날짜 선택 영역 */}
      <div className="date-filter-row">
        <div className="date-picker-container">
          <span className="calendar-icon">📅</span>
          <input
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            className="date-input"
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
          <span className="date-label">검사 날짜</span>
        </div>
        
        <button 
          onClick={onClearFilters}
          className="clear-filters-btn"
          style={{
            padding: '0.5rem 1rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          필터 초기화
        </button>
      </div>
      
      {/* ✅ 첫 번째 행: 환자 정보 */}
      <div className="filter-grid-row1" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <input
          type="text"
          placeholder="환자 ID"
          value={filters.patientId}
          onChange={(e) => onFilterChange('patientId', e.target.value)}
          className="filter-input"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        />
        <input
          type="text"
          placeholder="환자명"
          value={filters.patientName}
          onChange={(e) => onFilterChange('patientName', e.target.value)}
          className="filter-input"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        />
        <select
          value={filters.modality}
          onChange={(e) => onFilterChange('modality', e.target.value)}
          className="filter-select"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">모든 모달리티</option>
          {doctorOptions.modalities.map(modality => (
            <option key={modality} value={modality}>{modality}</option>
          ))}
        </select>
      </div>
      
      {/* ✅ 두 번째 행: 검사 부위 + 의사 정보 (드롭다운) */}
      <div className="filter-grid-row2" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <select
          value={filters.examPart}
          onChange={(e) => onFilterChange('examPart', e.target.value)}
          className="filter-select"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">모든 검사 부위</option>
          {doctorOptions.examParts.map(part => (
            <option key={part} value={part}>{part}</option>
          ))}
        </select>
        
        <select
          value={filters.requestDoctor}
          onChange={(e) => onFilterChange('requestDoctor', e.target.value)}
          className="filter-select"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">모든 요청의</option>
          {doctorOptions.requestDoctors.map(doctor => (
            <option key={doctor} value={doctor}>{doctor}</option>
          ))}
        </select>
        
        <select
          value={filters.reportingDoctor}
          onChange={(e) => onFilterChange('reportingDoctor', e.target.value)}
          className="filter-select"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">모든 판독의</option>
          {doctorOptions.reportingDoctors.map(doctor => (
            <option key={doctor} value={doctor}>{doctor}</option>
          ))}
        </select>
      </div>
      
      {/* ✅ 세 번째 행: 상태 정보 */}
      <div className="filter-grid-row3" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <select
          value={filters.examStatus}
          onChange={(e) => onFilterChange('examStatus', e.target.value)}
          className="filter-select"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">모든 검사 상태</option>
          <option value="대기">대기</option>
          <option value="검사대기">검사대기</option>
          <option value="검사중">검사중</option>
          <option value="검사완료">검사완료</option>
          <option value="취소">취소</option>
        </select>
        <select
          value={filters.reportStatus}
          onChange={(e) => onFilterChange('reportStatus', e.target.value)}
          className="filter-select"
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="">모든 리포트 상태</option>
          <option value="대기">대기</option>
          <option value="작성중">작성중</option>
          <option value="작성완료">작성완료</option>
        </select>
      </div>
      
      {/* ✅ 결과 표시 */}
      <div className="filter-result" style={{
        padding: '0.5rem',
        background: '#f3f4f6',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        color: '#374151',
        textAlign: 'center'
      }}>
        📊 총 <strong>{filteredCount}건</strong> 검색됨
        {selectedDate && (
          <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
            (📅 {selectedDate})
          </span>
        )}
        
        {/* ✅ 개발용 디버그 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            요청의: {doctorOptions.requestDoctors.length}명 | 
            판독의: {doctorOptions.reportingDoctors.length}명 | 
            검사부위: {doctorOptions.examParts.length}개
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;