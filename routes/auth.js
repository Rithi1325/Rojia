import express from 'express';
import {
  // Signup with OTP
  sendSignupOTP,
  verifySignupOTP,
  
  // Login (Direct without OTP)
  login,
  
  // Password Reset
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  
  // Profile Management
  getProfile,
  updateProfile,
  changePassword,
  checkPhone,
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================
// PUBLIC ROUTES
// ========================

// Signup with OTP
router.post('/send-signup-otp', sendSignupOTP);
router.post('/verify-signup-otp', verifySignupOTP);

// Login (Direct without OTP)
router.post('/login', login);

// Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Utility
router.post('/check-phone', checkPhone);

// ========================
// PROTECTED ROUTES
// ========================

router.use(protect); // All routes below this are protected

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;