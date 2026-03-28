import fs from 'fs';
import User from '../models/user.model.js';
import Franchise from '../models/franchise.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import { sendOTPViaSMS, isTwilioConfigured } from '../utils/sendSMS.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import generateToken from '../utils/generateToken.js';
export const signup = async (req, res) => {
  try {
    console.log('[SIGNUP DEBUG] Request body:', req.body);
    console.log('[SIGNUP DEBUG] Request file:', req.file);

    const { name, contact, phone, email, password, role, franchise } = req.body;
    const userContact = contact || phone;

    if (!name || !userContact) {
      console.log('[SIGNUP ERROR] Missing fields:', { name, userContact });
      return res
        .status(400)
        .json(ApiError.badRequest('Name and contact/phone are required').toJSON());
    }

    // Always assign 'user' role for mobile app signups (agents managed via admin)
    const finalRole = 'user';
    // Generate a random password if not provided (OTP-based auth)
    const finalPassword = password || Math.random().toString(36).slice(-10) + 'Aa1!';

    const existedUser = await User.findOne({
      $or: [
        { contact: userContact },
        ...(email ? [{ email }] : []),
      ],
    });
    if (existedUser) {
      console.log('[SIGNUP ERROR] User already exists:', { email, contact: userContact });
      return res
        .status(409)
        .json(ApiError.badRequest('User with this phone number already exists').toJSON());
    }

    let franchiseDoc = null;
    if (franchise) {
      franchiseDoc = await Franchise.findById(franchise);
      if (!franchiseDoc) {
        return res
          .status(404)
          .json(ApiError.notFound('Franchise not found').toJSON());
      }
    }

    // Avatar upload (OPTIONAL)
    let avatar = null;

    if (req.file?.path) {
      const avatarLocalPath = req.file.path;

      try {
        console.log('[SIGNUP] Starting avatar upload to Cloudinary...');

        // Add timeout wrapper for Cloudinary upload
        const uploadPromise = uploadOnCloudinary(avatarLocalPath);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Cloudinary upload timeout')), 30000)
        );

        const uploadedAvatar = await Promise.race([uploadPromise, timeoutPromise]);

        if (uploadedAvatar?.url) {
          avatar = uploadedAvatar.url;
          console.log('[SIGNUP] Avatar uploaded successfully:', avatar);
        } else {
          console.warn('[SIGNUP] Avatar upload returned null, continuing without avatar');
        }

        // Clean up temp file
        if (fs.existsSync(avatarLocalPath)) {
          fs.unlinkSync(avatarLocalPath);
        }
      } catch (err) {
        console.error('[SIGNUP ERROR] Avatar upload failed:', err.message);

        // Clean up temp file on error
        if (fs.existsSync(avatarLocalPath)) {
          fs.unlinkSync(avatarLocalPath);
        }

        // Don't fail signup if avatar upload fails - continue without avatar
        console.log('[SIGNUP] Continuing signup without avatar due to upload failure');
      }
    }


    const user = await User.create({
      name,
      contact: userContact,
      email: email || `${userContact}@noemail.local`,
      password: finalPassword,
      role: finalRole,
      status: 'active', // auto-activate for OTP-based signup
      avatar,
      franchise: franchiseDoc ? franchiseDoc._id : null,
    });

    if (finalRole === 'agent' && franchiseDoc) {
      await Franchise.findByIdAndUpdate(franchiseDoc._id, {
        $push: { agents: user._id },
      });
    }

    const createdUser = await User.findById(user._id).select(
      '-password -refreshToken',
    );

    if (!createdUser) {
      console.error('[SIGNUP ERROR] User creation verification failed');
      return res
        .status(500)
        .json(ApiError.internal('Something went wrong while registering the user').toJSON());
    }

    // Generate and send OTP for phone verification via SMS
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via Twilio SMS (primary) or Email (fallback)
    const useSMS = isTwilioConfigured();
    let otpSent = false;

    if (useSMS) {
      // Send via Twilio SMS with timeout
      try {
        const smsPromise = sendOTPViaSMS(user.contact, otp);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SMS send timeout')), 15000)
        );
        await Promise.race([smsPromise, timeoutPromise]);
        console.log('[SIGNUP SUCCESS] OTP SMS sent to:', user.contact);
        otpSent = true;
      } catch (smsError) {
        console.error('[SIGNUP WARNING] Failed to send OTP SMS:', smsError.message);
        console.log('[SIGNUP] OTP for manual testing:', otp);
      }
    } else {
      // Fallback to email with timeout
      try {
        const emailPromise = sendEmail(
          user.email,
          'Verify Your Email - SS Property Guru',
          `Welcome to SS Property Guru!\n\nYour verification OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't create this account, please ignore this email.`
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email send timeout')), 15000)
        );
        await Promise.race([emailPromise, timeoutPromise]);
        console.log('[SIGNUP SUCCESS] OTP email sent to:', user.email);
        otpSent = true;
      } catch (emailError) {
        console.error('[SIGNUP WARNING] Failed to send OTP email:', emailError.message);
        console.log('[SIGNUP] OTP for manual testing:', otp);
      }
    }

    const token = generateToken(user);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    console.log('[SIGNUP SUCCESS] User registered:', createdUser.email);
    // In dev/test mode include OTP in response so testing works without email
    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: createdUser, token, ...(devOtp && { devOtp }) },
          'User registered successfully. Please check your email for OTP verification.',
        ),
      );
  } catch (err) {
    console.error('[SIGNUP ERROR] Exception:', err);
    console.error('[SIGNUP ERROR] Stack:', err.stack);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(409)
        .json(ApiError.badRequest(`User with this ${field} already exists`).toJSON());
    }

    return res
      .status(500)
      .json(ApiError.internal('Something went wrong while registering user').toJSON());
  }
};
export const signin = async (req, res) => {
  try {
    const { identifier, email, contact, password } = req.body;
    const id = identifier || email || contact;

    console.log('[SIGNIN DEBUG] Attempting login for:', id);

    if (!id || !password) {
      return res.status(400).json(ApiError.badRequest('Identifier (email/contact) and password are required').toJSON());
    }

    const user = await User.findOne({
      $or: [{ email: id }, { contact: id }],
    }).select('+password +refreshToken');

    if (!user) {
      console.log('[SIGNIN ERROR] User not found:', id);
      return res.status(404).json(ApiError.notFound('User does not exist').toJSON());
    }

    console.log('[SIGNIN DEBUG] User found:', user.email, '| Status:', user.status, '| Role:', user.role);

    const isMatch = await user.comparePassword(password);
    console.log('[SIGNIN DEBUG] Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json(ApiError.unauthorized('Invalid credentials').toJSON());
    }

    if (user.status === 'inactive' || user.status === 'pending' || user.status === 'rejected') {
      console.log('[SIGNIN ERROR] Account inactive, status:', user.status);
      return res.status(403).json(ApiError.forbidden('Your account is inactive. Please contact the administrator.').toJSON());
    }

    if (user.role === 'franchise') {
      const franchise = await Franchise.findOne({ email: user.email });
      if (franchise && !user.franchise) {
        user.franchise = franchise._id;
        await user.save();
      }

      // Check if franchise record itself is inactive
      if (franchise && ['inactive', 'rejected', 'pending'].includes(franchise.status)) {
        return res
          .status(403)
          .json(
            ApiError.forbidden(
              'Your franchise account is inactive. Please contact the administrator.',
            ),
          );
      }
    }

    if (user.role === 'agent') {
      const franchise = user.franchise
        ? await Franchise.findById(user.franchise)
        : null;

      if (
        franchise &&
        ['inactive', 'rejected', 'pending'].includes(franchise.status)
      ) {
        return res
          .status(403)
          .json(
            ApiError.forbidden(
              'Your franchise is inactive. Please contact the administrator.',
            ),
          );
      }
    }


    const token = generateToken(user);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const safeUser = await User.findById(user._id)
      .select('-password -refreshToken')
      .populate('franchise', 'name email status');

    return res
      .status(200)
      .json(
        new ApiResponse(200, { user: safeUser, token }, 'Login successful'),
      );
  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json(ApiError.internal('Something went wrong while logging in'));
  }
};

