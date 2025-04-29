import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from config.env
dotenv.config({ path: path.resolve('config.env') });

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.cloud_name || '',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.api_key || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.api_secret || '',
});

console.log('Cloudinary Configuration:');
console.log('cloud_name:', process.env.cloud_name);
console.log('api_key:', process.env.api_key);
console.log('api_secret:', process.env.api_secret?.substring(0, 3) + '...');

// Function to upload a test image
async function testCloudinaryUpload() {
  try {
    // Create a test file if it doesn't exist
    const testFile = path.resolve('uploads/test-image.txt');
    if (!fs.existsSync(path.dirname(testFile))) {
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
    }
    fs.writeFileSync(testFile, 'This is a test file for Cloudinary upload');
    
    console.log('Test file created at:', testFile);
    console.log('File exists:', fs.existsSync(testFile));
    
    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(testFile, {
      resource_type: 'raw',
      folder: 'mobicommerce/test',
    });
    
    console.log('Upload successful!');
    console.log('Result:', result);
    
    // Clean up
    fs.unlinkSync(testFile);
    console.log('Test file deleted');
    
    return result;
  } catch (error) {
    console.error('Error in test upload:', error);
    throw error;
  }
}

// Execute the test
testCloudinaryUpload()
  .then(result => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 