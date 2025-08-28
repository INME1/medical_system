// frontend/src/components/RIS/CornerstoneViewer.jsx - patient_id로 모든 스터디 로드

import React, { useEffect, useRef, useState } from 'react';

const CornerstoneViewer = ({ 
  patientId,  // studyUid 대신 patientId 사용
  patientInfo,
  onImageChange,
  className = "",
  style = {} 
}) => {
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [studies, setStudies] = useState([]);
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0);

  // API 기본 URL
  const ORTHANC_URL = process.env.REACT_APP_ORTHANC_URL || 'http://35.225.63.41:8042';

  // patientId 변경시 모든 스터디 로드
  useEffect(() => {
    if (patientId) {
      loadPatientStudies(patientId);
    }
  }, [patientId]);

  // 환자의 모든 DICOM 스터디 로드
  const loadPatientStudies = async (patientId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 환자의 모든 DICOM 스터디 검색:', patientId);

      // 1. Orthanc에서 Patient ID로 검색
      const searchResponse = await fetch(`${ORTHANC_URL}/tools/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('orthanc:orthanc')
        },
        body: JSON.stringify({
          "Level": "Patient",
          "Query": {
            "PatientID": patientId
          }
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Patient 검색 실패: ${searchResponse.status}`);
      }

      const patientIds = await searchResponse.json();
      if (patientIds.length === 0) {
        throw new Error(`Patient ID ${patientId}를 찾을 수 없습니다`);
      }

      // 2. Patient의 모든 Study 가져오기
      const orthancPatientId = patientIds[0];
      const patientResponse = await fetch(`${ORTHANC_URL}/patients/${orthancPatientId}`, {
        headers: {
          'Authorization': 'Basic ' + btoa('orthanc:orthanc')
        }
      });

      if (!patientResponse.ok) {
        throw new Error('Patient 정보 조회 실패');
      }

      const patientData = await patientResponse.json();
      const studyIds = patientData.Studies || [];

      if (studyIds.length === 0) {
        throw new Error('해당 환자의 Study가 없습니다');
      }

      console.log(`📚 발견된 Study 개수: ${studyIds.length}개`);

      // 3. 각 Study의 이미지들 로드
      const allStudies = [];
      const allImages = [];

      for (let i = 0; i < studyIds.length; i++) {
        const studyId = studyIds[i];
        
        try {
          // Study 정보 가져오기
          const studyResponse = await fetch(`${ORTHANC_URL}/studies/${studyId}`, {
            headers: {
              'Authorization': 'Basic ' + btoa('orthanc:orthanc')
            }
          });

          if (!studyResponse.ok) continue;

          const studyData = await studyResponse.json();
          const seriesIds = studyData.Series || [];

          // Study 메타데이터
          const studyInfo = {
            id: studyId,
            date: studyData.MainDicomTags?.StudyDate || '',
            time: studyData.MainDicomTags?.StudyTime || '',
            description: studyData.MainDicomTags?.StudyDescription || `Study ${i + 1}`,
            seriesCount: seriesIds.length,
            imageStartIndex: allImages.length
          };

          // 각 Series의 이미지들 로드
          let studyImageCount = 0;
          for (const seriesId of seriesIds) {
            try {
              const seriesResponse = await fetch(`${ORTHANC_URL}/series/${seriesId}`, {
                headers: {
                  'Authorization': 'Basic ' + btoa('orthanc:orthanc')
                }
              });

              if (!seriesResponse.ok) continue;

              const seriesData = await seriesResponse.json();
              const instanceIds = seriesData.Instances || [];

              // Series의 이미지들 추가
              instanceIds.forEach((instanceId, index) => {
                allImages.push({
                  id: instanceId,
                  imageUrl: `${ORTHANC_URL}/instances/${instanceId}/preview`,
                  downloadUrl: `${ORTHANC_URL}/instances/${instanceId}/file`,
                  studyIndex: i,
                  seriesId: seriesId,
                  instanceNumber: index + 1,
                  seriesDescription: seriesData.MainDicomTags?.SeriesDescription || 'Series',
                  modality: seriesData.MainDicomTags?.Modality || ''
                });
                studyImageCount++;
              });
            } catch (err) {
              console.warn(`Series ${seriesId} 로드 실패:`, err);
            }
          }

          studyInfo.imageCount = studyImageCount;
          allStudies.push(studyInfo);

        } catch (err) {
          console.warn(`Study ${studyId} 로드 실패:`, err);
        }
      }

      if (allImages.length === 0) {
        throw new Error('해당 환자의 이미지가 없습니다');
      }

      setStudies(allStudies);
      setImages(allImages);
      setCurrentImageIndex(0);
      setCurrentStudyIndex(0);

      // 환자 정보 설정
      if (allImages.length > 0) {
        setImageInfo({
          patientName: patientInfo?.name || 'Unknown',
          patientId: patientId,
          totalStudies: allStudies.length,
          totalImages: allImages.length
        });
      }

      console.log('✅ 환자 DICOM 로드 완료:', {
        studies: allStudies.length,
        images: allImages.length
      });

    } catch (err) {
      console.error('❌ 환자 DICOM 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 다음 이미지
  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      updateCurrentStudy(newIndex);
      
      if (onImageChange) {
        onImageChange({
          imageIndex: newIndex,
          totalImages: images.length,
          patientId: patientId
        });
      }
    }
  };

  // 이전 이미지
  const previousImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      updateCurrentStudy(newIndex);
      
      if (onImageChange) {
        onImageChange({
          imageIndex: newIndex,
          totalImages: images.length,
          patientId: patientId
        });
      }
    }
  };

  // 현재 이미지가 속한 스터디 업데이트
  const updateCurrentStudy = (imageIndex) => {
    const currentImage = images[imageIndex];
    if (currentImage && currentImage.studyIndex !== currentStudyIndex) {
      setCurrentStudyIndex(currentImage.studyIndex);
    }
  };

  // 특정 이미지로 이동
  const goToImage = (index) => {
    if (index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
      updateCurrentStudy(index);
      
      if (onImageChange) {
        onImageChange({
          imageIndex: index,
          totalImages: images.length,
          patientId: patientId
        });
      }
    }
  };

  // 특정 스터디로 이동
  const goToStudy = (studyIndex) => {
    const study = studies[studyIndex];
    if (study) {
      setCurrentStudyIndex(studyIndex);
      setCurrentImageIndex(study.imageStartIndex);
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
      case 'PageUp':
        event.preventDefault();
        if (currentStudyIndex > 0) {
          goToStudy(currentStudyIndex - 1);
        }
        break;
      case 'PageDown':
        event.preventDefault();
        if (currentStudyIndex < studies.length - 1) {
          goToStudy(currentStudyIndex + 1);
        }
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

  // 로딩 상태
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center h-full bg-black ${className}`} 
        style={style}
      >
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl mb-2">환자 DICOM 데이터 로딩 중...</div>
          <div className="text-gray-400">Patient ID: {patientId}</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center h-full bg-red-900/20 ${className}`} 
        style={style}
      >
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl mb-2">DICOM 로드 실패</div>
          <div className="text-red-300 mb-4">{error}</div>
          <button 
            onClick={() => patientId && loadPatientStudies(patientId)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 이미지가 없는 경우
  if (images.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center h-full bg-gray-900 ${className}`} 
        style={style}
      >
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📂</div>
          <div className="text-xl mb-2">DICOM 이미지 없음</div>
          <div className="text-gray-400">Patient ID: {patientId}</div>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const currentStudy = studies[currentStudyIndex];

  return (
    <div 
      className={`relative bg-black ${className}`} 
      style={style}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      tabIndex={0}
    >
      {/* 상단 환자 정보 */}
      <div className="absolute top-4 left-4 z-20 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 text-white max-w-md">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-blue-300">환자:</span> {imageInfo?.patientName || 'Unknown'}
          </div>
          <div>
            <span className="font-medium text-blue-300">Patient ID:</span> {patientId}
          </div>
          <div>
            <span className="font-medium text-blue-300">스터디:</span> {studies.length}개
          </div>
        </div>
      </div>

      {/* 현재 이미지/스터디 정보 */}
      <div className="absolute top-4 right-4 z-20 bg-gray-900/90 backdrop-blur-sm text-white p-4 rounded-xl text-sm">
        <div className="space-y-1">
          <div>
            <span className="text-blue-300">Image:</span> {currentImageIndex + 1} / {images.length}
          </div>
          <div>
            <span className="text-blue-300">Study:</span> {currentStudyIndex + 1} / {studies.length}
          </div>
          {currentStudy && (
            <div>
              <span className="text-blue-300">Date:</span> {currentStudy.date || 'N/A'}
            </div>
          )}
          {currentImage && (
            <div>
              <span className="text-blue-300">Modality:</span> {currentImage.modality || 'N/A'}
            </div>
          )}
        </div>
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
            e.target.style.display = 'none';
          }}
        />
      </div>

      {/* 하단 네비게이션 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-3 bg-gray-900/90 backdrop-blur-sm rounded-xl p-3">
          <button 
            onClick={previousImage}
            disabled={currentImageIndex <= 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          
          <span className="text-white font-medium px-4">
            {currentImageIndex + 1} / {images.length}
          </span>
          
          <button 
            onClick={nextImage}
            disabled={currentImageIndex >= images.length - 1}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* 스터디 선택 (여러 스터디가 있는 경우) */}
      {studies.length > 1 && (
        <div className="absolute left-4 bottom-4 z-20 bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 max-w-xs">
          <div className="text-white text-sm mb-2 font-medium">Studies</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {studies.map((study, index) => (
              <button
                key={study.id}
                onClick={() => goToStudy(index)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  index === currentStudyIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <div className="font-medium">{study.description}</div>
                <div className="text-gray-400">{study.date} • {study.imageCount}장</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="absolute bottom-4 right-4 z-20 bg-gray-900/90 backdrop-blur-sm text-white p-3 rounded-xl text-xs max-w-xs">
        <div className="space-y-1">
          <div>🖱️ 마우스 휠: 이미지 이동</div>
          <div>⌨️ ↑↓←→: 이미지 이동</div>
          <div>⌨️ Page Up/Down: 스터디 이동</div>
          <div>📋 총 {studies.length}개 스터디, {images.length}장 이미지</div>
        </div>
      </div>
    </div>
  );
};

export default CornerstoneViewer;