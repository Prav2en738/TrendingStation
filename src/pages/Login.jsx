import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { DEMO_CREDENTIALS } from "../data/demoData";

export default function Login() {
  useEffect(() => {
    const handleError = (event) => {
      if (event.error?.message?.includes("Cannot read properties of undefined (reading 'length')") &&
        event.filename?.includes("page-events")) {
        event.preventDefault();
        console.warn("Suppressed page-events.js error:", event.error);
      }
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(form);
      const user = data.data.user;
      login(user);
      // admins go to the dashboard, customers to the page they came from (or the homepage)
      const redirect = user.role === "ADMIN" ? "/admin/dashboard" : location.state?.from?.pathname || "/";
      navigate(redirect, { replace: true });
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
          <h1>Welcome Back</h1>
          <p>Login to your ToyVerse account</p>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: "480px" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-md)" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "var(--space-4)", textAlign: "center" }}>Sign In</h2>
            {error && (
              <div style={{ background: "rgba(230, 57, 70, 0.1)", color: "var(--error)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)", textAlign: "center" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
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
              <div style={{ marginBottom: "var(--space-5)" }}>
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
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--bg)", fontSize: "0.9rem", color: "var(--muted)" }}>
              <strong style={{ color: "var(--text)" }}>Demo logins</strong> (click to fill)
              {[["Admin", DEMO_CREDENTIALS.admin], ["Customer", DEMO_CREDENTIALS.customer]].map(([label, c]) => (
                <div key={label} style={{ marginTop: "var(--space-1)" }}>
                  <button
                    type="button"
                    onClick={() => { setForm({ email: c.email, password: c.password }); setError(""); }}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", color: "var(--primary)", fontWeight: 600 }}
                  >
                    {label}
                  </button>
                  : {c.email} / {c.password}
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: "var(--space-4)", color: "var(--muted)" }}>
              Don&apos;t have an account? <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Create one</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
