import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], index: true },

    category: {
      type: String,
      enum: ['Property', 'Plot', 'House', 'Agricultural Land','Property Land'],
      required: [true, 'Category is required'],
    },

    features: [String],

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ], // up to 4 Cloudinary URLs
    video: { type: String },

    sellingType: {
      type: String,
      enum: ['Sale', 'Rent', 'Lease'],
      required: [true, 'Selling type is required'],
    },

    price: { type: Number, required: [true, 'Price is required'], index: true },

    areaSize: Number,

    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      index: true,
    },

    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
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
  },
  { timestamps: true },
);

propertySchema.index({ title: 'text', features: 'text' });

export default mongoose.model('Property', propertySchema);
