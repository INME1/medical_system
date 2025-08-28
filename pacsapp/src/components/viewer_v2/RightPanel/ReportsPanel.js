// /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/ReportsPanel.js

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Edit, Eye, Filter, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import './ReportsPanel.css';

const ReportsPanel = ({ 
  reports,
  showReportModal,
  setShowReportModal,
  currentStudyUID,
  patientInfo,
  onEditReport,
  onViewReport
}) => {
  const [reportList, setReportList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [isLoading, setIsLoading] = useState(false);
  
  const lastPatientIdRef = useRef(null);
  const loadingRef = useRef(false);

  // 🔥 reports 객체에서 데이터 가져오기
  useEffect(() => {
    if (reports && reports.reportList) {
      console.log('📋 ReportsPanel - 레포트 목록 업데이트:', reports.reportList.length);
      setReportList(reports.reportList);
    }
  }, [reports?.reportList]);

  // 🔥 환자 정보 변경 시 레포트 목록 새로고침 - 무한 루프 방지
  useEffect(() => {
    const currentPatientId = patientInfo?.patient_id;
    
    if (currentPatientId === lastPatientIdRef.current || 
        loadingRef.current || 
        !currentPatientId || 
        currentPatientId === 'Unknown') {
      return;
    }

    const loadReports = async () => {
      if (!reports?.loadReportList) return;

      console.log('📋 레포트 로드 시작:', currentPatientId);
      
      loadingRef.current = true;
      setIsLoading(true);
      
      try {
        await reports.loadReportList(currentPatientId);
        lastPatientIdRef.current = currentPatientId;
        console.log('✅ 레포트 로드 완료');
      } catch (error) {
        console.error('❌ 레포트 목록 로드 실패:', error);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(loadReports, 100);
    return () => clearTimeout(timeoutId);
  }, [patientInfo?.patient_id]);

  // 상태별 필터링
  const filteredReports = reportList.filter(report => {
    if (selectedFilter === '전체') return true;
    return report.report_status === selectedFilter;
  });

  const handleCreateNewReport = () => {
    console.log('🆕 새 레포트 작성 버튼 클릭됨');
    
    if (reports) {
      if (reports.setReportContent) reports.setReportContent('');
      if (reports.setReportStatus) reports.setReportStatus('draft');
      if (reports.setCurrentReport) reports.setCurrentReport(null);
    }
    
    if (setShowReportModal) {
      setShowReportModal(true);
    }
  };

  // 🚀 기존 레포트 편집 - 전체 내용 로드
  const handleEditReport = async (report) => {
    console.log('✏️ 레포트 수정:', report.id);
    
    // 🚀 전체 레포트 내용을 가져오기 위해 서버에서 다시 로드
    if (reports && reports.loadFullReport) {
      try {
        console.log('📋 전체 레포트 내용 로딩 중...');
        const fullReport = await reports.loadFullReport(report.id);
        
        if (reports.setReportContent) {
          // 🚀 Django 필드 우선순위: dr_report > content > report_preview
          const fullContent = fullReport.dr_report || fullReport.content || fullReport.report_preview || '';
          reports.setReportContent(fullContent);
          console.log('✅ 전체 레포트 내용 로드됨:', fullContent.length, '자');
        }
        if (reports.setReportStatus) {
          reports.setReportStatus(report.report_status || 'draft');
        }
        if (reports.setCurrentReport) {
          reports.setCurrentReport(fullReport || report);
        }
        
        console.log('✅ 전체 레포트 내용 로드 완료');
      } catch (error) {
        console.error('❌ 전체 레포트 로드 실패, preview 사용:', error);
        // 실패시 기존 preview 사용
        if (reports.setReportContent) {
          reports.setReportContent(report.report_preview || '');
        }
        if (reports.setReportStatus) {
          reports.setReportStatus(report.report_status || 'draft');
        }
        if (reports.setCurrentReport) {
          reports.setCurrentReport(report);
        }
        
        alert('전체 레포트 내용을 불러오는데 실패했습니다. 미리보기 내용으로 편집을 시작합니다.');
      }
    } else {
      // loadFullReport 함수가 없으면 기존 방식 사용
      console.log('⚠️ loadFullReport 함수 없음, preview 사용');
      if (reports.setReportContent) reports.setReportContent(report.report_preview || '');
      if (reports.setReportStatus) reports.setReportStatus(report.report_status || 'draft');
      if (reports.setCurrentReport) reports.setCurrentReport(report);
    }
    
    if (onEditReport) onEditReport(report);
    if (setShowReportModal) setShowReportModal(true);
  };

  // 🚀 레포트 보기 - 전체 내용 표시
  const handleViewReport = async (report) => {
    console.log('👁️ 레포트 전체 내용 보기:', report.id);
    
    if (onViewReport) {
      onViewReport(report);
    } else {
      // 🚀 전체 레포트 내용 가져오기
      if (reports && reports.loadFullReport) {
        try {
          console.log('📋 전체 레포트 내용 로딩 중...');
          const fullReport = await reports.loadFullReport(report.id);
          const fullContent = fullReport.dr_report || fullReport.content || fullReport.report_preview || '내용이 없습니다.';
          
          // 🚀 더 나은 레포트 보기 창
          const reportWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
          reportWindow.document.write(`
            <html>
              <head>
                <title>레포트 보기 - ${report.patient_id}</title>
                <style>
                  body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; line-height: 1.6; }
                  .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
                  .title { color: #1e40af; font-size: 24px; font-weight: bold; }
                  .meta { color: #666; font-size: 14px; margin-top: 5px; }
                  .content { background: #f8f9fa; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
                  .status { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; }
                  .draft { background: #fef3c7; color: #92400e; }
                  .completed { background: #dbeafe; color: #1e40af; }
                  .approved { background: #dcfce7; color: #166534; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="title">📋 ${report.patient_id} 레포트</div>
                  <div class="meta">
                    작성의: ${report.doctor_name || 'Unknown'} | 
                    작성일: ${new Date(report.created_at).toLocaleDateString('ko-KR')} |
                    <span class="status ${report.report_status}">${getStatusLabel(report.report_status)}</span>
                  </div>
                </div>
                <div class="content">${fullContent}</div>
                <script>
                  document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') window.close();
                  });
                </script>
              </body>
            </html>
          `);
          reportWindow.document.close();
          
        } catch (error) {
          console.error('❌ 전체 레포트 로드 실패, preview 사용:', error);
          alert(`레포트 내용 (미리보기):\n\n${report.report_preview || '내용이 없습니다.'}`);
        }
      } else {
        // loadFullReport 함수가 없으면 기존 preview 사용
        console.log('⚠️ loadFullReport 함수 없음, preview만 표시');
        alert(`레포트 내용 (미리보기):\n\n${report.report_preview || '내용이 없습니다.'}`);
      }
    }
  };

  // 🚀 레포트 삭제 핸들러 - 로딩 상태 관리 개선
  const handleDeleteReport = async (report) => {
    if (!window.confirm(`정말로 이 레포트를 삭제하시겠습니까?\n\n환자: ${report.patient_id}\n작성일: ${new Date(report.created_at).toLocaleDateString('ko-KR')}`)) {
      return;
    }

    if (!reports?.deleteReport) return;
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const result = await reports.deleteReport(report.study_uid);
      if (result?.success) {
        console.log('✅ 레포트 삭제 완료');
        if (reports.loadReportList && patientInfo?.patient_id) {
          await reports.loadReportList(patientInfo.patient_id);
        }
      } else {
        alert(`삭제 실패: ${result?.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('❌ 레포트 삭제 실패:', error);
      alert('레포트 삭제 중 오류가 발생했습니다.');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  // 상태 라벨 가져오기 함수 (전역으로 사용)
  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '초안';
      case 'completed': return '완료';
      case 'approved': return '승인';
      default: return status;
    }
  };

  return (
    <div className="mv-panel-content">
      {/* 환자 정보 헤더 */}
      <div className="reports-header">
        <h4 className="reports-title">
          📋 {patientInfo?.patient_name || 'Unknown'} ({patientInfo?.patient_id || 'Unknown'}) 레포트
        </h4>
        <div className="reports-subtitle">
          검사일: {patientInfo?.study_date || 'Unknown'}
        </div>
        
        <button 
          className="mv-new-report-btn"
          onClick={handleCreateNewReport}
          disabled={isLoading}
        >
          <Plus size={16} />
          새 리포트 작성
        </button>
      </div>

      {/* 상태별 필터 */}
      <div className="report-filters">
        {['전체', 'draft', 'completed', 'approved'].map(status => (
          <button
            key={status}
            className={`filter-btn ${selectedFilter === status ? 'active' : ''}`}
            onClick={() => setSelectedFilter(status)}
          >
            <Filter size={12} />
            {status === '전체' ? '전체' : 
             status === 'draft' ? '초안' :
             status === 'completed' ? '완료' : '승인'} 
            ({status === '전체' ? 
              reportList.length : 
              reportList.filter(r => r.report_status === status).length
            })
          </button>
        ))}
      </div>

      {/* 현재 Study 레포트 섹션 */}
      <div className="current-study-section">
        <h5 className="section-title">🔍 현재 Study 레포트</h5>
        {currentStudyUID ? (
          <div className="current-study-info">
            <div className="study-uid-info">
              <span className="study-label">Study UID:</span>
              <span className="study-uid">{currentStudyUID.slice(-12)}...</span>
            </div>
            {reports?.getCurrentStudyReport?.() ? (
              <div className="current-report-card">
                <ReportItem 
                  report={reports.getCurrentStudyReport()}
                  onEdit={handleEditReport}
                  onView={handleViewReport}
                  onDelete={handleDeleteReport}
                  isCurrentStudy={true}
                />
              </div>
            ) : (
              <div className="no-current-study-report">
                현재 Study에 대한 레포트가 없습니다.
              </div>
            )}
          </div>
        ) : (
          <div className="no-study-info">
            <p>Study를 선택해주세요.</p>
          </div>
        )}
      </div>

      {/* 레포트 목록 */}
      <div className="reports-list">
        <h5 className="section-title">
          📚 전체 레포트 ({filteredReports.length}개)
        </h5>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>레포트 목록을 불러오는 중...</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="reports-grid">
            {filteredReports.map(report => (
              <ReportItem 
                key={`report-${report.id}-${report.updated_at}`}
                report={report}
                onEdit={handleEditReport}
                onView={handleViewReport}
                onDelete={handleDeleteReport}
                isCurrentStudy={report.study_uid === currentStudyUID}
              />
            ))}
          </div>
        ) : (
          <div className="no-reports">
            <div className="no-reports-icon">📄</div>
            <p>레포트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 🚀 Django 실제 필드에 맞춘 ReportItem 컴포넌트
const ReportItem = ({ report, onEdit, onView, onDelete, isCurrentStudy }) => {
  
  // 🚀 Django 실제 필드 사용
  const getStudyDescription = (report) => {
    return `${report.patient_id} 레포트` || 'Unknown Study';
  };

  const getStudyDate = (report) => {
    return new Date(report.created_at).toLocaleDateString('ko-KR') || 'Unknown Date';
  };

  const getDoctorName = (report) => {
    return report.doctor_name || 'Unknown Doctor';
  };

  const getReportContent = (report) => {
    return report.report_preview || '';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'completed': return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
      case 'approved': return { bg: '#dcfce7', text: '#166534', border: '#22c55e' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Edit size={12} />;
      case 'completed': return <CheckCircle size={12} />;
      case 'approved': return <CheckCircle size={12} />;
      default: return <FileText size={12} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '초안';
      case 'completed': return '완료';
      case 'approved': return '승인';
      default: return status;
    }
  };

  const statusColor = getStatusColor(report.report_status);
  const studyDescription = getStudyDescription(report);
  const studyDate = getStudyDate(report);
  const doctorName = getDoctorName(report);
  const reportContent = getReportContent(report);

  return (
    <div className={`mv-report-item ${isCurrentStudy ? 'current-study' : ''}`}>
      <div className="mv-report-info">
        <div className="mv-report-header">
          <div className="mv-report-title">
            📄 {studyDescription}
            {isCurrentStudy && <span className="current-badge">현재</span>}
          </div>
          <span 
            className="mv-report-status"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              border: `1px solid ${statusColor.border}`
            }}
          >
            {getStatusIcon(report.report_status)}
            {getStatusLabel(report.report_status)}
          </span>
        </div>
        
        <div className="mv-report-meta">
          <div className="mv-report-date">
            <Clock size={12} />
            {studyDate} | 
            <User size={12} />
            {doctorName}
          </div>
          <div className="mv-report-updated">
            🕒 {new Date(report.updated_at).toLocaleString('ko-KR')}
          </div>
        </div>

        {/* 🚀 레포트 내용 미리보기 - report_preview 사용 */}
        {reportContent && (
          <div className="mv-report-preview">
            {reportContent.length > 100 ? 
              `${reportContent.substring(0, 100)}...` : 
              reportContent
            }
          </div>
        )}

        <div className="mv-report-study-uid">
          Study: {report.study_uid?.slice(-12)}...
        </div>
      </div>
      
      <div className="mv-report-controls">
        <button 
          className="mv-action-btn mv-edit" 
          onClick={() => onEdit(report)} 
          title="편집"
        >
          <Edit size={14} />
        </button>
        <button 
          className="mv-action-btn mv-view" 
          onClick={() => onView(report)} 
          title="보기"
        >
          <Eye size={14} />
        </button>
        {onDelete && (
          <button 
            className="mv-action-btn mv-delete" 
            onClick={() => onDelete(report)} 
            title="삭제"
          >
            <AlertCircle size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;