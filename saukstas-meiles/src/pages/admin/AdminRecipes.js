import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminRecipes.css';

const AdminRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRecipes(currentPage, activeTab);
  }, [currentPage, activeTab]);

  const fetchRecipes = async (page, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/recipes', {
        params: { page, status }
      });
      
      if (response.data.success) {
        setRecipes(response.data.data);
        setTotalPages(response.data.meta?.pages || 1);
      } else {
        setError('Nepavyko įkelti receptų.');
        // Show notification
        setNotification({
          title: 'Klaida',
          message: 'Nepavyko įkelti receptų.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Klaida įkeliant receptus. Bandykite vėliau.');
      
      // Show notification
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant receptus. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ar tikrai norite ištrinti šį receptą? Šio veiksmo nebus galima atšaukti.')) {
      return;
    }
    
    try {
      const response = await api.delete(`/admin/recipes/${id}`);
      
      if (response.data.success) {
        // Show success notification
        setNotification({
          title: 'Sėkmė',
          message: 'Receptas sėkmingai ištrintas.',
          type: 'success'
        });
        
        // Refresh recipes
        fetchRecipes(currentPage, activeTab);
      } else {
        // Show error notification
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida trinant receptą.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      
      // Show error notification
      setNotification({
        title: 'Klaida',
        message: 'Klaida trinant receptą. Bandykite vėliau.',
        type: 'error'
      });
    }
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

  return (
    <div id="admin-recipes">
      <AdminHeader activePage="recipes" />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Receptai</h2>
          <Link to="/admin/recipes/add" className="submit-button">Pridėti naują</Link>
        </div>
        
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            Visi
          </div>
          <div 
            className={`tab ${activeTab === 'published' ? 'active' : ''}`}
            onClick={() => handleTabChange('published')}
          >
            Publikuoti
          </div>
          <div 
            className={`tab ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => handleTabChange('draft')}
          >
            Juodraščiai
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Įkeliama...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pavadinimas</th>
                  <th>Kategorija</th>
                  <th>Data</th>
                  <th>Statusas</th>
                  <th>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {recipes.length > 0 ? (
                  recipes.map(recipe => (
                    <tr key={recipe.id}>
                      <td>{recipe.title || 'Nepavadintas'}</td>
                      <td>{recipe.categories && recipe.categories.length ? recipe.categories.join(', ') : '-'}</td>
                      <td>{formatDate(recipe.created_at) || '-'}</td>
                      <td>{recipe.status === 'published' ? 'Publikuotas' : 'Juodraštis'}</td>
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
                            onClick={() => handleDelete(recipe.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>Receptų nerasta</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className={`pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    className={`pagination-item ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button 
                  className={`pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
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

export default AdminRecipes;