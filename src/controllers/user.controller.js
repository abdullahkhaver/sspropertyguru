import User from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Delete any user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json(ApiError.notFound('User not found'));
    }

    res
      .status(200)
      .json(new ApiResponse(200, deleted, 'User deleted successfully'));
  } catch (error) {
    res.status(500).json(ApiError.internal(error.message));
  }
};

// Get all users (role = "user")
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], "No users found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error"));
  }
};

export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.role && updates.role !== "user") {
      return res
        .status(400)
        .json(new ApiError(400, "Role change not allowed"));
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: "user" },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true, context: "query" }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json(new ApiError(404, "User not found or not a user role"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully"));
  } catch (error) {
    console.error("Error editing user:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error"));
  }
};
