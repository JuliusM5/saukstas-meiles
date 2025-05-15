import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Header.css';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Categories for dropdown menu
  const categories = [
    'Gėrimai ir kokteiliai', 'Desertai', 'Sriubos', 'Užkandžiai',
    'Varškė', 'Kiaušiniai', 'Daržovės', 'Bulvės',
    'Mėsa', 'Žuvis ir jūros gėrybės', 'Kruopos ir grūdai',
    'Be glitimo', 'Be laktozės', 'Gamta lėkštėje', 'Iš močiutės virtuvės'
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdowns and mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  return (
    <header>
      <h1 className="site-title">Šaukštas Meilės</h1>
      <p className="site-description">Skoniai iš gamtos, tylos ir švelnumo</p>
      
      <button 
        className="mobile-menu-toggle" 
        aria-label="Toggle menu"
        onClick={toggleMobileMenu}
      >
        <i className="fa fa-bars"></i>
      </button>
      
      <nav className={mobileMenuOpen ? 'active' : ''}>
        <ul>
          <li>
            <Link to="/">PAGRINDINIS</Link>
          </li>
          <li className="dropdown" ref={dropdownRef}>
            <button 
              className="dropdown-btn"
              onClick={() => toggleDropdown(0)}
              aria-expanded={activeDropdown === 0}
            >
              RECEPTAI <i className="fa fa-chevron-down"></i>
            </button>
            {activeDropdown === 0 && (
              <div className="dropdown-content">
                {categories.map((category, index) => (
                  <React.Fragment key={index}>
                    {(index === 11 || index === 13) && <hr />}
                    <Link to={`/category/${encodeURIComponent(category)}`}>
                      {category}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            )}
          </li>
          <li>
            <Link to="/about">APIE MANE</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;