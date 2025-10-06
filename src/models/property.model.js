import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], index: true },

    category: {
      type: String,
      enum: ['Property', 'Plot', 'House', 'Land', 'Commercial'],
      required: [true, 'Category is required'],
    },

    type: {
      type: String,
      enum: [
        'Asanchit',
        'Sanchit',
        'Agricultural Land',
        'Residential Land',
        'Commercial Land',
        'Industrial Land',
        'House',
        'Flat',
        'Villa',
      ],
    },

    features: [String],

    images: [{ url: String }], // up to 4 Cloudinary URLs
    video: { type: String },

    sellingType: {
      type: String,
      enum: ['Sale', 'Rent', 'Lease', 'For Sale', 'For Rent'],
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
