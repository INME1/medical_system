// src/hooks/usePACS.js
// import { useState, useEffect, useCallback } from 'react';
// import { fetchPacsStudies } from '../utils/api';

// /**
//  * PACS 연동 및 스터디 관리 관련 상태와 로직을 관리하는 커스텀 훅
//  * @param {Function} setAnalysisStatus - 분석 상태 메시지 설정 함수 (선택사항)
//  * @returns {Object} PACS 관련 상태와 함수들
//  */
// const usePACS = (setAnalysisStatus) => {
//     // =============================================================================
//     // 상태 관리
//     // =============================================================================
    
//     // 스터디 관련 상태
//     const [currentStudyUID, setCurrentStudyUID] = useState(null);
//     const [availableStudies, setAvailableStudies] = useState([]);
    
//     // 로딩 및 연결 상태
//     const [isLoading, setIsLoading] = useState(false);
//     const [isConnected, setIsConnected] = useState(false);
//     const [connectionError, setConnectionError] = useState(null);
    
//     // 마지막 업데이트 시간
//     const [lastUpdated, setLastUpdated] = useState(null);
    
//     // =============================================================================
//     // PACS 연결 및 스터디 조회 함수들
//     // =============================================================================
    
//     /**
//      * PACS에서 모든 스터디 목록을 가져오는 함수
//      */
//     const fetchAvailableStudies = useCallback(async () => {
//         try {
//             setIsLoading(true);
//             setConnectionError(null);
            
//             if (setAnalysisStatus) {
//                 setAnalysisStatus('PACS 연결 중...');
//             }
            
//             const data = await fetchPacsStudies();
            
//             if (data.status === 'success') {
//                 const studyList = data.studies.map(study => ({
//                     pacsId: study.pacs_id,
//                     studyUID: study.study_uid,
//                     patientId: study.patient_id,
//                     patientName: study.patient_name,
//                     studyDate: study.study_date,
//                     studyTime: study.study_time || '',
//                     modality: study.modality || '',
//                     studyDescription: study.study_description || '',
//                     seriesCount: study.series_count || 0,
//                     instanceCount: study.instance_count || 0
//                 }));
                
//                 setAvailableStudies(studyList);
//                 setIsConnected(true);
//                 setLastUpdated(new Date());
                
//                 // 첫 번째 스터디를 자동 선택
//                 if (studyList.length > 0 && !currentStudyUID) {
//                     setCurrentStudyUID(studyList[0].studyUID);
                    
//                     if (setAnalysisStatus) {
//                         setAnalysisStatus(
//                             `✅ 스터디 감지: ${studyList[0].patientName} (${studyList[0].patientId})`
//                         );
//                     }
//                 } else if (studyList.length === 0) {
//                     if (setAnalysisStatus) {
//                         setAnalysisStatus('⚠️ PACS에 스터디가 없습니다');
//                     }
//                 } else {
//                     if (setAnalysisStatus) {
//                         setAnalysisStatus(`✅ PACS 연결 성공 (${studyList.length}개 스터디)`);
//                     }
//                 }
                
//                 return studyList;
//             } else {
//                 throw new Error(data.message || 'PACS 데이터 조회 실패');
//             }
            
//         } catch (error) {
//             console.error('PACS 연결 실패:', error);
//             setIsConnected(false);
//             setConnectionError(error.message);
            
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(`❌ PACS 연결 실패: ${error.message}`);
//             }
            
//             return [];
//         } finally {
//             setIsLoading(false);
//         }
//     }, [currentStudyUID, setAnalysisStatus]);
    
//     // 컴포넌트 마운트 시 자동으로 스터디 목록 조회
//     useEffect(() => {
//         fetchAvailableStudies();
//     }, []); // eslint-disable-line react-hooks/exhaustive-deps
    
//     // =============================================================================
//     // 스터디 선택 및 관리 함수들
//     // =============================================================================
    
