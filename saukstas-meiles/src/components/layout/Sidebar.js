import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/Sidebar.css';

const Sidebar = () => {
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aboutData, setAboutData] = useState(null);

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

    // Fetch about data for the sidebar
    const fetchAboutData = async () => {
      try {
        const response = await api.get('/api/about');
        if (response.data.success) {
          setAboutData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching about data for sidebar:', error);
      }
    };

    fetchPopularRecipes();
    fetchCategories();
    fetchAboutData();
  }, []);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      if (dateString.seconds) {
        // Firebase Timestamp object
        date = new Date(dateString.seconds * 1000);
      } else if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleDateString('lt-LT');
    } catch (error) {
      return '';
    }
  };

  // Format title
  const formatTitle = (title) => {
    if (!title) return '';
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  // Get image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return `/img/recipes/${image}`;
  };

  // Get about image URL
  const getAboutImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return `/img/about/${image}`;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Apie mane</h3>
        <div className="about-me-img">
          <img 
            src={aboutData?.sidebar_image ? getAboutImageUrl(aboutData.sidebar_image) : (aboutData?.image ? getAboutImageUrl(aboutData.image) : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23f8f5f1'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='20' text-anchor='middle' x='60' y='65'%3EL%3C/text%3E%3C/svg%3E`)} 
            alt="Šaukštas Meilės autorė"  
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23f8f5f1'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='20' text-anchor='middle' x='60' y='65'%3EL%3C/text%3E%3C/svg%3E`;
            }}
          />
        </div>
        <div className="about-me-text">
          <p>{aboutData ? aboutData.intro.substring(0, 150) + '...' : 'Sveiki, esu Lidija – keliaujanti miško takeliais, pievomis ir laukais...'}</p>
        </div>
        <div className="social-links">
          <a href={`mailto:${aboutData?.social?.email || 'info@saukstas-meiles.lt'}`} className="social-link"><i className="fa fa-envelope"></i></a>
          <a href={aboutData?.social?.instagram || "#"} className="social-link" target="_blank" rel="noopener noreferrer"><i className="fa fa-instagram"></i></a>
          <a href={aboutData?.social?.facebook || "#"} className="social-link" target="_blank" rel="noopener noreferrer"><i className="fa fa-facebook"></i></a>
          <a href={aboutData?.social?.pinterest || "#"} className="social-link" target="_blank" rel="noopener noreferrer"><i className="fa fa-pinterest"></i></a>
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
                        src={getImageUrl(recipe.image)} 
                        alt={recipe.title} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="placeholder-image-small">${formatTitle(recipe.title)}</div>`;
                        }}
                      />
                    ) : (
                      <div className="placeholder-image-small">{formatTitle(recipe.title)}</div>
                    )}
                  </div>
                  <div className="popular-post-content">
                    <div className="popular-post-title">{formatTitle(recipe.title)}</div>
                    <div className="popular-post-date">{formatDate(recipe.created_at)}</div>
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
    </aside>
  );
};

export default Sidebar;