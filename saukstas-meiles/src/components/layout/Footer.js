import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Footer.css';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <p className="footer-text">Šaukštas Meilės - naminiai lietuviški receptai su meile</p>
        <div className="footer-links">
          <Link to="/">Pagrindinis</Link>
          <Link to="/category/Desertai">Receptai</Link>
          <Link to="/about">Apie mane</Link>
          <Link to="/about#contact">Kontaktai</Link>
          <Link to="/privacy">Privatumo politika</Link>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Šaukštas Meilės. Visos teisės saugomos.</p>
      </div>
    </footer>
  );
};

export default Footer;
