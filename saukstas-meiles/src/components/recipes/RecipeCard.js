// src/components/recipes/RecipeCard.js
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
              src={recipe.image} 
              alt={recipe.title} 
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f8f5f1' width='300' height='200'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='30' text-anchor='middle' x='150' y='100'%3E${recipe.title}%3C/text%3E%3C/svg%3E`;
              }}
            />
          ) : (
            <div className="placeholder-image">
              <span>{recipe.title}</span>
            </div>
          )}
        </div>
        <div className="recipe-card-title">{recipe.title}</div>
      </Link>
    </div>
  );
};

export default RecipeCard;