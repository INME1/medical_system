// /home/medical_system/pacsapp/src/components/dashboard/WorkListPanel/WorkListTable.js

import React from 'react';

const WorkListTable = ({
  filteredWorklist,
  onDragStart,
  onDoubleClick

}) => {
  // 🔧 안전한 날짜 포맷팅 함수
  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    try {
      // 문자열인 경우에만 split 사용
      if (typeof dateTime === 'string' && dateTime.includes(' ')) {
        return dateTime.split(' ').slice(2).join(' ');
      }
      return dateTime;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  return (
    <div className="worklist-table-container">
      <table className="worklist-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>환자ID</th>
            <th>환자명</th>
            <th>검사부위</th>
            <th>모달리티</th>
            <th>요청의</th>
            <th>요청일시</th>
            <th>판독의</th>
            <th>검사일시</th>
            <th>검사상태</th>
            <th>리포트상태</th>
          </tr>
        </thead>
        <tbody>
          {filteredWorklist.map((exam, index) => {
            const isDraggable = exam.examStatus === '대기';
            
            return (
              <tr 
                key={exam.id}
                className={`worklist-row ${isDraggable ? 'draggable' : ''}`}
                draggable={isDraggable}
                onDragStart={() => onDragStart(exam)}
                onDoubleClick={() => onDoubleClick(exam)}
              >
                <td className="row-number">{index + 1}</td>
                <td className="patient-id">{exam.patientId || '-'}</td>
                <td className="patient-info">
                  <div className="patient-details">
                    <div className="patient-name">
                      {exam.patientName || '-'}
                    </div>
                    <div className="patient-meta">
                      {exam.birthDate || '-'} · {exam.gender || '-'}
                    </div>
                  </div>
                  {exam.priority === '응급' && (
                    <span className="priority-badge emergency">응급</span>
                  )}
                </td>
                <td className="exam-part">{exam.examPart || '-'}</td>
                <td>
                  <span className="modality-badge">
                    {exam.modality || '-'}
                  </span>
                </td>
                <td>{exam.requestDoctor || '-'}</td>
                <td className="datetime">
                  {formatDateTime(exam.requestDateTime)}
                </td>
                <td className="reporting-doctor">
                  {exam.reportingDoctor || '-'}
                </td>
                <td className="datetime">
                  {formatDateTime(exam.examDateTime)}
                </td>
                <td>
                  <span className={`status-badge exam-status-${exam.examStatus}`}>
                    {exam.examStatus || '-'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge report-status-${exam.reportStatus}`}>
                    {exam.reportStatus || '-'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WorkListTable;


