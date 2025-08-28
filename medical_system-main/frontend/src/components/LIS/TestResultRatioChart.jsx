// ✅ TestResultRatioChart.jsx - 검사 항목별 정상/이상 비율 stacked bar chart

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import './TestResultRatioChart.css';

const TestResultRatioChart = () => {
  const [ratioData, setRatioData] = useState({});
  const chartRef = useRef(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/stats/test_result_ratios/`)
      .then(res => setRatioData(res.data))
      .catch(err => console.error('📉 정상/이상 비율 로딩 실패:', err));
  }, []);

  useEffect(() => {
    if (!chartRef.current || Object.keys(ratioData).length === 0) return;

    const labels = Object.keys(ratioData);
    const normal = labels.map(k => ratioData[k]?.normal || 0);
    const abnormal = labels.map(k => ratioData[k]?.abnormal || 0);

    const chart = echarts.init(chartRef.current, null, { renderer: 'svg' });
    chart.setOption({
      color: ['#60A5FA', '#F87171'],
      title: {
        text: '🧮 검사 항목별 정상/이상 비율',
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: params => (
          params.map(p => `${p.seriesName}: ${p.data}건`).join('<br/>')
        )
      },
      legend: { bottom: 0 },
      grid: { top: 60, bottom: 50, left: 60, right: 30 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 0 }
      },
      yAxis: {
        type: 'value',
        name: '건수'
      },
      series: [
        {
          name: '정상',
          type: 'bar',
          stack: 'total',
          data: normal,
          label: { show: true, position: 'inside', formatter: val => `${val.value}` }
        },
        {
          name: '이상',
          type: 'bar',
          stack: 'total',
          data: abnormal,
          label: { show: true, position: 'inside', formatter: val => `${val.value}` }
        }
      ]
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [ratioData]);

  return (
    <div className="test-result-ratio-chart">
      <div ref={chartRef} className="echart-container" style={{ height: '400px' }} />
    </div>
  );
};

export default TestResultRatioChart;
