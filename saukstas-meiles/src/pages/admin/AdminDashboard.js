import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminWidgets from '../../components/admin/AdminWidgets';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    recipes: 0,
    comments: 0,
    media: 0
  });
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const rebuildCategories = async () => {
    try {
      setLoading(true);
      
      // Simply re-fetch the dashboard data which will update category counts
      await fetchDashboardData();
      
      setNotification({
        title: 'Sėkmė',
        message: 'Duomenys sėkmingai atnaujinti.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error rebuilding categories:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida atnaujinant duomenis. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the correct endpoint
      const response = await api.get('/admin/dashboard/stats');
      
      if (response.data.success) {
        const data = response.data.data;
        
        setStats({
          recipes: data.recipes?.total || 0,
          comments: data.comments?.total || 0,
          media: data.media?.total || 0
        });
        
        setRecentRecipes(data.recent_recipes || []);
        setRecentComments(data.recent_comments || []);
      } else {
        setError('Nepavyko įkelti duomenų.');
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Nepavyko įkelti duomenų.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Klaida įkeliant duomenis. Bandykite vėliau.');
      
      // Set default values to avoid crashes
      setStats({
        recipes: 0,
        comments: 0,
        media: 0
      });
      setRecentRecipes([]);
      setRecentComments([]);
      
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant duomenis. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
  };

  const handleDelete = async (id, type) => {
    if (!id) {
      setNotification({
        title: 'Klaida',
        message: 'Nerastas elemento ID.',
        type: 'error'
      });
      return;
    }
    
    if (!window.confirm(`Ar tikrai norite ištrinti šį elementą? Šio veiksmo nebus galima atšaukti.`)) {
      return;
    }
    
    try {
      let response;
      
      if (type === 'recipe') {
        response = await api.delete(`/admin/recipes/${id}`);
      } else {
        setNotification({
          title: 'Klaida',
          message: 'Nežinomas elemento tipas.',
          type: 'error'
        });
        return;
      }
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Elementas sėkmingai ištrintas.',
          type: 'success'
        });
        
        fetchDashboardData();
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida trinant elementą.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida trinant elementą. Bandykite vėliau.',
        type: 'error'
      });
    }
  };

  return (
    <div id="admin-dashboard">
      <AdminHeader activePage="dashboard" />
      
      <main className="admin-main container">
        <div className="admin-section-header" style={{ marginBottom: '20px' }}>
          <h2 className="admin-section-title">Administravimo panelė</h2>
          <button 
            onClick={rebuildCategories} 
            className="submit-button"
            disabled={loading}
          >
            Atnaujinti duomenis
          </button>
        </div>
      
        <AdminWidgets stats={stats} />
        
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Naujausi receptai</h2>
            <Link to="/admin/recipes" className="view-all">Visi receptai</Link>
          </div>
          
          {loading ? (
            <div className="loading">Įkeliama...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pavadinimas</th>
                  <th>Kategorija</th>
                  <th>Data</th>
                  <th>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {recentRecipes.length > 0 ? (
                  recentRecipes.map((recipe, index) => (
                    <tr key={recipe.id || `recipe-${index}`}>
                      <td>{recipe.title || 'Nepavadintas'}</td>
                      <td>{recipe.categories && recipe.categories.length ? recipe.categories.join(', ') : '-'}</td>
                      <td>{formatDate(recipe.created_at) || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          {recipe.id ? (
                            <>
                              <Link 
                                to={`/admin/recipes/edit/${recipe.id}`} 
                                className="action-btn edit-btn"
                                title="Redaguoti"
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                              <button 
                                type="button" 
                                className="action-btn delete-btn"
                                title="Ištrinti"
                                onClick={() => handleDelete(recipe.id, 'recipe')}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>Nėra receptų</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Naujausi komentarai</h2>
            <Link to="/admin/comments" className="view-all">Visi komentarai</Link>
          </div>
          
          {loading ? (
            <div className="loading">Įkeliama...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Autorius</th>
                  <th>Komentaras</th>
                  <th>Receptas</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recentComments.length > 0 ? (
                  recentComments.map((comment, index) => (
                    <tr key={comment.id || `comment-${index}`}>
                      <td>{comment.author || 'Anonimas'}</td>
                      <td>{comment.content ? comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '') : '-'}</td>
                      <td>{comment.recipe_title || comment.recipeTitle || '-'}</td>
                      <td>{formatDate(comment.created_at) || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>Nėra komentarų</td>
                  </tr>
                )}
              </tbody>
            </table>
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

export default AdminDashboard;