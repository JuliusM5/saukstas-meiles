// src/pages/HomePage.js
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
                    src={recipe.image} 
                    alt={recipe.title} 
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23f8f5f1' width='60' height='60'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='12' text-anchor='middle' x='30' y='30'%3EReceptas%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                ) : (
                  <div className="placeholder-image"></div>
                )}
              </div>
              <div className="latest-post-content">
                <h3 className="latest-post-title">
                  <Link to={`/recipe/${recipe.id}`}>{recipe.title}</Link>
                </h3>
                <div className="latest-post-date">
                  {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('lt-LT') : ''}
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