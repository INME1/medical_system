import React, { useState, useEffect } from 'react';

const SimpleDicomImageViewer = ({ studyId, studyUid, patientInfo }) => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (studyId) {
      loadDicomImages();
    }
  }, [studyId]);

  const loadDicomImages = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🖼️ DICOM 이미지 로드:', studyId);

      // 백엔드 API로 Study 상세 정보 가져오기 (series_details와 instances 포함)
      const response = await fetch(`${API_BASE}integration/dicom/studies/${studyId}/details/`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Study 정보 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Study 데이터:', data);
      
      if (!data.success || !data.study_details) {
        throw new Error('Study 데이터가 없습니다');
      }

      const study = data.study_details;
      
      // Series에서 Instance들 수집
      const allInstances = [];
      if (study.series_details) {
        study.series_details.forEach((series, seriesIndex) => {
          if (series.instances) {
            series.instances.forEach((instance, instanceIndex) => {
              allInstances.push({
                id: instance.instance_id,
                seriesIndex,
                instanceIndex,
                // 직접 Orthanc URL 사용 (CORS 문제 있을 수 있음)
                imageUrl: `http://localhost:8042/instances/${instance.instance_id}/preview`,
                downloadUrl: `http://localhost:8042/instances/${instance.instance_id}/file`,
                instanceNumber: instanceIndex + 1,
                seriesDescription: series.series_info?.MainDicomTags?.SeriesDescription || 'Unknown Series'
              });
            });
          }
        });
      }

      if (allInstances.length === 0) {
        throw new Error('Instance가 없습니다');
      }

      setImages(allInstances);
      setCurrentImageIndex(0);

      // 환자 정보 설정
      setImageInfo({
        patientName: study.PatientMainDicomTags?.PatientName || patientInfo?.name || 'Unknown',
        patientId: study.PatientMainDicomTags?.PatientID || patientInfo?.id || 'Unknown',
        studyDate: study.MainDicomTags?.StudyDate || '',
        modality: study.series_details[0]?.series_info?.MainDicomTags?.Modality || 'Unknown',
        studyDescription: study.MainDicomTags?.StudyDescription || '',
        totalImages: allInstances.length
      });

      console.log('✅ DICOM 이미지 로드 완료:', allInstances.length, '개');
      console.log('이미지 목록:', allInstances);

    } catch (err) {
      console.error('❌ DICOM 이미지 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToImage = (index) => {
    if (index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        nextImage();
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        previousImage();
        break;
      default:
        break;
    }
  };

  // 마우스 휠 이벤트 처리
  const handleWheel = (event) => {
    event.preventDefault();
    if (event.deltaY > 0) {
      nextImage();
    } else {
      previousImage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl">DICOM 이미지 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl mb-4">오류 발생</div>
          <div className="text-red-300 mb-4">{error}</div>
          <button 
            onClick={loadDicomImages}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🖼️</div>
          <div className="text-xl">표시할 이미지가 없습니다</div>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <div 
      className="relative w-full h-full bg-black"
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      tabIndex={0}
    >
      {/* 상단 정보 */}
      <div className="absolute top-4 left-4 z-20 bg-gray-800 bg-opacity-90 rounded-lg p-3 text-white">
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="font-medium">환자:</span> {imageInfo?.patientName}
          </div>
          <div>
            <span className="font-medium">ID:</span> {imageInfo?.patientId}
          </div>
          <div>
            <span className="font-medium">모달리티:</span> {imageInfo?.modality}
          </div>
        </div>
      </div>

      {/* 이미지 정보 */}
      <div className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg text-sm">
        <div>이미지: {currentImageIndex + 1} / {images.length}</div>
        <div className="mt-1">Series: {currentImage?.seriesDescription}</div>
      </div>

      {/* 메인 이미지 */}
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={currentImage.imageUrl}
          alt={`DICOM Image ${currentImageIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => {
            console.error('이미지 로드 실패:', e);
            e.target.style.filter = 'brightness(0.5)';
          }}
        />
      </div>

      {/* 하단 네비게이션 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center space-x-2 bg-gray-800 bg-opacity-90 rounded-lg p-2">
            <button 
              onClick={previousImage}
              disabled={currentImageIndex <= 0}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              ← Prev
            </button>
            
            <span className="text-white text-sm px-3">
              {currentImageIndex + 1} / {images.length}
            </span>
            
            <button 
              onClick={nextImage}
              disabled={currentImageIndex >= images.length - 1}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="absolute bottom-4 right-4 z-20 bg-gray-800 bg-opacity-90 text-white p-2 rounded text-xs">
        <div>키보드: ↑↓ 또는 ←→ 이미지 이동</div>
        <div>마우스 휠: 이미지 스크롤</div>
      </div>
    </div>
  );
};

export default SimpleDicomImageViewer;