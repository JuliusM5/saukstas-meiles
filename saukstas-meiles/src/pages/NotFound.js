import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound = () => {
  return (
    <div className="error-container">
      <h1 className="error-code">404</h1>
      <h2 className="error-message">Puslapis nerastas</h2>
      <p className="error-text">Atsiprašome, bet jūsų ieškomas puslapis neegzistuoja. Galbūt adresas buvo pakeistas arba puslapis buvo pašalintas.</p>
      <Link to="/" className="back-home">Grįžti į pagrindinį puslapį</Link>
    </div>
  );
};

export default NotFound;