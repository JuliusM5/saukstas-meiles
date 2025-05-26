import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import recipesData from './db.json';

const importRecipes = async () => {
  console.log('Starting import...');
  
  try {
    // Import recipes
    for (const recipe of recipesData.recipes) {
      await addDoc(collection(db, 'recipes'), recipe);
      console.log(`Imported: ${recipe.title}`);
    }
    
    console.log('Import complete!');
  } catch (error) {
    console.error('Error importing:', error);
  }
};

// Run the import
importRecipes();