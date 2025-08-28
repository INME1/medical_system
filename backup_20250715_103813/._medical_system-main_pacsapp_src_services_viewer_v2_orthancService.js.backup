// src/services/viewer_v2/orthancService.js

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://35.225.63.41:8000'; // 포트 8000으로 수정
const VIEWER_API = `${API_BASE}/api/viewer-v2`; // 새로운 viewer-v2 API 사용

export const orthancService = {
  /**
   * 환자 ID로 환자 정보 조회
   * @param {string} patientID - 환자 ID (예: P3473)
   * @returns {Object|null} 환자 정보 또는 null
   */
  async getPatientByID(patientID) {
    try {
      console.log('🔍 환자 검색 중:', patientID);
      
      // RESTful API로 환자 정보 조회
      const response = await fetch(`${VIEWER_API}/patients/${patientID}/`);
      
      if (response.status === 404) {
        console.log('❌ 환자를 찾을 수 없음:', patientID);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const patientData = await response.json();
      console.log('✅ 환자 찾음:', patientData);
      
      return {
        uuid: patientData.uuid,
        patientID: patientData.patient_id,
        patientName: patientData.patient_name,
        patientBirthDate: patientData.patient_birth_date,
        patientSex: patientData.patient_sex,
        studiesCount: patientData.studies_count,
        ...patientData
      };
      
    } catch (error) {
      console.error('❌ 환자 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 환자의 스터디 목록 조회 (DICOMweb QIDO-RS 방식)
   * @param {string} patientID - 환자 ID (P3473)
   * @returns {Array} 스터디 목록
   */
  async getPatientStudies(patientID) {
    try {
      console.log('📚 환자 스터디 조회 중 (Patient ID):', patientID);
      
      // QIDO-RS로 환자의 스터디 검색 - PatientID 사용
      const response = await fetch(`${VIEWER_API}/studies/?PatientID=${patientID}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const studies = await response.json();
      console.log('✅ 스터디 로드 완료:', studies.length, '개');
      console.log('📋 원본 스터디 데이터:', studies);
      
      // DICOMweb 데이터를 일반 형식으로 변환
      const convertedStudies = studies.map(study => {
        const converted = {
          studyInstanceUID: this._getDicomValue(study, '0020000D'),
          studyID: this._getDicomValue(study, '00200010'),
          studyDate: this._getDicomValue(study, '00080020'),
          studyTime: this._getDicomValue(study, '00080030'),
          studyDescription: this._getDicomValue(study, '00081030'),
          accessionNumber: this._getDicomValue(study, '00080050'),
          modalitiesInStudy: this._getDicomValue(study, '00080061'),
          referringPhysicianName: this._getDicomValue(study, '00080090'),
          patientName: this._getDicomValue(study, '00100010'),
          patientID: this._getDicomValue(study, '00100020'),
          patientBirthDate: this._getDicomValue(study, '00100030'),
          patientSex: this._getDicomValue(study, '00100040'),
          numberOfSeries: this._getDicomValue(study, '00201206'),
          numberOfInstances: this._getDicomValue(study, '00201208'),
          rawData: study // 원본 DICOMweb 데이터
        };
        
        console.log('🔄 변환된 스터디:', converted);
        return converted;
      });
      
      return convertedStudies;
      
    } catch (error) {
      console.error('❌ 스터디 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 스터디의 시리즈 목록 조회 (DICOMweb QIDO-RS 방식)
   * @param {string} studyInstanceUID - 스터디 인스턴스 UID
   * @returns {Array} 시리즈 목록
   */
  async getStudySeries(studyInstanceUID) {
    try {
      console.log('🎞️ 시리즈 조회 중:', studyInstanceUID);
      
      // QIDO-RS로 시리즈 조회
      const response = await fetch(`${VIEWER_API}/studies/${studyInstanceUID}/series/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const series = await response.json();
      console.log('✅ 시리즈 로드 완료:', series.length, '개');
      
      // DICOMweb 데이터를 일반 형식으로 변환
      return series.map(seriesItem => ({
        seriesInstanceUID: this._getDicomValue(seriesItem, '0020000E'),
        seriesNumber: this._getDicomValue(seriesItem, '00200011'),
        seriesDescription: this._getDicomValue(seriesItem, '0008103E'),
        modality: this._getDicomValue(seriesItem, '00080060'),
        seriesDate: this._getDicomValue(seriesItem, '00080021'),
        seriesTime: this._getDicomValue(seriesItem, '00080031'),
        laterality: this._getDicomValue(seriesItem, '00200060'),
        bodyPartExamined: this._getDicomValue(seriesItem, '00180015'),
        protocolName: this._getDicomValue(seriesItem, '00181030'),
        numberOfInstances: this._getDicomValue(seriesItem, '00201209'),
        rawData: seriesItem // 원본 DICOMweb 데이터
      }));
      
    } catch (error) {
      console.error('❌ 시리즈 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 시리즈의 인스턴스(이미지) 목록 조회 (DICOMweb QIDO-RS 방식)
   * @param {string} studyInstanceUID - 스터디 인스턴스 UID
   * @param {string} seriesInstanceUID - 시리즈 인스턴스 UID
   * @returns {Array} 인스턴스 목록
   */
  async getSeriesInstances(studyInstanceUID, seriesInstanceUID) {
    try {
      console.log('🖼️ 인스턴스 조회 중:', studyInstanceUID, seriesInstanceUID);
      
      // QIDO-RS로 인스턴스 조회
      const response = await fetch(`${VIEWER_API}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const instances = await response.json();
      console.log('✅ 인스턴스 로드 완료:', instances.length, '개');
      
      // DICOMweb 데이터를 일반 형식으로 변환하고 정렬
      const convertedInstances = instances.map((instance, index) => ({
        sopInstanceUID: this._getDicomValue(instance, '00080018'),
        sopClassUID: this._getDicomValue(instance, '00080016'),
        instanceNumber: parseInt(this._getDicomValue(instance, '00200013')) || (index + 1),
        numberOfFrames: parseInt(this._getDicomValue(instance, '00280008')) || 1,
        rows: this._getDicomValue(instance, '00280010'),
        columns: this._getDicomValue(instance, '00280011'),
        bitsAllocated: this._getDicomValue(instance, '00280100'),
        bitsStored: this._getDicomValue(instance, '00280101'),
        highBit: this._getDicomValue(instance, '00280102'),
        pixelRepresentation: this._getDicomValue(instance, '00280103'),
        // 이미지 URL 생성
        previewUrl: this.getDicomImageUrl(studyInstanceUID, seriesInstanceUID, this._getDicomValue(instance, '00080018')),
        downloadUrl: this.getDicomFileUrl(studyInstanceUID, seriesInstanceUID, this._getDicomValue(instance, '00080018')),
        rawData: instance // 원본 DICOMweb 데이터
      }));
      
      // 인스턴스 번호로 정렬
      convertedInstances.sort((a, b) => a.instanceNumber - b.instanceNumber);
      
      return convertedInstances;
      
    } catch (error) {
      console.error('❌ 인스턴스 조회 실패:', error);
      throw error;
    }
  },

  /**
   * DICOM 이미지 미리보기 URL 생성 (WADO-RS 방식)
   * @param {string} studyInstanceUID - 스터디 인스턴스 UID
   * @param {string} seriesInstanceUID - 시리즈 인스턴스 UID
   * @param {string} sopInstanceUID - SOP 인스턴스 UID
   * @param {number} frame - 프레임 번호 (기본값: 1)
   * @returns {string} 이미지 URL
   */
  getDicomImageUrl(studyInstanceUID, seriesInstanceUID, sopInstanceUID, frame = 1) {
    return `${VIEWER_API}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/frames/${frame}/rendered`;
  },

  /**
   * DICOM 파일 다운로드 URL 생성 (WADO-RS 방식)
   * @param {string} studyInstanceUID - 스터디 인스턴스 UID
   * @param {string} seriesInstanceUID - 시리즈 인스턴스 UID
   * @param {string} sopInstanceUID - SOP 인스턴스 UID
   * @returns {string} 파일 URL
   */
  getDicomFileUrl(studyInstanceUID, seriesInstanceUID, sopInstanceUID) {
    return `${VIEWER_API}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`;
  },

  /**
   * Instance 미리보기 이미지 URL 생성 (편의 API)
   * @param {string} sopInstanceUID - SOP 인스턴스 UID
   * @returns {string} 미리보기 URL
   */
  getInstancePreviewUrl(sopInstanceUID) {
    return `${VIEWER_API}/preview/instances/${sopInstanceUID}/`;
  },

  /**
   * Study 썸네일 이미지 URL 생성 (편의 API)
   * @param {string} studyInstanceUID - 스터디 인스턴스 UID
   * @returns {string} 썸네일 URL
   */
  getStudyThumbnailUrl(studyInstanceUID) {
    return `${VIEWER_API}/preview/studies/${studyInstanceUID}/thumbnail/`;
  },

  /**
   * 환자 전체 데이터 한번에 로딩 (편의 함수)
   * @param {string} patientID - 환자 ID
   * @returns {Object} 환자의 모든 데이터 (환자정보, 스터디, 시리즈, 인스턴스)
   */
  async loadPatientData(patientID) {
    try {
      console.log('🔄 환자 전체 데이터 로딩 시작:', patientID);
      
      // 1. 환자 정보 조회
      const patient = await this.getPatientByID(patientID);
      if (!patient) {
        throw new Error(`환자 ID "${patientID}"를 찾을 수 없습니다.`);
      }
      
      // 2. 스터디 목록 조회 - 원본 patientID 사용 (UUID 아님!)
      const studies = await this.getPatientStudies(patientID); // ✅ 원본 patientID 사용
      
      // 3. 첫 번째 스터디의 시리즈 조회 (있는 경우)
      if (studies.length > 0) {
        const firstStudy = studies[0];
        firstStudy.seriesData = await this.getStudySeries(firstStudy.studyInstanceUID);
        
        // 4. 첫 번째 시리즈의 인스턴스 조회 (있는 경우)
        if (firstStudy.seriesData.length > 0) {
          const firstSeries = firstStudy.seriesData[0];
          firstSeries.instancesData = await this.getSeriesInstances(
            firstStudy.studyInstanceUID,
            firstSeries.seriesInstanceUID
          );
        }
      }
      
      console.log('✅ 환자 전체 데이터 로딩 완료');
      return {
        patient,
        studies
      };
      
    } catch (error) {
      console.error('❌ 환자 전체 데이터 로딩 실패:', error);
      throw error;
    }
  },

  /**
   * 검색 기능
   */
  
  /**
   * 환자 검색
   * @param {Object} searchParams - 검색 파라미터
   * @returns {Array} 환자 목록
   */
  async searchPatients(searchParams = {}) {
    try {
      console.log('🔍 환자 검색:', searchParams);
      
      const queryParams = new URLSearchParams(searchParams);
      const response = await fetch(`${VIEWER_API}/search/patients/?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const patients = await response.json();
      console.log('✅ 환자 검색 완료:', patients.length, '명');
      
      return patients;
      
    } catch (error) {
      console.error('❌ 환자 검색 실패:', error);
      throw error;
    }
  },

  /**
   * 스터디 검색 (DICOMweb QIDO-RS 방식)
   * @param {Object} searchParams - 검색 파라미터
   * @returns {Array} 스터디 목록
   */
  async searchStudies(searchParams = {}) {
    try {
      console.log('🔍 스터디 검색:', searchParams);
      
      const queryParams = new URLSearchParams(searchParams);
      const response = await fetch(`${VIEWER_API}/studies/?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const studies = await response.json();
      console.log('✅ 스터디 검색 완료:', studies.length, '개');
      
      return studies.map(study => ({
        studyInstanceUID: this._getDicomValue(study, '0020000D'),
        studyID: this._getDicomValue(study, '00200010'),
        studyDate: this._getDicomValue(study, '00080020'),
        studyTime: this._getDicomValue(study, '00080030'),
        studyDescription: this._getDicomValue(study, '00081030'),
        patientName: this._getDicomValue(study, '00100010'),
        patientID: this._getDicomValue(study, '00100020'),
        modalitiesInStudy: this._getDicomValue(study, '00080061'),
        rawData: study
      }));
      
    } catch (error) {
      console.error('❌ 스터디 검색 실패:', error);
      throw error;
    }
  },

  /**
   * 시스템 정보 및 통계
   */
  
  /**
   * Orthanc 시스템 정보 조회
   * @returns {Object} 시스템 정보
   */
  async getSystemInfo() {
    try {
      const response = await fetch(`${VIEWER_API}/system/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ 시스템 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * Orthanc 통계 정보 조회
   * @returns {Object} 통계 정보
   */
  async getStatistics() {
    try {
      const response = await fetch(`${VIEWER_API}/stats/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ 통계 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 테스트 및 디버깅
   */
  
  /**
   * Orthanc 연결 테스트
   * @returns {Object} 연결 테스트 결과
   */
  async testConnection() {
    try {
      const response = await fetch(`${VIEWER_API}/test/connection/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ 연결 테스트 실패:', error);
      throw error;
    }
  },

  /**
   * DICOMweb 기능 테스트
   * @returns {Object} DICOMweb 테스트 결과
   */
  async testDicomWeb() {
    try {
      const response = await fetch(`${VIEWER_API}/test/dicomweb/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ DICOMweb 테스트 실패:', error);
      throw error;
    }
  },

  /**
   * 환자 데이터 디버깅
   * @param {string} patientID - 환자 ID
   * @returns {Object} 디버깅 정보
   */
  async debugPatientData(patientID) {
    try {
      const response = await fetch(`${VIEWER_API}/debug/patient/${patientID}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ 환자 디버깅 실패:', error);
      throw error;
    }
  },

  /**
   * 스터디 데이터 디버깅
   * @param {string} studyInstanceUID - 스터디 인스턴스 UID
   * @returns {Object} 디버깅 정보
   */
  async debugStudyData(studyInstanceUID) {
    try {
      const response = await fetch(`${VIEWER_API}/debug/study/${studyInstanceUID}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ 스터디 디버깅 실패:', error);
      throw error;
    }
  },

  /**
   * 유틸리티 함수들
   */
  
  /**
   * DICOMweb 형식에서 값 추출
   * @private
   * @param {Object} dicomwebData - DICOMweb 데이터
   * @param {string} tag - DICOM 태그
   * @returns {string} 추출된 값
   */
  _getDicomValue(dicomwebData, tag) {
    try {
      if (dicomwebData && dicomwebData[tag]) {
        const tagData = dicomwebData[tag];
        
        // Value 배열이 있는 경우
        if (tagData.Value && Array.isArray(tagData.Value) && tagData.Value.length > 0) {
          const value = tagData.Value[0];
          
          // PersonName 타입인 경우 (환자명, 의사명 등)
          if (typeof value === 'object' && value.Alphabetic) {
            return value.Alphabetic;
          }
          
          // 일반 값인 경우
          return String(value);
        }
        
        // Value가 없지만 vr만 있는 경우 (빈 값)
        if (tagData.vr && !tagData.Value) {
          console.warn(`DICOM 태그 ${tag}에 값이 없습니다 (vr: ${tagData.vr})`);
          return '';
        }
      }
      
      return '';
    } catch (error) {
      console.warn('DICOM 값 추출 실패:', tag, error);
      return '';
    }
  },

  /**
   * 날짜 포맷 변환 (DICOM → 표시용)
   * @param {string} dicomDate - DICOM 날짜 (YYYYMMDD)
   * @returns {string} 포맷된 날짜
   */
  formatDicomDate(dicomDate) {
    if (!dicomDate || dicomDate.length !== 8) {
      return '';
    }
    
    try {
      const year = dicomDate.substring(0, 4);
      const month = dicomDate.substring(4, 6);
      const day = dicomDate.substring(6, 8);
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('날짜 포맷 변환 실패:', dicomDate, error);
      return dicomDate;
    }
  },

  /**
   * 시간 포맷 변환 (DICOM → 표시용)
   * @param {string} dicomTime - DICOM 시간 (HHMMSS.ffffff)
   * @returns {string} 포맷된 시간
   */
  formatDicomTime(dicomTime) {
    if (!dicomTime || dicomTime.length < 6) {
      return '';
    }
    
    try {
      const hour = dicomTime.substring(0, 2);
      const minute = dicomTime.substring(2, 4);
      const second = dicomTime.substring(4, 6);
      return `${hour}:${minute}:${second}`;
    } catch (error) {
      console.warn('시간 포맷 변환 실패:', dicomTime, error);
      return dicomTime;
    }
  },

  /**
   * 파일 크기 포맷 변환
   * @param {number} bytes - 바이트 크기
   * @returns {string} 포맷된 크기
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * API 기본 URL 반환
   * @returns {string} API 기본 URL
   */
  getApiBaseUrl() {
    return VIEWER_API;
  }
};