// frontend/src/components/MedicalDicomViewer.jsx
// 🏥 Medical Platform 커스텀 DICOM 뷰어 - 스타일 및 API 수정
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const MedicalDicomViewer = ({ 
  studyInstanceUID, 
  patientData = {},
  width = '100%', 
  height = '100vh',
  onClose,
  showOverlays = true,
  overlays = [],
  annotationProps = {}
}) => {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageInfo, setImageInfo] = useState(null);
  const [tools, setTools] = useState({
    zoom: false,
    pan: false,
    windowing: false,
    measurement: false
  });
  const [studies, setStudies] = useState([]);
  const [series, setSeries] = useState([]);
  const [currentSeries, setCurrentSeries] = useState(null);

  // Refs
  const viewportRef = useRef(null);
  const cornerstoneElement = useRef(null);

  // 🔧 API 설정 수정 - 실제 작동하는 엔드포인트 사용
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/';
  const ORTHANC_BASE = 'http://localhost:8088'; // nginx 프록시 사용
  const ORTHANC_DIRECT = 'http://localhost:8042'; // 직접 접근

  // 🎨 스타일 수정 - border 속성 충돌 해결
  const styles = {
    container: {
      width: width,
      height: height,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e5e5e5',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    },
    header: {
      backgroundColor: '#ffffff',
      borderBottomWidth: '2px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#e5e5e5',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333333',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    patientInfo: {
      fontSize: '14px',
      color: '#666666',
      margin: '4px 0 0 0'
    },
    toolbar: {
      backgroundColor: '#f8f9fa',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#e5e5e5',
      padding: '8px 16px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    toolButton: {
      backgroundColor: '#ffffff',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d0d0d0',
      borderRadius: '4px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333333',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease'
    },
    toolButtonActive: {
      backgroundColor: '#007bff',
      borderColor: '#007bff',
      color: '#ffffff'
    },
    closeButton: {
      backgroundColor: '#6c757d',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#6c757d',
      borderRadius: '4px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      backgroundColor: '#ffffff'
    },
    sidebar: {
      width: '280px',
      backgroundColor: '#f8f9fa',
      borderRightWidth: '1px',
      borderRightStyle: 'solid',
      borderRightColor: '#e5e5e5',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    sidebarSection: {
      padding: '16px',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#e5e5e5'
    },
    sidebarTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#333333',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    viewportArea: {
      flex: 1,
      position: 'relative',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    viewport: {
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
      position: 'relative'
    },
    seriesList: {
      maxHeight: '200px',
      overflowY: 'auto',
      padding: '0'
    },
    seriesItem: {
      padding: '8px 12px',
      margin: '4px 0',
      backgroundColor: '#ffffff',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e5e5e5',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      color: '#333333',
      transition: 'all 0.2s ease'
    },
    seriesItemActive: {
      backgroundColor: '#007bff',
      borderColor: '#007bff',
      color: '#ffffff'
    },
    imageList: {
      maxHeight: '300px',
      overflowY: 'auto'
    },
    imageItem: {
      padding: '6px 8px',
      margin: '2px 0',
      backgroundColor: '#ffffff',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e5e5e5',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '11px',
      color: '#666666',
      transition: 'all 0.2s ease'
    },
    imageItemActive: {
      backgroundColor: '#007bff',
      borderColor: '#007bff',
      color: '#ffffff'
    },
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      color: '#ffffff',
      fontSize: '16px'
    },
    loadingSpinner: {
      width: '40px',
      height: '40px',
      borderWidth: '4px',
      borderStyle: 'solid',
      borderColor: '#f3f3f3',
      borderTopColor: '#007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px'
    },
    error: {
      backgroundColor: '#f8d7da',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#f5c6cb',
      borderRadius: '4px',
      padding: '16px',
      margin: '16px',
      color: '#721c24'
    },
    retryButton: {
      backgroundColor: '#007bff',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#007bff',
      borderRadius: '4px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#ffffff',
      marginTop: '12px'
    },
    overlayContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10
    },
    boundingBox: {
      position: 'absolute',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      pointerEvents: 'none'
    },
    boundingBoxLabel: {
      position: 'absolute',
      top: '-25px',
      left: '0',
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap'
    },
    statusBar: {
      backgroundColor: '#f8f9fa',
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: '#e5e5e5',
      padding: '8px 16px',
      fontSize: '12px',
      color: '#666666',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  };

  // 스타일시트에 애니메이션 추가
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // 🔧 DICOM 데이터 로드 - 올바른 API 경로 사용
  const loadStudyData = useCallback(async () => {
    if (!studyInstanceUID) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 스터디 데이터 로드 시작:', studyInstanceUID);

      // 🔧 방법 1: Orthanc 직접 접근으로 스터디 정보 조회
      let studyData = null;
      try {
        const orthancResponse = await axios.get(
          `${ORTHANC_DIRECT}/studies`,
          {
            headers: {
              'Authorization': 'Basic ' + btoa('orthanc:orthanc')
            }
          }
        );

        // 스터디 목록에서 해당 UID 찾기
        const studies = orthancResponse.data;
        for (const studyId of studies) {
          const detailResponse = await axios.get(
            `${ORTHANC_DIRECT}/studies/${studyId}`,
            {
              headers: {
                'Authorization': 'Basic ' + btoa('orthanc:orthanc')
              }
            }
          );
          
          if (detailResponse.data.MainDicomTags?.StudyInstanceUID === studyInstanceUID) {
            studyData = detailResponse.data;
            break;
          }
        }
      } catch (orthancError) {
        console.warn('Orthanc 직접 접근 실패, Django API 시도:', orthancError.message);
      }

      // 🔧 방법 2: Django API 사용 (폴백)
      if (!studyData) {
        try {
          const djangoResponse = await axios.get(
            `${API_BASE_URL}pacsapp/studies/`,
            {
              params: { study_instance_uid: studyInstanceUID }
            }
          );
          
          if (djangoResponse.data.success && djangoResponse.data.studies.length > 0) {
            studyData = djangoResponse.data.studies[0];
          }
        } catch (djangoError) {
          console.warn('Django API 접근 실패:', djangoError.message);
        }
      }

      if (studyData) {
        setImageInfo({
          patientName: patientData.patient_name || studyData.MainDicomTags?.PatientName || 'Unknown',
          patientId: patientData.patient_id || studyData.MainDicomTags?.PatientID || 'Unknown',
          studyDate: studyData.MainDicomTags?.StudyDate || 'Unknown',
          modality: studyData.MainDicomTags?.Modality || 'Unknown',
          bodyPart: studyData.MainDicomTags?.BodyPartExamined || 'Unknown',
          studyDescription: studyData.MainDicomTags?.StudyDescription || 'Unknown'
        });

        // 🔧 시리즈 정보 로드
        if (studyData.Series && studyData.Series.length > 0) {
          const seriesIds = studyData.Series;
          const seriesData = [];
          
          for (const seriesId of seriesIds) {
            try {
              const seriesResponse = await axios.get(
                `${ORTHANC_DIRECT}/series/${seriesId}`,
                {
                  headers: {
                    'Authorization': 'Basic ' + btoa('orthanc:orthanc')
                  }
                }
              );
              seriesData.push({
                ...seriesResponse.data,
                ID: seriesId
              });
            } catch (seriesError) {
              console.warn('시리즈 로드 실패:', seriesId, seriesError.message);
            }
          }
          
          setSeries(seriesData);
          
          if (seriesData.length > 0) {
            await loadSeriesImages(seriesData[0]);
          }
        } else {
          // 시리즈가 없는 경우 샘플 이미지 표시
          await loadSampleImages();
        }
      } else {
        // 스터디를 찾지 못한 경우 샘플 이미지 표시
        await loadSampleImages();
      }

    } catch (err) {
      console.error('❌ 스터디 데이터 로드 실패:', err);
      setError('DICOM 데이터를 불러오는데 실패했습니다. 샘플 이미지를 표시합니다.');
      await loadSampleImages();
    } finally {
      setIsLoading(false);
    }
  }, [studyInstanceUID, patientData]);

  // 🔧 샘플 이미지 로드 (테스트용)
  const loadSampleImages = async () => {
    try {
      console.log('📷 샘플 이미지 로드 중...');
      
      setImageInfo({
        patientName: patientData.patient_name || 'Sample Patient',
        patientId: patientData.patient_id || 'SAMPLE001',
        studyDate: '20240101',
        modality: 'CT',
        bodyPart: 'CHEST',
        studyDescription: 'Sample CT Study'
      });

      setSeries([{
        ID: 'sample-series',
        MainDicomTags: {
          SeriesDescription: 'Sample CT Series',
          SeriesInstanceUID: 'sample-series-uid',
          Modality: 'CT'
        },
        Instances: ['sample-instance']
      }]);

      const sampleImages = [
        {
          id: 'sample-1',
          sopInstanceUID: 'sample-sop-1',
          instanceNumber: 1,
          imageUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" fill="#000"/>
              <circle cx="256" cy="256" r="100" fill="#fff" opacity="0.3"/>
              <text x="256" y="256" text-anchor="middle" fill="#fff" font-size="24">
                Sample DICOM Image 1
              </text>
              <text x="256" y="290" text-anchor="middle" fill="#ccc" font-size="14">
                Study: ${studyInstanceUID}
              </text>
            </svg>
          `),
          wadoUrl: '#'
        },
        {
          id: 'sample-2',
          sopInstanceUID: 'sample-sop-2',
          instanceNumber: 2,
          imageUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" fill="#111"/>
              <rect x="156" y="156" width="200" height="200" fill="#fff" opacity="0.4"/>
              <text x="256" y="256" text-anchor="middle" fill="#fff" font-size="24">
                Sample DICOM Image 2
              </text>
            </svg>
          `),
          wadoUrl: '#'
        }
      ];

      setImages(sampleImages);
      setCurrentImageIndex(0);
      
      if (sampleImages.length > 0) {
        await loadImageToViewer(sampleImages[0]);
      }

    } catch (err) {
      console.error('샘플 이미지 로드 실패:', err);
      setError('샘플 이미지 로드에 실패했습니다.');
    }
  };

  // 시리즈 이미지 로드
  const loadSeriesImages = async (seriesData) => {
    try {
      setCurrentSeries(seriesData);
      console.log('🖼️ 시리즈 이미지 로드:', seriesData.MainDicomTags?.SeriesInstanceUID);

      if (seriesData.Instances) {
        const instanceIds = seriesData.Instances;
        const imageList = [];

        for (let i = 0; i < instanceIds.length; i++) {
          const instanceId = instanceIds[i];
          try {
            const instanceResponse = await axios.get(
              `${ORTHANC_DIRECT}/instances/${instanceId}`,
              {
                headers: {
                  'Authorization': 'Basic ' + btoa('orthanc:orthanc')
                }
              }
            );

            const instanceData = instanceResponse.data;
            imageList.push({
              id: instanceId,
              sopInstanceUID: instanceData.MainDicomTags?.SOPInstanceUID,
              instanceNumber: instanceData.MainDicomTags?.InstanceNumber || i + 1,
              imageUrl: `${ORTHANC_DIRECT}/instances/${instanceId}/preview`,
              wadoUrl: `${ORTHANC_DIRECT}/instances/${instanceId}/file`
            });
          } catch (instanceError) {
            console.warn('인스턴스 로드 실패:', instanceId, instanceError.message);
          }
        }

        setImages(imageList);
        setCurrentImageIndex(0);

        if (imageList.length > 0) {
          await loadImageToViewer(imageList[0]);
        }
      }

    } catch (err) {
      console.error('❌ 시리즈 이미지 로드 실패:', err);
      setError('시리즈 이미지를 불러오는데 실패했습니다: ' + err.message);
    }
  };

  // 뷰어에 이미지 로드
  const loadImageToViewer = async (imageData) => {
    try {
      console.log('🖼️ 이미지 뷰어 로드:', imageData.instanceNumber);
      
      if (viewportRef.current) {
        viewportRef.current.innerHTML = `
          <img 
            src="${imageData.imageUrl}" 
            style="max-width: 100%; max-height: 100%; object-fit: contain;"
            alt="DICOM Image ${imageData.instanceNumber}"
            onload="console.log('이미지 로드 완료: ${imageData.instanceNumber}')"
            onerror="console.error('이미지 로드 실패: ${imageData.instanceNumber}')"
          />
        `;
      }

    } catch (err) {
      console.error('❌ 이미지 로드 실패:', err);
      setError('이미지를 표시하는데 실패했습니다: ' + err.message);
    }
  };

  // 도구 토글
  const toggleTool = (toolName) => {
    setTools(prev => ({
      ...prev,
      [toolName]: !prev[toolName]
    }));
  };

  // 이미지 변경
  const changeImage = (index) => {
    if (index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
      loadImageToViewer(images[index]);
    }
  };

  // 시리즈 변경
  const changeSeries = (seriesData) => {
    loadSeriesImages(seriesData);
  };

  // 초기화
  useEffect(() => {
    loadStudyData();
  }, [loadStudyData]);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <span>🏥</span>
            Medical Platform DICOM Viewer
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              style={styles.closeButton}
            >
              ✕ 닫기
            </button>
          )}
        </div>
        <div style={styles.error}>
          <strong>알림:</strong><br />
          {error}
          <button
            onClick={() => {
              setError(null);
              loadStudyData();
            }}
            style={styles.retryButton}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            <span>🏥</span>
            Medical Platform DICOM Viewer
          </h3>
          {imageInfo && (
            <div style={styles.patientInfo}>
              {imageInfo.patientName} | {imageInfo.modality} | {imageInfo.studyDate}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={styles.closeButton}
          >
            ✕ 닫기
          </button>
        )}
      </div>

      {/* 툴바 */}
      <div style={styles.toolbar}>
        <button
          onClick={() => toggleTool('zoom')}
          style={{
            ...styles.toolButton,
            ...(tools.zoom ? styles.toolButtonActive : {})
          }}
        >
          🔍 확대/축소
        </button>
        <button
          onClick={() => toggleTool('pan')}
          style={{
            ...styles.toolButton,
            ...(tools.pan ? styles.toolButtonActive : {})
          }}
        >
          ✋ 이동
        </button>
        <button
          onClick={() => toggleTool('windowing')}
          style={{
            ...styles.toolButton,
            ...(tools.windowing ? styles.toolButtonActive : {})
          }}
        >
          🎛️ 윈도잉
        </button>
        <button
          onClick={() => toggleTool('measurement')}
          style={{
            ...styles.toolButton,
            ...(tools.measurement ? styles.toolButtonActive : {})
          }}
        >
          📏 측정
        </button>
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666666' }}>
          {images.length > 0 && `${currentImageIndex + 1} / ${images.length}`}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={styles.mainContent}>
        {/* 사이드바 */}
        <div style={styles.sidebar}>
          {/* 시리즈 목록 */}
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarTitle}>
              📁 Series ({series.length})
            </div>
            <div style={styles.seriesList}>
              {series.map((seriesData, index) => (
                <div
                  key={seriesData.ID}
                  onClick={() => changeSeries(seriesData)}
                  style={{
                    ...styles.seriesItem,
                    ...(currentSeries?.ID === seriesData.ID ? styles.seriesItemActive : {})
                  }}
                >
                  <div style={{ fontWeight: '500' }}>
                    {seriesData.MainDicomTags?.SeriesDescription || `Series ${index + 1}`}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>
                    {seriesData.MainDicomTags?.Modality} | {seriesData.Instances?.length || 0} images
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이미지 목록 */}
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarTitle}>
              🖼️ Images ({images.length})
            </div>
            <div style={styles.imageList}>
              {images.map((image, index) => (
                <div
                  key={image.id}
                  onClick={() => changeImage(index)}
                  style={{
                    ...styles.imageItem,
                    ...(currentImageIndex === index ? styles.imageItemActive : {})
                  }}
                >
                  Image {image.instanceNumber}
                </div>
              ))}
            </div>
          </div>

          {/* 환자 정보 */}
          {imageInfo && (
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>
                👤 Patient Info
              </div>
              <div style={{ fontSize: '12px', color: '#666666' }}>
                <div><strong>Name:</strong> {imageInfo.patientName}</div>
                <div><strong>ID:</strong> {imageInfo.patientId}</div>
                <div><strong>Study:</strong> {imageInfo.studyDescription}</div>
                <div><strong>Body Part:</strong> {imageInfo.bodyPart}</div>
              </div>
            </div>
          )}
        </div>

        {/* 뷰포트 영역 */}
        <div style={styles.viewportArea}>
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.loadingSpinner}></div>
              DICOM 이미지 로딩 중...
            </div>
          )}
          
          <div
            ref={viewportRef}
            style={styles.viewport}
          />

          {/* AI 오버레이 */}
          {showOverlays && overlays.length > 0 && (
            <div style={styles.overlayContainer}>
              {overlays.map((overlay, index) => {
                if (!overlay.bbox || overlay.bbox.length !== 4) return null;

                const [x1, y1, x2, y2] = overlay.bbox;
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.boundingBox,
                      left: `${x1}px`,
                      top: `${y1}px`,
                      width: `${x2 - x1}px`,
                      height: `${y2 - y1}px`
                    }}
                  >
                    <div style={styles.boundingBoxLabel}>
                      {overlay.label || `Detection ${index + 1}`}
                      {overlay.confidence && ` (${Math.round(overlay.confidence * 100)}%)`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 상태바 */}
      <div style={styles.statusBar}>
        <div>
          Study: {studyInstanceUID?.substring(0, 20)}...
        </div>
        <div>
          Medical Platform CDSS | Powered by React
        </div>
      </div>
    </div>
  );
};

export default MedicalDicomViewer;