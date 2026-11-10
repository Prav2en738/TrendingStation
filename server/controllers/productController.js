import Product, { BADGES, SECTIONS } from '../models/Product.js';
import { HttpError, wrap } from '../utils/http.js';
import { logMovement } from '../utils/stock.js';

// The only fields an admin may set. Anything else in the request body is ignored.
const EDITABLE = [
  'code', 'name', 'category', 'price', 'oldPrice', 'discount', 'stock', 'rating', 'reviews',
  'description', 'image', 'images', 'section', 'recommendedAge', 'brand', 'material', 'safety'
];

const pickFields = (body) =>
  Object.fromEntries(EDITABLE.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

// Keeps price / oldPrice / discount / badge / image consistent, whatever the client sent.
const normalize = (data, existing = {}) => {
  const merged = { ...existing, ...data };

  if (data.section !== undefined) {
    if (!SECTIONS.includes(data.section)) throw new HttpError(400, 'Invalid product label');
    data.badge = BADGES[data.section];
  }

  // A discount is stored as: oldPrice = original price, price = what the customer pays.
  if (data.discount !== undefined || data.oldPrice !== undefined || data.price !== undefined) {
    const discount = Number(merged.discount) || 0;
    if (discount < 0 || discount > 99) throw new HttpError(400, 'Discount must be between 0 and 99%');
    if (discount > 0) {
      const original = Number(merged.oldPrice) > 0 ? Number(merged.oldPrice) : Number(merged.price);
      data.oldPrice = original;
      data.price = Math.round(original * (1 - discount / 100));
    } else {
      data.oldPrice = null;
    }
    data.discount = discount;
  }

  if (data.images !== undefined) {
    if (!Array.isArray(data.images)) throw new HttpError(400, 'images must be a list');
    data.images = data.images.filter((u) => typeof u === 'string' && u.trim());
    if (data.images.length) data.image = data.images[0]; // first image is the main one
  }

  if (data.stock !== undefined) {
    data.stock = Number(data.stock);
    if (!Number.isInteger(data.stock) || data.stock < 0) {
      throw new HttpError(400, 'Stock must be a whole number (0 or more)');
    }
  }
  return data;
};

export const getAllProducts = wrap(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

export const getProductById = wrap(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ success: true, data: product });
});

export const createProduct = wrap(async (req, res) => {
  const data = normalize(pickFields(req.body));
  if (!data.code || !data.name || !data.category || data.price === undefined) {
    throw new HttpError(400, 'Product ID, name, category and price are required');
  }

  const product = await Product.create(data);

  if (product.stock > 0) {
    await logMovement({
      product, type: 'IN', qty: product.stock, reason: 'Initial stock (product added)', actor: req.user
    });
  }

  res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
});

export const updateProduct = wrap(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');

  const data = normalize(pickFields(req.body), product.toObject());
  delete data.code; // the product ID never changes after creation

  // Stock is changed relative to the current number (not overwritten), so an order that
  // arrives at the same moment is not lost. It also writes a stock-movement row.
  const newStock = data.stock;
  delete data.stock;
  const delta = newStock === undefined ? 0 : newStock - product.stock;

  const filter = { _id: product._id };
  if (delta < 0) filter.stock = { $gte: -delta }; // never below zero
  const update = { $set: data };
  if (delta !== 0) update.$inc = { stock: delta };

  const updated = await Product.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  if (!updated) throw new HttpError(409, 'Stock changed while saving. Please try again.');

  if (delta !== 0) {
    await logMovement({
      product: updated,
      type: delta > 0 ? 'IN' : 'OUT',
      qty: Math.abs(delta),
      reason: 'Manual stock edit (product updated)',
      actor: req.user
    });
  }

  res.json({ success: true, data: updated, message: 'Product updated successfully' });
});

export const deleteProduct = wrap(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted successfully' });
});

