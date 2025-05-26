// src/pages/admin/AdminSetup.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin/AdminLogin.css';

const AdminSetup = () => {
  const { createAdminUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password || !confirmPassword) {
      setError('Prašome užpildyti visus laukus.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Slaptažodžiai nesutampa.');
      return;
    }
    
    if (password.length < 6) {
      setError('Slaptažodis turi būti bent 6 simbolių ilgio.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await createAdminUser(email, password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } else {
        setError(result.error || 'Klaida kuriant administratorių.');
      }
    } catch (error) {
      setError('Klaida kuriant administratorių. Bandykite vėliau.');
      console.error('Setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1 className="login-title">Šaukštas Meilės</h1>
          <p className="login-subtitle">Administratoriaus sukūrimas</p>
        </div>
        
        {success && (
          <div className="login-success" style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            Administratorius sėkmingai sukurtas! Nukreipiame į prisijungimą...
          </div>
        )}
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">El. paštas</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control" 
              required 
              disabled={loading}
              placeholder="admin@saukstas-meiles.lt"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Slaptažodis</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control" 
              required 
              disabled={loading}
              placeholder="Mažiausiai 6 simboliai"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Pakartokite slaptažodį</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control" 
              required 
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || success}
            >
              {loading ? 'Kuriama...' : 'Sukurti administratorių'}
            </button>
          </div>
          
          <div className="form-footer">
            <p>Šis puslapis skirtas tik pradiniam nustatymui.</p>
            <p>Po sukūrimo, prisijunkite per <a href="/admin/login">prisijungimo puslapį</a>.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;