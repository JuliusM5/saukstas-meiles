const jsonServer = require('json-server');
const express = require('express');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Function to update categories list based on recipes
function updateCategoriesList() {
  console.log("Updating categories list...");
  
  // Get all recipes
  const recipes = router.db.get('recipes').value();
  
  // Create a categories map to track counts
  const categoriesMap = {};
  
  // Count occurrences of each category
  recipes.forEach(recipe => {
    if (recipe.categories && Array.isArray(recipe.categories)) {
      recipe.categories.forEach(category => {
        if (category) {
          if (!categoriesMap[category]) {
            categoriesMap[category] = 1;
          } else {
            categoriesMap[category] += 1;
          }
        }
      });
    }
  });
  
  // Convert map to array
  const categoriesArray = Object.keys(categoriesMap).map(name => ({
    name,
    count: categoriesMap[name]
  }));
  
  // Sort by name
  categoriesArray.sort((a, b) => a.name.localeCompare(b.name));
  
  // Update categories in database
  router.db.set('categories', categoriesArray).write();
  
  console.log(`Updated categories list with ${categoriesArray.length} categories`);
  return categoriesArray;
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define upload directory - this is critical!
    const uploadDir = path.join(__dirname, 'public', 'img', 'recipes');
    console.log("Upload directory:", uploadDir);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created upload directory");
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a safe filename without spaces
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/\s+/g, '_');
    const filename = `${timestamp}-${cleanName}`;
    console.log("Saving file as:", filename);
    cb(null, filename);
  }
});

// Create upload middleware
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add static file serving middleware
server.use(express.static(path.join(__dirname, 'public')));
console.log("Serving static files from:", path.join(__dirname, 'public'));

// Parse JSON request body
server.use(jsonServer.bodyParser);

// Middleware to handle form data
server.use((req, res, next) => {
  // Log incoming requests
  console.log(`${req.method} ${req.url}`);
  
  if ((req.method === 'POST' || req.method === 'PUT') && 
      (req.url.includes('/admin/recipes') || req.url.includes('/api/recipes'))) {
    console.log("Recipe data received:", req.body);
    
    // Handle arrays sent as individual form fields
    const body = req.body;
    
    // Process categories
    if (body['categories[]']) {
      body.categories = Array.isArray(body['categories[]']) 
        ? body['categories[]'] 
        : [body['categories[]']];
      delete body['categories[]'];
    }
    
    // Process ingredients
    if (body['ingredients[]']) {
      body.ingredients = Array.isArray(body['ingredients[]']) 
        ? body['ingredients[]'] 
        : [body['ingredients[]']];
      delete body['ingredients[]'];
    }
    
    // Process steps
    if (body['steps[]']) {
      body.steps = Array.isArray(body['steps[]']) 
        ? body['steps[]'] 
        : [body['steps[]']];
      delete body['steps[]'];
    }
    
    // Process tags
    if (body['tags[]']) {
      body.tags = Array.isArray(body['tags[]']) 
        ? body['tags[]'] 
        : [body['tags[]']];
      delete body['tags[]'];
    }
    
    // Add creation date if needed
    if (req.method === 'POST' && !body.created_at) {
      body.created_at = new Date().toISOString();
    }
    
    // Add ID if needed
    if (req.method === 'POST' && !body.id) {
      body.id = Date.now().toString();
    }
    
    console.log("Processed recipe data:", body);
  }
  
  next();
});

// Add creation date to posts
server.use((req, res, next) => {
  if (req.method === 'POST') {
    req.body.created_at = new Date().toISOString();
  }
  next();
});

