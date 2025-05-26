import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminComments.css';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchComments();
  }, [activeTab]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/comments', {
        params: { status: activeTab === 'all' ? null : activeTab }
      });
      
      if (response.data.success) {
        setComments(response.data.data);
      } else {
        setError('Nepavyko įkelti komentarų.');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Klaida įkeliant komentarus. Bandykite vėliau.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recipeId, commentId) => {
    try {
      const response = await api.put(`/admin/recipes/${recipeId}/comments/${commentId}`, {
        status: 'approved'
      });
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Komentaras patvirtintas.',
          type: 'success'
        });
        fetchComments();
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida tvirtinant komentarą.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error approving comment:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida tvirtinant komentarą. Bandykite vėliau.',
        type: 'error'
      });
    }
  };

  const handleDelete = async (recipeId, commentId) => {
    if (!window.confirm('Ar tikrai norite ištrinti šį komentarą?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/admin/recipes/${recipeId}/comments/${commentId}`);
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Komentaras ištrintas.',
          type: 'success'
        });
        fetchComments();
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida trinant komentarą.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida trinant komentarą. Bandykite vėliau.',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div id="admin-comments">
      <AdminHeader activePage="comments" />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Komentarai</h2>
        </div>
        
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Visi
          </div>
          <div 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Laukiantys patvirtinimo
          </div>
          <div 
            className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Patvirtinti
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Įkeliama...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            <p>Komentarų nerasta.</p>
          </div>
        ) : (
          <div className="comments-admin-list">
            {comments.map(comment => (
              <div key={`${comment.recipeId}-${comment.id}`} className="comment-admin-item">
                <div className="comment-admin-header">
                  <div className="comment-admin-author">
                    <strong>{comment.author}</strong> 
                    <span className="comment-admin-email">({comment.email})</span>
                  </div>
                  <div className="comment-admin-date">{formatDate(comment.created_at)}</div>
                </div>
                
                <div className="comment-admin-recipe">
                  Receptas: <strong>{comment.recipeTitle || 'Nežinomas'}</strong>
                </div>
                
                <div className="comment-admin-content">
                  {comment.content}
                </div>
                
                <div className="comment-admin-footer">
                  <div className={`comment-status ${comment.status}`}>
                    {comment.status === 'pending' ? 'Laukia patvirtinimo' : 'Patvirtintas'}
                  </div>
                  
                  <div className="comment-admin-actions">
                    {comment.status === 'pending' && (
                      <button 
                        className="action-btn approve-btn"
                        onClick={() => handleApprove(comment.recipeId, comment.id)}
                        title="Patvirtinti"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(comment.recipeId, comment.id)}
                      title="Ištrinti"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

export default AdminComments;