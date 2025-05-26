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

// Check if we should use Firebase
const USE_FIREBASE = true; // Always use Firebase now

class FirebaseAPI {
  // Upload image to Firebase Storage
  async uploadImage(file, folder = 'recipes') {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
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
  
  // Delete image from Firebase Storage
  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error if image doesn't exist
    }
  }
  
  // Get recipes with pagination and filtering
  async getRecipes(params = {}) {
    try {
      const recipesRef = collection(db, 'recipes');
      const constraints = [];
      
      if (params.category) {
        constraints.push(where('categories', 'array-contains', params.category));
      }
      
      if (params.status && params.status !== 'all') {
        constraints.push(where('status', '==', params.status));
      }
      
      // Only show published recipes for public views
      if (!params.isAdmin) {
        constraints.push(where('status', '==', 'published'));
      }
      
      constraints.push(orderBy('created_at', 'desc'));
      
      const pageLimit = params.limit || 12;
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
          page: params.page || 1,
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
  
  // Get comments for a recipe
  async getRecipeComments(recipeId) {
    try {
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
      return {
        success: true,
        data: [] // Return empty array on error
      };
    }
  }
  
  // Add comment to recipe
  async addRecipeComment(recipeId, commentData) {
    try {
      const commentsRef = collection(db, 'recipes', recipeId, 'comments');
      const newComment = {
        ...commentData,
        created_at: serverTimestamp(),
        status: 'pending' // Comments need approval
      };
      
      const docRef = await addDoc(commentsRef, newComment);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newComment,
          created_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
  
  // Create recipe
  async createRecipe(recipeData, imageFile = null) {
    try {
      let imageData = null;
      
      // Upload image if provided
      if (imageFile) {
        imageData = await this.uploadImage(imageFile, 'recipes');
      }
      
      const newRecipe = {
        ...recipeData,
        image: imageData?.url || null,
        imagePath: imageData ? `recipes/${imageData.fileName}` : null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'recipes'), newRecipe);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newRecipe,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }
  
  // Update recipe
  async updateRecipe(id, recipeData, imageFile = null) {
    try {
      const recipeRef = doc(db, 'recipes', id);
      const existingRecipe = await getDoc(recipeRef);
      
      if (!existingRecipe.exists()) {
        return {
          success: false,
          error: 'Recipe not found'
        };
      }
      
      let updateData = {
        ...recipeData,
        updated_at: serverTimestamp()
      };
      
      // Handle image update
      if (imageFile) {
        // Delete old image if exists
        const oldImagePath = existingRecipe.data().imagePath;
        if (oldImagePath) {
          await this.deleteImage(oldImagePath);
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
  
  // Delete recipe
  async deleteRecipe(id) {
    try {
      const recipeRef = doc(db, 'recipes', id);
      const recipeDoc = await getDoc(recipeRef);
      
      if (!recipeDoc.exists()) {
        return {
          success: false,
          error: 'Recipe not found'
        };
      }
      
      // Delete image if exists
      const imagePath = recipeDoc.data().imagePath;
      if (imagePath) {
        await this.deleteImage(imagePath);
      }
      
      await deleteDoc(recipeRef);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
  
  // Get categories
  async getCategories() {
    try {
      const recipesSnapshot = await getDocs(collection(db, 'recipes'));
      const categoriesMap = {};
      
      recipesSnapshot.docs.forEach(doc => {
        const recipe = doc.data();
        if (recipe.categories && Array.isArray(recipe.categories)) {
          recipe.categories.forEach(category => {
            if (category) {
              categoriesMap[category] = (categoriesMap[category] || 0) + 1;
            }
          });
        }
      });
      
      const categoriesArray = Object.keys(categoriesMap).map(name => ({
        name,
        count: categoriesMap[name]
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      return {
        success: true,
        data: categoriesArray
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
  
  // Get about data
  async getAboutData() {
    try {
      const aboutDoc = await getDoc(doc(db, 'settings', 'about'));
      
      if (!aboutDoc.exists()) {
        return {
          success: true,
          data: this.getDefaultAboutData()
        };
      }
      
      return {
        success: true,
        data: aboutDoc.data()
      };
    } catch (error) {
      console.error('Error fetching about data:', error);
      return {
        success: true,
        data: this.getDefaultAboutData()
      };
    }
  }
  
  // Update about data
  async updateAboutData(aboutData, mainImageFile = null, sidebarImageFile = null) {
    try {
      let updateData = { ...aboutData };
      
      // Handle main image upload
      if (mainImageFile) {
        const imageData = await this.uploadImage(mainImageFile, 'about');
        updateData.image = imageData.url;
        updateData.imagePath = `about/${imageData.fileName}`;
      }
      
      // Handle sidebar image upload
      if (sidebarImageFile) {
        const imageData = await this.uploadImage(sidebarImageFile, 'about');
        updateData.sidebar_image = imageData.url;
        updateData.sidebarImagePath = `about/${imageData.fileName}`;
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
  
  // Newsletter subscription
  async subscribeToNewsletter(email) {
    try {
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
        email,
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
  
  // Get newsletter subscribers
  async getNewsletterSubscribers() {
    try {
      const subscribersSnapshot = await getDocs(collection(db, 'newsletter_subscribers'));
      const subscribers = subscribersSnapshot.docs
        .map(doc => doc.data())
        .filter(sub => sub.active)
        .map(sub => sub.email);
      
      return {
        success: true,
        data: subscribers
      };
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }
  }
  
  // Delete newsletter subscriber
  async deleteNewsletterSubscriber(email) {
    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = query(subscribersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          success: false,
          error: 'Prenumeratorius nerastas.'
        };
      }
      
      await deleteDoc(snapshot.docs[0].ref);
      
      return {
        success: true,
        message: 'Prenumeratorius sėkmingai pašalintas.'
      };
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      throw error;
    }
  }
  
  // Get dashboard stats
  async getDashboardStats() {
    try {
      const recipesSnapshot = await getDocs(collection(db, 'recipes'));
      const recipes = recipesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const stats = {
        recipes: {
          total: recipes.length,
          published: recipes.filter(r => r.status === 'published').length,
          draft: recipes.filter(r => r.status === 'draft' || !r.status).length
        },
        comments: {
          total: 0,
          pending: 0,
          approved: 0
        },
        media: {
          total: recipes.filter(r => r.image).length
        },
        recent_recipes: recipes.slice(0, 3),
        recent_comments: []
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
  
  // Helper method for default about data
  getDefaultAboutData() {
    return {
      title: 'Apie Mane',
      subtitle: 'Kelionė į širdį per maistą, pilną gamtos dovanų, švelnumo ir paprastumo',
      intro: 'Sveiki, esu Lidija – keliaujanti miško takeliais, pievomis ir laukais, kur kiekvienas žolės stiebelis, vėjo dvelksmas ar laukinė uoga tampa įkvėpimu naujam skoniui.',
      sections: [
        {
          title: 'Mano istorija',
          content: 'Viskas prasidėjo mažoje kaimo virtuvėje, kur mano močiutė ruošdavo kvapnius patiekalus iš paprastų ingredientų.'
        },
        {
          title: 'Mano filosofija',
          content: 'Tikiu, kad maistas yra daugiau nei tik kuras mūsų kūnui – tai būdas sujungti žmones, išsaugoti tradicijas ir kurti naujus prisiminimus.'
        }
      ],
      social: {
        email: 'info@saukstas-meiles.lt',
        instagram: '#',
        facebook: '#',
        pinterest: '#'
      }
    };
  }
}

// Create API instance
const firebaseAPI = new FirebaseAPI();

// Unified API interface
export const api = {
  // Firebase API methods
  firebaseAPI,
  
  // Standard HTTP-like methods for compatibility
  get: async (endpoint, config = {}) => {
    if (endpoint.includes('/recipes') && endpoint.split('/').length === 2) {
      return { data: await firebaseAPI.getRecipes(config.params || {}) };
    } else if (endpoint.match(/\/recipes\/[\w-]+\/comments$/)) {
      const parts = endpoint.split('/');
      const recipeId = parts[parts.length - 2];
      return { data: await firebaseAPI.getRecipeComments(recipeId) };
    } else if (endpoint.match(/\/recipes\/[\w-]+$/)) {
      const id = endpoint.split('/').pop();
      return { data: await firebaseAPI.getRecipe(id) };
    } else if (endpoint.includes('/categories')) {
      return { data: await firebaseAPI.getCategories() };
    } else if (endpoint.includes('/about')) {
      return { data: await firebaseAPI.getAboutData() };
    } else if (endpoint.includes('/admin/dashboard/stats')) {
      return { data: await firebaseAPI.getDashboardStats() };
    } else if (endpoint.includes('/admin/newsletter/subscribers')) {
      return { data: await firebaseAPI.getNewsletterSubscribers() };
    } else if (endpoint.includes('/admin/recipes')) {
      return { data: await firebaseAPI.getRecipes({ ...config.params, isAdmin: true }) };
    } else if (endpoint.includes('/admin/about')) {
      return { data: await firebaseAPI.getAboutData() };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  },
  
  post: async (endpoint, data) => {
    if (endpoint.includes('/newsletter/subscribe')) {
      return { data: await firebaseAPI.subscribeToNewsletter(data.email) };
    } else if (endpoint.includes('/admin/recipes')) {
      return { data: await firebaseAPI.createRecipe(data.recipeData, data.imageFile) };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  },
  
  put: async (endpoint, data) => {
    if (endpoint.includes('/admin/recipes/')) {
      const id = endpoint.split('/').pop();
      return { data: await firebaseAPI.updateRecipe(id, data.recipeData, data.imageFile) };
    } else if (endpoint.includes('/admin/about')) {
      return { data: await firebaseAPI.updateAboutData(data.aboutData, data.mainImageFile, data.sidebarImageFile) };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  },
  
  delete: async (endpoint) => {
    if (endpoint.includes('/admin/recipes/')) {
      const id = endpoint.split('/').pop();
      return { data: await firebaseAPI.deleteRecipe(id) };
    } else if (endpoint.includes('/admin/newsletter/subscribers/')) {
      const email = decodeURIComponent(endpoint.split('/').pop());
      return { data: await firebaseAPI.deleteNewsletterSubscriber(email) };
    }
    
    throw new Error(`Endpoint not implemented: ${endpoint}`);
  }
};