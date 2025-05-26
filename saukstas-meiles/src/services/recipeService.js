import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const getRecipes = async () => {
  try {
    const recipesSnapshot = await getDocs(collection(db, 'recipes'));
    return recipesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recipes:', error);
    return [];
  }
};