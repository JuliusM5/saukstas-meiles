import React from 'react';
import '../../styles/admin/AdminWidgets.css';

const AdminWidgets = ({ stats }) => {
  return (
    <div className="dashboard-widgets">
      <div className="widget">
        <div className="widget-icon">
          <i className="fas fa-utensils"></i>
        </div>
        <div className="widget-count">{stats.recipes}</div>
        <div className="widget-title">Receptai</div>
      </div>
      
      <div className="widget">
        <div className="widget-icon">
          <i className="fas fa-comments"></i>
        </div>
        <div className="widget-count">{stats.comments}</div>
        <div className="widget-title">Komentarai</div>
      </div>
      
      <div className="widget">
        <div className="widget-icon">
          <i className="fas fa-images"></i>
        </div>
        <div className="widget-count">{stats.media}</div>
        <div className="widget-title">Nuotraukos</div>
      </div>
    </div>
  );
};

export default AdminWidgets;