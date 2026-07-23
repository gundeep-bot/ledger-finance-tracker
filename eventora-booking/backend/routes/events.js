const express = require('express');
const router = express.Router();
const { protect, admin, organizer } = require('../middleware/auth');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByCategory,
  getUpcomingEvents,
  getFeaturedEvents,
  fetchLiveEvents,
  syncBookMyShowEvents
} = require('../controllers/events');

// Public routes
router.get('/', getAllEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/featured', getFeaturedEvents);
router.get('/category/:category', getEventsByCategory);
router.get('/locations', require('../controllers/events').getLocations); // Get all locations
router.get('/:id/seats', require('../controllers/events').getSeatAvailability); // Get seat availability
router.get('/live/fetch', fetchLiveEvents); // Fetch live events from BookMyShow
router.get('/live/sync', syncBookMyShowEvents); // Sync live events to database
router.get('/:id', getEventById);

// Protected routes (Admin/Organizer only)
router.post('/', protect, organizer, createEvent);
router.put('/:id', protect, organizer, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;