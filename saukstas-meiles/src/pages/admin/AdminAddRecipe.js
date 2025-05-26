import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    const recipeDoc = await getDoc(doc(db, 'recipes', id));
    
    if (recipeDoc.exists()) {
      setRecipe({ id: recipeDoc.id, ...recipeDoc.data() });
    } else {
      setError('Recipe not found');
    }
  } catch (error) {
    console.error('Error fetching recipe:', error);
    setError('Error loading recipe');
  } finally {
    setLoading(false);
  }
};

    const handleSubmit = async (formData) => {
  try {
    setLoading(true);
    
    let imageUrl = recipe?.image || '';
    
    // Upload image to Firebase Storage if new image
    if (formData.image instanceof File) {
      const imageRef = ref(storage, `recipes/${Date.now()}-${formData.image.name}`);
      const snapshot = await uploadBytes(imageRef, formData.image);
      imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    const recipeData = {
      title: formData.title,
      intro: formData.intro,
      image: imageUrl,
      categories: formData.categories || [],
      ingredients: formData.ingredients || [],
      steps: formData.steps || [],
      tags: formData.tags || [],
      prep_time: formData.prep_time,
      cook_time: formData.cook_time,
      servings: formData.servings,
      notes: formData.notes,
      status: formData.status,
      created_at: recipe?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (isEditing) {
      // Update existing recipe
      await updateDoc(doc(db, 'recipes', id), recipeData);
    } else {
      // Create new recipe
      await addDoc(collection(db, 'recipes'), recipeData);
    }
    
    setNotification({
      title: 'Sėkmė',
      message: isEditing ? 'Receptas atnaujintas!' : 'Receptas sukurtas!',
      type: 'success'
    });
    
    setTimeout(() => {
      navigate('/admin/recipes');
    }, 1500);
    
  } catch (error) {
    console.error('Error saving recipe:', error);
    setNotification({
      title: 'Klaida',
      message: 'Klaida išsaugant receptą',
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