// controllers/franchise.controller.js
import Franchise from '../models/franchise.model.js';
import bcrypt from 'bcryptjs';

import User from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

export const createFranchise = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      contact,
      city,
      status,
    } = req.body;

    // Basic validation
    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword ||
      !contact ||
      !city
    ) {
      return res
        .status(400)
        .json(new ApiError(400, 'All required fields must be provided'));
    }

    if (password !== confirmPassword) {
      return res.status(400).json(new ApiError(400, 'Passwords do not match'));
    }

    // Check if email already exists in User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiError(400, 'Email already exists'));
    }

    // Handle image upload (optional)
    let imageUrl = '';
    if (req.file) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      imageUrl = uploadResult?.secure_url;
    }

    // Create User with role 'franchise'
    const user = await User.create({
      name: fullName,
      email,
      password, // will be hashed by User model pre-save hook
      contact,
      role: 'franchise',
      avatar: imageUrl,
      status: 'active',
    });

    // Create Franchise record
    const franchise = await Franchise.create({
      user : user._id,
      fullName,
      email,
      password, // hashed by Franchise model pre-save
      contact,
      city,
      image: imageUrl,
      status: status || 'pending',
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, franchise },
          'Franchise created successfully',
        ),
      );
  } catch (error) {
    console.error('Error creating franchise:', error);
    return res.status(500).json(new ApiError(500, 'Server error'));
  }
};

export const getAllFranchises = async (req, res, next) => {
  try {
    const franchises = await Franchise.find().sort({ createdAt: -1 });

    if (!franchises || franchises.length === 0) {
      return res.status(404).json(new ApiError(404, 'No franchises found'));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, franchises, 'Franchises fetched successfully'),
      );
  } catch (error) {
    console.error('Error fetching franchises:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};

export const editFranchise = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If password is being updated, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const franchise = await Franchise.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!franchise) {
      return res.status(404).json(new ApiError(404, 'Franchise not found'));
    }

    // update user record as well
    await User.findOneAndUpdate(
      { email: franchise.email },
      {
        name: franchise.fullName,
        contact: franchise.contact,
        city: franchise.city,
        ...(updates.password && { password: updates.password }),
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, franchise, 'Franchise updated successfully'));
  } catch (error) {
    console.error('Error editing franchise:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};

/**
 * 🗑️ Delete franchise
 */
export const deleteFranchise = async (req, res) => {
  try {
    const { id } = req.params;

    const franchise = await Franchise.findByIdAndDelete(id);

    if (!franchise) {
      return res.status(404).json(new ApiError(404, 'Franchise not found'));
    }

    // also remove the corresponding user with role: franchise
    await User.findOneAndDelete({ email: franchise.email });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Franchise deleted successfully'));
  } catch (error) {
    console.error('Error deleting franchise:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};

// controllers/franchise.controller.js
export const toggleFranchiseStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const franchise = await Franchise.findById(id);
    if (!franchise) {
      return res.status(404).json(new ApiError(404, "Franchise not found"));
    }

    // toggle between approved and pending (you can extend with rejected later)
    franchise.status =
      franchise.status === "approved" ? "pending" : "approved";

    await franchise.save();

    return res.status(200).json(
      new ApiResponse(200, franchise, "Franchise status updated successfully")
    );
  } catch (error) {
    console.error("Error toggling franchise status:", error);
    return res.status(500).json(new ApiError(500, "Internal server error", error.message));
  }
};

export const getFranchiseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is provided
    if (!id) {
      return res
        .status(400)
        .json(new ApiError(400, 'Franchise ID is required'));
    }

    // Find franchise and populate its related user data
    const franchise = await Franchise.findById(id)
      .populate({
        path: 'user',
        select: 'name email contact avatar role status createdAt', // select only required fields
      })
      .lean();

    // If not found
    if (!franchise) {
      return res.status(404).json(new ApiError(404, 'Franchise not found'));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          franchise,
          'Franchise details fetched successfully',
        ),
      );
  } catch (error) {
    console.error('Error fetching franchise details:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};
