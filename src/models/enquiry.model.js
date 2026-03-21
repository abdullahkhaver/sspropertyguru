import mongoose from 'mongoose';
const enquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // could be guest too
  name: { type: String },
  contact: { type: String },
  message: { type: String },
  email : { type: String},
  city : { type: String},
  status: {
    type: String,
    enum: ['new', 'in-progress', 'closed'],
    default: 'new',
  },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('Enquiry', enquirySchema);