// Add custom routes before JSON Server router
// Handle /api/recipes endpoints
server.get('/api/recipes', (req, res) => {
  const recipes = router.db.get('recipes').value();
  
  // Handle query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const category = req.query.category;
  const popular = req.query.popular === 'true';
  
  let result = recipes;
  
  // Filter by category if provided
  if (category) {
    result = result.filter(recipe => 
      recipe.categories && recipe.categories.includes(category)
    );
  }
  
  // If popular flag is set, just return first 5 recipes (simulating popular)
  if (popular) {
    result = result.slice(0, limit);
    return res.jsonp({
      success: true,
      data: result
    });
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedResult = result.slice(startIndex, endIndex);
  
  res.jsonp({
    success: true,
    data: paginatedResult,
    meta: {
      has_more: endIndex < result.length,
      total: result.length,
      page,
      limit
    }
  });
});

// Add a direct endpoint for recipes without the /api prefix
server.get('/recipes', (req, res) => {
  const recipes = router.db.get('recipes').value();
  
  // Handle query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const category = req.query.category;
  const popular = req.query.popular === 'true';
  
  let result = recipes;
  
  // Filter by category if provided
  if (category) {
    result = result.filter(recipe => 
      recipe.categories && recipe.categories.includes(category)
    );
  }
  
  // If popular flag is set, just return first 5 recipes (simulating popular)
  if (popular) {
    result = result.slice(0, limit);
    return res.jsonp({
      success: true,
      data: result
    });
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedResult = result.slice(startIndex, endIndex);
  
  res.jsonp({
    success: true,
    data: paginatedResult,
    meta: {
      has_more: endIndex < result.length,
      total: result.length,
      page,
      limit
    }
  });
});

// Get single recipe by ID without the /api prefix
server.get('/recipes/:id', (req, res) => {
  const recipe = router.db.get('recipes').find({ id: req.params.id }).value();
  
  if (recipe) {
    res.jsonp({
      success: true,
      data: recipe
    });
  } else {
    res.status(404).jsonp({
      success: false,
      error: 'Recipe not found'
    });
  }
});

// Add a direct endpoint for categories without the /api prefix
server.get('/categories', (req, res) => {
  const categories = router.db.get('categories').value();
  
  res.jsonp({
    success: true,
    data: categories
  });
});

// Get single recipe by ID
server.get('/api/recipes/:id', (req, res) => {
  const recipe = router.db.get('recipes').find({ id: req.params.id }).value();
  
  if (recipe) {
    res.jsonp({
      success: true,
      data: recipe
    });
  } else {
    res.status(404).jsonp({
      success: false,
      error: 'Recipe not found'
    });
  }
});

// Handle /api/categories endpoint
server.get('/api/categories/all', (req, res) => {
  try {
    // Get all recipes
    const recipes = router.db.get('recipes').value();
    
    // Get all unique categories from recipes
    const allCategories = new Set();
    recipes.forEach(recipe => {
      if (recipe.categories && Array.isArray(recipe.categories)) {
        recipe.categories.forEach(category => {
          if (category) {
            allCategories.add(category);
          }
        });
      }
    });
    
    // Convert to array with count
    const categoriesArray = Array.from(allCategories).map(name => {
      const count = recipes.filter(recipe => 
        recipe.categories && recipe.categories.includes(name)
      ).length;
      
      return { name, count };
    });
    
    // Sort by name
    categoriesArray.sort((a, b) => a.name.localeCompare(b.name));
    
    res.jsonp({
      success: true,
      data: categoriesArray
    });
  } catch (error) {
    console.error('Error generating all categories:', error);
    res.status(500).jsonp({
      success: false,
      error: 'Failed to generate categories'
    });
  }
});

// Handle /api/about endpoint with fallback data
server.get('/api/about', (req, res) => {
  // Provide default About page data
  res.jsonp({
    success: true,
    data: {
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
    }
  });
});

// Authentication endpoint without /api prefix
server.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = router.db.get('users').find({ username, password }).value();
  
  if (user) {
    // Simple token generation
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    res.jsonp({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } else {
    res.status(401).jsonp({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Authentication endpoint with /api prefix
server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = router.db.get('users').find({ username, password }).value();
  
  if (user) {
    // Simple token generation
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    res.jsonp({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } else {
    res.status(401).jsonp({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Verify token endpoint with /api prefix
server.get('/api/auth/verify', (req, res) => {
  // Just return success for now
  res.jsonp({
    success: true,
    user: {
      id: '1',
      username: 'admin'
    }
  });
});

// Verify token endpoint without /api prefix
server.get('/auth/verify', (req, res) => {
  // Just return success for now
  res.jsonp({
    success: true,
    user: {
      id: '1',
      username: 'admin'
    }
  });
});

// Admin dashboard stats
server.get('/admin/dashboard/stats', (req, res) => {
  const recipes = router.db.get('recipes').value();
  const comments = router.db.get('comments').value();
  
  // Count recipes with images
  const mediaCount = recipes.filter(recipe => recipe.image).length;
  
  // Create stats
  const stats = {
    recipes: {
      total: recipes.length,
      published: recipes.filter(r => r.status === 'published').length,
      draft: recipes.filter(r => r.status === 'draft' || !r.status).length
    },
    comments: {
      total: comments ? comments.length : 0,
      pending: comments ? comments.filter(c => c.status === 'pending' || !c.status).length : 0,
      approved: comments ? comments.filter(c => c.status === 'approved').length : 0
    },
    media: {
      total: mediaCount  // Updated to count recipes with images
    },
    recent_recipes: recipes.slice(0, 3).map(r => ({
      id: r.id,
      title: r.title,
      categories: r.categories,
      created_at: r.created_at,
      image: r.image
    })),
    recent_comments: comments ? comments.slice(0, 2).map(c => ({
      id: c.id,
      author: c.author,
      content: c.content && c.content.length > 50 ? c.content.substring(0, 50) + '...' : c.content,
      recipe_title: findRecipeTitle(recipes, c.recipe_id) || 'Recipe title',
      created_at: c.created_at
    })) : []
  };
  
  res.jsonp({
    success: true,
    data: stats
  });
  
  // Helper function to find recipe title
  function findRecipeTitle(recipes, recipeId) {
    if (!recipeId) return null;
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe ? recipe.title : null;
  }
});

// Admin recipes
server.get('/admin/recipes', (req, res) => {
  let recipes = router.db.get('recipes').value();
  
  // Handle query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const status = req.query.status;
  
  if (status && status !== 'all') {
    recipes = recipes.filter(recipe => recipe.status === status);
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedResult = recipes.slice(startIndex, endIndex);
  
  res.jsonp({
    success: true,
    data: paginatedResult,
    meta: {
      pages: Math.ceil(recipes.length / limit),
      total: recipes.length
    }
  });
});

// Get admin recipe by ID
server.get('/admin/recipes/:id', (req, res) => {
  const recipe = router.db.get('recipes').find({ id: req.params.id }).value();
  
  if (recipe) {
    res.jsonp({
      success: true,
      data: recipe
    });
  } else {
    res.status(404).jsonp({
      success: false,
      error: 'Recipe not found'
    });
  }
});

// Handle recipe with image upload
server.post('/admin/recipes', upload.single('image'), (req, res) => {
  console.log("Creating new recipe with image");
  console.log("Request body:", req.body);
  console.log("File:", req.file);
  
  // Check if body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error("Empty request body received!");
    return res.status(400).jsonp({
      success: false,
      error: "Empty recipe data"
    });
  }
  
  const newRecipe = req.body;
  
  // Process arrays from form data
  if (req.body['categories[]']) {
    newRecipe.categories = Array.isArray(req.body['categories[]']) 
      ? req.body['categories[]'] 
      : [req.body['categories[]']];
    delete newRecipe['categories[]'];
  }
  
  if (req.body['ingredients[]']) {
    newRecipe.ingredients = Array.isArray(req.body['ingredients[]']) 
      ? req.body['ingredients[]'] 
      : [req.body['ingredients[]']];
    delete newRecipe['ingredients[]'];
  }
  
  if (req.body['steps[]']) {
    newRecipe.steps = Array.isArray(req.body['steps[]']) 
      ? req.body['steps[]'] 
      : [req.body['steps[]']];
    delete newRecipe['steps[]'];
  }
  
  if (req.body['tags[]']) {
    newRecipe.tags = Array.isArray(req.body['tags[]']) 
      ? req.body['tags[]'] 
      : [req.body['tags[]']];
    delete newRecipe['tags[]'];
  }
  
  // Add the image filename if an image was uploaded
  if (req.file) {
    // Just store the filename, not the full path
    newRecipe.image = req.file.filename;
    console.log("Image saved with filename:", req.file.filename);
    
    // Verify the file exists
    const filePath = req.file.path;
    if (fs.existsSync(filePath)) {
      console.log("Verified: File exists at", filePath);
      const stats = fs.statSync(filePath);
      console.log("File size:", stats.size, "bytes");
    } else {
      console.error("ERROR: File does not exist at", filePath);
    }
  }
  
  // Generate ID and creation date
  newRecipe.id = Date.now().toString();
  newRecipe.created_at = new Date().toISOString();
  
  try {
    console.log("Adding recipe to database:", newRecipe);
    
    // Save to database
    router.db.get('recipes').push(newRecipe).write();
    
    // Update categories list after adding a recipe
    updateCategoriesList();
    
    // Verify it was saved
    const savedRecipe = router.db.get('recipes').find({ id: newRecipe.id }).value();
    console.log("Recipe saved in database:", savedRecipe ? "Yes" : "No");
    
    // Show database state
    const allRecipes = router.db.get('recipes').value();
    console.log(`Database now has ${allRecipes.length} recipes`);
    
    res.jsonp({
      success: true,
      data: newRecipe
    });
  } catch (error) {
    console.error("Error adding recipe:", error);
    res.status(500).jsonp({
      success: false,
      error: "Failed to save recipe: " + error.message
    });
  }
});

// Update admin recipe
server.put('/admin/recipes/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  console.log("Updating recipe:", id);
  console.log("Request body:", req.body);
  console.log("File:", req.file);
  
  // Process the request body to handle form data
  const updatedRecipe = req.body;
  
  // Process arrays from form data
  if (req.body['categories[]']) {
    updatedRecipe.categories = Array.isArray(req.body['categories[]']) 
      ? req.body['categories[]'] 
      : [req.body['categories[]']];
    delete updatedRecipe['categories[]'];
  }
  
  if (req.body['ingredients[]']) {
    updatedRecipe.ingredients = Array.isArray(req.body['ingredients[]']) 
      ? req.body['ingredients[]'] 
      : [req.body['ingredients[]']];
    delete updatedRecipe['ingredients[]'];
  }
  
  if (req.body['steps[]']) {
    updatedRecipe.steps = Array.isArray(req.body['steps[]']) 
      ? req.body['steps[]'] 
      : [req.body['steps[]']];
    delete updatedRecipe['steps[]'];
  }
  
  if (req.body['tags[]']) {
    updatedRecipe.tags = Array.isArray(req.body['tags[]']) 
      ? req.body['tags[]'] 
      : [req.body['tags[]']];
    delete updatedRecipe['tags[]'];
  }
  
  // Add the image filename if an image was uploaded
  if (req.file) {
    updatedRecipe.image = req.file.filename;
    console.log("Updated image saved with filename:", req.file.filename);
    
    // Verify the file exists
    const filePath = req.file.path;
    if (fs.existsSync(filePath)) {
      console.log("Verified: File exists at", filePath);
      const stats = fs.statSync(filePath);
      console.log("File size:", stats.size, "bytes");
    } else {
      console.error("ERROR: File does not exist at", filePath);
    }
  }
  
  const existingRecipe = router.db.get('recipes').find({ id }).value();
  
  if (!existingRecipe) {
    return res.status(404).jsonp({
      success: false,
      error: 'Recipe not found'
    });
  }
  
  try {
    router.db.get('recipes').find({ id }).assign(updatedRecipe).write();
    
    // Update categories list after updating a recipe
    updateCategoriesList();
    
    console.log("Recipe updated successfully");
    
    res.jsonp({
      success: true,
      data: updatedRecipe
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).jsonp({
      success: false,
      error: "Failed to update recipe: " + error.message
    });
  }
});

// Delete admin recipe
server.delete('/admin/recipes/:id', (req, res) => {
  const id = req.params.id;
  
  const existingRecipe = router.db.get('recipes').find({ id }).value();
  
  if (!existingRecipe) {
    return res.status(404).jsonp({
      success: false,
      error: 'Recipe not found'
    });
  }
  
  // If the recipe has an image, try to delete the file too
  if (existingRecipe.image) {
    const imagePath = path.join(__dirname, 'public', 'img', 'recipes', existingRecipe.image);
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
        console.log("Deleted image file:", imagePath);
      } catch (err) {
        console.error("Error deleting image file:", err);
      }
    }
  }
  
  router.db.get('recipes').remove({ id }).write();
  
  // Update categories list after deleting a recipe
  updateCategoriesList();
  
  res.jsonp({
    success: true
  });
});

// Use default router for any unhandled routes
server.use('/api', router);
server.use(router);

// Update categories on server start
server.use((req, res, next) => {
  // We need to wait until the DB is ready before updating categories
  // So we'll update it on the first request
  if (!global.categoriesUpdated) {
    console.log("Initial categories update...");
    updateCategoriesList();
    global.categoriesUpdated = true;
  }
  next();
});

// Start server
const port = 3001;
server.listen(port, () => {
  console.log(`JSON Server with custom routes is running at http://localhost:${port}`);
  console.log('Available API endpoints:');
  console.log(`http://localhost:${port}/api/recipes`);
  console.log(`http://localhost:${port}/api/categories`);
  console.log(`http://localhost:${port}/api/about`);
  console.log(`http://localhost:${port}/api/auth/login`);
  console.log(`http://localhost:${port}/auth/login`);
  console.log(`http://localhost:${port}/admin/dashboard/stats`);
  console.log(`http://localhost:${port}/admin/recipes`);
  console.log(`http://localhost:${port}/admin/rebuild-categories`);
});