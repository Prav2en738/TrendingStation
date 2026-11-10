import Order, { ORDER_STATUSES, RESTOCK_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import { nextOrderNumber } from '../models/Counter.js';
import { HttpError, wrap, isObjectId } from '../utils/http.js';
import { takeStock, addStock, logMovement } from '../utils/stock.js';

// Same delivery rule the cart page shows: free above ₹999, otherwise ₹49.
const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_CHARGE = 49;
const MAX_QTY_PER_ITEM = 50;

// Which status can move to which. Cancelled / Not Available / Returned are final.
const ALLOWED = {
  Pending: ['Dispatched', 'Delivered', 'Cancelled', 'Not Available'],
  Dispatched: ['Pending', 'Delivered', 'Cancelled', 'Not Available'],
  Delivered: ['Returned'],
  Cancelled: [],
  'Not Available': [],
  Returned: []
};

export const createOrder = wrap(async (req, res) => {
  const { items } = req.body;
  const phone = String(req.body.phone || req.user.phone || '').trim();
  const address = String(req.body.address || req.user.address || '').trim();

  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Order items are required');
  if (!address) throw new HttpError(400, 'Delivery address is required');
  if (!phone) throw new HttpError(400, 'Phone number is required');

  // validate every line and merge duplicates of the same product
  const wanted = new Map();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!isObjectId(item.product)) {
      throw new HttpError(400, 'A product in your cart is no longer available. Please remove it and try again.');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM) {
      throw new HttpError(400, `Quantity must be a whole number between 1 and ${MAX_QTY_PER_ITEM}`);
    }
    wanted.set(item.product, (wanted.get(item.product) || 0) + quantity);
  }

  // prices always come from the database, never from the browser
  const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
  const lines = [];
  for (const [productId, quantity] of wanted) {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new HttpError(404, 'A product in your cart is no longer available');
    if (product.section === 'coming-soon') throw new HttpError(400, `${product.name} is not available yet`);
    lines.push({ product, quantity });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const deliveryCharge = subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;

  // Take the stock first. Each take is atomic and refuses to go below zero.
  const taken = [];
  const giveBack = () => Promise.all(taken.map((t) => addStock(t.product._id, t.quantity)));

  let order;
  try {
    for (const line of lines) {
      const updated = await takeStock(line.product._id, line.quantity);
      if (!updated) {
        const fresh = await Product.findById(line.product._id);
        const left = fresh ? fresh.stock : 0;
        throw new HttpError(400, left > 0
          ? `Only ${left} of ${line.product.name} left in stock`
          : `${line.product.name} is out of stock`);
      }
      taken.push({ ...line, updated });
    }

    order = await Order.create({
      orderNumber: await nextOrderNumber(),
      user: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      phone,
      address,
      items: lines.map((l) => ({
        product: l.product._id,
        productCode: l.product.code,
        name: l.product.name,
        image: l.product.image,
        quantity: l.quantity,
        price: l.product.price
      })),
      subtotal,
      deliveryCharge,
      totalAmount: subtotal + deliveryCharge,
      stockDeducted: true
    });
  } catch (err) {
    await giveBack(); // the order was not created, so nothing stays deducted
    throw err;
  }

  // The order exists now, so from here on nothing is rolled back.
  for (const t of taken) {
    await logMovement({
      product: t.updated, type: 'OUT', qty: t.quantity,
      reason: `Order ${order.orderNumber} placed`, actor: req.user, order: order._id
    });
  }

  // remember the delivery details for next time
  req.user.phone = phone;
  req.user.address = address;
  await req.user.save();

  res.status(201).json({ success: true, data: order, message: 'Order created successfully' });
});

// Moves an order to a new status. For Cancelled / Not Available / Returned the units go
// back to stock exactly once: `stockDeducted` is flipped in the same atomic update as the
// status, so a double click or two admins at once cannot restock twice.
const changeStatus = async (order, status, actor) => {
  if (order.status === status) return order;
  if (!ALLOWED[order.status].includes(status)) {
    throw new HttpError(400, `An order that is ${order.status} cannot be changed to ${status}`);
  }

  const restock = RESTOCK_STATUSES.includes(status) && order.stockDeducted;
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status }, // only if nobody changed it meanwhile
    restock ? { status, stockDeducted: false } : { status },
    { new: true }
  );
  if (!updated) throw new HttpError(409, 'This order was just updated by someone else. Please refresh.');

  if (restock) {
    const verb = status === 'Returned' ? 'returned' : status === 'Cancelled' ? 'cancelled' : 'not available';
    for (const item of order.items) {
      const product = await addStock(item.product, item.quantity);
      if (product) {
        await logMovement({
          product, type: 'IN', qty: item.quantity,
          reason: `Order ${order.orderNumber} ${verb}`, actor, order: order._id
        });
      }
    }
  }
  return updated;
};

export const getMyOrders = wrap(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const getAllOrders = wrap(async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const updateOrderStatus = wrap(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status value');

  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');

  const updated = await changeStatus(order, status, req.user);
  res.json({ success: true, data: updated, message: 'Order status updated successfully' });
});

// A customer may cancel their own order while it is still Pending.
export const cancelMyOrder = wrap(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'Pending') {
    throw new HttpError(400, `Only pending orders can be cancelled. This order is ${order.status}.`);
  }
  const updated = await changeStatus(order, 'Cancelled', req.user);
  res.json({ success: true, data: updated, message: 'Order cancelled' });
});
