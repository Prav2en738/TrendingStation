import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Create Account</h1>
          <p>Join ToyVerse and start shopping (demo account, saved in this browser only)</p>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: "480px" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-md)" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "var(--space-4)", textAlign: "center" }}>Register</h2>
            {error && (
              <div style={{ background: "rgba(230, 57, 70, 0.1)", color: "var(--error)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)", textAlign: "center" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label htmlFor="name" style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 500, color: "var(--text)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-body)",
                    background: "var(--bg-card)",
                    color: "var(--text)",
                    transition: "border-color var(--transition)"
                  }}
                  placeholder="John Doe"
                />
              </div>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label htmlFor="email" style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 500, color: "var(--text)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-body)",
                    background: "var(--bg-card)",
                    color: "var(--text)",
                    transition: "border-color var(--transition)"
                  }}
                  placeholder="you@example.com"
                />
              </div>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label htmlFor="phone" style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 500, color: "var(--text)" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-body)",
                    background: "var(--bg-card)",
                    color: "var(--text)",
                    transition: "border-color var(--transition)"
                  }}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label htmlFor="password" style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 500, color: "var(--text)" }}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-body)",
                    background: "var(--bg-card)",
                    color: "var(--text)",
                    transition: "border-color var(--transition)"
                  }}
                  placeholder="••••••••"
                />
              </div>
              <div style={{ marginBottom: "var(--space-5)" }}>
                <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 500, color: "var(--text)" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border)",
                    fontSize: "1rem",
                    fontFamily: "var(--font-body)",
                    background: "var(--bg-card)",
                    color: "var(--text)",
                    transition: "border-color var(--transition)"
                  }}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "1rem" }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "var(--space-4)", color: "var(--muted)" }}>
              Already have an account? <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
