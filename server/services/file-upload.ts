import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

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
}

/**
 * Save file to disk and return file information
 */
export async function saveFile(
  file: any, // Using any to avoid TypeScript issues
  directory: string = 'uploads/messages'
): Promise<FileUploadResult> {
  // Ensure the upload directory exists
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
    url: `/${directory}/${filename}`
  };
}