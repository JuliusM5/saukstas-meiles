import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/RecipeCard.css';

const RecipeCard = ({ recipe }) => {
  return (
    <div className="recipe-card">
      <Link to={`/recipe/${recipe.id}`}>
        <div className="recipe-card-image">
          {recipe.image ? (
            <img 
              src={`/img/recipes/${recipe.image}`} 
              alt={recipe.title} 
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'><rect fill='%23f8f5f1' width='500' height='500'/><text fill='%237f4937' font-family='sans-serif' font-size='30' opacity='0.5' x='50%' y='50%' text-anchor='middle'>${recipe.title}</text></svg>`;
              }}
            />
          ) : (
            <div className="placeholder-image">
              <span>{recipe.title}</span>
            </div>
          )}
        </div>
        <div className="recipe-card-title">{recipe.title.toUpperCase()}</div>
      </Link>
    </div>
  );
};

export default RecipeCard;