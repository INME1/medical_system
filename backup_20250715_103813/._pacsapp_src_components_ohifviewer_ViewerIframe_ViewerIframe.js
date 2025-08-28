// src/components/OHIFViewer/ViewerIframe/ViewerIframe.js
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import AnnotationOverlay from '../AnnotationTools/AnnotationOverlay';
import { transformBoundingBox } from '../../../utils/coordinateTransform';
import styles from './ViewerIframe.module.css';

const ViewerIframe = ({
  // AI 오버레이 관련
  analysisResults,
  overlays,
  showOverlays,
  onRecalculateOverlays,

  // 어노테이션 관련
  annotationProps,

  // 스터디 연동 관련
  currentStudyUID,
  onStudyChange,

  // 설정
  ohifUrl = "http://localhost:8042/ohif/",
  showDebugInfo = false,
  isLoading = false,
  error = null
}) => {
  const iframeRef = useRef(null);
  const resizeTimerRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('iframe');
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // 메모이제이션으로 불필요한 계산 방지
  const overlaysCount = useMemo(() => overlays?.length || 0, [overlays?.length]);
  
  // AI 분석 결과에서 해상도 정보 추출하는 함수
  const getImageDimensions = useCallback(() => {
    // 우선순위: analysisResults > overlays의 첫 번째 항목 > 기본값
    let imageWidth = analysisResults?.image_width || analysisResults?.metadata?.image_width;
    let imageHeight = analysisResults?.image_height || analysisResults?.metadata?.image_height;
    
    // analysisResults에 없으면 overlays에서 찾기
    if (!imageWidth || !imageHeight) {
      const firstOverlay = overlays?.[0];
      imageWidth = firstOverlay?.image_width || firstOverlay?.metadata?.image_width;
      imageHeight = firstOverlay?.image_height || firstOverlay?.metadata?.image_height;
    }
    
    // 여전히 없으면 기본값
    if (!imageWidth || !imageHeight) {
      console.warn('⚠️ 해상도 정보를 찾을 수 없어 기본값 사용: 512x512');
      imageWidth = 512;
      imageHeight = 512;
    }
    
    console.log(`📐 추출된 해상도: ${imageWidth}x${imageHeight}`);
    return { imageWidth: Number(imageWidth), imageHeight: Number(imageHeight) };
  }, [analysisResults, overlays]);

  // console.log를 useEffect로 이동
  useEffect(() => {
    console.log('📺 ViewerIframe 렌더링:', {
      overlays: overlaysCount,
      showOverlays,
      currentStudyUID,
      ohifUrl
    });
  }, [overlaysCount, showOverlays, currentStudyUID, ohifUrl]);

  // 동적 z-index 계산 - 메모이제이션
  const getZIndex = useCallback((layer) => {
    const baseZIndex = { iframe: 100, ai: 200, annotation: 300, modal: 400 };
    return activeLayer === layer ? baseZIndex[layer] + 1000 : baseZIndex[layer];
  }, [activeLayer]);

  // onRecalculateOverlays를 useCallback으로 안정화
  const stableOnRecalculateOverlays = useCallback(() => {
    if (onRecalculateOverlays) {
      onRecalculateOverlays();
    }
  }, [onRecalculateOverlays]);

  // 창 포커스 관리
  useEffect(() => {
    const handleWindowBlur = () => {
      console.log('🌫️ 창 포커스 잃음');
    };

    const handleWindowFocus = () => {
      console.log('🌟 창 포커스 복원');
      setIsWindowFocused(true);
      setTimeout(() => stableOnRecalculateOverlays(), 100);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🌫️ 탭 숨김');
      } else {
        console.log('🌟 탭 표시');
        setIsWindowFocused(true);
        setTimeout(() => stableOnRecalculateOverlays(), 100);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stableOnRecalculateOverlays]);

  // 리사이즈 감지
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (overlaysCount > 0 && showOverlays) {
          console.log('🔄 리사이즈 감지 - 오버레이 재계산');
          stableOnRecalculateOverlays();
        }
      }, 150);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(iframe);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [overlaysCount, showOverlays, stableOnRecalculateOverlays]);

  // 핸들러들 - 메모이제이션
  const handleIframeLoad = useCallback(() => {
    console.log('📺 OHIF iframe 로딩 완료');
    if (overlaysCount > 0) {
      setTimeout(() => stableOnRecalculateOverlays(), 500);
    }
  }, [overlaysCount, stableOnRecalculateOverlays]);

  const handleIframeError = useCallback(() => {
    console.error('❌ OHIF iframe 로딩 실패');
  }, []);

  const handleIframeClick = useCallback(() => {
    setActiveLayer('iframe');
  }, []);

  const handleAIOverlayClick = useCallback(() => {
    setActiveLayer('ai');
  }, []);

  const handleAnnotationStart = useCallback(() => {
    setActiveLayer('annotation');
  }, []);

  const handleModalOpen = useCallback(() => {
    setActiveLayer('modal');
  }, []);

  const forceShowOverlays = useCallback(() => {
    console.log('🔥 오버레이 강제 표시');
    setIsWindowFocused(true);
    stableOnRecalculateOverlays();
  }, [stableOnRecalculateOverlays]);

  // 오버레이 렌더링 로직
  const overlayElements = useMemo(() => {
    if (!overlays || overlaysCount === 0) return null;

    console.log('🔥 오버레이 렌더링 체크:', {
      showOverlays,
      overlaysLength: overlaysCount,
      isWindowFocused,
      overlaysData: overlays
    });

    // 해상도 정보 가져오기
    const { imageWidth, imageHeight } = getImageDimensions();

    return overlays.map((overlay, index) => {
      console.log(`🎯 오버레이 [${index}] 렌더링:`, overlay);
      
      // bbox 형식 정규화 (AI 서비스 결과에 맞춰)
      let bbox;
      if (overlay.bbox) {
        // AI 서비스에서 오는 형식: [x1, y1, x2, y2] 또는 {x, y, width, height}
        if (Array.isArray(overlay.bbox) && overlay.bbox.length === 4) {
          bbox = overlay.bbox; // [x1, y1, x2, y2]
        } else if (overlay.bbox.x !== undefined) {
          // {x, y, width, height} → [x1, y1, x2, y2] 변환
          const { x, y, width, height } = overlay.bbox;
          bbox = [x, y, x + width, y + height];
        }
      }
      
      if (!bbox) {
        console.log(`❌ 박스 정보 없음 [${index}]`);
        return null;
      }

      console.log(`📐 해상도 [${index}]:`, { imageWidth, imageHeight });
      console.log(`📦 원본 bbox [${index}]:`, bbox);

      // 좌표 변환
      const transformedBox = transformBoundingBox(bbox, imageWidth, imageHeight, iframeRef.current);

      console.log(`📦 변환된 박스 [${index}]:`, transformedBox);

      if (!transformedBox) {
        console.log(`❌ 박스 변환 실패 [${index}]`);
        return null;
      }

      const isHighConfidence = (overlay.confidence || overlay.confidence_score || 0) > 0.8;
      const isSmallBox = transformedBox.height <= 25;

      return (
        <div
          key={`overlay-${index}-${bbox.join('-')}`}
          style={{
            position: 'absolute',
            left: transformedBox.left + 'px',
            top: transformedBox.top + 'px',
            width: transformedBox.width + 'px',
            height: transformedBox.height + 'px',
            border: `3px solid ${isHighConfidence ? '#00ff00' : '#ffff00'}`,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            pointerEvents: 'auto',
            boxSizing: 'border-box',
            display: 'block !important',
            visibility: 'visible !important',
            opacity: 1
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log(`🎯 오버레이 [${index}] 클릭됨:`, overlay);
          }}
        >
          {!isSmallBox && (
            <div
              style={{
                position: 'absolute',
                top: '-25px',
                left: '0',
                background: isHighConfidence ? '#00ff00' : '#ffff00',
                color: '#000',
                padding: '2px 6px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                borderRadius: '3px'
              }}
            >
              {overlay.label || overlay.class_name} ({Math.round((overlay.confidence || overlay.confidence_score || 0) * 100)}%)
            </div>
          )}
        </div>
      );
    });
  }, [overlays, overlaysCount, getImageDimensions]);


  
  return (
    <div
      className={styles.viewerContainer}
      style={{
        '--z-iframe': getZIndex('iframe'),
        '--z-ai': getZIndex('ai'),
        '--z-annotation': getZIndex('annotation'),
        '--z-modal': getZIndex('modal')
      }}
    >
      {/* OHIF Viewer */}
      <iframe
        ref={iframeRef}
        src={ohifUrl}
        className={styles.ohifIframe}
        title="OHIF Viewer"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        onClick={handleIframeClick}
      />

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          분석 중...
        </div>
      )}

      {/* 에러 오버레이 */}
      {error && (
        <div className={styles.errorOverlay}>
          ❌ 오류 발생<br />
          {error}
        </div>
      )}

      {/* 어노테이션 오버레이 */}
      <AnnotationOverlay
        {...annotationProps}
        onDrawingStart={handleAnnotationStart}
        onModalOpen={handleModalOpen}
      />

      {/* AI 오버레이 */}
      {overlaysCount > 0 && (
        <div
          className={styles.aiOverlayContainer}
          onClick={handleAIOverlayClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 200,
            backgroundColor: showDebugInfo ? 'rgba(255, 0, 0, 0.05)' : 'transparent'
          }}
        >
          {overlayElements}
        </div>
      )}

      {/* 디버그 정보 */}
      {showDebugInfo && (
        <div className={styles.debugInfo}>
          <div><strong>🐛 디버그 정보</strong></div>
          <div><strong>📂 현재 스터디:</strong> {currentStudyUID || 'none'}</div>
          <div><strong>🪟 창 포커스:</strong> {isWindowFocused ? '✅' : '❌'}</div>
          <div><strong>📐 이미지 해상도:</strong> {(() => {
            const { imageWidth, imageHeight } = getImageDimensions();
            return `${imageWidth}x${imageHeight}`;
          })()}</div>
          <div><strong>overlays:</strong> {overlaysCount}개</div>
          <div><strong>showOverlays:</strong> {showOverlays ? '✅' : '❌'}</div>
          <div><strong>🎯 활성 레이어:</strong> {activeLayer}</div>
          <button 
            onClick={forceShowOverlays}
            style={{
              margin: '5px 0',
              padding: '5px 10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🔥 오버레이 강제 표시
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewerIframe;