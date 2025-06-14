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
        // Ensure all comments have required fields
        const validatedComments = response.data.data.map(comment => ({
          id: comment.id || '',
          recipeId: comment.recipeId || '',
          recipeTitle: comment.recipeTitle || 'Nežinomas receptas',
          author: comment.author || 'Anonimas',
          email: comment.email || '',
          content: comment.content || '',
          created_at: comment.created_at || new Date().toISOString(),
          status: comment.status || 'approved'
        }));
        
        setComments(validatedComments);
      } else {
        setError('Nepavyko įkelti komentarų.');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Klaida įkeliant komentarus. Bandykite vėliau.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId, commentId) => {
    console.log('Attempting to delete comment:', { recipeId, commentId });
    
    // Validate IDs
    if (!recipeId || recipeId === 'undefined' || recipeId === 'null' || !commentId) {
      setNotification({
        title: 'Klaida',
        message: 'Nerastas recepto arba komentaro ID. Bandykite perkrauti puslapį.',
        type: 'error'
      });
      return;
    }
    
    if (!window.confirm('Ar tikrai norite ištrinti šį komentarą?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/recipes/${recipeId}/comments/${commentId}`);
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Komentaras ištrintas.',
          type: 'success'
        });
        
        // Remove comment from local state immediately
        setComments(prevComments => 
          prevComments.filter(comment => comment.id !== commentId)
        );
        
        // Optionally refresh all comments
        setTimeout(fetchComments, 500);
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
      if (isNaN(date.getTime())) {
        return '';
      }
      
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
            Visi komentarai
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
            {comments.map((comment, index) => (
              <div key={comment.id || `comment-${index}`} className="comment-admin-item">
                <div className="comment-admin-header">
                  <div className="comment-admin-author">
                    <strong>{comment.author}</strong> 
                    {comment.email && (
                      <span className="comment-admin-email">({comment.email})</span>
                    )}
                  </div>
                  <div className="comment-admin-date">{formatDate(comment.created_at)}</div>
                </div>
                
                <div className="comment-admin-recipe">
                  Receptas: <strong>{comment.recipeTitle}</strong>
                  {!comment.recipeId && (
                    <span style={{ color: '#cf5151', marginLeft: '10px' }}>
                      (Recepto ID nerastas)
                    </span>
                  )}
                </div>
                
                <div className="comment-admin-content">
                  {comment.content}
                </div>
                
                <div className="comment-admin-footer">
                  <div className="comment-admin-actions">
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(comment.recipeId, comment.id)}
                      title="Ištrinti"
                      disabled={!comment.recipeId || !comment.id}
                    >
                      <i className="fas fa-trash"></i> Ištrinti
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