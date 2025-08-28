import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Stethoscope, Users, Brain, ChevronRight, Mail, Phone, MapPin, Award
} from 'lucide-react';
import './LaCIDPage.css';
import lacidLogo from '../Styles/LaCID_01.png';

const LaCIDPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  // 팀원 상세 정보
  const teamMembers = [
    {
      id: 1,
      name: '김채윤',
      role: '팀장',
      desc: 'MEMO1',
      initial: '김',
      email: 'chaeyoon.kim@lacid.ai',
      phone: '010-1234-5678',
      department: '미래융합교육원',
      experience: '0년차',
      education: '미래융합교육원',
      goals: [
        '정승처럼 벌어 수전노 처럼 살겠습니다',
        'money more money',
        '차세대 의료 AI 플랫폼 구축 선도'
      ],
      responsibilities: [
        '전체 프로젝트 기획 및 관리',
        'AI 모델 개발 총괄',
        '클라우드 환경 구축',
        '팀원 멘토링 및 기술 지도'
      ],
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Project Management'],
      achievements: [
        '2024년 우수 AI 연구상 수상 하고 싶습니다',
        '국제 의료 AI 학회 논문 3편 게재 하고 싶습니다',
        'SCI급 저널 논문 5편 발표 하고 싶습니다'
      ]
    },
    {
      id: 2,
      name: '김상묵',
      role: '팀원',
      desc: 'MEMO2',
      initial: '김',
      email: 'sangmook.kim@lacid.ai',
      phone: '010-2345-6789',
      department: '미래융합교육원',
      experience: '4년차',
      education: '카이스트 전산학부 학사',
      goals: [
        '실시간 영상 처리 시스템 최적화',
        '딥러닝 모델 경량화 기술 개발',
        '의료진 사용자 경험 개선'
      ],
      responsibilities: [
        '폐 결절 검출 모델 개발',
        '영상 전처리 알고리즘 구현',
        '모델 성능 최적화',
        '데이터 파이프라인 구축'
      ],
      skills: ['Computer Vision', 'Deep Learning', 'OpenCV', 'CUDA', 'Docker'],
      achievements: [
        '폐 결절 검출 정확도 95% 달성',
        '처리 속도 30% 향상 알고리즘 개발',
        '특허 출원 2건'
      ]
    },
    {
      id: 3,
      name: '심보람',
      role: '팀원',
      desc: 'MEMO3',
      initial: '심',
      email: 'boram.sim@lacid.ai',
      phone: '010-3456-7890',
      department: '미래융합교육원',
      experience: '3년차',
      education: '연세대학교 의공학과 석사',
      goals: [
        '임상 검증 프로토콜 고도화',
        '의료진 피드백 시스템 구축',
        '국제 임상시험 참여 확대'
      ],
      responsibilities: [
        '임상 데이터 수집 및 분석',
        '의료진과의 협업 조율',
        '임상시험 설계 및 진행',
        '규제 승인 업무 지원'
      ],
      skills: ['Clinical Research', 'Medical Statistics', 'DICOM', 'HL7', 'GCP'],
      achievements: [
        '50개 병원 임상 파트너십 구축',
        'FDA 승인 준비 문서 작성',
        '임상시험 성공률 85% 달성'
      ]
    },
    {
      id: 4,
      name: '이나영',
      role: '팀원',
      desc: 'MEMO4',
      initial: '이',
      email: 'nayoung.lee@lacid.ai',
      phone: '010-4567-8901',
      department: '미래융합교육원',
      experience: '3년차',
      education: '고려대학교 컴퓨터학과 학사',
      goals: [
        '사용자 친화적 인터페이스 개발',
        '시스템 안정성 99.9% 달성',
        '글로벌 서비스 플랫폼 구축'
      ],
      responsibilities: [
        '웹 플랫폼 프론트엔드 개발',
        'UI/UX 디자인 및 구현',
        '사용자 경험 분석 및 개선',
        '시스템 통합 테스트'
      ],
      skills: ['React', 'JavaScript', 'Node.js', 'UI/UX Design', 'System Integration'],
      achievements: [
        '사용자 만족도 95% 달성',
        '시스템 다운타임 0.01% 유지',
        '모바일 반응형 웹 완성도 100%'
      ]
    }
  ];

  const openMemberModal = (member) => {
    console.log('팀원 클릭됨:', member); // 디버깅용
    setSelectedMember(member);
  };

  const closeMemberModal = () => {
    console.log('모달 닫기'); // 디버깅용
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            {/* Logo */}
            <a href="#" className="logo flex flex-col items-center text-center">
              <img src={lacidLogo} alt="LaCID Logo" className="w-10 h-auto mb-1" />
              <p className="text-sm text-blue-700 font-medium">
                Lung Anomaly Clinical Intelligence Decision-support
              </p>
            </a>

            {/* Desktop Navigation */}
            <div className="nav-links">
              <button
                onClick={() => scrollToSection('overview')}
                className={`btn-secondary ${activeSection === 'overview' ? 'active' : ''}`}
              >
                프로젝트 개요
              </button>
              <button
                onClick={() => scrollToSection('team')}
                className={`btn-secondary ${activeSection === 'team' ? 'active' : ''}`}
              >
                팀원 소개
              </button>
              <button
                onClick={() => scrollToSection('tech')}
                className={`btn-secondary ${activeSection === 'tech' ? 'active' : ''}`}
              >
                기술 소개
              </button>
              <button onClick={handleLogin} className="btn-primary">
                로그인
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <button onClick={() => scrollToSection('overview')} className="btn-secondary">프로젝트 개요</button>
            <button onClick={() => scrollToSection('team')} className="btn-secondary">팀원 소개</button>
            <button onClick={() => scrollToSection('tech')} className="btn-secondary">기술 소개</button>
            <button onClick={handleLogin} className="btn-secondary">로그인</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h2>
                <br/>
                정밀 의료를 위한
                <span className="block gradient-text">CDSS</span>
              </h2>
              <p>AI 기반 흉부영상 판독 및 종합 진단을 지원합니다.</p>
              <button onClick={handleLogin} className="btn-primary">
                더 알아보기 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        {activeSection === 'overview' && (
          <section className="section">
            <div className="container">
              <h3 className="section-title">프로젝트 개요</h3>
              <p className="section-subtitle">
                흉부 AI 진단의 혁신을 이끄는 LaCID
              </p>

              <div className="grid-2 mb-20">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">우리의 미션</h4>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    LaCID는 Lung Anomaly Clinical Intelligence Decision-support의 약자로, 흉부 영상 진단에 특화된 AI 기반 임상 의사결정 지원 시스템을 개발하는 전문 기업입니다.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    우리는 첨단 인공지능 기술을 활용하여 폐 질환의 조기 발견과 정확한 진단을 지원함으로써, 의료진의 진단 정확도를 높이고 환자의 치료 결과를 개선하는 것을 목표로 합니다.
                  </p>
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">98%</span>
                    <span className="stat-label">진단 정확도</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">파트너 병원</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">100K+</span>
                    <span className="stat-label">분석된 영상</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">24/7</span>
                    <span className="stat-label">실시간 지원</span>
                  </div>
                </div>
              </div>

              <div className="grid-4">
                {[
                  { icon: '🎯', title: '정확성', desc: '높은 진단 정확도를 통한 신뢰할 수 있는 의료 지원' },
                  { icon: '⚡', title: '신속성', desc: '빠른 분석으로 골든타임 확보' },
                  { icon: '🔬', title: '혁신성', desc: '지속적인 연구개발을 통한 기술 발전' },
                  { icon: '🤝', title: '협력', desc: '의료진과의 긴밀한 협업' }
                ].map((value, index) => (
                  <div key={index} className="value-card">
                    <div className="value-icon">{value.icon}</div>
                    <h5 className="value-title">{value.title}</h5>
                    <p className="value-desc">{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Team Section */}
        {activeSection === 'team' && (
          <section className="section gray-bg">
            <div className="container">
              <h3 className="section-title">팀원 소개</h3>
              <p className="section-subtitle">전문성과 경험을 갖춘 우리 팀을 소개합니다</p>

              <div className="grid-3">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="team-member"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      console.log('카드 클릭됨!', member.name); // 디버깅
                      e.preventDefault();
                      e.stopPropagation();
                      openMemberModal(member);
                    }}
                  >
                    <div className="member-avatar">{member.initial}</div>
                    <h4 className="member-name">{member.name}</h4>
                    <p className="member-role">{member.role}</p>
                    <p className="member-desc">{member.desc}</p>
                    <div style={{ marginTop: '12px', color: '#2563eb', fontSize: '14px', fontWeight: '500' }}>
                      자세히 보기 →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Technology Section */}
        {activeSection === 'tech' && (
          <section className="section">
            <div className="container">
              <h3 className="section-title">기술 소개</h3>
              <p className="section-subtitle">혁신적인 AI 모델과 첨단 기술을 소개합니다</p>

              <div className="grid-3 mb-16">
                {[
                  { icon: '🫁', title: 'YOLO 기반 흉부 X-ray 분류 모델', desc: '흉부 X-ray 영상에서 폐 결절(nodule)을 자동으로 탐지하고, 위치와 크기를 정밀하게 분석하여 조기 진단을 지원합니다.' },
                  { icon: '🩻', title: 'SSD 기반 흉부 X-ray 분류 모델', desc: '폐렴, 기흉, 폐부종 등 주요 흉부 질환을 X-ray 영상에서 분류하는 딥러닝 모델입니다.' },
                  { icon: '🎯', title: '폐 결절 악성 가능성 예측 모델', desc: '탐지된 결절의 영상 특징과 환자 정보를 분석해 악성 가능성을 예측하고, 조직검사 의뢰 여부 판단을 보조합니다.' },
                  { icon: '📊', title: '임상 검사 기반 머신러닝 분석', desc: '혈액검사 결과(CBC, CEA, CYFRA 등)를 기반으로 XGBoost 등 머신러닝 모델이 폐 질환 위험도를 종합 분석합니다.' },
                  { icon: '🔗', title: 'PACS 연동 시스템', desc: '기존 병원의 PACS와 완벽하게 연동되어 워크플로우 중단 없이 AI 분석 결과를 제공합니다.' },
                  { icon: '⚡', title: 'STT 기반 판독문 자동 생성 기능', desc: '의료진 음성을 자동 인식해 판독문을 실시간으로 작성하고, EMR 시스템에 자동 저장하여 문서화 부담을 줄입니다.' }
                ].map((tech, index) => (
                  <div key={index} className="tech-card">
                    <div className="tech-icon">{tech.icon}</div>
                    <h4 className="tech-title">{tech.title}</h4>
                    <p className="tech-desc">{tech.desc}</p>
                  </div>
                ))}
              </div>

              <div className="tech-features">
                <h4>기술 특장점</h4>
                <div className="features-grid">
                  {[
                    { icon: '🏥', title: '임상 검증', desc: '50개 이상 병원에서 실제 임상 환경에서 검증된 기술' },
                    { icon: '📈', title: '지속적 학습', desc: '새로운 데이터로 모델을 지속적으로 개선' },
                    { icon: '🔒', title: '보안성', desc: '의료정보 보호를 위한 최고 수준의 보안 시스템' },
                    { icon: '🌐', title: '표준 호환', desc: 'DICOM, HL7 등 의료 표준을 완벽 지원' }
                  ].map((feature, index) => (
                    <div key={index} className="feature-item">
                      <div className="feature-icon">{feature.icon}</div>
                      <h5 className="feature-title">{feature.title}</h5>
                      <p className="feature-desc">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>회사 정보</h4>
              <p><strong>LaCID Co., Ltd.</strong></p>
              <div className="contact-item">
                <MapPin className="w-4 h-4" />
                <span>대전시 서구 계롱로 491번길 86</span>
              </div>
              <div className="contact-item">
                <Phone className="w-4 h-4" />
                <span>042-1234-5678</span>
              </div>
              <div className="contact-item">
                <Mail className="w-4 h-4" />
                <span>info@lacid.ai</span>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>연구소</h4>
              <div className="contact-item">
                <MapPin className="w-4 h-4" />
                <span>대전시 서구 계롱로 491번길 86 4층</span>
              </div>
              <div className="contact-item">
                <Phone className="w-4 h-4" />
                <span>042-987-6543</span>
              </div>
              <div className="contact-item">
                <Mail className="w-4 h-4" />
                <span>research@lacid.ai</span>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>사업 분야</h4>
              <ul>
                <li>• 흉부 AI 진단 시스템</li>
                <li>• 의료 영상 분석 솔루션</li>
                <li>• CDSS 플랫폼 개발</li>
                <li>• 의료진 교육 프로그램</li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>인증 및 허가</h4>
              <ul>
                <li className="contact-item">
                  <Award className="w-4 h-4" />
                  <span>의료기기 제조업 허가</span>
                </li>
                <li className="contact-item">
                  <Award className="w-4 h-4" />
                  <span>ISO 13485 인증</span>
                </li>
                <li className="contact-item">
                  <Award className="w-4 h-4" />
                  <span>소프트웨어 의료기기 허가</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 LaCID Co., Ltd. All rights reserved.</p>
            <p>대표이사: 김채윤 | 사업자등록번호: 123-45-67890</p>
          </div>
        </div>
      </footer>

      {/* Team Member Detail Modal */}
      {selectedMember && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={(e) => {
            console.log('모달 배경 클릭됨');
            closeMemberModal();
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '1.5rem',
              padding: '2rem',
              width: '100%',
              maxWidth: '64rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              transform: 'scale(1)',
              transition: 'all 0.3s ease'
            }}
            onClick={(e) => {
              console.log('모달 컨텐츠 클릭됨');
              e.stopPropagation();
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937'
              }}>팀원 상세 정보</h3>
              <button 
                onClick={(e) => {
                  console.log('닫기 버튼 클릭됨');
                  closeMemberModal();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid-2" style={{ gap: '2rem' }}>
              {/* 기본 정보 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div 
                    className="member-avatar" 
                    style={{ 
                      width: '6rem', 
                      height: '6rem', 
                      fontSize: '1.875rem', 
                      margin: '0 auto 1rem' 
                    }}
                  >
                    {selectedMember.initial}
                  </div>
                  <h4 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: '#1f2937', 
                    marginBottom: '0.5rem' 
                  }}>
                    {selectedMember.name}
                  </h4>
                  <p style={{ 
                    color: '#2563eb', 
                    fontWeight: '600', 
                    fontSize: '1.125rem', 
                    marginBottom: '1rem' 
                  }}>
                    {selectedMember.role}
                  </p>
                </div>
                
                <div style={{ 
                  background: '#f9fafb', 
                  borderRadius: '0.5rem', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail className="w-5 h-5" style={{ color: '#6b7280' }} />
                    <span style={{ color: '#374151' }}>{selectedMember.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Phone className="w-5 h-5" style={{ color: '#6b7280' }} />
                    <span style={{ color: '#374151' }}>{selectedMember.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users className="w-5 h-5" style={{ color: '#6b7280' }} />
                    <span style={{ color: '#374151' }}>{selectedMember.department}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Award className="w-5 h-5" style={{ color: '#6b7280' }} />
                    <span style={{ color: '#374151' }}>경력 {selectedMember.experience}</span>
                  </div>
                </div>
                
                <div>
                  <h5 style={{ 
                    fontWeight: '600', 
                    color: '#1f2937', 
                    marginBottom: '0.5rem' 
                  }}>
                    학력
                  </h5>
                  <p style={{ color: '#6b7280' }}>{selectedMember.education}</p>
                </div>
                
                <div>
                  <h5 style={{ 
                    fontWeight: '600', 
                    color: '#1f2937', 
                    marginBottom: '0.75rem' 
                  }}>
                    기술 스택
                  </h5>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem' 
                  }}>
                    {selectedMember.skills.map((skill, index) => (
                      <span 
                        key={index}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 상세 정보 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h5 style={{ 
                    fontWeight: '600', 
                    color: '#1f2937', 
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🎯</span>
                    주요 목표
                  </h5>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedMember.goals.map((goal, index) => (
                      <li key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.5rem' 
                      }}>
                        <span style={{ color: '#2563eb', marginTop: '0.25rem' }}>•</span>
                        <span style={{ color: '#374151' }}>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 style={{ 
                    fontWeight: '600', 
                    color: '#1f2937', 
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>💼</span>
                    수행 역할
                  </h5>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedMember.responsibilities.map((responsibility, index) => (
                      <li key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.5rem' 
                      }}>
                        <span style={{ color: '#059669', marginTop: '0.25rem' }}>•</span>
                        <span style={{ color: '#374151' }}>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 style={{ 
                    fontWeight: '600', 
                    color: '#1f2937', 
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🏆</span>
                    주요 성과
                  </h5>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedMember.achievements.map((achievement, index) => (
                      <li key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.5rem' 
                      }}>
                        <span style={{ color: '#d97706', marginTop: '0.25rem' }}>•</span>
                        <span style={{ color: '#374151' }}>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default LaCIDPage;