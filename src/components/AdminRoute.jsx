import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Guards every /admin page.
//  - not logged in  -> the single Login page
//  - logged in, but a customer -> back to the customer home page
export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
