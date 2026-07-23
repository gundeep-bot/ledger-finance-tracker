const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Booking must be for an event']
  },
  numberOfTickets: {
    type: Number,
    required: [true, 'Please specify number of tickets'],
    min: [1, 'Must book at least 1 ticket'],
    max: [10, 'Cannot book more than 10 tickets at once']
  },
  selectedSeats: [{
    row: {
      type: String,
      required: true
    },
    seatNumber: {
      type: Number,
      required: true
    },
    seatId: {
      type: String,
      required: true
    }
  }],
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Price cannot be negative']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'refunded'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Index for faster queries
bookingSchema.index({ user: 1, event: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingReference) {
    // Generate format: EVT-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    this.bookingReference = `EVT-${dateStr}-${random}`;
  }
  next();
});

// Virtual to check if booking is active
bookingSchema.virtual('isActive').get(function() {
  return this.status === 'confirmed';
});

// Set JSON options to include virtuals
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);