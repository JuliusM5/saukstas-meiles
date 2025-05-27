import React from 'react';
import '../../styles/Comments.css';

const Comment = ({ comment }) => {
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
    </div>
  );
};

export default Comment;