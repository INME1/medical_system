// ✅ VariableImportanceChart.jsx with unified style (보라-푸른 테마 적용 + svg 렌더링)

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import './VariableImportanceChart.css';

const VariableImportanceChart = () => {
  const [importanceData, setImportanceData] = useState([]);
  const chartRef = useRef(null);

  const baseOption = {
    color: ['#A78BFA'],
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
      formatter: ({ 0: item }) => `중요도: ${item.data.toFixed(4)}`
    },
    grid: { top: 40, bottom: 40, left: 60, right: 30 }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/lft/importance/`)
      .then(res => setImportanceData(res.data))
      .catch(err => console.error("📉 변수 중요도 로딩 실패:", err));
  }, []);

  useEffect(() => {
    if (!chartRef.current || importanceData.length === 0) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'svg' });
    const labels = importanceData.map(d => d.feature);
    const values = importanceData.map(d => d.importance);

    chart.setOption({
      ...baseOption,
      title: {
        text: '📌 변수 중요도',
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 0 }
      },
      yAxis: {
        type: 'value',
        name: '중요도'
      },
      series: [{
        type: 'bar',
        data: values,
        itemStyle: {
          color: '#A78BFA'
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          formatter: val => val.value.toFixed(3)
        }
      }]
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [importanceData]);

  return (
    <div className="variable-importance-chart">
      <div ref={chartRef} className="echart-container" />
    </div>
  );
};

export default VariableImportanceChart;
