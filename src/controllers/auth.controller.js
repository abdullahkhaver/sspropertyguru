import fs from 'fs';
import User from '../models/user.model.js';
import Franchise from '../models/franchise.model.js';

import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import generateToken from '../utils/generateToken.js';
export const signup = async (req, res) => {
  try {
    const { name, contact, email, password, role, franchise } = req.body;

    if (!name || !contact || !email || !password) {
      return res
        .status(400)
        .json(ApiError.badRequest('All fields are required'));
    }

    const allowedRoles = ['user', 'agent', 'franchise', 'superadmin'];
    const finalRole = allowedRoles.includes(role) ? role : 'user';

    const existedUser = await User.findOne({
      $or: [{ contact }, { email }],
    });
    if (existedUser) {
      return res
        .status(409)
        .json(
          new ApiError('User with this email or contact already exists'),
        );
    }

    let franchiseDoc = null;
    if (franchise) {
      franchiseDoc = await Franchise.findById(franchise);
      if (!franchiseDoc) {
        return res
          .status(404)
          .json(ApiError.notFound('Franchise not found'));
      }
    }

    // Avatar upload
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      return res
        .status(400)
        .json(ApiError.badRequest('Avatar file is required'));
    }

    let avatar;
    try {
      avatar = await uploadOnCloudinary(avatarLocalPath);
      if (!avatar || !avatar.url) {
        return res
          .status(500)
          .json(
            ApiError.internal('Avatar upload failed. Please try again.'),
          );
      }
      if (fs.existsSync(avatarLocalPath)) fs.unlinkSync(avatarLocalPath);
    } catch (err) {
      if (fs.existsSync(avatarLocalPath)) fs.unlinkSync(avatarLocalPath);
      return res
        .status(500)
        .json(ApiError.internal('Failed to upload avatar'));
    }

    const user = await User.create({
      name,
      contact,
      email,
      password,
      role: finalRole,
      avatar: avatar?.url || '',
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
      return res
        .status(500)
        .json(
          ApiError.internal(
            500,
            'Something went wrong while registering the user',
          ),
        );
    }

    const token = generateToken(user);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: createdUser, token },
          'User registered successfully',
        ),
      );
  } catch (err) {
    console.error('Signup error:', err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(409)
        .json(new ApiError(409, `User with this ${field} already exists`));
    }

    return res
      .status(500)
      .json(
        ApiError.internal(500, 'Something went wrong while registering user'),
      );
  }
};
export const signin = async (req, res) => {
  try {
    const { identifier, email, contact, password } = req.body;
    const id = identifier || email || contact;

    if (!id || !password) {
      return res
        .status(400)
        .json(
          ApiError.badRequest(
            'Identifier (email/contact) and password are required',
          ),
        );
    }

    const user = await User.findOne({
      $or: [{ email: id }, { contact: id }],
    }).select('+password +refreshToken');

    if (!user) {
      return res
        .status(404)
        .json(ApiError.notFound('User does not exist'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json(ApiError.unauthorized('Invalid credentials'));
    }

    if (
      user.status === 'inactive' ||
      user.status === 'pending' ||
      user.status === 'rejected'
    ) {
      return res
        .status(403)
        .json(
          ApiError.forbidden(

            'Your account is inactive. Please contact the administrator.',
          ),
        );
    }

    if (user.role === 'franchise') {
      const franchise = await Franchise.findOne({ email: user.email });
      if (franchise && !user.franchise) {
        user.franchise = franchise._id;
        await user.save();
      }

      // Check if franchise record itself is inactive
      if (franchise && franchise.status === 'inactive' || franchise.status === 'rejected' || franchise.status === 'pending') {
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
