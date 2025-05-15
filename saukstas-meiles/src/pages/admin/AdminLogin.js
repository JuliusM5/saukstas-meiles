import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin/AdminLogin.css';

const AdminLogin = () => {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/admin" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Prašome įvesti vartotojo vardą ir slaptažodį.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Prisijungimo klaida. Patikrinkite duomenis ir bandykite dar kartą.');
      }
    } catch (error) {
      setError('Prisijungimo klaida. Bandykite vėliau.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1 className="login-title">Šaukštas Meilės</h1>
          <p className="login-subtitle">Administratoriaus prisijungimas</p>
        </div>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <form id="login-form" className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Vartotojo vardas</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control" 
              required 
              disabled={loading}
              autoComplete="username"
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
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Jungiamasi...' : 'Prisijungti'}
            </button>
          </div>
          <div className="form-footer">
            <p>Šaukštas Meilės Admin Panel &copy; {new Date().getFullYear()}</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;