//     /**
//      * 현재 선택된 스터디 UID를 가져오는 함수
//      * @returns {string|null} 현재 스터디 UID
//      */
//     const getCurrentStudyUID = useCallback(() => {
//         if (currentStudyUID) {
//             return currentStudyUID;
//         }
        
//         if (availableStudies.length > 0) {
//             return availableStudies[0].studyUID;
//         }
        
//         return null;
//     }, [currentStudyUID, availableStudies]);
    
//     /**
//      * 스터디를 선택하는 함수
//      * @param {string} studyUID - 선택할 스터디 UID
//      */
//     const selectStudy = useCallback((studyUID) => {
//         const study = availableStudies.find(s => s.studyUID === studyUID);
//         if (study) {
//             setCurrentStudyUID(studyUID);
            
//             if (setAnalysisStatus) {
//                 setAnalysisStatus(
//                     `📂 스터디 선택: ${study.patientName} (${study.patientId}) - ${study.studyDate}`
//                 );
//             }
//         }
//     }, [availableStudies, setAnalysisStatus]);
    
//     /**
//      * 현재 선택된 스터디 정보를 가져오는 함수
//      * @returns {Object} 현재 스터디 정보
//      */
//     const getCurrentStudyInfo = useCallback(() => {
//         const studyUID = getCurrentStudyUID();
        
//         if (!studyUID) {
//             return {
//                 patient_name: 'Unknown',
//                 patient_id: 'Unknown',
//                 study_date: 'Unknown',
//                 study_uid: null
//             };
//         }
        
//         const currentStudy = availableStudies.find(s => s.studyUID === studyUID);
        
//         if (currentStudy) {
//             return {
//                 patient_name: currentStudy.patientName,
//                 patient_id: currentStudy.patientId,
//                 study_date: currentStudy.studyDate,
//                 study_time: currentStudy.studyTime,
//                 study_uid: currentStudy.studyUID,
//                 modality: currentStudy.modality,
//                 study_description: currentStudy.studyDescription,
//                 series_count: currentStudy.seriesCount,
//                 instance_count: currentStudy.instanceCount
//             };
//         }
        
//         return {
//             patient_name: 'Unknown',
//             patient_id: 'Unknown', 
//             study_date: 'Unknown',
//             study_uid: studyUID
//         };
//     }, [getCurrentStudyUID, availableStudies]);
    
//     // =============================================================================
//     // 스터디 검색 및 필터링 함수들
//     // =============================================================================
    
//     /**
//      * 환자 이름으로 스터디를 검색하는 함수
//      * @param {string} patientName - 검색할 환자 이름
//      * @returns {Array} 검색된 스터디 목록
//      */
//     const searchStudiesByPatientName = useCallback((patientName) => {
//         if (!patientName.trim()) return availableStudies;
        
//         return availableStudies.filter(study =>
//             study.patientName.toLowerCase().includes(patientName.toLowerCase())
//         );
//     }, [availableStudies]);
    
//     /**
//      * 환자 ID로 스터디를 검색하는 함수
//      * @param {string} patientId - 검색할 환자 ID
//      * @returns {Array} 검색된 스터디 목록
//      */
//     const searchStudiesByPatientId = useCallback((patientId) => {
//         if (!patientId.trim()) return availableStudies;
        
//         return availableStudies.filter(study =>
//             study.patientId.toLowerCase().includes(patientId.toLowerCase())
//         );
//     }, [availableStudies]);
    
//     /**
//      * 날짜 범위로 스터디를 필터링하는 함수
//      * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
//      * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
//      * @returns {Array} 필터링된 스터디 목록
//      */
//     const filterStudiesByDateRange = useCallback((startDate, endDate) => {
//         if (!startDate && !endDate) return availableStudies;
        
//         return availableStudies.filter(study => {
//             const studyDate = study.studyDate;
            
//             if (startDate && studyDate < startDate) return false;
//             if (endDate && studyDate > endDate) return false;
            
//             return true;
//         });
//     }, [availableStudies]);
    
