// src/components/EMR/HomePage.jsx
import React from 'react';
import { DashboardCards, ScheduleCalendar, UrgentWidget, QuickActions } from './home';
import NotificationBell from './NotificationBell';

import './HomePage.css';

const HomePage = () => (
  <>
    <header className="home-header">
      <h1>🏥 EMR 대시보드</h1>
      <NotificationBell />
    </header>
    <div className="home-grid">
      <DashboardCards withProgress withSparkline />
      <ScheduleCalendar enableDragDrop />
      <UrgentWidget marquee withTabs showActionButtons />
      <QuickActions />
    </div>
  </>
);

export default HomePage;
