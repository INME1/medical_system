import React, { useEffect, useRef, useState } from 'react';

const DicomViewer = ({ studyInstanceUID, orthancUrl = "http://localhost:8042" }) => {
  const viewerRef = useRef(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [imageInfo, setImageInfo] = useState(null);

  useEffect(() => {
    if (studyInstanceUID) {
      loadDicomImages();
    }
  }, [studyInstanceUID]);

  const loadDicomImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading DICOM images for Study UID:', studyInstanceUID);
      
      // 1. Orthanc에서 Study UID로 Study 찾기
      const studyResponse = await fetch(`${orthancUrl}/tools/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('orthanc:orthanc')
        },
        body: JSON.stringify({
          Level: 'Study',
          Query: {
            StudyInstanceUID: studyInstanceUID
          }
        })
      });

      if (!studyResponse.ok) {
        throw new Error(`Study 검색 실패: ${studyResponse.status}`);
      }

      const studyIds = await studyResponse.json();
      console.log('Found studies:', studyIds);

      if (studyIds.length === 0) {
        throw new Error('해당 Study UID를 가진 DICOM이 Orthanc에 없습니다.');
      }

      // 2. Study의 모든 Series 가져오기
      const studyId = studyIds[0];
      const studyInfoResponse = await fetch(`${orthancUrl}/studies/${studyId}`, {
        headers: {
          'Authorization': 'Basic ' + btoa('orthanc:orthanc')
        }
      });

      if (!studyInfoResponse.ok) {
        throw new Error('Study 정보 조회 실패');
      }

      const studyInfo = await studyInfoResponse.json();
      console.log('Study info:', studyInfo);

      // 3. 모든 Series의 Instance 가져오기
      const allInstances = [];
      const seriesPromises = studyInfo.Series.map(async (seriesId) => {
        const seriesResponse = await fetch(`${orthancUrl}/series/${seriesId}`, {
          headers: {
            'Authorization': 'Basic ' + btoa('orthanc:orthanc')
          }
        });
        
        if (seriesResponse.ok) {
          const seriesInfo = await seriesResponse.json();
          return seriesInfo.Instances || [];
        }
        return [];
      });

      const seriesResults = await Promise.all(seriesPromises);
      seriesResults.forEach(instances => {
        allInstances.push(...instances);
      });

      console.log('Found instances:', allInstances);

      if (allInstances.length === 0) {
        throw new Error('DICOM 인스턴스를 찾을 수 없습니다.');
      }

      // 4. 첫 번째 인스턴스 정보 가져오기
      const firstInstanceResponse = await fetch(`${orthancUrl}/instances/${allInstances[0]}`, {
        headers: {
          'Authorization': 'Basic ' + btoa('orthanc:orthanc')
        }
      });

      if (firstInstanceResponse.ok) {
        const instanceInfo = await firstInstanceResponse.json();
        setImageInfo({
          patientName: instanceInfo.MainDicomTags?.PatientName || 'Unknown',
          studyDate: instanceInfo.MainDicomTags?.StudyDate || '',
          modality: instanceInfo.MainDicomTags?.Modality || '',
          bodyPart: instanceInfo.MainDicomTags?.BodyPartExamined || '',
          instanceCount: allInstances.length
        });
      }

      // 5. 이미지 URL 목록 생성
      const imageUrls = allInstances.map(instanceId => ({
        id: instanceId,
        previewUrl: `${orthancUrl}/instances/${instanceId}/preview`,
        downloadUrl: `${orthancUrl}/instances/${instanceId}/file`
      }));

      setImages(imageUrls);
      setCurrentImageIndex(0);

    } catch (err) {
      console.error('DICOM 로드 에러:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        color: '#fff',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '15px' }}>🔄</div>
        <div>DICOM 이미지 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        color: '#fff',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.7 }}>⚠️</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>DICOM 로드 실패</div>
        <div style={{ fontSize: '14px', opacity: 0.8, textAlign: 'center', maxWidth: '80%' }}>
          {error}
        </div>
        <button
          onClick={loadDicomImages}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        color: '#fff',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.7 }}>📷</div>
        <div style={{ fontSize: '18px' }}>DICOM 이미지가 없습니다</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: '#000' }}>
      {/* 좌측 썸네일 패널 */}
      <div style={{
        width: '200px',
        backgroundColor: '#2c3e50',
        overflowY: 'auto',
        borderRight: '2px solid #34495e'
      }}>
        <div style={{
          padding: '15px',
          borderBottom: '1px solid #34495e',
          color: '#fff'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            📋 DICOM 정보
          </div>
          {imageInfo && (
            <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
              <div><strong>환자:</strong> {imageInfo.patientName}</div>
              <div><strong>날짜:</strong> {imageInfo.studyDate}</div>
              <div><strong>종류:</strong> {imageInfo.modality}</div>
              <div><strong>부위:</strong> {imageInfo.bodyPart}</div>
              <div><strong>이미지:</strong> {imageInfo.instanceCount}개</div>
            </div>
          )}
        </div>

        <div style={{ padding: '10px' }}>
          <div style={{
            fontSize: '12px',
            color: '#bdc3c7',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            🖼️ 이미지 목록 ({images.length})
          </div>
          {images.map((image, index) => (
            <div
              key={image.id}
              onClick={() => handleImageClick(index)}
              style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: currentImageIndex === index ? '#3498db' : '#34495e',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: currentImageIndex === index ? '2px solid #2980b9' : '2px solid transparent'
              }}
            >
              <img
                src={`${image.previewUrl}?${Date.now()}`}
                alt={`DICOM ${index + 1}`}
                style={{
                  width: '100%',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '2px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                width: '100%',
                height: '80px',
                backgroundColor: '#7f8c8d',
                borderRadius: '2px',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px'
              }}>
                이미지 로드 실패
              </div>
              <div style={{
                fontSize: '11px',
                color: '#bdc3c7',
                marginTop: '4px',
                textAlign: 'center'
              }}>
                이미지 {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 메인 이미지 뷰어 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 툴바 */}
        <div style={{
          height: '50px',
          backgroundColor: '#34495e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 15px',
          borderBottom: '1px solid #2c3e50'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrevImage}
              disabled={currentImageIndex === 0}
              style={{
                padding: '6px 12px',
                backgroundColor: currentImageIndex === 0 ? '#7f8c8d' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              ◀ 이전
            </button>
            <button
              onClick={handleNextImage}
              disabled={currentImageIndex === images.length - 1}
              style={{
                padding: '6px 12px',
                backgroundColor: currentImageIndex === images.length - 1 ? '#7f8c8d' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentImageIndex === images.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              다음 ▶
            </button>
          </div>
          
          <div style={{ color: '#fff', fontSize: '14px' }}>
            {currentImageIndex + 1} / {images.length}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={`${images[currentImageIndex]?.downloadUrl}?${Date.now()}`}
              download={`dicom_image_${currentImageIndex + 1}.dcm`}
              style={{
                padding: '6px 12px',
                backgroundColor: '#27ae60',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              💾 다운로드
            </a>
          </div>
        </div>

        {/* 메인 이미지 */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
          position: 'relative'
        }}>
          {images[currentImageIndex] && (
            <img
              src={`${images[currentImageIndex].previewUrl}?${Date.now()}`}
              alt={`DICOM 이미지 ${currentImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )}
          <div style={{
            display: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '18px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.7 }}>⚠️</div>
            <div>이미지를 불러올 수 없습니다</div>
          </div>
        </div>

        {/* 하단 정보 바 */}
        <div style={{
          height: '40px',
          backgroundColor: '#2c3e50',
          color: '#bdc3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 15px',
          fontSize: '12px'
        }}>
          <div>
            🏷️ Study UID: {studyInstanceUID.length > 40 ? studyInstanceUID.substring(0, 40) + '...' : studyInstanceUID}
          </div>
          <div>
            📡 Orthanc: {orthancUrl}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DicomViewer;