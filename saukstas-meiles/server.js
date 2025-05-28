require('dotenv').config();
const jsonServer = require('json-server');
const express = require('express');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Security: Use helmet for security headers
server.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit sensitive operations
  message: 'Too many attempts, please try again later.'
});

// Apply rate limiting to API routes
server.use('/api', apiLimiter);
server.use('/admin/login', strictLimiter);
server.use('/api/newsletter/subscribe', strictLimiter);

// Validate environment variables
const requiredEnvVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'SESSION_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create transporter with environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// JWT secret
const JWT_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Input validation helpers
const validateEmail = (email) => {
  return validator.isEmail(email);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
};

const validateRecipeData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.length < 3 || data.title.length > 200) {
    errors.push('Title must be between 3 and 200 characters');
  }
  
  if (data.ingredients && !Array.isArray(data.ingredients)) {
    errors.push('Ingredients must be an array');
  }
  
  if (data.steps && !Array.isArray(data.steps)) {
    errors.push('Steps must be an array');
  }
  
  if (data.prep_time && (!Number.isInteger(Number(data.prep_time)) || Number(data.prep_time) < 0)) {
    errors.push('Prep time must be a positive integer');
  }
  
  if (data.cook_time && (!Number.isInteger(Number(data.cook_time)) || Number(data.cook_time) < 0)) {
    errors.push('Cook time must be a positive integer');
  }
  
  if (data.servings && (!Number.isInteger(Number(data.servings)) || Number(data.servings) < 1)) {
    errors.push('Servings must be a positive integer');
  }
  
  return errors;
};

// Secure file paths
const aboutFilePath = path.join(__dirname, 'data', 'about.json');
const subscribersFilePath = path.join(__dirname, 'data', 'subscribers.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Secure file operations
const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
};

