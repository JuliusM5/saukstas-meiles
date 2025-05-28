import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/RecipeDetail.css';

const RecipeDetail = ({ recipe }) => {
  if (!recipe) {
    return (
      <div className="recipe-loading">
        <div className="loading-spinner"></div>
        <p>Kraunamas receptas...</p>
      </div>
    );
  }

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle Firebase Timestamp
      let date;
      if (dateString.seconds) {
        // Firebase Timestamp object
        date = new Date(dateString.seconds * 1000);
      } else if (typeof dateString === 'string') {
        // Regular date string
        date = new Date(dateString);
      } else {
        return '';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
  };

  // Get image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    
    // If it's already a full URL (from Firebase Storage), use it directly
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // Otherwise, assume it's a local image
    return `/img/recipes/${image}`;
  };

  // Format title
  const formatTitle = (title) => {
    if (!title) return '';
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  return (
    <div className="recipe-main">
      <div className="recipe-header">
        <h1 className="recipe-title">{formatTitle(recipe.title)}</h1>
        
        <div className="recipe-meta">
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="recipe-categories">
              {recipe.categories.map((category, index) => (
                <Link 
                  key={index} 
                  to={`/category/${encodeURIComponent(category)}`}
                >
                  {category}
                </Link>
              ))}
            </div>
          )}
          
          {formatDate(recipe.created_at) && (
            <div className="recipe-date">{formatDate(recipe.created_at)}</div>
          )}
        </div>
      </div>
      
      <div className="recipe-content">
        {recipe.image && (
          <div className="recipe-image">
            <img 
              src={getImageUrl(recipe.image)} 
              alt={recipe.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="placeholder-image">
                    <span>Nuotrauka nepasiekiama</span>
                  </div>
                `;
              }}
            />
          </div>
        )}
        
        {recipe.intro && (
          <div className="recipe-intro">{recipe.intro}</div>
        )}
        
        <div className="recipe-info">
          <div className="info-item">
            <i className="fa fa-clock"></i>
            <span>Paruošimas: {recipe.prep_time || '0'} min</span>
          </div>
          <div className="info-item">
            <i className="fa fa-fire"></i>
            <span>Gaminimas: {recipe.cook_time || '0'} min</span>
          </div>
          <div className="info-item">
            <i className="fa fa-utensils"></i>
            <span>Porcijos: {recipe.servings || '1'}</span>
          </div>
        </div>
        
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="recipe-ingredients">
            <h3>Ingredientai</h3>
            <ul>
              {recipe.ingredients.filter(ing => ing && ing.trim()).map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}
        
        {recipe.steps && recipe.steps.length > 0 && (
          <div className="recipe-steps">
            <h3>Gaminimo eiga</h3>
            <ol>
              {recipe.steps.filter(step => step && step.trim()).map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        
        {recipe.notes && (
          <div className="recipe-notes">
            <h3>Pastabos</h3>
            <p>{recipe.notes}</p>
          </div>
        )}
        
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-tags">
            <h3>Žymos</h3>
            <div className="tag-list">
              {recipe.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/category/${encodeURIComponent(tag)}`}
                  className="tag-link"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;