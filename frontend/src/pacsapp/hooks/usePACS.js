// src/hooks/usePACS.js
import { useState, useEffect, useCallback } from 'react';

/**
 * PACS 연동 및 스터디 관리 관련 상태와 로직을 관리하는 커스텀 훅
 * @param {Function} setAnalysisStatus - 분석 상태 메시지 설정 함수 (선택사항)
 * @returns {Object} PACS 관련 상태와 함수들
 */
const usePACS = (setAnalysisStatus) => {
    // 상태 관리
    const [currentStudyUID, setCurrentStudyUID] = useState(null);
    const [availableStudies, setAvailableStudies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // PACS에서 스터디 목록 가져오기
    const fetchAvailableStudies = useCallback(async () => {
        try {
            setIsLoading(true);
            setConnectionError(null);

            if (setAnalysisStatus) {
                setAnalysisStatus('PACS 연결 중...');
            }

            const response = await fetch('http://35.225.63.41:8088/dicom-web/studies', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa('orthanc:orthanc'),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const studies = await response.json();
            const parsedStudies = studies.map((entry) => ({
                pacs_id: entry.ID || entry['0020000D']?.Value?.[0] || '',
                studyUID: entry['0020000D']?.Value?.[0] || '',
                patientId: entry['00100020']?.Value?.[0] || '',
                patientName:
                    entry['00100010']?.Value?.[0]?.Alphabetic ||
                    entry['00100010']?.Value?.[0] ||
                    '',
                studyDate: entry['00080020']?.Value?.[0] || '',
                studyTime: entry['00080030']?.Value?.[0] || '',
                modality: entry['00080061']?.Value?.[0] || '',
                studyDescription: entry['00081030']?.Value?.[0] || '',
                seriesCount: entry['00201206']?.Value?.[0] || 0,
                instanceCount: entry['00201208']?.Value?.[0] || 0,
            }));

            setAvailableStudies(parsedStudies);
            setIsConnected(true);
            setLastUpdated(new Date());

            if (parsedStudies.length > 0 && !currentStudyUID) {
                setCurrentStudyUID(parsedStudies[0].studyUID);
                setAnalysisStatus?.(`✅ 스터디 감지: ${parsedStudies[0].patientName} (${parsedStudies[0].patientId})`);
            } else if (parsedStudies.length === 0) {
                setAnalysisStatus?.('⚠️ PACS에 스터디가 없습니다');
            } else {
                setAnalysisStatus?.(`✅ PACS 연결 성공 (${parsedStudies.length}개 스터디)`);
            }
        } catch (error) {
            console.error('PACS 연결 실패:', error);
            setIsConnected(false);
            setConnectionError(error.message);
            setAnalysisStatus?.(`❌ PACS 연결 실패: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentStudyUID, setAnalysisStatus]);

    useEffect(() => {
        fetchAvailableStudies();
    }, [fetchAvailableStudies]);

    const getCurrentStudyUID = useCallback(() => {
        if (currentStudyUID) return currentStudyUID;
        if (availableStudies.length > 0) return availableStudies[0].studyUID;
        return null;
    }, [currentStudyUID, availableStudies]);

    const selectStudy = useCallback((studyUID) => {
        const study = availableStudies.find(s => s.studyUID === studyUID);
        if (study) {
            setCurrentStudyUID(studyUID);
            setAnalysisStatus?.(`📂 스터디 선택: ${study.patientName} (${study.patientId}) - ${study.studyDate}`);
        }
    }, [availableStudies, setAnalysisStatus]);

    const getCurrentStudyInfo = useCallback(() => {
        const studyUID = getCurrentStudyUID();
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

    const searchStudiesByPatientName = useCallback((name) => {
        if (!name.trim()) return availableStudies;
        return availableStudies.filter(s => s.patientName.toLowerCase().includes(name.toLowerCase()));
    }, [availableStudies]);

    const searchStudiesByPatientId = useCallback((id) => {
        if (!id.trim()) return availableStudies;
        return availableStudies.filter(s => s.patientId.toLowerCase().includes(id.toLowerCase()));
    }, [availableStudies]);

    const filterStudiesByDateRange = useCallback((start, end) => {
        return availableStudies.filter(s => {
            const d = s.studyDate;
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
        });
    }, [availableStudies]);

    const filterStudiesByModality = useCallback((modality) => {
        if (!modality) return availableStudies;
        return availableStudies.filter(s => s.modality.toLowerCase() === modality.toLowerCase());
    }, [availableStudies]);

    const getStudyStatistics = useCallback(() => {
        const total = availableStudies.length;
        const patients = new Set(availableStudies.map(s => s.patientId)).size;
        const modalities = [...new Set(availableStudies.map(s => s.modality))].filter(Boolean);
        const dates = availableStudies.map(s => new Date(s.studyDate).getTime());
        const range = dates.length > 0 ? {
            earliest: new Date(Math.min(...dates)).toISOString().split('T')[0],
            latest: new Date(Math.max(...dates)).toISOString().split('T')[0]
        } : null;
        return { totalStudies: total, uniquePatients: patients, modalities, dateRange: range };
    }, [availableStudies]);

    const getStudiesForPatient = useCallback((id) => {
        return availableStudies.filter(s => s.patientId === id);
    }, [availableStudies]);

    const checkConnectionStatus = useCallback(() => {
        return isConnected && !connectionError;
    }, [isConnected, connectionError]);

    const retryConnection = useCallback(() => {
        setConnectionError(null);
        fetchAvailableStudies();
    }, [fetchAvailableStudies]);

    const resetPACSState = useCallback(() => {
        setCurrentStudyUID(null);
        setAvailableStudies([]);
        setIsConnected(false);
        setConnectionError(null);
        setLastUpdated(null);
    }, []);

    const hasSelectedStudy = useCallback(() => {
        return Boolean(getCurrentStudyUID());
    }, [getCurrentStudyUID]);

    const isStudyListEmpty = useCallback(() => {
        return availableStudies.length === 0;
    }, [availableStudies]);

    return {
        currentStudyUID,
        availableStudies,
        isLoading,
        isConnected,
        connectionError,
        lastUpdated,
        fetchAvailableStudies,
        retryConnection,
        checkConnectionStatus,
        getCurrentStudyUID,
        selectStudy,
        getCurrentStudyInfo,
        searchStudiesByPatientName,
        searchStudiesByPatientId,
        filterStudiesByDateRange,
        filterStudiesByModality,
        getStudyStatistics,
        getStudiesForPatient,
        resetPACSState,
        hasSelectedStudy,
        isStudyListEmpty,
        setCurrentStudyUID,
        setAvailableStudies
    };
};

export default usePACS;
