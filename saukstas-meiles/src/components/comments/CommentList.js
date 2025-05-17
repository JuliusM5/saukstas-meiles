import React from 'react';
import Comment from './Comment';
import '../../styles/Comments.css';

const CommentList = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="comments-list">
        <div className="no-comments">Kol kas komentarų nėra. Būkite pirmas!</div>
      </div>
    );
  }

  return (
    <div className="comments-list">
      {comments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;