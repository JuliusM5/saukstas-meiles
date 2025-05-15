import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin/RecipeForm.css';

const RecipeForm = ({ recipe, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    title: '',
    intro: '',
    image: null,
    categories: [],
    tags: [],
    prep_time: '',
    cook_time: '',
    servings: '',
    ingredients: [''],
    steps: [''],
    notes: '',
    status: 'draft'
  });
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize form with recipe data if editing
  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || '',
        intro: recipe.intro || '',
        image: null, // Don't set file input value
        categories: recipe.categories || [],
        tags: recipe.tags || [],
        prep_time: recipe.prep_time || '',
        cook_time: recipe.cook_time || '',
        servings: recipe.servings || '',
        ingredients: recipe.ingredients && recipe.ingredients.length ? recipe.ingredients : [''],
        steps: recipe.steps && recipe.steps.length ? recipe.steps : [''],
        notes: recipe.notes || '',
        status: recipe.status || 'draft'
      });
      
      // Set image preview if recipe has image
      if (recipe.image) {
        setPreviewImage(`/img/recipes/${recipe.image}`);
      }
    }
  }, [recipe]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      // Add to categories
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, value]
      }));
    } else {
      // Remove from categories
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat !== value)
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length <= 1) return;
    
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    
    setFormData(prev => ({
      ...prev,
      steps: newSteps
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const removeStep = (index) => {
    if (formData.steps.length <= 1) return;
    
    const newSteps = formData.steps.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      steps: newSteps
    }));
  };

  const handleTagsChange = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      
      const newTag = e.target.value.trim();
      
      // Don't add duplicate tags
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      
      // Clear input
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title) {
      alert('Prašome įvesti recepto pavadinimą.');
      return;
    }
    
    // Call onSubmit with form data
    onSubmit(formData);
  };

  // Available categories
  const availableCategories = [
    'Gėrimai ir kokteiliai', 'Desertai', 'Sriubos', 'Užkandžiai',
    'Varškė', 'Kiaušiniai', 'Daržovės', 'Bulvės',
    'Mėsa', 'Žuvis ir jūros gėrybės', 'Kruopos ir grūdai',
    'Be glitimo', 'Be laktozės', 'Gamta lėkštėje', 'Iš močiutės virtuvės'
  ];

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="recipe-title">Pavadinimas</label>
        <input 
          type="text" 
          id="recipe-title" 
          name="title" 
          className="form-control" 
          value={formData.title}
          onChange={handleInputChange}
          required 
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="recipe-intro">Įvadas</label>
        <textarea 
          id="recipe-intro" 
          name="intro" 
          className="form-control" 
          rows="3"
          value={formData.intro}
          onChange={handleInputChange}
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <div className="form-group">
        <label>Nuotrauka</label>
        <div className="file-upload">
          <label className="file-upload-label">
            <div className="file-upload-text">
              <i className="fas fa-upload file-upload-icon"></i>
              <span>Pasirinkite nuotrauką arba nutempkite ją čia</span>
            </div>
            <input 
              type="file" 
              id="recipe-image" 
              name="image" 
              className="file-upload-input"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
              ref={fileInputRef}
            />
          </label>
        </div>
        
        {previewImage && (
          <div className="image-preview" style={{ display: 'block' }}>
            <img src={previewImage} alt="Recipe preview" />
            <button 
              type="button" 
              className="remove-image"
              onClick={removeImage}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label>Kategorijos</label>
        <div className="categories-container">
          {availableCategories.map(category => (
            <div key={category} className="category-checkbox">
              <input 
                type="checkbox" 
                id={`cat-${category}`} 
                name="categories[]" 
                value={category}
                checked={formData.categories.includes(category)}
                onChange={handleCheckboxChange}
                disabled={isSubmitting}
              />
              <label htmlFor={`cat-${category}`}>{category}</label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-group">
        <label>Žymos</label>
        <div id="tags-container" className="tags-input-container">
          {formData.tags.map(tag => (
            <div key={tag} className="tag">
              <span className="tag-text">{tag}</span>
              <button 
                type="button" 
                className="tag-remove"
                onClick={() => removeTag(tag)}
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
          <input 
            type="text" 
            id="tags-input" 
            className="tags-input" 
            placeholder="Įveskite žymą ir paspauskite Enter"
            onKeyDown={handleTagsChange}
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>Informacija apie receptą</label>
        <div className="recipe-info">
          <div className="form-group">
            <label htmlFor="prep-time">Paruošimo laikas (min)</label>
            <input 
              type="number" 
              id="prep-time" 
              name="prep_time" 
              className="form-control" 
              min="0"
              value={formData.prep_time}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="cook-time">Gaminimo laikas (min)</label>
            <input 
              type="number" 
              id="cook-time" 
              name="cook_time" 
              className="form-control" 
              min="0"
              value={formData.cook_time}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="servings">Porcijos</label>
            <input 
              type="number" 
              id="servings" 
              name="servings" 
              className="form-control" 
              min="1"
              value={formData.servings}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label>Ingredientai</label>
        <div id="ingredient-list" className="ingredient-list">
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-item">
              <input 
                type="text" 
                name={`ingredients[${index}]`} 
                className="form-control" 
                placeholder="Įveskite ingredientą"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="button" 
                className="remove-ingredient-btn"
                onClick={() => removeIngredient(index)}
                disabled={isSubmitting || formData.ingredients.length <= 1}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
        <button 
          type="button" 
          id="add-ingredient-btn" 
          className="add-ingredient-btn"
          onClick={addIngredient}
          disabled={isSubmitting}
        >
          <i className="fas fa-plus"></i> Pridėti ingredientą
        </button>
      </div>
      
      <div className="form-group">
        <label>Gaminimo žingsniai</label>
        <div id="step-list" className="step-list">
          {formData.steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <textarea 
                  name={`steps[${index}]`} 
                  className="form-control" 
                  placeholder="Įveskite žingsnio aprašymą"
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  disabled={isSubmitting}
                ></textarea>
              </div>
              <div className="step-actions">
                <button 
                  type="button" 
                  className="remove-ingredient-btn"
                  onClick={() => removeStep(index)}
                  disabled={isSubmitting || formData.steps.length <= 1}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button 
          type="button" 
          id="add-step-btn" 
          className="add-ingredient-btn"
          onClick={addStep}
          disabled={isSubmitting}
        >
          <i className="fas fa-plus"></i> Pridėti žingsnį
        </button>
      </div>
      
      <div className="form-group">
        <label htmlFor="recipe-notes">Pastabos (nebūtina)</label>
        <textarea 
          id="recipe-notes" 
          name="notes" 
          className="form-control" 
          rows="3"
          value={formData.notes}
          onChange={handleInputChange}
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <div className="form-group">
        <label htmlFor="recipe-status">Statusas</label>
        <select 
          id="recipe-status" 
          name="status" 
          className="form-control"
          value={formData.status}
          onChange={handleInputChange}
          disabled={isSubmitting}
        >
          <option value="draft">Juodraštis</option>
          <option value="published">Publikuotas</option>
        </select>
      </div>
      
      <div className="form-group">
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Išsaugoma...' : recipe ? 'Atnaujinti receptą' : 'Išsaugoti receptą'}
        </button>
        <Link to="/admin/recipes" className="cancel-button">Atšaukti</Link>
      </div>
    </form>
  );
};

export default RecipeForm;