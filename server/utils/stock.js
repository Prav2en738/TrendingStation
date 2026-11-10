import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

// A product at or below this many units is flagged as "low stock".
export const lowStockLimit = () => Number(process.env.LOW_STOCK_LIMIT) || 5;

// Take `qty` units off the shelf. The `stock >= qty` condition and the $inc happen in ONE
// database operation, so two customers can never buy the last unit and stock never goes
// negative. Returns the updated product, or null when there is not enough stock.
export const takeStock = (productId, qty) =>
  Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true }
  );

// Put `qty` units back on the shelf. Returns the updated product (null if it was deleted).
export const addStock = (productId, qty) =>
  Product.findOneAndUpdate({ _id: productId }, { $inc: { stock: qty } }, { new: true });

// Write one row of stock history. `product` must be the document AFTER the change.
export const logMovement = ({ product, type, qty, reason, actor, order }) =>
  StockMovement.create({
    product: product._id,
    productCode: product.code,
    productName: product.name,
    type,
    previousQty: type === 'IN' ? product.stock - qty : product.stock + qty,
    changedQty: qty,
    newQty: product.stock,
    reason,
    order,
    performedBy: actor?._id,
    performedByName: actor?.name,
    performedByRole: actor?.role
  });
