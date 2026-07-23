// Script to create admin user
// Run: node scripts/createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  try {
    await connectDB();
    
    const adminEmail = 'your-admin-email@example.com';
    const adminPassword = 'your-secure-password';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      existingAdmin.isActive = true;
      existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      const admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: 'admin',
        isVerified: true,
        provider: 'local',
        isActive: true
      });
      console.log('✅ Admin user created successfully!');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

