// src/hooks/useReports.js
import { useState, useCallback } from 'react';
import { saveReport, loadReport, deleteReport, updateReportStatus } from '../utils/api';

/**
 * 레포트 관련 상태와 로직을 관리하는 커스텀 훅
 * @param {string} currentStudyUID - 현재 선택된 스터디 UID
 * @param {Function} getCurrentStudyInfo - 현재 스터디 정보를 가져오는 함수
 * @returns {Object} 레포트 관련 상태와 함수들
 */
const useReports = (currentStudyUID, getCurrentStudyInfo) => {
    // =============================================================================
    // 상태 관리
    // =============================================================================
    
    // 레포트 모달 상태
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportContent, setReportContent] = useState('');
    
    // 👈 새로 추가: 환자 정보 상태
    const [patientInfoFromReport, setPatientInfoFromReport] = useState({});
    
    // 레포트 목록 및 드롭다운
    const [reportSummaries, setReportSummaries] = useState([]);
    const [showReportDropdown, setShowReportDropdown] = useState(false);
    
    // 로딩 상태
    const [isLoading, setIsLoading] = useState(false);
    
    // =============================================================================
    // 👈 새로 추가: 환자 정보 관리 함수
    // =============================================================================
    
    /**
     * 환자 정보를 업데이트하는 함수 (API 응답 기반)
     */
    const updatePatientInfoFromReport = useCallback((reportData) => {
        if (reportData && reportData.status === 'success' && reportData.report) {
            const report = reportData.report;
            const patientInfo = {
                patient_name: report.patient_name || 'Unknown',
                patient_id: report.patient_id || 'Unknown',
                study_date: report.study_date || 'Unknown',
                doctor_name: report.doctor_name || '미배정',  // 👈 실제 API 값 사용
                doctor_id: report.doctor_id || 'UNASSIGNED'
            };
            
            setPatientInfoFromReport(patientInfo);
            
            console.log('📋 환자 정보 업데이트 (API 기반):', {
                doctor_name: patientInfo.doctor_name,
                patient_name: patientInfo.patient_name,
                study_date: patientInfo.study_date
            });
            
            return patientInfo;
        }
        return {};
    }, []);
    
    /**
     * 환자 정보를 가져오는 함수 (우선순위: API > fallback)
     */
    const getPatientInfo = useCallback(() => {
        // API에서 가져온 정보가 있으면 우선 사용
        if (patientInfoFromReport && Object.keys(patientInfoFromReport).length > 0) {
            return patientInfoFromReport;
        }
        
        // fallback: getCurrentStudyInfo() 사용
        return getCurrentStudyInfo();
    }, [patientInfoFromReport, getCurrentStudyInfo]);
    
    // =============================================================================
    // 레포트 저장 관련 함수들
    // =============================================================================
    
    /**
     * 레포트를 서버에 저장하는 함수
     */
    const saveReportToServer = useCallback(async (content = reportContent) => {
        if (!currentStudyUID) {
            alert('Study UID를 찾을 수 없습니다.');
            return false;
        }
        
        try {
            setIsLoading(true);
            
            const studyInfo = getCurrentStudyInfo();
            const result = await saveReport(
                currentStudyUID,
                studyInfo.patient_id,
                content,
                'draft'
            );
            
            if (result.status === 'success') {
                // 👈 저장 후 환자 정보 업데이트
                if (result.data) {
                    const updatedPatientInfo = {
                        patient_name: studyInfo.patient_name || patientInfoFromReport.patient_name || 'Unknown',
                        patient_id: result.data.patient_id || 'Unknown',
                        study_date: patientInfoFromReport.study_date || 'Unknown',
                        doctor_name: result.data.doctor_name || '미배정',
                        doctor_id: result.data.doctor_id || 'UNASSIGNED'
                    };
                    setPatientInfoFromReport(updatedPatientInfo);
                }
                
                // 실제 판독의 이름 포함한 알림
                const doctorName = result.data?.doctor_name || '';
                const doctorInfo = doctorName ? ` (판독의: ${doctorName})` : '';
                alert(`✅ 레포트가 저장되었습니다!${doctorInfo}`);
                
                setShowReportModal(false);
                setReportContent('');
                
                // 레포트 목록 갱신
                await refreshReportSummaries();
                return true;
            } else {
                alert('❌ 레포트 저장 실패: ' + result.message);
                return false;
            }
        } catch (error) {
            alert('❌ 레포트 저장 실패: ' + error.message);
            console.error('❌ 레포트 저장 에러:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentStudyUID, reportContent, getCurrentStudyInfo, patientInfoFromReport]);
    
    /**
     * 서버에서 레포트를 불러오는 함수
     */
    const loadReportFromServer = useCallback(async (studyUID = currentStudyUID) => {
        if (!studyUID) {
            alert('Study UID를 찾을 수 없습니다.');
            return false;
        }
        
        try {
            setIsLoading(true);
            
            const data = await loadReport(studyUID);
            
            if (data.status === 'success') {
                setReportContent(data.report.dr_report || '');
                
                // 👈 환자 정보 업데이트
                const patientInfo = updatePatientInfoFromReport(data);
                
                // 실제 판독의 이름 포함한 알림
                const doctorName = patientInfo.doctor_name || '';
                const doctorInfo = doctorName ? ` (판독의: ${doctorName})` : '';
                alert(`✅ 레포트를 불러왔습니다!${doctorInfo}`);
                
                return data; // 👈 전체 데이터 반환 (OHIFViewer에서 사용 가능)
            } else {
                alert('저장된 레포트가 없습니다.');
                return false;
            }
        } catch (error) {
            alert('❌ 레포트 불러오기 실패: ' + error.message);
            console.error('❌ 레포트 불러오기 에러:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentStudyUID, updatePatientInfoFromReport]);
    
    // 나머지 함수들은 기존과 동일...
    
    /**
     * 서버에서 레포트를 삭제하는 함수
     */
    const deleteReportFromServer = useCallback(async () => {
        if (!currentStudyUID) {
            alert('Study UID를 찾을 수 없습니다.');
            return false;
        }
        
        if (!window.confirm('이 레포트를 삭제하시겠습니까?')) {
            return false;
        }
        
        try {
            setIsLoading(true);
            
            const data = await deleteReport(currentStudyUID);
            
            if (data.status === 'success') {
                alert('✅ 레포트가 삭제되었습니다!');
                setReportSummaries([]); // 드롭다운에서 제거
                setReportContent(''); // 내용 초기화
                setPatientInfoFromReport({}); // 👈 환자 정보도 초기화
                return true;
            } else {
                alert('❌ 레포트 삭제 실패: ' + data.message);
                return false;
            }
        } catch (error) {
            alert('❌ 레포트 삭제 실패: ' + error.message);
            console.error('❌ 레포트 삭제 에러:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentStudyUID]);
    
    // =============================================================================
    // 레포트 상태 관리 함수들 (기존과 동일)
    // =============================================================================
    
    const updateReportStatusOnServer = useCallback(async (studyUID, status) => {
        try {
            setIsLoading(true);
            
            const data = await updateReportStatus(studyUID, status);
            
            if (data.status === 'success') {
                await refreshReportSummaries();
                return true;
            } else {
                alert('❌ 상태 업데이트 실패: ' + data.message);
                return false;
            }
        } catch (error) {
            alert('❌ 상태 업데이트 실패: ' + error.message);
            console.error('❌ 상태 업데이트 에러:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // 나머지 함수들 (기존과 동일)...
    const refreshReportSummaries = useCallback(async () => {
        if (!currentStudyUID) return [];
        
        try {
            const data = await loadReport(currentStudyUID);
            
            if (data.status === 'success') {
                const summaries = [data.report];
                setReportSummaries(summaries);
                return summaries;
            } else {
                setReportSummaries([]);
                return [];
            }
        } catch (error) {
            console.error('❌ 레포트 목록 새로고침 실패:', error);
            setReportSummaries([]);
            return [];
        }
    }, [currentStudyUID]);
    
    const selectReportFromDropdown = useCallback((report) => {
        setReportContent(report.dr_report || '');
        setShowReportDropdown(false);
        setShowReportModal(true);
    }, []);
    
    const openReportModal = useCallback(() => {
        setShowReportModal(true);
    }, []);
    
    const closeReportModal = useCallback(() => {
        setShowReportModal(false);
        setReportContent('');
    }, []);
    
    const toggleReportDropdown = useCallback(async () => {
        if (!showReportDropdown) {
            await refreshReportSummaries();
        }
        setShowReportDropdown(prev => !prev);
    }, [showReportDropdown, refreshReportSummaries]);
    
    const printReport = useCallback(() => {
        window.print();
    }, []);
    
    const exportReportToPDF = useCallback(() => {
        window.print();
    }, []);
    
    const hasReportChanged = useCallback((originalContent = '') => {
        return reportContent.trim() !== originalContent.trim();
    }, [reportContent]);
    
    const resetReportState = useCallback(() => {
        setShowReportModal(false);
        setReportContent('');
        setReportSummaries([]);
        setShowReportDropdown(false);
        setIsLoading(false);
        setPatientInfoFromReport({}); // 👈 환자 정보도 초기화
    }, []);
    
    const validateReport = useCallback(() => {
        const content = reportContent.trim();
        
        if (!content) {
            return { isValid: false, message: '레포트 내용을 입력해주세요.' };
        }
        
        if (content.length < 10) {
            return { isValid: false, message: '레포트 내용이 너무 짧습니다.' };
        }
        
        if (content.length > 5000) {
            return { isValid: false, message: '레포트 내용이 너무 깁니다. (최대 5000자)' };
        }
        
        return { isValid: true, message: '' };
    }, [reportContent]);
    
    // =============================================================================
    // 반환값
    // =============================================================================
    
    return {
        // 상태
        showReportModal,
        reportContent,
        reportSummaries,
        showReportDropdown,
        isLoading,
        
        // 👈 새로 추가: 환자 정보
        patientInfoFromReport,
        getPatientInfo,
        
        // 레포트 CRUD
        saveReportToServer,
        loadReportFromServer,
        deleteReportFromServer,
        
        // 상태 관리
        updateReportStatusOnServer,
        refreshReportSummaries,
        
        // UI 관리
        openReportModal,
        closeReportModal,
        toggleReportDropdown,
        selectReportFromDropdown,
        
        // 인쇄
        printReport,
        exportReportToPDF,
        
        // 유틸리티
        hasReportChanged,
        validateReport,
        resetReportState,
        
        // 상태 설정 함수들
        setReportContent,
        setShowReportModal,
        setReportSummaries,
        setShowReportDropdown
    };
};

export default useReports;