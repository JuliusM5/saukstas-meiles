import React from 'react';
import RecipeCard from './RecipeCard';
import '../../styles/RecipeList.css';

const RecipeList = ({ recipes, loading, error }) => {
  if (loading) {
    return (
      <div className="recipe-list-loading">
        <div className="loading-spinner"></div>
        <p>Kraunami receptai...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-list-error">
        <p>Klaida kraunant receptus: {error}</p>
        <button onClick={() => window.location.reload()}>Bandyti dar kartą</button>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="recipe-list-empty">
        <p>Šioje kategorijoje receptų nerasta.</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};

export default RecipeList;