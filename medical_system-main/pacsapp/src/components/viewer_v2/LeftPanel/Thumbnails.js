import React from 'react';
import { Monitor } from 'lucide-react';
import './Thumbnails.css';

const Thumbnails = ({ 
  currentSlice = 1, 
  setCurrentSlice,
  
  // 🔥 실제 데이터 props 추가
  instances = [],
  totalSlices = 1
}) => {
  // 🔥 실제 instances 데이터 사용
  const handleThumbnailClick = (sliceNumber) => {
    setCurrentSlice(sliceNumber);
  };

  // 🔥 instances가 없으면 빈 상태 표시
  if (!instances || instances.length === 0) {
    return (
      <div className="mv-thumbnails-container">
        <h4 className="mv-thumbnails-title">Thumbnail</h4>
        <div className="mv-thumbnails-empty">
          <p>이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mv-thumbnails-container">
      <div className="mv-thumbnails-header">
        <Monitor size={16} color="#cbd5e1" />
        <h4 className="mv-thumbnails-title">Thumbnail ({instances.length}개)</h4>
      </div>
      
      <div className="mv-thumbnails-grid">
        {instances.map((instance, index) => {
          const sliceNumber = index + 1;
          const isActive = currentSlice === sliceNumber;
          
          return (
            <div
              key={instance.sopInstanceUID || index}
              className={`mv-thumbnail-item ${isActive ? 'mv-active' : ''}`}
              onClick={() => handleThumbnailClick(sliceNumber)}
              title={`Slice ${sliceNumber} - Instance ${instance.instanceNumber || sliceNumber}`}
            >
              {/* 🔥 실제 썸네일 이미지 표시 */}
              {instance.previewUrl ? (
                <img 
                  src={instance.previewUrl}
                  alt={`Thumbnail ${sliceNumber}`}
                  className="mv-thumbnail-image"
                  onError={(e) => {
                    // 이미지 로드 실패 시 폴백
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* 🔥 폴백 텍스트 */}
              <div 
                className="mv-thumbnail-fallback"
                style={{ display: instance.previewUrl ? 'none' : 'flex' }}
              >
                {sliceNumber}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 🔥 단일 이미지일 때 안내 */}
      {instances.length === 1 && (
        <div className="mv-thumbnails-info">
          단일 이미지
        </div>
      )}
    </div>
  );
};

export default Thumbnails;