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
console.log('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET);



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
