import Area from '../models/area.model.js';
import District from '../models/district.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createArea = async (req, res, next) => {
  try {
    const { name, district } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(ApiError.badRequest('Area name is required'));
    }
    if (!district) {
      return res.status(400).json(ApiError.badRequest('District is required'));
    }

    const districtExists = await District.findById(district);
    if (!districtExists) {
      return res.status(404).json(ApiError.notFound('District not found'));
    }

    const existing = await Area.findOne({ name: name.trim(), district });
    if (existing) {
      return res
        .status(400)
        .json(ApiError.badRequest('Area already exists in this district'));
    }

    const area = new Area({ name: name.trim(), district });
    await area.save();

    res
      .status(201)
      .json(ApiResponse.success('Area created successfully', area));
  } catch (err) {
    console.error('Create Area Error:', err);
    next(err);
  }
};

export const getAreas = async (req, res, next) => {
  try {
    const areas = await Area.find()
      .populate('district', 'name')
      .sort({ name: 1 });

    res.json(ApiResponse.success('Areas fetched successfully', areas));
  } catch (err) {
    console.error('Get Areas Error:', err);
    next(err);
  }
};

export const getAreaById = async (req, res, next) => {
  try {
    const area = await Area.findById(req.params.id).populate(
      'district',
      'name',
    );

    if (!area) {
      return res.status(404).json(ApiError.notFound('Area not found'));
    }

    res.json(ApiResponse.success('Area fetched successfully', area));
  } catch (err) {
    console.error('Get Area Error:', err);
    next(err);
  }
};

export const updateArea = async (req, res, next) => {
  try {
    const { name, district } = req.body;
    const { id } = req.params;

    const updates = {};

    if (name && name.trim()) updates.name = name.trim();
    if (district) {
      const districtExists = await District.findById(district);
      if (!districtExists) {
        return res.status(404).json(ApiError.notFound('District not found'));
      }
      updates.district = district;
    }

    const area = await Area.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('district', 'name');

    if (!area) {
      return res.status(404).json(ApiError.notFound('Area not found'));
    }

    res.json(ApiResponse.success('Area updated successfully', area));
  } catch (err) {
    console.error('Update Area Error:', err);
    next(err);
  }
};

export const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;

    const area = await Area.findByIdAndDelete(id);

    if (!area) {
      return res.status(404).json(ApiError.notFound('Area not found'));
    }

    res.json(ApiResponse.success('Area deleted successfully', area));
  } catch (err) {
    console.error('Delete Area Error:', err);
    next(err);
  }
};
