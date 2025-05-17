import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminNewsletter.css';

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // State for manual newsletter form
  const [showSendForm, setShowSendForm] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/newsletter/subscribers');
      
      if (response.data.success) {
        setSubscribers(response.data.data);
      } else {
        setError('Nepavyko įkelti prenumeratorių sąrašo.');
        setNotification({
          title: 'Klaida',
          message: 'Nepavyko įkelti prenumeratorių sąrašo.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setError('Klaida įkeliant prenumeratorių sąrašą. Bandykite vėliau.');
      
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant prenumeratorių sąrašą. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscriber = async (email) => {
    if (!window.confirm(`Ar tikrai norite pašalinti prenumeratorių ${email}?`)) {
      return;
    }
    
    try {
      const response = await api.delete(`/admin/newsletter/subscribers/${encodeURIComponent(email)}`);
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Prenumeratorius sėkmingai pašalintas.',
          type: 'success'
        });
        
        // Refresh subscribers list
        fetchSubscribers();
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida šalinant prenumeratorių.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida šalinant prenumeratorių. Bandykite vėliau.',
        type: 'error'
      });
    }
  };

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    
    if (!newsletterSubject || !newsletterContent) {
      setNotification({
        title: 'Klaida',
        message: 'Prašome užpildyti visus laukus.',
        type: 'error'
      });
      return;
    }
    
    try {
      setSendingNewsletter(true);
      
      const response = await api.post('/admin/newsletter/send', {
        subject: newsletterSubject,
        content: newsletterContent
      });
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: response.data.message || 'Naujienlaiškis sėkmingai išsiųstas.',
          type: 'success'
        });
        
        // Reset form
        setNewsletterSubject('');
        setNewsletterContent('');
        setShowSendForm(false);
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida siunčiant naujienlaiškį.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida siunčiant naujienlaiškį. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setSendingNewsletter(false);
    }
  };

  return (
    <div id="admin-newsletter">
      <AdminHeader activePage="newsletter" />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Naujienlaiškio prenumeratoriai</h2>
        </div>
        
        <div className="admin-section">
          {loading ? (
            <div className="loading">Įkeliama...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="subscribers-count">
                Iš viso prenumeratorių: <strong>{subscribers.length}</strong>
              </div>
              
              {subscribers.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>El. paštas</th>
                      <th>Veiksmai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((email, index) => (
                      <tr key={index}>
                        <td>{email}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              type="button" 
                              className="action-btn delete-btn"
                              title="Ištrinti"
                              onClick={() => handleDeleteSubscriber(email)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-subscribers">
                  Nėra naujienlaiškio prenumeratorių.
                </div>
              )}
            </>
          )}
        </div>

        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Siųsti naujienlaiškį</h2>
            <button 
              className="submit-button"
              onClick={() => setShowSendForm(!showSendForm)}
            >
              {showSendForm ? 'Atšaukti' : 'Naujas naujienlaiškis'}
            </button>
          </div>
          
          {showSendForm && (
            <form onSubmit={handleSendNewsletter} className="newsletter-form">
              <div className="form-group">
                <label htmlFor="newsletter-subject">Tema</label>
                <input
                  type="text"
                  id="newsletter-subject"
                  className="form-control"
                  value={newsletterSubject}
                  onChange={(e) => setNewsletterSubject(e.target.value)}
                  required
                  disabled={sendingNewsletter}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newsletter-content">Turinys (HTML)</label>
                <textarea
                  id="newsletter-content"
                  className="form-control"
                  rows="10"
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  required
                  disabled={sendingNewsletter}
                ></textarea>
                <small className="form-text">Galite naudoti HTML žymes formatavimui.</small>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={sendingNewsletter || subscribers.length === 0}
                >
                  {sendingNewsletter ? 'Siunčiama...' : 'Siųsti naujienlaiškį'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowSendForm(false)}
                  disabled={sendingNewsletter}
                >
                  Atšaukti
                </button>
              </div>
              
              {subscribers.length === 0 && (
                <div className="newsletter-warning">
                  <p>Nėra prenumeratorių, kuriems būtų galima išsiųsti naujienlaiškį.</p>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
      
      {notification && (
        <Notification 
          title={notification.title} 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AdminNewsletter;