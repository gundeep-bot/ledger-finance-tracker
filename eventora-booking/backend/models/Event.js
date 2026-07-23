// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Music', 'Sports', 'Technology', 'Art', 'Food', 'Business', 'Education', 'Entertainment', 'Other']
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  bookings: {
    type: Number,
    default: 0,
    min: 0
  },
  seatLayout: {
    rows: {
      type: Number,
      default: 10
    },
    seatsPerRow: {
      type: Number,
      default: 12
    },
    layout: {
      type: String,
      enum: ['standard', 'theater', 'stadium', 'vip'],
      default: 'standard'
    },
    bookedSeats: [{
      row: String,
      seat: Number
    }],
    seatCategories: {
      type: Map,
      of: {
        price: Number,
        rows: [String]
      },
      default: {}
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  source: {
    type: String,
    enum: ['bookmyshow', 'tmdb', 'manual', 'external'],
    default: 'manual'
  },
  externalId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);