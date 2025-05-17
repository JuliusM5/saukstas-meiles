
import React, { useState } from 'react';
import { api } from '../utils/api';
import '../styles/NewsletterSubscription.css';

const NewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Prašome įvesti el. pašto adresą.');
      setMessageType('error');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Prašome įvesti teisingą el. pašto adresą.');
      setMessageType('error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Send the subscription request to the API
      const response = await api.post('/api/newsletter/subscribe', { email });
      
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');
        setEmail('');
      } else {
        setMessage(response.data.error || 'Klaida išsaugant prenumeratą. Bandykite vėliau.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      setMessage('Klaida išsaugant prenumeratą. Bandykite vėliau.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  };

  return (
    <div className="newsletter-subscription">
      <div className="newsletter-icon">
        <i className="fas fa-envelope"></i>
      </div>
      <div className="newsletter-content">
        <h4>Gaukite naujausius receptus</h4>
        <p>Užsiprenumeruokite ir gaukite naujausius receptus, kulinarinius patarimus ir sezoninius įkvėpimus tiesiai į savo pašto dėžutę!</p>
        
        {message && (
          <div className={`newsletter-message ${messageType}`}>
            {message}
          </div>
        )}
        
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <div className="form-input-group">
            <input 
              type="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="newsletter-input" 
              placeholder="Jūsų el. paštas" 
              disabled={isSubmitting}
              required 
            />
            <button 
              type="submit" 
              className="newsletter-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Siunčiama...' : 'Prenumeruoti'}
            </button>
          </div>
          <div className="newsletter-privacy">
            <small>Mes gerbiame jūsų privatumą. Jūsų duomenimis niekada nesidalinsime su trečiosiomis šalimis.</small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSubscription;