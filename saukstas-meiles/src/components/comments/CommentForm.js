import React, { useState } from 'react';
import { api } from '../../utils/api';
import '../../styles/Comments.css';

const CommentForm = ({ recipeId, onCommentAdded }) => {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Validate form - only name and comment are required
    if (!name || !comment) {
      setError('Prašome įvesti vardą ir komentarą.');
      setSubmitting(false);
      return;
    }
    
    try {
      console.log('Submitting comment for recipe:', recipeId);
      const endpoint = `/recipes/${recipeId}/comments`;
      console.log('Comment endpoint:', endpoint);
      
      const response = await api.post(endpoint, {
        author: name,
        email: '', // Always send empty string for email
        content: comment
      });
      
      console.log('Comment response:', response);
      
      if (response.data.success) {
        setSuccess(true);
        setName('');
        setComment('');
        
        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded(response.data.data);
        }
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.data.error || 'Klaida išsaugant komentarą.');
      }
    } catch (error) {
      setError('Klaida išsaugant komentarą. Bandykite vėliau.');
      console.error('Error saving comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-form">
      <h4>Palikite komentarą</h4>
      
      {success && (
        <div className="comment-success">
          Ačiū už komentarą!
        </div>
      )}
      
      {error && (
        <div className="comment-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Vardas</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control" 
            required 
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="comment">Komentaras</label>
          <textarea 
            id="comment" 
            name="comment" 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-control" 
            required 
            disabled={submitting}
          ></textarea>
        </div>
        <button 
          type="submit" 
          className="submit-button"
          disabled={submitting}
        >
          {submitting ? 'Siunčiama...' : 'Paskelbti komentarą'}
        </button>
      </form>
    </div>
  );
};

export default CommentForm;