import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  resourceType: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: object[];
  eager?: object[];
  publicId?: string;
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'cricstagram',
    resourceType = 'auto',
    transformation,
    eager,
    publicId,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      unique_filename: true,
      overwrite: false,
    };

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    if (eager) {
      uploadOptions.eager = eager;
      uploadOptions.eager_async = true;
    }

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Upload stream from buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(error.message || 'Failed to upload to Cloudinary'));
          return;
        }

        if (!result) {
          reject(new Error('No result from Cloudinary'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          duration: result.duration,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      }
    );

    // Write buffer to stream
    uploadStream.end(buffer);
  });
}

/**
 * Upload a video to Cloudinary with optimizations
 */
export async function uploadVideo(
  buffer: Buffer,
  userId: number,
  options: Partial<CloudinaryUploadOptions> = {}
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(buffer, {
    folder: `cricstagram/reels/${userId}`,
    resourceType: 'video',
    // Eager transformations for video optimization
    eager: [
      { width: 720, height: 1280, crop: 'limit', quality: 'auto:good', format: 'mp4' },
      { width: 480, height: 854, crop: 'limit', quality: 'auto:eco', format: 'mp4' },
    ],
    ...options,
  });
}

/**
 * Upload an image to Cloudinary with optimizations
 */
export async function uploadImage(
  buffer: Buffer,
  userId: number,
  options: Partial<CloudinaryUploadOptions> = {}
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(buffer, {
    folder: `cricstagram/images/${userId}`,
    resourceType: 'image',
    transformation: [
      { width: 1080, height: 1080, crop: 'limit', quality: 'auto:good' },
    ],
    ...options,
  });
}

/**
 * Upload a thumbnail to Cloudinary
 */
export async function uploadThumbnail(
  buffer: Buffer,
  userId: number,
  options: Partial<CloudinaryUploadOptions> = {}
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(buffer, {
    folder: `cricstagram/thumbnails/${userId}`,
    resourceType: 'image',
    transformation: [
      { width: 720, height: 1280, crop: 'fill', quality: 'auto:good', format: 'webp' },
    ],
    ...options,
  });
}

/**
 * Upload a profile image to Cloudinary
 */
export async function uploadProfileImage(
  buffer: Buffer,
  userId: number
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(buffer, {
    folder: `cricstagram/profiles`,
    resourceType: 'image',
    publicId: `user_${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good', format: 'webp' },
    ],
  });
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Generate a video thumbnail URL from Cloudinary
 */
export function getVideoThumbnailUrl(publicId: string, options: { width?: number; height?: number } = {}): string {
  const { width = 720, height = 1280 } = options;
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width, height, crop: 'fill' },
      { start_offset: '0' },
    ],
  });
}

/**
 * Generate optimized video URL with transformations
 */
export function getOptimizedVideoUrl(publicId: string, quality: 'auto' | 'low' | 'medium' | 'high' = 'auto'): string {
  const qualityMap = {
    auto: 'auto:good',
    low: 'auto:eco',
    medium: 'auto:good',
    high: 'auto:best',
  };

  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'mp4',
    transformation: [
      { quality: qualityMap[quality] },
      { fetch_format: 'auto' },
    ],
  });
}

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export default {
  uploadToCloudinary,
  uploadVideo,
  uploadImage,
  uploadThumbnail,
  uploadProfileImage,
  deleteFromCloudinary,
  getVideoThumbnailUrl,
  getOptimizedVideoUrl,
  isCloudinaryConfigured,
};
