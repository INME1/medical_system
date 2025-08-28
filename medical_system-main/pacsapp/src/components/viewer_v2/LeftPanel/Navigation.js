// import React from 'react';
// import { Calendar, Layers } from 'lucide-react';
// import './Navigation.css';

// const Navigation = ({ 
//   currentSlice = 1, 
//   setCurrentSlice, 
//   totalSlices = 1,
  
//   // 실제 데이터 props
//   studies = [],
//   selectedStudy = null,
//   series = [],
//   selectedSeries = null,
//   onSelectStudy = () => {},
//   onSelectSeries = () => {},
  
//   // WorkList 데이터 props
//   workListData = null
// }) => {
//   const handleSliceChange = (e) => {
//     const newSlice = parseInt(e.target.value);
//     setCurrentSlice(newSlice);
//   };

//   // 🔥 디버깅 로그 추가
//   console.log('🚨 Navigation 디버깅:');
//   console.log('- workListData:', workListData);
//   console.log('- workListData.exam_datetime:', workListData?.exam_datetime);
//   console.log('- workListData.modality:', workListData?.modality);
//   console.log('- workListData.body_part:', workListData?.body_part);

//   // 검사일 포맷 함수 (WorkList exam_datetime 형식 처리)
//   const formatExamDate = (examDateTime) => {
//     if (!examDateTime) return 'N/A';
    
//     try {
//       // ISO 형식 "2025-06-29T06:51:07.843736Z" 처리
//       const date = new Date(examDateTime);
//       const year = date.getFullYear();
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const day = String(date.getDate()).padStart(2, '0');
//       return `${year}.${month}.${day}`;
//     } catch (e) {
//       console.error('날짜 파싱 에러:', e);
//       return examDateTime;
//     }
//   };

//   // 검사 정보 포맷 함수 (modality + body_part)
//   const formatExamInfo = (modality, bodyPart) => {
//     if (!modality && !bodyPart) return 'N/A';
//     if (!modality) return bodyPart;
//     if (!bodyPart) return modality;
//     return `${modality} - ${bodyPart}`;
//   };

//   // 기존 검사일 포맷 함수 (PACS 데이터용)
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('ko-KR').replace(/\./g, '.').slice(0, -1);
//   };

//   // Study 선택 핸들러
//   const handleStudyChange = (e) => {
//     const studyUID = e.target.value;
//     const study = studies.find(s => s.studyInstanceUID === studyUID);
//     if (study) {
//       onSelectStudy(study);
//     }
//   };

//   // Series 선택 핸들러
//   const handleSeriesChange = (e) => {
//     const seriesUID = e.target.value;
//     const seriesItem = series.find(s => s.seriesInstanceUID === seriesUID);
//     if (seriesItem) {
//       onSelectSeries(seriesItem);
//     }
//   };

//   return (
//     <div className="mv-navigation-container">
//       <div className="mv-navigation-header">
//         <Layers size={16} />
//         <h3 className="mv-navigation-title">스터디 정보</h3>
//       </div>

//       <div className="mv-navigation-content">
//         {/* 검사일 표시 (WorkList 데이터 우선, 없으면 PACS 데이터) */}
//         <div className="mv-nav-row">
//           <span className="mv-nav-label">검사일:</span>
//           <select className="mv-nav-select" disabled>
//             <option>
//               {workListData && workListData.exam_datetime ? 
//                 formatExamDate(workListData.exam_datetime) :
//                 selectedStudy ? formatDate(selectedStudy.studyDate) : 
//                 '데이터를 불러오는 중...'
//               }
//             </option>
//           </select>
//         </div>

//         {/* 검사 (WorkList 데이터 우선, 없으면 PACS 데이터) */}
//         <div className="mv-nav-row">
//           <span className="mv-nav-label">검사:</span>
//           <select className="mv-nav-select" disabled>
//             <option>
//               {workListData && (workListData.modality || workListData.body_part) ? 
//                 formatExamInfo(workListData.modality, workListData.body_part) :
//                 selectedStudy ? 
//                   `${selectedStudy.modalitiesInStudy || 'Unknown'} - ${selectedStudy.studyDescription || 'No description'}` : 
//                 '데이터를 불러오는 중...'
//               }
//             </option>
//           </select>
//         </div>

//         {/* Study 목록 드롭다운 */}
//         <div className="mv-nav-row">
//           <span className="mv-nav-label">Study:</span>
//           <select 
//             className="mv-nav-select"
//             value={selectedStudy?.studyInstanceUID || ''}
//             onChange={handleStudyChange}
//           >
//             {studies.length === 0 ? (
//               <option value="">스터디 로딩 중...</option>
//             ) : (
//               <>
//                 <option value="">스터디 선택</option>
//                 {studies.map((study, index) => (
//                   <option key={study.studyInstanceUID} value={study.studyInstanceUID}>
//                     Study {index + 1} - {study.modalitiesInStudy || 'Unknown'} 
//                     ({study.numberOfSeries || 0} Series, {study.numberOfInstances || 0} Images)
//                   </option>
//                 ))}
//               </>
//             )}
//           </select>
//         </div>

//         {/* Series 목록 드롭다운 */}
//         <div className="mv-nav-row">
//           <span className="mv-nav-label">Series:</span>
//           <select 
//             className="mv-nav-select"
//             value={selectedSeries?.seriesInstanceUID || ''}
//             onChange={handleSeriesChange}
//             disabled={!selectedStudy}
//           >
//             {!selectedStudy ? (
//               <option value="">먼저 스터디를 선택하세요</option>
//             ) : series.length === 0 ? (
//               <option value="">시리즈 로딩 중...</option>
//             ) : (
//               <>
//                 <option value="">시리즈 선택</option>
//                 {series.map((seriesItem, index) => (
//                   <option key={seriesItem.seriesInstanceUID} value={seriesItem.seriesInstanceUID}>
//                     Series {seriesItem.seriesNumber || index + 1} - {seriesItem.modality || 'Unknown'}
//                     {seriesItem.seriesDescription && ` (${seriesItem.seriesDescription})`}
//                     ({seriesItem.numberOfInstances || 0} slices)
//                   </option>
//                 ))}
//               </>
//             )}
//           </select>
//         </div>

//         {/* Instance 정보 표시 */}
//         <div className="mv-nav-row">
//           <span className="mv-nav-label">Instance:</span>
//           <select className="mv-nav-select" disabled>
//             <option>
//               {selectedSeries ? 
//                 `${totalSlices}개 인스턴스` : 
//                 '시리즈를 선택하세요'
//               }
//             </option>
//           </select>
//         </div>

//         {/* 슬라이스 정보 및 슬라이더 */}
//         <div className="mv-nav-row">
//           <span className="mv-nav-label">슬라이스:</span>
//           <span className="mv-slice-info">{currentSlice} / {totalSlices}</span>
//         </div>

//         <input
//           type="range"
//           min="1"
//           max={totalSlices}
//           value={currentSlice}
//           onChange={handleSliceChange}
//           className="mv-navigation-slider"
//           disabled={totalSlices <= 1}
//         />
//       </div>
//     </div>
//   );
// };

// export default Navigation;

