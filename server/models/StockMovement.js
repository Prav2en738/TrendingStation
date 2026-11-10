import mongoose from 'mongoose';

// One row for every change to a product's stock (never edited or deleted).
const stockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Copied so the history still reads correctly if the product is renamed or deleted.
  productCode: { type: String },
  productName: { type: String, required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  previousQty: { type: Number, required: true },
  changedQty: { type: Number, required: true }, // always positive; `type` gives the direction
  newQty: { type: Number, required: true },
  reason: { type: String, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  // Who caused it: the admin, or the customer whose order moved the stock.
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  performedByRole: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  }
});

stockMovementSchema.index({ createdAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);
