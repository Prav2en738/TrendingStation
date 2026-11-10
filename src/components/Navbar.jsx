import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import "../styles/navbar.css";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        if (data.data) setProducts(data.data);
      })
      .catch(() => {});
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const searchResults = searchQuery
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    closeMenu();
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/categories", label: "Categories" },
    { to: "/about", label: "About" },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="container navbar-inner">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <span className="logo-icon">🧸</span>
            <span className="logo-text">ToyVerse</span>
          </Link>

          <div className="nav-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Hi, {user.name.split(" ")[0]}
                </NavLink>
                <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  My Orders
                </NavLink>
                <button onClick={handleLogout} className="nav-link" style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Login
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Sign Up
                </NavLink>
              </>
            )}
          </div>

          <div className="nav-actions" ref={searchRef}>
            <button
              className="nav-icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {searchOpen && (
              <div className="nav-search open">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search toys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </form>
                {searchResults.length > 0 && (
                  <div className="nav-search-results">
                    {searchResults.map((p) => (
                      <Link
                        key={p._id || p.id}
                        to={`/product/${p._id || p.id}`}
                        className="nav-search-result"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <img src={p.image} alt={p.name} loading="lazy" />
                        <div className="info">
                          <div className="name">{p.name}</div>
                          <div className="cat">{p.category}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <div className="nav-search-empty">No toys found</div>
                )}
              </div>
            )}

            <Link to="/cart" className="nav-icon-btn" aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

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

      <div
        className={`nav-overlay ${menuOpen ? "show" : ""}`}
        onClick={closeMenu}
      />

      <aside className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <span className="logo-icon">🧸</span>
            <span className="logo-text">ToyVerse</span>
          </Link>
          <button className="mobile-menu-close" onClick={closeMenu}>
            ✕
          </button>
        </div>
        <div className="mobile-menu-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="mobile-menu-link"
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/cart" className="mobile-menu-link" onClick={closeMenu}>
            Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="mobile-menu-link" onClick={closeMenu}>
                Hi, {user.name.split(" ")[0]}
              </Link>
              <Link to="/orders" className="mobile-menu-link" onClick={closeMenu}>
                My Orders
              </Link>
              <button onClick={handleLogout} className="mobile-menu-link" style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-menu-link" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="mobile-menu-link" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
        <div className="mobile-menu-footer">
          Play More. Imagine More.
        </div>
      </aside>
    </>
  );
}

export default Navbar;
