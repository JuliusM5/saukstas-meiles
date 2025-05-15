import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
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
      const recipeResponse = await api.get(`/recipes/${id}`);
      
      if (recipeResponse.data.success) {
        setRecipe(recipeResponse.data.data);
        
        // Fetch comments for this recipe
        const commentsResponse = await api.get(`/recipes/${id}/comments`);
        
        if (commentsResponse.data.success) {
          setComments(commentsResponse.data.data);
        }
      } else {
        setError('Receptas nerastas.');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Klaida įkeliant receptą. Bandykite vėliau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    // In a real app, we might refresh the comments after a successful comment
    // For now, we'll just append a notification that the comment will be available after review
    setComments(prev => [
      {
        id: 'temp-' + Date.now(),
        author: newComment.author,
        content: 'Jūsų komentaras bus rodomas po administratoriaus peržiūros.',
        created_at: new Date().toISOString(),
        status: 'pending'
      },
      ...prev
    ]);
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