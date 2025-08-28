// ScheduleHeader.js

import React from 'react';

const ScheduleHeader = ({ radiologists }) => {
  return (
    <div className="schedule-header">
      <div className="schedule-info">
        <h2>검사실별 스케줄</h2>
        <p>대기중인 검사를 원하는 검사실 시간대로 드래그하세요</p>
      </div>
      <div className="radiologist-legend">
        <h3>담당의 색상</h3>
        <div className="legend-items">
          {radiologists.map(radiologist => (
            <div key={radiologist.id} className="legend-item">
              <div className={`legend-color ${radiologist.color}`}></div>
              <span>Dr. {radiologist.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;