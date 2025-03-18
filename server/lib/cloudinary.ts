import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Missing Cloudinary credentials in environment variables");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  imageUrl: string;
  publicId: string;
}

export async function uploadImageToCloudinary(
  mediaUrl: string,
  userId: number,
  imageType: 'selfie' | 'full_body' | 'garment'
): Promise<CloudinaryUploadResult> {
  try {
    // Log the upload attempt
    console.log(`Attempting to upload ${imageType} image for user ${userId}`);

    // Download image from Twilio's temporary URL using auth headers
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    });

    // Convert to base64 for Cloudinary upload
    const base64Data = Buffer.from(response.data).toString('base64');
    const base64Url = `data:${response.headers['content-type']};base64,${base64Data}`;

    // Upload to Cloudinary with user-specific folder and metadata
    const uploadResult = await cloudinary.uploader.upload(base64Url, {
      folder: `fashion-buddy/${userId}`,
      resource_type: 'image',
      tags: [imageType, `user_${userId}`],
    });

    console.log(`Successfully uploaded image to Cloudinary: ${uploadResult.public_id}`);

    return {
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}