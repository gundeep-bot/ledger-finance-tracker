const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserDashboard,
  deleteUserAccount,
  deactivateUserAccount,
  exportUserData,
  getAllUsers
} = require('../controllers/users');

// Protected routes (User must be logged in)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.get('/dashboard', protect, getUserDashboard);
router.get('/export', protect, exportUserData);
router.patch('/account/deactivate', protect, deactivateUserAccount);
router.delete('/account', protect, deleteUserAccount);

// Admin only routes
router.get('/admin/all', protect, admin, getAllUsers);

module.exports = router;