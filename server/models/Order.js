import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Pending', 'Dispatched', 'Delivered', 'Not Available', 'Cancelled', 'Returned'];

// Statuses where the order's stock has to go back on the shelf.
export const RESTOCK_STATUSES = ['Cancelled', 'Not Available', 'Returned'];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Snapshot of the product at order time (price, name, image never change later)
  productCode: String,
  name: { type: String, required: true },
  image: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, // e.g. ORD-1001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerEmail: String,
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
  // true while this order's units are taken out of stock. Flipped atomically so stock
  // can never be deducted or given back twice.
  stockDeducted: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  }
});

orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
