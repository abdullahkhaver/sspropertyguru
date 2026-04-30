import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sspropertyguru_test';

const userSchema = new mongoose.Schema({
  name: String,
  contact: String,
  email: String,
  password: String,
  role: String,
  status: String,
  avatar: String,
  franchise: mongoose.Schema.Types.ObjectId,
  refreshToken: String,
  otp: String,
  otpExpires: Date,
  fcmToken: String,
  latitude: Number,
  longitude: Number,
  address: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('✅ SuperAdmin already exists:');
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Name:', existingSuperAdmin.name);
      console.log('\n📧 Use this email to login at /admin-login');
      await mongoose.disconnect();
      return;
    }

    // Create new superadmin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const superAdmin = await User.create({
      name: 'Super Admin',
      contact: '9999999999',
      email: 'admin@sspropertyguru.com',
      password: hashedPassword,
      role: 'superadmin',
      status: 'active',
      avatar: '',
      latitude: 0,
      longitude: 0,
      address: '',
    });

    console.log('✅ SuperAdmin created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@sspropertyguru.com');
    console.log('   Password: admin123');
    console.log('\n🔗 Login URL: http://localhost:5173/admin-login');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createSuperAdmin();
