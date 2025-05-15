import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/Sidebar.css';

const Sidebar = () => {
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Fetch popular recipes
    const fetchPopularRecipes = async () => {
      try {
        const response = await api.get('/recipes', { params: { popular: true, limit: 5 }});
        if (response.data.success) {
          setPopularRecipes(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching popular recipes:', error);
      }
    };

    // Fetch categories with counts
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchPopularRecipes();
    fetchCategories();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      alert('Prašome įvesti el. pašto adresą.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Prašome įvesti teisingą el. pašto adresą.');
      return;
    }
    
    // In a real app, we would send this to the API
    alert(`Ačiū už prenumeratą! Naujienlaiškis bus siunčiamas adresu: ${email}`);
    setEmail('');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Apie mane</h3>
        <div className="about-me-img">
            <img 
                src="/img/profile.jpg" 
                alt="Šaukštas Meilės autorė" 
                onError={(e) => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23f8f5f1'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='20' text-anchor='middle' x='60' y='65'%3EL%3C/text%3E%3C/svg%3E`;
                }}
            />
        </div>
        <div className="about-me-text">
          <p>Sveiki, esu Lidija – keliaujanti miško takeliais, pievomis ir laukais, kur kiekvienas žolės stiebelis, vėjo dvelksmas ar laukinė uoga tampa įkvėpimu naujam skoniui.</p>
        </div>
        <div className="social-links">
          <a href="#" className="social-link"><i className="fa fa-instagram"></i></a>
          <a href="#" className="social-link"><i className="fa fa-facebook"></i></a>
          <a href="#" className="social-link"><i className="fa fa-pinterest"></i></a>
        </div>
      </div>
      
      <div className="sidebar-section">
        <h3 className="sidebar-title">Populiarūs receptai</h3>
        <ul className="popular-posts-list">
          {popularRecipes.length > 0 ? (
            popularRecipes.map(recipe => (
              <li key={recipe.id} className="popular-post-item">
                <Link to={`/recipe/${recipe.id}`}>
                    <div className="popular-post-img">
                        {recipe.image ? (
                            <img 
                            src={`/img/recipes/${recipe.image}`} 
                            alt={recipe.title} 
                            onError={(e) => {
                                e.target.onerror = null;
                                // Simple data URI for the placeholder
                                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23f8f5f1' width='60' height='60'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='12' text-anchor='middle' x='30' y='30'%3EReceptas%3C/text%3E%3C/svg%3E`;
                            }}
                            />
                        ) : (
                            <div className="placeholder-image"></div>
                        )}
                    </div>
                  <div className="popular-post-content">
                    <div className="popular-post-title">{recipe.title}</div>
                    <div className="popular-post-date">{new Date(recipe.created_at).toLocaleDateString('lt-LT')}</div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li>Nėra populiarių receptų</li>
          )}
        </ul>
      </div>
      
      <div className="sidebar-section">
        <h3 className="sidebar-title">Kategorijos</h3>
        <ul className="categories-list">
          {categories.map(category => (
            <li key={category.id || category.name}>
              <Link to={`/category/${encodeURIComponent(category.name)}`}>
                {category.name} <span className="category-count">{category.count || 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="sidebar-section">
        <h3 className="sidebar-title">Naujienlaiškis</h3>
        <p className="about-me-text">Užsiprenumeruokite ir gaukite naujausius receptus tiesiai į savo pašto dėžutę!</p>
        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
          <input 
            type="email" 
            name="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="newsletter-input" 
            placeholder="Jūsų el. paštas" 
            required 
          />
          <button type="submit" className="newsletter-button">Prenumeruoti</button>
        </form>
      </div>
    </aside>
  );
};

export default Sidebar;