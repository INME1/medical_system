// /home/medical_system/pacsapp/src/hooks/viewer_v2/useMeasurements.js

import { useState, useCallback } from 'react';

const useMeasurements = () => {
  const [measurements, setMeasurements] = useState([]);
  const [manualAnnotations, setManualAnnotations] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  // 측정값 추가
  const addMeasurement = useCallback((measurementData) => {
    const newMeasurement = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      visible: true, // 🔥 기본값 true 명시적 설정
      ...measurementData
    };

    console.log('➕ useMeasurements - 새 측정값 추가:', newMeasurement);
    setMeasurements(prev => {
      const updated = [...prev, newMeasurement];
      console.log('➕ useMeasurements - 업데이트된 측정값 목록:', updated.length);
      return updated;
    });
    return newMeasurement;
  }, []);

  // 길이 측정 추가
  const addLengthMeasurement = useCallback((startPoint, endPoint, slice, pixelSpacing = { x: 1, y: 1 }) => {
    const deltaX = (endPoint.x - startPoint.x) * pixelSpacing.x;
    const deltaY = (endPoint.y - startPoint.y) * pixelSpacing.y;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const measurement = {
      type: 'length',
      value: `${length.toFixed(1)} mm`,
      rawValue: length,
      startPoint,
      endPoint,
      slice,
      coords: `시작: (${startPoint.x}, ${startPoint.y}), 끝: (${endPoint.x}, ${endPoint.y})`,
      unit: 'mm',
      visible: true // 🔥 기본값 true
    };

    return addMeasurement(measurement);
  }, [addMeasurement]);

  // 사각형 ROI 측정 추가
  const addRectangleROI = useCallback((startPoint, endPoint, slice, pixelSpacing = { x: 1, y: 1 }, pixelData = null) => {
    const width = Math.abs(endPoint.x - startPoint.x) * pixelSpacing.x;
    const height = Math.abs(endPoint.y - startPoint.y) * pixelSpacing.y;
    const area = width * height;

    let averageHU = 'N/A';
    if (pixelData) {
      // 실제 환경에서는 픽셀 데이터로부터 HU 값 계산
      averageHU = Math.round(Math.random() * 100 - 50); // 모의 HU 값
    }

    const measurement = {
      type: 'rectangle',
      value: `면적: ${area.toFixed(1)} mm², 평균 HU: ${averageHU}`,
      rawValue: { area, averageHU, width, height },
      startPoint,
      endPoint,
      slice,
      coords: `x:${Math.min(startPoint.x, endPoint.x)}, y:${Math.min(startPoint.y, endPoint.y)}, w:${Math.abs(endPoint.x - startPoint.x)}, h:${Math.abs(endPoint.y - startPoint.y)}`,
      unit: 'mm²',
      visible: true // 🔥 기본값 true
    };

    return addMeasurement(measurement);
  }, [addMeasurement]);

  // 원형 ROI 측정 추가
  const addCircleROI = useCallback((centerPoint, radius, slice, pixelSpacing = { x: 1, y: 1 }, pixelData = null) => {
    const radiusMM = radius * Math.min(pixelSpacing.x, pixelSpacing.y);
    const area = Math.PI * radiusMM * radiusMM;

    let averageHU = 'N/A';
    if (pixelData) {
      averageHU = Math.round(Math.random() * 100 - 50); // 모의 HU 값
    }

    const measurement = {
      type: 'circle',
      value: `반지름: ${radiusMM.toFixed(1)} mm, 평균 HU: ${averageHU}`,
      rawValue: { radius: radiusMM, area, averageHU },
      centerPoint,
      radius,
      slice,
      coords: `중심: (${centerPoint.x}, ${centerPoint.y}), 반지름: ${radius}px`,
      unit: 'mm',
      visible: true // 🔥 기본값 true
    };

    return addMeasurement(measurement);
  }, [addMeasurement]);

  // 각도 측정 추가
  const addAngleMeasurement = useCallback((point1, point2, point3, slice) => {
    // 세 점으로 각도 계산
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };

    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    const angle = Math.acos(dot / (magnitude1 * magnitude2)) * (180 / Math.PI);

    const measurement = {
      type: 'angle',
      value: `${angle.toFixed(1)}°`,
      rawValue: angle,
      point1,
      point2,
      point3,
      slice,
      coords: `각도: ${angle.toFixed(1)}°`,
      unit: '°',
      visible: true // 🔥 기본값 true
    };

    return addMeasurement(measurement);
  }, [addMeasurement]);

  // 측정값 삭제
  const deleteMeasurement = useCallback((measurementId) => {
    console.log('🗑️ useMeasurements - 측정값 삭제:', measurementId);
    setMeasurements(prev => {
      const updated = prev.filter(m => m.id !== measurementId);
      console.log('🗑️ useMeasurements - 삭제 후 남은 측정값:', updated.length);
      return updated;
    });
    if (selectedMeasurement?.id === measurementId) {
      setSelectedMeasurement(null);
    }
  }, [selectedMeasurement]);

  // 모든 측정값 삭제
  const clearAllMeasurements = useCallback(() => {
    console.log('🗑️ useMeasurements - 모든 측정값 삭제');
    setMeasurements([]);
    setManualAnnotations([]);
    setSelectedMeasurement(null);
  }, []);

  // 수동 주석 추가
  const addManualAnnotation = useCallback((annotationData) => {
    const newAnnotation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      visible: true,
      ...annotationData
    };

    console.log('📝 useMeasurements - 새 주석 추가:', newAnnotation);
    setManualAnnotations(prev => {
      const updated = [...prev, newAnnotation];
      console.log('📝 useMeasurements - 업데이트된 주석 목록:', updated);
      return updated;
    });
    return newAnnotation;
  }, []);

  // 수동 주석 삭제
  const deleteManualAnnotation = useCallback((annotationId) => {
    console.log('🗑️ useMeasurements - 주석 삭제:', annotationId);
    setManualAnnotations(prev => {
      const updated = prev.filter(a => a.id !== annotationId);
      console.log('🗑️ useMeasurements - 업데이트된 주석 목록:', updated);
      return updated;
    });
  }, []);

  // 수동 주석 편집
  const editManualAnnotation = useCallback((updatedAnnotation) => {
    console.log('✏️ useMeasurements - 주석 편집 시작:', updatedAnnotation);
    
    setManualAnnotations(prev => {
      const updated = prev.map(annotation => {
        if (annotation.id === updatedAnnotation.id) {
          const editedAnnotation = {
            ...annotation,
            ...updatedAnnotation,
            timestamp: annotation.timestamp,
            updatedAt: new Date().toISOString()
          };
          console.log('✏️ useMeasurements - 수정된 주석:', editedAnnotation);
          return editedAnnotation;
        }
        return annotation;
      });
      
      console.log('✏️ useMeasurements - 전체 주석 목록 업데이트:', updated);
      return updated;
    });
  }, []);

  // 🔥 수정: 측정값 표시/숨김 토글 - 로직 오류 수정
  const toggleMeasurementVisibility = useCallback((measurementId) => {
    console.log('🔧 useMeasurements - 측정값 표시/숨김 토글:', measurementId);
    
    setMeasurements(prev => {
      const updated = prev.map(measurement => {
        if (measurement.id === measurementId) {
          // 🔥 핵심 수정: visible이 undefined이면 true(표시)로 간주하고 토글
          const currentVisible = measurement.visible !== false; // undefined나 true면 true
          const newVisible = !currentVisible;
          
          console.log(`🔧 측정값 ${measurementId}: ${measurement.visible}(${currentVisible}) → ${newVisible}`);
          return { ...measurement, visible: newVisible };
        }
        return measurement;
      });
      
      console.log('🔧 업데이트된 measurements:', updated.map(m => ({
        id: m.id,
        visible: m.visible,
        source: m.source,
        type: m.type
      })));
      return updated;
    });
    
    // 🔥 측정값 토글 후 상태 확인
    setTimeout(() => {
      console.log('🔧 토글 후 measurementsList 상태 확인');
    }, 100);
  }, []);

  // 🔥 수정: 주석 표시/숨김 토글 - 개선된 로깅
  const toggleAnnotationVisibility = useCallback((annotationId) => {
    console.log('👁️ useMeasurements - 주석 표시/숨김 토글:', annotationId);
    
    setManualAnnotations(prev => {
      const updated = prev.map(annotation => {
        if (annotation.id === annotationId) {
          const newVisible = !annotation.visible;
          console.log(`👁️ useMeasurements - 주석 ${annotationId} visible: ${annotation.visible} → ${newVisible}`);
          return { ...annotation, visible: newVisible };
        }
        return annotation;
      });
      console.log('👁️ useMeasurements - 업데이트된 주석들:', updated);
      return updated;
    });
  }, []);

  // 측정값 내보내기 (CSV 형식)
  const exportMeasurements = useCallback(() => {
    const headers = ['ID', 'Type', 'Value', 'Slice', 'Coords', 'Timestamp'];
    const csvData = measurements.map(m => [
      m.id,
      m.type,
      m.value,
      m.slice,
      m.coords,
      new Date(m.timestamp).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `measurements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [measurements]);

  // 통계 계산
  const getMeasurementStats = useCallback(() => {
    const totalCount = measurements.length;
    const typeCount = measurements.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {});

    const sliceDistribution = measurements.reduce((acc, m) => {
      acc[m.slice] = (acc[m.slice] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCount,
      typeCount,
      sliceDistribution,
      annotationCount: manualAnnotations.length
    };
  }, [measurements, manualAnnotations]);

  return {
    measurements,
    setMeasurements,
    manualAnnotations,
    setManualAnnotations,
    selectedMeasurement,
    setSelectedMeasurement,
    addMeasurement,
    addLengthMeasurement,
    addRectangleROI,
    addCircleROI,
    addAngleMeasurement,
    deleteMeasurement,
    clearAllMeasurements,
    addManualAnnotation,
    deleteManualAnnotation,
    editManualAnnotation,
    toggleAnnotationVisibility,
    toggleMeasurementVisibility,
    exportMeasurements,
    getMeasurementStats
  };
};

export default useMeasurements;