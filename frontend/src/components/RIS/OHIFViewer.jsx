import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

// ========== OHIF 서비스 컨텍스트 ==========
const OHIFServiceContext = createContext();

// OHIF 서비스 훅
export const useOHIFService = () => {
  const context = useContext(OHIFServiceContext);
  if (!context) {
    throw new Error('useOHIFService must be used within OHIFServiceProvider');
  }
  return context;
};

// ========== OHIF 서비스 클래스 ==========
class OHIFViewerService {
  constructor() {
    this.viewers = new Map(); // 여러 뷰어 인스턴스 관리
    this.config = this.getDefaultConfig();
    this.isInitialized = false;
  }

  getDefaultConfig() {
    return {
      // 기본 데이터 완전 비활성화
      showStudyList: false,
      disableStudyList: true,
      studyListFunctionsEnabled: false,
      disableServersCache: true,
      
      // Orthanc 연동
      dataSources: [{
        sourceName: 'orthanc-dicomweb',
        type: 'dicomweb',
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true
      }],
      
      // 필수 확장만
      extensions: [
        '@ohif/extension-default',
        '@ohif/extension-cornerstone'
      ],
      
      modes: ['@ohif/mode-longitudinal'],
      defaultMode: '@ohif/mode-longitudinal',
      
      // UI 커스터마이징
      whiteLabeling: {
        createLogoComponentFn: function(React) {
          return React.createElement('div', {
            style: {
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }
          }, [
            React.createElement('span', { key: 'icon' }, '🏥'),
            React.createElement('span', { key: 'text' }, 'Medical Platform')
          ]);
        }
      },
      
      // 성능 최적화
      maxNumberOfWebWorkers: 4,
      investigationalUseDialog: { option: 'never' },
      showErrorDialog: false
    };
  }

  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // OHIF 라이브러리 로드 확인
      if (!window.OHIF) {
        await this.loadOHIFLibrary();
      }
      
      // CSS 스타일 적용 (기본 요소 숨기기)
      this.injectCustomStyles();
      
