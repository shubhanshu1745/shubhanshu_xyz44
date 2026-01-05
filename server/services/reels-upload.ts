import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cloudinaryService, { isCloudinaryConfigured, uploadVideo, uploadThumbnail } from './cloudinary';

// Local storage paths (fallback when Cloudinary is not configured)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const REELS_DIR = path.join(UPLOAD_DIR, 'reels');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Ensure directories exist for local fallback
function ensureDirectories() {
  [UPLOAD_DIR, REELS_DIR, THUMBNAILS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Initialize directories on module load
ensureDirectories();

// Generate unique filename
export function generateFilename(userId: number, extension: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  return `${userId}_${timestamp}_${uuid}.${extension}`;
}

// Get file extension from mimetype
export function getExtensionFromMimetype(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeToExt[mimetype] || 'mp4';
}

// Save video file - uses Cloudinary if configured, otherwise local storage
export async function saveReelVideo(
  userId: number,
  buffer: Buffer,
  mimetype: string
): Promise<{ videoUrl: string; filename: string; publicId?: string }> {
  // Use Cloudinary if configured
  if (isCloudinaryConfigured()) {
    try {
      console.log('Uploading video to Cloudinary...');
      const result = await uploadVideo(buffer, userId);
      console.log('Cloudinary upload successful:', result.url);
      return {
        videoUrl: result.url,
        filename: result.publicId,
        publicId: result.publicId,
      };
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local storage:', error);
      // Fall through to local storage
    }
  }

  // Fallback to local storage
  ensureDirectories();
  
  const extension = getExtensionFromMimetype(mimetype);
  const filename = generateFilename(userId, extension);
  const filepath = path.join(REELS_DIR, filename);
  
  await fs.promises.writeFile(filepath, buffer);
  
  // Return URL relative to public folder
  const videoUrl = `/uploads/reels/${filename}`;
  
  return { videoUrl, filename };
}

// Save thumbnail file - uses Cloudinary if configured, otherwise local storage
export async function saveReelThumbnail(
  userId: number,
  buffer: Buffer,
  mimetype: string
): Promise<{ thumbnailUrl: string; filename: string; publicId?: string }> {
  // Use Cloudinary if configured
  if (isCloudinaryConfigured()) {
    try {
      console.log('Uploading thumbnail to Cloudinary...');
      const result = await uploadThumbnail(buffer, userId);
      console.log('Cloudinary thumbnail upload successful:', result.url);
      return {
        thumbnailUrl: result.url,
        filename: result.publicId,
        publicId: result.publicId,
      };
    } catch (error) {
      console.error('Cloudinary thumbnail upload failed, falling back to local storage:', error);
      // Fall through to local storage
    }
  }

  // Fallback to local storage
  ensureDirectories();
  
  const extension = getExtensionFromMimetype(mimetype);
  const filename = generateFilename(userId, extension);
  const filepath = path.join(THUMBNAILS_DIR, filename);
  
  await fs.promises.writeFile(filepath, buffer);
  
  // Return URL relative to public folder
  const thumbnailUrl = `/uploads/thumbnails/${filename}`;
  
  return { thumbnailUrl, filename };
}

// Delete video file
export async function deleteReelVideo(filename: string, publicId?: string): Promise<void> {
  // If publicId is provided, delete from Cloudinary
  if (publicId && isCloudinaryConfigured()) {
    try {
      await cloudinaryService.deleteFromCloudinary(publicId, 'video');
      return;
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
    }
  }

  // Delete from local storage
  const filepath = path.join(REELS_DIR, filename);
  if (fs.existsSync(filepath)) {
    await fs.promises.unlink(filepath);
  }
}

// Delete thumbnail file
export async function deleteReelThumbnail(filename: string, publicId?: string): Promise<void> {
  // If publicId is provided, delete from Cloudinary
  if (publicId && isCloudinaryConfigured()) {
    try {
      await cloudinaryService.deleteFromCloudinary(publicId, 'image');
      return;
    } catch (error) {
      console.error('Failed to delete thumbnail from Cloudinary:', error);
    }
  }

  // Delete from local storage
  const filepath = path.join(THUMBNAILS_DIR, filename);
  if (fs.existsSync(filepath)) {
    await fs.promises.unlink(filepath);
  }
}

// Check storage configuration status
export function getStorageStatus(): { type: 'cloudinary' | 'local'; configured: boolean } {
  const cloudinaryConfigured = isCloudinaryConfigured();
  return {
    type: cloudinaryConfigured ? 'cloudinary' : 'local',
    configured: cloudinaryConfigured,
  };
}

export default {
  generateFilename,
  getExtensionFromMimetype,
  saveReelVideo,
  saveReelThumbnail,
  deleteReelVideo,
  deleteReelThumbnail,
  getStorageStatus,
};
