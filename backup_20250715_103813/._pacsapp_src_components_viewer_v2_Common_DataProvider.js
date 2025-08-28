// src/components/viewer_v2/Common/DataProvider.js
import { useState, useEffect } from 'react';
import { orthancService } from '../../../services/viewer_v2/orthancService';

export const useViewerData = () => {
  // 상태 관리
  const [patientID, setPatientID] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [studies, setStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [instances, setInstances] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🆕 WorkList 데이터 상태 추가
  const [workListData, setWorkListData] = useState(null);
  const [workListLoading, setWorkListLoading] = useState(false);

  // 🆕 WorkList 데이터 로딩 함수
  const loadWorkListData = async (patientId) => {
    try {
      setWorkListLoading(true);
      console.log('🏥 WorkList 데이터 로딩 중:', patientId);
      
      // 🔥 새로운 환자별 WorkList API 호출
      const response = await fetch(`http://localhost:8000/api/worklists/patient/${patientId}/`);
      
      if (!response.ok) {
        throw new Error(`WorkList API 호출 실패: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🏥 WorkList API 응답:', result);
      
      if (result && (result.patient_id || result.patientId)) {
        setWorkListData(result);
        console.log('✅ WorkList 데이터 로드 완료:', result);
      } else {
        console.log(`⚠️ 환자 ${patientId}의 WorkList 데이터 없음`);
        setWorkListData(null);
      }
      
    } catch (err) {
      console.error('❌ WorkList 데이터 로딩 실패:', err);
      setWorkListData(null);
    } finally {
      setWorkListLoading(false);
    }
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('patientID');
    
    if (id) {
      console.log('📋 URL에서 환자 ID 추출:', id);
      setPatientID(id);
      loadPatientData(id);
    } else {
      setError('환자 ID가 제공되지 않았습니다.');
      setLoading(false);
    }
  }, []);

  // 환자 데이터 로딩
  const loadPatientData = async (id) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 환자 데이터 로딩 시작:', id);

      // 🆕 WorkList 데이터도 병렬로 로딩
      loadWorkListData(id);

      // 1. 환자 정보 조회
      const patient = await orthancService.getPatientByID(id);
      if (!patient) {
        throw new Error(`환자 ID "${id}"를 찾을 수 없습니다.`);
      }

      setPatientData(patient);
      console.log('✅ 환자 정보 로드 완료:', patient);

      // 2. 스터디 목록 조회 - 원본 patientID 사용 (UUID 아님!)
      const studyList = await orthancService.getPatientStudies(id); // ✅ id (P3473) 사용
      setStudies(studyList);
      console.log('✅ 스터디 로드 완료:', studyList.length, '개');
      console.log('🚨 전체 스터디 목록:', studyList); // 디버깅 로그

      // 3. 첫 번째 스터디 자동 선택
      if (studyList.length > 0) {
        await selectStudy(studyList[0]);
      }

    } catch (err) {
      console.error('❌ 환자 데이터 로딩 실패:', err);
      setError(`데이터 로딩 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 스터디 선택
  const selectStudy = async (study) => {
    try {
      console.log('🚨 전체 스터디 객체:', study); // 디버깅 로그
      console.log('🚨 studyInstanceUID:', study.studyInstanceUID); // 디버깅 로그
      console.log('🔄 스터디 선택:', study.studyInstanceUID);
      
      setSelectedStudy(study);
      
      // studyInstanceUID 사용 (uuid 아님!)
      const seriesList = await orthancService.getStudySeries(study.studyInstanceUID);
      setSeries(seriesList);
      console.log('✅ 시리즈 로드 완료:', seriesList.length, '개');
      console.log('🚨 전체 시리즈 목록:', seriesList); // 디버깅 로그

      // 첫 번째 시리즈 자동 선택 - study 객체를 매개변수로 전달
      if (seriesList.length > 0) {
        await selectSeries(seriesList[0], study); // study 객체 전달
      }
    } catch (err) {
      console.error('❌ 스터디 선택 실패:', err);
      setError(`스터디 로딩 실패: ${err.message}`);
    }
  };

  // 시리즈 선택 - currentStudy 매개변수 추가
  const selectSeries = async (seriesItem, currentStudy = null) => {
    try {
      console.log('🚨 전체 시리즈 객체:', seriesItem); // 디버깅 로그
      console.log('🚨 seriesInstanceUID:', seriesItem.seriesInstanceUID); // 디버깅 로그
      console.log('🔄 시리즈 선택:', seriesItem.seriesInstanceUID);
      
      setSelectedSeries(seriesItem);
      
      // currentStudy가 없으면 selectedStudy 사용, 그것도 없으면 첫 번째 스터디 사용
      const studyToUse = currentStudy || selectedStudy || studies[0];
      
      if (!studyToUse) {
        throw new Error('선택된 스터디를 찾을 수 없습니다.');
      }
      
      console.log('🚨 사용할 스터디:', studyToUse.studyInstanceUID);
      
      // 올바른 파라미터 전달
      const instancesList = await orthancService.getSeriesInstances(
        studyToUse.studyInstanceUID,   // studyInstanceUID
        seriesItem.seriesInstanceUID   // seriesInstanceUID
      );
      setInstances(instancesList);
      setCurrentImageIndex(0);
      console.log('✅ 인스턴스 로드 완료:', instancesList.length, '개');
      console.log('🚨 전체 인스턴스 목록:', instancesList); // 디버깅 로그
    } catch (err) {
      console.error('❌ 시리즈 선택 실패:', err);
      setError(`시리즈 로딩 실패: ${err.message}`);
    }
  };

  // 이미지 네비게이션
  const goToPrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToNextImage = () => {
    if (currentImageIndex < instances.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // 현재 이미지 URL
  const getCurrentImageUrl = () => {
    if (instances.length > 0 && instances[currentImageIndex]) {
      return instances[currentImageIndex].previewUrl;
    }
    return null;
  };

  // 이미지 인덱스 설정
  const setImageIndex = (index) => {
    if (index >= 0 && index < instances.length) {
      setCurrentImageIndex(index);
    }
  };

  // 새로고침 함수
  const refreshData = () => {
    window.location.reload();
  };

  // 반환할 데이터와 함수들
  return {
    // 상태 데이터
    patientID,
    patientData,
    studies,
    selectedStudy,
    series,
    selectedSeries,
    instances,
    currentImageIndex,
    loading,
    error,
    
    // 🆕 WorkList 데이터 추가
    workListData,
    workListLoading,
    
    // 함수들
    selectStudy,
    selectSeries,
    goToPrevImage,
    goToNextImage,
    getCurrentImageUrl,
    setImageIndex,
    refreshData,
    
    // 유틸리티
    hasData: {
      hasStudies: studies.length > 0,
      hasSeries: series.length > 0,
      hasInstances: instances.length > 0,
      hasCurrentImage: getCurrentImageUrl() !== null,
      hasWorkListData: workListData !== null  // 🆕 추가
    },
    
    // 네비게이션 상태
    canGoPrev: currentImageIndex > 0,
    canGoNext: currentImageIndex < instances.length - 1,
    
    // 이미지 정보
    imageInfo: {
      current: currentImageIndex + 1,
      total: instances.length,
      displayText: instances.length > 0 ? `${currentImageIndex + 1} / ${instances.length}` : '0 / 0'
    }
  };
};