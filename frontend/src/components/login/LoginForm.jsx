// LoginForm.jsx
import React, { useState } from 'react';
import { login } from './auth';

function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password || !code) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await login({ username, password, code });
      if (autoLoginChecked) {
        localStorage.setItem('autoLoginUser', res.data.user_id);
      }
      onLoginSuccess(res.data.user_id);
    } catch (err) {
      setError('로그인 실패: 아이디/비번/코드 확인');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="medisys-login-card">
      <div className="medisys-login-header">
        <h3 className="medisys-login-title">로그인</h3>
        <p className="medisys-login-subtitle">의료진 계정으로 로그인하세요</p>
      </div>

      <div className="medisys-login-form">
        <div className="medisys-input-group">
          <label className="medisys-label">의료진 ID</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="의료진 ID를 입력하세요"
            className="medisys-input"
          />
        </div>

        <div className="medisys-input-group">
          <label className="medisys-label">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="medisys-input"
          />
        </div>

        <div className="medisys-input-group">
          <label className="medisys-label">인증 코드</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="인증 코드를 입력하세요"
            className="medisys-input"
          />
        </div>

        <div className="medisys-checkbox-group">
          <label className="medisys-checkbox-label">
            <input
              type="checkbox"
              checked={autoLoginChecked}
              onChange={e => setAutoLoginChecked(e.target.checked)}
              className="medisys-checkbox"
            />
            자동 로그인
          </label>
          <a href="#" className="medisys-forgot-link">코드 찾기</a>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="medisys-login-button"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>

        {error && <div className="medisys-error-box">{error}</div>}
      </div>

      <div className="medisys-login-footer">
        <p className="medisys-help-text">
          계정이 없으신가요? <a href="#" className="medisys-signup-link">관리자에게 문의</a>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;