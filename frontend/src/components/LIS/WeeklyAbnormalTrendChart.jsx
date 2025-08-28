// WeeklyAbnormalTrendChart.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import './WeeklyAbnormalTrendChart.css';

const WeeklyAbnormalTrendChart = () => {
  const chartRef = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/stats/weekly_abnormal_trend/`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error('📉 주간 이상 건수 로딩 실패:', err);
      });
  }, []);

  useEffect(() => {
    if (!data.length || !chartRef.current) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'svg' });

    chart.setOption({
      title: { text: '주간 이상 판정 건수 추이', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.map(d => d.week),
        axisLabel: { rotate: 0 }
      },
      yAxis: {
        type: 'value',
        name: '건수'
      },
      series: [{
        name: '이상 건수',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map(d => d.abnormal_count),
        lineStyle: { color: '#A78BFA', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#DDD6FE' },
            { offset: 1, color: '#FFFFFF' }
          ])
        }
      }]
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <div className="weekly-abnormal-chart">
      <div ref={chartRef} className="echart-container" />
    </div>
  );
};

export default WeeklyAbnormalTrendChart;
