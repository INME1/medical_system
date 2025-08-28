// ✅ TestCountChart.jsx - 검사 항목별 검사 수 막대 차트 컴포넌트

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import './TestCountChart.css';

const TestCountChart = () => {
  const [testCounts, setTestCounts] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/stats/test_counts/`)
      .then(res => setTestCounts(res.data))
      .catch(err => console.error('📉 검사 건수 로딩 실패:', err));
  }, []);

  useEffect(() => {
    if (!chartRef.current || testCounts.length === 0) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'svg' });
    const labels = testCounts.map(d => d.test_type);
    const values = testCounts.map(d => d.count);

    chart.setOption({
      color: ['#60A5FA'],
      title: {
        text: '📦 검사 항목별 검사 수',
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      textStyle: {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 13,
        color: '#1f2937'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937' },
        formatter: ({ 0: item }) => `${item.name}: ${item.data}건`
      },
      grid: { top: 40, bottom: 40, left: 60, right: 30 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 0 }
      },
      yAxis: {
        type: 'value',
        name: '건수'
      },
      series: [{
        type: 'bar',
        data: values,
        label: {
          show: true,
          position: 'top',
          formatter: val => `${val.value}건`
        }
      }]
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [testCounts]);

  return (
    <div className="test-count-chart">
      <div ref={chartRef} className="echart-container" style={{ height: '400px' }} />
    </div>
  );
};

export default TestCountChart;