//     /**
//      * 모달리티로 스터디를 필터링하는 함수
//      * @param {string} modality - 필터링할 모달리티 (예: 'CT', 'MR', 'CR')
//      * @returns {Array} 필터링된 스터디 목록
//      */
//     const filterStudiesByModality = useCallback((modality) => {
//         if (!modality) return availableStudies;
        
//         return availableStudies.filter(study =>
//             study.modality.toLowerCase() === modality.toLowerCase()
//         );
//     }, [availableStudies]);
    
//     // =============================================================================
//     // 스터디 통계 및 정보 함수들
//     // =============================================================================
    
//     /**
//      * 스터디 통계 정보를 가져오는 함수
//      * @returns {Object} 스터디 통계
//      */
//     const getStudyStatistics = useCallback(() => {
//         const totalStudies = availableStudies.length;
//         const uniquePatients = new Set(availableStudies.map(s => s.patientId)).size;
//         const modalities = [...new Set(availableStudies.map(s => s.modality))].filter(Boolean);
        
//         const dateRange = availableStudies.length > 0 ? {
//             earliest: Math.min(...availableStudies.map(s => new Date(s.studyDate).getTime())),
//             latest: Math.max(...availableStudies.map(s => new Date(s.studyDate).getTime()))
//         } : null;
        
//         return {
//             totalStudies,
//             uniquePatients,
//             modalities,
//             dateRange: dateRange ? {
//                 earliest: new Date(dateRange.earliest).toISOString().split('T')[0],
//                 latest: new Date(dateRange.latest).toISOString().split('T')[0]
//             } : null
//         };
//     }, [availableStudies]);
    
//     /**
//      * 특정 환자의 모든 스터디를 가져오는 함수
//      * @param {string} patientId - 환자 ID
//      * @returns {Array} 해당 환자의 스터디 목록
//      */
//     const getStudiesForPatient = useCallback((patientId) => {
//         return availableStudies.filter(study => study.patientId === patientId);
//     }, [availableStudies]);
    
//     // =============================================================================
//     // 연결 상태 관리 함수들
//     // =============================================================================
    
//     /**
//      * PACS 연결 상태를 확인하는 함수
//      * @returns {boolean} 연결 상태
//      */
//     const checkConnectionStatus = useCallback(() => {
//         return isConnected && !connectionError;
//     }, [isConnected, connectionError]);
    
//     /**
//      * 연결을 재시도하는 함수
//      */
//     const retryConnection = useCallback(async () => {
//         setConnectionError(null);
//         await fetchAvailableStudies();
//     }, [fetchAvailableStudies]);
    
//     // =============================================================================
//     // 유틸리티 함수들
//     // =============================================================================
    
//     /**
//      * PACS 상태를 초기화하는 함수
//      */
//     const resetPACSState = useCallback(() => {
//         setCurrentStudyUID(null);
//         setAvailableStudies([]);
//         setIsConnected(false);
//         setConnectionError(null);
//         setLastUpdated(null);
//     }, []);
    
//     /**
//      * 스터디가 선택되었는지 확인하는 함수
//      * @returns {boolean} 스터디 선택 여부
//      */
//     const hasSelectedStudy = useCallback(() => {
//         return Boolean(getCurrentStudyUID());
//     }, [getCurrentStudyUID]);
    
//     /**
//      * 스터디 목록이 비어있는지 확인하는 함수
//      * @returns {boolean} 빈 목록 여부
//      */
//     const isStudyListEmpty = useCallback(() => {
//         return availableStudies.length === 0;
//     }, [availableStudies]);
    
//     // =============================================================================
//     // 반환값
//     // =============================================================================
    
//     return {
//         // 상태
//         currentStudyUID,
//         availableStudies,
//         isLoading,
//         isConnected,
//         connectionError,
//         lastUpdated,
        
//         // PACS 연결
//         fetchAvailableStudies,
//         retryConnection,
//         checkConnectionStatus,
        
//         // 스터디 관리
//         getCurrentStudyUID,
//         selectStudy,
//         getCurrentStudyInfo,
        
