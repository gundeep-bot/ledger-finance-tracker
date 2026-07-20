const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createSubscription,
  listSubscriptions,
  updateSubscription,
  cancelSubscription,
} = require('../controllers/subscriptionController');

router.use(auth);

router.post('/', createSubscription);
router.get('/', listSubscriptions);
router.put('/:id', updateSubscription);
router.delete('/:id', cancelSubscription);

module.exports = router;