import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ 
  currentSlice = 1, 
  setCurrentSlice, 
  totalSlices = 1,
  
  // 실제 데이터 props
  studies = [],
  selectedStudy = null,
  series = [],
  selectedSeries = null,
  onSelectStudy = () => {},
  onSelectSeries = () => {},
  
  // WorkList 데이터 props
  workListData = null
}) => {
  const handleSliceChange = (e) => {
    const newSlice = parseInt(e.target.value);
    setCurrentSlice(newSlice);
  };

  // 검사일 포맷 함수 (WorkList exam_datetime 형식 처리)
  const formatExamDate = (examDateTime) => {
    if (!examDateTime) return 'N/A';
    
    try {
      // ISO 형식 "2025-06-29T06:51:07.843736Z" 처리
      const date = new Date(examDateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch (e) {
      console.error('날짜 파싱 에러:', e);
      return examDateTime;
    }
  };

  // 검사 정보 포맷 함수 (modality + body_part)
  const formatExamInfo = (modality, bodyPart) => {
    if (!modality && !bodyPart) return 'N/A';
    if (!modality) return bodyPart;
    if (!bodyPart) return modality;
    return `${modality} - ${bodyPart}`;
  };

  // 기존 검사일 포맷 함수 (PACS 데이터용)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\./g, '.').slice(0, -1);
  };

  // Study 선택 핸들러
  const handleStudyChange = (e) => {
    const studyUID = e.target.value;
    const study = studies.find(s => s.studyInstanceUID === studyUID);
    if (study) {
      onSelectStudy(study);
    }
  };

  // Series 선택 핸들러
  const handleSeriesChange = (e) => {
    const seriesUID = e.target.value;
    const seriesItem = series.find(s => s.seriesInstanceUID === seriesUID);
    if (seriesItem) {
      onSelectSeries(seriesItem);
    }
  };

  return (
    <div className="mv-navigation-container">
      <div className="mv-navigation-header">
        <Layers size={16} />
        <h3 className="mv-navigation-title">스터디 정보</h3>
      </div>

      <div className="mv-navigation-content">
        {/* 검사일 표시 (WorkList 데이터 우선, 없으면 PACS 데이터) */}
        <div className="mv-nav-row">
          <span className="mv-nav-label">검사일:</span>
          <select className="mv-nav-select" disabled>
            <option>
              {workListData && workListData.exam_datetime ? 
                formatExamDate(workListData.exam_datetime) :
                selectedStudy ? formatDate(selectedStudy.studyDate) : 
                '데이터를 불러오는 중...'
              }
            </option>
          </select>
        </div>

        {/* 검사 (WorkList 데이터 우선, 없으면 PACS 데이터) */}
        <div className="mv-nav-row">
          <span className="mv-nav-label">검사:</span>
          <select className="mv-nav-select" disabled>
            <option>
              {workListData && (workListData.modality || workListData.body_part) ? 
                formatExamInfo(workListData.modality, workListData.body_part) :
                selectedStudy ? 
                  `${selectedStudy.modalitiesInStudy || 'Unknown'} - ${selectedStudy.studyDescription || 'No description'}` : 
                '데이터를 불러오는 중...'
              }
            </option>
          </select>
        </div>

        {/* Study 목록 드롭다운 */}
        <div className="mv-nav-row">
          <span className="mv-nav-label">Study:</span>
          <select 
            className="mv-nav-select"
            value={selectedStudy?.studyInstanceUID || ''}
            onChange={handleStudyChange}
          >
            {studies.length === 0 ? (
              <option value="">스터디 로딩 중...</option>
            ) : (
              <>
                <option value="">스터디 선택</option>
                {studies.map((study, index) => (
                  <option key={study.studyInstanceUID} value={study.studyInstanceUID}>
                    Study {index + 1} - {study.modalitiesInStudy || 'Unknown'} 
                    ({study.numberOfSeries || 0} Series, {study.numberOfInstances || 0} Images)
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Series 목록 드롭다운 */}
        <div className="mv-nav-row">
          <span className="mv-nav-label">Series:</span>
          <select 
            className="mv-nav-select"
            value={selectedSeries?.seriesInstanceUID || ''}
            onChange={handleSeriesChange}
            disabled={!selectedStudy}
          >
            {!selectedStudy ? (
              <option value="">먼저 스터디를 선택하세요</option>
            ) : series.length === 0 ? (
              <option value="">시리즈 로딩 중...</option>
            ) : (
              <>
                <option value="">시리즈 선택</option>
                {series.map((seriesItem, index) => (
                  <option key={seriesItem.seriesInstanceUID} value={seriesItem.seriesInstanceUID}>
                    Series {seriesItem.seriesNumber || index + 1} - {seriesItem.modality || 'Unknown'}
                    {seriesItem.seriesDescription && ` (${seriesItem.seriesDescription})`}
                    ({seriesItem.numberOfInstances || 0} slices)
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Instance 정보 표시 */}
        <div className="mv-nav-row">
          <span className="mv-nav-label">Instance:</span>
          <select className="mv-nav-select" disabled>
            <option>
              {selectedSeries ? 
                `${totalSlices}개 인스턴스` : 
                '시리즈를 선택하세요'
              }
            </option>
          </select>
        </div>

        {/* 슬라이스 정보 및 슬라이더 */}
        <div className="mv-nav-row">
          <span className="mv-nav-label">슬라이스:</span>
          <span className="mv-slice-info">{currentSlice} / {totalSlices}</span>
        </div>

        <input
          type="range"
          min="1"
          max={totalSlices}
          value={currentSlice}
          onChange={handleSliceChange}
          className="mv-navigation-slider"
          disabled={totalSlices <= 1}
        />
      </div>
    </div>
  );
};

export default Navigation;