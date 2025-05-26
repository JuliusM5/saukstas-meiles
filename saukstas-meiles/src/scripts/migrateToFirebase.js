// src/scripts/migrateToFirebase.js
import { db } from '../firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Import your existing data
const existingData = {
  recipes: [
    {
      "title": "fdf",
      "intro": "dfdfd",
      "categories": [
        "Gėrimai ir kokteiliai",
        "Užkandžiai",
        "Daržovės",
        "Žuvis ir jūros gėrybės",
        "Be laktozės",
        "Gamta lėkštėje",
        "Kruopos ir grūdai",
        "Bulvės",
        "Varškė",
        "Desertai",
        "Sriubos",
        "Kiaušiniai",
        "Mėsa",
        "Be glitimo",
        "Iš močiutės virtuvės"
      ],
      "prep_time": "21",
      "cook_time": "2",
      "servings": "6",
      "ingredients": [
        "dsdsd",
        "sd",
        "sdsd",
        "sdsd"
      ],
      "steps": [
        "sdsd",
        "sdsd",
        "sdsd",
        "sds",
        "dsfsd"
      ],
      "notes": "ds",
      "status": "published",
      "image": "1748265831232-acacasc.jpg",
      "created_at": "2025-05-26T13:23:51.247Z"
    }
  ],
  about: {
    "title": "Apie Mane",
    "subtitle": "Kelionė į širdį per maistą, pilną gamtos dovanų, švelnumo ir paprastumo",
    "intro": "Sveiki, esu Lidija – keliaujanti miško takeliais, pievomis ir laukais, kur kiekvienas žolės stiebelis, vėjo dvelksmas ar laukinė uoga tampa įkvėpimu naujam skoniui.",
    "sections": [
      {
        "title": "Mano istorija",
        "content": "Viskas prasidėjo mažoje kaimo virtuvėje, kur mano močiutė ruošdavo kvapnius patiekalus iš paprastų ingredientų."
      },
      {
        "title": "Mano filosofija",
        "content": "Tikiu, kad maistas yra daugiau nei tik kuras mūsų kūnui – tai būdas sujungti žmones, išsaugoti tradicijas ir kurti naujus prisiminimus."
      }
    ],
    "social": {
      "email": "info@saukstas-meiles.lt",
      "instagram": "#",
      "facebook": "#",
      "pinterest": "#"
    },
    "image": "1747402125423-DSC_0297.JPG",
    "sidebar_image": "1747402125445-d37c71c4-3999-4e5c-8291-d623cb025a70.jpg"
  },
  subscribers: [
    "owltree200@gmail.com",
    "owl.business.tree@gmail.com"
  ]
};

async function migrateData() {
  try {
    console.log('Starting migration to Firebase...');
    
    // 1. Migrate recipes
    console.log('Migrating recipes...');
    for (const recipe of existingData.recipes) {
      try {
        await addDoc(collection(db, 'recipes'), {
          ...recipe,
          created_at: recipe.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log(`✓ Migrated recipe: ${recipe.title}`);
      } catch (error) {
        console.error(`✗ Failed to migrate recipe ${recipe.title}:`, error);
      }
    }
    
    // 2. Migrate about data to settings collection
    console.log('\nMigrating about data...');
    try {
      await setDoc(doc(db, 'settings', 'about'), existingData.about);
      console.log('✓ Migrated about data');
    } catch (error) {
      console.error('✗ Failed to migrate about data:', error);
    }
    
    // 3. Migrate newsletter subscribers
    console.log('\nMigrating newsletter subscribers...');
    for (const email of existingData.subscribers) {
      try {
        await addDoc(collection(db, 'newsletter_subscribers'), {
          email,
          subscribed_at: new Date().toISOString(),
          active: true
        });
        console.log(`✓ Migrated subscriber: ${email}`);
      } catch (error) {
        console.error(`✗ Failed to migrate subscriber ${email}:`, error);
      }
    }
    
    // 4. Create admin user
    console.log('\nCreating admin user...');
    try {
      await setDoc(doc(db, 'users', 'admin'), {
        username: 'admin',
        role: 'admin',
        created_at: new Date().toISOString()
      });
      console.log('✓ Created admin user');
    } catch (error) {
      console.error('✗ Failed to create admin user:', error);
    }
    
    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateData();

// Instructions to run this script:
// 1. Save this file in your project
// 2. Run it once using: node src/scripts/migrateToFirebase.js
// 3. Or add it to your package.json scripts:
//    "migrate": "node src/scripts/migrateToFirebase.js"
// 4. Then run: npm run migrate