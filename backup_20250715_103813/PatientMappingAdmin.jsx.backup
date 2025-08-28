import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Settings,
  BarChart3,
  Link,
  Unlink
} from 'lucide-react';

const PatientMappingAdmin = () => {
  const [mappings, setMappings] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = 'http://35.225.63.41:8000/api/integration/';

  // 매핑 목록 로드
  const loadMappings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}patient-mappings/`);
      const data = await response.json();
      
      if (data.results) {
        setMappings(data.results);
      }
    } catch (err) {
      setError('매핑 목록 로드 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 통계 정보 로드 (가상의 엔드포인트)
  const loadStatistics = async () => {
    try {
      // 실제로는 별도의 통계 API가 필요합니다
      const stats = {
        total_mappings: mappings.length,
        auto_mappings: mappings.filter(m => m.mapping_type === 'AUTO').length,
        manual_mappings: mappings.filter(m => m.mapping_type === 'MANUAL').length,
        synced_mappings: mappings.filter(m => m.sync_status === 'SYNCED').length,
        error_mappings: mappings.filter(m => m.sync_status === 'ERROR').length
      };
      setStatistics(stats);
    } catch (err) {
      console.error('통계 로드 실패:', err);
    }
  };

  // 매핑 삭제
  const deleteMapping = async (mappingId) => {
    if (!confirm('이 매핑을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}patient-mappings/${mappingId}/delete/`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadMappings();
        alert('매핑이 삭제되었습니다.');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      alert('매핑 삭제 실패: ' + err.message);
    }
  };

  // 매핑 동기화
  const syncMapping = async (mappingId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}patient-mappings/${mappingId}/sync/`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadMappings();
        alert('매핑이 동기화되었습니다.');
      } else {
        alert('동기화 실패: ' + data.error_message);
      }
    } catch (err) {
      alert('동기화 요청 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 상태에 따른 아이콘 반환
  const getStatusIcon = (status) => {
    switch (status) {
      case 'SYNCED':
      case 'AUTO_MAPPED':
      case 'MANUAL_MAPPED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // 상태에 따른 색상 클래스 반환
  const getStatusColor = (status) => {
    switch (status) {
      case 'SYNCED':
      case 'AUTO_MAPPED':
      case 'MANUAL_MAPPED':
        return 'bg-green-100 text-green-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 탭에 따른 매핑 필터링
  const getFilteredMappings = () => {
    let filtered = mappings;

    // 탭 필터
    switch (selectedTab) {
      case 'auto':
        filtered = filtered.filter(m => m.mapping_type === 'AUTO');
        break;
      case 'manual':
        filtered = filtered.filter(m => m.mapping_type === 'MANUAL');
        break;
      case 'error':
        filtered = filtered.filter(m => m.sync_status === 'ERROR');
        break;
      case 'synced':
        filtered = filtered.filter(m => ['SYNCED', 'AUTO_MAPPED', 'MANUAL_MAPPED'].includes(m.sync_status));
        break;
      default:
        // 'all' - 모든 매핑 표시
        break;
    }

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.orthanc_patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.openmrs_patient_uuid.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  useEffect(() => {
    loadMappings();
  }, []);

  useEffect(() => {
    if (mappings.length > 0) {
      loadStatistics();
    }
  }, [mappings]);

  const filteredMappings = getFilteredMappings();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <Link className="inline mr-2" />
                환자 매핑 관리
              </h1>
              <p className="text-gray-600">OpenMRS와 Orthanc 환자 매핑 관리</p>
            </div>
            
            <button
              onClick={loadMappings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 매핑</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_mappings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">자동 매핑</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.auto_mappings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수동 매핑</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.manual_mappings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">동기화됨</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.synced_mappings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오류</p>
                <p className="text-2xl font-bold text-red-900">{statistics.error_mappings || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* 탭 버튼들 */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: '전체', count: mappings.length },
                { key: 'auto', label: '자동 매핑', count: statistics.auto_mappings },
                { key: 'manual', label: '수동 매핑', count: statistics.manual_mappings },
                { key: 'synced', label: '동기화됨', count: statistics.synced_mappings },
                { key: 'error', label: '오류', count: statistics.error_mappings }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count || 0})
                </button>
              ))}
            </div>

            {/* 검색 */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Orthanc ID 또는 OpenMRS UUID 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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

        {/* 매핑 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              매핑 목록 ({filteredMappings.length}개)
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : filteredMappings.length === 0 ? (
            <div className="p-6 text-center">
              <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">매핑이 없습니다.</p>
            </div>
          ) : (
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
                      매핑 타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMappings.map((mapping) => (
                    <tr key={mapping.mapping_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{mapping.mapping_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {mapping.orthanc_patient_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {mapping.openmrs_patient_uuid}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mapping.mapping_type === 'AUTO' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {mapping.mapping_type === 'AUTO' ? '자동' : '수동'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(mapping.sync_status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mapping.sync_status)}`}>
                            {mapping.sync_status}
                          </span>
                        </div>
                        {mapping.error_message && (
                          <p className="text-xs text-red-600 mt-1 truncate max-w-48" title={mapping.error_message}>
                            {mapping.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(mapping.created_date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => syncMapping(mapping.mapping_id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="동기화"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMapping(mapping.mapping_id)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientMappingAdmin;