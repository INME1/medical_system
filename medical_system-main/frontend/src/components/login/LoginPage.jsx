// LoginPage.jsx - 수정된 버전
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import NotificationBar from './NotificationBar';
import { autoLogin } from './auth';
import axios from 'axios';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate(); // ✅ 컴포넌트 내부로 이동
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [showAutoLogin, setShowAutoLogin] = useState(false);
  const [error, setError] = useState('');
  const [isAutoLoginLoading, setIsAutoLoginLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // 자동 로그인 UI 토글
  useEffect(() => {
    if (localStorage.getItem('autoLoginUser')) {
      setShowAutoLogin(true);
    }
  }, []);

  // 공지 가져오기 - 경로 수정
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        // 첫 번째 시도
        const response = await axios.get('/api/account/notice/');
        setNotice(response.data.notice || '');
      } catch (error1) {
        console.log('첫 번째 공지 경로 실패, 두 번째 시도...');
        try {
          // 두 번째 시도
          const response = await axios.get('/api/notice/');
          setNotice(response.data.notice || '');
        } catch (error2) {
          console.log('공지 가져오기 실패:', error2);
          setNotice('공지사항을 불러올 수 없습니다.');
        }
      }
    };
    
    fetchNotice();
  }, []);

  // 자동 로그인 처리
  const handleAutoLogin = async () => {
    if (!code) {
      setError('코드를 입력해주세요.');
      return;
    }

    setIsAutoLoginLoading(true);
    setError('');

    try {
      const res = await autoLogin({ code });
      setUserId(res.data.user_id);
    } catch (err) {
      console.error('자동 로그인 오류:', err);
      setError('자동 로그인 실패: 코드가 유효하지 않거나 만료됨');
    } finally {
      setIsAutoLoginLoading(false);
    }
  };

  // 더미 로그인 처리
  const handleDummyLogin = () => {
    // 더미 사용자 정보로 즉시 로그인
    const dummyUser = {
      uuid: 'user_dummy',
      display: '더미 사용자',
      username: 'dummy_user'
    };
    
    localStorage.setItem('doctor_id', dummyUser.uuid);
    localStorage.setItem('doctor_name', dummyUser.display);
    setUserInfo(dummyUser);
    setUserId('dummy');
    
    // 즉시 페이지 이동 (3초 대기 없음)
    navigate('/Main_page/TitlePage');
  };

  // 다른 계정으로 로그인
  const handleLoginOther = () => {
    localStorage.removeItem('autoLoginUser');
    setShowAutoLogin(false);
    setUserId(null);
    setUserInfo(null);
    setCode('');
    setError('');
  };

  // userId가 세팅되면 사용자 정보 처리
  useEffect(() => {
    if (!userId) return;
    
    // 더미 로그인인 경우 바로 리턴 (이미 처리됨)
    if (userId === 'dummy') return;

    // 임시로 OpenMRS 호출 대신 로컬 처리
    const tempUser = {
      uuid: `user_${userId}`,
      display: `사용자_${userId}`,
      username: `user${userId}`
    };
    
    localStorage.setItem('doctor_id', tempUser.uuid);
    localStorage.setItem('doctor_name', tempUser.display);
    setUserInfo(tempUser);
    
    // 즉시 메인 페이지로 이동 (3초 대기 제거)
    navigate('/Main_page/TitlePage');

    /* OpenMRS 연동이 필요할 때 주석 해제
    axios.get(`/openmrs/ws/rest/v1/user/${userId}`)
      .then(res => {
        const user = res.data;
        localStorage.setItem('doctor_id', user.uuid);
        localStorage.setItem('doctor_name', user.display);
        setUserInfo(user);
        navigate('/Main_page/TitlePage'); // navigate 사용
      })
      .catch(err => {
        console.error('사용자 정보 조회 실패', err);
        alert('로그인 후 사용자 정보를 불러오는 데 실패했습니다.');
        setError(err);
      });
    */
  }, [userId, navigate]); // ✅ navigate를 의존성 배열에 추가

  return (
    <div className="medisys-container">
      <div className="medisys-content">
        {/* Left Side - Branding */}
        <div className="medisys-left-side">
          <div className="medisys-logo-container">
            <div className="medisys-logo-icon">M</div>
            <div>
              <h1 className="medisys-brand-title">LaCID</h1>
              <p className="medisys-brand-subtitle">의료진 포털 시스템</p>
            </div>
          </div>
          
          <div className="medisys-branding-text">
            <h2 className="medisys-welcome-title">의료진 포털에 오신 것을 환영합니다</h2>
            <p className="medisys-welcome-subtitle">
              안전하고 효율적인 의료 정보 시스템으로<br/>
              더 나은 환자 케어를 제공하세요
            </p>
          </div>

          <div className="medisys-features">
            <div className="medisys-feature-item">
              <span className="medisys-feature-icon">🏥</span>
              <span>통합 의료 정보 시스템</span>
            </div>
            <div className="medisys-feature-item">
              <span className="medisys-feature-icon">🔒</span>
              <span>보안 강화된 환자 데이터</span>
            </div>
            <div className="medisys-feature-item">
              <span className="medisys-feature-icon">📊</span>
              <span>실시간 의료 통계 및 분석</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Area */}
        <div className="medisys-right-side">
          {/* 공지사항 */}
          <NotificationBar message={notice} />

          {/* 로그인 성공 시 사용자 정보 표시 */}
          {userInfo && (
            <div className="medisys-success-box">
              <h3 className="medisys-success-title">로그인 성공!</h3>
              <p className="medisys-success-text">
                환영합니다, {userInfo.display}님<br/>
                사용자 ID: {userInfo.uuid}
              </p>
            </div>
          )}

          {/* 더미 로그인 버튼 추가 */}
          <div className="medisys-dummy-login">
            <button
              onClick={handleDummyLogin}
              className="medisys-dummy-login-button"
            >
              🚀 더미 로그인 (개발용)
            </button>
            <p className="medisys-dummy-info">
              ID: aa | PW: qq11ww22 | Code: a114e97d
            </p>
          </div>

          {/* 메인 로그인 폼 */}
          <LoginForm onLoginSuccess={setUserId} />

          {/* 자동 로그인 섹션 */}
          {showAutoLogin && (
            <div className="medisys-auto-login">
              <h4 className="medisys-auto-login-title">자동 로그인</h4>
              
              <div className="medisys-auto-login-form">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="부여 코드 입력"
                  className="medisys-input"
                />
                
                <div className="medisys-auto-login-buttons">
                  <button
                    onClick={handleAutoLogin}
                    disabled={isAutoLoginLoading}
                    className="medisys-auto-login-button"
                  >
                    {isAutoLoginLoading ? '로그인 중...' : '자동 로그인'}
                  </button>
                  
                  <button
                    onClick={handleLoginOther}
                    className="medisys-other-account-button"
                  >
                    다른 계정
                  </button>
                </div>
                
                {error && <div className="medisys-error-box">{error}</div>}
              </div>
            </div>
          )}

          {/* 시스템 상태 */}
          <div className="medisys-system-status">
            <div className="medisys-status-item">
              <div className="medisys-status-dot"></div>
              <span>시스템 정상 운영 중</span>
            </div>
            <div className="medisys-status-item">
              <span>서버 응답 시간: 12ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="medisys-footer">
        <p className="medisys-footer-text">
          © 2025 LaCID. 모든 권리 보유. | 개인정보처리방침 | 이용약관
        </p>
      </div>
    </div>
  );
}

export default LoginPage;