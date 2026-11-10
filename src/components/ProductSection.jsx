import ProductGrid from "./ProductGrid";
import "../styles/products.css";

// Same markup as TrendingSection, reused for "New Arrivals" and "Coming Soon".
// Renders nothing when there are no products, so the Home page stays as it was.
function ProductSection({ title, subtitle, products = [], className = "" }) {
  if (products.length === 0) return null;
  return (
    <section className={`section ${className}`}>
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

export default ProductSection;
