import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import './src/models/district.model.js';
import './src/models/area.model.js';
import './src/models/franchise.model.js';

dotenv.config({
  path: './.env',
  quiet: true
});

const PORT = process.env.PORT || 5000;
console.log('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME || 'not set');
console.log('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY || 'not set');
console.log('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET || 'not set');
console.log('PORT', process.env.PORT || 'not set');
console.log('MONGO_URI', process.env.MONGO_URI || 'not set');
console.log('JWT_SECRET', process.env.JWT_SECRET || 'not set');


connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
});
