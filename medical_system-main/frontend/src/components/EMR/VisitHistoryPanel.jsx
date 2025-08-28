// frontend/src/components/EMR/VisitHistoryPanel.jsx
// 🔥 내원이력 패널 - 카드 겹침 해결 및 버튼 조회 방식

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  MapPin, 
  Clock,
  FileText,
  Activity,
  Search,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const VisitHistoryPanel = ({ patient }) => {
  const [visitHistory, setVisitHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const API_BASE = process.env.REACT_APP_INTEGRATION_API;

  // 내원이력 조회 함수 - 버튼 클릭 시에만 실행
  const fetchVisitHistory = async () => {
    if (!patient?.patient_identifier && !patient?.uuid) {
      setError('환자 식별자가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const patientId = patient.patient_identifier || patient.uuid;
      const response = await fetch(`${API_BASE}openmrs/visits/${patientId}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.visits)) {
        setVisitHistory(data.visits);
        setHasSearched(true);
      } else {
        throw new Error(data.message || '내원이력 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('내원이력 조회 실패:', err);
      setError(err.message);
      setVisitHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 환자 변경 시 상태 초기화
  useEffect(() => {
    setVisitHistory([]);
    setError(null);
    setHasSearched(false);
  }, [patient]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // 방문 유형 한글화
  const getVisitTypeKorean = (visitType) => {
    const typeMap = {
      'OUTPATIENT': '외래',
      'INPATIENT': '입원',
      'EMERGENCY': '응급',
      'CONSULTATION': '상담'
    };
    return typeMap[visitType] || visitType || '일반';
  };

  if (!patient) {
    return (
      <div className="visit-history-panel">
        <div className="empty-state">
          <AlertCircle size={24} />
          <span>환자를 선택해 주세요.</span>
        </div>
      </div>
    );
  }

  const patientName = patient?.name || patient?.display || patient?.patient_name || '알 수 없는 환자';

  return (
    <div className="visit-history-panel">
      <style jsx>{`
        .visit-history-panel {
          background: white;
          border-radius: 8px;
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .panel-header {
          background: #f8f9fa;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .patient-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .search-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .search-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .search-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .panel-content {
          flex: 1;
          overflow: hidden;
          height: calc(100% - 70px);
        }

        .initial-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          color: #6b7280;
          text-align: center;
          padding: 2rem;
        }

        .initial-icon {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #3b82f6;
          gap: 1rem;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #dc2626;
          text-align: center;
          padding: 2rem;
          gap: 1rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        .no-visits {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          color: #6b7280;
          text-align: center;
          padding: 2rem;
        }

        .visit-list {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow-y: auto;
          height: calc(100% - 40px);
        }

        .visit-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .visit-item:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .visit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .visit-date {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .visit-type {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .visit-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .visit-summary {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e5e7eb;
        }

        .summary-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .summary-content {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #6b7280;
          text-align: center;
          height: 100%;
        }

        .results-header {
          background: #f0f9ff;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e0e7ff;
          font-size: 0.8rem;
          color: #1e40af;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .results-count {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>

      {/* 헤더 */}
      <div className="panel-header">
        <div className="header-info">
          <User size={16} />
          <span className="patient-name">{patientName}</span>
        </div>
        <button
          className="search-button"
          onClick={fetchVisitHistory}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="loading-spinner" />
              조회 중...
            </>
          ) : (
            <>
              <Search size={14} />
              내원이력 조회
            </>
          )}
        </button>
      </div>

      {/* 내용 */}
      <div className="panel-content">
        {!hasSearched && !isLoading && (
          <div className="initial-state">
            <Calendar size={48} className="initial-icon" />
            <h4>내원이력을 조회합니다</h4>
            <p>'{patientName}'님의 과거 내원이력을<br />확인하려면 조회 버튼을 클릭하세요.</p>
          </div>
        )}

        {isLoading && (
          <div className="loading-state">
            <RefreshCw size={32} className="loading-spinner" />
            <span>내원이력을 조회하고 있습니다...</span>
          </div>
        )}

        {error && (
          <div className="error-state">
            <AlertCircle size={32} />
            <h4>조회 실패</h4>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchVisitHistory}>
              다시 시도
            </button>
          </div>
        )}

        {hasSearched && !isLoading && !error && visitHistory.length === 0 && (
          <div className="no-visits">
            <Calendar size={32} />
            <h4>내원이력이 없습니다</h4>
            <p>'{patientName}'님의 기록된 내원이력이 없습니다.</p>
          </div>
        )}

        {hasSearched && !isLoading && !error && visitHistory.length > 0 && (
          <>
            <div className="results-header">
              <div className="results-count">
                <Activity size={14} />
                총 {visitHistory.length}건의 내원이력
              </div>
            </div>
            <div className="visit-list">
              {visitHistory.map((visit, index) => (
                <div key={visit.uuid || index} className="visit-item">
                  <div className="visit-header">
                    <div className="visit-date">
                      <Calendar size={14} />
                      {formatDate(visit.startDatetime)}
                    </div>
                    <div className="visit-type">
                      {getVisitTypeKorean(visit.visitType?.name)}
                    </div>
                  </div>
                  
                  <div className="visit-details">
                    <div className="detail-item">
                      <MapPin size={12} />
                      <span>{visit.location?.name || '위치 정보 없음'}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={12} />
                      <span>
                        {visit.stopDatetime ? 
                          `종료: ${formatDate(visit.stopDatetime)}` : 
                          '진행 중'
                        }
                      </span>
                    </div>
                  </div>

                  {visit.encounters?.length > 0 && (
                    <div className="visit-summary">
                      <div className="summary-title">
                        <FileText size={12} />
                        진료 기록 ({visit.encounters.length}건)
                      </div>
                      <div className="summary-content">
                        {visit.encounters.slice(0, 2).map((encounter, idx) => (
                          <div key={idx}>
                            • {encounter.encounterType?.name || '일반 진료'} 
                            {encounter.encounterDatetime && 
                              ` (${formatDate(encounter.encounterDatetime)})`
                            }
                          </div>
                        ))}
                        {visit.encounters.length > 2 && (
                          <div>... 외 {visit.encounters.length - 2}건 더</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VisitHistoryPanel;