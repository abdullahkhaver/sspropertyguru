import Property from '../models/property.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const formatValidationError = (err) => {
  if (err.name === 'ValidationError') {
    const errors = {};
    for (let field in err.errors) {
      errors[field] = err.errors[field].message;
    }
    return errors;
  }
  return null;
};

export const createProperty = async (req, res) => {
  try {
    const data = req.body;
    const images = [];
    let videoUrl = null;

    console.log('🟢 Incoming property data:', data);
    console.log('📸 Incoming files:', req.files);

    // Validate image count
    if (req.files?.images && req.files.images.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 images are allowed.',
      });
    }

    // Upload images
    if (req.files?.images?.length) {
      for (const img of req.files.images) {
        try {
          console.log(`Uploading image: ${img.path}`);
          const uploaded = await uploadOnCloudinary(img.path, 'image');
          if (uploaded?.secure_url) images.push(uploaded.secure_url);
        } catch (uploadErr) {
          console.error('❌ Image upload failed:', uploadErr.message);
        }
      }
    }

    // Upload video (if any)
    if (req.files?.video?.length) {
      try {
        console.log(`Uploading video: ${req.files.video[0].path}`);
        const uploadedVideo = await uploadOnCloudinary(
          req.files.video[0].path,
          'video',
        );
        if (uploadedVideo?.secure_url) videoUrl = uploadedVideo.secure_url;
      } catch (uploadErr) {
        console.error('❌ Video upload failed:', uploadErr.message);
      }
    }

    // Create property
    const property = new Property({
      ...data,
      agent: req.user?._id || data.agent,
      images,
      video: videoUrl,
    });

    const saved = await property.save();
    console.log('✅ Property saved:', saved._id);

    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: saved,
    });
  } catch (err) {
    console.error('🔥 Create Property Error:', err);

    // Handle validation errors gracefully
    if (err.name === 'ValidationError') {
      const formattedErrors = Object.keys(err.errors).map((key) => ({
        field: key,
        message: err.errors[key].message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    // Final fallback for any other error
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};


// UPDATE PROPERTY
export const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };

    const objectIdFields = ['district', 'area', 'agent', 'franchise'];
    objectIdFields.forEach((field) => {
      if (updates[field] === '' || updates[field] === undefined) {
        delete updates[field];
      }
    });

    // handle new uploads
    if (req.files?.images?.length) {
      if (req.files.images.length > 4) {
        return res
          .status(400)
          .json(ApiError.badRequest('Maximum 4 images are allowed'));
      }

      const newImages = [];
      for (let img of req.files.images) {
        const uploaded = await uploadOnCloudinary(img.path, 'image');
        if (uploaded?.secure_url) newImages.push(uploaded.secure_url);
      }
      updates.images = newImages;
    }

    if (req.files?.video?.length) {
      const uploadedVideo = await uploadOnCloudinary(
        req.files.video[0].path,
        'video',
      );
      if (uploadedVideo?.secure_url) updates.video = uploadedVideo.secure_url;
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!property) {
      return res.status(404).json(ApiError.notFound('Property not found'));
    }

    res.json(ApiResponse.success('Property updated successfully', property));
  } catch (err) {
    const validationErrors = formatValidationError(err);
    if (validationErrors) {
      return res
        .status(400)
        .json(ApiError.badRequest('Validation failed', validationErrors));
    }
    console.error('Update Property Error:', err);
    next(err);
  }
};

export const getProperties = async (req, res, next) => {
  try {
    const { search, category, sellingType, minPrice, maxPrice, status } =
      req.query;

    let filter = {};

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (sellingType) filter.sellingType = sellingType;
    if (status) filter.status = status;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const properties = await Property.find(filter)
      .populate('district', 'name')
      .populate('area', 'name')
      .populate('agent', 'name email')
      .populate('franchise', 'name')
      .sort({ createdAt: -1 });

    res.json(ApiResponse.success('Properties fetched', properties));
  } catch (err) {
    next(err);
  }
};

export const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('district', 'name')
      .populate('area', 'name')
      .populate('agent', 'name email')
      .populate('franchise', 'name');

    if (!property) {
      return res.status(404).json(ApiError.notFound('Property not found'));
    }

    res.json(ApiResponse.success('Property fetched', property));
  } catch (err) {
    next(err);
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json(ApiError.notFound('Property not found'));
    }

    res.json(ApiResponse.success('Property deleted successfully', property));
  } catch (err) {
    next(err);
  }
};

// GET PROPERTIES OF LOGGED-IN AGENT OR FRANCHISE
export const getMyProperties = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(ApiError.unauthorized("Unauthorized access"));
    }

    let filter = {};

    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    } else if (req.user.role === "franchise") {
      filter.franchise = req.user._id;
    } else {
      return res
        .status(403)
        .json(ApiError.forbidden("Only agents or franchises can view their properties"));
    }

    const properties = await Property.find(filter)
      .populate("district", "name")
      .populate("area", "name")
      .populate("agent", "name email")
      .populate("franchise", "name")
      .sort({ createdAt: -1 });

    return res.json(ApiResponse.success("My properties fetched", properties));
  } catch (err) {
    console.error("GetMyProperties Error:", err);
    next(err);
  }
};
