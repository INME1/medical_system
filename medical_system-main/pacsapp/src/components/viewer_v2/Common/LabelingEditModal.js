// // /home/medical_system/pacsapp/src/components/viewer_v2/Common/LabelingEditModal.js
// import React, { useState, useEffect } from 'react';
// import Modal from './Modal';
// import Button from './Button';
// import './LabelingForm.css';

// const LabelingEditModal = ({ 
//   isOpen, 
//   onClose, 
//   onSave, 
//   annotation
// }) => {
//   const [label, setLabel] = useState('');
//   const [memo, setMemo] = useState('');

//   // 🔥 디버깅 로그 추가
//   console.log('🎯 LabelingEditModal 렌더링:', { 
//     isOpen, 
//     hasAnnotation: !!annotation,
//     annotationKeys: annotation ? Object.keys(annotation) : [],
//     annotation: annotation
//   });

//   // 모달이 열릴 때 기존 값으로 초기화
//   useEffect(() => {
//     console.log('🚨 LabelingEditModal useEffect:', { 
//       isOpen, 
//       annotation,
//       annotationType: annotation?.type,
//       annotationValue: annotation?.value,
//       annotationSlice: annotation?.slice,
//       annotationCoords: annotation?.coords,
//       annotationLabel: annotation?.label,
//       annotationMemo: annotation?.memo
//     });
    
//     if (isOpen && annotation) {
//       console.log('✅ 전체 annotation 데이터:', annotation);
//       setLabel(annotation.label || '');
//       setMemo(annotation.memo || '');
//     } else if (isOpen && !annotation) {
//       console.error('❌ 모달은 열렸지만 annotation이 없음!');
//     }
//   }, [isOpen, annotation]);

//   const handleSave = () => {
//     if (!label.trim()) {
//       alert('라벨을 입력해주세요.');
//       return;
//     }
    
//     const updatedAnnotation = {
//       ...annotation,
//       label: label.trim(),
//       memo: memo.trim(),
//       timestamp: new Date().toISOString(), // 🔥 수정 시간 업데이트
//       updatedAt: new Date().toISOString()  // 🔥 수정 시간 별도 추가
//     };
    
//     console.log('✏️ 주석 수정 데이터:', updatedAnnotation);
//     onSave(updatedAnnotation);
//     onClose();
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

//   // 🔥 annotation이 없으면 로그 출력하고 null 반환
//   if (!annotation) {
//     console.log('🚫 LabelingEditModal - annotation이 없어서 null 반환');
//     return null;
//   }

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="✏️ 라벨 편집"
//       size="medium"
//     >
//       <div className="mv-labeling-form">
//         {/* 🔥 측정값 미리보기 - 안전한 렌더링 */}
//         <div className="mv-measurement-preview">
//           <div className="mv-preview-header">
//             {getTypeIcon(annotation.type || 'unknown')} {getTypeName(annotation.type || 'unknown')}
//           </div>
//           <div className="mv-preview-info">
//             값: {annotation.value || 'N/A'} | 
//             슬라이스: {annotation.slice || 'N/A'} | 
//             좌표: {annotation.coords || 'N/A'}
//           </div>
          
//           {/* 🔥 디버깅용 - annotation 내용 표시 */}
//           <div className="mv-debug-info" style={{ 
//             fontSize: '10px', 
//             color: '#666', 
//             marginTop: '8px',
//             background: '#f5f5f5',
//             padding: '4px',
//             borderRadius: '3px'
//           }}>
//             Debug: {JSON.stringify(annotation, null, 2)}
//           </div>
//         </div>

//         {/* 🔥 라벨 입력 */}
//         <div className="mv-form-group">
//           <label htmlFor="edit-label" className="mv-form-label">
//             라벨 <span className="mv-required">*</span>
//           </label>
//           <input
//             id="edit-label"
//             type="text"
//             value={label}
//             onChange={(e) => setLabel(e.target.value)}
//             placeholder="예: 종양 의심, 폐결절, 이상소견 등"
//             className="mv-form-input"
//             maxLength={50}
//             autoFocus
//           />
//           <div className="mv-char-count">{label.length}/50</div>
//         </div>

//         {/* 🔥 메모 입력 */}
//         <div className="mv-form-group">
//           <label htmlFor="edit-memo" className="mv-form-label">
//             메모 (선택사항)
//           </label>
//           <textarea
//             id="edit-memo"
//             value={memo}
//             onChange={(e) => setMemo(e.target.value)}
//             placeholder="추가 설명이나 소견을 입력하세요"
//             className="mv-form-textarea"
//             rows={3}
//             maxLength={200}
//           />
//           <div className="mv-char-count">{memo.length}/200</div>
//         </div>

//         {/* 🔥 원본 생성 시간 표시 */}
//         {annotation.timestamp && (
//           <div className="mv-original-time">
//             📅 원본 생성: {new Date(annotation.timestamp).toLocaleString('ko-KR')}
//           </div>
//         )}

//         {/* 🔥 버튼 */}
//         <div className="mv-form-actions">
//           <Button 
//             variant="outline" 
//             onClick={onClose}
//           >
//             취소
//           </Button>
//           <Button 
//             variant="primary" 
//             onClick={handleSave}
//             disabled={!label.trim()}
//           >
//             수정 완료
//           </Button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default LabelingEditModal;

// /home/medical_system/pacsapp/src/components/viewer_v2/Common/LabelingEditModal.js
// /home/medical_system/pacsapp/src/components/viewer_v2/Common/LabelingEditModal.js
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import './LabelingForm.css';

const LabelingEditModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  annotation,
  // 🔥 디버깅을 위한 추가 props
  measurementId,
  debugInfo
}) => {
  const [label, setLabel] = useState('');
  const [memo, setMemo] = useState('');
  const renderCount = useRef(0);

  // 🔥 렌더링 횟수 추적
  renderCount.current += 1;

  // 🔥 디버깅 로그 추가
  console.log('🎯 LabelingEditModal 렌더링:', { 
    renderCount: renderCount.current,
    isOpen, 
    hasAnnotation: !!annotation,
    annotationKeys: annotation ? Object.keys(annotation) : [],
    annotation: annotation,
    measurementId,
    debugInfo
  });

  // 🔥 무한 렌더링 방지를 위한 useEffect 최적화
  useEffect(() => {
    console.log('🚨 LabelingEditModal useEffect 실행:', { 
      isOpen, 
      annotation,
      annotationType: annotation?.type,
      annotationValue: annotation?.value,
      annotationSlice: annotation?.slice,
      annotationCoords: annotation?.coords,
      annotationLabel: annotation?.label,
      annotationMemo: annotation?.memo
    });
    
    if (isOpen && annotation) {
      console.log('✅ 전체 annotation 데이터:', annotation);
      setLabel(annotation.label || '');
      setMemo(annotation.memo || '');
    } else if (isOpen && !annotation) {
      console.error('❌ 모달은 열렸지만 annotation이 없음!', {
        isOpen,
        annotation,
        measurementId,
        debugInfo
      });
      // 🔥 상태 초기화
      setLabel('');
      setMemo('');
    }
  }, [isOpen, annotation?.id]); // 🔥 annotation 전체 객체 대신 id만 의존성으로 사용

  // 🔥 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setLabel('');
      setMemo('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!label.trim()) {
      alert('라벨을 입력해주세요.');
      return;
    }
    
    if (!annotation) {
      console.error('❌ 저장하려는데 annotation이 없습니다!');
      alert('오류: 편집할 측정값을 찾을 수 없습니다.');
      return;
    }
    
    const updatedAnnotation = {
      ...annotation,
      label: label.trim(),
      memo: memo.trim(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('✏️ 주석 수정 데이터:', updatedAnnotation);
    console.log('✏️ 원본 생성시간 유지:', annotation.timestamp);
    console.log('✏️ 새 수정시간:', updatedAnnotation.updatedAt);
    
    onSave(updatedAnnotation);
    onClose();
  };

  const handleClose = () => {
    setLabel('');
    setMemo('');
    onClose();
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

  // 🔥 모달이 열렸지만 annotation이 없는 경우 에러 모달 표시
  if (isOpen && !annotation) {
    console.error('❌ 모달이 열렸지만 annotation이 없습니다!', {
      isOpen,
      annotation,
      measurementId,
      debugInfo
    });
    
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="⚠️ 오류">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>편집할 측정값을 찾을 수 없습니다.</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            디버그 정보: measurementId={measurementId}, annotation={annotation ? 'exists' : 'null'}
          </p>
          <div style={{ marginTop: '20px' }}>
            <Button onClick={handleClose} variant="primary">확인</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // 🔥 모달이 닫혀있고 annotation이 없으면 렌더링하지 않음
  if (!isOpen || !annotation) {
    console.log('🚫 LabelingEditModal - 모달 닫힘 또는 annotation 없음 - 렌더링 스킵');
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="✏️ 라벨 편집"
      size="medium"
    >
      <div className="mv-labeling-form">
        {/* 🔥 측정값 미리보기 - 안전한 렌더링 */}
        <div className="mv-measurement-preview">
          <div className="mv-preview-header">
            {getTypeIcon(annotation.type || 'unknown')} {getTypeName(annotation.type || 'unknown')}
          </div>
          <div className="mv-preview-info">
            값: {annotation.value || 'N/A'} | 
            슬라이스: {annotation.slice || 'N/A'} | 
            좌표: {annotation.coords || 'N/A'}
          </div>
          
          {/* 🔥 디버깅용 - annotation 내용 표시 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mv-debug-info" style={{ 
              fontSize: '10px', 
              color: '#666', 
              marginTop: '8px',
              background: '#f5f5f5',
              padding: '4px',
              borderRadius: '3px',
              maxHeight: '100px',
              overflow: 'auto'
            }}>
              Debug: {JSON.stringify(annotation, null, 2)}
            </div>
          )}
        </div>

        {/* 🔥 라벨 입력 */}
        <div className="mv-form-group">
          <label htmlFor="edit-label" className="mv-form-label">
            라벨 <span className="mv-required">*</span>
          </label>
          <input
            id="edit-label"
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

        {/* 🔥 메모 입력 */}
        <div className="mv-form-group">
          <label htmlFor="edit-memo" className="mv-form-label">
            메모 (선택사항)
          </label>
          <textarea
            id="edit-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="추가 설명이나 소견을 입력하세요"
            className="mv-form-textarea"
            rows={3}
            maxLength={200}
          />
          <div className="mv-char-count">{memo.length}/200</div>
        </div>

        {/* 🔥 원본 생성 시간 표시 */}
        {annotation.timestamp && (
          <div className="mv-original-time">
            📅 원본 생성: {new Date(annotation.timestamp).toLocaleString('ko-KR')}
          </div>
        )}

        {/* 🔥 버튼 */}
        <div className="mv-form-actions">
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={!label.trim()}
          >
            수정 완료
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LabelingEditModal;