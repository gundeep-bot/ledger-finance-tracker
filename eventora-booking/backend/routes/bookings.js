const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getEventBookings,
  updatePaymentStatus
} = require('../controllers/bookings');

// Protected routes (User must be logged in)
router.post('/', protect, createBooking);
router.post('/payment', protect, require('../controllers/bookings').processPayment); // Process payment
router.get('/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/payment', protect, updatePaymentStatus);

// Admin only routes
router.get('/admin/all', protect, admin, getAllBookings);
router.get('/event/:eventId', protect, admin, getEventBookings);

module.exports = router;