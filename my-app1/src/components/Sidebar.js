import React from 'react';
import './Sidebar.css';

function Sidebar({ companies, onSelect }) {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Companies</h2>
      <ul className="company-list">
        {companies.map((company) => (
          <li
            key={company.symbol}
            className="company-item"
            onClick={() => onSelect(company.symbol)}
          >
            {company.name} ({company.symbol})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
