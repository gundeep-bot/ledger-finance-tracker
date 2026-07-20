const Subscription = require('../models/Subscription');

exports.createSubscription = async (req, res) => {
  try {
    const { name, amount, category, billingCycle, startDate } = req.body;
    if (!name || amount == null || !billingCycle) {
      return res.status(400).json({ message: 'name, amount and billingCycle are required' });
    }

    const start = startDate ? new Date(startDate) : new Date();

    const sub = await Subscription.create({
      user: req.userId,
      name,
      amount,
      category: category || 'Subscriptions',
      billingCycle,
      startDate: start,
      nextBillingDate: start, // first charge happens on start date via cron
    });

    res.status(201).json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create subscription', error: err.message });
  }
};

exports.listSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.userId }).sort({ nextBillingDate: 1 });
    res.json({ subscriptions: subs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: err.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subscription', error: err.message });
  }
};

// Soft-delete via isActive so cron stops billing it, rather than hard delete
exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isActive: false },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel subscription', error: err.message });
  }
};
