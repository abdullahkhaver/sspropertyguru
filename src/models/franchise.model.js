// models/Franchise.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const franchiseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact: { type: String },
    city: { type: String },
    password: { type: String }, // hashed. used if franchise has login
    image: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    agents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // agents under this franchise
  },
  { timestamps: true },
);

franchiseSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
}
)

const Franchise = mongoose.model("Franchise", franchiseSchema);
export default Franchise;
