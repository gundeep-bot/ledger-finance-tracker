const User = require('../models/User');
const { generateOTP, sendOTPEmail, sendPasswordResetOTP } = require('../services/emailService');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Helper function to send the JWT token in the response
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        }
    });
};

// @desc    Register user (Signup) with OTP
// @route   POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide name, email and password' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email }).select('+otp +otpExpiry');
        
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ 
                    success: false,
                    message: 'An account with this email already exists. Please login.' 
                });
            } else {
                // User exists but not verified, resend OTP
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                existingUser.otp = otp;
                existingUser.otpExpiry = otpExpiry;
                await existingUser.save();

                await sendOTPEmail(email, otp, name);

                return res.status(200).json({ 
                    success: true,
                    message: 'Account exists but not verified. OTP sent to your email.',
                    email: email,
                    requiresVerification: true
                });
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            otp,
            otpExpiry,
            isVerified: false
        });

        // Send OTP email
        await sendOTPEmail(email, otp, name);

        res.status(201).json({ 
            success: true,
            message: 'Account created successfully! Please verify your email with the OTP sent.',
            email: email,
            requiresVerification: true
        });

    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and OTP' 
            });
        }

        const user = await User.findOne({ email }).select('+otp +otpExpiry');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ 
                success: false, 
                message: 'Account already verified. Please login.' 
            });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP not found. Please request a new one.' 
            });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please try again.' 
            });
        }

        // Verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'Email verified successfully! You can now login.',
            verified: true
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email' 
            });
        }

        const user = await User.findOne({ email }).select('+otp +otpExpiry');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ 
                success: false, 
                message: 'Account already verified. Please login.' 
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp, user.name);

        res.status(200).json({ 
            success: true, 
            message: 'OTP resent successfully! Check your email.' 
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found. Please sign up.' 
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false,
                message: 'Email not verified. Please verify your email first.',
                needsVerification: true,
                email: email
            });
        }

        // Check if password matches
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Send response with JWT token
        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login.' 
        });
    }
};

// @desc    Get current logged-in user details (getMe)
// @route   GET /api/auth/me
// @access  Private (uses the 'protect' middleware)
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error.' 
        });
    }
};

// @desc    Google OAuth Login/Signup
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
    try {
        const { tokenId } = req.body;

        if (!tokenId) {
            return res.status(400).json({
                success: false,
                message: 'Google token is required'
            });
        }

        // Verify Google token (using google-auth-library)
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: tokenId,
                audience: process.env.GOOGLE_CLIENT_ID
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if user exists with this email
            user = await User.findOne({ email });

            if (user) {
                // Link Google account to existing user
                user.googleId = googleId;
                user.provider = 'google';
                user.avatar = picture || '';
                if (!user.isVerified) {
                    user.isVerified = true; // Auto-verify Google users
                }
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    name,
                    email,
                    googleId,
                    provider: 'google',
                    avatar: picture || '',
                    isVerified: true // Auto-verify Google users
                });
            }
        } else {
            // Update user info
            user.name = name;
            user.avatar = picture || user.avatar;
            await user.save();
        }

        // Send token response
        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during Google login'
        });
    }
};

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        data: {}
    });
};

// @desc    Forgot password - Request OTP
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide your email address' 
            });
        }

        // Find user
        const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpiry');

        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({ 
                success: true,
                message: 'If an account with that email exists, a password reset OTP has been sent.' 
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please verify your email first before resetting password.' 
            });
        }

        // Generate password reset OTP
        const resetOTP = generateOTP();
        const resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save reset OTP to user
        user.resetPasswordOTP = resetOTP;
        user.resetPasswordOTPExpiry = resetOTPExpiry;
        await user.save();

        // Send password reset OTP email
        try {
            await sendPasswordResetOTP(email, resetOTP, user.name);
        } catch (emailError) {
            // If email fails, clear the OTP
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpiry = undefined;
            await user.save();
            throw emailError;
        }

        res.status(200).json({ 
            success: true,
            message: 'Password reset OTP sent to your email address.',
            email: email
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// @desc    Reset password - Verify OTP and set new password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Validate required fields
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email, OTP, and new password' 
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Find user with reset OTP fields
        const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpiry +password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if reset OTP exists
        if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
            return res.status(400).json({ 
                success: false, 
                message: 'No password reset request found. Please request a new password reset.' 
            });
        }

        // Check if OTP has expired
        if (new Date() > user.resetPasswordOTPExpiry) {
            // Clear expired OTP
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpiry = undefined;
            await user.save();
            
            return res.status(400).json({ 
                success: false, 
                message: 'Password reset OTP has expired. Please request a new one.' 
            });
        }

        // Verify OTP
        if (user.resetPasswordOTP !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please try again.' 
            });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpiry = undefined;
        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'Password reset successfully! You can now login with your new password.' 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

module.exports = {
    signup,
    verifyOTP,
    resendOTP,
    login,
    googleLogin,
    getMe,
    logout,
    forgotPassword,
    resetPassword
};