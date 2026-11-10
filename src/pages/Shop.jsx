import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { categories } from "../data/products";
import { api } from "../services/api";
import ProductGrid from "../components/ProductGrid";
import "../styles/products.css";

const ITEMS_PER_PAGE = 8;
const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1000", min: 500, max: 1000 },
  { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
  { label: "Above ₹2000", min: 2000, max: Infinity },
];

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlSort = searchParams.get("sort") || "popular";

  const [search, setSearch] = useState(urlSearch);
  const [selectedCategories, setSelectedCategories] = useState(
    urlCategory ? [urlCategory] : []
  );
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [sort, setSort] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        setProducts(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setSelectedCategories(urlCategory ? [urlCategory] : []);
  }, [urlCategory]);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  const togglePrice = (range) => {
    setSelectedPrices((prev) =>
      prev.includes(range.label)
        ? prev.filter((r) => r !== range.label)
        : [...prev, range.label]
    );
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (selectedCategories.length) params.category = selectedCategories[0];
    if (sort !== "popular") params.sort = sort;
    setSearchParams(params);
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedPrices.length > 0) {
      result = result.filter((p) =>
        selectedPrices.some((label) => {
          const range = PRICE_RANGES.find((r) => r.label === label);
          return range && p.price >= range.min && p.price < range.max;
        })
      );
    }

    switch (sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [search, selectedCategories, selectedPrices, sort, products]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getCategoryCount = (catName) =>
    products.filter((p) => p.category === catName).length;

  if (loading) {
    return (
      <>
        <div className="page-hero">
          <div className="container">
            <h1>Shop All Toys</h1>
            <p>Find the perfect toy for every adventure</p>
          </div>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="emoji">🧸</div>
            <h3>Loading toys...</h3>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-hero">
          <div className="container">
            <h1>Shop All Toys</h1>
            <p>Find the perfect toy for every adventure</p>
          </div>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="emoji">😕</div>
            <h3>Could not load toys</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Shop All Toys</h1>
          <p>Find the perfect toy for every adventure</p>
        </div>
      </div>

      <div className="container">
        <button
          className="mobile-filter-toggle"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          🎛️ Filters
        </button>

        <div className="shop-layout">
          <aside className={`shop-filters ${filtersOpen ? "open" : ""}`}>
            <div className="filter-group">
              <h4>Search</h4>
              <form onSubmit={handleSearch} className="shop-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search toys..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              {categories.map((cat) => (
                <label key={cat.name} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.name)}
                    onChange={() => toggleCategory(cat.name)}
                  />
                  <span>{cat.emoji} {cat.name}</span>
                  <span className="filter-count">{getCategoryCount(cat.name)}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h4>Price</h4>
              {PRICE_RANGES.map((range) => (
                <label key={range.label} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedPrices.includes(range.label)}
                    onChange={() => togglePrice(range)}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              onClick={() => {
                setSelectedCategories([]);
                setSelectedPrices([]);
                setSearch("");
                setSearchParams({});
                setCurrentPage(1);
              }}
            >
              Clear All
            </button>
          </aside>

          <div className="shop-main">
            <div className="shop-toolbar">
              <div className="shop-results-count">
                <strong>{filteredProducts.length}</strong> products found
              </div>
              <div className="shop-sort">
                <label style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Sort:</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="popular">Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {paginatedProducts.length > 0 ? (
              <ProductGrid products={paginatedProducts} />
            ) : (
              <div className="empty-state">
                <div className="emoji">🧸</div>
                <h3>Oops! This toy went hiding.</h3>
                <p>We could not find any toys matching your filters.</p>
                <Link to="/shop" className="btn btn-primary">
                  View All Toys
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Shop;
