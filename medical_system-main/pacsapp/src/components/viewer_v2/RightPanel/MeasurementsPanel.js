// // /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/MeasurementsPanel.js

// import React from 'react';
// import { X, Eye, EyeOff, Ruler } from 'lucide-react';
// import './MeasurementsPanel.css';

// const MeasurementsPanel = ({ 
//   measurements = [], 
//   onDeleteMeasurement,
//   onToggleMeasurementVisibility,
//   selectedMeasurement,
//   onSelectMeasurement,
  
//   // 🔥 편집 관련 props 추가
//   onStartEditMode,
//   onStopEditMode,
//   isEditMode = false,
//   editingMeasurement = null
// }) => {
  
//   const getTypeInfo = (type) => {
//     switch (type) {
//       case 'length': return { icon: '📏', name: '길이' };
//       case 'rectangle': return { icon: '⬛', name: '사각형 ROI' };
//       case 'circle': return { icon: '⭕', name: '원형 ROI' };
//       default: return { icon: '📏', name: '측정' };
//     }
//   };

//   const formatCoordinates = (measurement) => {
//     const { type, startPoint, endPoint, centerPoint, radius } = measurement;
    
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
//         if (centerPoint && radius) {
//           return `x:${Math.round(centerPoint.x)}, y:${Math.round(centerPoint.y)}, r:${Math.round(radius)}`;
//         } else {
//           const calcRadius = Math.sqrt(
//             Math.pow(endPoint.x - startPoint.x, 2) + 
//             Math.pow(endPoint.y - startPoint.y, 2)
//           );
//           return `x:${Math.round(startPoint.x)}, y:${Math.round(startPoint.y)}, r:${Math.round(calcRadius)}`;
//         }
      
//       default:
//         return '';
//     }
//   };

//   // 타입별로 그룹핑
//   const groupedMeasurements = measurements.reduce((groups, measurement) => {
//     const type = measurement.type;
//     if (!groups[type]) {
//       groups[type] = [];
//     }
//     groups[type].push(measurement);
//     return groups;
//   }, {});

//   const handleDelete = (measurementId, event) => {
//     event.stopPropagation();
//     if (onDeleteMeasurement) {
//       onDeleteMeasurement(measurementId);
//     }
//   };

//   const handleToggleVisibility = (measurementId, event) => {
//     event.stopPropagation();
//     if (onToggleMeasurementVisibility) {
//       onToggleMeasurementVisibility(measurementId);
//     }
//   };

//   const handleEdit = (measurementId, event) => {
//     event.stopPropagation();
//     if (onStartEditMode) {
//       onStartEditMode(measurementId);
//     }
//   };

//   const handleStopEdit = (event) => {
//     event.stopPropagation();
//     if (onStopEditMode) {
//       onStopEditMode();
//     }
//   };

//   const handleSelect = (measurement) => {
//     if (onSelectMeasurement) {
//       onSelectMeasurement(measurement);
//     }
//   };

//   // 🔥 편집 중인 측정값인지 확인 (기본값 설정)
//   const isEditing = (measurementId) => {
//     return isEditMode && editingMeasurement?.id === measurementId;
//   };

//   return (
//     <div className="mv-panel-content">
//       {measurements.length > 0 && (
//         <div className="mv-measurements-total">
//           <span>총 {measurements.length}개</span>
//           {isEditMode && (
//             <button 
//               className="mv-edit-exit-btn"
//               onClick={handleStopEdit}
//               title="편집 완료"
//             >
//               편집 완료
//             </button>
//           )}
//         </div>
//       )}

//       {Object.entries(groupedMeasurements).map(([type, typeMeasurements]) => {
//         const typeInfo = getTypeInfo(type);
        
//         return (
//           <div key={type} className="mv-measurement-group">
//             <div className="mv-group-header">
//               {typeInfo.icon} {typeInfo.name} ({typeMeasurements.length}개)
//             </div>
            
//             {typeMeasurements.map((measurement) => (
//               <div 
//                 key={measurement.id} 
//                 className={`mv-measurement-item ${selectedMeasurement?.id === measurement.id ? 'selected' : ''} ${!measurement.visible ? 'hidden' : ''} ${isEditing(measurement.id) ? 'editing' : ''}`}
//                 data-type={measurement.type}
//                 onClick={() => handleSelect(measurement)}
//               >
//                 {/* 🔥 1줄 레이아웃: 타입|값|슬라이스|좌표 */}
//                 <div className="mv-measurement-main-line">
//                   {typeInfo.icon} {typeInfo.name} | 
//                   값: {measurement.value || 'N/A'} | 
//                   슬라이스: {measurement.slice} | 
//                   좌표: {formatCoordinates(measurement)}
//                 </div>
                
//                 <div className="mv-actions">
//                   {/* 🔥 편집 버튼 추가 */}
//                   {!isEditMode && (
//                     <button 
//                       className="mv-btn-edit"
//                       onClick={(e) => handleEdit(measurement.id, e)}
//                       title="편집"
//                     >
//                       ✏️
//                     </button>
//                   )}
                  
//                   {/* 🔥 편집 중 표시 */}
//                   {isEditing(measurement.id) && (
//                     <span className="mv-editing-indicator">편집 중</span>
//                   )}
                  
//                   <button 
//                     className={`mv-btn-visibility ${measurement.visible ? 'visible' : 'hidden'}`}
//                     onClick={(e) => handleToggleVisibility(measurement.id, e)}
//                   >
//                     {measurement.visible ? <Eye size={14} /> : <EyeOff size={14} />}
//                   </button>
//                   <button 
//                     className="mv-btn-delete"
//                     onClick={(e) => handleDelete(measurement.id, e)}
//                   >
//                     <X size={14} />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         );
//       })}
      
//       {/* 🔥 Empty State - ManualAnnotationsPanel과 동일한 스타일 */}
//       {measurements.length === 0 && (
//         <div className="mv-empty-state">
//           <div className="mv-empty-icon">📏</div>
//           <p>측정값 없음</p>
//           <p className="mv-empty-subtitle">길이, 사각형, 원형 도구로 측정을 시작하세요</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MeasurementsPanel;


// /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/MeasurementsPanel.js
// /home/medical_system/pacsapp/src/components/viewer_v2/RightPanel/MeasurementsPanel.js

import React from 'react';
import { X, Eye, EyeOff, Ruler } from 'lucide-react';
import './MeasurementsPanel.css';

const MeasurementsPanel = ({ 
  measurements = [], 
  onDeleteMeasurement,
  onToggleMeasurementVisibility,
  selectedMeasurement,
  onSelectMeasurement,
  
  // 편집 관련 props
  onStartEditMode,
  onStopEditMode,
  isEditMode = false,
  editingMeasurement = null
}) => {
  
  const getTypeInfo = (type) => {
    switch (type) {
      case 'length': return { icon: '📏', name: '길이' };
      case 'rectangle': return { icon: '⬛', name: '사각형 ROI' };
      case 'circle': return { icon: '⭕', name: '원형 ROI' };
      default: return { icon: '📏', name: '측정' };
    }
  };

  const formatCoordinates = (measurement) => {
    const { type, startPoint, endPoint, centerPoint, radius } = measurement;
    
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
        if (centerPoint && radius) {
          return `x:${Math.round(centerPoint.x)}, y:${Math.round(centerPoint.y)}, r:${Math.round(radius)}`;
        } else {
          const calcRadius = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + 
            Math.pow(endPoint.y - startPoint.y, 2)
          );
          return `x:${Math.round(startPoint.x)}, y:${Math.round(startPoint.y)}, r:${Math.round(calcRadius)}`;
        }
      
      default:
        return '';
    }
  };

  // 🔥 수정: 라벨이 없는 측정값만 필터링
  const filteredMeasurements = measurements.filter(measurement => 
    !measurement.label || measurement.label.trim() === ''
  );

  // 타입별로 그룹핑
  const groupedMeasurements = filteredMeasurements.reduce((groups, measurement) => {
    const type = measurement.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(measurement);
    return groups;
  }, {});

  const handleDelete = (measurementId, event) => {
    event.stopPropagation();
    if (onDeleteMeasurement) {
      onDeleteMeasurement(measurementId);
    }
  };

  const handleToggleVisibility = (measurementId, event) => {
    event.stopPropagation();
    if (onToggleMeasurementVisibility) {
      onToggleMeasurementVisibility(measurementId);
    }
  };

  const handleEdit = (measurementId, event) => {
    event.stopPropagation();
    if (onStartEditMode) {
      onStartEditMode(measurementId);
    }
  };

  const handleStopEdit = (event) => {
    event.stopPropagation();
    if (onStopEditMode) {
      onStopEditMode();
    }
  };

  const handleSelect = (measurement) => {
    if (onSelectMeasurement) {
      onSelectMeasurement(measurement);
    }
  };

  const isEditing = (measurementId) => {
    return isEditMode && editingMeasurement?.id === measurementId;
  };

  return (
    <div className="mv-measurements-panel-content">
      {/* 🔥 수정: 라벨 없는 측정값 개수만 표시 */}
      {filteredMeasurements.length > 0 && (
        <div className="mv-measurements-total">
          <span>측정값 {filteredMeasurements.length}개</span>
          {isEditMode && (
            <button 
              className="mv-measurements-edit-exit-btn"
              onClick={handleStopEdit}
              title="편집 완료"
            >
              편집 완료
            </button>
          )}
        </div>
      )}

      {/* 🔥 라벨이 있는 측정값에 대한 안내 메시지 */}
      {measurements.length > filteredMeasurements.length && (
        <div className="mv-measurements-info" style={{
          backgroundColor: '#374151',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#94a3b8',
          border: '1px solid #4b5563'
        }}>
          💡 라벨이 있는 측정값 {measurements.length - filteredMeasurements.length}개는 
          수동 주석 패널에서 확인하세요
        </div>
      )}

      {Object.entries(groupedMeasurements).map(([type, typeMeasurements]) => {
        const typeInfo = getTypeInfo(type);
        
        return (
          <div key={type} className="mv-measurements-group">
            <div className="mv-measurements-group-header">
              {typeInfo.icon} {typeInfo.name} ({typeMeasurements.length}개)
            </div>
            
            {typeMeasurements.map((measurement) => (
              <div 
                key={measurement.id} 
                className={`mv-measurements-item ${selectedMeasurement?.id === measurement.id ? 'selected' : ''} ${!measurement.visible ? 'hidden' : ''} ${isEditing(measurement.id) ? 'editing' : ''}`}
                data-type={measurement.type}
                onClick={() => handleSelect(measurement)}
              >
                {/* 🔥 수정: 라벨/판독의 표시 제거 */}
                <div className="mv-measurements-main-line">
                  {typeInfo.icon} {typeInfo.name} | 
                  값: {measurement.value || 'N/A'} | 
                  슬라이스: {measurement.slice} | 
                  좌표: {formatCoordinates(measurement)}
                </div>
                
                <div className="mv-measurements-actions">
                  {!isEditMode && (
                    <button 
                      className="mv-measurements-btn-edit"
                      onClick={(e) => handleEdit(measurement.id, e)}
                      title="편집"
                    >
                      ✏️
                    </button>
                  )}
                  
                  {isEditing(measurement.id) && (
                    <span className="mv-measurements-editing-indicator">편집 중</span>
                  )}
                  
                  <button 
                    className={`mv-measurements-btn-visibility ${measurement.visible ? 'visible' : 'hidden'}`}
                    onClick={(e) => handleToggleVisibility(measurement.id, e)}
                  >
                    {measurement.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button 
                    className="mv-measurements-btn-delete"
                    onClick={(e) => handleDelete(measurement.id, e)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      
      {/* Empty State */}
      {filteredMeasurements.length === 0 && (
        <div className="mv-measurements-empty-state">
          <div className="mv-measurements-empty-icon">📏</div>
          <p>측정값 없음</p>
          <p className="mv-measurements-empty-subtitle">길이, 사각형, 원형 도구로 측정을 시작하세요</p>
          {measurements.length > 0 && (
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '8px'
            }}>
              라벨이 있는 측정값은 수동 주석 패널에서 확인할 수 있습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MeasurementsPanel;