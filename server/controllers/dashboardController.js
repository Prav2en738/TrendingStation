import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { wrap } from '../utils/http.js';
import { lowStockLimit } from '../utils/stock.js';

// Orders with these statuses were never kept, so they don't count as sales.
const NOT_SOLD = ['Cancelled', 'Not Available', 'Returned'];
const MONTHS = 6;

// [{ key: "2026-9", label: "Oct" }, ...] for the last 6 months, oldest first
const lastMonths = () => {
  const now = new Date();
  return Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) };
  });
};
const monthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

// Every number on the admin dashboard is calculated here from the database.
export const getDashboard = wrap(async (req, res) => {
  const [products, orders] = await Promise.all([
    Product.find({}, 'category stock rating section').lean(),
    Order.find({}, 'status totalAmount createdAt items.quantity').lean()
  ]);

  const sold = orders.filter((o) => !NOT_SOLD.includes(o.status));
  const units = (o) => o.items.reduce((sum, i) => sum + i.quantity, 0);

  const months = lastMonths();
  const soldPerMonth = months.map((m) => ({
    label: m.label,
    value: sold.filter((o) => monthKey(o.createdAt) === m.key).reduce((s, o) => s + units(o), 0)
  }));
  const revenuePerMonth = months.map((m) => ({
    label: m.label,
    value: sold.filter((o) => monthKey(o.createdAt) === m.key).reduce((s, o) => s + o.totalAmount, 0)
  }));

  const categories = [...new Set(products.map((p) => p.category))];
  const productsPerCategory = categories.map((name) => ({
    label: name,
    value: products.filter((p) => p.category === name).length
  }));

  const rated = products.filter((p) => p.rating > 0);
  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star} Star`,
    value: rated.filter((p) => Math.round(p.rating) === star).length
  }));
  const averageRating = rated.length
    ? Math.round((rated.reduce((s, p) => s + p.rating, 0) / rated.length) * 10) / 10
    : 0;

  const forSale = products.filter((p) => p.section !== 'coming-soon');
  const limit = lowStockLimit();

  res.json({
    success: true,
    data: {
      totalProducts: products.length,
      availableStock: forSale.reduce((s, p) => s + p.stock, 0),
      lowStockCount: forSale.filter((p) => p.stock <= limit).length,
      lowStockLimit: limit,
      productsSold: sold.reduce((s, o) => s + units(o), 0),
      totalOrders: orders.length,
      totalRevenue: sold.reduce((s, o) => s + o.totalAmount, 0),
      pendingOrders: orders.filter((o) => o.status === 'Pending').length,
      averageRating,
      productsPerCategory,
      ratingBuckets,
      soldPerMonth,
      revenuePerMonth
    }
  });
});
