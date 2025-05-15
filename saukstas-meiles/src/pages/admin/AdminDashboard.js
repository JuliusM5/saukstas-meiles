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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
        // Show notification
        setNotification({
          title: 'Klaida',
          message: 'Nepavyko įkelti duomenų.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Klaida įkeliant duomenis. Bandykite vėliau.');
      
      // Show notification
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant duomenis. Bandykite vėliau.',
        type: 'error'
      });
      
      // Use mock data as fallback
      provideMockData();
    } finally {
      setLoading(false);
    }
  };

  const provideMockData = () => {
    // Mock data for development
    setStats({
      recipes: 5,
      comments: 3,
      media: 12
    });
    
    setRecentRecipes([
      {
        id: 'sample-recipe-1',
        title: 'Bulvių košė su grietine',
        categories: ['Daržovės', 'Bulvės'],
        created_at: new Date().toISOString()
      },
      {
        id: 'sample-recipe-2',
        title: 'Lietuviški cepelinai',
        categories: ['Bulvės', 'Mėsa', 'Iš močiutės virtuvės'],
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'sample-recipe-3',
        title: 'Šaltibarščiai',
        categories: ['Sriubos', 'Iš močiutės virtuvės'],
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ]);
    
    setRecentComments([
      {
        id: 'sample-comment-1',
        author: 'Jonas Petraitis',
        content: 'Labai skanus receptas, ačiū!',
        recipe_title: 'Bulvių košė su grietine',
        created_at: new Date().toISOString()
      },
      {
        id: 'sample-comment-2',
        author: 'Ona Kazlauskienė',
        content: 'Išbandžiau šį receptą vakar, visiems labai patiko!',
        recipe_title: 'Lietuviški cepelinai',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return dateString;
    }
  };

  // Handler for deleting items
  const handleDelete = async (id, type) => {
    if (!window.confirm(`Ar tikrai norite ištrinti šį elementą? Šio veiksmo nebus galima atšaukti.`)) {
      return;
    }
    
    try {
      let endpoint = '';
      
      switch (type) {
        case 'recipe':
          endpoint = `/admin/recipes/${id}`;
          break;
        case 'comment':
          endpoint = `/admin/comments/${id}`;
          break;
        default:
          throw new Error('Unknown item type');
      }
      
      const response = await api.delete(endpoint);
      
      if (response.data.success) {
        // Show success notification
        setNotification({
          title: 'Sėkmė',
          message: 'Elementas sėkmingai ištrintas.',
          type: 'success'
        });
        
        // Refresh data
        fetchDashboardData();
      } else {
        // Show error notification
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida trinant elementą.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      
      // Show error notification
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
        <AdminWidgets stats={stats} />
        
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Naujausi receptai</h2>
            <Link to="/admin/recipes" className="view-all">Visi receptai</Link>
          </div>
          
          {loading ? (
            <div className="loading">Įkeliama...</div>
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
                  recentRecipes.map(recipe => (
                    <tr key={recipe.id}>
                      <td>{recipe.title || 'Nepavadintas'}</td>
                      <td>{recipe.categories && recipe.categories.length ? recipe.categories.join(', ') : '-'}</td>
                      <td>{formatDate(recipe.created_at) || '-'}</td>
                      <td>
                        <div className="action-buttons">
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
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Autorius</th>
                  <th>Komentaras</th>
                  <th>Receptas</th>
                  <th>Data</th>
                  <th>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {recentComments.length > 0 ? (
                  recentComments.map(comment => (
                    <tr key={comment.id}>
                      <td>{comment.author || 'Anonimas'}</td>
                      <td>{comment.content ? comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '') : '-'}</td>
                      <td>{comment.recipe_title || '-'}</td>
                      <td>{formatDate(comment.created_at) || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            type="button" 
                            className="action-btn view-btn"
                            title="Peržiūrėti"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            type="button" 
                            className="action-btn delete-btn"
                            title="Ištrinti"
                            onClick={() => handleDelete(comment.id, 'comment')}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>Nėra komentarų</td>
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