import { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatPrice } from "../data/products";


// Cancelled / Not Available / Returned are final (the stock has already gone back), and a
// Delivered order can only become Returned. services/api.js enforces the same rules.
const NEXT = {
  Pending: ["Pending", "Dispatched", "Delivered", "Cancelled", "Not Available"],
  Dispatched: ["Dispatched", "Pending", "Delivered", "Cancelled", "Not Available"],
  Delivered: ["Delivered", "Returned"],
};

const statusColor = (status) => {
  switch (status) {
    case "Delivered": return "var(--success)";
    case "Dispatched": return "var(--primary)";
    case "Cancelled":
    case "Returned":
    case "Not Available": return "var(--error)";
    default: return "var(--muted)"; // Pending
  }
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.getAllOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setError("");
    setUpdatingId(orderId);
    try {
      const res = await api.updateOrderStatus(orderId, status);
      // update just this row, no page reload
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <div className="admin-title">
        <h1>Orders</h1>
        <p>Every customer order appears here. Change the status to keep customers updated. Cancelled, not-available and returned orders put their toys back in stock.</p>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div className="chart-empty">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ margin: 0 }}>
            <div className="emoji">🛒</div>
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Products</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono nowrap">{o.orderNumber}</td>
                    <td style={{ minWidth: 260 }}>
                      {o.items.map((item) => (
                        <div key={item.product} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          {item.image && <img className="thumb" src={item.image} alt={item.name} />}
                          <span>
                            {item.name} <span className="mono">({item.productCode})</span> × {item.quantity}
                            <span className="sub-text">{formatPrice(item.price)} each</span>
                          </span>
                        </div>
                      ))}
                    </td>
                    <td>{o.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                    <td className="nowrap">
                      <strong>{formatPrice(o.totalAmount)}</strong>
                      {o.deliveryCharge > 0 && <span className="sub-text">incl. {formatPrice(o.deliveryCharge)} delivery</span>}
                    </td>
                    <td className="nowrap">{o.customerName}</td>
                    <td className="nowrap">{o.phone}</td>
                    <td className="address">{o.address}</td>
                    <td className="nowrap">{formatDate(o.createdAt)}</td>
                    <td>
                      <span
                        className="status-pill"
                        style={{ background: `${statusColor(o.status)}20`, color: statusColor(o.status) }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      {NEXT[o.status] ? (
                        <select
                          className="admin-select small"
                          value={o.status}
                          disabled={updatingId === o.id}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          aria-label={`Status for order ${o.orderNumber}`}
                        >
                          {NEXT[o.status].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="chart-sub">Final</span>
                      )}
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