//         // 검색 및 필터링
//         searchStudiesByPatientName,
//         searchStudiesByPatientId,
//         filterStudiesByDateRange,
//         filterStudiesByModality,
        
//         // 통계 및 정보
//         getStudyStatistics,
//         getStudiesForPatient,
        
//         // 유틸리티
//         resetPACSState,
//         hasSelectedStudy,
//         isStudyListEmpty,
        
//         // 상태 설정 함수들 (필요한 경우)
//         setCurrentStudyUID,
//         setAvailableStudies
//     };
// };

// export default usePACS;

// src/hooks/usePACS.js
import { useState, useEffect, useCallback } from 'react';
import { fetchPacsStudies } from '../utils/api';

/**
 * PACS 연동 및 스터디 관리 관련 상태와 로직을 관리하는 커스텀 훅
 * @param {Function} setAnalysisStatus - 분석 상태 메시지 설정 함수 (선택사항)
 * @returns {Object} PACS 관련 상태와 함수들
 */
const usePACS = (setAnalysisStatus) => {
    // =============================================================================
    // 상태 관리
    // =============================================================================
    
    // 스터디 관련 상태
    const [currentStudyUID, setCurrentStudyUID] = useState(null);
    const [availableStudies, setAvailableStudies] = useState([]);
    
    // 로딩 및 연결 상태
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    
    // 마지막 업데이트 시간
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // =============================================================================
    // PACS 연결 및 스터디 조회 함수들
    // =============================================================================
    
    /**
     * PACS에서 모든 스터디 목록을 가져오는 함수
     */
    const fetchAvailableStudies = useCallback(async () => {
        try {
            setIsLoading(true);
            setConnectionError(null);
            
            if (setAnalysisStatus) {
                setAnalysisStatus('PACS 연결 중...');
            }
            
            const data = await fetchPacsStudies();
            
            if (data.status === 'success') {
                const studyList = data.studies.map(study => ({
                    pacsId: study.pacs_id,
                    studyUID: study.study_uid,
                    patientId: study.patient_id,
                    patientName: study.patient_name,
                    studyDate: study.study_date,
                    studyTime: study.study_time || '',
                    modality: study.modality || '',
                    studyDescription: study.study_description || '',
                    seriesCount: study.series_count || 0,
                    instanceCount: study.instance_count || 0
                }));
                
                setAvailableStudies(studyList);
                setIsConnected(true);
                setLastUpdated(new Date());
                
                // 첫 번째 스터디를 자동 선택
                if (studyList.length > 0 && !currentStudyUID) {
                    setCurrentStudyUID(studyList[0].studyUID);
                    
                    if (setAnalysisStatus) {
                        setAnalysisStatus(
                            `✅ 스터디 감지: ${studyList[0].patientName} (${studyList[0].patientId})`
                        );
                    }
                } else if (studyList.length === 0) {
                    if (setAnalysisStatus) {
                        setAnalysisStatus('⚠️ PACS에 스터디가 없습니다');
                    }
                } else {
                    if (setAnalysisStatus) {
                        setAnalysisStatus(`✅ PACS 연결 성공 (${studyList.length}개 스터디)`);
                    }
                }
                
                return studyList;
            } else {
                throw new Error(data.message || 'PACS 데이터 조회 실패');
            }
            
        } catch (error) {
            console.error('PACS 연결 실패:', error);
            setIsConnected(false);
            setConnectionError(error.message);
            
            if (setAnalysisStatus) {
                setAnalysisStatus(`❌ PACS 연결 실패: ${error.message}`);
            }
            
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [currentStudyUID, setAnalysisStatus]);
    
    // 컴포넌트 마운트 시 자동으로 스터디 목록 조회
    useEffect(() => {
        fetchAvailableStudies();
    }, [fetchAvailableStudies]);
    
    // =============================================================================
    // 스터디 선택 및 관리 함수들
    // =============================================================================
    
    /**
     * 현재 선택된 스터디 UID를 가져오는 함수
     * @returns {string|null} 현재 스터디 UID
     */
    const getCurrentStudyUID = useCallback(() => {
        if (currentStudyUID) {
            return currentStudyUID;
        }
        
        if (availableStudies.length > 0) {
            return availableStudies[0].studyUID;
        }
        
        return null;
    }, [currentStudyUID, availableStudies]);
    
    /**
     * 스터디를 선택하는 함수
     * @param {string} studyUID - 선택할 스터디 UID
     */
    const selectStudy = useCallback((studyUID) => {
        const study = availableStudies.find(s => s.studyUID === studyUID);
        if (study) {
            setCurrentStudyUID(studyUID);
            
            if (setAnalysisStatus) {
                setAnalysisStatus(
                    `📂 스터디 선택: ${study.patientName} (${study.patientId}) - ${study.studyDate}`
                );
            }
        }
    }, [availableStudies, setAnalysisStatus]);
    
    /**
     * 현재 선택된 스터디 정보를 가져오는 함수
     * @returns {Object} 현재 스터디 정보
     */
    const getCurrentStudyInfo = useCallback(() => {
        const studyUID = getCurrentStudyUID();
        
        if (!studyUID) {
            return {
                patient_name: 'Unknown',
                patient_id: 'Unknown',
                study_date: 'Unknown',
                study_uid: null
            };
        }
        
        const currentStudy = availableStudies.find(s => s.studyUID === studyUID);
        
        if (currentStudy) {
            return {
                patient_name: currentStudy.patientName,
                patient_id: currentStudy.patientId,
                study_date: currentStudy.studyDate,
                study_time: currentStudy.studyTime,
                study_uid: currentStudy.studyUID,
                modality: currentStudy.modality,
                study_description: currentStudy.studyDescription,
                series_count: currentStudy.seriesCount,
                instance_count: currentStudy.instanceCount
            };
        }
        
        return {
            patient_name: 'Unknown',
            patient_id: 'Unknown', 
            study_date: 'Unknown',
            study_uid: studyUID
        };
    }, [getCurrentStudyUID, availableStudies]);
    
    // =============================================================================
    // 스터디 검색 및 필터링 함수들
    // =============================================================================
    
    /**
     * 환자 이름으로 스터디를 검색하는 함수
     * @param {string} patientName - 검색할 환자 이름
     * @returns {Array} 검색된 스터디 목록
     */
    const searchStudiesByPatientName = useCallback((patientName) => {
        if (!patientName.trim()) return availableStudies;
        
        return availableStudies.filter(study =>
            study.patientName.toLowerCase().includes(patientName.toLowerCase())
        );
    }, [availableStudies]);
    
    /**
     * 환자 ID로 스터디를 검색하는 함수
     * @param {string} patientId - 검색할 환자 ID
     * @returns {Array} 검색된 스터디 목록
     */
    const searchStudiesByPatientId = useCallback((patientId) => {
        if (!patientId.trim()) return availableStudies;
        
        return availableStudies.filter(study =>
            study.patientId.toLowerCase().includes(patientId.toLowerCase())
        );
    }, [availableStudies]);
    
    /**
     * 날짜 범위로 스터디를 필터링하는 함수
     * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
     * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
     * @returns {Array} 필터링된 스터디 목록
     */
    const filterStudiesByDateRange = useCallback((startDate, endDate) => {
        if (!startDate && !endDate) return availableStudies;
        
        return availableStudies.filter(study => {
            const studyDate = study.studyDate;
            
            if (startDate && studyDate < startDate) return false;
            if (endDate && studyDate > endDate) return false;
            
            return true;
        });
    }, [availableStudies]);
    
    /**
     * 모달리티로 스터디를 필터링하는 함수
     * @param {string} modality - 필터링할 모달리티 (예: 'CT', 'MR', 'CR')
     * @returns {Array} 필터링된 스터디 목록
     */
    const filterStudiesByModality = useCallback((modality) => {
        if (!modality) return availableStudies;
        
        return availableStudies.filter(study =>
            study.modality.toLowerCase() === modality.toLowerCase()
        );
    }, [availableStudies]);
    
    // =============================================================================
    // 스터디 통계 및 정보 함수들
    // =============================================================================
    
    /**
     * 스터디 통계 정보를 가져오는 함수
     * @returns {Object} 스터디 통계
     */
    const getStudyStatistics = useCallback(() => {
        const totalStudies = availableStudies.length;
        const uniquePatients = new Set(availableStudies.map(s => s.patientId)).size;
        const modalities = [...new Set(availableStudies.map(s => s.modality))].filter(Boolean);
        
        const dateRange = availableStudies.length > 0 ? {
            earliest: Math.min(...availableStudies.map(s => new Date(s.studyDate).getTime())),
            latest: Math.max(...availableStudies.map(s => new Date(s.studyDate).getTime()))
        } : null;
        
        return {
            totalStudies,
            uniquePatients,
            modalities,
            dateRange: dateRange ? {
                earliest: new Date(dateRange.earliest).toISOString().split('T')[0],
                latest: new Date(dateRange.latest).toISOString().split('T')[0]
            } : null
        };
    }, [availableStudies]);
    
    /**
     * 특정 환자의 모든 스터디를 가져오는 함수
     * @param {string} patientId - 환자 ID
     * @returns {Array} 해당 환자의 스터디 목록
     */
    const getStudiesForPatient = useCallback((patientId) => {
        return availableStudies.filter(study => study.patientId === patientId);
    }, [availableStudies]);
    
    // =============================================================================
    // 연결 상태 관리 함수들
    // =============================================================================
    
    /**
     * PACS 연결 상태를 확인하는 함수
     * @returns {boolean} 연결 상태
     */
    const checkConnectionStatus = useCallback(() => {
        return isConnected && !connectionError;
    }, [isConnected, connectionError]);
    
    /**
     * 연결을 재시도하는 함수
     */
    const retryConnection = useCallback(async () => {
        setConnectionError(null);
        await fetchAvailableStudies();
    }, [fetchAvailableStudies]);
    
    // =============================================================================
    // 유틸리티 함수들
    // =============================================================================
    
    /**
     * PACS 상태를 초기화하는 함수
     */
    const resetPACSState = useCallback(() => {
        setCurrentStudyUID(null);
        setAvailableStudies([]);
        setIsConnected(false);
        setConnectionError(null);
        setLastUpdated(null);
    }, []);
    
    /**
     * 스터디가 선택되었는지 확인하는 함수
     * @returns {boolean} 스터디 선택 여부
     */
    const hasSelectedStudy = useCallback(() => {
        return Boolean(getCurrentStudyUID());
    }, [getCurrentStudyUID]);
    
    /**
     * 스터디 목록이 비어있는지 확인하는 함수
     * @returns {boolean} 빈 목록 여부
     */
    const isStudyListEmpty = useCallback(() => {
        return availableStudies.length === 0;
    }, [availableStudies]);
    
    // =============================================================================
    // 반환값
    // =============================================================================
    
    return {
        // 상태
        currentStudyUID,
        availableStudies,
        isLoading,
        isConnected,
        connectionError,
        lastUpdated,
        
        // PACS 연결
        fetchAvailableStudies,
        retryConnection,
        checkConnectionStatus,
        
        // 스터디 관리
        getCurrentStudyUID,
        selectStudy,
        getCurrentStudyInfo,
        
        // 검색 및 필터링
        searchStudiesByPatientName,
        searchStudiesByPatientId,
        filterStudiesByDateRange,
        filterStudiesByModality,
        
        // 통계 및 정보
        getStudyStatistics,
        getStudiesForPatient,
        
        // 유틸리티
        resetPACSState,
        hasSelectedStudy,
        isStudyListEmpty,
        
        // 상태 설정 함수들 (필요한 경우)
        setCurrentStudyUID,
        setAvailableStudies
    };
};

export default usePACS;