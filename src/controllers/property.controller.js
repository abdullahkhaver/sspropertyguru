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

    console.log('Incoming property data:', data);
    console.log('Incoming files:', req.files);

    if (req.files?.images && req.files.images.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 images are allowed.',
      });
    }

    if (req.files?.images?.length) {
      for (const img of req.files.images) {
        try {
          console.log(`Uploading image: ${img.path}`);
          const uploaded = await uploadOnCloudinary(
            img.path,
            'property_images',
            'image',
          );

          if (uploaded?.url) {
            images.push({ url: uploaded.url });
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr.message);
        }
      }
    }

    if (req.files?.video?.length) {
      try {
        console.log(`Uploading video: ${req.files.video[0].path}`);
        const uploadedVideo = await uploadOnCloudinary(
          req.files.video[0].path,
          'property_videos',
          'video',
        );
        if (uploadedVideo?.url) videoUrl = uploadedVideo.url;
      } catch (uploadErr) {
        console.error('Video upload failed:', uploadErr.message);
      }
    }

    let features = [];
    if (data.features) {
      if (typeof data.features === 'string') {
        features = data.features.split(',').map((f) => f.trim());
      } else if (Array.isArray(data.features)) {
        features = data.features.flat(Infinity).map((f) => String(f).trim());
      }
    }

    const agentId = req.user?._id || data.agent || null;
    const franchiseId = data.franchise || null;

    const property = new Property({
      ...data,
      agent: agentId,
      franchise: franchiseId,
      images,
      video: videoUrl,
      features,
    });

    const saved = await property.save();
    console.log('Property saved:', saved._id);

    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: saved,
    });
  } catch (err) {
    console.error('Create Property Error:', err);

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

    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
export const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    console.log('Incoming property update data:', data);
    console.log('Incoming files:', req.files);

    const existingProperty = await Property.findById(id);
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    const updates = { ...data, updatedAt: new Date() };

    if (!updates.franchise) delete updates.franchise;
    if (!updates.agent) delete updates.agent;

    if (data.features) {
      if (typeof data.features === 'string') {
        updates.features = data.features.split(',').map((f) => f.trim());
      } else if (Array.isArray(data.features)) {
        updates.features = data.features.flat().map((f) => String(f).trim());
      }
    }

    // 🧠 Step 4: Assign logged-in agent
    if (req.user?._id) {
      updates.agent = req.user._id;
    }

    // 🖼️ **FIX: Properly handle images field**
    let updatedImages = [...(existingProperty.images || [])];

    // If new images are uploaded
    if (req.files?.images?.length) {
      if (req.files.images.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 4 images are allowed.',
        });
      }

      const newImages = [];
      for (const img of req.files.images) {
        try {
          console.log(`Uploading new image: ${img.path}`);
          const uploaded = await uploadOnCloudinary(
            img.path,
            'property_images',
            'image',
          );
          if (uploaded?.url) newImages.push({ url: uploaded.url });
        } catch (err) {
          console.error('Image upload failed:', err.message);
        }
      }
      updatedImages = [...updatedImages, ...newImages];
    }
    // **FIX: Don't process images from req.body during update**
    // Remove images from updates if they're coming as malformed strings
    delete updates.images;

    updates.images = updatedImages.slice(0, 4);

    // 🎥 Handle video
    if (req.files?.video?.length) {
      try {
        console.log(`Uploading new video: ${req.files.video[0].path}`);
        const uploadedVideo = await uploadOnCloudinary(
          req.files.video[0].path,
          'property_videos',
          'video',
        );
        if (uploadedVideo?.url) {
          updates.video = uploadedVideo.url;
        }
      } catch (err) {
        console.error('Video upload failed:', err.message);
      }
    } else if (!data.video) {
      updates.video = existingProperty.video;
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProperty) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update property.',
      });
    }

    console.log('Property updated:', updatedProperty._id);

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (err) {
    console.error('Update Property Error:', err);

    const validationErrors = formatValidationError(err);
    if (validationErrors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
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
export const getPropertiesByFranchiseOrAgent = async (req, res) => {
  try {
    const { franchiseId, agentId } = req.params;

    let query = {};
    if (franchiseId) query.franchise = franchiseId;
    if (agentId) query.agent = agentId;

    if (!franchiseId && !agentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either franchiseId or agentId in params.',
      });
    }

    const properties = await Property.find(query)
      .populate('agent', 'fullName email')
      .populate('franchise', 'name email')
      .sort({ createdAt: -1 });

    if (!properties.length) {
      return res.status(404).json({
        success: false,
        message: 'No properties found for the given criteria.',
      });
    }

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (err) {
    console.error('Fetch Properties Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
