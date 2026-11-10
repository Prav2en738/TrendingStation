import mongoose from 'mongoose';

// The label the admin picks. It decides which Home-page section shows the product.
export const SECTIONS = ['regular', 'trending', 'new', 'handmade', 'bestseller', 'coming-soon'];

// Small badge text shown on the product card, derived from the section.
export const BADGES = {
  regular: '',
  trending: 'TRENDING',
  new: 'NEW ARRIVAL',
  handmade: 'HANDMADE',
  bestseller: 'BEST SELLER',
  'coming-soon': 'COMING SOON'
};

const productSchema = new mongoose.Schema({
  // Admin-chosen product code, e.g. TOY-101
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  // price = what the customer pays. oldPrice = the struck-through original (when discounted).
  price: { type: Number, required: true, min: 1 },
  oldPrice: { type: Number, min: 0, default: null },
  discount: { type: Number, min: 0, max: 99, default: 0 },
  stock: {
    type: Number,
    default: 0,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Stock must be a whole number' }
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  section: { type: String, enum: SECTIONS, default: 'regular' },
  badge: { type: String, default: '' },
  recommendedAge: { type: String },
  brand: { type: String },
  material: { type: String },
  safety: { type: String }
}, {
  timestamps: true,
  // The React app reads `id`, so send `id` instead of `_id`.
  toJSON: {
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  }
});

export default mongoose.model('Product', productSchema);
