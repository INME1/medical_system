// src/components/home/TodaySchedule.jsx

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './TodaySchedule.css';

const TodaySchedule = ({ refreshTrigger }) => {
  const [slots, setSlots] = useState([]);       // [{ time: '08:00', patients: [] }, …]
  const [loading, setLoading] = useState(true);
  const API = process.env.REACT_APP_INTEGRATION_API
    || 'http://35.225.63.41:8000/api/integration/';

  // 1) 08:00~18:00 30분 단위 슬롯 생성 (한 번만)
  useEffect(() => {
    const times = [];
    for (let h = 8; h <= 18; h++) {
      ['00','30'].forEach(mm => {
        const hh = h < 10 ? `0${h}` : '' + h;
        times.push(`${hh}:${mm}`);
      });
    }
    setSlots(times.map(t => ({ time: t, patients: [] })));
  }, []);

  // 2) 스케줄 fetch 함수
  const fetchSchedule = useCallback(async () => {
    if (!slots.length) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}identifier-waiting/`);
      const data = res.data;

      setSlots(prevSlots => {
        const arrivalsByTime = data.reduce((acc, p) => {
          const dt = new Date(p.created_at);
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = dt.getMinutes() < 30 ? '00' : '30';
          const key = `${hh}:${mm}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(p.display);
          return acc;
        }, {});

        return prevSlots.map(slot => {
          const newArrivals = arrivalsByTime[slot.time] || [];
          const uniqueNew = newArrivals.filter(name => !slot.patients.includes(name));
          return {
            ...slot,
            patients: [...slot.patients, ...uniqueNew]
          };
        });
      });
    } catch (err) {
      console.error('일정 불러오기 실패', err);
    } finally {
      setLoading(false);
    }
  }, [API, slots.length]);

  // 3) mount 시와 refreshTrigger 변경 시 스케줄 재조회
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule, refreshTrigger]);

  if (loading) return <p>일정 로딩 중…</p>;

  return (
    <div className="today-schedule">
      <h3 className="ts-header">📅 오늘 일정</h3>
      <div className="ts-grid">
        {slots.map(s => (
          <div key={s.time} className="ts-row">
            <div className="ts-time">{s.time}</div>
            <div className="ts-cell">
              {s.patients.map((name, i) => (
                <div key={i} className="ts-patient">
                  {name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodaySchedule;
