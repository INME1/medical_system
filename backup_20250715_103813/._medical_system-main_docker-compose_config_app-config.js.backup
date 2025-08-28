window.config = {
  routerBasename: '/',
  
  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone'
  ],
  
  modes: [
    '@ohif/mode-basic-viewer'
  ],
  
  defaultMode: '@ohif/mode-basic-viewer',
  
  showStudyList: true,
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: false,
  
  investigationalUseDialog: {
    option: 'never'
  },
  
  // ✅ 수정된 데이터 소스 설정
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Medical Platform Orthanc',
        name: 'orthanc',
        
        // ✅ 올바른 DICOMweb 엔드포인트 (브라우저에서 접근)
        wadoUriRoot: 'http://35.225.63.41:8042/wado',
        qidoRoot: 'http://35.225.63.41:8042/dicom-web',
        wadoRoot: 'http://35.225.63.41:8042/dicom-web',
        
        // 렌더링 설정
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        
        // ✅ 인증 설정
        requestOptions: {
          requestCredentials: 'include',
          headers: {
            'Authorization': 'Basic b3J0aGFuYzpvcnRoYW5j'  // orthanc:orthanc
          }
        },
        
        // 메타데이터 설정
        qidoSupportsIncludeField: false,
        supportsInstanceMetadata: true,
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        
        // 성능 최적화
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies'
        }
      }
    }
  ],
  
  // 뷰어 설정
  cornerstoneExtensionConfig: {
    maxWebWorkers: navigator.hardwareConcurrency || 4,
    preferSizeOverAccuracy: false,
    useSharedArrayBuffer: 'AUTO'
  },
  
  // UI 커스터마이징
  customization: {
    hideStudyBrowser: false,
    hideHeader: false,
    
    customHeader: {
      title: 'Medical Platform DICOM Viewer',
      subtitle: 'CDSS Integration with OHIF'
    }
  },
  
  // 고급 설정
  maxCacheSize: 3e9, // 3GB
  showErrorDialog: false,
  useSharedArrayBuffer: 'AUTO',
  
  // 핫키 설정
  hotkeys: [
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['tab']
    },
    {
      commandName: 'decrementActiveViewport', 
      label: 'Previous Viewport',
      keys: ['shift', 'tab']
    }
  ]
};