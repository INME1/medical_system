import React from 'react';

const Navigation = ({ currentPage, onPageChange }) => {
  const navStyle = {
    backgroundColor: '#2c3e50',
    padding: '1rem 0',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px'
  };

  const logoStyle = {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'color 0.3s'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const linkStyle = {
    color: '#ecf0f1',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    textDecoration: 'none'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: '#34495e',
    color: '#fff',
    fontWeight: 'bold'
  };

  const hoverStyle = {
    backgroundColor: '#34495e'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <div 
          style={logoStyle}
          onClick={() => onPageChange('request')}
          onMouseEnter={(e) => e.target.style.color = '#5ACEFF'}
          onMouseLeave={(e) => e.target.style.color = '#fff'}
          title="홈으로 이동"
        >
          RIS System
        </div>
        
        <ul style={navLinksStyle}>
          <li>
            <button
              style={currentPage === 'request' ? activeLinkStyle : linkStyle}
              onClick={() => onPageChange('request')}
              onMouseEnter={(e) => {
                if (currentPage !== 'request') {
                  e.target.style.backgroundColor = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'request') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              영상 검사 요청
            </button>
          </li>
          <li>
            <button
              style={currentPage === 'results' ? activeLinkStyle : linkStyle}
              onClick={() => onPageChange('results')}
              onMouseEnter={(e) => {
                if (currentPage !== 'results') {
                  e.target.style.backgroundColor = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'results') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              work list
            </button>
          </li>
          <li>
            <button
              style={currentPage === 'schedule' ? activeLinkStyle : linkStyle}
              onClick={() => onPageChange('schedule')}
              onMouseEnter={(e) => {
                if (currentPage !== 'schedule') {
                  e.target.style.backgroundColor = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'schedule') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              일정 관리
            </button>
          </li>
          <li>
            <button
              style={currentPage === 'settings' ? activeLinkStyle : linkStyle}
              onClick={() => onPageChange('settings')}
              onMouseEnter={(e) => {
                if (currentPage !== 'settings') {
                  e.target.style.backgroundColor = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'settings') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              설정
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;