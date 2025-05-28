// src/utils/api.js
import { db, storage } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import DOMPurify from 'dompurify';

// Input validation utilities
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  // Remove any potential XSS threats
  return DOMPurify.sanitize(text.trim(), { ALLOWED_TAGS: [] });
};

const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  // Allow basic formatting tags
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

const validateRecipeData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.length < 3 || data.title.length > 200) {
    errors.push('Title must be between 3 and 200 characters');
  }
  
  if (data.intro && data.intro.length > 500) {
    errors.push('Introduction must be less than 500 characters');
  }
  
  if (data.ingredients) {
    if (!Array.isArray(data.ingredients)) {
      errors.push('Ingredients must be an array');
    } else if (data.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else if (data.ingredients.some(ing => typeof ing !== 'string' || ing.length > 200)) {
      errors.push('Each ingredient must be a string less than 200 characters');
    }
  }
  
  if (data.steps) {
    if (!Array.isArray(data.steps)) {
      errors.push('Steps must be an array');
    } else if (data.steps.length === 0) {
      errors.push('At least one step is required');
    } else if (data.steps.some(step => typeof step !== 'string' || step.length > 1000)) {
      errors.push('Each step must be a string less than 1000 characters');
    }
  }
  
  if (data.prep_time !== undefined && (!Number.isInteger(Number(data.prep_time)) || Number(data.prep_time) < 0 || Number(data.prep_time) > 1440)) {
    errors.push('Prep time must be between 0 and 1440 minutes');
  }
  
  if (data.cook_time !== undefined && (!Number.isInteger(Number(data.cook_time)) || Number(data.cook_time) < 0 || Number(data.cook_time) > 1440)) {
    errors.push('Cook time must be between 0 and 1440 minutes');
  }
  
  if (data.servings !== undefined && (!Number.isInteger(Number(data.servings)) || Number(data.servings) < 1 || Number(data.servings) > 100)) {
    errors.push('Servings must be between 1 and 100');
  }
  
  if (data.categories && Array.isArray(data.categories)) {
    const allowedCategories = [
      'Gėrimai ir kokteiliai', 'Desertai', 'Sriubos', 'Užkandžiai',
      'Varškė', 'Kiaušiniai', 'Daržovės', 'Bulvės',
      'Mėsa', 'Žuvis ir jūros gėrybės', 'Kruopos ir grūdai',
      'Be glitimo', 'Be laktozės', 'Gamta lėkštėje', 'Iš močiutės virtuvės'
    ];
    
    if (data.categories.some(cat => !allowedCategories.includes(cat))) {
      errors.push('Invalid category selected');
    }
  }
  
  if (data.status && !['draft', 'published'].includes(data.status)) {
    errors.push('Status must be either draft or published');
  }
  
  return errors;
};

const validateImageFile = (file) => {
  const errors = [];
  
  if (!file) return errors;
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.');
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }
  
  return errors;
};

class SecureFirebaseAPI {
  // Rate limiting for client-side
  constructor() {
    this.requestCounts = new Map();
    this.resetInterval = 60000; // 1 minute
    this.maxRequests = 100;
    
    // Reset counts every minute
    setInterval(() => {
      this.requestCounts.clear();
    }, this.resetInterval);
  }
  
  // Check rate limit
  checkRateLimit(endpoint) {
    const count = this.requestCounts.get(endpoint) || 0;
    if (count >= this.maxRequests) {
      throw new Error('Too many requests. Please try again later.');
    }
    this.requestCounts.set(endpoint, count + 1);
  }
  
