// DMViewer.jsx - 완전 통합 수정본 (API 경로 문제 해결)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Move, 
  ZoomIn, 
  Square, 
  Save, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import config from '../../config/config';

const DMViewer = ({ selectedStudy, onClose }) => {
  // 상태 관리
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [instancesList, setInstancesList] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageElement, setCurrentImageElement] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [currentTool, setCurrentTool] = useState('pan');
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval, setPlayInterval] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const viewerRef = useRef(null);

  // API Base URL - 수정된 부분
  const API_BASE = config.API_BASE_URL || 'http://localhost:8000';
  const RIS_BASE = config.RIS_BASE_URL || 'http://localhost:3020';
  // Studies 조회 시 Series 가져오기
  const fetchSeriesFromStudy = useCallback(async (study) => {
    if (!study || !study.orthanc_study_id) {
      console.warn('❌ Study ID가 없습니다:', study);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Series 조회 시작:', study.orthanc_study_id);

      // ✅ OHIF 프록시를 통한 Series 조회
      const response = await fetch(`${API_BASE}/api/ohif/orthanc/studies/${study.orthanc_study_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Series 조회 실패: ${response.status}`);
      }

      const studyData = await response.json();
      console.log('📊 Study 데이터:', studyData);

      let series = [];
      
      if (studyData.Series && Array.isArray(studyData.Series)) {
        // Orthanc에서 직접 Series 정보 조회
        for (const seriesId of studyData.Series) {
          try {
            const seriesResponse = await fetch(`${API_BASE}/api/ohif/orthanc/series/${seriesId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (seriesResponse.ok) {
              const seriesData = await seriesResponse.json();
              const mainTags = seriesData.MainDicomTags || {};
              
              series.push({
                orthanc_series_id: seriesId,
                series_instance_uid: mainTags.SeriesInstanceUID || seriesId,
                series_description: mainTags.SeriesDescription || 'Unnamed Series',
                series_number: mainTags.SeriesNumber || '1',
                modality: mainTags.Modality || study.modality || 'CT',
                instances_count: seriesData.Instances ? seriesData.Instances.length : 0,
                instances_ids: seriesData.Instances || []
              });
            }
          } catch (seriesError) {
            console.warn('Series 개별 조회 실패:', seriesId, seriesError);
          }
        }
      }

      // Series를 찾지 못한 경우 더미 데이터 생성
      if (series.length === 0) {
        console.warn('⚠️ 실제 Series를 찾지 못함, 더미 Series 생성');
        series = [{
          orthanc_series_id: `dummy-series-${study.orthanc_study_id}`,
          series_instance_uid: study.study_instance_uid,
          series_description: 'Default Series',
          series_number: '1',
          modality: study.modality || 'CT',
          instances_count: 1,
          instances_ids: [`dummy-instance-${study.orthanc_study_id}`]
        }];
      }
      
      setSeriesList(series);
      console.log('✅ Series 조회 완료:', series.length, '개');
      
      // 첫 번째 Series 자동 선택
      if (series.length > 0) {
        await fetchInstancesFromSeries(series[0]);
      }
      
    } catch (error) {
      console.error('❌ Series 조회 실패:', error);
      setError(`Series 조회 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Instances 목록 조회 - 수정된 핵심 부분
  const fetchInstancesFromSeries = async (series) => {
    try {
      setSelectedSeries(series);
      setInstancesList([]);
      setCurrentImageIndex(0);
      setLoadingImages(true);
      
      console.log('📡 Instances 조회 시작:', series);
      
      let instances = [];
      
      // 실제 Series ID가 있는 경우에만 조회
      if (series.instances_ids && series.instances_ids.length > 0 && 
          !series.instances_ids[0].includes('dummy')) {
        
        console.log('📋 실제 Instance ID 사용:', series.instances_ids);
        
        for (const instanceId of series.instances_ids) {
          try {
            // ✅ OHIF 프록시를 통한 Instance 조회
            const instanceResponse = await fetch(`${API_BASE}/api/ohif/orthanc/instances/${instanceId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (instanceResponse.ok) {
              const instanceData = await instanceResponse.json();
              const mainTags = instanceData.MainDicomTags || {};
              
              instances.push({
                orthanc_instance_id: instanceId,
                instance_number: parseInt(mainTags.InstanceNumber) || instances.length + 1,
                sop_instance_uid: mainTags.SOPInstanceUID,
                image_url: `${API_BASE}/api/ohif/orthanc/instances/${instanceId}/preview`,
                dicom_url: `${API_BASE}/api/ohif/orthanc/instances/${instanceId}/file`
              });
            }
          } catch (instanceError) {
            console.warn('Instance 조회 실패:', instanceId, instanceError);
          }
        }
      }
      
      // 실제 Instances를 못 찾은 경우 Series 정보로 재시도
      if (instances.length === 0 && series.orthanc_series_id && 
          !series.orthanc_series_id.includes('dummy')) {
        
        console.log('📡 Series ID로 Instances 재조회:', series.orthanc_series_id);
        
        try {
          // ✅ OHIF 프록시를 통한 Series 조회
          const seriesResponse = await fetch(`${API_BASE}/api/ohif/orthanc/series/${series.orthanc_series_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (seriesResponse.ok) {
            const seriesData = await seriesResponse.json();
            console.log('📋 Series 데이터:', seriesData);
            
            if (seriesData.Instances && Array.isArray(seriesData.Instances)) {
              for (const instanceId of seriesData.Instances) {
                try {
                  const instanceResponse = await fetch(`${API_BASE}/api/ohif/orthanc/instances/${instanceId}`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (instanceResponse.ok) {
                    const instanceData = await instanceResponse.json();
                    const mainTags = instanceData.MainDicomTags || {};
                    
                    instances.push({
                      orthanc_instance_id: instanceId,
                      instance_number: parseInt(mainTags.InstanceNumber) || instances.length + 1,
                      sop_instance_uid: mainTags.SOPInstanceUID,
                      image_url: `${API_BASE}/api/ohif/orthanc/instances/${instanceId}/preview`,
                      dicom_url: `${API_BASE}/api/ohif/orthanc/instances/${instanceId}/file`
                    });
                  }
                } catch (instanceError) {
                  console.warn('Instance 재조회 실패:', instanceId, instanceError);
                }
              }
            }
          }
        } catch (seriesError) {
          console.warn('Series 재조회 실패:', seriesError);
        }
      }
      
      // 여전히 실제 Instances를 못 찾은 경우 알림
      if (instances.length === 0) {
        console.warn('❌ 실제 DICOM Instances를 찾을 수 없음');
        setError(`Series "${series.series_description}"에서 실제 DICOM 이미지를 찾을 수 없습니다.\n\nOrthanc에 DICOM 파일이 올바르게 업로드되었는지 확인해주세요.`);
        return;
      }
      
      // Instance Number로 정렬
      instances.sort((a, b) => a.instance_number - b.instance_number);
      setInstancesList(instances);
      
      console.log('✅ 실제 Instances 조회 완료:', instances.length, '개');
      
      // 첫 번째 이미지 표시
      if (instances.length > 0) {
        await displayDicomImage(instances[0], 0);
      }
      
    } catch (error) {
      console.error('❌ Instances 조회 실패:', error);
      setError(`DICOM 이미지 로드에 실패했습니다: ${error.message}`);
    } finally {
      setLoadingImages(false);
    }
  };

  // DICOM 이미지 표시
  const displayDicomImage = async (instance, index) => {
    try {
      setCurrentImageIndex(index);
      setCurrentImageElement(instance);
      
      console.log('🖼️ 이미지 표시:', instance.instance_number);
      
      // 이미지 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ 이미지 로드 성공');
        
        if (canvasRef.current && viewerRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // 캔버스 크기 설정
          const viewerRect = viewerRef.current.getBoundingClientRect();
          canvas.width = viewerRect.width;
          canvas.height = viewerRect.height;
          
          // 이미지 비율에 맞게 크기 계산
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          // 캔버스 클리어 및 이미지 그리기
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // 기존 어노테이션 다시 그리기
          drawAnnotationsOnCanvas();
        }
      };
      
      img.onerror = () => {
        console.error('❌ 이미지 로드 실패:', instance.image_url);
        setError('이미지를 불러올 수 없습니다.');
      };
      
      img.src = instance.image_url;
      
    } catch (error) {
      console.error('❌ 이미지 표시 실패:', error);
      setError('이미지 표시에 실패했습니다.');
    }
  };

  // 어노테이션 그리기
  const drawAnnotationsOnCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 기존 어노테이션 다시 그리기
    annotations.forEach(annotation => {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );
    });
  };

  // 도구 변경
  const changeTool = (tool) => {
    setCurrentTool(tool);
    console.log('🔧 도구 변경:', tool);
  };

  // 이미지 네비게이션
  const navigateImage = (direction) => {
    if (instancesList.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentImageIndex < instancesList.length - 1 ? currentImageIndex + 1 : 0;
    } else {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : instancesList.length - 1;
    }
    
    displayDicomImage(instancesList[newIndex], newIndex);
  };

  // 이미지 재생/일시정지
  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(playInterval);
      setPlayInterval(null);
      setIsPlaying(false);
    } else {
      const interval = setInterval(() => {
        navigateImage('next');
      }, 500); // 0.5초마다 다음 이미지
      setPlayInterval(interval);
      setIsPlaying(true);
    }
  };

  // 어노테이션 저장
  const saveAnnotations = async () => {
    if (!selectedStudy || !currentImageElement || annotations.length === 0) {
      alert('저장할 어노테이션이 없습니다.');
      return;
    }

    try {
      console.log('💾 어노테이션 저장:', annotations);
      
      // ✅ Django API를 통한 어노테이션 저장
      const response = await fetch(`${API_BASE}/api/dr_annotations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          study_instance_uid: selectedStudy.study_instance_uid,
          series_instance_uid: selectedSeries?.series_instance_uid,
          sop_instance_uid: currentImageElement.sop_instance_uid,
          annotations: annotations
        })
      });

      if (response.ok) {
        alert('어노테이션이 저장되었습니다.');
        console.log('✅ 어노테이션 저장 성공');
      } else {
        throw new Error(`저장 실패: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 어노테이션 저장 실패:', error);
      alert('어노테이션 저장에 실패했습니다.');
    }
  };

  // 어노테이션 로드
  const loadAnnotations = async () => {
    if (!selectedStudy || !currentImageElement) return;

    try {
      // ✅ Django API를 통한 어노테이션 로드
      const response = await fetch(
        `${API_BASE}/api/dr_annotations/${selectedStudy.study_instance_uid}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
        drawAnnotationsOnCanvas();
        console.log('✅ 어노테이션 로드 성공');
      }
    } catch (error) {
      console.error('어노테이션 로드 실패:', error);
    }
  };

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    if (selectedStudy) {
      fetchSeriesFromStudy(selectedStudy);
    }

    // 클린업
    return () => {
      if (playInterval) {
        clearInterval(playInterval);
      }
    };
  }, [selectedStudy, fetchSeriesFromStudy]);

  // 어노테이션 로드 (이미지 변경 시)
  useEffect(() => {
    if (currentImageElement) {
      loadAnnotations();
    }
  }, [currentImageElement]);

  // 캔버스 이벤트 핸들러
  const handleCanvasMouseDown = (e) => {
    if (currentTool !== 'rectangle') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 새 어노테이션 시작
    const newAnnotation = { x, y, width: 0, height: 0 };
    
    const handleMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - rect.left;
      const newY = moveEvent.clientY - rect.top;
      
      newAnnotation.width = newX - x;
      newAnnotation.height = newY - y;
      
      // 실시간 프리뷰
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 기존 이미지 다시 그리기 (실제로는 이미지 레이어가 별도로 있어야 함)
      drawAnnotationsOnCanvas();
      
      // 현재 그리는 사각형
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(newAnnotation.x, newAnnotation.y, newAnnotation.width, newAnnotation.height);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (Math.abs(newAnnotation.width) > 5 && Math.abs(newAnnotation.height) > 5) {
        setAnnotations(prev => [...prev, newAnnotation]);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 스타일 정의
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#2d2d2d',
      borderBottom: '1px solid #444'
    },
    content: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    sidebar: {
      width: '300px',
      backgroundColor: '#2a2a2a',
      borderRight: '1px solid #444',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    sidebarSection: {
      padding: '1rem',
      borderBottom: '1px solid #444'
    },
    seriesItem: {
      padding: '0.75rem',
      cursor: 'pointer',
      borderRadius: '4px',
      margin: '0.25rem 0',
      backgroundColor: '#3a3a3a',
      transition: 'background-color 0.2s'
    },
    seriesItemSelected: {
      backgroundColor: '#4a90e2'
    },
    mainArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem',
      backgroundColor: '#2d2d2d',
      borderBottom: '1px solid #444'
    },
    toolButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.5rem 0.75rem',
      backgroundColor: '#3a3a3a',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px'
    },
    toolButtonActive: {
      backgroundColor: '#4a90e2'
    },
    viewerArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    viewerContainer: {
      flex: 1,
      position: 'relative',
      backgroundColor: '#000',
      overflow: 'hidden'
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      cursor: 'crosshair'
    },
    imageNavigation: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '0.75rem',
      backgroundColor: '#2d2d2d'
    },
    navButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.5rem',
      backgroundColor: '#3a3a3a',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer'
    },
    errorMessage: {
      color: '#ff6b6b',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#2a2a2a'
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b7280'
    }
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>DICOM Viewer - 오류</h2>
          <button onClick={onClose} style={styles.toolButton}>✕ 닫기</button>
        </div>
        <div style={styles.errorMessage}>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError('');
              if (selectedStudy) fetchSeriesFromStudy(selectedStudy);
            }} 
            style={styles.toolButton}
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
          <h2>DICOM Viewer</h2>
          {selectedStudy && (
            <p style={{margin: 0, fontSize: '14px', color: '#ccc'}}>
              {selectedStudy.patient_name} | {selectedStudy.study_description} | {selectedStudy.study_date}
            </p>
          )}
        </div>
        <button onClick={onClose} style={styles.toolButton}>✕ 닫기</button>
      </div>

      <div style={styles.content}>
        {/* 사이드바 */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <h3 style={{margin: '0 0 1rem 0'}}>Series ({seriesList.length})</h3>
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              {seriesList.map((series, index) => (
                <div
                  key={series.orthanc_series_id || index}
                  onClick={() => fetchInstancesFromSeries(series)}
                  style={{
                    ...styles.seriesItem,
                    ...(selectedSeries?.orthanc_series_id === series.orthanc_series_id ? 
                        styles.seriesItemSelected : {})
                  }}
                >
                  <div style={{fontWeight: 'bold'}}>{series.series_description}</div>
                  <div style={{color: '#6b7280'}}>
                    #{series.series_number} | {series.instances_count} Images
                  </div>
                </div>
              ))}
            </div>
          </div>

          {loadingImages && (
            <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
              <RefreshCw className="animate-spin" size={16} />
              <div style={{fontSize: '12px'}}>Orthanc에서 데이터 로딩 중...</div>
            </div>
          )}
        </div>

        {/* 메인 뷰어 영역 */}
        <div style={styles.mainArea}>
          <div style={styles.viewerArea}>
            {/* 도구 모음 */}
            <div style={styles.toolbar}>
              <button
                onClick={() => changeTool('pan')}
                style={{...styles.toolButton, ...(currentTool === 'pan' ? styles.toolButtonActive : {})}}
              >
                <Move size={16} /> Pan
              </button>
              <button
                onClick={() => changeTool('zoom')}
                style={{...styles.toolButton, ...(currentTool === 'zoom' ? styles.toolButtonActive : {})}}
              >
                <ZoomIn size={16} /> Zoom
              </button>
              <button
                onClick={() => changeTool('wwwc')}
                style={{...styles.toolButton, ...(currentTool === 'wwwc' ? styles.toolButtonActive : {})}}
              >
                <Activity size={16} /> W/L
              </button>
              <button
                onClick={() => changeTool('rectangle')}
                style={{...styles.toolButton, ...(currentTool === 'rectangle' ? styles.toolButtonActive : {})}}
              >
                <Square size={16} /> Annotation
              </button>
              <button onClick={saveAnnotations} style={styles.toolButton}>
                <Save size={16} /> Save Ann.
              </button>
              <button 
                onClick={() => {
                  setAnnotations([]);
                  drawAnnotationsOnCanvas();
                }} 
                style={styles.toolButton}
              >
                <Trash2 size={16} /> Clear
              </button>
              
              {/* 현재 이미지 정보 */}
              {currentImageElement && (
                <div style={{marginLeft: 'auto', color: 'white', fontSize: '12px'}}>
                  Instance: {currentImageElement.instance_number} | 
                  {selectedSeries && ` ${selectedSeries.series_description}`}
                </div>
              )}
            </div>

            {/* DICOM 뷰어 */}
            <div style={styles.viewerContainer} ref={viewerRef}>
              {selectedStudy && selectedSeries ? (
                <canvas
                  ref={canvasRef}
                  style={styles.canvas}
                  onMouseDown={handleCanvasMouseDown}
                />
              ) : loading ? (
                <div style={styles.loadingMessage}>
                  <RefreshCw className="animate-spin" size={24} />
                  <p>Study 데이터를 불러오는 중...</p>
                </div>
              ) : (
                <div style={styles.loadingMessage}>
                  <p>Study를 선택해주세요</p>
                </div>
              )}
            </div>

            {/* 이미지 네비게이션 */}
            {instancesList.length > 0 && (
              <div style={styles.imageNavigation}>
                <button onClick={() => navigateImage('prev')} style={styles.navButton}>
                  <ChevronLeft size={16} /> 이전
                </button>
                
                <button onClick={togglePlayback} style={styles.navButton}>
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? ' 일시정지' : ' 재생'}
                </button>
                
                <span style={{color: '#ccc'}}>
                  {currentImageIndex + 1} / {instancesList.length}
                </span>
                
                <button onClick={() => navigateImage('next')} style={styles.navButton}>
                  다음 <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMViewer;