import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Local storage paths
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const REELS_DIR = path.join(UPLOAD_DIR, 'reels');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Ensure directories exist
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

// Save video file locally
export async function saveReelVideo(
  userId: number,
  buffer: Buffer,
  mimetype: string
): Promise<{ videoUrl: string; filename: string }> {
  ensureDirectories();
  
  const extension = getExtensionFromMimetype(mimetype);
  const filename = generateFilename(userId, extension);
  const filepath = path.join(REELS_DIR, filename);
  
  await fs.promises.writeFile(filepath, buffer);
  
  // Return URL relative to public folder
  const videoUrl = `/uploads/reels/${filename}`;
  
  return { videoUrl, filename };
}

// Save thumbnail file locally
export async function saveReelThumbnail(
  userId: number,
  buffer: Buffer,
  mimetype: string
): Promise<{ thumbnailUrl: string; filename: string }> {
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
export async function deleteReelVideo(filename: string): Promise<void> {
  const filepath = path.join(REELS_DIR, filename);
  if (fs.existsSync(filepath)) {
    await fs.promises.unlink(filepath);
  }
}

// Delete thumbnail file
export async function deleteReelThumbnail(filename: string): Promise<void> {
  const filepath = path.join(THUMBNAILS_DIR, filename);
  if (fs.existsSync(filepath)) {
    await fs.promises.unlink(filepath);
  }
}

export default {
  generateFilename,
  getExtensionFromMimetype,
  saveReelVideo,
  saveReelThumbnail,
  deleteReelVideo,
  deleteReelThumbnail,
};
