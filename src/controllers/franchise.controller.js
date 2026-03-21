import fs from 'fs';
import bcrypt from 'bcryptjs';
import Franchise from '../models/franchise.model.js';
import User from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

// ✅ CREATE FRANCHISE
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
        .json(ApiError.badRequest('All required fields must be provided'));
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(ApiError.badRequest('Passwords do not match'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json(ApiError.conflict('Email already exists'));
    }

    // ✅ Handle image upload (optional)
    let imageUrl = '';
    const localPath = req.file?.path;

    if (localPath) {
      try {
        const uploadResult = await uploadOnCloudinary(localPath);
        imageUrl = uploadResult?.url || uploadResult?.secure_url || '';
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath); // cleanup temp file
      } catch (err) {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        console.error('Cloudinary upload failed:', err);
        return res
          .status(500)
          .json(ApiError.internal('Failed to upload image to Cloudinary'));
      }
    }

    // ✅ Create User with role = 'franchise'
    const user = await User.create({
      name: fullName,
      email,
      password, // hashed via pre-save
      contact,
      role: 'franchise',
      avatar: imageUrl,
      status: 'active',
    });

    // ✅ Create Franchise record
    const franchise = await Franchise.create({
      user: user._id,
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
    console.error('❌ Error creating franchise:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};

// ✅ GET ALL
export const getAllFranchises = async (req, res) => {
  try {
    const franchises = await Franchise.find().sort({ createdAt: -1 });
    if (!franchises.length) {
      return res.status(404).json(ApiError.notFound('No franchises found'));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, franchises, 'Franchises fetched successfully'),
      );
  } catch (error) {
    console.error('❌ Error fetching franchises:', error);
    return res.status(500).json(ApiError.internal('Internal server error'));
  }
};

// ✅ EDIT
export const editFranchise = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const franchise = await Franchise.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!franchise)
      return res.status(404).json(ApiError.notFound('Franchise not found'));

    // sync to User
    await User.findOneAndUpdate(
      { email: franchise.email },
      {
        name: franchise.fullName,
        contact: franchise.contact,
        ...(updates.password && { password: updates.password }),
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, franchise, 'Franchise updated successfully'));
  } catch (error) {
    console.error('❌ Error editing franchise:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};

// ✅ DELETE
export const deleteFranchise = async (req, res) => {
  try {
    const { id } = req.params;
    const franchise = await Franchise.findByIdAndDelete(id);
    if (!franchise)
      return res.status(404).json(ApiError.notFound('Franchise not found'));

    await User.findOneAndDelete({ email: franchise.email });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Franchise deleted successfully'));
  } catch (error) {
    console.error('❌ Error deleting franchise:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};

// ✅ TOGGLE STATUS
export const toggleFranchiseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const franchise = await Franchise.findById(id);
    if (!franchise)
      return res.status(404).json(ApiError.notFound('Franchise not found'));

    franchise.status = franchise.status === 'approved' ? 'pending' : 'approved';

    await franchise.save();
    return res
      .status(200)
      .json(new ApiResponse(200, franchise, 'Franchise status updated'));
  } catch (error) {
    console.error('❌ Error toggling franchise status:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};

// ✅ GET BY ID
export const getFranchiseById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json(ApiError.badRequest('Franchise ID is required'));

    const franchise = await Franchise.findById(id)
      .populate({
        path: 'user',
        select: 'name email contact avatar role status createdAt',
      })
      .lean();

    if (!franchise)
      return res.status(404).json(ApiError.notFound('Franchise not found'));

    return res
      .status(200)
      .json(new ApiResponse(200, franchise, 'Franchise details fetched'));
  } catch (error) {
    console.error('❌ Error fetching franchise by id:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};
