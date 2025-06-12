// src/components/LoginPage.jsx

import React, { useEffect, useState } from 'react';
import LoginForm from './LoginForm';
import NotificationBar from './NotificationBar';
import { autoLogin } from './auth';
import axios from 'axios';

function LoginPage() {
  const [userId, setUserId] = useState(null);
  const [code, setCode]     = useState('');
  const [notice, setNotice] = useState('');
  const [showAutoLogin, setShowAutoLogin] = useState(false);
  const [error, setError]   = useState('');

  // 자동 로그인 UI 토글
  useEffect(() => {
    if (localStorage.getItem('autoLoginUser')) {
      setShowAutoLogin(true);
    }
  }, []);

  // 공지 가져오기
  useEffect(() => {
    axios.get('/api/notice/')
      .then(res => setNotice(res.data.notice || ''))
      .catch(() => setNotice(''));
  }, []);

  // ① LoginForm 또는 autoLogin 성공 시 userId가 세팅된다
  const handleAutoLogin = async () => {
    try {
      const res = await autoLogin({ code });
      setUserId(res.data.user_id);
    } catch {
      setError('자동 로그인 실패: 코드가 유효하지 않거나 만료됨');
    }
  };

  // ② userId가 세팅되면 OpenMRS에서 사용자 정보(fetch) → localStorage에 저장 → 메인으로 이동
  useEffect(() => {
    if (!userId) return;

    axios.get(`/openmrs/ws/rest/v1/user/${userId}`)
      .then(res => {
        const user = res.data;
        localStorage.setItem('doctor_id',   user.uuid);
        localStorage.setItem('doctor_name', user.display);
        // 메인 페이지로
        window.location.href = '/emr';
      })
      .catch(err => {
        console.error('사용자 정보 조회 실패', err);
        alert('로그인 후 사용자 정보를 불러오는 데 실패했습니다.');
      });
  }, [userId]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>

      {/* ③ 이 콜백은 LoginForm에서 로그인 성공 시 userId를 전달하도록 */}
      <LoginForm onLoginSuccess={setUserId} />

      {showAutoLogin && (
        <div style={{ marginTop: '20px' }}>
          <h4>Auto login</h4>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="부여 코드 입력"
          />
          <button onClick={handleAutoLogin}>자동 로그인</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}

      <NotificationBar message={notice} />
    </div>
  );
}

export default LoginPage;
