// // src/components/OHIFViewer/AnnotationTools/AnnotationTools.js
// import React from 'react';
// import styles from './AnnotationTools.module.css';

// const AnnotationTools = ({
//   // 상태
//   drawingMode,
//   annotationBoxes,
//   showAnnotations,
//   showAnnotationDropdown,
  
//   // 토글 함수들
//   onToggleDrawingMode,
//   onToggleAnnotations,
//   onToggleAnnotationDropdown,
  
//   // 액션 함수들
//   onSaveAnnotations,
//   onLoadAnnotations,
//   onDeleteIndividualAnnotation
// }) => {
//   return (
//     <div className={styles.annotationSection}>
//       <h4 className={styles.sectionHeader}>🎯 어노테이션 도구:</h4>
      
//       {/* 그리기 모드 토글 버튼 */}
//       <button 
//         onClick={onToggleDrawingMode}
//         className={`${styles.drawingToggleButton} ${
//           drawingMode ? styles.active : styles.inactive
//         }`}
//       >
//         {drawingMode ? '🔒 그리기 모드 OFF' : '✏️ 그리기 모드 ON'}
//       </button>
      
//       {/* 저장/불러오기 버튼들 */}
//       <div className={styles.actionButtons}>
//         <button 
//           onClick={onSaveAnnotations}
//           disabled={annotationBoxes.length === 0}
//           className={`${styles.actionButton} ${styles.saveButton}`}
//         >
//           💾 저장
//         </button>
        
//         <button 
//           onClick={onLoadAnnotations}
//           className={`${styles.actionButton} ${styles.loadButton}`}
//         >
//           📂 불러오기
//         </button>
//       </div>

//       {/* 저장된 어노테이션 드롭다운 */}
//       <div className={styles.dropdownContainer}>
//         <button 
//           onClick={onToggleAnnotationDropdown}
//           className={styles.dropdownToggle}
//         >
//           <span>📋 저장된 어노테이션 목록</span>
//           <span>{showAnnotationDropdown ? '▲' : '▼'}</span>
//         </button>
        
//         {showAnnotationDropdown && (
//           <div className={styles.dropdownContent}>
//             {annotationBoxes.length > 0 ? (
//               annotationBoxes.map((box) => (
//                 <div
//                   key={box.id}
//                   className={styles.dropdownItem}
//                 >
//                   <div className={styles.itemContent}>
//                     <div className={styles.itemLabel}>
//                       {box.label}
//                     </div>
//                     <div className={styles.itemLocation}>
//                       위치: [{box.left}, {box.top}, {box.left + box.width}, {box.top + box.height}]
//                     </div>
//                     <div className={styles.itemDoctor}>
//                       판독의: DR001 - 김영상
//                     </div>
//                     <div className={styles.itemTime}>
//                       {box.created ? new Date(box.created).toLocaleString() : '방금 전'}
//                     </div>
//                   </div>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       onDeleteIndividualAnnotation(box.id);
//                     }}
//                     className={styles.itemDeleteButton}
//                     title={`"${box.label}" 어노테이션 삭제`}
//                   >
//                     ✕
//                   </button>
//                 </div>
//               ))
//             ) : (
//               <div className={styles.dropdownEmpty}>
//                 저장된 어노테이션이 없습니다
//               </div>
//             )}
//           </div>
//         )}
//       </div>
      
//       {/* 어노테이션 표시/숨김 토글 (어노테이션이 있을 때만) */}
//       {annotationBoxes.length > 0 && (
//         <button 
//           onClick={onToggleAnnotations}
//           className={`${styles.visibilityToggle} ${
//             showAnnotations ? styles.visible : styles.hidden
//           }`}
//         >
//           {showAnnotations ? '🙈 어노테이션 숨기기' : '👁️ 어노테이션 표시'} ({annotationBoxes.length}개)
//         </button>
//       )}

//       {/* 상태 정보 */}
//       {annotationBoxes.length > 0 && (
//         <div className={styles.statusInfo}>
//           📝 어노테이션: {annotationBoxes.length}개
//         </div>
//       )}
//     </div>
//   );
// };

// export default AnnotationTools;

// src/components/OHIFViewer/AnnotationTools/AnnotationTools.js
import React from 'react';
import styles from './AnnotationTools.module.css';

const AnnotationTools = ({
  // 상태
  drawingMode,
  annotationBoxes,
  showAnnotations,
  showAnnotationDropdown,
  
  // 토글 함수들
  onToggleDrawingMode,
  onToggleAnnotations,
  onToggleAnnotationDropdown,
  
  // 액션 함수들
  onSaveAnnotations,
  onLoadAnnotations,
  onDeleteIndividualAnnotation
}) => {
  return (
    <div className={styles.annotationSection}>
      <h4 className={styles.sectionHeader}>🎯 어노테이션 도구:</h4>
      
      {/* 그리기 모드 토글 버튼 */}
      <button 
        onClick={onToggleDrawingMode}
        className={`${styles.drawingToggleButton} ${
          drawingMode ? styles.active : styles.inactive
        }`}
      >
        {drawingMode ? '🔒 그리기 모드 OFF' : '✏️ 그리기 모드 ON'}
      </button>
      
      {/* 저장/불러오기 버튼들 */}
      <div className={styles.actionButtons}>
        <button 
          onClick={onSaveAnnotations}
          disabled={annotationBoxes.length === 0}
          className={`${styles.actionButton} ${styles.saveButton}`}
        >
          💾 저장
        </button>
        
        <button 
          onClick={onLoadAnnotations}
          className={`${styles.actionButton} ${styles.loadButton}`}
        >
          📂 불러오기
        </button>
      </div>

      {/* 저장된 어노테이션 드롭다운 */}
      <div className={styles.dropdownContainer}>
        <button 
          onClick={onToggleAnnotationDropdown}
          className={styles.dropdownToggle}
        >
          <span>📋 저장된 어노테이션 목록</span>
          <span>{showAnnotationDropdown ? '▲' : '▼'}</span>
        </button>
        
        {showAnnotationDropdown && (
          <div className={styles.dropdownContent}>
            {annotationBoxes.length > 0 ? (
              annotationBoxes.map((box) => (
                <div
                  key={box.id}
                  className={styles.dropdownItem}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemLabel}>
                      {box.label}
                    </div>
                    <div className={styles.itemLocation}>
                      위치: [{box.left}, {box.top}, {box.left + box.width}, {box.top + box.height}]
                    </div>
                    <div className={styles.itemDoctor}>
                      판독의: {box.doctor_name || 'DR001 - 김영상'}
                    </div>
                    <div className={styles.itemTime}>
                      {box.created ? new Date(box.created).toLocaleString() : '방금 전'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteIndividualAnnotation(box.id);
                    }}
                    className={styles.itemDeleteButton}
                    title={`"${box.label}" 어노테이션 삭제`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.dropdownEmpty}>
                저장된 어노테이션이 없습니다
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 어노테이션 표시/숨김 토글 (어노테이션이 있을 때만) */}
      {annotationBoxes.length > 0 && (
        <button 
          onClick={onToggleAnnotations}
          className={`${styles.visibilityToggle} ${
            showAnnotations ? styles.visible : styles.hidden
          }`}
        >
          {showAnnotations ? '🙈 어노테이션 숨기기' : '👁️ 어노테이션 표시'} ({annotationBoxes.length}개)
        </button>
      )}

      {/* 상태 정보 */}
      {annotationBoxes.length > 0 && (
        <div className={styles.statusInfo}>
          📝 어노테이션: {annotationBoxes.length}개
        </div>
      )}
    </div>
  );
};

export default AnnotationTools;