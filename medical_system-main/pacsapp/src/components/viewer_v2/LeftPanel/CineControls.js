import React, { useEffect } from 'react';
import { Activity, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import './CineControls.css';

const CineControls = ({ currentSlice, setCurrentSlice, totalSlices, isPlaying, setIsPlaying }) => {
  // 🔥 자동 재생 기능 추가
  useEffect(() => {
    let interval = null;
    
    if (isPlaying && totalSlices > 1) {
      interval = setInterval(() => {
        setCurrentSlice(prevSlice => {
          // 마지막 슬라이스에 도달하면 첫 번째로 돌아가기
          if (prevSlice >= totalSlices) {
            return 1;
          }
          return prevSlice + 1;
        });
      }, 500); // 0.5초마다 다음 슬라이스
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, totalSlices, setCurrentSlice]);

  // 마지막 슬라이스에 도달하면 자동으로 정지
  useEffect(() => {
    if (currentSlice >= totalSlices && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentSlice, totalSlices, isPlaying, setIsPlaying]);

  return (
    <div className="mv-cine-controls-container">
      <div className="mv-cine-controls-header">
        <Activity color="#10b981" size={20} />
        <h4 className="mv-cine-controls-title">Cine 컨트롤</h4>
      </div>
      
      <div className="mv-cine-controls-buttons">
        <button
          onClick={() => setCurrentSlice(Math.max(1, currentSlice - 1))}
          disabled={currentSlice === 1}
          className={`mv-cine-control-btn ${currentSlice === 1 ? 'mv-disabled' : ''}`}
        >
          <SkipBack size={14} />
        </button>
        
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={totalSlices <= 1} // 🔥 슬라이스가 1개면 재생 버튼 비활성화
          className={`mv-cine-control-btn ${
            totalSlices <= 1 ? 'mv-disabled' : 
            isPlaying ? 'mv-playing' : 'mv-paused'
          }`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        <button
          onClick={() => setCurrentSlice(Math.min(totalSlices, currentSlice + 1))}
          disabled={currentSlice === totalSlices}
          className={`mv-cine-control-btn ${currentSlice === totalSlices ? 'mv-disabled' : ''}`}
        >
          <SkipForward size={14} />
        </button>
      </div>
      
      {/* 🔥 상태 표시 추가 */}
      {totalSlices > 1 && (
        <div className="mv-cine-status">
          {isPlaying ? '▶️ 재생 중...' : '⏸️ 일시정지'}
        </div>
      )}
      
      {totalSlices <= 1 && (
        <div className="mv-cine-status mv-single-image">
          단일 이미지 (Cine 기능 비활성화)
        </div>
      )}
    </div>
  );
};

export default CineControls;