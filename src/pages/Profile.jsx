import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>My Profile</h1>
          <p>Manage your account details</p>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: "600px" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-md)" }}>
            <div style={{ marginBottom: "var(--space-6)", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: "var(--space-1)" }}>{user.name}</h2>
              <p style={{ color: "var(--muted)" }}>{user.email}</p>
            </div>
            <div style={{ display: "grid", gap: "var(--space-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Full Name</label>
                <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>{user.name}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Email</label>
                <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>{user.email}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Phone</label>
                <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>{user.phone || "Not provided"}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Delivery Address</label>
                <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>{user.address || "Not provided yet - you can add it at checkout"}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "var(--space-1)" }}>Member Since</label>
                <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
            <div style={{ marginTop: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border)" }}>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ width: "100%" }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}