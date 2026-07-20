const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a manual expense entry
exports.createTransaction = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    if (amount == null || !category) {
      return res.status(400).json({ message: 'amount and category are required' });
    }

    const tx = await Transaction.create({
      user: req.userId,
      amount,
      category,
      description,
      date: date || Date.now(),
      source: 'manual',
    });

    res.status(201).json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};

// List transactions, optionally filtered by month (?month=2026-07) or category
exports.listTransactions = async (req, res) => {
  try {
    const { month, category } = req.query;
    const filter = { user: req.userId };

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      filter.date = { $gte: start, $lt: end };
    }
    if (category) filter.category = category;

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update transaction', error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete transaction', error: err.message });
  }
};

// Core analytics endpoint: burn rate, category breakdown, daily trend
exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1; // 1-indexed

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [categoryBreakdown, dailyTrend, totalResult, user] = await Promise.all([
      // Pie chart data
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: start, $lt: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      // Line graph data
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Total burn rate
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.findById(userId),
    ]);

    const totalSpent = totalResult[0]?.total || 0;
    const budget = user?.monthlyBudget || 0;

    res.json({
      period: { year, month },
      totalSpent,
      monthlyBudget: budget,
      remaining: budget - totalSpent,
      percentUsed: budget > 0 ? Number(((totalSpent / budget) * 100).toFixed(1)) : null,
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, total: c.total })),
      dailyTrend: dailyTrend.map((d) => ({ date: d._id, total: d.total })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute analytics', error: err.message });
  }
};
