// // /home/medical_system/pacsapp/src/components/viewer_v2/Common/LabelingForm.js

// import React, { useState, useEffect } from 'react';
// import Button from './Button';
// import './LabelingForm.css';

// const LabelingForm = ({ 
//   measurement,
//   currentSlice,
//   onSave,
//   onCancel
// }) => {
//   const [label, setLabel] = useState('');
//   const [memo, setMemo] = useState('');

//   // 컴포넌트 마운트시 초기화
//   useEffect(() => {
//     setLabel('');
//     setMemo('');
//   }, [measurement]);

//   const handleSave = () => {
//     if (!label.trim()) {
//       alert('라벨을 입력해주세요.');
//       return;
//     }

//     // 좌표 포맷팅
//     const coords = formatCoordinates(measurement);
    
//     const annotationData = {
//       id: Date.now(),
//       label: label.trim(),
//       memo: memo.trim(),
//       type: measurement.type,
//       coords: coords,
//       slice: currentSlice,
//       measurementId: measurement.id,
//       timestamp: new Date().toISOString(),
      
//       // 🔥 측정값 추가 (핵심!)
//       value: measurement.value || 'N/A',
      
//       originalMeasurement: {
//         startPoint: measurement.startPoint,
//         endPoint: measurement.endPoint,
//         centerPoint: measurement.centerPoint,
//         radius: measurement.radius
//       }
//     };

//     console.log('🏷️ 새 주석 데이터:', annotationData);
//     onSave(annotationData);
//   };

//   const formatCoordinates = (measurement) => {
//     const { type, startPoint, endPoint } = measurement;
    
//     switch (type) {
//       case 'length':
//         return `x1:${Math.round(startPoint.x)}, y1:${Math.round(startPoint.y)}, x2:${Math.round(endPoint.x)}, y2:${Math.round(endPoint.y)}`;
      
//       case 'rectangle':
//         const rectX = Math.min(startPoint.x, endPoint.x);
//         const rectY = Math.min(startPoint.y, endPoint.y);
//         const rectW = Math.abs(endPoint.x - startPoint.x);
//         const rectH = Math.abs(endPoint.y - startPoint.y);
//         return `x:${Math.round(rectX)}, y:${Math.round(rectY)}, w:${Math.round(rectW)}, h:${Math.round(rectH)}`;
      
//       case 'circle':
//         const radius = Math.sqrt(
//           Math.pow(endPoint.x - startPoint.x, 2) + 
//           Math.pow(endPoint.y - startPoint.y, 2)
//         );
//         return `x:${Math.round(startPoint.x)}, y:${Math.round(startPoint.y)}, r:${Math.round(radius)}`;
      
//       default:
//         return `x:${Math.round(startPoint.x)}, y:${Math.round(startPoint.y)}`;
//     }
//   };

//   const getTypeIcon = (type) => {
//     switch (type) {
//       case 'length': return '📏';
//       case 'rectangle': return '⬛';
//       case 'circle': return '⭕';
//       default: return '📏';
//     }
//   };

//   const getTypeName = (type) => {
//     switch (type) {
//       case 'length': return '길이 측정';
//       case 'rectangle': return '사각형 ROI';
//       case 'circle': return '원형 ROI';
//       default: return '측정';
//     }
//   };

//   return (
//     <div className="mv-labeling-form">
//       {/* 측정값 미리보기 */}
//       <div className="mv-measurement-preview">
//         <div className="mv-preview-header">
//           {getTypeIcon(measurement?.type)} {getTypeName(measurement?.type)}
//         </div>
//         <div className="mv-preview-info">
//           값: {measurement?.value} | 슬라이스: {currentSlice} | 좌표: {formatCoordinates(measurement)}
//         </div>
//       </div>

//       {/* 라벨 입력 */}
//       <div className="mv-form-group">
//         <label htmlFor="label" className="mv-form-label">
//           라벨 <span className="mv-required">*</span>
//         </label>
//         <input
//           id="label"
//           type="text"
//           value={label}
//           onChange={(e) => setLabel(e.target.value)}
//           placeholder="예: 종양 의심, 폐결절, 이상소견 등"
//           className="mv-form-input"
//           maxLength={50}
//           autoFocus
//         />
//         <div className="mv-char-count">{label.length}/50</div>
//       </div>

