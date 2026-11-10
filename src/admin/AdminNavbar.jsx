import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Same classes as the customer navbar, so look and responsive behaviour match.
const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/products", label: "Add Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/stock", label: "Stock Movements" },
];

export default function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login", { replace: true });
  };

  const logoutStyle = { cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" };

  return (
    <>
      <nav className="navbar navbar-scrolled">
        <div className="container navbar-inner">
          <Link to="/admin/dashboard" className="nav-logo" onClick={closeMenu}>
            <span className="logo-icon">🧸</span>
            <span className="logo-text">ToyVerse</span>
            <span className="admin-badge">Admin</span>
          </Link>

          <div className="nav-links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="nav-link" style={logoutStyle}>
              Logout
            </button>
          </div>

          <div className="nav-actions">
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      <div className={`nav-overlay ${menuOpen ? "show" : ""}`} onClick={closeMenu} />

      <aside className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <Link to="/admin/dashboard" className="nav-logo" onClick={closeMenu}>
            <span className="logo-icon">🧸</span>
            <span className="logo-text">ToyVerse</span>
            <span className="admin-badge">Admin</span>
          </Link>
          <button className="mobile-menu-close" onClick={closeMenu}>✕</button>
        </div>
        <div className="mobile-menu-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-menu-link ${isActive ? "active" : ""}`}
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="mobile-menu-link"
            style={{ ...logoutStyle, textAlign: "left", width: "100%" }}
          >
            Logout
          </button>
        </div>
        <div className="mobile-menu-footer">ToyVerse Admin Panel</div>
      </aside>
    </>
  );
}
