import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import { 
  isCloudinaryConfigured, 
  uploadToCloudinary, 
  uploadProfileImage as cloudinaryUploadProfile,
  uploadImage as cloudinaryUploadImage,
  uploadVideo as cloudinaryUploadVideo,
  uploadThumbnail as cloudinaryUploadThumbnail
} from './cloudinary';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Ensure upload directories exist
async function ensureDirectoryExists(directory: string) {
  try {
    await mkdirAsync(directory, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  publicId?: string;
  storageType: 'cloudinary' | 'local';
}

/**
 * Save file to Cloudinary or local disk and return file information
 */
export async function saveFile(
  file: any, // Using any to avoid TypeScript issues
  directory: string = 'uploads/messages',
  userId?: number
): Promise<FileUploadResult> {
  const isVideo = file.mimetype.startsWith('video/');
  const isImage = file.mimetype.startsWith('image/');
  
  // Try Cloudinary first if configured
  if (isCloudinaryConfigured()) {
    try {
      console.log(`Uploading ${isVideo ? 'video' : 'image'} to Cloudinary...`);
      
      let result;
      const effectiveUserId = userId || 0;
      
      // Use appropriate upload function based on directory/type
      if (directory.includes('profile')) {
        result = await cloudinaryUploadProfile(file.buffer, effectiveUserId);
      } else if (directory.includes('thumbnail')) {
        result = await cloudinaryUploadThumbnail(file.buffer, effectiveUserId);
      } else if (isVideo) {
        result = await cloudinaryUploadVideo(file.buffer, effectiveUserId);
      } else {
        result = await cloudinaryUploadImage(file.buffer, effectiveUserId);
      }
      
      console.log('Cloudinary upload successful:', result.url);
      
      return {
        filename: result.publicId,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: result.url,
        publicId: result.publicId,
        storageType: 'cloudinary',
      };
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local storage:', error);
      // Fall through to local storage
    }
  }
  
  // Fallback to local storage
  const uploadDir = path.join(process.cwd(), 'public', directory);
  await ensureDirectoryExists(uploadDir);
  
  // Generate a unique filename to prevent collisions
  const fileExtension = path.extname(file.originalname);
  const randomName = crypto.randomBytes(16).toString('hex');
  const filename = `${randomName}${fileExtension}`;
  
  // Complete file path
  const filePath = path.join(uploadDir, filename);
  
  // Write file to disk
  await writeFileAsync(filePath, file.buffer);
  
  // Return file information
  return {
    filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/${directory}/${filename}`,
    storageType: 'local',
  };
}