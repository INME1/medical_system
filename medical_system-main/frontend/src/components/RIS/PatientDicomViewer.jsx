// frontend/src/components/OHIF/PatientDicomViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PatientDicomViewer = ({ patient }) => {
  const [dicomStudies, setDicomStudies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudy, setSelectedStudy] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/';
  const OHIF_URL = 'http://localhost:3001';

  // 환자의 DICOM Study 목록 조회
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
      setError(err.response?.data?.error || 'DICOM Studies 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  // OHIF Viewer로 Study 열기
  const openInOHIF = (study) => {
    try {
      const studyInstanceUID = study.study_instance_uid;
      
      if (!studyInstanceUID) {
        alert('Study Instance UID가 없습니다.');
        return;
      }

      // OHIF Viewer URL 구성
      const ohifUrl = `${OHIF_URL}/viewer?StudyInstanceUIDs=${studyInstanceUID}`;
      
      console.log('🚀 OHIF Viewer 실행:', ohifUrl);
      
      // 새 창에서 OHIF Viewer 열기
      window.open(ohifUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
    } catch (error) {
      console.error('OHIF Viewer 실행 실패:', error);
      alert('OHIF Viewer 실행에 실패했습니다.');
    }
  };

  // Study 상세 정보 조회
  const getStudyDetails = async (study) => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${API_BASE_URL}integration/dicom/studies/${study.orthanc_study_id}/details/`
      );
      
      if (response.data.success) {
        setSelectedStudy(response.data.study_details);
        console.log('Study 상세 정보:', response.data.study_details);
      } else {
        setError('Study 상세 정보 조회 실패');
      }
    } catch (err) {
      console.error('Study 상세 정보 조회 실패:', err);
      setError('Study 상세 정보 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // DICOM 날짜 형식 (YYYYMMDD) 처리
      if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = dateString.substr(0, 4);
        const month = dateString.substr(4, 2);
        const day = dateString.substr(6, 2);
        return `${year}-${month}-${day}`;
      }
      // ISO 날짜 형식 처리
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (!patient) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🏥</div>
        <p style={styles.emptyText}>환자를 선택하면 DICOM 영상을 볼 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 환자 정보 헤더 */}
      <div style={styles.patientHeader}>
        <h3 style={styles.patientTitle}>
          📋 {patient.display || patient.name}의 DICOM 영상
        </h3>
        <div style={styles.patientInfo}>
          <span>환자 ID: {patient.patient_identifier || patient.uuid}</span>
          <span>성별: {patient.person?.gender === 'M' ? '남성' : '여성'}</span>
          <span>나이: {patient.person?.age}세</span>
        </div>
        <button onClick={fetchPatientDicomStudies} style={styles.refreshButton}>
          🔄 새로고침
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>⏳</div>
          <p>DICOM Studies를 불러오는 중...</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <p>{error}</p>
          <button onClick={() => setError('')} style={styles.errorCloseButton}>
            ✕
          </button>
        </div>
      )}

      {/* DICOM Studies 목록 */}
      {!loading && !error && (
        <div style={styles.studiesContainer}>
          {dicomStudies.length === 0 ? (
            <div style={styles.noStudiesContainer}>
              <div style={styles.noStudiesIcon}>📂</div>
              <p style={styles.noStudiesText}>
                이 환자의 DICOM 영상이 없습니다.
              </p>
              <p style={styles.noStudiesSubtext}>
                영상검사를 요청하거나 DICOM 파일을 업로드하세요.
              </p>
            </div>
          ) : (
            <div style={styles.studiesList}>
              <h4 style={styles.studiesTitle}>
                📚 DICOM Studies ({dicomStudies.length}개)
              </h4>
              
              {dicomStudies.map((study, index) => (
                <div key={study.study_instance_uid || index} style={styles.studyCard}>
                  <div style={styles.studyHeader}>
                    <div style={styles.studyInfo}>
                      <h5 style={styles.studyDescription}>
                        {study.study_description || 'Study Description N/A'}
                      </h5>
                      <div style={styles.studyMeta}>
                        <span>📅 {formatDate(study.study_date)}</span>
                        <span>🏥 {study.modality || 'N/A'}</span>
                        <span>📊 {study.series_count || 0} Series</span>
                        <span>🖼️ {study.instances_count || 0} Images</span>
                      </div>
                    </div>
                    
                    <div style={styles.studyActions}>
                      <button
                        onClick={() => openInOHIF(study)}
                        style={styles.ohifButton}
                        title="OHIF Viewer에서 열기"
                      >
                        🖥️ OHIF로 보기
                      </button>
                      
                      <button
                        onClick={() => getStudyDetails(study)}
                        style={styles.detailsButton}
                        title="상세 정보 보기"
                      >
                        📋 상세정보
                      </button>
                    </div>
                  </div>
                  
                  {/* Study 추가 정보 */}
                  <div style={styles.studyDetails}>
                    <div style={styles.studyDetailItem}>
                      <strong>Study UID:</strong>
                      <span style={styles.studyUid}>
                        {study.study_instance_uid}
                      </span>
                    </div>
                    
                    {study.accession_number && (
                      <div style={styles.studyDetailItem}>
                        <strong>Accession Number:</strong>
                        <span>{study.accession_number}</span>
                      </div>
                    )}
                    
                    {study.study_time && (
                      <div style={styles.studyDetailItem}>
                        <strong>검사 시간:</strong>
                        <span>{study.study_time}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 매핑 정보 */}
                  {study.mapping_info && (
                    <div style={styles.mappingInfo}>
                      <small>
                        🔗 매핑 타입: {study.mapping_info.mapping_type} | 
                        신뢰도: {(study.mapping_info.confidence_score * 100).toFixed(1)}%
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Study 상세 정보 모달 */}
      {selectedStudy && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>📋 Study 상세 정보</h3>
              <button
                onClick={() => setSelectedStudy(null)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalSection}>
                <h4>기본 정보</h4>
                <p><strong>Study Description:</strong> {selectedStudy.MainDicomTags?.StudyDescription || 'N/A'}</p>
                <p><strong>Study Date:</strong> {formatDate(selectedStudy.MainDicomTags?.StudyDate)}</p>
                <p><strong>Modality:</strong> {selectedStudy.MainDicomTags?.Modality || 'N/A'}</p>
                <p><strong>Patient Name:</strong> {selectedStudy.PatientMainDicomTags?.PatientName || 'N/A'}</p>
              </div>
              
              {selectedStudy.series_details && (
                <div style={styles.modalSection}>
                  <h4>Series 정보 ({selectedStudy.series_details.length}개)</h4>
                  {selectedStudy.series_details.map((series, idx) => (
                    <div key={idx} style={styles.seriesItem}>
                      <p><strong>Series {idx + 1}:</strong> {series.series_info?.MainDicomTags?.SeriesDescription || 'N/A'}</p>
                      <p><small>Images: {series.instances?.length || 0}개</small></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    boxSizing: 'border-box'
  },
  
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#6c757d'
  },
  
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  
  emptyText: {
    fontSize: '16px',
    margin: 0
  },
  
  patientHeader: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  
  patientTitle: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '18px'
  },
  
  patientInfo: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6c757d',
    marginTop: '8px'
  },
  
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    color: '#6c757d'
  },
  
  loadingSpinner: {
    fontSize: '32px',
    marginBottom: '16px'
  },
  
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    color: '#721c24'
  },
  
  errorIcon: {
    fontSize: '24px',
    marginRight: '12px'
  },
  
  errorCloseButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#721c24'
  },
  
  studiesContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  noStudiesContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    color: '#6c757d'
  },
  
  noStudiesIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  
  noStudiesText: {
    fontSize: '16px',
    margin: '0 0 8px 0'
  },
  
  noStudiesSubtext: {
    fontSize: '14px',
    margin: 0,
    color: '#adb5bd'
  },
  
  studiesList: {
    width: '100%'
  },
  
  studiesTitle: {
    margin: '0 0 16px 0',
    color: '#2c3e50'
  },
  
  studyCard: {
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#fafafa'
  },
  
  studyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  
  studyInfo: {
    flex: 1
  },
  
  studyDescription: {
    margin: '0 0 8px 0',
    color: '#2c3e50',
    fontSize: '16px'
  },
  
  studyMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6c757d',
    flexWrap: 'wrap'
  },
  
  studyActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '16px'
  },
  
  ohifButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  
  detailsButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  
  studyDetails: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e9ecef'
  },
  
  studyDetailItem: {
    display: 'flex',
    marginBottom: '4px',
    fontSize: '14px'
  },
  
  studyUid: {
    marginLeft: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#6c757d',
    wordBreak: 'break-all'
  },
  
  mappingInfo: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #e9ecef',
    color: '#6c757d'
  },
  
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e9ecef'
  },
  
  modalCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer'
  },
  
  modalBody: {
    padding: '16px'
  },
  
  modalSection: {
    marginBottom: '24px'
  },
  
  seriesItem: {
    backgroundColor: '#f8f9fa',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '8px'
  }
};

export default PatientDicomViewer;