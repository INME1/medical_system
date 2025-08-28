// NotificationBar.jsx
import React from 'react';

function NotificationBar({ message }) {
  if (!message) return null;
  
  return (
    <div className="medisys-notification">
      {message}
    </div>
  );
}

export default NotificationBar;