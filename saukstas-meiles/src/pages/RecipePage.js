import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import NewsletterSubscription from '../components/NewsletterSubscription';
import RecipeDetail from '../components/recipes/RecipeDetail';
import CommentList from '../components/comments/CommentList';
import CommentForm from '../components/comments/CommentForm';
import Sidebar from '../components/layout/Sidebar';
import '../styles/RecipePage.css';

const RecipePage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when recipe ID changes
    setRecipe(null);
    setComments([]);
    setLoading(true);
    setError(null);
    
    // Fetch recipe and comments
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      console.log('Fetching recipe with ID:', id);
      
      // Fetch recipe data
      const recipeResponse = await api.get(`/recipes/${id}`);
      console.log('Recipe response:', recipeResponse);
      
      if (recipeResponse.data.success) {
        const recipeData = recipeResponse.data.data;
        console.log('Recipe data:', recipeData);
        setRecipe(recipeData);
        
        // Fetch comments for this recipe
        try {
          const commentsResponse = await api.get(`/recipes/${id}/comments`);
          console.log('Comments response:', commentsResponse);
          
          if (commentsResponse.data.success) {
            setComments(commentsResponse.data.data || []);
          }
        } catch (commentError) {
          console.error('Error fetching comments:', commentError);
          // Don't fail the whole page if comments fail to load
          setComments([]);
        }
      } else {
        setError(recipeResponse.data.error || 'Receptas nerastas.');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Klaida įkeliant receptą. Bandykite vėliau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    // Simply refresh the comments list to show the new comment
    fetchRecipe();
  };

  if (loading) {
    return (
      <>
        <div className="content-main">
          <div className="recipe-loading">
            <div className="loading-spinner"></div>
            <p>Kraunamas receptas...</p>
          </div>
        </div>
        <Sidebar />
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <div className="content-main">
          <div className="recipe-error">
            <h2>Receptas nerastas</h2>
            <p>{error || 'Nepavyko rasti recepto. Patikrinkite nuorodą ir bandykite dar kartą.'}</p>
            <button onClick={() => window.history.back()}>Grįžti atgal</button>
          </div>
        </div>
        <Sidebar />
      </>
    );
  }

  return (
    <>
      <div className="content-main">
        <RecipeDetail recipe={recipe} />
        
        {/* Add Newsletter Subscription Component */}
        <NewsletterSubscription />
        
        <div className="recipe-comments">
          <h3>Komentarai</h3>
          <CommentList comments={comments} />
          <CommentForm recipeId={id} onCommentAdded={handleCommentAdded} />
        </div>
      </div>
      
      <Sidebar />
    </>
  );
};

export default RecipePage;