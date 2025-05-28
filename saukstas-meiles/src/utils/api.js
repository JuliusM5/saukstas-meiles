// src/utils/api.js - Complete implementation
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
  return DOMPurify.sanitize(text.trim(), { ALLOWED_TAGS: [] });
};

const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
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
  
  if (data.ingredients && !Array.isArray(data.ingredients)) {
    errors.push('Ingredients must be an array');
  }
  
  if (data.steps && !Array.isArray(data.steps)) {
    errors.push('Steps must be an array');
  }
  
  if (data.prep_time !== undefined && (!Number.isInteger(Number(data.prep_time)) || Number(data.prep_time) < 0)) {
    errors.push('Prep time must be a positive integer');
  }
  
  if (data.cook_time !== undefined && (!Number.isInteger(Number(data.cook_time)) || Number(data.cook_time) < 0)) {
    errors.push('Cook time must be a positive integer');
  }
  
  if (data.servings !== undefined && (!Number.isInteger(Number(data.servings)) || Number(data.servings) < 1)) {
    errors.push('Servings must be a positive integer');
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
  constructor() {
    this.requestCounts = new Map();
    this.resetInterval = 60000; // 1 minute
    this.maxRequests = 100;
    
    setInterval(() => {
      this.requestCounts.clear();
    }, this.resetInterval);
  }
  
  checkRateLimit(endpoint) {
    const count = this.requestCounts.get(endpoint) || 0;
    if (count >= this.maxRequests) {
      throw new Error('Too many requests. Please try again later.');
    }
    this.requestCounts.set(endpoint, count + 1);
  }
  
  async uploadImage(file, folder = 'recipes') {
    try {
      const validationErrors = validateImageFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
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
  
  async getRecipes(params = {}) {
    try {
      this.checkRateLimit('getRecipes');
      
      const recipesRef = collection(db, 'recipes');
      const constraints = [];
      
      if (params.category && typeof params.category === 'string') {
        const sanitizedCategory = sanitizeText(params.category);
        constraints.push(where('categories', 'array-contains', sanitizedCategory));
      }
      
      if (params.status && ['published', 'draft', 'all'].includes(params.status)) {
        if (params.status !== 'all') {
          constraints.push(where('status', '==', params.status));
        }
      } else if (!params.isAdmin) {
        constraints.push(where('status', '==', 'published'));
      }
      
      constraints.push(orderBy('created_at', 'desc'));
      
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
  
  async getRecipe(id) {
    try {
      this.checkRateLimit('getRecipe');
      
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
  
  async getCategories() {
    try {
      this.checkRateLimit('getCategories');
      
      const recipesRef = collection(db, 'recipes');
      const q = query(recipesRef, where('status', '==', 'published'));
      const snapshot = await getDocs(q);
      
      const categoriesMap = new Map();
      
      // Predefined categories
      const allCategories = [
        'Gėrimai ir kokteiliai', 'Desertai', 'Sriubos', 'Užkandžiai',
        'Varškė', 'Kiaušiniai', 'Daržovės', 'Bulvės',
        'Mėsa', 'Žuvis ir jūros gėrybės', 'Kruopos ir grūdai',
        'Be glitimo', 'Be laktozės', 'Gamta lėkštėje', 'Iš močiutės virtuvės'
      ];
      
      // Initialize all categories with 0 count
      allCategories.forEach(cat => categoriesMap.set(cat, 0));
      
      // Count recipes per category
      snapshot.docs.forEach(doc => {
        const recipe = doc.data();
        if (recipe.categories && Array.isArray(recipe.categories)) {
          recipe.categories.forEach(category => {
            if (allCategories.includes(category)) {
              categoriesMap.set(category, (categoriesMap.get(category) || 0) + 1);
            }
          });
        }
      });
      
      // Convert to array format
      const categories = Array.from(categoriesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .filter(cat => cat.count > 0)
        .sort((a, b) => b.count - a.count);
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
  
  async getAboutData() {
    try {
      this.checkRateLimit('getAboutData');
      
      const aboutDoc = await getDoc(doc(db, 'settings', 'about'));
      
      if (!aboutDoc.exists()) {
        // Return default data if not set
        return {
          success: true,
          data: {
            title: 'Apie Mane',
            subtitle: 'Kelionė į širdį per maistą, pilną gamtos dovanų, švelnumo ir paprastumo',
            intro: 'Sveiki, esu Lidija – keliaujanti miško takeliais, pievomis ir laukais...',
            sections: [],
            social: {
              email: 'info@saukstas-meiles.lt',
              instagram: '#',
              facebook: '#',
              pinterest: '#'
            }
          }
        };
      }
      
      return {
        success: true,
        data: aboutDoc.data()
      };
    } catch (error) {
      console.error('Error fetching about data:', error);
      throw error;
    }
  }
  
  async getRecipeComments(recipeId) {
    try {
      this.checkRateLimit('getComments');
      
      if (!recipeId || typeof recipeId !== 'string') {
        throw new Error('Invalid recipe ID');
      }
      
      const commentsRef = collection(db, 'recipes', recipeId, 'comments');
      const q = query(commentsRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: comments
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }
  
  async addRecipeComment(recipeId, commentData) {
    try {
      this.checkRateLimit('addComment');
      
      if (!recipeId || typeof recipeId !== 'string') {
        throw new Error('Invalid recipe ID');
      }
      
      if (!commentData.author || !commentData.content) {
        throw new Error('Author and content are required');
      }
      
      if (commentData.author.length > 100) {
        throw new Error('Author name must be less than 100 characters');
      }
      
      if (commentData.content.length > 1000) {
        throw new Error('Comment must be less than 1000 characters');
      }
      
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
  
  async subscribeToNewsletter(email) {
    try {
      this.checkRateLimit('subscribeNewsletter');
      
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
        active: true
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
  
  async unsubscribeFromNewsletter(email) {
    try {
      this.checkRateLimit('unsubscribeNewsletter');
      
      if (!email || !validateEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = query(subscribersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          success: false,
          message: 'Šis el. pašto adresas nėra prenumeruojamas naujienlaiškį.'
        };
      }
      
      // Update subscriber to inactive
      const subscriberDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'newsletter_subscribers', subscriberDoc.id), {
        active: false,
        unsubscribed_at: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Sėkmingai atsisakėte naujienlaiškio prenumeratos.'
      };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }
  
  async getDashboardStats() {
    try {
      this.checkRateLimit('getDashboardStats');
      
      // Get recipes count
      const recipesSnapshot = await getDocs(collection(db, 'recipes'));
      const publishedRecipes = recipesSnapshot.docs.filter(doc => doc.data().status === 'published');
      
      // Get comments count
      let totalComments = 0;
      for (const recipeDoc of recipesSnapshot.docs) {
        const commentsSnapshot = await getDocs(collection(db, 'recipes', recipeDoc.id, 'comments'));
        totalComments += commentsSnapshot.size;
      }
      
      // Get recent recipes
      const recentRecipesQuery = query(
        collection(db, 'recipes'),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      const recentRecipesSnapshot = await getDocs(recentRecipesQuery);
      const recentRecipes = recentRecipesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get recent comments
      const recentComments = [];
      for (const recipeDoc of recipesSnapshot.docs) {
        const recipeData = recipeDoc.data();
        const commentsQuery = query(
          collection(db, 'recipes', recipeDoc.id, 'comments'),
          orderBy('created_at', 'desc'),
          limit(1)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        
        commentsSnapshot.docs.forEach(commentDoc => {
          recentComments.push({
            id: commentDoc.id,
            recipe_id: recipeDoc.id,
            recipe_title: recipeData.title,
            ...commentDoc.data()
          });
        });
      }
      
      // Sort and limit recent comments
      recentComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return {
        success: true,
        data: {
          recipes: {
            total: recipesSnapshot.size,
            published: publishedRecipes.length,
            draft: recipesSnapshot.size - publishedRecipes.length
          },
          comments: {
            total: totalComments
          },
          media: {
            total: 0 // Implement if needed
          },
          recent_recipes: recentRecipes,
          recent_comments: recentComments.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
  
  // Request handlers
  async handleGetRequest(endpoint, config) {
    // Handle recipes endpoints
    if (endpoint === '/recipes') {
      return { data: await this.getRecipes(config.params || {}) };
    } else if (endpoint.match(/^\/recipes\/[\w-]+$/)) {
      const id = endpoint.split('/').pop();
      return { data: await this.getRecipe(id) };
    } else if (endpoint.match(/^\/recipes\/[\w-]+\/comments$/)) {
      const parts = endpoint.split('/');
      const recipeId = parts[parts.length - 2];
      return { data: await this.getRecipeComments(recipeId) };
    }
    
    // Handle categories
    else if (endpoint === '/categories') {
      return { data: await this.getCategories() };
    }
    
    // Handle about endpoint
    else if (endpoint === '/api/about') {
      return { data: await this.getAboutData() };
    }
    
    // Handle admin endpoints
    else if (endpoint === '/admin/about') {
      return { data: await this.getAboutData() };
    } else if (endpoint === '/admin/recipes') {
      return { data: await this.getRecipes({ ...config.params, isAdmin: true }) };
    } else if (endpoint.match(/^\/admin\/recipes\/[\w-]+$/)) {
      const id = endpoint.split('/').pop();
      return { data: await this.getRecipe(id) };
    } else if (endpoint === '/admin/comments') {
      // Get all comments from all recipes
      const recipesSnapshot = await getDocs(collection(db, 'recipes'));
      const allComments = [];
      
      for (const recipeDoc of recipesSnapshot.docs) {
        const recipeData = recipeDoc.data();
        const commentsSnapshot = await getDocs(collection(db, 'recipes', recipeDoc.id, 'comments'));
        
        commentsSnapshot.docs.forEach(commentDoc => {
          allComments.push({
            id: commentDoc.id,
            recipeId: recipeDoc.id,
            recipeTitle: recipeData.title,
            ...commentDoc.data()
          });
        });
      }
      
      return {
        data: {
          success: true,
          data: allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
      };
    } else if (endpoint === '/admin/newsletter/subscribers') {
      const subscribersSnapshot = await getDocs(collection(db, 'newsletter_subscribers'));
      const subscribers = subscribersSnapshot.docs
        .map(doc => doc.data())
        .filter(sub => sub.active)
        .map(sub => sub.email);
      
      return {
        data: {
          success: true,
          data: subscribers
        }
      };
    } else if (endpoint === '/admin/dashboard/stats' || endpoint === '/admin/getDashboardStats') {
      return { data: await this.getDashboardStats() };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  }
  
  async handlePostRequest(endpoint, data) {
    if (endpoint === '/api/newsletter/subscribe') {
      return { data: await this.subscribeToNewsletter(data.email) };
    } else if (endpoint.match(/^\/recipes\/[\w-]+\/comments$/)) {
      const parts = endpoint.split('/');
      const recipeId = parts[parts.length - 2];
      return { data: await this.addRecipeComment(recipeId, data) };
    } else if (endpoint === '/admin/recipes') {
      return { data: await this.createRecipe(data.recipeData, data.imageFile) };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  }
  
  async handlePutRequest(endpoint, data) {
    if (endpoint === '/admin/about') {
      return { data: await this.updateAboutData(data.aboutData, data.mainImageFile, data.sidebarImageFile) };
    } else if (endpoint.match(/^\/admin\/recipes\/[\w-]+$/)) {
      const id = endpoint.split('/').pop();
      return { data: await this.updateRecipe(id, data.recipeData, data.imageFile) };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  }
  
  async handleDeleteRequest(endpoint) {
    if (endpoint.match(/^\/admin\/recipes\/[\w-]+$/)) {
      const id = endpoint.split('/').pop();
      await deleteDoc(doc(db, 'recipes', id));
      return { data: { success: true, message: 'Recipe deleted successfully' } };
    } else if (endpoint.match(/^\/recipes\/[\w-]+\/comments\/[\w-]+$/)) {
      const parts = endpoint.split('/');
      const commentId = parts.pop();
      const recipeId = parts[parts.length - 2];
      await deleteDoc(doc(db, 'recipes', recipeId, 'comments', commentId));
      return { data: { success: true, message: 'Comment deleted successfully' } };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  }
  
  // CRUD operations
  async createRecipe(recipeData, imageFile = null) {
    try {
      this.checkRateLimit('createRecipe');
      
      const validationErrors = validateRecipeData(recipeData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      let imageData = null;
      
      if (imageFile) {
        imageData = await this.uploadImage(imageFile, 'recipes');
      }
      
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
  
  async updateRecipe(id, recipeData, imageFile = null) {
    try {
      this.checkRateLimit('updateRecipe');
      
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid recipe ID');
      }
      
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
      
      if (imageFile) {
        const oldImagePath = existingRecipe.data().imagePath;
        if (oldImagePath) {
          try {
            await this.deleteImage(oldImagePath);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
        
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
  
  async updateAboutData(aboutData, mainImageFile = null, sidebarImageFile = null) {
    try {
      this.checkRateLimit('updateAbout');
      
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
      
      if (aboutData.sections && Array.isArray(aboutData.sections)) {
        updateData.sections = aboutData.sections
          .filter(section => section.title && section.content)
          .map(section => ({
            title: sanitizeText(section.title).substring(0, 200),
            content: sanitizeText(section.content).substring(0, 5000)
          }));
      }
      
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
  
  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}

// Create secure API instance
const secureFirebaseAPI = new SecureFirebaseAPI();

// Export unified API interface
export const api = {
  firebaseAPI: secureFirebaseAPI,
  
  get: async (endpoint, config = {}) => {
    try {
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