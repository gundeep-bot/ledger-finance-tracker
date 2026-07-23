// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try both possible environment variable names
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/eventora';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Test if we can access the Event model
    const Event = require('../models/Event');
    const count = await Event.countDocuments();
    console.log(`📋 Events in database: ${count}`);
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;