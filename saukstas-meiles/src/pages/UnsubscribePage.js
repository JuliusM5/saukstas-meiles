import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/UnsubscribePage.css';

const UnsubscribePage = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  
  // Get the email from the URL query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  useEffect(() => {
    const emailParam = queryParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
      handleUnsubscribe(emailParam);
    } else {
      setStatus('manual');
    }
  }, [queryParams]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleUnsubscribe = async (emailToUnsubscribe) => {
    try {
      setStatus('loading');
      
      const response = await api.get('/api/newsletter/unsubscribe', {
        params: { email: emailToUnsubscribe }
      });
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Sėkmingai atsisakėte naujienlaiškio prenumeratos.');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Klaida atsisakant naujienlaiškio prenumeratos.');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setStatus('error');
      setMessage('Klaida atsisakant naujienlaiškio prenumeratos. Bandykite vėliau.');
    }
  };
  
  const handleManualUnsubscribe = (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Prašome įvesti el. pašto adresą.');
      return;
    }
    
    handleUnsubscribe(email);
  };
  
  return (
    <div className="unsubscribe-container">
      <h1 className="unsubscribe-title">Atsisakyti naujienlaiškio</h1>
      
      {status === 'loading' && (
        <div className="unsubscribe-loading">
          <div className="loading-spinner"></div>
          <p>Tvarkome jūsų prašymą...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="unsubscribe-success">
          <i className="fas fa-check-circle success-icon"></i>
          <p className="success-message">{message}</p>
          <p>Jei ateityje vėl norėsite gauti naujienlaiškį, galite bet kada užsiprenumeruoti iš naujo.</p>
          <a href="/" className="return-home">Grįžti į pagrindinį puslapį</a>
        </div>
      )}
      
      {status === 'error' && (
        <div className="unsubscribe-error">
          <i className="fas fa-exclamation-circle error-icon"></i>
          <p className="error-message">{message}</p>
          <a href="/" className="return-home">Grįžti į pagrindinį puslapį</a>
        </div>
      )}
      
      {status === 'manual' && (
        <div className="unsubscribe-manual">
          <p>Įveskite savo el. pašto adresą, kuriuo nebepageidaujate gauti naujienlaiškių:</p>
          
          <form onSubmit={handleManualUnsubscribe} className="unsubscribe-form">
            <div className="form-group">
              <input 
                type="email" 
                className="form-control" 
                placeholder="El. paštas" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="unsubscribe-button">Atsisakyti prenumeratos</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UnsubscribePage;