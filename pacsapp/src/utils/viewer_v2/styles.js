// 인라인 스타일 정의 및 동적 스타일 생성 유틸리티

import { COLORS, AI_MODELS } from './constants';

/**
 * 기본 스타일 객체들
 */
export const baseStyles = {
  // 레이아웃
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  flexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  
  fullSize: {
    width: '100%',
    height: '100%'
  },
  
  // 기본 컨테이너
  container: {
    backgroundColor: COLORS.SURFACE,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '4px',
    padding: '16px'
  },
  
  // 카드 스타일
  card: {
    backgroundColor: '#374151',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '8px',
    transition: 'background-color 0.2s'
  },
  
  cardHover: {
    backgroundColor: '#4b5563'
  },
  
  // 텍스트 스타일
  textPrimary: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    fontWeight: '500'
  },
  
  textSecondary: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: '12px'
  },
  
  textMuted: {
    color: COLORS.TEXT_MUTED,
    fontSize: '10px'
  },
  
  // 버튼 베이스
  buttonBase: {
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px'
  }
};

/**
 * AI 모델별 스타일 생성
 */
export const getAIModelStyles = (modelId) => {
  const model = AI_MODELS[modelId.toUpperCase()];
  if (!model) return {};
  
  return {
    color: model.color,
    borderColor: model.color,
    backgroundColor: `${model.color}20`, // 20% 투명도
    
    // 호버 스타일
    hover: {
      backgroundColor: `${model.color}30`
    },
    
    // 활성 스타일
    active: {
      backgroundColor: model.color,
      color: '#ffffff'
    }
  };
};

/**
 * 신뢰도 기반 스타일 생성
 */
export const getConfidenceStyles = (confidence) => {
  let color = COLORS.TEXT_MUTED;
  let backgroundColor = 'transparent';
  
  if (confidence >= 90) {
    color = '#22c55e';
    backgroundColor = 'rgba(34, 197, 94, 0.1)';
  } else if (confidence >= 70) {
    color = '#f59e0b';
    backgroundColor = 'rgba(245, 158, 11, 0.1)';
  } else if (confidence >= 50) {
    color = '#ef4444';
    backgroundColor = 'rgba(239, 68, 68, 0.1)';
  }
  
  return {
    color,
    backgroundColor,
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500'
  };
};

/**
 * 측정값 타입별 스타일
 */
export const getMeasurementTypeStyles = (type) => {
  const styles = {
    length: {
      icon: '📏',
      color: '#60a5fa',
      backgroundColor: 'rgba(96, 165, 250, 0.1)'
    },
    rectangle: {
      icon: '📐',
      color: '#34d399',
      backgroundColor: 'rgba(52, 211, 153, 0.1)'
    },
    circle: {
      icon: '⭕',
      color: '#fbbf24',
      backgroundColor: 'rgba(251, 191, 36, 0.1)'
    },
    angle: {
      icon: '📐',
      color: '#a78bfa',
      backgroundColor: 'rgba(167, 139, 250, 0.1)'
    }
  };
  
  return styles[type] || styles.length;
};

/**
 * 상태별 스타일
 */
export const getStatusStyles = (status) => {
  const statusMap = {
    completed: {
      color: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      text: '완료'
    },
    draft: {
      color: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      text: '임시저장'
    },
    pending: {
      color: '#64748b',
      backgroundColor: 'rgba(100, 116, 139, 0.1)',
      text: '대기중'
    },
    error: {
      color: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      text: '오류'
    }
  };
  
  return statusMap[status] || statusMap.pending;
};

/**
 * 도구별 커서 스타일
 */
export const getToolCursorStyle = (toolId) => {
  const cursors = {
    wwwc: 'ew-resize',
    zoom: 'zoom-in',
    pan: 'move',
    length: 'crosshair',
    rectangle: 'crosshair',
    circle: 'crosshair',
    angle: 'crosshair',
    rotate: 'grab',
    default: 'default'
  };
  
  return { cursor: cursors[toolId] || cursors.default };
};

