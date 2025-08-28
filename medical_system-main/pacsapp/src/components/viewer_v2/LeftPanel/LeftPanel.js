import React from 'react';
import PatientInfo from './PatientInfo';
import Navigation from './Navigation';
import CineControls from './CineControls';
import Thumbnails from './Thumbnails';
import './LeftPanel.css';

const LeftPanel = ({ 
  showLeftPanel, 
  currentSlice, 
  setCurrentSlice, 
  totalSlices,
  isPlaying,
  setIsPlaying,
  
  // PatientInfo용 실제 데이터
  patientData = null,
  
  // WorkList 데이터
  workListData = null,
  patientInfo = {},
  
  // Navigation용 데이터
  studies = [],
  selectedStudy = null,
  series = [],
  selectedSeries = null,
  onSelectStudy = () => {},
  onSelectSeries = () => {},
  
  // Thumbnails용 데이터
  instances = []
}) => {
  if (!showLeftPanel) return null;

  return (
    <div className="mv-left-panel">
      {/* 로고 영역 */}
      <div 
        className="mv-logo-header" 
        style={{
          height: '60px',
          minHeight: '60px',
          maxHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #475569',
          backgroundColor: '#1e293b'
        }}
      >
        <div className="mv-logo-container">
          <h1 className="mv-logo-text">LaCID Viewer</h1>
        </div>
      </div>
      
      {/* 환자 정보 */}
      <PatientInfo patientData={patientData} />
      
      {/* 스터디 정보 */}
      <Navigation 
        currentSlice={currentSlice}
        setCurrentSlice={setCurrentSlice}
        totalSlices={totalSlices}
        studies={studies}
        selectedStudy={selectedStudy}
        series={series}
        selectedSeries={selectedSeries}
        onSelectStudy={onSelectStudy}
        onSelectSeries={onSelectSeries}
        workListData={workListData}
      />
      
      {/* Cine 컨트롤 */}
      <CineControls 
        currentSlice={currentSlice}
        setCurrentSlice={setCurrentSlice}
        totalSlices={totalSlices}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
      
      {/* 썸네일 */}
      <Thumbnails 
        currentSlice={currentSlice}
        setCurrentSlice={setCurrentSlice}
        instances={instances}
        totalSlices={totalSlices}
      />
    </div>
  );
};

export default LeftPanel;