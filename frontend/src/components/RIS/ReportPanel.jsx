// frontend/src/components/RIS/ReportPanel.jsx

import React, { useState, useEffect } from 'react';

const ReportPanel = ({ 
  studyUid, 
  patientInfo,
  onReportSave,
  className = "",
  style = {} 
}) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedReport, setEditedReport] = useState('');

  // API 기본 URL
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

  // studyUid 변경시 리포트 로드
  useEffect(() => {
    if (studyUid) {
      loadReport(studyUid);
    }
  }, [studyUid]);

  // 리포트 로드
  const loadReport = async (studyUid) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 리포트 로드 시작:', studyUid);

      const response = await fetch(`${API_BASE}reports/study/${studyUid}/`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.report) {
          setReportData(data.report);
          setEditedReport(data.report?.dr_report || '');
          console.log('✅ 리포트 로드 완료:', data.report);
        } else {
          // 리포트가 없는 경우
          setReportData(null);
          setEditedReport('');
          console.log('ℹ️ 작성된 리포트가 없습니다');
        }
      } else if (response.status === 404) {
        // 리포트가 없는 경우
        setReportData(null);
        setEditedReport('');
        console.log('ℹ️ 리포트가 존재하지 않습니다 (404)');
      } else {
        throw new Error(`리포트 조회 실패: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ 리포트 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 리포트 저장
  const saveReport = async () => {
    try {
      setSaving(true);
      setError(null);

      const requestData = {
        study_uid: studyUid,
        patient_id: patientInfo?.patient_id || 'UNKNOWN',
        patient_info: patientInfo || {},
        report_content: editedReport,
        report_status: 'completed'
      };

      console.log('💾 리포트 저장 시작:', requestData);

      const url = reportData 
        ? `${API_BASE}reports/${reportData.id}/`
        : `${API_BASE}reports/create/`;
      
      const method = reportData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setReportData(data.report || {
            ...requestData,
            id: Date.now(),
            dr_report: editedReport,
            doctor_name: '김영상',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setEditMode(false);
          
          // 부모 컴포넌트에 저장 알림
          if (onReportSave) {
            onReportSave(data.report);
          }

          console.log('✅ 리포트 저장 완료');
        } else {
          throw new Error(data.message || '리포트 저장 실패');
        }
      } else {
        throw new Error(`리포트 저장 실패: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ 리포트 저장 실패:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (editMode) {
      // 편집 취소 - 원래 내용으로 복원
      setEditedReport(reportData?.dr_report || '');
    }
    setEditMode(!editMode);
  };

  // 리포트 템플릿 삽입
  const insertTemplate = (templateType) => {
    let template = '';
    
    switch (templateType) {
      case 'normal':
        template = `
## 판독 소견

영상 검사상 특이 소견은 관찰되지 않습니다.

정상 범위 내의 소견을 보이고 있습니다.

## 결론

정상 소견입니다.
        `.trim();
        break;
      
      case 'abnormal':
        template = `
## 판독 소견

[소견을 구체적으로 기술해주세요]

## 결론

[진단 결론을 기술해주세요]

## 권고사항

[추가 검사나 치료 권고사항을 기술해주세요]
        `.trim();
        break;
      
      case 'chest_ct':
        template = `
## 검사 소견

**폐야 (Lung Field)**
- 양측 폐야에 특이 병변 없음
- 폐문부 림프절 비대 없음

**흉막 (Pleura)**
- 양측 흉막에 특이 소견 없음

**심장 (Heart)**
- 심장 크기 및 모양 정상

**종격동 (Mediastinum)**
- 종격동 구조물 정상

## 결론

정상 흉부 CT 소견입니다.
        `.trim();
        break;
      
      default:
        template = '판독 소견을 입력하세요...';
    }
    
    setEditedReport(template);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`} style={style}>
        <div className="text-center">
          <div className="text-lg mb-2">📋</div>
          <div>리포트 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`} style={style}>
      {/* 헤더 */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            📋 판독 리포트
          </h3>
          <div className="flex items-center space-x-2">
            {reportData && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                reportData.report_status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : reportData.report_status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {reportData.report_status === 'completed' ? '완료' : 
                 reportData.report_status === 'draft' ? '초안' : '승인'}
              </span>
            )}
            
            {editMode ? (
              <div className="flex space-x-2">
                <button 
                  onClick={saveReport}
                  disabled={saving || !editedReport.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1"
                >
                  <span>💾</span>
                  <span>{saving ? '저장 중...' : '저장'}</span>
                </button>
                <button 
                  onClick={toggleEditMode}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center space-x-1"
                >
                  <span>❌</span>
                  <span>취소</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={toggleEditMode}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center space-x-1"
              >
                <span>✏️</span>
                <span>편집</span>
              </button>
            )}
          </div>
        </div>

        {/* 환자 정보 */}
        {patientInfo && (
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">환자:</span> {patientInfo.patient_name || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">ID:</span> {patientInfo.patient_id || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">검사일:</span> {patientInfo.exam_date || 'N/A'}
            </div>
            <div>
              <span className="font-medium">모달리티:</span> {patientInfo.modality || 'N/A'}
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="text-red-700">❌ {error}</div>
        </div>
      )}

      {/* 리포트 내용 */}
      <div className="p-4 flex-1 overflow-hidden">
        {editMode ? (
          <div className="h-full flex flex-col">
            {/* 템플릿 버튼들 */}
            {!reportData && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">템플릿 선택:</div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => insertTemplate('normal')}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
                  >
                    ✅ 정상 소견
                  </button>
                  <button 
                    onClick={() => insertTemplate('abnormal')}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200 transition-colors"
                  >
                    ⚠️ 비정상 소견
                  </button>
                  <button 
                    onClick={() => insertTemplate('chest_ct')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                  >
                    🫁 흉부 CT
                  </button>
                </div>
              </div>
            )}

            {/* 편집 영역 */}
            <div className="flex-1 flex flex-col">
              <textarea
                value={editedReport}
                onChange={(e) => setEditedReport(e.target.value)}
                placeholder="판독 소견을 입력하세요..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                style={{ minHeight: '300px' }}
              />
              
              <div className="text-xs text-gray-500 mt-2">
                <div>💡 팁: ## 제목, **굵게**, *기울임* 등 마크다운 형식을 사용할 수 있습니다.</div>
                <div>📝 글자 수: {editedReport.length}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {reportData && reportData.dr_report ? (
              <div>
                {/* 리포트 내용 */}
                <div className="prose max-w-none">
                  <div style={{ whiteSpace: 'pre-wrap' }} className="text-gray-800 leading-relaxed">
                    {reportData.dr_report}
                  </div>
                </div>
                
                {/* 리포트 메타데이터 */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">👨‍⚕️ 판독의:</span> {reportData.doctor_name || '김영상'}
                    </div>
                    <div>
                      <span className="font-medium">📅 작성일:</span> {
                        reportData.created_at 
                          ? new Date(reportData.created_at).toLocaleString()
                          : 'N/A'
                      }
                    </div>
                    <div>
                      <span className="font-medium">🔄 수정일:</span> {
                        reportData.updated_at 
                          ? new Date(reportData.updated_at).toLocaleString()
                          : 'N/A'
                      }
                    </div>
                    <div>
                      <span className="font-medium">📊 상태:</span> {
                        reportData.report_status === 'completed' ? '✅ 완료' :
                        reportData.report_status === 'draft' ? '📝 초안' : '🔒 승인'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 h-full flex flex-col justify-center">
                <div className="text-6xl mb-4">📄</div>
                <div className="text-xl mb-2 font-medium">아직 작성된 리포트가 없습니다</div>
                <div className="text-sm">편집 버튼을 클릭하여 리포트를 작성하세요</div>
                <button 
                  onClick={toggleEditMode}
                  className="mt-4 mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>리포트 작성하기</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPanel;