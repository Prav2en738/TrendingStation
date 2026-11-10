import 'dotenv/config';
import mongoose from 'mongoose';
import Product, { BADGES } from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import { logMovement } from '../utils/stock.js';
import sampleProducts from '../data/sampleProducts.js';

// The sample data used a "badge"; the app now uses a "section" label instead.
const SECTION_FROM_BADGE = { TRENDING: 'trending', NEW: 'new', HANDMADE: 'handmade', BESTSELLER: 'bestseller' };

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    const existing = await Product.countDocuments();
    if (existing > 0) {
      console.log(`Database already has ${existing} products`);
      if (!process.argv.includes('--force')) {
        console.log('Skipping seed. Use --force to reseed.');
        process.exit(0);
      }
      // reseeding wipes the old catalogue AND its history so the numbers stay consistent
      await Promise.all([
        Product.deleteMany({}), StockMovement.deleteMany({}), Order.deleteMany({}), Counter.deleteMany({})
      ]);
      console.log('Existing products, orders and stock history cleared');
    }

    for (const [index, sample] of sampleProducts.entries()) {
      const { badge, ...rest } = sample;
      const section = SECTION_FROM_BADGE[badge] || 'regular';
      const product = await Product.create({
        ...rest,
        code: `TOY-${String(index + 101)}`,
        section,
        badge: BADGES[section],
        images: [rest.image]
      });
      await logMovement({ product, type: 'IN', qty: product.stock, reason: 'Initial stock (seed data)' });
    }

    console.log(`${sampleProducts.length} products seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
