import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatPrice } from "../data/products";
import { BarChart, LineChart, HBarChart } from "./Charts";

// How often the dashboard re-reads the local data so it follows new orders and stock changes.
const REFRESH_MS = 15000;

// Every number here is calculated by services/api.js from the local demo products and orders.
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () =>
      api.getDashboard()
        .then((res) => {
          if (!active) return;
          setData(res.data);
          setError("");
        })
        .catch((err) => active && setError(err.message));

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!data) {
    return (
      <div className={`admin-card chart-empty ${error ? "admin-alert error" : ""}`}>
        {error || "Loading dashboard..."}
      </div>
    );
  }

  const stats = [
    { label: "Total Products", value: data.totalProducts, icon: "📦", color: "var(--primary)" },
    { label: "Available Stock", value: data.availableStock, icon: "🏷️", color: "var(--secondary)" },
    { label: "Products Sold", value: data.productsSold, icon: "🛍️", color: "var(--accent)" },
    { label: "Total Orders", value: data.totalOrders, icon: "🛒", color: "var(--primary)" },
    { label: "Total Revenue", value: formatPrice(data.totalRevenue), icon: "💰", color: "var(--success)" },
    { label: "Pending Orders", value: data.pendingOrders, icon: "⏳", color: "var(--warning)" },
    { label: "Low Stock Items", value: data.lowStockCount, icon: "⚠️", color: "var(--error)" },
    { label: "Average Rating", value: data.averageRating ? `★ ${data.averageRating}` : "-", icon: "⭐", color: "var(--accent)" },
  ];

  return (
    <>
      <div className="admin-title">
        <h1>Dashboard</h1>
        <p>A quick overview of your store, calculated from the demo data in this browser</p>
      </div>

      {error && <div className="admin-alert error">Could not refresh: {error}</div>}
      {data.lowStockCount > 0 && (
        <div className="admin-alert error">
          ⚠️ {data.lowStockCount} {data.lowStockCount === 1 ? "product has" : "products have"} {data.lowStockLimit} or fewer units left. <Link to="/admin/stock">Manage stock</Link>
        </div>
      )}

      <div className="admin-stats">
        {stats.map((s) => (
          <div className="admin-stat" key={s.label} style={{ borderLeftColor: s.color }}>
            <div className="icon">{s.icon}</div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-charts">
        <div className="admin-card">
          <h2>Products by Category</h2>
          <p className="chart-sub">{data.totalProducts} products in the store</p>
          <HBarChart data={data.productsPerCategory} />
        </div>

        <div className="admin-card">
          <h2>Products Sold per Month</h2>
          <p className="chart-sub">Units sold, last 6 months</p>
          <BarChart data={data.soldPerMonth} />
        </div>

        <div className="admin-card">
          <h2>Product Ratings</h2>
          <p className="chart-sub">Number of products at each star rating</p>
          <HBarChart data={data.ratingBuckets} color="var(--accent)" />
        </div>

        <div className="admin-card">
          <h2>Monthly Turnover</h2>
          <p className="chart-sub">Revenue, last 6 months</p>
          <LineChart data={data.revenuePerMonth} money />
        </div>
      </div>
    </>
  );
}
