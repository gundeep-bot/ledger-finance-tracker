const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  getMonthlyAnalytics,
} = require('../controllers/transactionController');

router.use(auth); // all routes below require a valid JWT

router.get('/analytics', getMonthlyAnalytics);
router.post('/', createTransaction);
router.get('/', listTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
