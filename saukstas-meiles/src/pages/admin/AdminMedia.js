import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import AdminHeader from '../../components/admin/AdminHeader';
import Notification from '../../components/admin/Notification';
import '../../styles/admin/AdminMedia.css';

const AdminMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/media');
      
      if (response.data.success) {
        setMedia(response.data.data);
      } else {
        setError('Nepavyko įkelti nuotraukų.');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      setError('Klaida įkeliant nuotraukas. Bandykite vėliau.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = files.length;
      let uploadedCount = 0;
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.post('/admin/media/upload', formData);
        
        if (response.data.success) {
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
        }
      }
      
      setNotification({
        title: 'Sėkmė',
        message: `Įkelta ${uploadedCount} iš ${totalFiles} nuotraukų.`,
        type: 'success'
      });
      
      // Refresh media list
      fetchMedia();
    } catch (error) {
      console.error('Error uploading images:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida įkeliant nuotraukas. Bandykite vėliau.',
        type: 'error'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDelete = async (mediaItem) => {
    if (!window.confirm('Ar tikrai norite ištrinti šią nuotrauką?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/admin/media/${mediaItem.id}`);
      
      if (response.data.success) {
        setNotification({
          title: 'Sėkmė',
          message: 'Nuotrauka ištrinta.',
          type: 'success'
        });
        fetchMedia();
      } else {
        setNotification({
          title: 'Klaida',
          message: response.data.error || 'Klaida trinant nuotrauką.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      setNotification({
        title: 'Klaida',
        message: 'Klaida trinant nuotrauką. Bandykite vėliau.',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div id="admin-media">
      <AdminHeader activePage="media" />
      
      <main className="admin-main container">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Nuotraukos</h2>
          <div className="media-upload-wrapper">
            <input 
              type="file" 
              id="media-upload" 
              multiple 
              accept="image/*"
              onChange={handleImageUpload}
              className="media-upload-input"
              disabled={uploading}
            />
            <label htmlFor="media-upload" className="submit-button">
              <i className="fas fa-upload"></i> Įkelti nuotraukas
            </label>
          </div>
        </div>
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Įkeliama... {Math.round(uploadProgress)}%</p>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Įkeliama...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : media.length === 0 ? (
          <div className="no-media">
            <i className="fas fa-images"></i>
            <p>Nėra įkeltų nuotraukų.</p>
            <p>Įkelkite nuotraukas naudodami mygtuką viršuje.</p>
          </div>
        ) : (
          <div className="media-grid">
            {media.map(item => (
              <div key={item.id} className="media-item">
                <div 
                  className="media-image"
                  onClick={() => setSelectedImage(item)}
                >
                  <img src={item.url} alt={item.name || 'Nuotrauka'} />
                  <div className="media-overlay">
                    <i className="fas fa-search-plus"></i>
                  </div>
                </div>
                
                <div className="media-info">
                  <div className="media-name">{item.name || 'Nepavadinta'}</div>
                  <div className="media-meta">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  {item.usedIn && (
                    <div className="media-usage">
                      Naudojama: <span>{item.usedIn}</span>
                    </div>
                  )}
                </div>
                
                <div className="media-actions">
                  <button 
                    className="action-btn copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                      setNotification({
                        title: 'Nukopijuota',
                        message: 'Nuoroda nukopijuota į iškarpinę.',
                        type: 'success'
                      });
                    }}
                    title="Kopijuoti nuorodą"
                  >
                    <i className="fas fa-link"></i>
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(item)}
                    title="Ištrinti"
                    disabled={item.usedIn}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="media-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.url} alt={selectedImage.name || 'Nuotrauka'} />
            <button 
              className="modal-close"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="modal-info">
              <h3>{selectedImage.name || 'Nepavadinta'}</h3>
              <p>Dydis: {formatFileSize(selectedImage.size)}</p>
              <p>Įkelta: {formatDate(selectedImage.created_at)}</p>
              {selectedImage.usedIn && <p>Naudojama: {selectedImage.usedIn}</p>}
              <div className="modal-actions">
                <button 
                  className="submit-button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedImage.url);
                    setNotification({
                      title: 'Nukopijuota',
                      message: 'Nuoroda nukopijuota į iškarpinę.',
                      type: 'success'
                    });
                  }}
                >
                  <i className="fas fa-link"></i> Kopijuoti nuorodą
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

export default AdminMedia;