export const getMe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'User ID is required'));
    }

    const user = await User.findById(id).select('-password'); // exclude sensitive fields

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, 'User not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'User fetched successfully'));
  } catch (error) {
    console.error('Error fetching user:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Server error while fetching user'));
  }
};



/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Send OTP to user's email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, contact, phone } = req.body;
    const identifier = email || contact || phone;
    if (!identifier) return res.status(400).json(ApiError.badRequest("Email or phone required"));

    const user = await User.findOne({
      $or: [{ email: identifier }, { contact: identifier }],
    });
    if (!user) return res.status(404).json(ApiError.notFound("No user found with this email/phone"));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Intelligent Delivery: 
    // 1. If phone/contact was provided in request AND Twilio is setup -> Send SMS
    // 2. If email was provided in request OR Twilio is NOT setup -> Send Email
    const useSMS = isTwilioConfigured() && (contact || phone);
    const hasEmail = user.email && !user.email.includes('@noemail.local');

    if (useSMS) {
      try {
        const smsPromise = sendOTPViaSMS(user.contact, otp);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SMS send timeout')), 15000)
        );
        await Promise.race([smsPromise, timeoutPromise]);
        console.log('[FORGOT PWD] OTP SMS sent to:', user.contact);
      } catch (err) {
        console.error('[FORGOT PWD] SMS failed:', err.message);
      }
    } else if (hasEmail) {
      try {
        const emailPromise = sendEmail(user.email, "Login OTP", `Your OTP code is ${otp}. It will expire in 10 minutes.`);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email send timeout')), 15000)
        );
        await Promise.race([emailPromise, timeoutPromise]);
        console.log('[FORGOT PWD] OTP email sent to:', user.email);
      } catch (err) {
        console.error('[FORGOT PWD] Email failed:', err.message);
      }
    } else if (!useSMS && !hasEmail) {
      // Emergency fallback if no email and no sms config
      console.log('[OTP] No delivery channel available. OTP:', otp);
    }

    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;
    res.status(200).json(new ApiResponse(200, { ...(devOtp && { devOtp }) }, "OTP sent successfully"));
  } catch (err) {
    console.error(err);
    res.status(500).json(ApiError.internal("Error sending OTP"));
  }
};

