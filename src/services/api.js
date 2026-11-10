// Local demo data service. This file replaces the old Express/MongoDB client: it has the same
// method names and returns the same { success, data } shapes, but everything is read from and
// written to localStorage. No network request is ever made.
//
// Demo logins (also shown on the Login page):
//   admin@toyverse.demo     / admin123
//   customer@toyverse.demo  / customer123
import { KEYS, readJSON, writeJSON, removeKey } from "./storage";
import { BADGES, seedUsers, seedProducts, seedOrdersAndStock } from "../data/demoData";

const LOW_STOCK_LIMIT = 5;
const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_CHARGE = 49;
const MAX_QTY_PER_ITEM = 50;
const NOT_SOLD = ["Cancelled", "Not Available", "Returned"];
const RESTOCK_STATUSES = ["Cancelled", "Not Available", "Returned"];
const ORDER_STATUSES = ["Pending", "Dispatched", "Delivered", "Not Available", "Cancelled", "Returned"];
const ALLOWED = {
  Pending: ["Dispatched", "Delivered", "Cancelled", "Not Available"],
  Dispatched: ["Pending", "Delivered", "Cancelled", "Not Available"],
  Delivered: ["Returned"],
  Cancelled: [],
  "Not Available": [],
  Returned: [],
};

const ok = (data, message) => Promise.resolve({ success: true, data, message });
const fail = (message) => Promise.reject(new Error(message));
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------- the stores (seeded from dummy data on first use) ----------
const seedAll = () => {
  const users = seedUsers();
  const products = seedProducts();
  const { orders, movements } = seedOrdersAndStock(products, users);
  writeJSON(KEYS.users, users);
  writeJSON(KEYS.products, products);
  writeJSON(KEYS.orders, orders);
  writeJSON(KEYS.movements, movements);
};

const load = (key) => {
  let data = readJSON(key);
  if (!Array.isArray(data)) {
    seedAll();
    data = readJSON(key, []);
  }
  return data;
};

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address, role: u.role, createdAt: u.createdAt });

// ---------- session ----------
// { id, name, role, isLoggedIn } lives in localStorage; the full profile is looked up from the users list.
export const getSession = () => {
  const s = readJSON(KEYS.session);
  return s && s.isLoggedIn && s.id ? s : null;
};

export const getSessionUser = () => {
  const s = getSession();
  if (!s) return null;
  const u = load(KEYS.users).find((x) => x.id === s.id);
  if (!u) {
    removeKey(KEYS.session);
    return null;
  }
  return publicUser(u);
};

export const clearSession = () => removeKey(KEYS.session);

const currentUser = () => {
  const u = getSessionUser();
  if (!u) throw new Error("Please log in to continue.");
  return u;
};
const requireAdmin = () => {
  const u = currentUser();
  if (u.role !== "ADMIN") throw new Error("Admin access only.");
  return u;
};
// run a synchronous action and turn it into a promise (a thrown Error becomes a rejection)
const run = (fn) => {
  try {
    const result = fn();
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

// ---------- stock helpers ----------
const logMovement = (movements, product, type, qty, reason, actor, orderId) => {
  movements.unshift({
    id: newId("m"),
    product: product.id,
    productCode: product.code,
    productName: product.name,
    type,
    previousQty: type === "IN" ? product.stock - qty : product.stock + qty,
    changedQty: qty,
    newQty: product.stock,
    reason,
    order: orderId,
    performedByName: actor?.name,
    performedByRole: actor?.role,
    createdAt: new Date().toISOString(),
  });
};

// Keeps price / oldPrice / discount / badge consistent whatever the form sent.
const normalizeProduct = (data, existing = {}) => {
  const merged = { ...existing, ...data };
  const out = { ...data };

  if (data.section !== undefined) {
    if (!(data.section in BADGES)) throw new Error("Invalid product label");
    out.badge = BADGES[data.section];
  }
  if (data.discount !== undefined || data.oldPrice !== undefined || data.price !== undefined) {
    const discount = Number(merged.discount) || 0;
    if (discount < 0 || discount > 99) throw new Error("Discount must be between 0 and 99%");
    if (discount > 0) {
      const original = Number(merged.oldPrice) > 0 ? Number(merged.oldPrice) : Number(merged.price);
      out.oldPrice = original;
      out.price = Math.round(original * (1 - discount / 100));
    } else {
      out.oldPrice = null;
    }
    out.discount = discount;
  }
  if (data.images !== undefined) {
    out.images = data.images.filter((u) => typeof u === "string" && u.trim());
    if (out.images.length) out.image = out.images[0];
  }
  if (data.stock !== undefined) {
    out.stock = Number(data.stock);
    if (!Number.isInteger(out.stock) || out.stock < 0) throw new Error("Stock must be a whole number (0 or more)");
  }
  return out;
};

// Moves an order to a new status; cancelled / not available / returned put the units back (once).
const changeStatus = (orders, order, status, actor) => {
  if (order.status === status) return order;
  if (!ALLOWED[order.status].includes(status)) {
    throw new Error(`An order that is ${order.status} cannot be changed to ${status}`);
  }
  if (RESTOCK_STATUSES.includes(status) && order.stockDeducted) {
    const products = load(KEYS.products);
    const movements = load(KEYS.movements);
    const verb = status === "Returned" ? "returned" : status === "Cancelled" ? "cancelled" : "not available";
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.product);
      if (!product) return; // product was deleted since the order
      product.stock += item.quantity;
      logMovement(movements, product, "IN", item.quantity, `Order ${order.orderNumber} ${verb}`, actor, order.id);
    });
    writeJSON(KEYS.products, products);
    writeJSON(KEYS.movements, movements);
    order.stockDeducted = false;
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  writeJSON(KEYS.orders, orders);
  return order;
};

// Shrinks an uploaded picture and returns it as a data URL, so it can live in localStorage.
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, 700 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

export const api = {
  // ----- Auth (localStorage only) -----
  register: (data) =>
    run(() => {
      const { name, email, phone, password } = data;
      const clean = (v) => String(v || "").trim();
      if (![name, email, phone, password].every(clean)) throw new Error("All fields are required: name, email, phone, password");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email))) throw new Error("Please enter a valid email address");
      if (String(password).length < 6) throw new Error("Password must be at least 6 characters");
      const users = load(KEYS.users);
      if (users.some((u) => u.email === clean(email).toLowerCase())) throw new Error("Email already registered");
      const user = {
        id: newId("u"), name: clean(name), email: clean(email).toLowerCase(), phone: clean(phone),
        address: clean(data.address), password: String(password), role: "CUSTOMER", createdAt: new Date().toISOString(),
      };
      writeJSON(KEYS.users, [...users, user]);
      return { success: true, data: { user: publicUser(user) }, message: "Demo account created" };
    }),

  login: ({ email, password }) =>
    run(() => {
      const user = load(KEYS.users).find((u) => u.email === String(email || "").trim().toLowerCase());
      if (!user || user.password !== password) throw new Error("Invalid demo credentials. Use the sample email and password shown below.");
      writeJSON(KEYS.session, { id: user.id, name: user.name, role: user.role, isLoggedIn: true });
      return { success: true, data: { user: publicUser(user) }, message: "Login successful" };
    }),

  getMe: () => run(() => ({ success: true, data: { user: currentUser() } })),

  updateMe: (data) =>
    run(() => {
      const me = currentUser();
      const users = load(KEYS.users);
      const u = users.find((x) => x.id === me.id);
      if (data.name !== undefined) u.name = String(data.name).trim();
      if (data.phone !== undefined) u.phone = String(data.phone).trim();
      if (data.address !== undefined) u.address = String(data.address).trim();
      writeJSON(KEYS.users, users);
      return { success: true, data: { user: publicUser(u) }, message: "Profile updated" };
    }),

  // ----- Products (read: anyone, write: admin only) -----
  getProducts: () => run(() => ({ success: true, data: [...load(KEYS.products)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) })),

  getProduct: (id) =>
    run(() => {
      const product = load(KEYS.products).find((p) => p.id === String(id));
      if (!product) throw new Error("Product not found");
      return { success: true, data: product };
    }),

  createProduct: (body) =>
    run(() => {
      const admin = requireAdmin();
      const products = load(KEYS.products);
      const data = normalizeProduct(body);
      if (!data.code || !data.name || !data.category || data.price === undefined) throw new Error("Product ID, name, category and price are required");
      if (products.some((p) => p.code.toLowerCase() === String(data.code).toLowerCase())) throw new Error("That Product ID is already used");
      const product = { section: "regular", badge: "", images: [], reviews: 0, ...data, id: newId("p"), createdAt: new Date().toISOString() };
      products.push(product);
      writeJSON(KEYS.products, products);
      if (product.stock > 0) {
        const movements = load(KEYS.movements);
        logMovement(movements, product, "IN", product.stock, "Initial stock (product added)", admin);
        writeJSON(KEYS.movements, movements);
      }
      return { success: true, data: product, message: "Product created successfully" };
    }),

  updateProduct: (id, body) =>
    run(() => {
      const admin = requireAdmin();
      const products = load(KEYS.products);
      const product = products.find((p) => p.id === String(id));
      if (!product) throw new Error("Product not found");
      const data = normalizeProduct(body, product);
      delete data.code; // the product ID never changes
      const oldStock = product.stock;
      Object.assign(product, data);
      writeJSON(KEYS.products, products);
      const delta = product.stock - oldStock;
      if (delta !== 0) {
        const movements = load(KEYS.movements);
        logMovement(movements, product, delta > 0 ? "IN" : "OUT", Math.abs(delta), "Manual stock edit (product updated)", admin);
        writeJSON(KEYS.movements, movements);
      }
      return { success: true, data: product, message: "Product updated successfully" };
    }),

  deleteProduct: (id) =>
    run(() => {
      requireAdmin();
      const products = load(KEYS.products);
      if (!products.some((p) => p.id === String(id))) throw new Error("Product not found");
      writeJSON(KEYS.products, products.filter((p) => p.id !== String(id)));
      return { success: true, message: "Product deleted successfully" };
    }),

  // ----- Images (admin): files become small data URLs saved inside the product -----
  uploadImages: (files) =>
    Promise.all(files.map(fileToDataUrl)).then((urls) => ({ success: true, data: { urls } })),

  // ----- Orders -----
  // data: { items: [{ product, quantity }], phone, address }
  createOrder: (data) =>
    run(() => {
      const user = currentUser();
      const users = load(KEYS.users);
      const me = users.find((u) => u.id === user.id);
      const phone = String(data.phone || me.phone || "").trim();
      const address = String(data.address || me.address || "").trim();
      if (!Array.isArray(data.items) || data.items.length === 0) throw new Error("Order items are required");
      if (!address) throw new Error("Delivery address is required");
      if (!phone) throw new Error("Phone number is required");

      // merge duplicate lines, then check every product against the current catalogue
      const wanted = new Map();
      data.items.forEach((item) => {
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) throw new Error(`Quantity must be a whole number between 1 and ${MAX_QTY_PER_ITEM}`);
        wanted.set(String(item.product), (wanted.get(String(item.product)) || 0) + qty);
      });
      const products = load(KEYS.products);
      const lines = [...wanted].map(([pid, quantity]) => {
        const product = products.find((p) => p.id === pid);
        if (!product) throw new Error("A product in your cart is no longer available. Please remove it and try again.");
        if (product.section === "coming-soon") throw new Error(`${product.name} is not available yet`);
        if (product.stock < quantity) {
          throw new Error(product.stock > 0 ? `Only ${product.stock} of ${product.name} left in stock` : `${product.name} is out of stock`);
        }
        return { product, quantity };
      });

      const orders = load(KEYS.orders);
      const movements = load(KEYS.movements);
      const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
      const deliveryCharge = subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
      const nextNumber = orders.reduce((m, o) => Math.max(m, Number(o.orderNumber.replace(/\D/g, "")) || 0), 1000) + 1;
      const now = new Date().toISOString();
      const order = {
        id: newId("o"), orderNumber: `ORD-${nextNumber}`, user: me.id, customerName: me.name, customerEmail: me.email,
        phone, address,
        items: lines.map((l) => ({ product: l.product.id, productCode: l.product.code, name: l.product.name, image: l.product.image, quantity: l.quantity, price: l.product.price })),
        subtotal, deliveryCharge, totalAmount: subtotal + deliveryCharge, status: "Pending", stockDeducted: true, createdAt: now, updatedAt: now,
      };

      lines.forEach((l) => {
        l.product.stock -= l.quantity;
        logMovement(movements, l.product, "OUT", l.quantity, `Order ${order.orderNumber} placed`, me, order.id);
      });
      me.phone = phone;
      me.address = address;
      writeJSON(KEYS.products, products);
      writeJSON(KEYS.movements, movements);
      writeJSON(KEYS.orders, [order, ...orders]);
      writeJSON(KEYS.users, users);
      return { success: true, data: order, message: "Order created successfully" };
    }),

  getMyOrders: () =>
    run(() => {
      const me = currentUser();
      return { success: true, data: load(KEYS.orders).filter((o) => o.user === me.id) };
    }),

  cancelMyOrder: (id) =>
    run(() => {
      const me = currentUser();
      const orders = load(KEYS.orders);
      const order = orders.find((o) => o.id === id && o.user === me.id);
      if (!order) throw new Error("Order not found");
      if (order.status !== "Pending") throw new Error(`Only pending orders can be cancelled. This order is ${order.status}.`);
      return { success: true, data: changeStatus(orders, order, "Cancelled", me), message: "Order cancelled" };
    }),

  getAllOrders: () =>
    run(() => {
      requireAdmin();
      return { success: true, data: load(KEYS.orders) };
    }),

  updateOrderStatus: (id, status) =>
    run(() => {
      const admin = requireAdmin();
      if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status value");
      const orders = load(KEYS.orders);
      const order = orders.find((o) => o.id === id);
      if (!order) throw new Error("Order not found");
      return { success: true, data: changeStatus(orders, order, status, admin), message: "Order status updated successfully" };
    }),

  // ----- Stock (admin) -----
  // query is the same "?type=IN&product=<id>" string the Stock page already builds
  getStockMovements: (query = "") =>
    run(() => {
      requireAdmin();
      const q = new URLSearchParams(query);
      let list = load(KEYS.movements);
      if (["IN", "OUT"].includes(q.get("type"))) list = list.filter((m) => m.type === q.get("type"));
      if (q.get("product")) list = list.filter((m) => m.product === q.get("product"));
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, data: list.slice(0, 200) };
    }),

  getLowStock: () =>
    run(() => {
      requireAdmin();
      const products = load(KEYS.products)
        .filter((p) => p.stock <= LOW_STOCK_LIMIT && p.section !== "coming-soon")
        .sort((a, b) => a.stock - b.stock);
      return { success: true, data: { limit: LOW_STOCK_LIMIT, products } };
    }),

  adjustStock: ({ productId, type, reason, quantity }) =>
    run(() => {
      const admin = requireAdmin();
      const qty = Number(quantity);
      if (!["IN", "OUT"].includes(type)) throw new Error("Type must be IN or OUT");
      if (!Number.isInteger(qty) || qty < 1) throw new Error("Quantity must be a whole number of 1 or more");
      if (typeof reason !== "string" || !reason.trim()) throw new Error("Please give a reason");
      const products = load(KEYS.products);
      const product = products.find((p) => p.id === String(productId));
      if (!product) throw new Error("Please choose a product");
      if (type === "OUT" && product.stock < qty) throw new Error(`Cannot remove ${qty}: only ${product.stock} in stock`);
      product.stock += type === "IN" ? qty : -qty;
      const movements = load(KEYS.movements);
      logMovement(movements, product, type, qty, reason.trim(), admin);
      writeJSON(KEYS.products, products);
      writeJSON(KEYS.movements, movements);
      return { success: true, data: { movement: movements[0], product }, message: "Stock updated" };
    }),

  // ----- Dashboard (admin): every number is calculated from the local data -----
  getDashboard: () =>
    run(() => {
      requireAdmin();
      const products = load(KEYS.products);
      const orders = load(KEYS.orders);
      const sold = orders.filter((o) => !NOT_SOLD.includes(o.status));
      const units = (o) => o.items.reduce((s, i) => s + i.quantity, 0);

      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { key: monthKey(d), label: d.toLocaleString("en-US", { month: "short" }) };
      });
      const perMonth = (valueOf) =>
        months.map((m) => ({
          label: m.label,
          value: sold.filter((o) => monthKey(new Date(o.createdAt)) === m.key).reduce((s, o) => s + valueOf(o), 0),
        }));

      const categories = [...new Set(products.map((p) => p.category))];
      const rated = products.filter((p) => p.rating > 0);
      const forSale = products.filter((p) => p.section !== "coming-soon");

      return {
        success: true,
        data: {
          totalProducts: products.length,
          availableStock: forSale.reduce((s, p) => s + p.stock, 0),
          lowStockCount: forSale.filter((p) => p.stock <= LOW_STOCK_LIMIT).length,
          lowStockLimit: LOW_STOCK_LIMIT,
          productsSold: sold.reduce((s, o) => s + units(o), 0),
          totalOrders: orders.length,
          totalRevenue: sold.reduce((s, o) => s + o.totalAmount, 0),
          pendingOrders: orders.filter((o) => o.status === "Pending").length,
          averageRating: rated.length ? Math.round((rated.reduce((s, p) => s + p.rating, 0) / rated.length) * 10) / 10 : 0,
          productsPerCategory: categories.map((name) => ({ label: name, value: products.filter((p) => p.category === name).length })),
          ratingBuckets: [5, 4, 3, 2, 1].map((star) => ({ label: `${star} Star`, value: rated.filter((p) => Math.round(p.rating) === star).length })),
          soldPerMonth: perMonth(units),
          revenuePerMonth: perMonth((o) => o.totalAmount),
        },
      };
    }),

  // Wipes the demo data (and the login) so it re-seeds fresh on next load.
  resetDemoData: () => {
    Object.values(KEYS).forEach(removeKey);
  },
};
