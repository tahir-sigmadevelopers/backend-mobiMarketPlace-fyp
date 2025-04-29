import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { CloudinaryResponse } from '../types/types.js';
import { fileURLToPath } from 'url';

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Configure Cloudinary - checking both naming conventions
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.cloud_name || '',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.api_key || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.api_secret || '',
});

// Upload a file to Cloudinary
export const uploadOnCloudinary = async (localFilePath: string): Promise<CloudinaryResponse> => {
  try {
    if (!localFilePath) {
      throw new Error('No file path provided');
    }
    
    console.log('Uploading file to Cloudinary:', localFilePath);
    
    // Resolve the absolute path if it's a relative path
    const absolutePath = path.isAbsolute(localFilePath) 
      ? localFilePath 
      : path.resolve(rootDir, localFilePath);
    
    console.log('Absolute path:', absolutePath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found at path: ${absolutePath}`);
    }
    
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(absolutePath, {
      resource_type: 'auto',
      folder: 'mobicommerce/products',
    });
    
    console.log('Cloudinary upload result:', result);
    
    // Remove the locally saved temporary file
    fs.unlinkSync(absolutePath);
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error in uploadOnCloudinary:', error);
    
    // Remove the locally saved temporary file if exists
    if (localFilePath) {
      const absolutePath = path.isAbsolute(localFilePath) 
        ? localFilePath 
        : path.resolve(rootDir, localFilePath);
      
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
    throw error;
  }
};

// Delete an image from Cloudinary
export const deleteFromCloudinary = async (public_id: string): Promise<boolean> => {
  try {
    if (!public_id) return false;
    
    await cloudinary.uploader.destroy(public_id);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}; 