import { Client } from 'minio';

// MinIO Configuration
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
};

// Bucket names
export const BUCKETS = {
  REELS_VIDEOS: 'reels-videos',
  REELS_THUMBNAILS: 'reels-thumbnails',
  REELS_HLS: 'reels-hls',
  MUSIC_LIBRARY: 'music-library',
  DRAFTS: 'drafts',
} as const;

// Create MinIO client
let minioClient: Client | null = null;

export function getMinioClient(): Client {
  if (!minioClient) {
    minioClient = new Client(minioConfig);
  }
  return minioClient;
}

// Initialize buckets
export async function initializeBuckets(): Promise<void> {
  const client = getMinioClient();
  
  for (const bucket of Object.values(BUCKETS)) {
    try {
      const exists = await client.bucketExists(bucket);
      if (!exists) {
        await client.makeBucket(bucket);
        console.log(`Created bucket: ${bucket}`);
      }
    } catch (error) {
      console.error(`Error creating bucket ${bucket}:`, error);
    }
  }
}

// Generate presigned URL for upload
export async function getPresignedUploadUrl(
  bucket: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinioClient();
  return await client.presignedPutObject(bucket, objectName, expirySeconds);
}

// Generate presigned URL for download/streaming
export async function getPresignedDownloadUrl(
  bucket: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinioClient();
  return await client.presignedGetObject(bucket, objectName, expirySeconds);
}

// Upload file from buffer
export async function uploadFile(
  bucket: string,
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ etag: string; versionId: string | null }> {
  const client = getMinioClient();
  const result = await client.putObject(bucket, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
  });
  return result;
}

// Upload file from stream
export async function uploadFileStream(
  bucket: string,
  objectName: string,
  stream: NodeJS.ReadableStream,
  size: number,
  contentType: string
): Promise<{ etag: string; versionId: string | null }> {
  const client = getMinioClient();
  const result = await client.putObject(bucket, objectName, stream, size, {
    'Content-Type': contentType,
  });
  return result;
}

// Delete file
export async function deleteFile(bucket: string, objectName: string): Promise<void> {
  const client = getMinioClient();
  await client.removeObject(bucket, objectName);
}

// Check if file exists
export async function fileExists(bucket: string, objectName: string): Promise<boolean> {
  const client = getMinioClient();
  try {
    await client.statObject(bucket, objectName);
    return true;
  } catch {
    return false;
  }
}

// Get file info
export async function getFileInfo(bucket: string, objectName: string) {
  const client = getMinioClient();
  return await client.statObject(bucket, objectName);
}

// List files in bucket with prefix
export async function listFiles(bucket: string, prefix: string = ''): Promise<string[]> {
  const client = getMinioClient();
  const files: string[] = [];
  
  const stream = client.listObjects(bucket, prefix, true);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      if (obj.name) {
        files.push(obj.name);
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(files));
  });
}

// Get public URL (for public buckets)
export function getPublicUrl(bucket: string, objectName: string): string {
  const protocol = minioConfig.useSSL ? 'https' : 'http';
  const host = minioConfig.endPoint === 'minio' ? 'localhost' : minioConfig.endPoint;
  return `${protocol}://${host}:${minioConfig.port}/${bucket}/${objectName}`;
}

export default {
  getMinioClient,
  initializeBuckets,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  uploadFile,
  uploadFileStream,
  deleteFile,
  fileExists,
  getFileInfo,
  listFiles,
  getPublicUrl,
  BUCKETS,
};
