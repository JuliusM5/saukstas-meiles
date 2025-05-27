// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import RecipePage from './pages/RecipePage';
import CategoryPage from './pages/CategoryPage';
import AllRecipesPage from './pages/AllRecipesPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminSetup from './pages/admin/AdminSetup';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRecipes from './pages/admin/AdminRecipes';
import AdminAddRecipe from './pages/admin/AdminAddRecipe';
import AdminAbout from './pages/admin/AdminAbout';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminComments from './pages/admin/AdminComments';
import UnsubscribePage from './pages/UnsubscribePage';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
          <Route path="/recipe/:id" element={<PageWrapper><RecipePage /></PageWrapper>} />
          <Route path="/category/:name" element={<PageWrapper><CategoryPage /></PageWrapper>} />
          <Route path="/category/all" element={<PageWrapper><AllRecipesPage /></PageWrapper>} />
          <Route path="/unsubscribe" element={<PageWrapper><UnsubscribePage /></PageWrapper>} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/recipes" element={<PrivateRoute><AdminRecipes /></PrivateRoute>} />
          <Route path="/admin/recipes/add" element={<PrivateRoute><AdminAddRecipe /></PrivateRoute>} />
          <Route path="/admin/recipes/edit/:id" element={<PrivateRoute><AdminAddRecipe /></PrivateRoute>} />
          <Route path="/admin/about" element={<PrivateRoute><AdminAbout /></PrivateRoute>} />
          <Route path="/admin/newsletter" element={<PrivateRoute><AdminNewsletter /></PrivateRoute>} />
          <Route path="/admin/comments" element={<PrivateRoute><AdminComments /></PrivateRoute>} />
          
          {/* Not found route */}
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Wrapper component that includes header and footer
function PageWrapper({ children }) {
  return (
    <>
      <Header />
      <main className="container main-content">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default App;