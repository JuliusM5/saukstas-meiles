import { useEffect } from 'react';

const SecurityHeaders = () => {
  useEffect(() => {
    // Prevent clickjacking
    if (window.top !== window.self) {
      window.top.location = window.self.location;
    }
    
    // Disable right-click on admin pages (optional)
    if (window.location.pathname.includes('/admin')) {
      const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
      };
      
      document.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);
  
  return null;
};

export default SecurityHeaders;