/**
 * 애니메이션 스타일
 */
export const animations = {
  fadeIn: {
    animation: 'fadeIn 0.2s ease-out',
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 }
    }
  },
  
  slideInRight: {
    animation: 'slideInRight 0.3s ease-out',
    '@keyframes slideInRight': {
      from: { 
        transform: 'translateX(100%)',
        opacity: 0 
      },
      to: { 
        transform: 'translateX(0)',
        opacity: 1 
      }
    }
  },
  
  slideInLeft: {
    animation: 'slideInLeft 0.3s ease-out',
    '@keyframes slideInLeft': {
      from: { 
        transform: 'translateX(-100%)',
        opacity: 0 
      },
      to: { 
        transform: 'translateX(0)',
        opacity: 1 
      }
    }
  },
  
  fadeInUp: {
    animation: 'fadeInUp 0.2s ease-out',
    '@keyframes fadeInUp': {
      from: {
        opacity: 0,
        transform: 'translateY(8px)'
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)'
      }
    }
  },
  
  spin: {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    }
  },
  
  pulse: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 }
    }
  }
};

/**
 * 반응형 스타일
 */
export const responsive = {
  mobile: '@media (max-width: 768px)',
  tablet: '@media (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)',
  
  // 모바일 스타일
  mobileStyles: {
    fontSize: '12px',
    padding: '8px',
    margin: '4px'
  },
  
  // 태블릿 스타일
  tabletStyles: {
    fontSize: '13px',
    padding: '10px',
    margin: '6px'
  },
  
  // 데스크톱 스타일
  desktopStyles: {
    fontSize: '14px',
    padding: '12px',
    margin: '8px'
  }
};

/**
 * 스크롤바 스타일
 */
export const scrollbarStyles = {
  thin: {
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&::-webkit-scrollbar-track': {
      background: '#334155'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#64748b',
      borderRadius: '3px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#94a3b8'
    }
  },
  
  hidden: {
    '&::-webkit-scrollbar': {
      display: 'none'
    },
    msOverflowStyle: 'none',
    scrollbarWidth: 'none'
  }
};

/**
 * 그라데이션 스타일
 */
export const gradients = {
  primary: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  
  success: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
  },
  
  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  
  danger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  
  dark: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  }
};

/**
 * 그림자 스타일
 */
export const shadows = {
  small: {
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  
  medium: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  
  large: {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  
  modal: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};

/**
 * 포커스 스타일
 */
export const focusStyles = {
  default: {
    outline: '2px solid #60a5fa',
    outlineOffset: '2px'
  },
  
  ring: {
    boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.5)'
  },
  
  none: {
    outline: 'none'
  }
};

/**
 * 스타일 조합 헬퍼
 */
export const combineStyles = (...styles) => {
  return Object.assign({}, ...styles);
};

/**
 * 조건부 스타일 적용
 */
export const conditionalStyle = (condition, trueStyle, falseStyle = {}) => {
  return condition ? trueStyle : falseStyle;
};

/**
 * 테마 변환 헬퍼
 */
export const createThemeVariables = (theme) => {
  const cssVariables = {};
  
  Object.entries(theme).forEach(([key, value]) => {
    cssVariables[`--${key}`] = value;
  });
  
  return cssVariables;
};

/**
 * 다크모드 스타일
 */
export const darkTheme = {
  background: COLORS.BACKGROUND,
  surface: COLORS.SURFACE,
  border: COLORS.BORDER,
  textPrimary: COLORS.TEXT_PRIMARY,
  textSecondary: COLORS.TEXT_SECONDARY,
  textMuted: COLORS.TEXT_MUTED,
  primary: COLORS.PRIMARY,
  success: COLORS.SUCCESS,
  warning: COLORS.WARNING,
  danger: COLORS.DANGER
};

/**
 * 라이트모드 스타일 (미래 확장용)
 */
export const lightTheme = {
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444'
};