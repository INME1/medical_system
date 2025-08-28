import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Trash2, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Users,
  FileText,
  TestTube
} from 'lucide-react';

const MappingTestPanel = () => {
  const [testStatus, setTestStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastTestResult, setLastTestResult] = useState(null);

  const API_BASE = 'http://35.225.63.41:8000/api/integration/';

  // 테스트 상태 조회
  const loadTestStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}mappings/test-status/`);
      const data = await response.json();
      
      if (data.success) {
        setTestStatus(data);
      } else {
        setError('테스트 상태 조회 실패: ' + data.error);
      }
    } catch (err) {
      setError('테스트 상태 조회 요청 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 더미 데이터 생성
  const createDummyData = async () => {
    if (!confirm('더미 데이터를 생성하시겠습니까?\n(OpenMRS 환자 + Orthanc DICOM + 자동 매핑 테스트)')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}dummy-data/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastTestResult(data);
        await loadTestStatus(); // 상태 새로고침
        alert(`더미 데이터 생성 완료!\n
- OpenMRS 환자: ${data.summary.openmrs_patients_created}명
- Orthanc DICOM: ${data.summary.orthanc_dicoms_created}개  
- 자동 매핑 성공: ${data.summary.successful_mappings}개`);
      } else {
        setError('더미 데이터 생성 실패: ' + data.error);
      }
    } catch (err) {
      setError('더미 데이터 생성 요청 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 더미 데이터 정리
  const clearDummyData = async () => {
    if (!confirm('모든 더미 데이터를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}dummy-data/clear/`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTestStatus(); // 상태 새로고침
        alert(`더미 데이터 정리 완료!\n삭제된 매핑: ${data.deleted_mappings}개`);
      } else {
        setError('더미 데이터 정리 실패: ' + data.error);
      }
    } catch (err) {
      setError('더미 데이터 정리 요청 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 상태 로드
  useEffect(() => {
    loadTestStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <TestTube className="mr-3" />
                매핑 테스트 패널
              </h1>
              <p className="text-gray-600">더미 데이터를 생성하여 환자 매핑 시스템을 테스트합니다</p>
            </div>
            
            <button
              onClick={loadTestStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
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

        {/* 액션 버튼들 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">테스트 액션</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={createDummyData}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              더미 데이터 생성 & 매핑 테스트
            </button>
            
            <button
              onClick={clearDummyData}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              더미 데이터 정리
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">테스트 과정</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. OpenMRS에 3명의 더미 환자 생성 (김철수, 이영희, 박민수)</li>
              <li>2. 각 환자에 대한 더미 DICOM 파일을 Orthanc에 업로드</li>
              <li>3. DICOM 정보와 OpenMRS 환자 정보를 매칭하여 자동 매핑 시도</li>
              <li>4. 매핑 결과 확인 및 통계 표시</li>
            </ol>
          </div>
        </div>

        {/* 테스트 통계 */}
        {testStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 더미 매핑</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {testStatus.statistics.total_dummy_mappings}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">성공한 매핑</p>
                  <p className="text-2xl font-bold text-green-900">
                    {testStatus.statistics.successful_mappings}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">성공률</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {testStatus.statistics.success_rate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">자동 매핑</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {testStatus.statistics.auto_mappings}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 테스트 결과 */}
        {lastTestResult && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">최근 테스트 결과</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900">
                    {lastTestResult.summary.openmrs_patients_created}
                  </p>
                  <p className="text-sm text-blue-700">OpenMRS 환자 생성</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-900">
                    {lastTestResult.summary.orthanc_dicoms_created}
                  </p>
                  <p className="text-sm text-green-700">Orthanc DICOM 업로드</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-900">
                    {lastTestResult.summary.successful_mappings}
                  </p>
                  <p className="text-sm text-purple-700">성공한 자동 매핑</p>
                </div>
              </div>

              {/* 생성된 환자 목록 */}
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">생성된 환자 목록</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lastTestResult.details.created_patients.map((patient, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{patient.display}</p>
                      <p className="text-xs text-gray-600 mt-1">UUID: {patient.uuid}</p>
                      <p className="text-xs text-gray-600">Patient ID: {patient.patient_id}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 매핑 결과 */}
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">매핑 결과</h3>
                <div className="space-y-2">
                  {lastTestResult.details.mapping_results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          매핑 #{index + 1}
                        </span>
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 현재 더미 매핑 목록 */}
        {testStatus && testStatus.mappings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">현재 더미 매핑 목록</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매핑 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orthanc 환자 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OpenMRS UUID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DICOM Studies
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testStatus.mappings.map((mapping) => (
                    <tr key={mapping.mapping_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{mapping.mapping_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {mapping.orthanc_patient_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {mapping.openmrs_patient_uuid.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mapping.mapping_type === 'AUTO' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {mapping.mapping_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ['SYNCED', 'AUTO_MAPPED', 'MANUAL_MAPPED'].includes(mapping.sync_status)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mapping.sync_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mapping.dicom_studies_count}개
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 도움말 */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            매핑 테스트 도움말
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>더미 데이터 생성:</strong> OpenMRS에 3명의 테스트 환자를 생성하고, 각각에 대한 DICOM 파일을 Orthanc에 업로드합니다.</p>
            <p><strong>자동 매핑 테스트:</strong> DICOM의 Patient ID와 환자 이름을 기준으로 OpenMRS 환자와 자동 매핑을 시도합니다.</p>
            <p><strong>성공률 확인:</strong> 매핑이 성공한 비율을 통해 매핑 알고리즘의 정확도를 확인할 수 있습니다.</p>
            <p><strong>데이터 정리:</strong> 테스트 완료 후 더미 데이터를 정리하여 실제 운영 데이터와 분리할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingTestPanel;