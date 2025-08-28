import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './LisHome.css';

export default function LisLayout() {
  const navigate = useNavigate();

  return (
    <div className="lis-dashboard-grid">

      {/* 좌측: 검사 일정 */}
      <aside className="lis-sidebar">
        <h3>검사 일정</h3>
        <ul className="lis-schedule-list">
          <li>🧪 10:30 혈액 검사 - 이나영</li>
          <li>🧪 14:00 간기능 검사 - 부승관</li>
        </ul>
      </aside>

      {/* 중앙 + 우측: 메뉴 + 콘텐츠 + 달력/상태 통합 */}
      <div className="lis-main-flex">
        <div className="lis-center">
          <div className="lis-menu-bar">
            <button onClick={() => navigate('/lis/orders')}>오더 목록</button>
            <button onClick={() => navigate('/lis/samples')}>샘플 목록</button>
            <button onClick={() => navigate('/lis/result-list')}>결과 목록</button>
            <button onClick={() => navigate('/lis/cdss/results')}>결과 시각화</button>
          </div>

          <main className="lis-main-content">
            <Outlet />
          </main>
        </div>

        <aside className="lis-rightbar compact">
          <div className="calendar-box">
            <h4>📅 달력</h4>
            <Calendar className="custom-calendar" 
            formatMonthYear={(locale, date) =>
              `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
            }/>
          </div>

        

          <div className="system-status">
            <h4>🔧 시스템 상태</h4>
            <ul>
              <li>🟢 LIS: 정상</li>
              <li>🟢 CDSS: 연결됨</li>
            </ul>
          </div>
        </aside>
      </div>

    </div>
  );
}
