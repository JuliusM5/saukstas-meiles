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
    // If editing an existing recipe, fetch its data
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
        setError('Nepavyko įkelti recepto.');
        // Show notification
        setNotification({
          title: 'Klaida',
          message: 'Nepavyko įkelti recepto.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Klaida įkeliant receptą. Bandykite vėliau.');
      
      // Show notification
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
      setLoading(true);
      
      // Create FormData for file upload
      const data = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'categories' || key === 'tags') {
          // Handle arrays
          if (Array.isArray(formData[key])) {
            formData[key].forEach(value => {
              data.append(`${key}[]`, value);
            });
          } else {
            data.append(key, JSON.stringify(formData[key]));
          }
        } else if (key === 'image' && formData[key] instanceof File) {
          // Handle image file
          data.append('image', formData[key]);
        } else if (key === 'ingredients' || key === 'steps') {
          // Handle arrays
          if (Array.isArray(formData[key])) {
            formData[key].forEach(value => {
              data.append(`${key}[]`, value);
            });
          }
        } else {
          // Handle regular fields
          data.append(key, formData[key]);
        }
      });
      
      let response;
      
      if (isEditing) {
        // Update existing recipe
        response = await api.put(`/admin/recipes/${id}`, data);
      } else {
        // Create new recipe
        response = await api.post('/admin/recipes', data);
      }
      
      if (response.data.success) {
        // Show success notification
        setNotification({
          title: 'Sėkmė',
          message: isEditing ? 'Receptas sėkmingai atnaujintas.' : 'Receptas sėkmingai sukurtas.',
          type: 'success'
        });
        
        // Redirect to recipes list after a short delay
        setTimeout(() => {
          navigate('/admin/recipes');
        }, 1500);
      } else {
        // Show error notification
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida išsaugant receptą.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      
      // Show error notification
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