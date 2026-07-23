const mongoose = require('mongoose');
const Event = require('../models/Event');

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      location,
      venue,
      price,
      totalSeats,
      imageUrl,
      organizer
    } = req.body;

    // Validation
    if (!title || !description || !category || !date || !time || !location || !venue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const event = await Event.create({
      title,
      description,
      category,
      date,
      time,
      location,
      venue,
      price: price || 0,
      totalSeats: totalSeats || 100,
      availableSeats: totalSeats || 100,
      imageUrl: imageUrl || '',
      organizer: organizer || req.user.id,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Get all events with filters
exports.getAllEvents = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, date, location, sortBy } = req.query;
    
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by date
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDay };
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Sorting
    let sortOption = { date: 1 }; // Default: upcoming events first
    if (sortBy === 'price_low') sortOption = { price: 1 };
    if (sortBy === 'price_high') sortOption = { price: -1 };
    if (sortBy === 'popular') sortOption = { bookings: -1 };
    if (sortBy === 'newest') sortOption = { createdAt: -1 };

    const events = await Event.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Get single event by ID
exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Add validation for ObjectId
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event found successfully',
      data: event
    });
  } catch (error) {
    console.error('更新事件获取失败:', error);
    res.status(500).json({
      success: false,
      message: '获取事件失败',
      error: error.message
    });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Add validation for ObjectId
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('更新事件失败:', error);
    res.status(500).json({
      success: false,
      message: '更新事件失败',
      error: error.message
    });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Add validation for ObjectId
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await Event.findByIdAndDelete(eventId);
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('删除事件失败:', error);
    res.status(500).json({
        success: false,
        message: '删除事件失败',
        error: error.message
      });
  }
};

// Get events by category
exports.getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ category }).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('获取分类事件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类事件失败',
      error: error.message
    });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const currentDate = new Date();
    const {
      limit: limitParam,
      location: locationParam
    } = req.query;

    const limit = Math.min(parseInt(limitParam, 10) || 50, 200);
    const query = {
      date: { $gte: currentDate },
      availableSeats: { $gt: 0 }
    };

    if (locationParam && locationParam !== 'all') {
      query.location = { $regex: locationParam, $options: 'i' };
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('获取即将到来的事件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取即将到来的事件失败',
      error: error.message
    });
  }
};

// Get featured events
exports.getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      featured: true
    })
    .sort({ date: 1 })
    .limit(6);

    res.status(200).json({
      success: events.length > 0 ? 'success' : 'success',
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('获取推荐事件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐事件失败',
      error: error.message
    });
  }
};

// Fetch live events from BookMyShow-style sources (dynamic fetching)
exports.fetchLiveEvents = async (req, res) => {
  try {
    const { fetchLiveEvents, syncEventsToDatabase } = require('../services/bookmyshowService');
    const { city, limit, sync } = req.query;

    // Fetch events dynamically from external source (fresh data each time)
    // If no city specified, fetch from all cities across India
    const events = await fetchLiveEvents({
      city: city || null, // null means fetch from all cities
      limit: parseInt(limit) || 50, // Increased for more variety
      source: 'auto'
    });

    // Filter to only upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    // If sync is true, save events to database
    if (sync === 'true' && upcomingEvents.length > 0) {
      const syncedEvents = await syncEventsToDatabase(Event, upcomingEvents, req.user?.id || null);
      return res.status(200).json({
        success: true,
        message: `Fetched and synced ${syncedEvents.length} upcoming events from BookMyShow`,
        count: syncedEvents.length,
        data: syncedEvents
      });
    }

    res.status(200).json({
      success: true,
      message: `Fetched ${upcomingEvents.length} live upcoming events from BookMyShow`,
      count: upcomingEvents.length,
      data: upcomingEvents
    });
  } catch (error) {
    console.error('Error fetching live events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live events',
      error: error.message
    });
  }
};

// Sync BookMyShow upcoming events to database
exports.syncBookMyShowEvents = async (req, res) => {
  try {
    const { fetchLiveEvents, syncEventsToDatabase } = require('../services/bookmyshowService');
    const { city, limit } = req.query;

    // Fetch upcoming events only (increase limit to get more variety)
    // If no city specified, fetch from all cities across India
    const events = await fetchLiveEvents({
      city: city || null, // null means fetch from all cities
      limit: parseInt(limit) || 50, // Increased limit to get more events
      source: 'auto'
    });

    // Filter to only upcoming events (future dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    if (upcomingEvents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No upcoming events found to sync',
        count: 0,
        data: []
      });
    }

    // Sync upcoming events to database
    const syncedEvents = await syncEventsToDatabase(Event, upcomingEvents, req.user?.id || null);

    res.status(200).json({
      success: true,
      message: `Synced ${syncedEvents.length} upcoming events to database`,
      count: syncedEvents.length,
      data: syncedEvents
    });
  } catch (error) {
    console.error('Error syncing upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing upcoming events',
      error: error.message
    });
  }
};

// Get all unique locations
exports.getLocations = async (req, res) => {
  try {
    const locations = await Event.distinct('location');
    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations.sort()
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// Get seat availability for an event
exports.getSeatAvailability = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Initialize seat layout if not exists
    if (!event.seatLayout || !event.seatLayout.bookedSeats) {
      event.seatLayout = {
        rows: 10,
        seatsPerRow: 12,
        layout: 'standard',
        bookedSeats: [],
        seatCategories: {}
      };
      await event.save();
    }

    // Get all booked seats from bookings
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ 
      event: eventId, 
      status: 'confirmed' 
    }).select('selectedSeats');

    const bookedSeats = [];
    bookings.forEach(booking => {
      if (booking.selectedSeats && booking.selectedSeats.length > 0) {
        booking.selectedSeats.forEach(seat => {
          bookedSeats.push({
            row: seat.row,
            seat: seat.seatNumber
          });
        });
      }
    });

    // Update event's booked seats
    event.seatLayout.bookedSeats = bookedSeats;
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        seatLayout: event.seatLayout,
        availableSeats: event.availableSeats,
        totalSeats: event.totalSeats
      }
    });
  } catch (error) {
    console.error('Error fetching seat availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seat availability',
      error: error.message
    });
  }
};