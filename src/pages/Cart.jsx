import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { formatPrice } from "../data/products";
import "../styles/products.css";

function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, deliveryCharge, total, cartCount } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [placedTotal, setPlacedTotal] = useState(0);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // delivery details are remembered from the customer's last order / profile
  useEffect(() => {
    if (user) {
      setPhone((p) => p || user.phone || "");
      setAddress((a) => a || user.address || "");
    }
  }, [user]);

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    if (!phone.trim()) return setError("Please enter a phone number for delivery.");
    if (!address.trim()) return setError("Please enter your delivery address.");

    setError("");
    setCheckoutLoading(true);
    const items = cart.map((item) => ({
      product: item._id || item.id,
      quantity: item.quantity,
    }));

    api.createOrder({ items, phone: phone.trim(), address: address.trim() })
      .then((res) => {
        setOrderId(res.data.orderNumber);
        setPlacedTotal(res.data.totalAmount); // the total calculated by the local order service
        setOrderComplete(true);
        clearCart();
        // the demo profile now holds these delivery details
        updateUser({ ...user, phone: phone.trim(), address: address.trim() });
      })
      .catch((err) => {
        setError(err.message || "Failed to place order");
      })
      .finally(() => {
        setCheckoutLoading(false);
      });
  };

  if (cart.length === 0 && !checkoutLoading && !orderComplete) {
    return (
      <>
        <div className="page-hero">
          <div className="container">
            <h1>Your Cart</h1>
            <p>Review your toys before checkout</p>
          </div>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="emoji">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you have not added any toys yet!</p>
            <Link to="/shop" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (orderComplete) {
    return (
      <>
        <div className="page-hero">
          <div className="container">
            <h1>Order Confirmed!</h1>
            <p>Thank you for shopping with ToyVerse</p>
          </div>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="emoji">🎉</div>
            <h3>Yay! Your toys are on the way!</h3>
            <p>Order total: <strong>{formatPrice(placedTotal)}</strong></p>
            <p style={{ marginBottom: "1rem" }}>Order ID: <strong>{orderId}</strong></p>
            <p style={{ marginBottom: "1rem" }}>Delivery in 3-5 business days.</p>
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/shop" >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Your Cart</h1>
          <p>{cartCount} {cartCount === 1 ? "item" : "items"} in your cart</p>
        </div>
      </div>

      <div className="container">
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-img"
                  loading="lazy"
                />
                <div className="cart-item-info">
                  <div className="cart-item-category">{item.category}</div>
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatPrice(item.price)}</div>
                  <div className="cart-item-actions">
                    <div className="qty-selector">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem", minWidth: "100px" }}>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({cartCount} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className={deliveryCharge === 0 ? "summary-free" : ""}>
                {deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}
              </span>
            </div>
            {deliveryCharge === 0 && subtotal > 0 && (
              <div style={{ fontSize: "0.85rem", color: "var(--success)", fontWeight: 600, paddingBottom: "0.5rem" }}>
                🎉 You got free delivery!
              </div>
            )}
            {deliveryCharge > 0 && (
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", paddingBottom: "0.5rem" }}>
                Add {formatPrice(999 - subtotal)} more for free delivery
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div style={{ display: "grid", gap: "0.5rem", margin: "0.75rem 0" }}>
              <label htmlFor="cart-phone" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Phone number</label>
              <input
                id="cart-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="For delivery updates"
                style={{ padding: "0.7rem 0.9rem", borderRadius: "var(--radius-md)", border: "2px solid var(--border)", font: "inherit" }}
              />
              <label htmlFor="cart-address" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Delivery address</label>
              <textarea
                id="cart-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, street, city, state, PIN"
                style={{ padding: "0.7rem 0.9rem", borderRadius: "var(--radius-md)", border: "2px solid var(--border)", font: "inherit", resize: "vertical" }}
              />
            </div>
            {error && (
              <div style={{ background: "rgba(230, 57, 70, 0.1)", color: "var(--error)", padding: "0.7rem", borderRadius: "var(--radius-md)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                {error}
              </div>
            )}
            <button
              className="btn btn-primary cart-checkout-btn"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Placing Order..." : "Proceed to Checkout"}
            </button>
            <Link
              to="/shop"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "0.75rem",
                color: "var(--muted)",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Cart;


