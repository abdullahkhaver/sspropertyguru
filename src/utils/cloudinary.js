import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath,
  folder = 'property_site',
  resourceType = 'auto',
) => {
  try {
    if (!localFilePath) return null;

    console.log('Uploading file to Cloudinary:', localFilePath);

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: resourceType,
    });

    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error('Cloudinary upload failed:', error);
    return null;
  }
};


export { uploadOnCloudinary };
