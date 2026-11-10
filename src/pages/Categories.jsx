import { useState, useEffect } from "react";
import { categories } from "../data/products";
import CategoryCard from "../components/CategoryCard";
import { api } from "../services/api";
import "../styles/hero.css";

function Categories() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        if (data.data) setProducts(data.data);
      })
      .catch(() => {});
  }, []);

  const getCategoryCount = (catName) =>
    products.filter((p) => p.category === catName).length;

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Categories</h1>
          <p>Explore toys by their favorite type</p>
        </div>
      </div>

      <div className="container">
        <section className="section">
          <div className="category-scroll scroll-hidden" style={{ flexWrap: "wrap", justifyContent: "center" }}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.name}
                category={cat}
                count={getCategoryCount(cat.name)}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Categories;