//       {/* 메모 입력 */}
//       <div className="mv-form-group">
//         <label htmlFor="memo" className="mv-form-label">
//           메모 (선택사항)
//         </label>
//         <textarea
//           id="memo"
//           value={memo}
//           onChange={(e) => setMemo(e.target.value)}
//           placeholder="추가 설명이나 소견을 입력하세요"
//           className="mv-form-textarea"
//           rows={3}
//           maxLength={200}
//         />
//         <div className="mv-char-count">{memo.length}/200</div>
//       </div>

//       {/* 버튼 */}
//       <div className="mv-form-actions">
//         <Button 
//           variant="outline" 
//           onClick={onCancel}
//         >
//           취소
//         </Button>
//         <Button 
//           variant="primary" 
//           onClick={handleSave}
//           disabled={!label.trim()}
//         >
//           저장
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default LabelingForm;

// /home/medical_system/pacsapp/src/components/viewer_v2/Common/LabelingForm.js

import React, { useState, useEffect } from 'react';
import Button from './Button';
import './LabelingForm.css';

const LabelingForm = ({ 
  measurement,
  currentSlice,
  onSave,
  onCancel
}) => {
  const [label, setLabel] = useState('');
  const [memo, setMemo] = useState('');

  // 컴포넌트 마운트시 초기화
  useEffect(() => {
    setLabel('');
    setMemo('');
  }, [measurement]);

  const handleSave = () => {
    if (!label.trim()) {
      alert('라벨을 입력해주세요.');
      return;
    }

    // 🔥 새로운 Django 구조로 데이터 생성
    const { shape_type, coordinates, coords } = formatCoordinatesForDjango(measurement);
    
    const annotationData = {
      // 🔥 기본 식별 정보
      id: Date.now(),
      label: label.trim(),
      memo: memo.trim(),
      slice: currentSlice,
      measurementId: measurement.id,
      timestamp: new Date().toISOString(),
      
      // 🔥 Django 새 구조 - shape_type + coordinates
      shape_type: shape_type,
      coordinates: coordinates,
      dr_text: memo.trim(),
      
      // 🔥 기존 호환성을 위한 필드들
      type: measurement.type,
      coords: coords, // 문자열 형태 (화면 표시용)
      value: measurement.value || 'N/A',
      
      // 🔥 원본 측정값 보존
      originalMeasurement: {
        startPoint: measurement.startPoint,
        endPoint: measurement.endPoint,
        centerPoint: measurement.centerPoint,
        radius: measurement.radius
      }
    };

    console.log('🏷️ 새 주석 데이터 (Django 호환):', annotationData);
    console.log('🔄 shape_type:', shape_type, 'coordinates:', coordinates);
    
    onSave(annotationData);
  };

  // 🔥 Django 새 구조로 좌표 변환
  const formatCoordinatesForDjango = (measurement) => {
    const { type, startPoint, endPoint } = measurement;
    
    let shape_type;
    let coordinates;
    let coords; // 화면 표시용 문자열
    
    switch (type) {
      case 'length':
        shape_type = 'line';
        coordinates = [
          Math.round(startPoint.x),
          Math.round(startPoint.y),
          Math.round(endPoint.x),
          Math.round(endPoint.y)
        ];
        coords = `x1:${coordinates[0]}, y1:${coordinates[1]}, x2:${coordinates[2]}, y2:${coordinates[3]}`;
        break;
      
      case 'rectangle':
        shape_type = 'rectangle';
        const rectX = Math.min(startPoint.x, endPoint.x);
        const rectY = Math.min(startPoint.y, endPoint.y);
        const rectW = Math.abs(endPoint.x - startPoint.x);
        const rectH = Math.abs(endPoint.y - startPoint.y);
        
        coordinates = [
          Math.round(rectX),
          Math.round(rectY),
          Math.round(rectW),
          Math.round(rectH)
        ];
        coords = `x:${coordinates[0]}, y:${coordinates[1]}, w:${coordinates[2]}, h:${coordinates[3]}`;
        break;
      
      case 'circle':
        shape_type = 'circle';
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        );
        
        coordinates = [
          Math.round(startPoint.x),
          Math.round(startPoint.y),
          Math.round(radius)
        ];
        coords = `x:${coordinates[0]}, y:${coordinates[1]}, r:${coordinates[2]}`;
        break;
      
      default:
        shape_type = 'rectangle';
        coordinates = [0, 0, 10, 10];
        coords = `x:${startPoint.x}, y:${startPoint.y}`;
    }

    return { shape_type, coordinates, coords };
  };

  // 🔥 화면 표시용 좌표 포맷팅 (기존 함수 유지)
  const formatCoordinates = (measurement) => {
    const { type, startPoint, endPoint } = measurement;
    
    switch (type) {
      case 'length':
        return `x1:${Math.round(startPoint.x)}, y1:${Math.round(startPoint.y)}, x2:${Math.round(endPoint.x)}, y2:${Math.round(endPoint.y)}`;
      
      case 'rectangle':
        const rectX = Math.min(startPoint.x, endPoint.x);
        const rectY = Math.min(startPoint.y, endPoint.y);
        const rectW = Math.abs(endPoint.x - startPoint.x);
        const rectH = Math.abs(endPoint.y - startPoint.y);
        return `x:${Math.round(rectX)}, y:${Math.round(rectY)}, w:${Math.round(rectW)}, h:${Math.round(rectH)}`;
      
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        );
        return `x:${Math.round(startPoint.x)}, y:${Math.round(startPoint.y)}, r:${Math.round(radius)}`;
      
      default:
        return `x:${Math.round(startPoint.x)}, y:${Math.round(startPoint.y)}`;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'length': return '📏';
      case 'rectangle': return '⬛';
      case 'circle': return '⭕';
      default: return '📏';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'length': return '길이 측정';
      case 'rectangle': return '사각형 ROI';
      case 'circle': return '원형 ROI';
      default: return '측정';
    }
  };

  // 🔥 Django 타입명 표시 (디버깅용)
  const getDjangoTypeName = (type) => {
    switch (type) {
      case 'length': return 'line';
      case 'rectangle': return 'rectangle';
      case 'circle': return 'circle';
      default: return 'rectangle';
    }
  };

  return (
    <div className="mv-labeling-form">
      {/* 측정값 미리보기 */}
      <div className="mv-measurement-preview">
        <div className="mv-preview-header">
          {getTypeIcon(measurement?.type)} {getTypeName(measurement?.type)}
        </div>
        <div className="mv-preview-info">
          값: {measurement?.value} | 슬라이스: {currentSlice}
        </div>
        <div className="mv-preview-coords">
          좌표: {formatCoordinates(measurement)}
        </div>
        {/* 🔥 Django 타입 미리보기 추가 (개발용) */}
        <div className="mv-preview-django">
          Django 타입: {getDjangoTypeName(measurement?.type)}
        </div>
      </div>

      {/* 라벨 입력 */}
      <div className="mv-form-group">
        <label htmlFor="label" className="mv-form-label">
          라벨 <span className="mv-required">*</span>
        </label>
        <input
          id="label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 종양 의심, 폐결절, 이상소견 등"
          className="mv-form-input"
          maxLength={50}
          autoFocus
        />
        <div className="mv-char-count">{label.length}/50</div>
      </div>

      {/* 메모 입력 */}
      <div className="mv-form-group">
        <label htmlFor="memo" className="mv-form-label">
          메모 (선택사항)
        </label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="추가 설명이나 소견을 입력하세요"
          className="mv-form-textarea"
          rows={3}
          maxLength={200}
        />
        <div className="mv-char-count">{memo.length}/200</div>
      </div>

      {/* 🔥 Django 구조 미리보기 (개발용) */}
      {measurement && (
        <div className="mv-django-preview">
          <details>
            <summary>Django 데이터 미리보기</summary>
            <pre className="mv-django-data">
              {JSON.stringify(formatCoordinatesForDjango(measurement), null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* 버튼 */}
      <div className="mv-form-actions">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={!label.trim()}
        >
          저장
        </Button>
      </div>
    </div>
  );
};

export default LabelingForm;