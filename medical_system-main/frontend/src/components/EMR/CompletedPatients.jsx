// src/components/EMR/CompletedPatients.jsx (수정본)

import React from 'react'; // axios, useEffect, useState 제거
import { CheckSquare } from 'lucide-react';
import './EmrMainPage.css'; // order-table* 규칙 포함된 공통 CSS

// EmrMainPage에서 completedPatients prop만 받도록 변경
// onRefreshCompleted 콜백은 이제 필요 없습니다.
const CompletedPatients = ({ completedPatients }) => {
  // API_BASE, loading, error, resetStatus 함수 모두 제거

  return (
    <div className="page-container-full">
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <CheckSquare size={20} style={{ marginRight: '0.5rem', color: '#52c41a' }} />
          진료 완료 환자 목록
        </h2>

        <p style={{ margin: '0 0 1rem', color: '#555' }}>
          총 <strong>{completedPatients ? completedPatients.length : 0}</strong>명
        </p>

        <div className="order-table-wrapper" style={{ marginTop: '1rem' }}>
          <table className="order-table">
            <thead>
              <tr>
                {[
                  '이름',
                  '환자 ID',
                  '성별',
                  '생년월일',
                  '진료실',
                  '마지막 동기화',
                  '상태',
                  // '작업' 컬럼 헤더 제거
                ].map(th => (
                  <th key={th}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* completedPatients가 배열이 아니거나 비어있을 때 */}
              {!Array.isArray(completedPatients) || completedPatients.length === 0 ? (
                <tr>
                  {/* colSpan을 7로 수정 (작업 컬럼 제거로 인해) */}
                  <td colSpan={7} style={{ color: '#666' }}>데이터가 없습니다.</td>
                </tr>
              ) : (
                completedPatients.map(p => (
                  <tr key={p.mapping_id}>
                    <td>{p.name}</td>
                    <td>{p.patient_identifier}</td>
                    <td>{p.gender === 'M' ? '남성' : p.gender === 'F' ? '여성' : '-'}</td>
                    <td>{p.birthdate || '-'}</td>
                    <td>{p.assigned_room || '-'}</td>
                    <td>{p.last_sync ? new Date(p.last_sync).toLocaleString() : '-'}</td>
                    <td>{p.status}</td>
                    {/* <td> 태그 전체 제거 (재설정 버튼 포함) */}
                    {/* <td>
                      <button
                        onClick={() => resetStatus(p.mapping_id)}
                        className="sample-button"
                      >
                        🔄 재설정
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompletedPatients;