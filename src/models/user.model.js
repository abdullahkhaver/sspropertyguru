import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['superadmin', 'franchise', 'agent', 'user'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    franchise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      default: null,
    }, // if agent belongs to franchise
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    refreshToken: {
      type: String,
      select: false,
      default: '',
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    fcmToken: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);
userSchema.pre('save', async function (next) {
  // Only set inactive status for agents on creation
  if (this.role === 'agent' && this.isNew) {
    this.status = 'inactive';
  }
  // Set active status for regular users on creation
  if ((this.role === 'user' || !this.role) && this.isNew && !this.status) {
    this.status = 'active';
  }
  next();
});


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
