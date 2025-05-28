import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import RecipeList from '../components/recipes/RecipeList';
import NewsletterSubscription from '../components/NewsletterSubscription';
import Sidebar from '../components/layout/Sidebar';
import '../styles/HomePage.css';

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch exactly 9 recipes for the homepage (3x3 grid)
    fetchRecipes(9);
  }, []);

  const fetchRecipes = async (limit = 9) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/recipes', {
        params: { page: 1, limit: limit }
      });
      
      if (response.data.success) {
        setRecipes(response.data.data);
        
        // Set latest recipes on first load
        if (limit === 9) {
          setLatestRecipes(response.data.data.slice(0, 3));
        }
      } else {
        setError('Nepavyko įkelti receptų.');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Klaida įkeliant receptus. Bandykite vėliau.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <div className="content-main">
        <RecipeList
          recipes={recipes}
          loading={loading}
          error={error}
        />
        
        {/* More Recipes Button */}
        <div className="more-recipes-button-container">
          <Link to="/category/all" className="more-recipes-button">
            Daugiau receptų
          </Link>
        </div>
        
        {/* Newsletter Subscription Section */}
        <NewsletterSubscription />
        
        <h3 className="latest-heading">Naujausi</h3>
        
        <div className="latest-post">
          {latestRecipes.map(recipe => (
            <div key={recipe.id} className="latest-post-card">
              <div className="latest-post-image">
                {recipe.image ? (
                  <img 
                    src={getImageUrl(recipe.image)} 
                    alt={recipe.title} 
                    loading="lazy"
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
              <div className="latest-post-content">
                <h3 className="latest-post-title">
                  <Link to={`/recipe/${recipe.id}`}>{formatTitle(recipe.title)}</Link>
                </h3>
                <div className="latest-post-date">
                  {formatDate(recipe.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Sidebar />
    </>
  );
};

export default HomePage;