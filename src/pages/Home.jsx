import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import CategoryCard from "../components/CategoryCard";
import TrendingSection from "../components/TrendingSection";
import ProductSection from "../components/ProductSection";
import ParallaxSection from "../components/ParallaxSection";
import ViralToys from "../components/ViralToys";
import PromoBanner from "../components/PromoBanner";
import Features from "../components/Features";
import { api } from "../services/api";
import { categories } from "../data/products";
import "../styles/hero.css";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        if (data.data) setProducts(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getCategoryCount = (catName) =>
    products.filter((p) => p.category === catName).length;

  if (loading) {
    return (
      <>
        <Hero />
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Find Their Favorite</h2>
              <p>Browse toys by category and discover something new</p>
            </div>
            <div className="category-scroll scroll-hidden">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.name}
                  category={cat}
                  count={0}
                />
              ))}
            </div>
          </div>
        </section>
        <div className="section">
          <div className="container" style={{ textAlign: "center", padding: "var(--space-10)" }}>
            <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>Loading toys...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Find Their Favorite</h2>
            <p>Browse toys by category and discover something new</p>
          </div>
          <div className="category-scroll scroll-hidden">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.name}
                category={cat}
                count={getCategoryCount(cat.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <div className="emoji">😕</div>
              <h3>Could not load toys</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
            </div>
          </div>
        </section>
      ) : (
        <TrendingSection products={products} />
      )}

      <ProductSection
        title="New Arrivals"
        subtitle="Fresh toys that just landed in the store"
        products={products.filter((p) => p.section === "new")}
      />

      <ProductSection
        title="Best Sellers"
        subtitle="The toys our customers love most"
        products={products.filter((p) => p.section === "bestseller")}
      />

      <ProductSection
        title="Handmade"
        subtitle="Crafted with care, one toy at a time"
        products={products.filter((p) => p.section === "handmade")}
      />

      <ProductSection
        title="Coming Soon"
        subtitle="Get ready - these toys are on their way"
        className="trending-section"
        products={products.filter((p) => p.section === "coming-soon")}
      />

      <ParallaxSection />

      <ViralToys />

      <PromoBanner />

      <Features />
    </>
  );
}

export default Home;