// Multer configuration with security improvements
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = req.url.includes('/admin/about') 
      ? path.join(__dirname, 'public', 'img', 'about')
      : path.join(__dirname, 'public', 'img', 'recipes');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const safeName = `upload-${uniqueSuffix}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Whitelist allowed image types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Initialize default data files
const initializeDataFiles = () => {
  if (!fs.existsSync(aboutFilePath)) {
    const defaultAbout = {
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
    };
    writeJsonFile(aboutFilePath, defaultAbout);
  }
  
  if (!fs.existsSync(subscribersFilePath)) {
    writeJsonFile(subscribersFilePath, { subscribers: [] });
  }
};

initializeDataFiles();

// Middleware
server.use(middlewares);
server.use(express.static(path.join(__dirname, 'public')));
server.use(jsonServer.bodyParser);

// CORS configuration for production
server.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://saukstasmeiles.web.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ==================== AUTHENTICATION ROUTES ====================

server.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // In production, fetch from database
    const user = router.db.get('users').find({ username }).value();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Verify password (assuming passwords are hashed in database)
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

server.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username
    }
  });
});

// ==================== NEWSLETTER ROUTES ====================

server.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Prašome įvesti teisingą el. pašto adresą.'
      });
    }
    
    const data = readJsonFile(subscribersFilePath) || { subscribers: [] };
    
    // Check if already subscribed
    if (data.subscribers.includes(email)) {
      return res.json({
        success: true,
        message: 'Šis el. pašto adresas jau užprenumeruotas naujienlaiškį.'
      });
    }
    
    // Add subscriber
    data.subscribers.push(email);
    
    if (writeJsonFile(subscribersFilePath, data)) {
      // Log subscription (consider using proper logging library)
      console.log(`New subscriber: ${email} at ${new Date().toISOString()}`);
      
      return res.json({
        success: true,
        message: 'Ačiū už prenumeratą! Naujienlaiškis bus siunčiamas adresu: ' + email
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Klaida išsaugant prenumeratą. Bandykite vėliau.'
      });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({
      success: false,
      error: 'Vidinė serverio klaida. Bandykite vėliau.'
    });
  }
});

server.get('/api/newsletter/unsubscribe', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Neteisingas el. pašto adresas.'
      });
    }
    
    const data = readJsonFile(subscribersFilePath) || { subscribers: [] };
    
    if (!data.subscribers.includes(email)) {
      return res.json({
        success: false,
        message: 'Šis el. pašto adresas nėra prenumeruojamas naujienlaiškį.'
      });
    }
    
    // Remove subscriber
    data.subscribers = data.subscribers.filter(e => e !== email);
    
    if (writeJsonFile(subscribersFilePath, data)) {
      console.log(`Unsubscribed: ${email} at ${new Date().toISOString()}`);
      
      return res.json({
        success: true,
        message: 'Sėkmingai atsisakėte naujienlaiškio prenumeratos.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Klaida atsisakant naujienlaiškio prenumeratos.'
      });
    }
  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    return res.status(500).json({
      success: false,
      error: 'Vidinė serverio klaida. Bandykite vėliau.'
    });
  }
});

// ==================== ADMIN ROUTES (Protected) ====================

// Get newsletter subscribers (admin only)
server.get('/admin/newsletter/subscribers', authenticateToken, (req, res) => {
  try {
    const data = readJsonFile(subscribersFilePath) || { subscribers: [] };
    res.json({
      success: true,
      data: data.subscribers
    });
  } catch (error) {
    console.error('Error getting subscribers:', error);
    res.status(500).json({
      success: false,
      error: 'Klaida gaunant prenumeratorių sąrašą.'
    });
  }
});

// Delete subscriber (admin only)
server.delete('/admin/newsletter/subscribers/:email', authenticateToken, (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Neteisingas el. pašto adresas.'
      });
    }
    
    const data = readJsonFile(subscribersFilePath) || { subscribers: [] };
    
    if (!data.subscribers.includes(email)) {
      return res.status(404).json({
        success: false,
        error: 'Prenumeratorius nerastas.'
      });
    }
    
    data.subscribers = data.subscribers.filter(e => e !== email);
    
    if (writeJsonFile(subscribersFilePath, data)) {
      return res.json({
        success: true,
        message: 'Prenumeratorius sėkmingai pašalintas.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Klaida šalinant prenumeratorių.'
      });
    }
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return res.status(500).json({
      success: false,
      error: 'Vidinė serverio klaida.'
    });
  }
});

// Send newsletter (admin only)
server.post('/admin/newsletter/send', authenticateToken, async (req, res) => {
  try {
    const { subject, content } = req.body;
    
    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Prašome nurodyti temą ir turinį.'
      });
    }
    
    // Sanitize inputs
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedContent = validator.escape(content); // Basic HTML escaping
    
    const subscribersData = readJsonFile(subscribersFilePath) || { subscribers: [] };
    
    if (subscribersData.subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nėra prenumeratorių.'
      });
    }
    
    // In production, use a queue system for sending emails
    // This is a simplified version
    let successCount = 0;
    
    for (const email of subscribersData.subscribers) {
      try {
        await transporter.sendMail({
          from: `"Šaukštas Meilės" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: sanitizedSubject,
          html: `
            <html>
              <body>
                ${sanitizedContent}
                <hr>
                <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}">Atsisakyti prenumeratos</a></p>
              </body>
            </html>
          `
        });
        successCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError) {
        console.error(`Failed to send to ${email}:`, emailError);
      }
    }
    
    return res.json({
      success: true,
      message: `Naujienlaiškis išsiųstas ${successCount} iš ${subscribersData.subscribers.length} prenumeratorių.`
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return res.status(500).json({
      success: false,
      error: 'Klaida siunčiant naujienlaiškį.'
    });
  }
});

// ==================== RECIPE ROUTES ====================

// Create recipe (admin only)
server.post('/admin/recipes', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const validationErrors = validateRecipeData(req.body);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Sanitize text inputs
    const sanitizedRecipe = {
      ...req.body,
      title: sanitizeInput(req.body.title),
      intro: sanitizeInput(req.body.intro || ''),
      notes: sanitizeInput(req.body.notes || ''),
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    // Add image if uploaded
    if (req.file) {
      sanitizedRecipe.image = req.file.filename;
    }
    
    // Save to database
    router.db.get('recipes').push(sanitizedRecipe).write();
    
    res.json({
      success: true,
      data: sanitizedRecipe
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      error: 'Klaida išsaugant receptą.'
    });
  }
});

// Update recipe (admin only)
server.put('/admin/recipes/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingRecipe = router.db.get('recipes').find({ id }).value();
    
    if (!existingRecipe) {
      return res.status(404).json({
        success: false,
        error: 'Receptas nerastas.'
      });
    }
    
    const validationErrors = validateRecipeData(req.body);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Sanitize inputs
    const updatedRecipe = {
      ...req.body,
      title: sanitizeInput(req.body.title),
      intro: sanitizeInput(req.body.intro || ''),
      notes: sanitizeInput(req.body.notes || ''),
      updated_at: new Date().toISOString()
    };
    
    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (existingRecipe.image) {
        const oldImagePath = path.join(__dirname, 'public', 'img', 'recipes', existingRecipe.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedRecipe.image = req.file.filename;
    }
    
    // Update in database
    router.db.get('recipes').find({ id }).assign(updatedRecipe).write();
    
    res.json({
      success: true,
      data: updatedRecipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      error: 'Klaida atnaujinant receptą.'
    });
  }
});

