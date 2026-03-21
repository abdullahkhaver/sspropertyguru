// controllers/enquiry.controller.js
import Enquiry from '../models/enquiry.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createEnquiry = async (req, res) => {
  try {
    const { name, contact, message, email, city, user } = req.body;

    if (!name || !contact || !email || !city) {
      return res
        .status(400)
        .json(new ApiError(400, 'All required fields must be filled'));
    }

    const enquiry = await Enquiry.create({
      user: user || null,
      name,
      contact,
      message,
      email,
      city,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, enquiry, 'Enquiry submitted successfully'));
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};

export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    if (!enquiries || enquiries.length === 0) {
      return res.status(404).json(new ApiError(404, 'No enquiries found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, enquiries, 'Enquiries fetched successfully'));
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};

export const updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!enquiry) return next(new ApiError(404, 'Enquiry not found'));

    return res
      .status(200)
      .json(new ApiResponse(200, enquiry, 'Enquiry updated successfully'));
  } catch (error) {
    next(new ApiError(500, error.message || 'Failed to update enquiry'));
  }
};


export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return res.status(404).json(new ApiError(404, 'Enquiry not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, enquiry, 'Enquiry deleted successfully'));
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal server error', error.message));
  }
};
