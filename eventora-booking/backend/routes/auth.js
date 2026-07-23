const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  signup,
  verifyOTP,
  resendOTP,
  login,
  googleLogin,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;