// Delete recipe (admin only)
server.delete('/admin/recipes/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const existingRecipe = router.db.get('recipes').find({ id }).value();
    
    if (!existingRecipe) {
      return res.status(404).json({
        success: false,
        error: 'Receptas nerastas.'
      });
    }
    
    // Delete image if exists
    if (existingRecipe.image) {
      const imagePath = path.join(__dirname, 'public', 'img', 'recipes', existingRecipe.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete from database
    router.db.get('recipes').remove({ id }).write();
    
    res.json({
      success: true,
      message: 'Receptas sėkmingai ištrintas.'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      error: 'Klaida trinant receptą.'
    });
  }
});

// ==================== ABOUT PAGE ROUTES ====================

// Get about data (public)
server.get('/api/about', (req, res) => {
  try {
    const aboutData = readJsonFile(aboutFilePath) || {
      title: 'Apie Mane',
      subtitle: 'Kelionė į širdį per maistą',
      intro: 'Sveiki...',
      sections: [],
      social: {}
    };
    
    res.json({
      success: true,
      data: aboutData
    });
  } catch (error) {
    console.error('Error getting about data:', error);
    res.status(500).json({
      success: false,
      error: 'Klaida įkeliant informaciją.'
    });
  }
});

// Update about data (admin only)
server.put('/admin/about', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'sidebar_image', maxCount: 1 }
]), (req, res) => {
  try {
    const currentData = readJsonFile(aboutFilePath) || {};
    
    // Sanitize inputs
    const updatedData = {
      title: sanitizeInput(req.body.title || currentData.title),
      subtitle: sanitizeInput(req.body.subtitle || currentData.subtitle),
      intro: sanitizeInput(req.body.intro || currentData.intro),
      sections: currentData.sections, // Handle sections separately
      social: {
        email: validateEmail(req.body.email) ? req.body.email : currentData.social?.email,
        instagram: sanitizeInput(req.body.instagram || currentData.social?.instagram || '#'),
        facebook: sanitizeInput(req.body.facebook || currentData.social?.facebook || '#'),
        pinterest: sanitizeInput(req.body.pinterest || currentData.social?.pinterest || '#')
      },
      image: currentData.image,
      sidebar_image: currentData.sidebar_image
    };
    
    // Handle sections
    if (req.body.section_titles && req.body.section_contents) {
      const sections = [];
      const titles = Array.isArray(req.body.section_titles) ? req.body.section_titles : [req.body.section_titles];
      const contents = Array.isArray(req.body.section_contents) ? req.body.section_contents : [req.body.section_contents];
      
      for (let i = 0; i < titles.length; i++) {
        if (titles[i] && contents[i]) {
          sections.push({
            title: sanitizeInput(titles[i]),
            content: sanitizeInput(contents[i])
          });
        }
      }
      
      updatedData.sections = sections;
    }
    
    // Handle image uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        // Delete old image if exists
        if (currentData.image) {
          const oldImagePath = path.join(__dirname, 'public', 'img', 'about', currentData.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updatedData.image = req.files.image[0].filename;
      }
      
      if (req.files.sidebar_image && req.files.sidebar_image[0]) {
        // Delete old sidebar image if exists
        if (currentData.sidebar_image) {
          const oldImagePath = path.join(__dirname, 'public', 'img', 'about', currentData.sidebar_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updatedData.sidebar_image = req.files.sidebar_image[0].filename;
      }
    }
    
    if (writeJsonFile(aboutFilePath, updatedData)) {
      res.json({
        success: true,
        data: updatedData
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Klaida išsaugant informaciją.'
      });
    }
  } catch (error) {
    console.error('Error updating about page:', error);
    res.status(500).json({
      success: false,
      error: 'Klaida atnaujinant informaciją.'
    });
  }
});

// Error handling middleware
server.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Don't expose internal errors to client
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    error: message
  });
});

// Use default router
server.use('/api', router);
server.use(router);

// Start server
const PORT = process.env.SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Secure JSON Server is running at http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});