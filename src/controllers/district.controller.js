import District from '../models/district.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createDistrict = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json(ApiError.badRequest('District name is required'));
    }

    const existing = await District.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(400)
        .json(ApiError.badRequest('District with this name already exists'));
    }

    const district = new District({ name: name.trim() });
    await district.save();

    res
      .status(201)
      .json(ApiResponse.success('District created successfully', district));
  } catch (err) {
    console.error('Create District Error:', err);
    next(err);
  }
};

export const getDistricts = async (req, res, next) => {
  try {
    const districts = await District.find().sort({ name: 1 });

    res.json(ApiResponse.success('Districts fetched successfully', districts));
  } catch (err) {
    console.error('Get Districts Error:', err);
    next(err);
  }
};
