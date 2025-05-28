import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc 
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdminUser() {
  const email = 'admin@saukstasmeiles.lt'; // Change this
  const password = 'your-secure-password'; // Change this
  
  try {
    console.log('Setting up admin user...');
    
    // Try to sign in first
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Admin user already exists, signed in successfully');
    } catch (signInError) {
      // If sign in fails, create the user
      console.log('Creating new admin user...');
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Admin user created successfully');
    }
    
    const user = userCredential.user;
    
    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user document with admin role
      await setDoc(userDocRef, {
        email: user.email,
        role: 'admin',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      });
      console.log('Admin user document created in Firestore');
    } else {
      console.log('Admin user document already exists');
      // Update last login
      await setDoc(userDocRef, {
        last_login: new Date().toISOString()
      }, { merge: true });
    }
    
    console.log('✅ Admin setup complete!');
    console.log('You can now login with:', email);
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
  
  process.exit(0);
}

// Run the setup
setupAdminUser();