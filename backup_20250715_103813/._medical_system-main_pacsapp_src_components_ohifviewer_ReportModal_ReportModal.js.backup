// src/components/OHIFViewer/ReportModal/ReportModal.js
import React, { useState, useEffect, useRef } from 'react';
import { loadReport } from '../../../utils/api'; // 👈 일단 AI API 제거
import styles from './ReportModal.module.css';

const ReportModal = ({
  isOpen,
  onClose,
  onSave,
  onPrint,
  // 환자 정보
  patientInfo = {},
  currentStudyUID = '',
  // AI 분석 결과
  analysisResults = null,
  // 수동 어노테이션
  annotationBoxes = [],
  // 레포트 내용
  initialContent = '',
  // 설정
  title = '📋 진단 레포트'
}) => {
  const [reportContent, setReportContent] = useState(initialContent);

  // ⭐ STT 관련 상태 추가
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  // 👈 새로 추가: API 기반 환자 정보 상태
  const [apiPatientInfo, setApiPatientInfo] = useState({});
  const [isLoadingPatientInfo, setIsLoadingPatientInfo] = useState(false);

  // ⭐ Refs 추가
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const chunksRef = useRef([]);

  // 모달이 열릴 때마다 초기 내용 설정
  useEffect(() => {
    if (isOpen) {
      setReportContent(initialContent);
      checkMicrophonePermission(); // ⭐ 마이크 권한 확인 추가
    }
  }, [isOpen, initialContent]);

  // 👈 API에서 환자 정보 로드 (AI 제거하고 환자 정보만)
  useEffect(() => {
    const loadPatientInfoFromAPI = async () => {
      if (isOpen && currentStudyUID) {
        setIsLoadingPatientInfo(true);
        try {
          console.log('🔍 ReportModal에서 환자 정보 직접 로드 시도...');
          const result = await loadReport(currentStudyUID);
          
          if (result && result.status === 'success' && result.report) {
            const report = result.report;
            const apiInfo = {
              patient_name: report.patient_name || 'Unknown',
              patient_id: report.patient_id || 'Unknown',
              // 👈 여러 날짜 필드 시도
              study_date: report.study_date || 
                         report.study_datetime?.split(' ')[0] || 
                         report.scheduled_exam_datetime?.split(' ')[0] ||
                         report.created_at?.split('T')[0] ||
                         'Unknown',
              doctor_name: report.doctor_name || '미배정',  // 👈 API에서 직접 가져온 값
              doctor_id: report.doctor_id || 'UNASSIGNED'
            };
            
            setApiPatientInfo(apiInfo);
            console.log('✅ API에서 환자 정보 로드 성공:');
            console.log('  - doctor_name:', apiInfo.doctor_name);
            console.log('  - study_date:', apiInfo.study_date);
          }
        } catch (error) {
          console.error('❌ API 환자 정보 로드 실패:', error);
        } finally {
          setIsLoadingPatientInfo(false);
        }
      }
    };

    loadPatientInfoFromAPI();
  }, [isOpen, currentStudyUID]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // ⭐ 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // ⭐ STT 관련 함수들 추가
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ 마이크 권한 승인됨');
    } catch (error) {
      console.error('❌ 마이크 권한 거부됨:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await checkMicrophonePermission();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎤 녹음 시작됨');

    } catch (error) {
      console.error('❌ 녹음 시작 실패:', error);
      alert('녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      console.log('⏹️ 녹음 중지됨');
    }
  };

  const processSTT = async () => {
    if (!audioBlob) {
      alert('먼저 음성을 녹음해주세요.');
      return;
    }

    setSttLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('patient_id', patient.patient_id || 'UNKNOWN');
      formData.append('study_uid', currentStudyUID || 'UNKNOWN');

      console.log('🔄 STT 처리 중...');

      const response = await fetch('http://35.225.63.41:8000/api/stt/upload/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`STT 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const soapText = result.corrected_text || result.original_text;
        
        // 기존 텍스트에 SOAP 형식 결과 추가
        const newText = reportContent ? `${reportContent}\n\n${soapText}` : soapText;
        setReportContent(newText);
        
        console.log('✅ SOAP 형식 STT 완료:', soapText);
        alert('음성 인식이 완료되어 SOAP 형식으로 종합소견에 추가되었습니다.');
        
      } else {
        throw new Error(result.message || 'STT 처리 실패');
      }

    } catch (error) {
      console.error('❌ STT 처리 실패:', error);
      alert(`음성 인식 실패: ${error.message}`);
    } finally {
      setSttLoading(false);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    // 녹음 중이면 중지
    if (isRecording) {
      stopRecording();
    }
    onClose();
  };

  const handleSave = () => {
    onSave(reportContent);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 👈 환자 정보 우선순위: API > prop > fallback (간단한 방식)
  const patient = {
    ...patientInfo, // 1. 기본 prop 값들
    // 2. API 값이 있으면 덮어쓰기 (빈 문자열이 아닌 경우만)
    patient_name: apiPatientInfo.patient_name || patientInfo.patient_name || 'Unknown',
    patient_id: apiPatientInfo.patient_id || patientInfo.patient_id || 'Unknown',
    study_date: apiPatientInfo.study_date || (patientInfo.study_date && patientInfo.study_date !== '' ? patientInfo.study_date : 'Unknown'), // 👈 빈 문자열 체크
    doctor_name: apiPatientInfo.doctor_name || (patientInfo.doctor_name && patientInfo.doctor_name !== '' ? patientInfo.doctor_name : '미배정'),
    doctor_id: apiPatientInfo.doctor_id || patientInfo.doctor_id || 'UNASSIGNED'
  };

  // 👈 디버깅용 로그
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 ReportModal 환자 정보 디버깅:');
      console.log('  - API에서 가져온 정보:', apiPatientInfo);
      console.log('  - prop으로 받은 정보:', patientInfo);
      console.log('  - 최종 사용할 정보:', patient);
      console.log('  - 최종 판독의:', patient.doctor_name);
    }
  }, [isOpen, apiPatientInfo, patientInfo, patient]);

  // Study UID 표시용
  const displayStudyUID = currentStudyUID ? 
    currentStudyUID.substring(0, 30) + '...' : 'N/A';

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        {/* 헤더 */}
        <h2 className={styles.modalHeader}>
          {title}
        </h2>
        
        {/* 환자 정보 섹션 - 👈 판독의 정보 추가 */}
        <div className={styles.patientInfo}>
          <h3 className={styles.patientInfoHeader}>👤 환자 정보</h3>
          <div className={styles.patientGrid}>
            <div className={styles.patientGridItem}>
              <strong>환자명:</strong> {patient.patient_name}
            </div>
            <div className={styles.patientGridItem}>
              <strong>환자 ID:</strong> {patient.patient_id}
            </div>
            <div className={styles.patientGridItem}>
              <strong>검사일:</strong> {patient.study_date}
            </div>
            <div className={styles.patientGridItem}>
              <strong>판독의:</strong> {patient.doctor_name} {isLoadingPatientInfo && '(로딩중...)'} {/* 👈 API 우선 사용 */}
            </div>
            <div className={styles.patientGridItem}>
              <strong>Study UID:</strong> {displayStudyUID}
            </div>
          </div>
        </div>
        
        {/* AI 분석 결과 섹션 - 원래대로 복원 */}
        {analysisResults && analysisResults.results && analysisResults.results.length > 0 && (
          <div className={styles.aiResults}>
            <h3 className={styles.aiResultsHeader}>
              🤖 AI 분석 결과
            </h3>
            
            {/* 👈 임시 디버깅 로그 추가 */}
            {console.log('🔍 analysisResults 디버깅:', {
              전체_객체: analysisResults,
              model_used: analysisResults.model_used,
              model_type: analysisResults.model_type,
              model: analysisResults.model,
              models: analysisResults.models,
              첫번째_result_model: analysisResults.results?.[0]?.model,
              모든_키들: Object.keys(analysisResults)
            })}
            
            <div className={styles.aiResultsSummary}>
              <strong>사용 모델:</strong> {
                analysisResults.model_used || 
                analysisResults.model_type || 
                analysisResults.model ||
                analysisResults.models?.[0] ||
                analysisResults.results?.[0]?.model ||
                'Unknown'
              } | 
              <strong> 총 검출:</strong> {analysisResults.detections || analysisResults.results.length}개
            </div>
            
            {analysisResults.results.map((result, index) => (
              <div 
                key={index} 
                className={`${styles.detectionItem} ${
                  result.confidence > 0.8 ? styles.detectionItemHigh : styles.detectionItemLow
                }`}
              >
                <div>
                  <div className={`${styles.detectionLabel} ${
                    result.confidence > 0.8 ? styles.detectionLabelHigh : styles.detectionLabelLow
                  }`}>
                    {result.label}
                  </div>
                  <div className={styles.detectionLocation}>
                    위치: [{result.bbox.join(', ')}]
                  </div>
                </div>
                <span className={`${styles.confidenceBadge} ${
                  result.confidence > 0.8 ? styles.confidenceBadgeHigh : styles.confidenceBadgeLow
                }`}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* 수동 어노테이션 섹션 */}
        {annotationBoxes.length > 0 && (
          <div className={styles.annotations}>
            <h3 className={styles.annotationsHeader}>
              ✏️ 수동 어노테이션
            </h3>
            
            {annotationBoxes.map((box, index) => (
              <div key={box.id} className={styles.annotationItem}>
                <div>
                  <div className={styles.annotationLabel}>
                    수동 마킹 {index + 1}: {box.label}
                  </div>
                  <div className={styles.annotationLocation}>
                    화면 위치: [{box.left}, {box.top}, {box.left + box.width}, {box.top + box.height}]
                  </div>
                  {/* 👈 어노테이션 판독의 표시 */}
                  {box.doctor_name && (
                    <div className={styles.annotationDoctor}>
                      판독의: {box.doctor_name}
                    </div>
                  )}
                </div>
                <span className={styles.annotationBadge}>
                  수동
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ⭐ STT 섹션 */}
        <div className={styles.sttSection}>
          <h3 className={styles.sttHeader}>
            🎤 음성 인식 (SOAP 형식 자동 변환)
          </h3>
          
          <div className={styles.sttControls}>
            {/* 녹음 버튼 */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!hasPermission}
              className={`${styles.button} ${isRecording ? styles.recordingButton : styles.startRecordButton}`}
            >
              {isRecording ? '🔴 녹음 중지' : '🎤 녹음 시작'}
            </button>

            {/* 녹음 시간 표시 */}
            {isRecording && (
              <div className={styles.recordingTime}>
                <span className={styles.recordingIndicator}></span>
                {formatRecordingTime(recordingTime)}
              </div>
            )}

            {/* STT 처리 버튼 */}
            {audioBlob && (
              <button
                onClick={processSTT}
                disabled={sttLoading}
                className={`${styles.button} ${styles.sttProcessButton}`}
              >
                {sttLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    SOAP 변환중...
                  </>
                ) : (
                  '🤖 SOAP 변환'
                )}
              </button>
            )}
          </div>

          {/* 오디오 재생 */}
          {audioUrl && (
            <div className={styles.audioPlayback}>
              <audio
                src={audioUrl}
                controls
                className={styles.audioControls}
              />
              <p className={styles.audioHint}>
                💡 녹음된 음성을 확인한 후 SOAP 변환 버튼을 눌러주세요.
              </p>
            </div>
          )}

          {/* 권한 없음 안내 */}
          {!hasPermission && (
            <div className={styles.permissionWarning}>
              <strong>⚠️ 마이크 권한이 필요합니다</strong>
              <p>음성 인식을 사용하려면 브라우저에서 마이크 접근을 허용해야 합니다.</p>
              <button
                onClick={checkMicrophonePermission}
                className={`${styles.button} ${styles.permissionButton}`}
              >
                권한 다시 요청
              </button>
            </div>
          )}
        </div>
        
        {/* 종합 소견 섹션 */}
        <div className={styles.reportSection}>
          <h3 className={styles.reportSectionHeader}>📝 종합 소견</h3>
          <textarea
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            placeholder="의료진의 종합 소견을 입력하세요...

SOAP 형식 예시:

S (Subjective - 주관적 소견):
환자가 호소하는 증상이나 병력

O (Objective - 객관적 소견):
영상에서 관찰되는 구체적인 소견들
- 심장 크기 및 형태
- 폐 실질 소견
- 흉막 소견

A (Assessment - 평가/진단):
영상 소견을 바탕으로 한 진단적 평가

P (Plan - 계획):
추가 검사나 추적 관찰 권고사항"
            className={styles.reportTextarea}
          />
          <div className={styles.textareaFooter}>
            <span>글자 수: {reportContent.length}</span>
            <span>💡 음성인식 결과가 SOAP 형식으로 자동 추가됩니다</span>
          </div>
        </div>
        
        {/* 버튼 섹션 */}
        <div className={styles.buttonContainer}>
          <button
            onClick={handleClose}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            ❌ 취소
          </button>
          
          <button
            onClick={handlePrint}
            className={`${styles.button} ${styles.printButton}`}
          >
            🖨️ 인쇄
          </button>
          
          <button
            onClick={handleSave}
            className={`${styles.button} ${styles.saveButton}`}
          >
            💾 레포트 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;