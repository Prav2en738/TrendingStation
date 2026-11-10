import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice, getDiscountPercent } from "../data/products";

function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const productId = product._id || product.id;
  // oldPrice only exists when the Admin set a discount
  const discount = product.oldPrice > product.price ? getDiscountPercent(product.price, product.oldPrice) : 0;
  const comingSoon = product.section === "coming-soon";
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const unavailable = comingSoon || outOfStock;
  const addLabel = comingSoon ? "Coming Soon" : outOfStock ? "Out of Stock" : "Add to Cart";
  const wished = isInWishlist(productId);

  const badgeClass = `badge badge-${(product.badge || "NEW").toLowerCase().replace(/\s+/g, "-")}`;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (unavailable) return;
    addToCart({ ...product, id: productId, _id: productId });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <div className="product-card">
      <div className="product-card-img-wrap">
        {product.badge && <span className={`product-card-badge ${badgeClass}`}>{product.badge}</span>}

        <button
          className={`wishlist-btn ${wished ? "active" : ""}`}
          onClick={handleWishlist}
          aria-label="Wishlist"
        >
          <svg viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <Link to={`/product/${productId}`}>
          <img
            src={product.image}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
          />
        </Link>

        <button className="product-card-add" onClick={handleAddToCart} disabled={unavailable}>
          {addLabel}
        </button>
      </div>

      <div className="product-card-body">
        <div className="product-card-category">{product.category}</div>
        <h3 className="product-card-name">
          <Link to={`/product/${productId}`}>{product.name}</Link>
        </h3>
        <div className="product-card-rating">
          <span className="stars">★ {product.rating}</span>
          {product.reviews > 0 && (
            <span className="product-card-reviews" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
              ({product.reviews})
            </span>
          )}
        </div>
        <div className="product-card-price-row">
          <span className="product-card-price">{formatPrice(product.price)}</span>
          {discount > 0 && (
            <>
              <span className="product-card-old-price">{formatPrice(product.oldPrice)}</span>
              <span className="product-card-discount">-{discount}%</span>
            </>
          )}
        </div>
      </div>

      <button className="product-card-add-mobile" onClick={handleAddToCart} disabled={unavailable}>
        {addLabel}
      </button>
    </div>
  );
}

export default ProductCard;
