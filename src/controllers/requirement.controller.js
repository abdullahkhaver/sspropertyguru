import Requirement from '../models/requirement.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Add new requirement
export const addRequirement = async (req, res) => {
  try {
    const { name, phone, requirement } = req.body;
    if (!name || !phone || !requirement) {
      return res
        .status(400)
        .json(ApiError.badRequest('All fields are required'));
    }

    const newReq = await Requirement.create({ name, phone, requirement });
    return res
      .status(201)
      .json(new ApiResponse(201, newReq, 'Requirement submitted successfully'));
  } catch (error) {
    console.error('Error adding requirement:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};

// Fetch all (SuperAdmin dashboard)
export const getAllRequirements = async (req, res) => {
  try {
    const requirements = await Requirement.find().sort({ createdAt: -1 });
    return res
      .status(200)
      .json(
        new ApiResponse(200, requirements, 'Requirements fetched successfully'),
      );
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};
// Delete a specific requirement
export const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json(ApiError.notFound('Requirement not found'));
    }

    await Requirement.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Requirement deleted successfully'));
  } catch (error) {
    console.error('Error deleting requirement:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};
