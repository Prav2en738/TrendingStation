import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🧸 TrendyStation</h3>
            <div className="tagline">Play More. Imagine More.</div>
            <p>
              Your premium toy destination for creative, fun and safe toys.
              We bring joy to kids and families with carefully curated products
              designed to spark imagination.
            </p>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All Toys</Link></li>
              <li><Link to="/shop?sort=rating">Trending</Link></li>
              <li><Link to="/shop?sort=newest">New Arrivals</Link></li>
              <li><Link to="/shop?badge=BESTSELLER">Best Sellers</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><Link to="/about">Contact</Link></li>
              <li><Link to="/about">Shipping</Link></li>
              <li><Link to="/about">Returns</Link></li>
              <li><Link to="/about">FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Follow Us</h4>
            <ul>
              <li><a href="#!">Instagram</a></li>
              <li><a href="#!">Facebook</a></li>
              <li><a href="#!">YouTube</a></li>
            </ul>
            <div className="footer-social">
              <a href="#!" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#!" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#!" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 TrendyStation. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
