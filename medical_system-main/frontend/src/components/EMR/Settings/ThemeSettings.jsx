// src/components/EMR/Settings/ThemeSettings.jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();

  const handleChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <section style={{ marginBottom: '2rem', paddingLeft: '50px' }}>
      <h3>◉ 테마 설정</h3>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="radio"
          name="theme"
          value="light"
          checked={theme === 'light'}
          onChange={handleChange}
        />
        {' '}라이트 모드
      </label>
    </section>
  );
};

export default ThemeSettings;