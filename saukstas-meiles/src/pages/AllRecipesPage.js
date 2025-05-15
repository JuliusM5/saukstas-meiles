import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import RecipeList from '../components/recipes/RecipeList';
import Sidebar from '../components/layout/Sidebar';
import '../styles/CategoryPage.css';

const AllRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories
    fetchCategories();
    
    // Fetch all recipes
    fetchRecipes();
  }, []);

  useEffect(() => {
    // Reload recipes when active category changes
    fetchRecipes();
  }, [activeCategory, page]);

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

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { page, limit: 12 };
      if (activeCategory) {
        params.category = activeCategory;
      }
      
      const response = await api.get('/recipes', { params });
      
      if (response.data.success) {
        setRecipes(prevRecipes => 
          page === 1 ? response.data.data : [...prevRecipes, ...response.data.data]
        );
        
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
  };

  const selectCategory = (categoryName) => {
    setActiveCategory(categoryName === activeCategory ? null : categoryName);
    setPage(1);
    setRecipes([]);
  };

  return (
    <>
      <div className="content-main">
        <div className="category-header">
          <h1 className="category-title">
            {activeCategory ? activeCategory : "Visi receptai"}
          </h1>
          <p className="category-description">
            {activeCategory 
              ? `Atraskite mūsų receptų kolekciją kategorijoje "${activeCategory}".`
              : "Atraskite visus mūsų receptus. Galite filtruoti pagal kategoriją."
            }
          </p>
        </div>
        
        <div className="category-filter">
          <button 
            className={`category-filter-button ${!activeCategory ? 'active' : ''}`}
            onClick={() => selectCategory(null)}
          >
            Visi
          </button>
          {categories.map(category => (
            <button 
              key={category.name}
              className={`category-filter-button ${activeCategory === category.name ? 'active' : ''}`}
              onClick={() => selectCategory(category.name)}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
        
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
      </div>
      
      <Sidebar />
    </>
  );
};

export default AllRecipesPage;