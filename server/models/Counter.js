import mongoose from 'mongoose';

// Tiny helper collection that hands out 1001, 1002, ... for order numbers.
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

export const nextOrderNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'order',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `ORD-${1000 + counter.seq}`; // first order is ORD-1001
};

export default Counter;
