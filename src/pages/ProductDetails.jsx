import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatPrice, getDiscountPercent } from "../data/products";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductGrid from "../components/ProductGrid";
import "../styles/products.css";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);

  useEffect(() => {
    api.getProduct(id)
      .then((data) => {
        setProduct(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (product) {
      api.getProducts()
        .then((data) => {
          const all = data.data || [];
          const related = all
            .filter((p) => p.category === product.category && (p._id || p.id) !== (product._id || product.id))
            .slice(0, 4);
          setRelatedProducts(related);
        })
        .catch(() => {});
    }
  }, [product]);

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: "60vh" }}>
        <div className="emoji">🧸</div>
        <h3>Loading...</h3>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state" style={{ minHeight: "60vh" }}>
        <div className="emoji">🧸</div>
        <h3>Toy Not Found</h3>
        <p>This toy seems to have wandered off!</p>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const productId = product._id || product.id;
  const discount = product.oldPrice > product.price ? getDiscountPercent(product.price, product.oldPrice) : 0;
  const comingSoon = product.section === "coming-soon";
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const unavailable = comingSoon || outOfStock;
  const wished = isInWishlist(productId);
  const thumbnails = product.images?.length > 1 ? product.images : [product.image, product.image, product.image, product.image];

  const handleAddToCart = () => {
    if (unavailable) return;
    addToCart({ ...product, id: productId, _id: productId }, quantity);
  };

  const handleBuyNow = () => {
    if (unavailable) return;
    addToCart({ ...product, id: productId, _id: productId }, quantity);
    navigate("/cart");
  };

  return (
    <>
      <div className="container">
        <div style={{ padding: "5rem 0 0", display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <Link to="/" style={{ color: "var(--muted)" }}>Home</Link>
          <span>/</span>
          <Link to="/shop" style={{ color: "var(--muted)" }}>Shop</Link>
          <span>/</span>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{product.name}</span>
        </div>

        <div className="pdp">
          <div className="pdp-gallery">
            <img
              src={thumbnails[activeThumb]}
              alt={product.name}
              className="pdp-main-img"
            />
            <div className="pdp-thumbnails">
              {thumbnails.map((thumb, i) => (
                <img
                  key={i}
                  src={thumb}
                  alt={`${product.name} view ${i + 1}`}
                  className={`pdp-thumb ${activeThumb === i ? "active" : ""}`}
                  onClick={() => setActiveThumb(i)}
                />
              ))}
            </div>
          </div>

          <div className="pdp-info">
            <div className="pdp-category">{product.category}</div>
            <h1 className="pdp-name">{product.name}</h1>

            <div className="pdp-rating-row">
              <span className="stars">★ {product.rating}</span>
              {product.reviews > 0 && <span className="pdp-reviews">{product.reviews} reviews</span>}
              {product.badge && <span className={`badge badge-${product.badge.toLowerCase().replace(/\s+/g, "-")}`}>{product.badge}</span>}
            </div>

            <div className="pdp-price-row">
              <span className="pdp-price">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="pdp-old-price">{formatPrice(product.oldPrice)}</span>
                  <span className="pdp-discount">{discount}% OFF</span>
                </>
              )}
            </div>

            <p className="pdp-desc">{product.description}</p>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Quantity</label>
              <div className="qty-selector">
                <button className="qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span className="qty-value">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>
            </div>

            <div className="pdp-actions">
              <button className="btn btn-primary" onClick={handleAddToCart} disabled={unavailable}>
                {comingSoon ? "Coming Soon" : outOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button className="btn btn-accent" onClick={handleBuyNow} disabled={unavailable}>
                Buy Now
              </button>
              <button
                className={`pdp-wishlist-btn ${wished ? "active" : ""}`}
                onClick={() => toggleWishlist(productId)}
                aria-label="Wishlist"
              >
                <svg viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>Product Information</h3>
              <div className="pdp-info-table">
                <div className="pdp-info-item">
                  <span className="label">Recommended Age</span>
                  <span className="value">{product.recommendedAge || product.age || "3+"}</span>
                </div>
                <div className="pdp-info-item">
                  <span className="label">Category</span>
                  <span className="value">{product.category}</span>
                </div>
                <div className="pdp-info-item">
                  <span className="label">Availability</span>
                  <span className="value" style={{ color: "var(--success)" }}>{comingSoon ? "Coming Soon" : product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
                </div>
                <div className="pdp-info-item">
                  <span className="label">Material</span>
                  <span className="value">{product.material || "N/A"}</span>
                </div>
                <div className="pdp-info-item">
                  <span className="label">Brand</span>
                  <span className="value">{product.brand || "N/A"}</span>
                </div>
                <div className="pdp-info-item">
                  <span className="label">Safety</span>
                  <span className="value">{product.safety || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>You May Also Like</h2>
              <p>More toys from {product.category}</p>
            </div>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </>
  );
}

export default ProductDetails;