      this.isInitialized = true;
      console.log('✅ OHIF 서비스 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('❌ OHIF 서비스 초기화 실패:', error);
      return false;
    }
  }

  async loadOHIFLibrary() {
    return new Promise((resolve, reject) => {
      // OHIF 라이브러리가 이미 로드되어 있는지 확인
      if (window.OHIF) {
        resolve();
        return;
      }

      // 동적으로 OHIF 스크립트 로드
      const script = document.createElement('script');
      script.src = '/ohif/viewer.js'; // OHIF 빌드 파일 경로
      script.onload = () => {
        if (window.OHIF) {
          resolve();
        } else {
          reject(new Error('OHIF 라이브러리 로드 실패'));
        }
      };
      script.onerror = () => reject(new Error('OHIF 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  injectCustomStyles() {
    const styleId = 'ohif-custom-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 기본 StudyList 숨기기 */
      [data-cy="study-list"],
      .study-list-container,
      .study-browser,
      [class*="StudyList"] {
        display: none !important;
      }
      
      /* 데모 데이터 패널 숨기기 */
      .demo-data-panel,
      .sample-data,
      [data-cy="demo-studies"] {
        display: none !important;
      }
      
      /* 업로드 버튼 숨기기 */
      [data-cy="upload-study"],
      .upload-study-button {
        display: none !important;
      }
      
      /* 서버 선택 UI 숨기기 */
      .servers-list,
      .data-source-picker {
        display: none !important;
      }
      
      /* OHIF 뷰어 전체 화면 스타일 */
      .ohif-viewer-container {
        width: 100% !important;
        height: 100% !important;
        background: #000 !important;
      }
      
      /* 커스텀 로딩 스타일 */
      .medical-platform-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #fff;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  }

  async createViewer(containerId, studyInstanceUID, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const container = document.getElementById(containerId) || containerId;
      if (!container) {
        throw new Error(`Container not found: ${containerId}`);
      }

      // 로딩 표시
      this.showLoading(container);

      const viewerConfig = {
        ...this.config,
        ...options.config,
        studyInstanceUIDs: [studyInstanceUID]
      };

      let viewerInstance;
      
      if (window.OHIF?.viewer) {
        // OHIF 뷰어 생성
        viewerInstance = await window.OHIF.viewer.create({
          container: container,
          config: viewerConfig
        });
        
        // 뷰어 인스턴스 저장
        this.viewers.set(containerId, viewerInstance);
        
        console.log(`✅ OHIF 뷰어 생성됨: ${containerId}`);
        
      } else {
        // OHIF 없으면 폴백 뷰어
        viewerInstance = this.createFallbackViewer(container, studyInstanceUID, options);
      }

      // 로딩 숨기기
      this.hideLoading(container);
      
      return viewerInstance;
      
    } catch (error) {
      console.error('OHIF 뷰어 생성 실패:', error);
      this.createErrorViewer(container, error.message);
      return null;
    }
  }

  createFallbackViewer(container, studyInstanceUID, options = {}) {
    const patientData = options.patientData || {};
    
    container.innerHTML = `
      <div class="ohif-viewer-container" style="
        width: 100%; 
        height: 100%; 
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: #fff; 
        display: flex; 
        flex-direction: column;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      ">
        <!-- 헤더 -->
        <div style="
          padding: 15px 20px; 
          background: rgba(0,0,0,0.4); 
          border-bottom: 1px solid #444;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <h3 style="margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>🏥</span>
              <span>Medical Platform DICOM Viewer</span>
            </h3>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">
              ${patientData.patient_name || 'Unknown Patient'} | 
              ${patientData.modality || 'Unknown'} | 
              ${patientData.body_part || ''}
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.medicalPlatform.ohifService.refreshViewer('${container.id}')" style="
              padding: 6px 12px;
              background: #28a745;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">🔄 새로고침</button>
            <button onclick="window.medicalPlatform.ohifService.closeViewer('${container.id}')" style="
              padding: 6px 12px;
              background: #dc3545;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">✕ 닫기</button>
          </div>
        </div>
        
        <!-- 메인 뷰어 영역 -->
        <div style="flex: 1; display: flex;">
          <!-- DICOM 이미지 영역 -->
          <div style="flex: 1; display: flex; justify-content: center; align-items: center; position: relative;">
            <div id="dicom-canvas-${container.id}" style="
              width: 80%;
              height: 80%;
              background: #333;
              border: 2px solid #555;
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
            ">
              <div style="text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.6;">📷</div>
                <h4 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 300;">
                  DICOM 이미지 영역
                </h4>
                <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.8;">
                  Study UID: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 12px;">
                    ${studyInstanceUID || '미설정'}
                  </code>
                </p>
                
                ${studyInstanceUID ? `
                  <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button onclick="window.open('http://localhost:8042/app/explorer.html#study?uuid=${studyInstanceUID}', '_blank')" style="
                      padding: 8px 16px;
                      background: #007bff;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 14px;
                    ">🔗 Orthanc에서 열기</button>
                    
                    <button onclick="window.medicalPlatform.ohifService.loadDICOMImage('${container.id}', '${studyInstanceUID}')" style="
                      padding: 8px 16px;
                      background: #28a745;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 14px;
                    ">📷 이미지 로드</button>
                  </div>
                ` : `
                  <div style="padding: 15px; background: rgba(220,53,69,0.2); border: 1px solid #dc3545; border-radius: 6px; margin: 20px;">
                    <div style="font-size: 16px; margin-bottom: 8px;">⚠️ Study UID 누락</div>
                    <div style="font-size: 14px; opacity: 0.9;">DICOM 이미지를 표시하려면 Study UID가 필요합니다</div>
                  </div>
                `}
              </div>
            </div>
          </div>
          
          <!-- 사이드 패널 -->
          <div style="
            width: 280px;
            background: rgba(0,0,0,0.3);
            border-left: 1px solid #444;
            padding: 20px;
            overflow-y: auto;
          ">
            <h4 style="margin-top: 0; color: #fff;">📋 환자 정보</h4>
            
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="margin: 8px 0;"><strong>환자명:</strong> ${patientData.patient_name || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>환자번호:</strong> ${patientData.patient_id || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>검사종류:</strong> ${patientData.modality || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>검사부위:</strong> ${patientData.body_part || 'N/A'}</p>
            </div>
            
            <h4 style="color: #fff;">🛠️ 뷰어 도구</h4>
            <div style="display: grid; gap: 8px;">
              <button onclick="window.medicalPlatform.ohifService.zoomIn('${container.id}')" style="
                padding: 8px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">🔍+ 확대</button>
              
              <button onclick="window.medicalPlatform.ohifService.zoomOut('${container.id}')" style="
                padding: 8px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">🔍- 축소</button>
              
              <button onclick="window.medicalPlatform.ohifService.resetView('${container.id}')" style="
                padding: 8px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">🔄 리셋</button>
              
              <button onclick="window.medicalPlatform.ohifService.toggleFullscreen('${container.id}')" style="
                padding: 8px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">⛶ 전체화면</button>
            </div>
          </div>
        </div>
        
        <!-- 하단 상태바 -->
        <div style="
          padding: 8px 20px; 
          background: rgba(0,0,0,0.4); 
          border-top: 1px solid #444;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="opacity: 0.7;">
            🏥 Medical Platform DICOM Viewer v1.0
          </div>
          <div style="opacity: 0.7;">
            📡 Connected to Orthanc (35.221.63.41:8042)
          </div>
        </div>
      </div>
    `;

    // 폴백 뷰어 객체 반환
    return {
      id: container.id,
      type: 'fallback',
      studyInstanceUID,
      container,
      destroy: () => this.destroyViewer(container.id)
    };
  }

  createErrorViewer(container, errorMessage) {
    container.innerHTML = `
      <div style="
        width: 100%; 
        height: 100%; 
        background: #2c3e50;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      ">
        <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.7;">⚠️</div>
        <h3 style="margin: 0 0 15px 0;">DICOM 뷰어 로드 실패</h3>
        <p style="text-align: center; max-width: 400px; opacity: 0.8; line-height: 1.5;">
          ${errorMessage}
        </p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">🔄 페이지 새로고침</button>
      </div>
    `;
  }

  showLoading(container) {
    const loading = document.createElement('div');
    loading.className = 'medical-platform-loading';
    loading.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px; animation: spin 2s linear infinite;">🔄</div>
        <div style="font-size: 18px; margin-bottom: 10px;">DICOM 뷰어 로딩 중...</div>
        <div style="font-size: 14px; opacity: 0.7;">Medical Platform에서 제공하는 뷰어를 초기화하고 있습니다</div>
      </div>
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    container.appendChild(loading);
  }

  hideLoading(container) {
    const loading = container.querySelector('.medical-platform-loading');
    if (loading) {
      loading.remove();
    }
  }

  // 뷰어 제어 메서드들
  refreshViewer(containerId) {
    const viewer = this.viewers.get(containerId);
    if (viewer && viewer.refresh) {
      viewer.refresh();
    } else {
      location.reload();
    }
  }

  closeViewer(containerId) {
    this.destroyViewer(containerId);
    // 부모 컴포넌트에 닫기 이벤트 전달
    window.dispatchEvent(new CustomEvent('ohifViewerClose', { 
      detail: { containerId } 
    }));
  }

  destroyViewer(containerId) {
    const viewer = this.viewers.get(containerId);
    if (viewer && viewer.destroy) {
      viewer.destroy();
    }
    this.viewers.delete(containerId);
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  // 뷰어 도구 메서드들 (폴백 뷰어용)
  zoomIn(containerId) {
    console.log(`Zoom in: ${containerId}`);
  }

  zoomOut(containerId) {
    console.log(`Zoom out: ${containerId}`);
  }

  resetView(containerId) {
    console.log(`Reset view: ${containerId}`);
  }

  toggleFullscreen(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  }

  loadDICOMImage(containerId, studyInstanceUID) {
    console.log(`Loading DICOM: ${studyInstanceUID} in ${containerId}`);
    // 실제 DICOM 로딩 로직 구현
  }

  // 전역 객체에 서비스 등록
  registerGlobal() {
    if (!window.medicalPlatform) {
      window.medicalPlatform = {};
    }
    window.medicalPlatform.ohifService = this;
  }
}

// ========== OHIF 서비스 프로바이더 ==========
export const OHIFServiceProvider = ({ children }) => {
  const [service] = useState(() => {
    const ohifService = new OHIFViewerService();
    ohifService.registerGlobal(); // 전역 접근 가능하게 등록
    return ohifService;
  });
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    service.initialize().then(setIsReady);
  }, [service]);

  const createViewer = useCallback((containerId, studyInstanceUID, options) => {
    return service.createViewer(containerId, studyInstanceUID, options);
  }, [service]);

  const destroyViewer = useCallback((containerId) => {
    service.destroyViewer(containerId);
  }, [service]);

  const value = {
    service,
    isReady,
    createViewer,
    destroyViewer
  };

  return (
    <OHIFServiceContext.Provider value={value}>
      {children}
    </OHIFServiceContext.Provider>
  );
};

// ========== OHIF 뷰어 컴포넌트 ==========
export const OHIFViewer = ({ 
  studyInstanceUID, 
  patientData, 
  width = '100%', 
  height = '100%',
  onClose,
  className = ''
}) => {
  const { createViewer, destroyViewer, isReady } = useOHIFService();
  const containerRef = useRef(null);
  const [viewerId] = useState(`ohif-viewer-${Date.now()}`);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    if (isReady && studyInstanceUID && containerRef.current) {
      initializeViewer();
    }

    return () => {
      if (viewer) {
        destroyViewer(viewerId);
      }
    };
  }, [isReady, studyInstanceUID]);

  useEffect(() => {
    // 뷰어 닫기 이벤트 리스너
    const handleClose = (event) => {
      if (event.detail.containerId === viewerId && onClose) {
        onClose();
      }
    };

    window.addEventListener('ohifViewerClose', handleClose);
    return () => window.removeEventListener('ohifViewerClose', handleClose);
  }, [viewerId, onClose]);

  const initializeViewer = async () => {
    try {
      const viewerInstance = await createViewer(viewerId, studyInstanceUID, {
        patientData,
        config: {
          // 추가 설정이 필요하면 여기에
        }
      });
      setViewer(viewerInstance);
    } catch (error) {
      console.error('뷰어 초기화 실패:', error);
    }
  };

  if (!isReady) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
          <div>OHIF 서비스 초기화 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      id={viewerId}
      className={className}
      style={{ 
        width, 
        height,
        position: 'relative',
        background: '#000'
      }}
    />
  );
};

// ========== 사용 예시 컴포넌트 ==========
export const MedicalPlatformViewer = () => {
  const [currentStudy, setCurrentStudy] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  const sampleStudy = {
    studyInstanceUID: '1.2.3.4.5.6.7.8.9',
    patientData: {
      patient_name: '홍길동',
      patient_id: 'P123456',
      modality: 'CT',
      body_part: 'CHEST'
    }
  };

  const handleOpenViewer = (study) => {
    setCurrentStudy(study);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setCurrentStudy(null);
  };

  return (
    <OHIFServiceProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {!showViewer ? (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: '#f8f9fa'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2>🏥 Medical Platform DICOM Viewer</h2>
              <p>아래 버튼을 클릭하여 DICOM 뷰어를 시작하세요</p>
              <button
                onClick={() => handleOpenViewer(sampleStudy)}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📷 DICOM 뷰어 열기
              </button>
            </div>
          </div>
        ) : (
          <OHIFViewer
            studyInstanceUID={currentStudy.studyInstanceUID}
            patientData={currentStudy.patientData}
            onClose={handleCloseViewer}
          />
        )}
      </div>
    </OHIFServiceProvider>
  );
};