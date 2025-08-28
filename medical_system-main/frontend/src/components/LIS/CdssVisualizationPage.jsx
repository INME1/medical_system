import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import './CdssVisualizationPage.css';
import ShapContributionChart from './ShapContributionChart';
import VariableImportanceChart from './VariableImportanceChart';
import SimulationPanel from './SimulationPanel';
import TestCountChart from './TestCountChart';
import TestResultRatioChart from './TestResultRatioChart';
import WeeklyAbnormalTrendChart from './WeeklyAbnormalTrendChart';

const CdssVisualizationPage = () => {
  const [sampleList, setSampleList] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [stats, setStats] = useState(null);
  const [sampleDetail, setSampleDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const donutRef = useRef();
  const barRef = useRef();
  const lineRef = useRef();

  const commonTheme = {
    color: ['#A78BFA', '#60A5FA', '#93C5FD'],
    textStyle: {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 13,
      color: '#1f2937'
    },
    tooltip: {
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' }
    },
    grid: { top: 40, bottom: 40, left: 60, right: 30 }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/`)
      .then(res => {
        const ids = [...new Set(res.data.map(r => r.sample))];
        setSampleList(ids);
      });

    // axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/lft/stats/`)
    //   .then(res => {
    //     setStats(res.data);
    //     setLoading(false);
    //   })
    //   .catch(err => {
    //     console.error('📉 통계 데이터 로딩 실패:', err);
    //     setLoading(false);
    //   });
  }, []);

  useEffect(() => {
    if (selectedSample) {
      axios.get(`${process.env.REACT_APP_API_BASE_URL}cdss/results/${selectedSample}/`)
        .then(res => setSampleDetail(res.data))
        .catch(err => {
          console.error('❌ 샘플 예측 결과 불러오기 실패:', err);
          setSampleDetail(null);
        });
    } else {
      setSampleDetail(null);
    }
  }, [selectedSample]);

  const renderChart = (ref, option) => {
    if (!ref?.current) return;
    const chart = echarts.init(ref.current, null, { renderer: 'svg' });
    chart.setOption({ ...commonTheme, ...option });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  };

  useEffect(() => {
    const cleanup = [];
    if (!stats) return;

    // 도넛: 정상/이상 비율
    cleanup.push(renderChart(donutRef, {
      title: { text: '정상/이상 비율', left: 'center' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: [
          { value: stats.normal, name: '정상' },
          { value: stats.abnormal, name: '이상' }
        ]
      }]
    }));

    // 평균값 막대
    if (stats.mean_values) {
      const labels = Object.keys(stats.mean_values);
      cleanup.push(renderChart(barRef, {
        title: { text: '정상 vs 이상 평균값', left: 'center' },
        legend: { bottom: 0 },
        xAxis: { type: 'category', data: labels },
        yAxis: { type: 'value' },
        series: [
          {
            name: '정상 평균',
            type: 'bar',
            data: labels.map(k => stats.mean_values[k].normal),
            itemStyle: { color: '#A5B4FC' }
          },
          {
            name: '이상 평균',
            type: 'bar',
            data: labels.map(k => stats.mean_values[k].abnormal),
            itemStyle: { color: '#818CF8' }
          }
        ]
      }));
    }

    // 주간 이상 건수
    if (stats.weekly_abnormal_trend) {
      cleanup.push(renderChart(lineRef, {
        title: { text: '주간 이상 건수 추세', left: 'center' },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: stats.weekly_abnormal_trend.map(d => d.week)
        },
        yAxis: { type: 'value' },
        series: [{
          name: '이상 건수',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#A78BFA', width: 3 },
          data: stats.weekly_abnormal_trend.map(d => d.abnormal_count),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#DDD6FE' },
              { offset: 1, color: '#FFFFFF' }
            ])
          }
        }]
      }));
    }

    return () => cleanup.forEach(fn => fn && fn());
  }, [stats]);

  return (
    <div className="cdss-page">
      <h1>🧾 검사 결과 시각화</h1>

      <div className="cdss-sample-selector">
        <label htmlFor="sample-select" className="cdss-label">샘플을 선택하세요:</label>
        <select
          id="sample-select"
          value={selectedSample}
          onChange={e => setSelectedSample(e.target.value)}
        >
          <option value=''>-- 샘플 선택 --</option>
          {sampleList.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      <div className="cdss-grid">
        <div className="cdss-card">
          <h2>🧬 샘플 결과 ({selectedSample || '선택 안 됨'})</h2>
          {sampleDetail ? (
            <>
              <span>{sampleDetail?.prediction === 1 ? "🔴 이상 소견" : "🟢 정상 소견"}</span>
              <SimulationPanel
                sampleId={selectedSample}
                testType={sampleDetail?.test_type}
                initialValues={sampleDetail?.results ? Object.fromEntries(sampleDetail.results.map(r => [r.component_name, parseFloat(r.value)])) : {}}
                statMax={stats?.mean_values ? Object.fromEntries(Object.entries(stats.mean_values).map(([k, v]) => [k, v.abnormal * 2 || 100])) : {}}
              />
              <ShapContributionChart shapData={sampleDetail?.shap_data} />
            </>
          ) : (
            <p className="cdss-loading">예측 결과, 시뮬레이션 등 다양한 시각화 예정</p>
          )}
        </div>

        <div className="cdss-card">
          <h2>📊 전체 시각화</h2>
          {/* <div className="cdss-chart-row">
            <div className="cdss-doughnut-wrapper" ref={donutRef}></div>
            <div className="cdss-line-chart" ref={lineRef} style={{ height: '360px' }}></div>
          </div>
          <div className="cdss-chart-full" ref={barRef} style={{ height: '400px' }}></div> */}
          <TestCountChart />
          <TestResultRatioChart />
          <WeeklyAbnormalTrendChart />
          {/* <VariableImportanceChart /> */}
        </div>
      </div>
    </div>
  );
};

export default CdssVisualizationPage;
