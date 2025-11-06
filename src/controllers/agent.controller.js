// controllers/agent.controller.js
import User from '../models/user.model.js';
import Franchise from "../models/franchise.model.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import fs from 'fs';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

export const getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .select('-password')
      .populate({
        path: 'franchise',
        select: 'fullName email contact status createdAt',
      });

    if (!agents || agents.length === 0) {
      return res.status(404).json(new ApiResponse(404, [], 'No agents found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, agents, 'Agents fetched successfully'));
  } catch (error) {
    console.error('Error fetching agents:', error);
    return res.status(500).json(new ApiError(500, 'Internal Server Error'));
  }
};

export const getFiveAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .select('-password')
      .limit(5)
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, agents, '5 agents fetched successfully'));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Error fetching agents'));
  }
};

export const editAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent role change to something else
    if (updates.role && updates.role !== 'agent') {
      return res.status(400).json(new ApiError(400, 'Role change not allowed'));
    }

    const updatedAgent = await User.findOneAndUpdate(
      { _id: id, role: 'agent' },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true, context: 'query' },
    ).select('-password');

    if (!updatedAgent) {
      return res
        .status(404)
        .json(new ApiError(404, 'Agent not found or not an agent role'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedAgent, 'Agent updated successfully'));
  } catch (error) {
    console.error('Error editing agent:', error);
    return res.status(500).json(new ApiError(500, 'Internal Server Error'));
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.findOneAndDelete({ _id: id, role: "agent" });
    if (!deleted) {
      return res.status(404).json(ApiError.notFound("Agent not found"));
    }

    res.status(200).json(new ApiResponse(200, deleted, "Agent deleted successfully"));
  } catch (error) {
    res.status(500).json(ApiError.internal(error.message));
  }
};


// Add agent under a franchise
export const updateAgentInFranchise = async (req, res) => {
  try {
    const { agentId, franchiseId } = req.params;
    const updates = req.body;
    console.log('Incoming Franchise ID:', franchiseId);

    // ✅ Find the agent first
    const agent = await User.findOne({
      _id: agentId,
      role: 'agent',
      franchise: franchiseId,
    });
    if (!agent) {
      return res
        .status(404)
        .json(ApiError.notFound('Agent not found in this franchise'));
    }

    let imageUrl = agent.avatar || '';
    const localPath = req.file?.path;

    // ✅ Handle image upload
    if (localPath) {
      try {
        const uploadResult = await uploadOnCloudinary(localPath);
        imageUrl = uploadResult?.url || uploadResult?.secure_url || imageUrl;
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (err) {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        console.error('Cloudinary upload failed:', err);
        return res
          .status(500)
          .json(ApiError.internal('Failed to upload image to Cloudinary'));
      }
    }

    // ✅ Apply updates
    const updatedAgent = await User.findOneAndUpdate(
      { _id: agentId, role: 'agent', franchise: franchiseId },
      { ...updates, avatar: imageUrl, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).select('-password');

    return res
      .status(200)
      .json(ApiResponse.success('Agent updated successfully', updatedAgent));
  } catch (error) {
    console.error('Error updating franchise agent:', error);
    return res.status(500).json(ApiError.internal(error.message));
  }
};

export const addAgentToFranchise = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { name, email, contact, password } = req.body;

    if (!name || !email || !password || !contact) {
      return res
        .status(400)
        .json(ApiError.badRequest('All required fields must be provided'));
    }

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise)
      return res.status(404).json(ApiError.notFound('Franchise not found'));

    const existingAgent = await User.findOne({ $or: [{ email }, { contact }] });
    if (existingAgent)
      return res
        .status(409)
        .json(
          ApiError.conflict('Agent with this email or contact already exists'),
        );

    // ✅ Handle image upload (optional)
    let imageUrl = '';
    const localPath = req.file?.path;

    if (localPath) {
      try {
        const uploadResult = await uploadOnCloudinary(localPath);
        imageUrl = uploadResult?.url || uploadResult?.secure_url || '';
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath); // cleanup
      } catch (err) {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        console.error('Cloudinary upload failed:', err);
        return res
          .status(500)
          .json(ApiError.internal('Failed to upload image to Cloudinary'));
      }
    }

    // ✅ Create Agent
    const agent = await User.create({
      name,
      email,
      contact,
      password, // hashed in pre-save middleware
      avatar: imageUrl,
      role: 'agent',
      franchise: franchise._id,
      status: 'active',
    });

    // ✅ Add reference to Franchise
    if (Array.isArray(franchise.agents)) {
      franchise.agents.push(agent._id);
      await franchise.save();
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, agent, 'Agent added successfully under franchise'),
      );
  } catch (error) {
    console.error('❌ Error adding agent to franchise:', error);
    return res.status(500).json(ApiError.internal('Server error'));
  }
};

// Get agents under a specific franchise
export const getAgentsByFranchise = async (req, res) => {
  try {
    const { franchiseId } = req.params;

    console.log('Incoming franchiseId:', franchiseId);

    if (!franchiseId || franchiseId === 'undefined' || franchiseId === 'null') {
      return res
        .status(400)
        .json(new ApiError(400, 'Valid franchiseId is required'));
    }

    const agents = await User.find({
      role: 'agent',
      franchise: franchiseId,
    }).populate('franchise', 'name email');

    return res
      .status(200)
      .json(new ApiResponse(200, agents, 'Agents fetched successfully'));
  } catch (err) {
    console.error('Get agents error:', err);
    return res
      .status(500)
      .json(new ApiError(500, 'Error fetching agents for franchise'));
  }
};


// Update agent (franchise scoped)

export const deleteAgentInFranchise = async (req, res) => {
  try {
    const { agentId, franchiseId } = req.params;
    console.log('Deleting Agent:', agentId, 'From Franchise:', franchiseId);

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json(ApiError.notFound('Franchise not found'));
    }

    const agent = await User.findOneAndDelete({
      _id: agentId,
      role: 'agent',
      franchise: franchiseId,
    });

    if (!agent) {
      return res
        .status(404)
        .json(ApiError.notFound('Agent not found in this franchise'));
    }

    await Franchise.findByIdAndUpdate(franchiseId, {
      $pull: { agents: agent._id },
    });

    console.log('Agent deleted successfully:', agent.fullName || agent._id);

    return res
      .status(200)
      .json(ApiResponse.success('Agent deleted successfully', agent));
  } catch (error) {
    console.error('Error deleting franchise agent:', error);
    return res.status(500).json(ApiError.internal(error.message));
  }
};

// Toggle Agent Status (Active <-> Inactive)
export const toggleAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Find the agent by ID and role
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return res.status(404).json(new ApiError(404, 'Agent not found'));
    }

    // Toggle the status
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    agent.status = newStatus;
    await agent.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { id: agent._id, status: newStatus }, `Agent status changed to ${newStatus}`));
  } catch (error) {
    console.error('Error toggling agent status:', error);
    return res.status(500).json(new ApiError(500, 'Error updating agent status'));
  }
};
