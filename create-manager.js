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

async function createManager() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if manager already exists
    const existingManager = await User.findOne({ email: 'manager@sspropertyguru.com' });
    if (existingManager) {
      console.log('✅ Manager already exists:');
      console.log('   Email:', existingManager.email);
      console.log('   Name:', existingManager.name);
      console.log('\n📧 Use this email to login at /admin-login');
      await mongoose.disconnect();
      return;
    }

    // Create new manager
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('manager123', salt);

    const manager = await User.create({
      name: 'Test Manager',
      contact: '8888888888',
      email: 'manager@sspropertyguru.com',
      password: hashedPassword,
      role: 'manager',
      status: 'active',
      avatar: '',
      latitude: 0,
      longitude: 0,
      address: '',
    });

    console.log('✅ Manager created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: manager@sspropertyguru.com');
    console.log('   Password: manager123');
    console.log('\n🔗 Login URL: http://localhost:5173/admin-login');
    console.log('\n🔗 Live URL: https://sspropertyguru.com/admin-login');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createManager();
