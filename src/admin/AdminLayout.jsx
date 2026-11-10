import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

// Everything under /admin is wrapped in this: Admin Navbar on top, page below.
// (No customer navbar / footer here.)
export default function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <main className="admin-page">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </>
  );
}
