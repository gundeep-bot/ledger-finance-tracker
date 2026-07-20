const mongoose = require('mongoose');

const BILLING_CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly'];

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "Netflix", "Rent", "Gym"
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Subscriptions' },
    billingCycle: { type: String, enum: BILLING_CYCLES, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    nextBillingDate: { type: Date, required: true }, // cron job checks this field
    isActive: { type: Boolean, default: true },
    lastBilledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ isActive: 1, nextBillingDate: 1 });

// Advances nextBillingDate by one billing cycle from a given date
subscriptionSchema.methods.computeNextBillingDate = function (fromDate = this.nextBillingDate) {
  const next = new Date(fromDate);
  switch (this.billingCycle) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
module.exports.BILLING_CYCLES = BILLING_CYCLES;
