import React, { useState, useEffect, useRef } from 'react';

const StudyDetail = ({ studyId, onBack }) => {
  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [reportText, setReportText] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // STT 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const chunksRef = useRef([]);

  const API_BASE_URL = 'http://35.221.63.41:8000/api';

  useEffect(() => {
    fetchStudyDetail();
    checkMicrophonePermission();
  }, [studyId]);

  // 마이크 권한 확인
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

  const fetchStudyDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/study-requests/${studyId}/`);
      
      if (!response.ok) {
        throw new Error('검사 정보를 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      setStudyData(data);
      setEditData(data);
      setReportText(data.report_text || '');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 녹음 시작
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

  // 녹음 중지
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

  // STT 처리
  const processSTT = async () => {
    if (!audioBlob) {
      alert('먼저 음성을 녹음해주세요.');
      return;
    }

    setSttLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('patient_id', studyData?.patient_id || 'UNKNOWN');
      formData.append('study_uid', studyData?.study_uid || 'UNKNOWN');

      console.log('🔄 STT 처리 중...');

      const response = await fetch('http://localhost:8000/api/stt/upload/', {
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
        const newText = reportText ? `${reportText}\n\n${soapText}` : soapText;
        setReportText(newText);
        
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

  // 녹음 시간 포맷팅
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/study-requests/${studyId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('저장에 실패했습니다.');
      }

      const updatedData = await response.json();
      setStudyData(updatedData);
      setIsEditing(false);
      alert('성공적으로 저장되었습니다.');
      
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleReportSave = async () => {
    try {
      const reportData = {
        ...editData,
        report_text: reportText,
        report_status: 'completed',
        interpreting_physician: '현재 로그인된 의사'
      };

      const response = await fetch(`${API_BASE_URL}/study-requests/${studyId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('판독 저장에 실패했습니다.');
      }

      const updatedData = await response.json();
      setStudyData(updatedData);
      setIsReporting(false);
      alert('판독이 완료되었습니다.');
      
    } catch (err) {
      alert('판독 저장 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'requested': { text: '요청됨', color: '#fff', bg: '#3498db' },
      'scheduled': { text: '예약됨', color: '#fff', bg: '#f39c12' },
      'in_progress': { text: '진행중', color: '#fff', bg: '#e67e22' },
      'completed': { text: '완료됨', color: '#fff', bg: '#27ae60' },
      'cancelled': { text: '취소됨', color: '#fff', bg: '#e74c3c' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: '#fff', bg: '#6c757d' };
    
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: statusInfo.bg,
        color: statusInfo.color
      }}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6c757d' }}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: '#e74c3c' }}>오류 발생</h3>
        <p>{error}</p>
        <button onClick={onBack} style={{ padding: '10px 20px', marginTop: '20px' }}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '10px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px 20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#2c3e50' }}>
            검사 상세 정보 - ID: {studyData.id}
          </h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
            환자: {studyData.patient_name} ({studyData.patient_id})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            목록으로
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              수정
            </button>
          )}
          {!isReporting && studyData.study_status !== 'cancelled' && (
            <button
              onClick={() => setIsReporting(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              판독하기
            </button>
          )}
        </div>
      </div>

      {/* 기존 테이블 - 변경 없음 */}
      <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          minWidth: '1400px',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          border: '1px solid #dee2e6'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '100px' }}>환자번호</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '100px' }}>환자명</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '120px' }}>생년월일</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '80px' }}>성별</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '120px' }}>검사부위</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '100px' }}>Modality</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '120px' }}>요청의사</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '180px' }}>요청일시</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '180px' }}>검사일시</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '120px' }}>판독의사</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '200px' }}>Study UID</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '150px' }}>Accession Number</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '100px' }}>검사상태</th>
              <th style={{ padding: '10px', border: '1px solid #34495e', minWidth: '100px' }}>리포트상태</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                <strong>{studyData.patient_id}</strong>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                <strong>{studyData.patient_name}</strong>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                {formatDate(studyData.birth_date)}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                {studyData.sex === 'M' ? '남성' : '여성'}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                {studyData.body_part}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                <strong>{studyData.modality}</strong>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                {studyData.requesting_physician}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontSize: '12px', backgroundColor: '#f8f9fa' }}>
                {formatDateTime(studyData.request_datetime)}
              </td>
              
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editData.scheduled_exam_datetime ? editData.scheduled_exam_datetime.slice(0, 16) : ''}
                    onChange={(e) => setEditData({...editData, scheduled_exam_datetime: e.target.value})}
                    style={{ width: '170px', padding: '5px', border: '1px solid #ccc', fontSize: '12px' }}
                  />
                ) : (
                  <span style={{ fontSize: '12px' }}>{formatDateTime(studyData.scheduled_exam_datetime)}</span>
                )}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.interpreting_physician || ''}
                    onChange={(e) => setEditData({...editData, interpreting_physician: e.target.value})}
                    style={{ width: '110px', padding: '5px', border: '1px solid #ccc', fontSize: '12px' }}
                    placeholder="판독의사명"
                  />
                ) : (
                  studyData.interpreting_physician || '-'
                )}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.study_uid || ''}
                    onChange={(e) => setEditData({...editData, study_uid: e.target.value})}
                    style={{ width: '190px', padding: '5px', border: '1px solid #ccc', fontSize: '10px' }}
                    placeholder="Study UID 입력"
                  />
                ) : (
                  <span style={{ fontSize: '10px', wordBreak: 'break-all' }}>{studyData.study_uid || '-'}</span>
                )}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.accession_number || ''}
                    onChange={(e) => setEditData({...editData, accession_number: e.target.value})}
                    style={{ width: '140px', padding: '5px', border: '1px solid #ccc', fontSize: '12px' }}
                    placeholder="Accession Number"
                  />
                ) : (
                  studyData.accession_number || '-'
                )}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                {isEditing ? (
                  <select
                    value={editData.study_status || ''}
                    onChange={(e) => setEditData({...editData, study_status: e.target.value})}
                    style={{ width: '90px', padding: '5px', border: '1px solid #ccc', fontSize: '11px' }}
                  >
                    <option value="requested">요청됨</option>
                    <option value="scheduled">예약됨</option>
                    <option value="in_progress">진행중</option>
                    <option value="completed">완료됨</option>
                    <option value="cancelled">취소됨</option>
                  </select>
                ) : (
                  getStatusBadge(studyData.study_status)
                )}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                {isEditing ? (
                  <select
                    value={editData.report_status || ''}
                    onChange={(e) => setEditData({...editData, report_status: e.target.value})}
                    style={{ width: '90px', padding: '5px', border: '1px solid #ccc', fontSize: '11px' }}
                  >
                    <option value="requested">요청됨</option>
                    <option value="in_progress">진행중</option>
                    <option value="completed">완료됨</option>
                  </select>
                ) : (
                  getStatusBadge(studyData.report_status)
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 수정 버튼들 */}
      {isEditing && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 30px',
              backgroundColor: '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '10px'
            }}
          >
            저장
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditData(studyData);
            }}
            style={{
              padding: '10px 30px',
              backgroundColor: '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            취소
          </button>
        </div>
      )}

      {/* 판독 작성 섹션 - STT 기능 추가 */}
      {isReporting && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#fff',
          border: '2px solid #27ae60'
        }}>
          <h3 style={{ marginTop: 0, color: '#27ae60', marginBottom: '15px' }}>
            판독 작성 (SOAP 형식)
          </h3>

          {/* STT 컨트롤 영역 */}
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px' }}>
              🎤 음성 인식 (SOAP 형식으로 자동 변환)
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              {/* 녹음 버튼 */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!hasPermission}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isRecording ? '#e74c3c' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: hasPermission ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: hasPermission ? 1 : 0.6
                }}
              >
                {isRecording ? '🔴 녹음 중지' : '🎤 녹음 시작'}
              </button>

              {/* 녹음 시간 표시 */}
              {isRecording && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  🔴 {formatRecordingTime(recordingTime)}
                </div>
              )}

              {/* STT 처리 버튼 */}
              {audioBlob && (
                <button
                  onClick={processSTT}
                  disabled={sttLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: sttLoading ? '#6c757d' : '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: sttLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {sttLoading ? '🔄 SOAP 변환 중...' : '🤖 SOAP 변환'}
                </button>
              )}
            </div>

            {/* 오디오 재생 */}
            {audioUrl && (
              <div style={{
                padding: '10px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                border: '1px solid #ced4da'
              }}>
                <audio
                  src={audioUrl}
                  controls
                  style={{ width: '100%' }}
                />
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                  녹음된 음성을 확인한 후 SOAP 변환 버튼을 눌러주세요.
                </p>
              </div>
            )}

            {/* 권한 없음 안내 */}
            {!hasPermission && (
              <div style={{
                padding: '10px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                color: '#856404',
                fontSize: '14px'
              }}>
                <strong>⚠️ 마이크 권한이 필요합니다</strong>
                <p style={{ margin: '5px 0 0 0' }}>
                  음성 인식을 사용하려면 브라우저에서 마이크 접근을 허용해야 합니다.
                </p>
                <button
                  onClick={checkMicrophonePermission}
                  style={{
                    marginTop: '5px',
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  권한 다시 요청
                </button>
              </div>
            )}
          </div>

          {/* 기존 판독 텍스트 영역 */}
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="SOAP 형식으로 판독 소견을 입력하세요...

S (Subjective - 주관적 소견):
환자가 호소하는 증상이나 병력

O (Objective - 객관적 소견):
영상에서 관찰되는 구체적인 소견들

A (Assessment - 평가/진단):
영상 소견을 바탕으로 한 진단적 평가

P (Plan - 계획):
추가 검사나 추적 관찰 권고사항"
            style={{
              width: '100%',
              height: '300px',
              padding: '10px',
              border: '1px solid #dee2e6',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: '1.5'
            }}
          />
          
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button
              onClick={handleReportSave}
              style={{
                padding: '10px 30px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              판독 완료
            </button>
            <button
              onClick={() => setIsReporting(false)}
              style={{
                padding: '10px 30px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              취소
            </button>
          </div>

          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            💡 음성으로 판독하면 자동으로 SOAP 형식으로 변환되어 텍스트에 추가됩니다.
          </div>
        </div>
      )}

      {/* 기존 판독 내용 표시 */}
      {studyData.report_text && !isReporting && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '15px' }}>
            판독 소견 (SOAP 형식)
          </h3>
          <div style={{
            padding: '15px',
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {studyData.report_text}
          </div>
        </div>
      )}

      {/* AI 분석 뷰어 섹션 - 기존 코드 그대로 유지 */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>
            AI 의료영상 분석 뷰어
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                alert('AI 분석을 시작합니다...');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              AI 분석 실행
            </button>
            <button
              onClick={() => {
                alert('전체화면 모드로 전환합니다.');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#495057',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              전체화면
            </button>
          </div>
        </div>

        {/* 메인 뷰어 영역 */}
        <div style={{
          display: 'flex',
          width: '100%',
          height: '700px',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}>
          
          {/* 왼쪽 사이드바 - 스터디 목록 */}
          <div style={{
            width: '250px',
            backgroundColor: '#495057',
            color: '#fff',
            padding: '15px',
            overflowY: 'auto'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#fff', borderBottom: '1px solid #6c757d', paddingBottom: '10px' }}>
              스터디 목록
            </h4>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '5px' }}>환자정보</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{studyData.patient_name}</div>
              <div style={{ fontSize: '12px', color: '#adb5bd' }}>{studyData.patient_id}</div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '10px' }}>검사 목록</div>
              <div style={{
                padding: '10px',
                backgroundColor: '#6c757d',
                borderRadius: '4px',
                marginBottom: '5px',
                cursor: 'pointer',
                border: '1px solid #adb5bd'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatDate(studyData.request_datetime)}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{studyData.body_part} - {studyData.modality}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>현재 검사</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '10px' }}>도구</div>
              <button style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: '1px solid #adb5bd',
                borderRadius: '4px',
                marginBottom: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                DICOM 내보내기
              </button>
              <button style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: '1px solid #adb5bd',
                borderRadius: '4px',
                marginBottom: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                이미지 동기화
              </button>
            </div>
          </div>

          {/* 가운데 영역 - AI 분석 이미지 + 원본 이미지 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* 상단 툴바 */}
            <div style={{
              height: '50px',
              backgroundColor: '#6c757d',
              display: 'flex',
              alignItems: 'center',
              padding: '0 15px',
              gap: '10px'
            }}>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#495057',
                color: '#fff',
                border: '1px solid #adb5bd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                확대
              </button>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#495057',
                color: '#fff',
                border: '1px solid #adb5bd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                측정
              </button>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#495057',
                color: '#fff',
                border: '1px solid #adb5bd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                어노테이션
              </button>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#495057',
                color: '#fff',
                border: '1px solid #adb5bd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                저장
              </button>
              <div style={{ marginLeft: 'auto', color: '#fff', fontSize: '12px' }}>
                이미지 1/1 | 100% | W:512 L:128
              </div>
            </div>

            {/* 이미지 뷰어 영역 */}
            <div style={{ flex: 1, display: 'flex' }}>
              
              {/* 왼쪽 - AI 분석 이미지 */}
              <div style={{
                flex: 1,
                backgroundColor: '#000',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #dee2e6'
              }}>
                <div style={{
                  height: '30px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  AI 분석 결과
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  {studyData.study_uid ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#1a1a1a',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#fff'
                    }}>
                      <div style={{
                        width: '300px',
                        height: '300px',
                        backgroundColor: '#333',
                        border: '2px solid #6c757d',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔬</div>
                          <div style={{ fontSize: '14px' }}>AI 분석 진행 중...</div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>모델 로딩중</div>
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#6c757d',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        <div><strong>AI 모델:</strong> ChestX-ray v2.1</div>
                        <div><strong>신뢰도:</strong> 95.7%</div>
                        <div><strong>처리시간:</strong> 2.3초</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6c757d', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔬</div>
                      <div>Study UID가 필요합니다</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽 - 원본 이미지 + 어노테이션 */}
              <div style={{
                flex: 1,
                backgroundColor: '#000',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #dee2e6'
              }}>
                <div style={{
                  height: '30px',
                  backgroundColor: '#495057',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  원본 이미지 + 어노테이션
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  {studyData.study_uid ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#1a1a1a',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: '300px',
                        height: '300px',
                        backgroundColor: '#333',
                        border: '2px solid #495057',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'crosshair'
                      }}>
                        <div style={{ color: '#fff', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📷</div>
                          <div style={{ fontSize: '14px' }}>원본 DICOM 이미지</div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>클릭하여 어노테이션</div>
                        </div>
                        
                        {/* 예시 바운딩박스 */}
                        <div style={{
                          position: 'absolute',
                          top: '50px',
                          left: '50px',
                          width: '100px',
                          height: '80px',
                          border: '2px solid #dc3545',
                          backgroundColor: 'rgba(220, 53, 69, 0.1)',
                          pointerEvents: 'none'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '0',
                            fontSize: '10px',
                            color: '#dc3545',
                            backgroundColor: '#000',
                            padding: '2px 4px',
                            borderRadius: '2px'
                          }}>
                            의심 병변
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6c757d', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                      <div>Study UID가 필요합니다</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 사이드바 - AI 분석 결과 및 도구 */}
          <div style={{
            width: '300px',
            backgroundColor: '#f8f9fa',
            padding: '15px',
            overflowY: 'auto',
            borderLeft: '1px solid #dee2e6'
          }}>
            
            {/* AI 분석 결과 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>
                AI 분석 결과
              </h4>
              <div style={{
                padding: '10px',
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>⚠ 이상 소견 발견</div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  우측 하엽에 의심 병변 검출<br/>
                  신뢰도: 94.2%
                </div>
              </div>
              <div style={{
                padding: '10px',
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>정량 분석</div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  병변 크기: 15.2mm<br/>
                  위치: (125, 87, 42)<br/>
                  부피: 1.8 cm³
                </div>
              </div>
            </div>

            {/* 어노테이션 도구 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>
                어노테이션 도구
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  바운딩박스
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  화살표
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  길이 측정
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  자유 그리기
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  지우기
                </button>
              </div>
            </div>

            {/* 판독 메모 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>
                판독 메모
              </h4>
              <textarea
                placeholder="AI 결과에 대한 의견을 입력하세요..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 액션 버튼들 */}
            <div>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>
                액션
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  AI 재분석
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  어노테이션 저장
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#495057',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  리포트 생성
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: '1px solid #adb5bd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  판독 완료
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 상태바 */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#6c757d',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>상태:</strong> AI 분석 완료 | <strong>어노테이션:</strong> 3개 | <strong>마지막 저장:</strong> 2025.05.24 15:30
          </div>
          <div>
            <strong>Study UID:</strong> {studyData.study_uid || '미입력'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyDetail;