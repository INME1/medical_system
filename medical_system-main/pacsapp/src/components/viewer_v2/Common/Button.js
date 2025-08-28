import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'medium', 
  disabled = false, 
  className = '',
  icon: Icon,
  iconSize = 16,
  ...props 
}) => {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`mv-btn mv-btn-${variant} mv-btn-${size} ${disabled ? 'mv-btn-disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={iconSize} className="mv-btn-icon" />}
      {children}
    </button>
  );
};

export default Button;