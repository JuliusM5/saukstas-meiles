import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Testing Firebase connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const testCollection = await getDocs(collection(db, 'test'));
        setStatus(`✅ Firebase connected! Found ${testCollection.size} documents`);
      } catch (error) {
        setStatus(`❌ Firebase error: ${error.message}`);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h3>Firebase Status:</h3>
      <p>{status}</p>
    </div>
  );
};

export default FirebaseTest;