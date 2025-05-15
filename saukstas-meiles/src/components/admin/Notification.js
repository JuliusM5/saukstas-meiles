import React, { useEffect } from 'react';
import '../../styles/admin/Notification.css';

const Notification = ({ title, message, type = 'success', onClose, autoHide = true }) => {
  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, onClose]);

  return (
    <div className={`notification notification-${type} show`}>
      <div className="notification-icon">
        {type === 'success' ? (
          <i className="fas fa-check-circle"></i>
        ) : type === 'error' ? (
          <i className="fas fa-exclamation-circle"></i>
        ) : (
          <i className="fas fa-info-circle"></i>
        )}
      </div>
      
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        <div className="notification-message">{message}</div>
      </div>
      
      <button 
        type="button" 
        className="notification-close"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Notification;
