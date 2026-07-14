import mongoose from 'mongoose';

// Default placeholder image (simple data URI or static URL)
const DEFAULT_IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23e0e0e0" width="800" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image Available%3C/text%3E%3C/svg%3E';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], index: true },

    category: {
      type: String,
      enum: ['Agricultural Land', 'Plot', 'Farm House', 'Warehouse', 'Property Land', 'Industrial', 'Residential'],
      required: [true, 'Category is required'],
    },

    features: [String],

    images: [
      {
        url: { 
          type: String, 
          required: true,
          set: (value) => {
            // Provide fallback image if URL is empty or invalid
            if (!value || value.trim() === '') {
              return DEFAULT_IMAGE_URL;
            }
            return value;
          }
        },
        public_id: { type: String },
      },
    ], // up to 4 Cloudinary URLs
    video: { type: String },

    sellingType: {
      type: String,
      enum: ['Sale', 'Rent', 'Lease', 'Sell'],
      required: [true, 'Selling type is required'],
    },

    price: { type: Number, required: [true, 'Price is required'], index: true },

    areaSize: Number,

    district: {
      type: String,
      index: true,
    },

    area: {
      type: String,
      index: true,
    },

    address: String,

    status: {
      type: String,
      enum: ['Available', 'Sold', 'Rented', 'Pending'],
      default: 'Available',
    },

    contactNumber: String,

    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
    isLive: { type: Boolean, default: false },
    paymentId: { type: String, default: null },
  },
  { timestamps: true },
);

propertySchema.index({ title: 'text', features: 'text' });

// Post-save hook to ensure at least one fallback image exists
propertySchema.post('save', function(doc) {
  if (!doc.images || doc.images.length === 0) {
    doc.images = [
      {
        url: DEFAULT_IMAGE_URL,
        public_id: 'fallback'
      }
    ];
  }
});

// Post-findOneAndUpdate hook
propertySchema.post('findOneAndUpdate', async function(doc) {
  if (doc && (!doc.images || doc.images.length === 0)) {
    doc.images = [
      {
        url: DEFAULT_IMAGE_URL,
        public_id: 'fallback'
      }
    ];
    await doc.save();
  }
});

export default mongoose.model('Property', propertySchema);

