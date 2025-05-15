import React, { useState } from 'react';
import { api } from '../../utils/api';
import '../../styles/Comments.css';

const Comment = ({ comment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
  };
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Validate form
    if (!name || !email || !replyText) {
      setError('Prašome užpildyti visus būtinus laukus.');
      setSubmitting(false);
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Prašome įvesti teisingą el. pašto adresą.');
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await api.post(`/comments/${comment.id}/replies`, {
        author: name,
        email,
        content: replyText
      });
      
      if (response.data.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        setReplyText('');
        
        // Close the form after successful submission
        setTimeout(() => {
          setShowReplyForm(false);
          setSuccess(false);
        }, 3000);
      } else {
        setError(response.data.error || 'Klaida išsaugant atsakymą.');
      }
    } catch (error) {
      setError('Klaida išsaugant atsakymą. Bandykite vėliau.');
      console.error('Error saving reply:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="comment">
      <div className="comment-header">
        <div className="comment-avatar">
          {/* Default avatar image or first letter of name */}
          {comment.author ? comment.author.charAt(0).toUpperCase() : 'A'}
        </div>
        <div className="comment-info">
          <div className="comment-author">{comment.author || 'Anonimas'}</div>
          <div className="comment-date">{formatDate(comment.created_at)}</div>
        </div>
      </div>
      
      <div className="comment-content">
        <p>{comment.content}</p>
      </div>
      
      <button 
        className="comment-reply-link"
        onClick={() => setShowReplyForm(!showReplyForm)}
      >
        {showReplyForm ? 'Atšaukti' : 'Atsakyti'}
      </button>
      
      {showReplyForm && (
        <div className="reply-form">
          <h4>Atsakyti į komentarą</h4>
          
          {success && (
            <div className="comment-success">
              Ačiū už komentarą! Jis bus paskelbtas po peržiūros.
            </div>
          )}
          
          {error && (
            <div className="comment-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleReplySubmit}>
            <div className="form-group">
              <label htmlFor={`reply-name-${comment.id}`}>Vardas</label>
              <input 
                type="text" 
                id={`reply-name-${comment.id}`} 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control" 
                required 
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor={`reply-email-${comment.id}`}>El. paštas (nebus skelbiamas)</label>
              <input 
                type="email" 
                id={`reply-email-${comment.id}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control" 
                required 
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor={`reply-comment-${comment.id}`}>Komentaras</label>
              <textarea 
                id={`reply-comment-${comment.id}`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="form-control" 
                required 
                disabled={submitting}
              ></textarea>
            </div>
            <div className="form-buttons">
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Siunčiama...' : 'Atsakyti'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowReplyForm(false)}
                disabled={submitting}
              >
                Atšaukti
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Render replies if any */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <div key={reply.id} className="comment-reply">
              <div className="comment-header">
                <div className="comment-avatar">
                  {reply.author ? reply.author.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="comment-info">
                  <div className="comment-author">{reply.author || 'Anonimas'}</div>
                  <div className="comment-date">{formatDate(reply.created_at)}</div>
                </div>
              </div>
              <div className="comment-content">
                <p>{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;