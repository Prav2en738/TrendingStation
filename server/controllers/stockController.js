import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { HttpError, wrap, isObjectId } from '../utils/http.js';
import { takeStock, addStock, logMovement, lowStockLimit } from '../utils/stock.js';

// Newest first. Optional filters: ?type=IN|OUT  ?product=<id>  ?limit=100
export const getMovements = wrap(async (req, res) => {
  const filter = {};
  if (['IN', 'OUT'].includes(req.query.type)) filter.type = req.query.type;
  if (isObjectId(req.query.product)) filter.product = req.query.product;
  const limit = Math.min(Number(req.query.limit) || 200, 500);

  const movements = await StockMovement.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit);
  res.json({ success: true, data: movements });
});

// Products that are running low (or out). "Coming soon" items are not for sale yet.
export const getLowStock = wrap(async (req, res) => {
  const limit = lowStockLimit();
  const products = await Product.find({ stock: { $lte: limit }, section: { $ne: 'coming-soon' } })
    .sort({ stock: 1 });
  res.json({ success: true, data: { limit, products } });
});

// Admin stock-in / stock-out with a reason
export const adjustStock = wrap(async (req, res) => {
  const { productId, type, reason } = req.body;
  const quantity = Number(req.body.quantity);

  if (!isObjectId(productId)) throw new HttpError(400, 'Please choose a product');
  if (!['IN', 'OUT'].includes(type)) throw new HttpError(400, 'Type must be IN or OUT');
  if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, 'Quantity must be a whole number of 1 or more');
  if (typeof reason !== 'string' || !reason.trim()) throw new HttpError(400, 'Please give a reason');

  const product = type === 'IN' ? await addStock(productId, quantity) : await takeStock(productId, quantity);

  if (!product) {
    const exists = await Product.findById(productId);
    if (!exists) throw new HttpError(404, 'Product not found');
    throw new HttpError(400, `Cannot remove ${quantity}: only ${exists.stock} in stock`);
  }

  const movement = await logMovement({ product, type, qty: quantity, reason: reason.trim(), actor: req.user });
  res.status(201).json({ success: true, data: { movement, product }, message: 'Stock updated' });
});
