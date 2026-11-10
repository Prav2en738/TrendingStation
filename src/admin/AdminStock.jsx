import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const emptyForm = { productId: "", type: "IN", quantity: "", reason: "" };

export default function AdminStock() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [low, setLow] = useState({ limit: 5, products: [] });
  const [filterType, setFilterType] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null); // { type: "error" | "success", text }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  // products + low-stock list + the history (with the current filters)
  const load = useCallback(() => {
    const query = new URLSearchParams();
    if (filterType) query.set("type", filterType);
    if (filterProduct) query.set("product", filterProduct);
    const qs = query.toString() ? `?${query}` : "";

    return Promise.all([api.getProducts(), api.getLowStock(), api.getStockMovements(qs)])
      .then(([p, l, m]) => {
        setProducts(p.data || []);
        setLow(l.data);
        setMovements(m.data || []);
        setLoadError("");
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [filterType, filterProduct]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const quantity = Number(form.quantity);

    if (!form.productId) return setMessage({ type: "error", text: "Please choose a product." });
    if (!Number.isInteger(quantity) || quantity < 1) return setMessage({ type: "error", text: "Quantity must be a whole number of 1 or more." });
    if (!form.reason.trim()) return setMessage({ type: "error", text: "Please give a reason." });

    setSaving(true);
    try {
      const res = await api.adjustStock({ ...form, quantity });
      const { movement } = res.data;
      setMessage({
        type: "success",
        text: `${movement.productName}: stock ${movement.type === "IN" ? "increased" : "decreased"} from ${movement.previousQty} to ${movement.newQty}.`,
      });
      setForm((f) => ({ ...emptyForm, productId: f.productId }));
      load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-title">
        <h1>Stock Movements</h1>
        <p>Every stock-in and stock-out is recorded here, including orders, cancellations and returns.</p>
      </div>

      {loadError && <div className="admin-alert error">{loadError}</div>}

      {low.products.length > 0 && (
        <div className="admin-card">
          <h2>⚠️ Low stock alert</h2>
          <p className="chart-sub">Products with {low.limit} or fewer units left</p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Product</th><th>Left</th><th>Action</th></tr>
              </thead>
              <tbody>
                {low.products.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.code}</td>
                    <td>{p.name}</td>
                    <td>
                      <span className="status-pill" style={{ background: "rgba(230, 57, 70, 0.12)", color: "var(--error)" }}>
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setForm({ ...emptyForm, productId: p.id, type: "IN", reason: "Restock" });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Add stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <form className="admin-card" onSubmit={handleSubmit}>
        <h2>Add or remove stock</h2>
        {message && <div className={`admin-alert ${message.type}`}>{message.text}</div>}
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="productId">Product</label>
            <select id="productId" name="productId" className="admin-select" value={form.productId} onChange={handleChange}>
              <option value="">Choose a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.stock} in stock)</option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <span className="admin-label">Type</span>
            <div className="admin-radio-row">
              <label>
                <input type="radio" name="type" value="IN" checked={form.type === "IN"} onChange={handleChange} />
                Stock In
              </label>
              <label>
                <input type="radio" name="type" value="OUT" checked={form.type === "OUT"} onChange={handleChange} />
                Stock Out
              </label>
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" name="quantity" type="number" min="1" step="1" className="admin-input" value={form.quantity} onChange={handleChange} placeholder="10" />
          </div>
          <div className="admin-field">
            <label htmlFor="reason">Reason</label>
            <input id="reason" name="reason" className="admin-input" value={form.reason} onChange={handleChange} placeholder="e.g. Supplier delivery, damaged, display piece" />
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Update Stock"}</button>
        </div>
      </form>

      <div className="admin-card">
        <h2>Movement history</h2>
        <div className="admin-form-grid" style={{ marginBottom: "var(--space-4)" }}>
          <div className="admin-field">
            <label htmlFor="filterType">Show</label>
            <select id="filterType" className="admin-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Stock in and out</option>
              <option value="IN">Stock in only</option>
              <option value="OUT">Stock out only</option>
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="filterProduct">Product</label>
            <select id="filterProduct" className="admin-select" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="chart-empty">Loading stock movements...</div>
        ) : movements.length === 0 ? (
          <div className="empty-state" style={{ margin: 0 }}>
            <div className="emoji">📦</div>
            <h3>No stock movements</h3>
            <p>Stock changes will be listed here.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date &amp; time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Previous</th>
                  <th>Changed</th>
                  <th>New</th>
                  <th>Reason</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const color = m.type === "IN" ? "var(--success)" : "var(--error)";
                  return (
                    <tr key={m.id}>
                      <td className="nowrap">{formatDateTime(m.createdAt)}</td>
                      <td>{m.productName} <span className="mono">({m.productCode})</span></td>
                      <td>
                        <span className="status-pill" style={{ background: `${color}20`, color }}>
                          {m.type === "IN" ? "Stock In" : "Stock Out"}
                        </span>
                      </td>
                      <td>{m.previousQty}</td>
                      <td style={{ color, fontWeight: 700 }}>{m.type === "IN" ? "+" : "−"}{m.changedQty}</td>
                      <td><strong>{m.newQty}</strong></td>
                      <td>{m.reason}</td>
                      <td className="nowrap">
                        {m.performedByName || "System"}
                        {m.performedByRole && <span className="sub-text">{m.performedByRole === "ADMIN" ? "Admin" : "Customer"}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
