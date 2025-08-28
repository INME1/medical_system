// frontend/src/components/LIS/PatientListPage.jsx (수정된 버전)

import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, MapPin, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const PatientListPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [filteredPatients, setFilteredPatients] = useState([]);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const patientsPerPage = 20;

  // ✅ 수정: Django 백엔드 API 사용
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://35.225.63.41:8000/api/';

  console.log('🌐 API_BASE_URL:', API_BASE_URL);

  // 연결 테스트
  const testConnection = async () => {
    try {
      setLoading(true);
      console.log('🔍 연결 테스트 시작...');
      
      // ✅ Django 백엔드를 통한 연결 테스트
      const response = await axios.get(`${API_BASE_URL}integration/test-connections/`);
      setConnectionStatus(response.data);
      
      console.log('✅ 연결 테스트 결과:', response.data);
    } catch (err) {
      console.error('❌ 연결 테스트 실패:', err);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 수정: Django 백엔드를 통한 전체 환자 목록 조회
  const fetchAllPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 전체 환자 목록 조회 시작...');
      
      const startIndex = (currentPage - 1) * patientsPerPage;
      const url = `${API_BASE_URL}integration/openmrs/patients/?limit=${patientsPerPage}&startIndex=${startIndex}`;
      
      console.log('🌐 Django API 호출:', url);
      
      // ✅ Django 백엔드 API 호출 (OpenMRS 직접 호출 대신)
      const response = await axios.get(url, {
        timeout: 30000, // 30초 타임아웃
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📥 Django API 응답:', response.data);

      if (response.data.results) {
        setPatients(response.data.results);
        setFilteredPatients(response.data.results);
        setTotalPatients(response.data.totalCount || response.data.total || response.data.results.length);
        console.log(`✅ 환자 목록 조회 성공: ${response.data.results.length}명`);
      } else {
        throw new Error('응답 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('❌ 환자 목록 조회 실패:', err);
      
      // 상세한 에러 정보 출력
      if (err.response) {
        console.error('응답 상태:', err.response.status);
        console.error('응답 데이터:', err.response.data);
        setError(`환자 목록 조회 실패: ${err.response.data?.error || err.response.statusText}`);
      } else if (err.request) {
        console.error('요청 실패:', err.request);
        setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        console.error('오류:', err.message);
        setError(`환자 목록 조회 실패: ${err.message}`);
      }
      
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 수정: Django 백엔드를 통한 환자 검색
  const searchPatients = async (query = '') => {
    if (!query.trim()) {
      setFilteredPatients(patients);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 환자 검색:', query);
      
      // ✅ Django 백엔드를 통한 검색
      const response = await axios.get(`${API_BASE_URL}integration/openmrs/patients/search/`, {
        params: { q: query },
        timeout: 15000
      });
      
      console.log('🔍 검색 결과:', response.data);
      
      setFilteredPatients(response.data.results || []);
    } catch (err) {
      console.error('❌ 환자 검색 실패:', err);
      setError(`환자 검색 실패: ${err.response?.data?.error || err.message}`);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 수정: Django 백엔드를 통한 환자 상세 정보 조회
  const getPatientDetails = async (uuid) => {
    try {
      setLoading(true);
      
      // ✅ Django 백엔드를 통한 상세 정보 조회
      const response = await axios.get(`${API_BASE_URL}integration/openmrs/patients/${uuid}/`);
      
      setSelectedPatient(response.data);
      console.log('👤 환자 상세 정보:', response.data);
    } catch (err) {
      console.error('❌ 환자 정보 조회 실패:', err);
      setError(`환자 정보 조회 실패: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 검색 입력 처리 (디바운싱)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPatients(searchQuery);
      } else {
        setFilteredPatients(patients);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, patients]);

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    testConnection();
    fetchAllPatients();
  }, [currentPage]);

  // 나이 계산
  const calculateAge = (birthdate) => {
    if (!birthdate) return '알 수 없음';
    try {
      const today = new Date();
      const birth = new Date(birthdate);
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
      }
      return age;
    } catch {
      return '알 수 없음';
    }
  };

  // 성별 표시
  const getGenderDisplay = (gender) => {
    return gender === 'M' ? '남성' : gender === 'F' ? '여성' : '알 수 없음';
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 새로고침
  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchQuery('');
    setError(null);
    fetchAllPatients();
  };

  const totalPages = Math.ceil(totalPatients / patientsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                👥 OpenMRS 환자 목록
              </h1>
              <p className="text-gray-600">
                {totalPatients > 0 ? (
                  <>총 {totalPatients}명의 환자 (페이지 {currentPage}/{totalPages})</>
                ) : (
                  '환자 목록을 불러오는 중...'
                )}
              </p>
            </div>
            
            {/* 상태 및 액션 버튼 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={testConnection}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                연결 테스트
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              
              {/* ✅ 개선된 연결 상태 표시 */}
              {connectionStatus && (
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus.connections?.openmrs ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    connectionStatus.connections?.openmrs ? 'text-green-700' : 'text-red-700'
                  }`}>
                    OpenMRS {connectionStatus.connections?.openmrs ? '연결됨' : '연결 실패'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 검색 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="환자 이름, ID, 또는 기타 정보로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {loading && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                {searchQuery ? '검색 중...' : '환자 목록을 불러오는 중...'}
              </span>
            </div>
          )}
        </div>

        {/* ✅ 개선된 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <span className="text-red-700 font-medium">오류 발생</span>
                <p className="text-red-600 mt-1">{error}</p>
                <div className="mt-2 text-sm text-red-600">
                  해결 방법:
                  <ul className="list-disc list-inside mt-1">
                    <li>Django 백엔드 서버가 실행 중인지 확인</li>
                    <li>OpenMRS 서버가 실행 중인지 확인</li>
                    <li>네트워크 연결 상태 확인</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 환자 목록 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                환자 목록 ({filteredPatients.length}명)
              </h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredPatients.length === 0 && !loading ? (
                <div className="p-6 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{searchQuery ? '검색 결과가 없습니다.' : '환자가 없습니다.'}</p>
                  {!searchQuery && (
                    <button
                      onClick={handleRefresh}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      다시 시도
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.uuid}
                      onClick={() => getPatientDetails(patient.uuid)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedPatient?.uuid === patient.uuid ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {patient.display || patient.name || '이름 없음'}
                          </h3>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">ID:</span> {patient.identifier || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">성별:</span> {getGenderDisplay(patient.gender)}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">나이:</span> {calculateAge(patient.birthdate)}세
                            </p>
                            {patient.birthdate && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">생년월일:</span> {patient.birthdate.split('T')[0]}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          클릭하여 상세보기
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                  >
                    이전
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 환자 상세 정보 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">환자 상세 정보</h2>
            </div>
            
            <div className="p-6">
              {selectedPatient ? (
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">기본 정보</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                          <p className="text-sm text-gray-600">환자명</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedPatient.birthdate?.split('T')[0]} ({calculateAge(selectedPatient.birthdate)}세)
                          </p>
                          <p className="text-sm text-gray-600">생년월일</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">성별</p>
                          <p className="font-medium">{getGenderDisplay(selectedPatient.gender)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">환자 ID</p>
                          <p className="font-medium">{selectedPatient.identifier || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 식별자 정보 */}
                  {selectedPatient.identifiers && selectedPatient.identifiers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">식별자</h3>
                      <div className="space-y-2">
                        {selectedPatient.identifiers.map((identifier, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between">
                              <span className="font-medium">{identifier.identifier}</span>
                              <span className="text-sm text-gray-600">{identifier.identifierType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 주소 정보 */}
                  {selectedPatient.addresses && selectedPatient.addresses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">주소</h3>
                      <div className="space-y-2">
                        {selectedPatient.addresses.map((address, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                              <div>
                                <p className="font-medium">
                                  {[address.address1, address.address2].filter(Boolean).join(', ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {[address.cityVillage, address.stateProvince, address.country]
                                    .filter(Boolean).join(', ')}
                                </p>
                                {address.postalCode && (
                                  <p className="text-sm text-gray-600">우편번호: {address.postalCode}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* UUID */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500">UUID: {selectedPatient.uuid}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>환자를 선택하면 상세 정보가 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientListPage;