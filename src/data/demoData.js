// Dummy data for the ToyVerse demo. Nothing here talks to a server: services/api.js copies
// this into localStorage the first time the app runs, and from then on works on that copy.
import { products as catalog } from "./products";

export const DEMO_CREDENTIALS = {
  admin: { email: "admin@toyverse.demo", password: "admin123" },
  customer: { email: "customer@toyverse.demo", password: "customer123" },
};

export const BADGES = {
  regular: "",
  trending: "TRENDING",
  new: "NEW ARRIVAL",
  handmade: "HANDMADE",
  bestseller: "BEST SELLER",
  "coming-soon": "COMING SOON",
};

const daysAgo = (n, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// ---------- users ----------
export const seedUsers = () => [
  { id: "u-admin", name: "Admin", email: "admin@toyverse.demo", password: "admin123", phone: "9000000001", address: "ToyVerse HQ, Anna Salai, Chennai 600002", role: "ADMIN", createdAt: daysAgo(400) },
  { id: "u-1", name: "Demo Customer", email: "customer@toyverse.demo", password: "customer123", phone: "9876543210", address: "12 Lake View Road, Ambattur, Chennai 600053", role: "CUSTOMER", createdAt: daysAgo(200) },
  { id: "u-2", name: "Priya Sharma", email: "priya@toyverse.demo", password: "customer123", phone: "9841122334", address: "45 Gandhi Street, T Nagar, Chennai 600017", role: "CUSTOMER", createdAt: daysAgo(180) },
  { id: "u-3", name: "Arjun Mehta", email: "arjun@toyverse.demo", password: "customer123", phone: "9884455667", address: "8 Green Park, Adyar, Chennai 600020", role: "CUSTOMER", createdAt: daysAgo(150) },
  { id: "u-4", name: "Sneha Iyer", email: "sneha@toyverse.demo", password: "customer123", phone: "9790011223", address: "22 Temple Road, Mylapore, Chennai 600004", role: "CUSTOMER", createdAt: daysAgo(120) },
];

// ---------- products ----------
const SECTION_BY_BADGE = { BESTSELLER: "bestseller", TRENDING: "trending", NEW: "new", HANDMADE: "handmade" };
// Stock on hand today. Two items are low on purpose so the low-stock alerts have something to show.
const BASE_STOCK = [40, 55, 38, 60, 30, 28, 45, 35, 32, 26, 50, 4, 30, 24, 44, 2];

export const seedProducts = () => {
  const list = catalog.map((p, i) => {
    const section = SECTION_BY_BADGE[p.badge] || "regular";
    const discount = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    return {
      id: String(p.id),
      code: `TOY-${101 + i}`,
      name: p.name,
      category: p.category,
      price: p.price,
      oldPrice: discount ? p.oldPrice : null,
      discount,
      stock: BASE_STOCK[i % BASE_STOCK.length],
      rating: p.rating,
      reviews: p.reviews,
      description: p.description,
      image: p.image,
      images: [p.image],
      section,
      badge: BADGES[section],
      recommendedAge: p.age,
      brand: p.brand,
      material: p.material,
      safety: p.safety,
      createdAt: daysAgo(300 - i * 10),
    };
  });
  // one Coming Soon item so every label is represented
  list.push({
    id: "17", code: "TOY-117", name: "Space Explorer Rover", category: "Robots", price: 2499, oldPrice: null, discount: 0,
    stock: 0, rating: 0, reviews: 0,
    description: "A programmable moon-rover robot with a camera arm and glow-in-the-dark wheels. Launching soon!",
    image: catalog[4].image, images: [catalog[4].image], section: "coming-soon", badge: BADGES["coming-soon"],
    recommendedAge: "8+", brand: "StarKids", material: "ABS Plastic", safety: "Non-toxic, BPA-free", createdAt: daysAgo(5),
  });
  return list;
};

// ---------- orders + stock history ----------
// [daysAgo, customer index, status, [[productId, qty], ...]]
const ORDER_PLAN = [
  [155, 1, "Delivered", [["1", 2], ["4", 1]]],
  [148, 2, "Delivered", [["2", 1]]],
  [128, 3, "Delivered", [["5", 1], ["9", 2]]],
  [110, 4, "Returned", [["7", 1]]],
  [96, 1, "Delivered", [["3", 2], ["8", 1]]],
  [80, 2, "Delivered", [["12", 1]]],
  [66, 3, "Delivered", [["14", 1], ["2", 2]]],
  [52, 4, "Cancelled", [["6", 1]]],
  [41, 1, "Delivered", [["15", 3]]],
  [33, 2, "Delivered", [["10", 2], ["11", 1]]],
  [21, 3, "Dispatched", [["1", 1], ["13", 1]]],
  [14, 4, "Delivered", [["4", 3]]],
  [9, 1, "Pending", [["16", 2]]],
  [6, 2, "Pending", [["2", 1], ["3", 1]]],
  [3, 3, "Dispatched", [["12", 1], ["8", 2]]],
  [1, 4, "Pending", [["5", 1]]],
];

const RESTOCKED = ["Cancelled", "Not Available", "Returned"];

// Builds orders and a stock-movement history that agree with each other, then works out the
// starting stock so today's stock equals (starting stock - units in kept orders).
export const seedOrdersAndStock = (products, users) => {
  const customers = users.filter((u) => u.role === "CUSTOMER");
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const running = {}; // productId -> quantity while replaying history
  const movements = [];
  const orders = [];

  const log = (p, type, qty, reason, at, actor, order) => {
    const previousQty = running[p.id];
    const newQty = type === "IN" ? previousQty + qty : previousQty - qty;
    running[p.id] = newQty;
    movements.push({
      id: `m-${movements.length + 1}`, product: p.id, productCode: p.code, productName: p.name,
      type, previousQty, changedQty: qty, newQty, reason, order,
      performedByName: actor.name, performedByRole: actor.role, createdAt: at,
    });
  };

  const admin = users.find((u) => u.role === "ADMIN");
  const kept = {}; // units each product loses to orders that were not cancelled/returned
  ORDER_PLAN.forEach(([d, ci, status, lines]) => {
    if (!RESTOCKED.includes(status)) lines.forEach(([pid, q]) => (kept[pid] = (kept[pid] || 0) + q));
  });

  // initial stock-in = today's stock + units that will leave through kept orders
  products.forEach((p) => {
    const start = p.stock + (kept[p.id] || 0);
    running[p.id] = 0;
    if (start > 0) log(p, "IN", start, "Initial stock (product added)", daysAgo(190, 9), admin);
  });

  ORDER_PLAN.forEach(([d, ci, status, lines], i) => {
    const user = customers[ci - 1];
    const items = lines.map(([pid, quantity]) => {
      const p = byId[pid];
      return { product: p.id, productCode: p.code, name: p.name, image: p.image, quantity, price: p.price };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const deliveryCharge = subtotal > 999 ? 0 : 49;
    const orderNumber = `ORD-${1001 + i}`;
    const at = daysAgo(d);
    orders.push({
      id: `o-${i + 1}`, orderNumber, user: user.id, customerName: user.name, customerEmail: user.email,
      phone: user.phone, address: user.address, items, subtotal, deliveryCharge,
      totalAmount: subtotal + deliveryCharge, status, stockDeducted: !RESTOCKED.includes(status),
      createdAt: at, updatedAt: at,
    });
    items.forEach((it) => log(byId[it.product], "OUT", it.quantity, `Order ${orderNumber} placed`, at, user, `o-${i + 1}`));
    if (RESTOCKED.includes(status)) {
      const verb = status === "Returned" ? "returned" : status === "Cancelled" ? "cancelled" : "not available";
      items.forEach((it) => log(byId[it.product], "IN", it.quantity, `Order ${orderNumber} ${verb}`, daysAgo(Math.max(d - 2, 0), 15), admin, `o-${i + 1}`));
    }
  });

  movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { orders: orders.reverse(), movements };
};
