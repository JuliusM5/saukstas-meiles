import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import RecipeList from '../components/recipes/RecipeList';
import Sidebar from '../components/layout/Sidebar';
import '../styles/HomePage.css';

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Fetch recipes on initial load
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/recipes', {
        params: { page, limit: 12 }
      });
      
      if (response.data.success) {
        setRecipes(prevRecipes => 
          page === 1 ? response.data.data : [...prevRecipes, ...response.data.data]
        );
        
        // Set latest recipes on first load
        if (page === 1) {
          setLatestRecipes(response.data.data.slice(0, 3));
        }
        
        setHasMore(response.data.data.length === 12 && response.data.meta?.has_more !== false);
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

  const loadMoreRecipes = () => {
    setPage(prevPage => prevPage + 1);
    fetchRecipes();
  };

  return (
    <>
      <div className="content-main">
        <RecipeList
          recipes={recipes}
          loading={loading && page === 1}
          error={error}
        />
        
        {loading && page > 1 && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <p>Kraunama daugiau receptų...</p>
          </div>
        )}
        
        {hasMore && !loading && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={loadMoreRecipes}>
              DAUGIAU RECEPTŲ
            </button>
          </div>
        )}
        
        <h3 className="latest-heading">Naujausi</h3>
        
        <div className="latest-post">
          {latestRecipes.map(recipe => (
            <div key={recipe.id} className="latest-post-card">
              <div className="latest-post-image">
                {recipe.image ? (
                  <img 
                    src={`/img/recipes/${recipe.image}`} 
                    alt={recipe.title} 
                    loading="lazy"
                  />
                ) : (
                  <div className="placeholder-image"></div>
                )}
              </div>
              <div className="latest-post-content">
                <h3 className="latest-post-title">
                  <a href={`/recipe/${recipe.id}`}>{recipe.title}</a>
                </h3>
                <div className="latest-post-date">
                  {new Date(recipe.created_at).toLocaleDateString('lt-LT')}
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