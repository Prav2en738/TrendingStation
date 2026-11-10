import ProductGrid from "./ProductGrid";
import "../styles/products.css";

function TrendingSection({ products = [] }) {
  const trendingProducts = products.filter((p) => p.section === "trending");

  return (
    <section className="section trending-section">
      <div className="container">
        <div className="section-head">
          <h2>Trending Right Now</h2>
          <p>The hottest toys everyone is talking about</p>
        </div>
        {trendingProducts.length > 0 ? (
          <ProductGrid products={trendingProducts} />
        ) : (
          <div className="empty-state">
            <div className="emoji">📦</div>
            <h3>No trending products</h3>
            <p>Check back soon for hot new toys!</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TrendingSection;
