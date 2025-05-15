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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
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

  return (
    <div className="recipe-main">
      <div className="recipe-header">
        <h1 className="recipe-title">{recipe.title}</h1>
        
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
          
          <div className="recipe-date">{formatDate(recipe.created_at)}</div>
        </div>
      </div>
      
      <div className="recipe-content">
        <div className="recipe-image">
          {recipe.image ? (
            <img 
              src={`/img/recipes/${recipe.image}`} 
              alt={recipe.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'><rect fill='%23f8f5f1' width='500' height='300'/><text fill='%237f4937' font-family='sans-serif' font-size='30' opacity='0.5' x='50%' y='50%' text-anchor='middle'>${recipe.title}</text></svg>`;
              }}
            />
          ) : (
            <div className="placeholder-image">
              <span>Nuotrauka nepateikta</span>
              <span>{recipe.title}</span>
            </div>
          )}
        </div>
        
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
        
        <div className="recipe-ingredients">
          <h3>Ingredientai</h3>
          <ul>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))
            ) : (
              <li>Nėra pateiktų ingredientų</li>
            )}
          </ul>
        </div>
        
        <div className="recipe-steps">
          <h3>Gaminimo eiga</h3>
          <ol>
            {recipe.steps && recipe.steps.length > 0 ? (
              recipe.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))
            ) : (
              <li>Nėra pateiktų gaminimo žingsnių</li>
            )}
          </ol>
        </div>
        
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