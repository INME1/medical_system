// ✅ SampleImportanceChart.jsx with unified style (푸른보라 테마 + svg 렌더링 + 선명도 향상)

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as echarts from 'echarts';
import './SampleImportanceChart.css';

const SampleImportanceChart = () => {
  const { sampleId } = useParams();
  const [data, setData] = useState(null);
  const chartRef = useRef(null);

  const baseOption = {
    color: ['#60A5FA', '#93C5FD'],
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
      formatter: ({ 0: item }) => `기여도: ${item.data.toFixed(4)}`
    },
    grid: { left: 80, right: 30, top: 40, bottom: 40 }
  };

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}cdss/lft/importance/sample/${sampleId}/`
        );
        setData(res.data);
      } catch (err) {
        console.error("❌ 기여도 데이터 불러오기 실패", err);
      }
    };
    fetchContributions();
  }, [sampleId]);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'svg' });
    const option = {
      ...baseOption,
      title: {
        text: `Sample ${sampleId} 변수 기여도`,
        left: 'center',
        textStyle: { fontSize: 16 }
      },
      xAxis: {
        type: 'value',
        name: '기여도'
      },
      yAxis: {
        type: 'category',
        data: data.features,
        inverse: true,
        axisLabel: { fontSize: 12 }
      },
      series: [
        {
          type: 'bar',
          data: data.contributions,
          itemStyle: {
            color: (params) => params.data >= 0 ? '#60A5FA' : '#A5B4FC'
          },
          label: {
            show: true,
            position: 'right',
            formatter: val => val.value.toFixed(3)
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.15)'
            }
          }
        }
      ]
    };

    chart.setOption(option);
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <div className="sample-importance-chart">
      {!data && <p>📊 기여도 데이터를 불러오는 중입니다...</p>}
      <div ref={chartRef} className="echart-container" />
    </div>
  );
};

export default SampleImportanceChart;
