const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { eventId, numberOfTickets, paymentMethod, selectedSeats, paymentDetails } = req.body;
    const userId = req.user.id;

    // Validation
    if (!eventId || !numberOfTickets) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and number of tickets are required'
      });
    }

    if (numberOfTickets < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of tickets must be at least 1'
      });
    }

    // If seat selection is enabled, validate seats
    if (selectedSeats && selectedSeats.length > 0) {
      if (selectedSeats.length !== numberOfTickets) {
        return res.status(400).json({
          success: false,
          message: `Number of selected seats (${selectedSeats.length}) must match number of tickets (${numberOfTickets})`
        });
      }
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event date has passed
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book tickets for past events'
      });
    }

    // Check available seats
    if (event.availableSeats < numberOfTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seats available`
      });
    }

    // If seats are selected, validate they're available
    if (selectedSeats && selectedSeats.length > 0) {
      // Initialize seat layout if needed
      if (!event.seatLayout || !event.seatLayout.bookedSeats) {
        event.seatLayout = {
          rows: 10,
          seatsPerRow: 12,
          layout: 'standard',
          bookedSeats: [],
          seatCategories: {}
        };
      }

      // Get all booked seats
      const existingBookings = await Booking.find({ 
        event: eventId, 
        status: 'confirmed' 
      }).select('selectedSeats');

      const bookedSeats = [];
      existingBookings.forEach(booking => {
        if (booking.selectedSeats && booking.selectedSeats.length > 0) {
          booking.selectedSeats.forEach(seat => {
            bookedSeats.push(`${seat.row}-${seat.seatNumber}`);
          });
        }
      });

      // Check if any selected seat is already booked
      for (const seat of selectedSeats) {
        const seatId = `${seat.row}-${seat.seatNumber}`;
        if (bookedSeats.includes(seatId)) {
          return res.status(400).json({
            success: false,
            message: `Seat ${seat.row}${seat.seatNumber} is already booked`
          });
        }
      }
    }

    // Calculate total price
    const totalPrice = event.price * numberOfTickets;

    // Process payment if payment details are provided
    let paymentStatus = 'pending';
    if (paymentDetails && paymentMethod === 'card') {
      // Validate dummy card (for demo purposes)
      const { cardNumber, cardHolder, expiryDate, cvv } = paymentDetails;
      
      // Dummy card validation (accept any card for demo)
      if (cardNumber && cardHolder && expiryDate && cvv) {
        paymentStatus = 'paid';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment details'
        });
      }
    }

    // Format selected seats
    const formattedSeats = selectedSeats ? selectedSeats.map(seat => ({
      row: seat.row,
      seatNumber: seat.seatNumber,
      seatId: `${seat.row}-${seat.seatNumber}`
    })) : [];

    // Create booking
    const booking = await Booking.create({
      user: userId,
      event: eventId,
      numberOfTickets,
      selectedSeats: formattedSeats,
      totalPrice,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus,
      bookingDate: new Date()
    });

    // Update event seats and bookings count
    event.availableSeats -= numberOfTickets;
    event.bookings += 1;
    
    // Update booked seats in event
    if (selectedSeats && selectedSeats.length > 0) {
      if (!event.seatLayout.bookedSeats) {
        event.seatLayout.bookedSeats = [];
      }
      selectedSeats.forEach(seat => {
        event.seatLayout.bookedSeats.push({
          row: seat.row,
          seat: seat.seatNumber
        });
      });
    }
    
    await event.save();

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('event', 'title date time location venue imageUrl')
      .populate('user', 'name email');

    // Send confirmation email
    try {
      const { sendBookingConfirmationEmail } = require('../services/emailService');
      const user = await User.findById(userId);
      await sendBookingConfirmationEmail(user.email, user.name, populatedBooking);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get all bookings for a user
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ user: userId })
      .populate('event', 'title date time location venue imageUrl category')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date time location venue imageUrl category organizer')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to user
    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Check if event has already passed
    if (new Date(booking.event.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking for past events'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Return seats to event
    const event = await Event.findById(booking.event._id);
    event.availableSeats += booking.numberOfTickets;
    event.bookings -= 1;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Get all bookings (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('event', 'title date location')
      .populate('user', 'name email')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get bookings for a specific event (Admin/Organizer)
exports.getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;

    const bookings = await Booking.find({ event: eventId, status: 'confirmed' })
      .populate('user', 'name email phone')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching event bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event bookings',
      error: error.message
    });
  }
};

// Update booking payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

// Process payment for booking
exports.processPayment = async (req, res) => {
  try {
    const { bookingId, paymentDetails } = req.body;
    const userId = req.user.id;

    if (!bookingId || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and payment details are required'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('event')
      .populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to user
    if (booking.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process payment for this booking'
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Validate dummy card (for demo purposes)
    const { cardNumber, cardHolder, expiryDate, cvv } = paymentDetails;
    
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'All payment details are required'
      });
    }

    // Dummy card validation - accept any card for demo
    // In production, this would integrate with a payment gateway
    const isValidCard = cardNumber.replace(/\s/g, '').length >= 13 && 
                       cardNumber.replace(/\s/g, '').length <= 19 &&
                       cvv.length >= 3 && cvv.length <= 4;

    if (!isValidCard) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card details'
      });
    }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'card';
    await booking.save();

    // Send confirmation email
    try {
      const { sendBookingConfirmationEmail } = require('../services/emailService');
      await sendBookingConfirmationEmail(booking.user.email, booking.user.name, booking);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};