import React, { useState, useEffect } from 'react';
import { Search, Upload, Eye, Calendar, User, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const RisPatientDicomViewer = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dicomStudies, setDicomStudies] = useState([]);
  const [unmappedPatients, setUnmappedPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mappingResults, setMappingResults] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  const API_BASE = 'http://35.225.63.41:8000/api/integration/';

  // 환자 검색
  const searchPatients = async (query) => {
    if (!query.trim()) {
      setSelectedPatient(null);
      setDicomStudies([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}openmrs/patients/search/?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const patient = data.results[0];
        setSelectedPatient(patient);
        await loadPatientDicomStudies(patient.uuid);
      } else {
        setError('검색 결과가 없습니다');
        setSelectedPatient(null);
        setDicomStudies([]);
      }
    } catch (err) {
      setError('환자 검색 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 환자의 DICOM Study 목록 로드
  const loadPatientDicomStudies = async (patientUuid) => {
    try {
      const response = await fetch(`${API_BASE}patients/${patientUuid}/dicom-studies/`);
      const data = await response.json();
      
      if (data.success) {
        setDicomStudies(data.studies);
        console.log('환자 DICOM Studies:', data.studies);
      } else {
        setDicomStudies([]);
        console.log('환자에게 연결된 DICOM이 없습니다');
      }
    } catch (err) {
      console.error('DICOM Study 로드 실패:', err);
      setDicomStudies([]);
    }
  };

  // 매핑되지 않은 Orthanc 환자들 조회
  const loadUnmappedPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}orthanc/unmapped-patients/`);
      const data = await response.json();
      
      if (data.success) {
        setUnmappedPatients(data.unmapped_patients);
      }
    } catch (err) {
      setError('매핑되지 않은 환자 조회 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 일괄 자동 매핑
  const performBatchAutoMapping = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}mappings/batch-auto-mapping/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMappingResults(data.results);
        await loadUnmappedPatients(); // 목록 새로고침
        alert(`일괄 매핑 완료: 성공 ${data.successful_count}개, 실패 ${data.failed_count}개`);
      } else {
        setError('일괄 매핑 실패: ' + data.error);
      }
    } catch (err) {
      setError('일괄 매핑 요청 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // DICOM 파일 업로드
  const uploadDicomFile = async (file) => {
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('dicom_file', file);
      
      const response = await fetch(`${API_BASE}dicom/upload-with-mapping/`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success || data.mapping_result?.success) {
        alert('DICOM 업로드 및 자동 매핑 성공!');
        if (selectedPatient) {
          await loadPatientDicomStudies(selectedPatient.uuid);
        }
        await loadUnmappedPatients();
      } else if (data.mapping_result?.requires_manual_mapping) {
        alert('DICOM 업로드 성공, 하지만 자동 매핑에 실패했습니다. 수동 매핑이 필요합니다.');
        await loadUnmappedPatients();
      } else {
        setError('DICOM 업로드 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (err) {
      setError('DICOM 업로드 요청 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Study 상세 보기 (새 창에서 DICOM 뷰어 열기)
  const viewStudyDetails = (study) => {
    if (study.study_instance_uid) {
      // DICOM 뷰어 컴포넌트로 이동하거나 새 창에서 열기
      window.open(`/dicom-viewer?studyUid=${study.study_instance_uid}`, '_blank');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.length === 8) {
      // YYYYMMDD 형식을 YYYY-MM-DD로 변환
      return `${dateString.slice(0,4)}-${dateString.slice(4,6)}-${dateString.slice(6,8)}`;
    }
    return dateString;
  };

  // 컴포넌트 마운트 시 매핑되지 않은 환자들 로드
  useEffect(() => {
    loadUnmappedPatients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🏥 RIS - 환자 DICOM 관리</h1>
          
          {/* 검색 및 업로드 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="환자 이름 또는 ID로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients(searchQuery)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={() => searchPatients(searchQuery)}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              검색
            </button>
            
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              DICOM 업로드
            </button>
            
            <button
              onClick={performBatchAutoMapping}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              일괄 자동 매핑
            </button>
          </div>

          {/* DICOM 업로드 영역 */}
          {showUpload && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <input
                type="file"
                accept=".dcm,.dicom"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    uploadDicomFile(file);
                  }
                }}
                className="w-full"
              />
              <p className="text-sm text-gray-600 mt-2">DICOM 파일을 선택하면 자동으로 업로드되고 환자 매핑이 시도됩니다.</p>
            </div>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 선택된 환자 정보 및 DICOM Studies */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                선택된 환자의 DICOM Studies
              </h2>
            </div>
            
            <div className="p-6">
              {selectedPatient ? (
                <div className="space-y-4">
                  {/* 환자 정보 */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900">{selectedPatient.display}</h3>
                    <div className="text-sm text-blue-700 mt-1">
                      <p>UUID: {selectedPatient.uuid}</p>
                      <p>성별: {selectedPatient.gender === 'M' ? '남성' : '여성'} | 나이: {selectedPatient.age}세</p>
                    </div>
                  </div>

                  {/* DICOM Studies */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      DICOM Studies ({dicomStudies.length}개)
                    </h4>
                    
                    {dicomStudies.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>이 환자에게 연결된 DICOM Study가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dicomStudies.map((study, index) => (
                          <div
                            key={study.study_id || index}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  {study.study_description || 'Study Description 없음'}
                                </h5>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  <p><Calendar className="w-4 h-4 inline mr-1" />
                                    검사일: {formatDate(study.study_date)}
                                  </p>
                                  <p>Modality: {study.modality || '-'}</p>
                                  <p>Accession Number: {study.accession_number || '-'}</p>
                                  <p>Series 수: {study.series_count || 0}개</p>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => viewStudyDetails(study)}
                                className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                보기
                              </button>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Study UID: {study.study_instance_uid || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>환자를 검색하여 DICOM Studies를 확인하세요.</p>
                </div>
              )}
            </div>
          </div>

          {/* 매핑되지 않은 Orthanc 환자들 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  매핑되지 않은 DICOM 환자들
                </h2>
                <button
                  onClick={loadUnmappedPatients}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {unmappedPatients.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>모든 DICOM 환자가 매핑되었습니다!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {unmappedPatients.map((patient, index) => (
                    <div key={patient.orthanc_patient_id || index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {patient.patient_name || '이름 없음'}
                          </h4>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <p>Patient ID: {patient.patient_id_dicom || '-'}</p>
                            <p>생년월일: {formatDate(patient.patient_birth_date)}</p>
                            <p>성별: {patient.patient_sex || '-'}</p>
                            <p>Studies: {patient.studies_count}개</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            // 수동 매핑 모달 열기 (향후 구현)
                            alert('수동 매핑 기능을 구현 예정입니다.');
                          }}
                          className="ml-4 px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                        >
                          수동 매핑
                        </button>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Orthanc ID: {patient.orthanc_patient_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 매핑 결과 */}
        {mappingResults.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">일괄 매핑 결과</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mappingResults.map((result, index) => (
                  <div
                    key={result.orthanc_patient_id || index}
                    className={`p-4 rounded-lg border ${
                      result.mapping_result?.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start">
                      {result.mapping_result?.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                      )}
                      
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {result.orthanc_patient_id}
                        </p>
                        <p className={`text-xs mt-1 ${
                          result.mapping_result?.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.mapping_result?.message || '처리 실패'}
                        </p>
                        
                        {result.mapping_result?.matched_patient && (
                          <p className="text-xs text-green-600 mt-1">
                            → {result.mapping_result.matched_patient.display}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RisPatientDicomViewer;