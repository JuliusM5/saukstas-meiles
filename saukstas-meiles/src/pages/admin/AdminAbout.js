import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminAbout.css';

const AdminAbout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    intro: '',
    sections: [
      { title: '', content: '' },
      { title: '', content: '' }
    ],
    social: {
      email: '',
      instagram: '',
      facebook: '',
      pinterest: ''
    },
    image: null
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  
  useEffect(() => {
    fetchAboutData();
  }, []);
  
  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/about');
      
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          title: data.title || '',
          subtitle: data.subtitle || '',
          intro: data.intro || '',
          sections: data.sections && data.sections.length > 0 
            ? data.sections 
            : [{ title: '', content: '' }],
          social: {
            email: data.social?.email || '',
            instagram: data.social?.instagram || '',
            facebook: data.social?.facebook || '',
            pinterest: data.social?.pinterest || ''
          }
        });
        
        // Set current image if exists
        if (data.image) {
          setCurrentImage(data.image);
          setPreviewImage(`/img/about/${data.image}`);
        }
      } else {
        setNotification({
          title: 'Klaida',
          message: 'Nepavyko įkelti informacijos.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant informaciją. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      social: { ...prev.social, [name]: value }
    }));
  };
  
  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[index] = { 
      ...updatedSections[index], 
      [field]: value 
    };
    
    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };
  
  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', content: '' }]
    }));
  };
  
  const removeSection = (index) => {
    if (formData.sections.length <= 1) return;
    
    const updatedSections = formData.sections.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
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
    setCurrentImage(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      setNotification({
        title: 'Klaida',
        message: 'Prašome įvesti puslapio pavadinimą.',
        type: 'error'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create FormData for the request
      const data = new FormData();
      
      // Add basic fields
      data.append('title', formData.title);
      data.append('subtitle', formData.subtitle);
      data.append('intro', formData.intro);
      
      // Add social fields
      data.append('email', formData.social.email);
      data.append('instagram', formData.social.instagram);
      data.append('facebook', formData.social.facebook);
      data.append('pinterest', formData.social.pinterest);
      
      // Add sections
      formData.sections.forEach((section, index) => {
        data.append('section_titles', section.title);
        data.append('section_contents', section.content);
      });
      
      // Add image if selected
      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }
      
      // Send the request
      const response = await api.put('/admin/about', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Informacija sėkmingai atnaujinta.',
          type: 'success'
        });
        
        // Update current image if one was uploaded
        if (response.data.data.image) {
          setCurrentImage(response.data.data.image);
        }
        
        // Reset the file input
        setFormData(prev => ({
          ...prev,
          image: null
        }));
        
        // Refresh data
        fetchAboutData();
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida išsaugant informaciją.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating about page:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida išsaugant informaciją. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div id="admin-about">
        <AdminHeader activePage="about" />
        <main className="admin-main container">
          <div className="loading">Įkeliama...</div>
        </main>
      </div>
    );
  }
  
  return (
    <div id="admin-about">
      <AdminHeader activePage="about" />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Redaguoti "Apie mane" puslapį</h2>
        </div>
        
        <div className="admin-about-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Pavadinimas</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subtitle">Paantraštė</label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                className="form-control"
                value={formData.subtitle}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="intro">Įvadas</label>
              <textarea
                id="intro"
                name="intro"
                className="form-control"
                rows="4"
                value={formData.intro}
                onChange={handleInputChange}
                disabled={submitting}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>Profilio nuotrauka</label>
              <div className="file-upload">
                <label className="file-upload-label">
                  <div className="file-upload-text">
                    <i className="fas fa-upload file-upload-icon"></i>
                    <span>Pasirinkite nuotrauką arba nutempkite ją čia</span>
                  </div>
                  <input 
                    type="file" 
                    id="profile-image" 
                    name="image" 
                    className="file-upload-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={submitting}
                  />
                </label>
              </div>
              
              {previewImage && (
                <div className="image-preview" style={{ display: 'block' }}>
                  <img src={previewImage} alt="Profile preview" />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={removeImage}
                    disabled={submitting}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Socialiniai tinklai</label>
              <div className="social-links-form">
                <div className="social-input">
                  <label htmlFor="email">El. paštas</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.social.email}
                    onChange={handleSocialChange}
                    disabled={submitting}
                  />
                </div>
                
                <div className="social-input">
                  <label htmlFor="instagram">Instagram</label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    className="form-control"
                    value={formData.social.instagram}
                    onChange={handleSocialChange}
                    disabled={submitting}
                  />
                </div>
                
                <div className="social-input">
                  <label htmlFor="facebook">Facebook</label>
                  <input
                    type="text"
                    id="facebook"
                    name="facebook"
                    className="form-control"
                    value={formData.social.facebook}
                    onChange={handleSocialChange}
                    disabled={submitting}
                  />
                </div>
                
                <div className="social-input">
                  <label htmlFor="pinterest">Pinterest</label>
                  <input
                    type="text"
                    id="pinterest"
                    name="pinterest"
                    className="form-control"
                    value={formData.social.pinterest}
                    onChange={handleSocialChange}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Sekcijos</label>
              
              {formData.sections.map((section, index) => (
                <div key={index} className="section-item">
                  <div className="section-header">
                    <h3>Sekcija {index + 1}</h3>
                    <button
                      type="button"
                      className="remove-section-btn"
                      onClick={() => removeSection(index)}
                      disabled={submitting || formData.sections.length <= 1}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`section-title-${index}`}>Pavadinimas</label>
                    <input
                      type="text"
                      id={`section-title-${index}`}
                      className="form-control"
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`section-content-${index}`}>Turinys</label>
                    <textarea
                      id={`section-content-${index}`}
                      className="form-control"
                      rows="6"
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      required
                      disabled={submitting}
                    ></textarea>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="add-section-btn"
                onClick={addSection}
                disabled={submitting}
              >
                <i className="fas fa-plus"></i> Pridėti sekciją
              </button>
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Išsaugoma...' : 'Išsaugoti pakeitimus'}
              </button>
              
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/admin')}
                disabled={submitting}
              >
                Atšaukti
              </button>
            </div>
          </form>
        </div>
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

export default AdminAbout;