import { useState, useEffect } from "react";
import { api } from "../services/api";
import { categories, formatPrice } from "../data/products";

const SECTIONS = [
  { value: "regular", label: "Regular Product" },
  { value: "trending", label: "Trending" },
  { value: "new", label: "New Arrival" },
  { value: "handmade", label: "Handmade" },
  { value: "bestseller", label: "Best Seller" },
  { value: "coming-soon", label: "Coming Soon" },
];
const sectionLabel = (value) => SECTIONS.find((s) => s.value === value)?.label || "Regular Product";

const emptyForm = {
  code: "",
  name: "",
  category: categories[0].name,
  price: "", // the ORIGINAL price, before any discount
  stock: "",
  rating: "",
  description: "",
  section: "regular",
  hasDiscount: false,
  discount: "",
  images: [],
};

const finalPrice = (price, percent) => Math.round(price * (1 - percent / 100));

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = adding a new product
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState(null); // { type: "error" | "success", text }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProducts = () =>
    api.getProducts()
      .then((res) => {
        setProducts(res.data || []);
        setLoadError("");
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    loadProducts();
  }, []);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const handleChange = (e) => setField(e.target.name, e.target.value);

  // live "Original → Final" preview
  const originalPrice = Number(form.price);
  const percent = Number(form.discount);
  const showPreview = form.hasDiscount && originalPrice > 0 && percent > 0 && percent < 100;

  // ----- images -----
  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    setField("images", [...form.images, url]);
    setImageUrl("");
  };
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      // the images are shrunk in the browser and saved inside the product (localStorage)
      const res = await api.uploadImages(files);
      setForm((f) => ({ ...f, images: [...f.images, ...res.data.urls] }));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };
  const removeImage = (index) => setField("images", form.images.filter((_, i) => i !== index));

  // ----- add / edit / delete -----
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageUrl("");
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setMessage(null);
    setForm({
      code: p.code,
      name: p.name,
      category: p.category,
      price: String(p.oldPrice || p.price), // original price = oldPrice when discounted
      stock: String(p.stock ?? 0),
      rating: String(p.rating ?? ""),
      description: p.description || "",
      section: p.section || "regular",
      hasDiscount: p.discount > 0,
      discount: p.discount > 0 ? String(p.discount) : "",
      images: p.images?.length ? p.images : p.image ? [p.image] : [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(p.id);
      if (String(editingId) === String(p.id)) resetForm();
      setMessage({ type: "success", text: `"${p.name}" was deleted.` });
      loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const price = Number(form.price);
    const stock = Number(form.stock);
    const rating = form.rating === "" ? 0 : Number(form.rating);
    const discount = form.hasDiscount ? Number(form.discount) : 0;

    let error = "";
    if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) error = "Product ID can only contain letters, numbers, - and _.";
    else if (!form.name.trim()) error = "Please enter a product name.";
    else if (!(price > 0)) error = "Please enter a price greater than 0.";
    else if (!Number.isInteger(stock) || stock < 0) error = "Stock must be a whole number (0 or more).";
    else if (rating < 0 || rating > 5) error = "Rating must be between 0 and 5.";
    else if (!form.description.trim()) error = "Please enter a description.";
    else if (form.images.length === 0) error = "Please add at least one product image.";
    else if (form.hasDiscount && !(discount > 0 && discount < 100)) error = "Discount must be between 1 and 99%.";
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    // Customer pages already read `price` (what you pay) and `oldPrice` (struck-through),
    // so a discount is stored in exactly those fields.
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      section: form.section,
      stock,
      rating,
      discount,
      price: discount ? finalPrice(price, discount) : price,
      oldPrice: discount ? price : null,
      image: form.images[0],
      images: form.images,
    };

    setSaving(true);
    try {
      if (editingId !== null) {
        await api.updateProduct(editingId, payload);
        setMessage({ type: "success", text: `"${payload.name}" was updated.` });
      } else {
        await api.createProduct(payload);
        setMessage({ type: "success", text: `"${payload.name}" was added.` });
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const editing = editingId !== null;

  return (
    <>
      <div className="admin-title">
        <h1>{editing ? "Edit Product" : "Add Products"}</h1>
        <p>Changes show up on the customer side straight away.</p>
      </div>

      <form className="admin-card" onSubmit={handleSubmit}>
        {message && <div className={`admin-alert ${message.type}`}>{message.text}</div>}

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="code">Product ID</label>
            <input id="code" name="code" className="admin-input" value={form.code} onChange={handleChange} disabled={editing} placeholder="e.g. TOY-101" />
          </div>
          <div className="admin-field">
            <label htmlFor="name">Product Name</label>
            <input id="name" name="name" className="admin-input" value={form.name} onChange={handleChange} placeholder="e.g. Space Rocket" />
          </div>
          <div className="admin-field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" className="admin-select" value={form.category} onChange={handleChange}>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="price">Price (₹)</label>
            <input id="price" name="price" type="number" min="0" className="admin-input" value={form.price} onChange={handleChange} placeholder="2000" />
          </div>
          <div className="admin-field">
            <label htmlFor="stock">Stock Quantity</label>
            <input id="stock" name="stock" type="number" min="0" step="1" className="admin-input" value={form.stock} onChange={handleChange} placeholder="25" />
          </div>
          <div className="admin-field">
            <label htmlFor="rating">Rating (0 - 5)</label>
            <input id="rating" name="rating" type="number" min="0" max="5" step="0.1" className="admin-input" value={form.rating} onChange={handleChange} placeholder="4.5" />
          </div>

          <div className="admin-field">
            <span className="admin-label">Show this product in</span>
            <select name="section" className="admin-select" value={form.section} onChange={handleChange} aria-label="Product section">
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <span className="admin-label">Discount</span>
            <div className="admin-radio-row">
              <label>
                <input type="radio" name="hasDiscount" checked={!form.hasDiscount} onChange={() => setForm((f) => ({ ...f, hasDiscount: false, discount: "" }))} />
                No Discount
              </label>
              <label>
                <input type="radio" name="hasDiscount" checked={form.hasDiscount} onChange={() => setField("hasDiscount", true)} />
                Discount Available
              </label>
            </div>
          </div>

          {form.hasDiscount && (
            <>
              <div className="admin-field">
                <label htmlFor="discount">Discount Percentage (%)</label>
                <input id="discount" name="discount" type="number" min="1" max="99" className="admin-input" value={form.discount} onChange={handleChange} placeholder="20" />
              </div>
              <div className="admin-field">
                <span className="admin-label">Final price</span>
                <div className="price-preview">
                  {showPreview
                    ? `${formatPrice(originalPrice)} − ${percent}% = ${formatPrice(finalPrice(originalPrice, percent))}`
                    : "Enter a price and a discount to preview"}
                </div>
              </div>
            </>
          )}

          <div className="admin-field full">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" className="admin-textarea" value={form.description} onChange={handleChange} placeholder="Tell customers about this toy..." />
          </div>

          <div className="admin-field full">
            <span className="admin-label">Product Image(s) - the first image is the main one</span>
            <div className="admin-image-add">
              <input type="url" className="admin-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste an image URL" aria-label="Image URL" />
              <button type="button" className="btn btn-secondary" onClick={addImageUrl}>Add URL</button>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFiles} disabled={uploading} style={{ marginTop: "var(--space-2)" }} aria-label="Upload images" />
            {uploading && <p className="chart-sub">Uploading...</p>}
            {form.images.length > 0 && (
              <div className="admin-images">
                {form.images.map((src, i) => (
                  <div className="admin-image-thumb" key={i}>
                    <img src={src} alt={`Product ${i + 1}`} />
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remove image">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>{saving ? "Saving..." : editing ? "Save Changes" : "Add Product"}</button>
          {editing && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </form>

      <div className="admin-card">
        <h2>All Products ({products.length})</h2>
        {loading ? (
          <div className="chart-empty">Loading products...</div>
        ) : loadError ? (
          <div className="admin-alert error">{loadError}</div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ margin: 0 }}>
            <div className="emoji">🧸</div>
            <h3>No products yet</h3>
            <p>Use the form above to add your first toy.</p>
          </div>
        ) : (
        <div className="admin-table-wrap">
          <table className="admin-table products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rating</th>
                <th>Section</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><img className="thumb" src={p.image} alt={p.name} /></td>
                  <td className="mono">{p.code}</td>
                  <td>{p.name}</td>
                  <td className="nowrap">{p.category}</td>
                  <td className="nowrap">
                    <strong>{formatPrice(p.price)}</strong>
                    {p.oldPrice > p.price && <span className="old-price">{formatPrice(p.oldPrice)}</span>}
                  </td>
                  <td>{p.stock}</td>
                  <td>★ {p.rating}</td>
                  <td className="nowrap">{sectionLabel(p.section)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-secondary" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-secondary" style={{ color: "var(--error)" }} onClick={() => handleDelete(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </>
  );
}
