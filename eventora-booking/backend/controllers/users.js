const User = require('../models/User');
const Booking = require('../models/Booking');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, address, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    // Update fields
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof phone !== 'undefined') user.phone = phone || '';
    if (typeof address !== 'undefined') user.address = address || '';
    if (typeof avatar !== 'undefined') user.avatar = avatar || '';

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Get user dashboard stats
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total bookings
    const totalBookings = await Booking.countDocuments({ user: userId });

    // Get upcoming bookings - FIXED VERSION
    const upcomingBookingsData = await Booking.find({
      user: userId,
      status: 'confirmed'
    }).populate('event');
    
    const upcomingBookings = upcomingBookingsData.filter(
      booking => booking.event && new Date(booking.event.date) >= new Date()
    ).length;

    // Get cancelled bookings
    const cancelledBookings = await Booking.countDocuments({
      user: userId,
      status: 'cancelled'
    });

    // Get recent bookings
    const recentBookings = await Booking.find({ user: userId })
      .populate('event', 'title date time location imageUrl')
      .sort({ bookingDate: -1 })
      .limit(5);

    // Calculate total spent
    const bookings = await Booking.find({ user: userId, status: 'confirmed' });
    const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        upcomingBookings,
        cancelledBookings,
        totalSpent,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Delete user account
exports.deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cancel all upcoming bookings
    const upcomingBookings = await Booking.find({
      user: req.user.id,
      status: 'confirmed'
    });

    for (let booking of upcomingBookings) {
      booking.status = 'cancelled';
      await booking.save();
    }

    // Delete user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

// Get all users (Admin only)
exports.deactivateUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is already deactivated'
      });
    }

    // Cancel upcoming bookings
    const upcomingBookings = await Booking.find({
      user: req.user.id,
      status: 'confirmed'
    }).populate('event');

    const now = new Date();

    for (let booking of upcomingBookings) {
      if (booking.event && new Date(booking.event.date) >= now) {
        booking.status = 'cancelled';
        await booking.save();
      }
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating account',
      error: error.message
    });
  }
};

exports.exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry -resetPasswordOTP -resetPasswordOTPExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bookings = await Booking.find({ user: req.user.id })
      .populate('event', 'title date time location venue price')
      .sort({ bookingDate: -1 })
      .lean();

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        provider: user.provider,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deactivatedAt: user.deactivatedAt
      },
      bookings: bookings.map(booking => ({
        id: booking._id,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bookingDate: booking.bookingDate,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        bookingReference: booking.bookingReference,
        numberOfTickets: booking.numberOfTickets,
        selectedSeats: booking.selectedSeats,
        event: booking.event
      }))
    };

    res.setHeader('Content-Disposition', 'attachment; filename="eventora-user-data.json"');
    res.status(200).json({
      success: true,
      data: exportPayload
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting user data',
      error: error.message
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};