  // Secure image upload
  async uploadImage(file, folder = 'recipes') {
    try {
      // Validate file
      const validationErrors = validateImageFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      // Generate secure filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop().toLowerCase();
      const fileName = `${timestamp}-${randomString}.${extension}`;
      
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        fileName,
        url: downloadURL
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
  
  // Get recipes with pagination and filtering
  async getRecipes(params = {}) {
    try {
      this.checkRateLimit('getRecipes');
      
      const recipesRef = collection(db, 'recipes');
      const constraints = [];
      
      // Validate and sanitize parameters
      if (params.category && typeof params.category === 'string') {
        const sanitizedCategory = sanitizeText(params.category);
        constraints.push(where('categories', 'array-contains', sanitizedCategory));
      }
      
      if (params.status && ['published', 'draft', 'all'].includes(params.status)) {
        if (params.status !== 'all') {
          constraints.push(where('status', '==', params.status));
        }
      } else if (!params.isAdmin) {
        // Only show published recipes for public views
        constraints.push(where('status', '==', 'published'));
      }
      
      constraints.push(orderBy('created_at', 'desc'));
      
      // Validate page limit
      const pageLimit = Math.min(Math.max(1, parseInt(params.limit) || 12), 50);
      constraints.push(limit(pageLimit));
      
      const q = query(recipesRef, ...constraints);
      const snapshot = await getDocs(q);
      const recipes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: recipes,
        meta: {
          has_more: recipes.length === pageLimit,
          total: recipes.length,
          page: Math.max(1, parseInt(params.page) || 1),
          limit: pageLimit
        }
      };
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }
  
  // Get single recipe
  async getRecipe(id) {
    try {
      this.checkRateLimit('getRecipe');
      
      // Validate ID format
      if (!id || typeof id !== 'string' || id.length > 50) {
        return {
          success: false,
          error: 'Invalid recipe ID'
        };
      }
      
      const recipeDoc = await getDoc(doc(db, 'recipes', id));
      
      if (!recipeDoc.exists()) {
        return {
          success: false,
          error: 'Recipe not found'
        };
      }
      
      return {
        success: true,
        data: {
          id: recipeDoc.id,
          ...recipeDoc.data()
        }
      };
    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  }
  
  // Add comment with validation
  async addRecipeComment(recipeId, commentData) {
    try {
      this.checkRateLimit('addComment');
      
      // Validate recipe ID
      if (!recipeId || typeof recipeId !== 'string') {
        throw new Error('Invalid recipe ID');
      }
      
      // Validate comment data
      if (!commentData.author || !commentData.content) {
        throw new Error('Author and content are required');
      }
      
      if (commentData.author.length > 100) {
        throw new Error('Author name must be less than 100 characters');
      }
      
      if (commentData.content.length > 1000) {
        throw new Error('Comment must be less than 1000 characters');
      }
      
      // Sanitize inputs
      const sanitizedComment = {
        author: sanitizeText(commentData.author),
        content: sanitizeText(commentData.content),
        email: commentData.email ? (validateEmail(commentData.email) ? commentData.email : '') : '',
        created_at: new Date().toISOString(),
        status: 'approved'
      };
      
      const commentsRef = collection(db, 'recipes', recipeId, 'comments');
      const docRef = await addDoc(commentsRef, sanitizedComment);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...sanitizedComment
        }
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
  
  // Create recipe with validation
  async createRecipe(recipeData, imageFile = null) {
    try {
      this.checkRateLimit('createRecipe');
      
      // Validate recipe data
      const validationErrors = validateRecipeData(recipeData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      let imageData = null;
      
      // Upload image if provided
      if (imageFile) {
        imageData = await this.uploadImage(imageFile, 'recipes');
      }
      
      // Sanitize all text inputs
      const sanitizedRecipe = {
        title: sanitizeText(recipeData.title),
        intro: sanitizeText(recipeData.intro || ''),
        categories: recipeData.categories || [],
        ingredients: (recipeData.ingredients || []).map(ing => sanitizeText(ing)),
        steps: (recipeData.steps || []).map(step => sanitizeText(step)),
        tags: (recipeData.tags || []).map(tag => sanitizeText(tag)),
        prep_time: parseInt(recipeData.prep_time) || 0,
        cook_time: parseInt(recipeData.cook_time) || 0,
        servings: parseInt(recipeData.servings) || 1,
        notes: sanitizeText(recipeData.notes || ''),
        status: recipeData.status || 'draft',
        image: imageData?.url || null,
        imagePath: imageData ? `recipes/${imageData.fileName}` : null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'recipes'), sanitizedRecipe);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...sanitizedRecipe,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }
  
  // Update recipe with validation
  async updateRecipe(id, recipeData, imageFile = null) {
    try {
      this.checkRateLimit('updateRecipe');
      
      // Validate ID
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid recipe ID');
      }
      
      // Validate recipe data
      const validationErrors = validateRecipeData(recipeData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      const recipeRef = doc(db, 'recipes', id);
      const existingRecipe = await getDoc(recipeRef);
      
      if (!existingRecipe.exists()) {
        return {
          success: false,
          error: 'Recipe not found'
        };
      }
      
      // Sanitize inputs
      let updateData = {
        title: sanitizeText(recipeData.title),
        intro: sanitizeText(recipeData.intro || ''),
        categories: recipeData.categories || [],
        ingredients: (recipeData.ingredients || []).map(ing => sanitizeText(ing)),
        steps: (recipeData.steps || []).map(step => sanitizeText(step)),
        tags: (recipeData.tags || []).map(tag => sanitizeText(tag)),
        prep_time: parseInt(recipeData.prep_time) || 0,
        cook_time: parseInt(recipeData.cook_time) || 0,
        servings: parseInt(recipeData.servings) || 1,
        notes: sanitizeText(recipeData.notes || ''),
        status: recipeData.status || 'draft',
        updated_at: serverTimestamp()
      };
      
      // Handle image update
      if (imageFile) {
        // Delete old image if exists
        const oldImagePath = existingRecipe.data().imagePath;
        if (oldImagePath) {
          try {
            await this.deleteImage(oldImagePath);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
        
        // Upload new image
        const imageData = await this.uploadImage(imageFile, 'recipes');
        updateData.image = imageData.url;
        updateData.imagePath = `recipes/${imageData.fileName}`;
      }
      
      await updateDoc(recipeRef, updateData);
      
      return {
        success: true,
        data: {
          id,
          ...updateData,
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }
  
  // Newsletter subscription with validation
  async subscribeToNewsletter(email) {
    try {
      this.checkRateLimit('subscribeNewsletter');
      
      // Validate email
      if (!email || !validateEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const existingQuery = query(subscribersRef, where('email', '==', email));
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        return {
          success: true,
          message: 'Šis el. pašto adresas jau užprenumeruotas naujienlaiškį.'
        };
      }
      
      await addDoc(subscribersRef, {
        email: email.toLowerCase().trim(),
        subscribed_at: new Date().toISOString(),
        active: true,
        ip_address: 'hidden', // Don't store actual IP for privacy
        user_agent: 'hidden' // Don't store user agent for privacy
      });
      
      return {
        success: true,
        message: 'Ačiū už prenumeratą! Naujienlaiškis bus siunčiamas adresu: ' + email
      };
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw error;
    }
  }
  
  // Update about data with validation
  async updateAboutData(aboutData, mainImageFile = null, sidebarImageFile = null) {
    try {
      this.checkRateLimit('updateAbout');
      
      // Validate about data
      if (!aboutData.title || aboutData.title.length > 200) {
        throw new Error('Title is required and must be less than 200 characters');
      }
      
      let updateData = {
        title: sanitizeText(aboutData.title),
        subtitle: sanitizeText(aboutData.subtitle || ''),
        intro: sanitizeText(aboutData.intro || ''),
        sections: [],
        social: {
          email: validateEmail(aboutData.social?.email) ? aboutData.social.email : '',
          instagram: sanitizeText(aboutData.social?.instagram || ''),
          facebook: sanitizeText(aboutData.social?.facebook || ''),
          pinterest: sanitizeText(aboutData.social?.pinterest || '')
        }
      };
      
      // Validate and sanitize sections
      if (aboutData.sections && Array.isArray(aboutData.sections)) {
        updateData.sections = aboutData.sections
          .filter(section => section.title && section.content)
          .map(section => ({
            title: sanitizeText(section.title).substring(0, 200),
            content: sanitizeText(section.content).substring(0, 5000)
          }));
      }
      
      // Handle image uploads
      if (mainImageFile) {
        const imageData = await this.uploadImage(mainImageFile, 'about');
        updateData.image = imageData.url;
        updateData.imagePath = `about/${imageData.fileName}`;
      } else if (aboutData.image) {
        updateData.image = aboutData.image;
        updateData.imagePath = aboutData.imagePath;
      }
      
      if (sidebarImageFile) {
        const imageData = await this.uploadImage(sidebarImageFile, 'about');
        updateData.sidebar_image = imageData.url;
        updateData.sidebarImagePath = `about/${imageData.fileName}`;
      } else if (aboutData.sidebar_image) {
        updateData.sidebar_image = aboutData.sidebar_image;
        updateData.sidebarImagePath = aboutData.sidebarImagePath;
      }
      
      await setDoc(doc(db, 'settings', 'about'), updateData);
      
      return {
        success: true,
        data: updateData
      };
    } catch (error) {
      console.error('Error updating about data:', error);
      throw error;
    }
  }
  
  // Other methods remain similar but with added validation...
  
  // Helper method to delete image
  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error if image doesn't exist
    }
  }
}

// Create secure API instance
const secureFirebaseAPI = new SecureFirebaseAPI();

// Export unified API interface with security wrapper
export const api = {
  firebaseAPI: secureFirebaseAPI,
  
  // Wrap all methods with error handling
  get: async (endpoint, config = {}) => {
    try {
      // Add request validation here
      return await secureFirebaseAPI.handleGetRequest(endpoint, config);
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: {
          success: false,
          error: error.message || 'An error occurred'
        }
      };
    }
  },
  
  post: async (endpoint, data) => {
    try {
      // Add request validation here
      return await secureFirebaseAPI.handlePostRequest(endpoint, data);
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: {
          success: false,
          error: error.message || 'An error occurred'
        }
      };
    }
  },
  
  put: async (endpoint, data) => {
    try {
      // Add request validation here
      return await secureFirebaseAPI.handlePutRequest(endpoint, data);
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: {
          success: false,
          error: error.message || 'An error occurred'
        }
      };
    }
  },
  
  delete: async (endpoint) => {
    try {
      // Add request validation here
      return await secureFirebaseAPI.handleDeleteRequest(endpoint);
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: {
          success: false,
          error: error.message || 'An error occurred'
        }
      };
    }
  }
};

// Add request handlers to SecureFirebaseAPI class
SecureFirebaseAPI.prototype.handleGetRequest = async function(endpoint, config) {
  // Implementation remains the same as in original api.js but with added validation
  if (endpoint.includes('/recipes') && endpoint.split('/').length === 2) {
    return { data: await this.getRecipes(config.params || {}) };
  } else if (endpoint.match(/\/recipes\/[\w-]+\/comments$/)) {
    const parts = endpoint.split('/');
    const recipeId = parts[parts.length - 2];
    return { data: await this.getRecipeComments(recipeId) };
  }
  // ... rest of the endpoints
  
  throw new Error(`Endpoint not implemented: ${endpoint}`);
};

// Similar implementations for handlePostRequest, handlePutRequest, handleDeleteRequest...