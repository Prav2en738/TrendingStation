// Tiny localStorage helpers shared by the demo services. Every read is wrapped in try/catch
// so a blocked or corrupted storage never crashes the app.

export const KEYS = {
  session: "toyverse_session", // { id, name, role, isLoggedIn }
  users: "toyverse_users",
  products: "toyverse_products",
  orders: "toyverse_orders",
  movements: "toyverse_stock_movements",
};

export const readJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Browser storage is full or blocked. Try removing large product images.");
  }
};

export const removeKey = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};
