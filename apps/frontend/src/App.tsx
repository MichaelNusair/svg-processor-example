import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import React from 'react';
import { UploadPage } from './pages/UploadPage';
import { DesignsPage } from './pages/DesignsPage';
import { DesignDetailPage } from './pages/DesignDetailPage';

function Header(): React.JSX.Element {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect
                x="7"
                y="7"
                width="4"
                height="4"
                fill="white"
                stroke="none"
              />
              <rect
                x="13"
                y="13"
                width="4"
                height="4"
                fill="white"
                stroke="none"
              />
            </svg>
          </div>
          SVG Processor
        </Link>
        <nav className="nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Upload
          </NavLink>
          <NavLink
            to="/designs"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Designs
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/designs" element={<DesignsPage />} />
          <Route path="/designs/:id" element={<DesignDetailPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