/**
 * @route POST /api/v1/auth/verify-otp
 * @desc Verify OTP
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json(ApiError.badRequest("Email and OTP required"));

    // Support both email and phone number lookup
    const user = await User.findOne({
      $or: [{ email }, { contact: email }],
    }).select("+otp +otpExpires");
    if (!user) return res.status(404).json(ApiError.notFound("User not found"));

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.otp !== hashedOtp || Date.now() > user.otpExpires) {
      return res.status(400).json(ApiError.badRequest("Invalid or expired OTP"));
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    // Mark user as active on email verification
    if (user.status !== 'active') {
      user.status = 'active';
    }
    await user.save();

    // Generate token so user is auto-logged in after OTP verification
    const token = generateToken(user);
    const safeUser = await User.findById(user._id).select('-password -refreshToken');

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(200).json(new ApiResponse(200, { user: safeUser, token }, "OTP verified successfully"));
  } catch (err) {
    console.error('[VERIFY OTP ERROR]', err);
    res.status(500).json(ApiError.internal("Error verifying OTP"));
  }
};

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password after OTP verification
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, password } = req.body;
    const finalPassword = newPassword || password;
    if (!email || !finalPassword) {
      return res.status(400).json(ApiError.badRequest("Email and new password required"));
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json(ApiError.notFound("User not found"));

    user.password = finalPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, "Password reset successful"));
  } catch (err) {
    res.status(500).json(ApiError.internal("Error resetting password"));
  }
};
