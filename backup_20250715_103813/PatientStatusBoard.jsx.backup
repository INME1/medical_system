// src/components/EMR/PatientStatusBoard.jsx (수정된 버전)
// 🔥 완료 환자도 표시하도록 수정

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Stethoscope, Edit2, Save, X, Clock, CheckCircle, UserCheck } from 'lucide-react';
import './EmrMainPage.css';

const RECEPTION_API = 'http://35.225.63.41:8000/api/integration/reception-list/';
const API_BASE = process.env.REACT_APP_INTEGRATION_API || 'http://35.225.63.41:8000/api/integration/';

const PatientStatusBoard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 🔥 상태 필터 추가

  // 환자 목록 가져오기
  const fetchPatients = async () => {
    try {
      const res = await axios.get(RECEPTION_API);
      console.log('📊 접수 목록 데이터:', res.data);
      setPatients(res.data);
    } catch (err) {
      console.error('진료 진행도 목록 조회 실패', err);
      setError('진료 진행도 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 상태 업데이트 함수 수정
  const updatePatientStatus = async (mappingId, newStatus, patientData) => {
    try {
      console.log('🔄 상태 업데이트 시도:', { mappingId, newStatus, patientData });

      // 진료 완료 시 새로운 API 사용
      if (newStatus === 'complete') {
        const completeResponse = await axios.post(`${API_BASE}complete-treatment/`, {
          mapping_id: mappingId,
          room: patientData.assigned_room
        });
        
        if (!completeResponse.data.success) {
          throw new Error(completeResponse.data.error || '진료 완료 처리 실패');
        }
        
        console.log('✅ 진료 완료 처리:', completeResponse.data);
        alert(`${patientData.name || patientData.patient_identifier}님의 진료가 완료되었습니다.`);
      } else {
        // 기존 상태 업데이트 API 사용
        const statusResponse = await axios.patch(`${API_BASE}update-patient-status/`, {
          mapping_id: mappingId,
          status: newStatus
        });
        
        if (!statusResponse.data.success) {
          throw new Error(statusResponse.data.error || '상태 업데이트 실패');
        }
        
        console.log('✅ 상태 업데이트:', statusResponse.data);
      }

      // 편집 모드 종료 및 목록 새로고침
      setEditingPatient(null);
      setSelectedStatus('');
      fetchPatients();

    } catch (err) {
      console.error('❌ 상태 업데이트 실패:', err);
      alert(`상태 업데이트 실패: ${err.response?.data?.error || err.message}`);
    }
  };

  // 편집 시작
  const startEditing = (patient) => {
    setEditingPatient(patient.mapping_id);
    setSelectedStatus(patient.status);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingPatient(null);
    setSelectedStatus('');
  };

  // 🔥 상태별 필터링
  const filteredPatients = patients.filter(patient => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return patient.is_active;
    if (statusFilter === 'completed') return patient.status === 'complete';
    return patient.status === statusFilter;
  });

  // 🔥 상태별 통계
  const statistics = {
    total: patients.length,
    waiting: patients.filter(p => p.status === 'waiting').length,
    in_progress: patients.filter(p => p.status === 'in_progress').length,
    assigned: patients.filter(p => p.assigned_room && p.status !== 'complete').length,
    complete: patients.filter(p => p.status === 'complete').length,
    active: patients.filter(p => p.is_active).length
  };

  // 상태 표시 함수
  const getStatusDisplay = (status) => {
    const statusMap = {
      'waiting': '대기중',
      'in_progress': '진료중',
      'complete': '완료'
    };
    return statusMap[status] || status;
  };

  // 상태 색상 함수
  const getStatusColor = (patient) => {
    if (patient.status === 'complete') {
      return 'bg-green-100 text-green-800';
    } else if (patient.assigned_room) {
      return 'bg-blue-100 text-blue-800';
    } else if (patient.status === 'in_progress') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>환자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔥 헤더 및 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">통합 환자 상태 관리</h2>
          </div>
          
          {/* 상태 필터 */}
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">전체</option>
              <option value="waiting">대기중</option>
              <option value="in_progress">진료중</option>
              <option value="complete">완료</option>
              <option value="active">활성화</option>
            </select>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-800">{statistics.total}</div>
            <div className="text-xs text-gray-600">전체</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-yellow-800">{statistics.waiting}</div>
            <div className="text-xs text-yellow-600">대기중</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-800">{statistics.assigned}</div>
            <div className="text-xs text-blue-600">배정됨</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-800">{statistics.in_progress}</div>
            <div className="text-xs text-orange-600">진료중</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-800">{statistics.complete}</div>
            <div className="text-xs text-green-600">완료</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-800">{statistics.active}</div>
            <div className="text-xs text-purple-600">활성화</div>
          </div>
        </div>
      </div>

      {/* 환자 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  환자 정보
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진료실
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  접수시간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  대기시간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  완료시간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => {
                const isEditing = editingPatient === patient.mapping_id;
                const isCompleted = patient.status === 'complete';
                
                return (
                  <tr 
                    key={patient.mapping_id} 
                    className={`hover:bg-gray-50 ${isCompleted ? 'bg-green-50' : ''} ${!patient.is_active ? 'opacity-75' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {isCompleted ? (
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          ) : (
                            <UserCheck className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name || patient.patient_identifier}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.patient_identifier}
                          </div>
                          <div className="text-xs text-gray-400">
                            {patient.age}세 • {patient.gender === 'M' ? '남' : '여'}
                            {!patient.is_active && (
                              <span className="ml-2 text-red-500 font-medium">
                                [등록종료]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="waiting">대기중</option>
                          <option value="in_progress">진료중</option>
                          <option value="complete">완료</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient)}`}>
                          {getStatusDisplay(patient.status)}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {patient.assigned_room ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {patient.assigned_room}번실
                        </span>
                      ) : (
                        <span className="text-gray-400">미배정</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {patient.created_at ? (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(patient.created_at).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      ) : '-'}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {patient.wait_time_minutes ? (
                        `${patient.wait_time_minutes}분`
                      ) : '-'}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {patient.completed_at ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {new Date(patient.completed_at).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      ) : '-'}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updatePatientStatus(patient.mapping_id, selectedStatus, patient)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        !isCompleted && (
                          <button
                            onClick={() => startEditing(patient)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {statusFilter === 'all' ? '등록된 환자가 없습니다.' : `${statusFilter === 'complete' ? '완료된' : statusFilter} 상태의 환자가 없습니다.`}
        </div>
      )}
    </div>
  );
};

export default PatientStatusBoard;