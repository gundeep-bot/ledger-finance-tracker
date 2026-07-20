const mongoose = require('mongoose');

const CATEGORIES = [
  'Groceries',
  'Transport',
  'Entertainment',
  'Rent',
  'Utilities',
  'Subscriptions',
  'Health',
  'Dining',
  'Other',
];

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
    source: {
      type: String,
      enum: ['manual', 'subscription'],
      default: 'manual',
    },
    // Set only when source === 'subscription', links back to the recurring bill
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
  },
  { timestamps: true }
);

// Speeds up the monthly aggregation queries (user + date range)
transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
