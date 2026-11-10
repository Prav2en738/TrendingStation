import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatPrice } from "../data/products";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    api.getMyOrders()
      .then((data) => {
        setOrders(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // a customer can cancel their own order while it is still Pending (stock goes back)
  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    setError("");
    setCancellingId(order.id);
    try {
      const res = await api.cancelMyOrder(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "var(--success)";
      case "Dispatched": return "var(--primary)";
      case "Cancelled":
      case "Returned":
      case "Not Available": return "var(--error)";
      default: return "var(--muted)";
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-hero">
          <div className="container">
            <h1>My Orders</h1>
            <p>View your order history</p>
          </div>
        </div>
        <section className="section">
          <div className="container" style={{ textAlign: "center", padding: "var(--space-10)" }}>
            <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>Loading...</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>My Orders</h1>
          <p>View your order history</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {error && (
            <div style={{ background: "rgba(230, 57, 70, 0.1)", color: "var(--error)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)", textAlign: "center" }}>
              {error}
            </div>
          )}
          {orders.length === 0 && !error ? (
            <div className="empty-state">
              <div className="emoji">📦</div>
            <h3>No orders yet</h3>
            <p>You haven&apos;t placed any orders yet.</p>
            <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          orders.length > 0 && <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)" }}>Order ID</th>
                  <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)" }}>Date</th>
                  <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)" }}>Products</th>
                  <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)" }}>Quantity</th>
                  <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)" }}>Total</th>
                  <th style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)" }}>Status</th>
                  <th style={{ padding: "var(--space-3)" }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "var(--space-3)", fontFamily: "monospace", fontSize: "0.9rem" }}>
                      {order.orderNumber}
                    </td>
                    <td style={{ padding: "var(--space-3)", color: "var(--text-light)" }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td style={{ padding: "var(--space-3)" }}>
                      {order.items.map((item) => (
                        <div key={item.product} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                          {item.image && (
                            <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
                          )}
                          <span style={{ fontSize: "0.9rem" }}>{item.name} × {item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: "var(--space-3)", fontWeight: 500 }}>
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td style={{ padding: "var(--space-3)", fontWeight: 600, fontSize: "1.1rem" }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td style={{ padding: "var(--space-3)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.35rem 0.9rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status)
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-3)" }}>
                      {order.status === "Pending" && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleCancel(order)}
                          disabled={cancellingId === order.id}
                        >
                          {cancellingId === order.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </section>
      </>
  );
}
