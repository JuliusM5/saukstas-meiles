
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin/AdminHeader.css';

const AdminHeader = ({ activePage }) => {
  const { logout } = useAuth();

  return (
    <header className="admin-header">
      <div className="container">
        <h1 className="admin-title"><Link to="/admin">Šaukštas Meilės Admin</Link></h1>
        <nav className="admin-nav">
          <ul>
            <li>
              <Link 
                to="/admin" 
                className={activePage === 'dashboard' ? 'active' : ''}
              >
                Pagrindinis
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/recipes" 
                className={activePage === 'recipes' ? 'active' : ''}
              >
                Receptai
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/recipes/add" 
                className={activePage === 'add-recipe' ? 'active' : ''}
              >
                Pridėti receptą
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/about" 
                className={activePage === 'about' ? 'active' : ''}
              >
                Apie mane
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/comments" 
                className={activePage === 'comments' ? 'active' : ''}
              >
                Komentarai
              </Link>
            </li>
              <li>
                <Link 
                  to="/admin/newsletter" 
                  className={activePage === 'newsletter' ? 'active' : ''}
                >
                  Naujienlaiškis
                </Link>
              </li>
                <li>
              <Link 
                to="/"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                Atsijungti
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;