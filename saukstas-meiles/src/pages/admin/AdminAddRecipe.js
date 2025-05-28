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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/admin/recipes/${id}`);
      
      if (response.data.success) {
        setRecipe(response.data.data);
      } else {
        setError('Receptas nerastas');
        setNotification({
          title: 'Klaida',
          message: 'Receptas nerastas',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Klaida įkeliant receptą');
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant receptą. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!formData.title || formData.title.trim().length < 3) {
        setNotification({
          title: 'Klaida',
          message: 'Pavadinimas turi būti bent 3 simbolių ilgio.',
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Prepare recipe data
      const recipeData = {
        title: formData.title.trim(),
        intro: formData.intro?.trim() || '',
        categories: formData.categories || [],
        ingredients: formData.ingredients?.filter(ing => ing && ing.trim()) || [],
        steps: formData.steps?.filter(step => step && step.trim()) || [],
        tags: formData.tags || [],
        prep_time: parseInt(formData.prep_time) || 0,
        cook_time: parseInt(formData.cook_time) || 0,
        servings: parseInt(formData.servings) || 1,
        notes: formData.notes?.trim() || '',
        status: formData.status || 'draft'
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
        message: error.message || 'Klaida išsaugant receptą. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div id="admin-add-recipe">
        <AdminHeader activePage={isEditing ? 'edit-recipe' : 'add-recipe'} />
        
        <main className="admin-main container">
          <div className="loading">Įkeliama...</div>
        </main>
      </div>
    );
  }

  if (error && isEditing) {
    return (
      <div id="admin-add-recipe">
        <AdminHeader activePage="edit-recipe" />
        
        <main className="admin-main container">
          <div className="error-message">
            {error}
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => navigate('/admin/recipes')}
                className="submit-button"
              >
                Grįžti į receptus
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div id="admin-add-recipe">
      <AdminHeader activePage={isEditing ? 'edit-recipe' : 'add-recipe'} />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">
            {isEditing ? 'Redaguoti receptą' : 'Pridėti naują receptą'}
          </h2>
        </div>
        
        <RecipeForm 
          recipe={recipe} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
        />
      </main>
      
      {notification && (
        <Notification 
          title={notification.title} 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
          autoHide={notification.type === 'success'}
        />
      )}
    </div>
  );
};

export default AdminAddRecipe;