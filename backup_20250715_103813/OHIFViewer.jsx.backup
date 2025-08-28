// frontend/src/components/DicomViewer.jsx
// 기존 프로젝트 구조에 맞춘 OHIF 연동 컴포넌트

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DicomViewer = ({ patient }) => {
  const [dicomStudies, setDicomStudies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ 기존 프로젝트 환경변수 사용
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://35.225.63.41:8000/api/';
  const OHIF_URL = process.env.REACT_APP_OHIF_URL || 'http://35.225.63.41:3001';
  const ORTHANC_URL = process.env.REACT_APP_ORTHANC_URL || 'http://35.225.63.41:8042';

  // 환자의 DICOM Studies 조회 (기존 API 사용)
  useEffect(() => {
    if (patient?.uuid) {
      fetchPatientDicomStudies();
    }
  }, [patient]);

  const fetchPatientDicomStudies = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 환자 DICOM Studies 조회:', patient.uuid);
      
      // ✅ 기존 프로젝트 API 엔드포인트 사용
      const response = await axios.get(
        `${API_BASE_URL}integration/patients/${patient.uuid}/dicom-studies/`
      );
      
      if (response.data.success) {
        setDicomStudies(response.data.studies || []);
        console.log('✅ DICOM Studies 조회 성공:', response.data.studies);
      } else {
        setError(response.data.error || 'DICOM Studies 조회 실패');
      }
    } catch (err) {
      console.error('❌ DICOM Studies 조회 실패:', err);
      setError('DICOM Studies 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  // ✅ OHIF Viewer로 Study 열기 (Docker 버전)
  const openInOHIF = (study) => {
    const studyInstanceUID = study.study_instance_uid;
    
    if (!studyInstanceUID) {
      alert('❌ Study Instance UID가 없습니다.');
      return;
    }

    // OHIF Viewer URL 생성
    const ohifUrl = `${OHIF_URL}/viewer?StudyInstanceUIDs=${studyInstanceUID}`;
    
    console.log('🚀 OHIF 열기:', ohifUrl);
    
    // 새 창에서 열기
    const newWindow = window.open(ohifUrl, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      alert('⚠️ 팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
    }
  };

  // ✅ Orthanc Web Viewer로 열기 (백업 옵션)
  const openInOrthancViewer = (study) => {
    const orthancStudyId = study.orthanc_study_id;
    
    if (!orthancStudyId) {
      alert('❌ Orthanc Study ID가 없습니다.');
      return;
    }

    const orthancUrl = `${ORTHANC_URL}/app/explorer.html#study?uuid=${orthancStudyId}`;
    window.open(orthancUrl, '_blank');
  };

  // ✅ OHIF 상태 확인
  const checkOHIFStatus = async () => {
    try {
      const response = await fetch(`${OHIF_URL}`, { method: 'GET' });
      return response.ok;
    } catch (error) {
      console.log('OHIF 연결 실패:', error);
      return false;
    }
  };

  // ✅ 테스트용 샘플 데이터
  const testOHIF = async () => {
    const isOHIFAvailable = await checkOHIFStatus();
    
    if (!isOHIFAvailable) {
      alert('❌ OHIF Viewer가 실행되지 않았습니다.\nDocker로 OHIF를 먼저 실행해주세요.');
      return;
    }

    // 실제 Orthanc에 있는 Study로 테스트
    const testStudyUID = '1.2.840.113619.2.5.1762583153.215519.978957063.78';
    const ohifUrl = `${OHIF_URL}/viewer?StudyInstanceUIDs=${testStudyUID}`;
    
    console.log('🧪 OHIF 테스트:', ohifUrl);
    window.open(ohifUrl, '_blank', 'width=1400,height=900');
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h2>🖼️ DICOM 영상 뷰어</h2>
        {patient && (
          <p>환자: {patient.display || patient.name} (ID: {patient.identifiers?.[0]?.identifier || patient.uuid})</p>
        )}
      </div>

      {/* 테스트 및 디버깅 섹션 */}
      <div style={styles.debugSection}>
        <button onClick={testOHIF} style={styles.testButton}>
          🧪 OHIF 테스트
        </button>
        <button 
          onClick={() => window.open(`${ORTHANC_URL}/app/explorer.html`, '_blank')} 
          style={{...styles.testButton, background: '#17a2b8'}}
        >
          🔍 Orthanc 탐색기
        </button>
        <span style={styles.status}>
          OHIF: {OHIF_URL} | Orthanc: {ORTHANC_URL}
        </span>
      </div>

      {/* 로딩 */}
      {loading && <div style={styles.loading}>🔄 DICOM Studies 조회 중...</div>}

      {/* 에러 */}
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
          <button onClick={fetchPatientDicomStudies} style={styles.retryButton}>
            🔄 다시 시도
          </button>
        </div>
      )}

      {/* DICOM Studies 목록 */}
      {dicomStudies.length > 0 && (
        <div style={styles.studiesContainer}>
          <h3>📁 DICOM Studies ({dicomStudies.length}개)</h3>
          
          {dicomStudies.map((study, index) => (
            <div key={study.orthanc_study_id || index} style={styles.studyCard}>
              <div style={styles.studyInfo}>
                <h4>{study.study_description || 'Unknown Study'}</h4>
                <div style={styles.studyDetails}>
                  <p><strong>날짜:</strong> {formatDate(study.study_date)}</p>
                  <p><strong>Modality:</strong> {study.modality || 'N/A'}</p>
                  <p><strong>Series:</strong> {study.series_count || 0}개</p>
                  <p><strong>Images:</strong> {study.instances_count || 0}개</p>
                  <p style={styles.uid}>
                    <strong>Study UID:</strong> {study.study_instance_uid || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div style={styles.studyActions}>
                <button
                  onClick={() => openInOHIF(study)}
                  style={styles.ohifButton}
                  disabled={!study.study_instance_uid}
                >
                  🖼️ OHIF로 보기
                </button>
                
                <button
                  onClick={() => openInOrthancViewer(study)}
                  style={styles.orthancButton}
                  disabled={!study.orthanc_study_id}
                >
                  🔗 Orthanc로 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && !error && dicomStudies.length === 0 && patient && (
        <div style={styles.noData}>
          <p>📊 이 환자에 대한 DICOM 데이터가 없습니다.</p>
        </div>
      )}

      {/* 환자 미선택 */}
      {!patient && (
        <div style={styles.noPatient}>
          <p>👤 환자를 선택하면 DICOM 영상을 볼 수 있습니다.</p>
        </div>
      )}
    </div>
  );

  // 날짜 포맷팅
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = dateString.substr(0, 4);
        const month = dateString.substr(4, 2);
        const day = dateString.substr(6, 2);
        return `${year}-${month}-${day}`;
      }
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }
};

// 스타일
const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  debugSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '15px',
    background: '#e9ecef',
    borderRadius: '8px',
    flexWrap: 'wrap'
  },
  testButton: {
    padding: '8px 15px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  status: {
    fontSize: '12px',
    color: '#666',
    marginLeft: 'auto'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px'
  },
  error: {
    background: '#fff3cd',
    border: '1px solid #ffeaa7',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  retryButton: {
    marginLeft: '10px',
    padding: '5px 10px',
    background: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  studiesContainer: {
    marginTop: '20px'
  },
  studyCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    background: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  studyInfo: {
    flex: 1
  },
  studyDetails: {
    fontSize: '14px',
    color: '#666'
  },
  uid: {
    fontSize: '12px',
    color: '#999',
    wordBreak: 'break-all'
  },
  studyActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '15px'
  },
  ohifButton: {
    padding: '8px 16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  orthancButton: {
    padding: '8px 16px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  noPatient: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default DicomViewer;