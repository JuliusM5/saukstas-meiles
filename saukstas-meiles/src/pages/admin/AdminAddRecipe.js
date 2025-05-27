// src/pages/admin/AdminAddRecipe.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import RecipeForm from '../../components/admin/RecipeForm';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminAddRecipe.css';

const AdminAddRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/recipes/${id}`);
      
      if (response.data.success) {
        setRecipe(response.data.data);
      } else {
        setError('Receptas nerastas');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Klaida įkeliant receptą');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      // Prepare recipe data
      const recipeData = {
        title: formData.title,
        intro: formData.intro,
        categories: formData.categories || [],
        ingredients: formData.ingredients?.filter(ing => ing.trim()) || [],
        steps: formData.steps?.filter(step => step.trim()) || [],
        tags: formData.tags || [],
        prep_time: formData.prep_time,
        cook_time: formData.cook_time,
        servings: formData.servings,
        notes: formData.notes,
        status: formData.status
      };
      
      let response;
      
      if (isEditing) {
        // Update existing recipe
        response = await api.put(`/admin/recipes/${id}`, {
          recipeData,
          imageFile: formData.image
        });
      } else {
        // Create new recipe
        response = await api.post('/admin/recipes', {
          recipeData,
          imageFile: formData.image
        });
      }
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: isEditing ? 'Receptas atnaujintas!' : 'Receptas sukurtas!',
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/admin/recipes');
        }, 1500);
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida išsaugant receptą',
          type: 'error'
        });
      }
      
    } catch (error) {
      console.error('Error saving recipe:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida išsaugant receptą. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-add-recipe">
      <AdminHeader activePage={isEditing ? 'edit-recipe' : 'add-recipe'} />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">
            {isEditing ? 'Redaguoti receptą' : 'Pridėti naują receptą'}
          </h2>
        </div>
        
        {loading && !recipe ? (
          <div className="loading">Įkeliama...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <RecipeForm 
            recipe={recipe} 
            onSubmit={handleSubmit} 
            isSubmitting={loading}
          />
        )}
      </main>
      
      {notification && (
        <Notification 
          title={notification.title} 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AdminAddRecipe;