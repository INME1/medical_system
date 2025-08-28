import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StatisticsBoard.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

// 백엔드 API 서비스 클래스
class DashboardAPI {
  static BASE_URL = process.env.REACT_APP_API_URL || 'http://35.225.63.41:8000/api/';
  
  // HTTP 요청 헬퍼 함수
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.BASE_URL}statisticsboard${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 주요 통계 데이터
  static async getMainStats() {
    return await this.request('/main-stats/');
  }

  // 환자 분포 데이터
  static async getPatientDistribution() {
    return await this.request('/patient-distribution/');
  }

  // 의사별 진료 데이터
  static async getDoctorStats(period = 'daily') {
    return await this.request(`/doctor-stats/?period=${period}`);
  }

  // 진료실별 진료 데이터
  static async getRoomStats() {
    return await this.request('/room-stats/');
  }

  // 검사/처방 데이터
  static async getExamStats() {
    return await this.request('/exam-stats/');
  }

  // AI 시스템 데이터
  static async getAIStats() {
    return await this.request('/ai-stats/');
  }

  // 모든 데이터 한번에 조회
  static async getAllDashboardData() {
    return await this.request('/all/');
  }
}

const StatisticsBoard = ({ 
  useBackendAPI = true,  // 백엔드 API 사용 여부
  initialData = null, 
  refreshInterval = 5 * 60 * 1000, // 5분
  onError = null 
}) => {
  const [dashboardData, setDashboardData] = useState({
    mainStats: initialData?.mainStats || null,
    patientDistribution: initialData?.patientDistribution || null,
    doctorStats: initialData?.doctorStats || null,
    roomStats: initialData?.roomStats || null,
    examStats: initialData?.examStats || null,
    aiStats: initialData?.aiStats || null
  });
  
  const [doctorPeriod, setDoctorPeriod] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // 백엔드 API 데이터 로드 함수
  const loadDataFromAPI = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      console.log('📡 백엔드 API에서 데이터 로드 시작...');
      
      // 모든 데이터를 한번에 로드 (성능 최적화)
      const allData = await DashboardAPI.getAllDashboardData();
      
      console.log('📊 받은 대시보드 데이터:', allData);
      
      setDashboardData({
        mainStats: allData.mainStats,
        patientDistribution: allData.patientDistribution,
        doctorStats: allData.doctorStats,
        roomStats: allData.roomStats,
        examStats: allData.examStats,
        aiStats: allData.aiStats
      });
      
      setLastUpdate(new Date());
      console.log('✅ 데이터 로드 완료');
      
    } catch (error) {
      console.error('❌ 백엔드 API 데이터 로드 실패:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 에러 발생 시 더미 데이터로 폴백
      loadDummyData();
      
      if (onError) onError(error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // 더미 데이터 로드 함수 (API 실패 시 폴백)
  const loadDummyData = () => {
    console.log('🔄 더미 데이터로 폴백...');
    
    setDashboardData({
      mainStats: {
        avgDailyVisitors: 247,
        avgDailyChange: 12.3,
        todayVisitors: 186,
        todayChange: -24.7,
        newPatients: 34,
        newPatientsChange: 8.2,
        returningPatients: 152,
        returningChange: 5.1,
        avgWaitTime: 23,
        waitTimeChange: 3,
        avgTreatmentTime: 12,
        treatmentTimeChange: -1.2
      },
      patientDistribution: {
        ageDistribution: [
          { name: '10-19', value: 15 },
          { name: '20-29', value: 32 },
          { name: '30-39', value: 45 },
          { name: '40-49', value: 67 },
          { name: '50-59', value: 89 },
          { name: '60-69', value: 76 },
          { name: '70+', value: 43 }
        ],
        genderDistribution: [
          { name: '남성', value: 45, color: '#3498db' },
          { name: '여성', value: 55, color: '#9b59b6' }
        ]
      },
      doctorStats: [
        { name: '김민수', value: 47 },
        { name: '이영희', value: 52 },
        { name: '박철수', value: 38 },
        { name: '정미영', value: 45 },
        { name: '최동현', value: 41 },
        { name: '서지혜', value: 35 }
      ],
      roomStats: [
        { name: '1진료실', value: 89 },
        { name: '2진료실', value: 67 },
        { name: '3진료실', value: 45 },
        { name: '4진료실', value: 52 },
        { name: '5진료실', value: 38 },
        { name: '6진료실', value: 29 }
      ],
      examStats: [
        { name: 'CT', value: 23 },
        { name: 'MRI', value: 15 },
        { name: '혈액검사', value: 87 },
        { name: 'X-ray', value: 56 },
        { name: '초음파', value: 34 },
        { name: '내시경', value: 12 },
        { name: '심전도', value: 45 }
      ],
      aiStats: {
        accuracy: 96.8,
        usageCount: 1247,
        processTime: 2.3,
        utilization: 89.5,
        performanceMetrics: [
          { subject: '진단 정확도', value: 96.8, fullMark: 100 },
          { subject: '처리 속도', value: 88.5, fullMark: 100 },
          { subject: '활용률', value: 89.5, fullMark: 100 },
          { subject: '만족도', value: 92.3, fullMark: 100 },
          { subject: '효율성', value: 91.7, fullMark: 100 }
        ]
      }
    });
    
    setLastUpdate(new Date());
  };

  // 데이터 로드 함수 (백엔드 API 또는 더미 데이터)
  const loadData = async (showLoading = true) => {
    if (useBackendAPI) {
      await loadDataFromAPI(showLoading);
    } else {
      loadDummyData();
    }
  };

  // 의사 탭 변경 처리
  const handleDoctorTabChange = async (period) => {
    setDoctorPeriod(period);
    
    if (useBackendAPI) {
      try {
        console.log(`🔄 의사별 통계 로드: ${period}`);
        const doctorStats = await DashboardAPI.getDoctorStats(period);
        setDashboardData(prev => ({ ...prev, doctorStats }));
        console.log('✅ 의사별 통계 업데이트 완료');
      } catch (error) {
        console.error('❌ 의사 데이터 로드 실패:', error);
        
        // 에러 시 더미 데이터 사용
        const dummyDoctorData = {
          daily: [
            { name: '김민수', value: 47 },
            { name: '이영희', value: 52 },
            { name: '박철수', value: 38 },
            { name: '정미영', value: 45 },
            { name: '최동현', value: 41 },
            { name: '서지혜', value: 35 }
          ],
          weekly: [
            { name: '김민수', value: 247 },
            { name: '이영희', value: 298 },
            { name: '박철수', value: 213 },
            { name: '정미영', value: 267 },
            { name: '최동현', value: 234 },
            { name: '서지혜', value: 198 }
          ],
          monthly: [
            { name: '김민수', value: 1047 },
            { name: '이영희', value: 1298 },
            { name: '박철수', value: 913 },
            { name: '정미영', value: 1167 },
            { name: '최동현', value: 1034 },
            { name: '서지혜', value: 898 }
          ]
        };
        
        setDashboardData(prev => ({ 
          ...prev, 
          doctorStats: dummyDoctorData[period] 
        }));
      }
    } else {
      // 더미 데이터에서 기간별 데이터 변경
      const dummyDoctorData = {
        daily: [
          { name: '김민수', value: 47 },
          { name: '이영희', value: 52 },
          { name: '박철수', value: 38 },
          { name: '정미영', value: 45 },
          { name: '최동현', value: 41 },
          { name: '서지혜', value: 35 }
        ],
        weekly: [
          { name: '김민수', value: 247 },
          { name: '이영희', value: 298 },
          { name: '박철수', value: 213 },
          { name: '정미영', value: 267 },
          { name: '최동현', value: 234 },
          { name: '서지혜', value: 198 }
        ],
        monthly: [
          { name: '김민수', value: 1047 },
          { name: '이영희', value: 1298 },
          { name: '박철수', value: 913 },
          { name: '정미영', value: 1167 },
          { name: '최동현', value: 1034 },
          { name: '서지혜', value: 898 }
        ]
      };
      
      setDashboardData(prev => ({ 
        ...prev, 
        doctorStats: dummyDoctorData[period] 
      }));
    }
  };

  // 컴포넌트 마운트 시 초기 로드
  useEffect(() => {
    console.log('🚀 StatisticsBoard 컴포넌트 마운트');
    console.log('⚙️ 설정:', { useBackendAPI, refreshInterval });
    
    if (!initialData || Object.keys(initialData).length === 0) {
      loadData();
    }
  }, [useBackendAPI]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (refreshInterval > 0) {
      console.log(`⏰ 자동 새로고침 설정: ${refreshInterval / 1000}초마다`);
      const interval = setInterval(() => {
        console.log('🔄 자동 새로고침 실행');
        loadData(false);
      }, refreshInterval);
      
      return () => {
        console.log('⏰ 자동 새로고침 정리');
        clearInterval(interval);
      };
    }
  }, [refreshInterval, useBackendAPI]);

  // 변화율 표시 컴포넌트
  const ChangeIndicator = ({ value }) => {
    if (value === null || value === undefined) return null;
    
    return (
      <div className={`stat-change ${value > 0 ? 'positive' : 'negative'}`}>
        <span>{value > 0 ? '↗' : '↘'}</span>
        {value > 0 ? '+' : ''}{value}%
      </div>
    );
  };

  // 통계 카드 컴포넌트
  const StatCard = ({ title, value, change, unit = '' }) => (
    <div className="stat-card">
      <h3>{title}</h3>
      <div className="stat-value">
        {value !== null && value !== undefined ? `${value}${unit}` : '-'}
      </div>
      <ChangeIndicator value={change} />
    </div>
  );

  // AI 메트릭 컴포넌트
  const AIMetric = ({ value, label, progress }) => (
    <div className="ai-metric">
      <div className="value">{value || '-'}</div>
      <div className="label">{label}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress || 0}%` }} />
      </div>
    </div>
  );

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{label}</p>
          <p style={{ margin: 0, color: '#3498db' }}>
            진료 건수: <span style={{ fontWeight: 'bold' }}>{payload[0].value}건</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // 로딩 상태 렌더링
  if (isLoading && !dashboardData.mainStats) {
    return (
      <div className="loading">
        <div className="spinner" />
        데이터를 불러오는 중...
      </div>
    );
  }

  // 에러 상태 렌더링 (데이터가 전혀 없을 때만)
  if (error && !dashboardData.mainStats) {
    return (
      <div className="loading">
        <div style={{ color: '#e74c3c' }}>⚠️ {error}</div>
        <button onClick={() => loadData()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
      background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)', 
      minHeight: '100vh' 
    }}>
      {/* 헤더 */}
      <div className="header">
        <div className="header-left">
          <h1>📊 EMR 통계 대시보드</h1>
          <div className="subtitle">
            마지막 업데이트: {lastUpdate ? lastUpdate.toLocaleString() : '데이터 없음'}
            {useBackendAPI && (
              <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#27ae60' }}>
                🟢 실시간 연동
              </span>
            )}
            {!useBackendAPI && (
              <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#f39c12' }}>
                🟡 데모 모드
              </span>
            )}
          </div>
        </div>
        <div className="header-right">
          <button 
            className="refresh-btn" 
            onClick={() => loadData()}
            disabled={isLoading}
            title={useBackendAPI ? "백엔드 API에서 새로고침" : "더미 데이터 새로고침"}
          >
            {isLoading ? <div className="spinner" /> : '🔄'} 새로고침
          </button>
        </div>
      </div>

      <div style={{ height: '5rem' }} />
      <div className="container">
        <div className="dashboard-layout">
          {/* 왼쪽 패널: 주요 지표 */}
          <div className="left-panel">
            <div className="stats-column">
              <StatCard
                title="평균 일일 방문자"
                value={dashboardData.mainStats?.avgDailyVisitors}
                change={dashboardData.mainStats?.avgDailyChange}
              />
              <StatCard
                title="오늘 방문자"
                value={dashboardData.mainStats?.todayVisitors}
                change={dashboardData.mainStats?.todayChange}
              />
              <StatCard
                title="신규 환자"
                value={dashboardData.mainStats?.newPatients}
                change={dashboardData.mainStats?.newPatientsChange}
              />
              <StatCard
                title="재진 환자"
                value={dashboardData.mainStats?.returningPatients}
                change={dashboardData.mainStats?.returningChange}
              />
              <StatCard
                title="평균 대기시간"
                value={dashboardData.mainStats?.avgWaitTime}
                change={dashboardData.mainStats?.waitTimeChange}
                unit="분"
              />
              <StatCard
                title="평균 진료시간"
                value={dashboardData.mainStats?.avgTreatmentTime}
                change={dashboardData.mainStats?.treatmentTimeChange}
                unit="분"
              />
            </div>
          </div>

          {/* 오른쪽 패널: 차트들 */}
          <div className="right-panel">
            {/* 상단 차트 영역 */}
            <div className="top-charts">
              {/* 환자 분포 */}
              <div className="chart-container">
                <div className="chart-title">
                  <span className="icon">👥</span>
                  환자 연령/성별 분포
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '280px' }}>
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', color: '#7f8c8d', fontSize: '0.9rem' }}>연령별 분포</h4>
                    {dashboardData.patientDistribution?.ageDistribution ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dashboardData.patientDistribution.ageDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3498db" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="loading">데이터 없음</div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', color: '#7f8c8d', fontSize: '0.9rem' }}>성별 분포</h4>
                    {dashboardData.patientDistribution?.genderDistribution ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={dashboardData.patientDistribution.genderDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                          >
                            {dashboardData.patientDistribution.genderDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#3498db'} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value}명`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="loading">데이터 없음</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 의사별 진료 건수 */}
              <div className="chart-container">
                <div className="chart-title">
                  <span className="icon">👨‍⚕️</span>
                  의사별 진료 현황
                </div>
                <div className="tabs">
                  {['daily', 'weekly', 'monthly'].map(period => (
                    <div
                      key={period}
                      className={`tab ${doctorPeriod === period ? 'active' : ''}`}
                      onClick={() => handleDoctorTabChange(period)}
                    >
                      {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'}
                    </div>
                  ))}
                </div>
                {dashboardData.doctorStats ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboardData.doctorStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3498db" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="loading">데이터 없음</div>
                )}
              </div>
            </div>

            {/* 하단 차트 영역 */}
            <div className="bottom-charts">
              {/* 진료실별 + 검사 현황 */}
              <div>
                {/* 진료실별 진료 건수 - 세로형 바 차트로 변경 */}
                <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
                  <div className="chart-title">
                    <span className="icon">🏥</span>
                    진료실별 진료 건수
                  </div>
                  
                  <div style={{ width: '100%', height: '280px', padding: '10px' }}>
                    <BarChart
                      width={750}
                      height={260}
                      data={[
                        { name: '1진료실', value: 89 },
                        { name: '2진료실', value: 67 },
                        { name: '3진료실', value: 45 },
                        { name: '4진료실', value: 52 },
                        { name: '5진료실', value: 38 },
                        { name: '6진료실', value: 29 }
                      ]}
                      margin={{ top: 20, right: 50, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                        axisLine={true}
                        tickLine={true}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        domain={[0, 100]}
                        tickCount={6}
                        tickFormatter={(value) => `${value}건`}
                        axisLine={true}
                        tickLine={true}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}건`, '진료 건수']}
                        labelStyle={{ color: '#333', fontWeight: 'bold' }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3498db" 
                        radius={[6, 6, 0, 0]}
                        stroke="#2980b9"
                        strokeWidth={1}
                        minPointSize={2}
                        maxBarSize={5}
                      />
                    </BarChart>
                  </div>
                  
                  {/* 통계 요약 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '10px',
                    marginTop: '15px',
                    fontSize: '12px'
                  }}>
                    <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', color: '#3498db' }}>총 진료</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>320건</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', color: '#27ae60' }}>평균</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>53건</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>최고</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>1진료실</div>
                    </div>
                  </div>
                </div>

                {/* 검사/처방 현황 */}
                <div className="chart-container">
                  <div className="chart-title">
                    <span className="icon">🔬</span>
                    검사 및 처방 현황
                  </div>
                  {dashboardData.examStats ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={dashboardData.examStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3498db" 
                          strokeWidth={3}
                          dot={{ fill: '#3498db', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="loading">데이터 없음</div>
                  )}
                </div>
              </div>

              {/* AI 시스템 분석 */}
              <div className="chart-container">
                <div className="section-title">
                  <span className="icon">🤖</span>
                  AI 시스템 현황
                </div>
                
                <div className="ai-metrics">
                  <AIMetric
                    value={dashboardData.aiStats?.accuracy ? `${dashboardData.aiStats.accuracy}%` : '-'}
                    label="AI 진단 정확도"
                    progress={dashboardData.aiStats?.accuracy || 0}
                  />
                  <AIMetric
                    value={dashboardData.aiStats?.usageCount ? dashboardData.aiStats.usageCount.toLocaleString() : '-'}
                    label="AI 분석 건수"
                    progress={78} // 상대적 진행률
                  />
                  <AIMetric
                    value={dashboardData.aiStats?.processTime ? `${dashboardData.aiStats.processTime}초` : '-'}
                    label="평균 분석 시간"
                    progress={85} // 성능 지표
                  />
                  <AIMetric
                    value={dashboardData.aiStats?.utilization ? `${dashboardData.aiStats.utilization}%` : '-'}
                    label="시스템 활용률"
                    progress={dashboardData.aiStats?.utilization || 0}
                  />
                </div>
                
                {dashboardData.aiStats?.performanceMetrics ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={dashboardData.aiStats.performanceMetrics}>
                      <PolarGrid stroke="rgba(0,0,0,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Radar
                        name="AI 성능"
                        dataKey="value"
                        stroke="#9b59b6"
                        fill="rgba(155, 89, 182, 0.2)"
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="loading">데이터 없음</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsBoard;