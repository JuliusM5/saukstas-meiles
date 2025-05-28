// src/components/recipes/RecipeCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/RecipeCard.css';

const RecipeCard = ({ recipe }) => {
  // Helper function to get the correct image URL
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
    if (!title) return 'Nepavadintas';
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  return (
    <div className="recipe-card">
      <Link to={`/recipe/${recipe.id}`}>
        <div className="recipe-card-image">
          {recipe.image ? (
            <img 
              src={getImageUrl(recipe.image)} 
              alt={recipe.title} 
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<div class="placeholder-image"><span>${formatTitle(recipe.title)}</span></div>`;
              }}
            />
          ) : (
            <div className="placeholder-image">
              <span>{formatTitle(recipe.title)}</span>
            </div>
          )}
        </div>
        <div className="recipe-card-title">{formatTitle(recipe.title)}</div>
      </Link>
    </div>
  );
};

export default RecipeCard;