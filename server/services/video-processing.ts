/**
 * Video Processing Service
 * Handles video optimization, thumbnail generation, and audio merging
 * Uses FFmpeg for processing (free, open-source)
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PROCESSED_DIR = path.join(UPLOAD_DIR, "processed");
const TEMP_DIR = path.join(UPLOAD_DIR, "temp");

// Ensure directories exist
[PROCESSED_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export interface ProcessingOptions {
  trimStart?: number;
  trimEnd?: number;
  filter?: string;
  musicPath?: string;
  musicVolume?: number;
  originalVolume?: number;
  outputFormat?: "mp4" | "webm";
  quality?: "low" | "medium" | "high";
}

export interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  outputUrl?: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

export interface ProcessingStatus {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
}

// In-memory processing queue (use Redis in production)
const processingQueue = new Map<string, ProcessingStatus>();

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-version"]);
    ffmpeg.on("error", () => resolve(false));
    ffmpeg.on("close", (code) => resolve(code === 0));
  });
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(inputPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}> {
  return new Promise((resolve, reject) => {
    const args = [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      inputPath
    ];

    const ffprobe = spawn("ffprobe", args);
    let output = "";

    ffprobe.stdout.on("data", (data) => { output += data.toString(); });
    ffprobe.stderr.on("data", (data) => { console.error("FFprobe error:", data.toString()); });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        // Return defaults if FFprobe fails
        resolve({ duration: 0, width: 1080, height: 1920, fps: 30, codec: "h264" });
        return;
      }

      try {
        const data = JSON.parse(output);
        const videoStream = data.streams?.find((s: any) => s.codec_type === "video");
        
        resolve({
          duration: parseFloat(data.format?.duration || "0"),
          width: videoStream?.width || 1080,
          height: videoStream?.height || 1920,
          fps: eval(videoStream?.r_frame_rate || "30/1"),
          codec: videoStream?.codec_name || "h264"
        });
      } catch (e) {
        resolve({ duration: 0, width: 1080, height: 1920, fps: 30, codec: "h264" });
      }
    });
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timestamp: number = 0
): Promise<boolean> {
  return new Promise((resolve) => {
    const args = [
      "-i", inputPath,
      "-ss", timestamp.toString(),
      "-vframes", "1",
      "-vf", "scale=720:-1",
      "-q:v", "2",
      "-y",
      outputPath
    ];

    const ffmpeg = spawn("ffmpeg", args);
    ffmpeg.on("error", () => resolve(false));
    ffmpeg.on("close", (code) => resolve(code === 0));
  });
}

/**
 * Process video with options (trim, filter, music merge)
 */
export async function processVideo(
  inputPath: string,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const {
    trimStart = 0,
    trimEnd,
    filter,
    musicPath,
    musicVolume = 80,
    originalVolume = 100,
    outputFormat = "mp4",
    quality = "medium"
  } = options;

  const outputFilename = `${uuidv4()}.${outputFormat}`;
  const outputPath = path.join(PROCESSED_DIR, outputFilename);
  const thumbnailFilename = `${uuidv4()}.jpg`;
  const thumbnailPath = path.join(PROCESSED_DIR, thumbnailFilename);

  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    // Fallback: just copy the file without processing
    console.log("FFmpeg not available, using raw video");
    try {
      fs.copyFileSync(inputPath, outputPath);
      return {
        success: true,
        outputPath,
        outputUrl: `/uploads/processed/${outputFilename}`,
        duration: trimEnd ? trimEnd - trimStart : undefined
      };
    } catch (error) {
      return { success: false, error: "Failed to copy video file" };
    }
  }

  // Build FFmpeg arguments
  const args: string[] = [];

  // Input file
  args.push("-i", inputPath);

  // Add music input if provided
  if (musicPath && fs.existsSync(musicPath)) {
    args.push("-i", musicPath);
  }

  // Trim options
  if (trimStart > 0) {
    args.push("-ss", trimStart.toString());
  }
  if (trimEnd) {
    args.push("-t", (trimEnd - trimStart).toString());
  }

  // Video filters
  const videoFilters: string[] = [];
  
  // Scale to 1080p max while maintaining aspect ratio
  videoFilters.push("scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease");
  
  // Apply CSS-like filter if provided
  if (filter && filter !== "none") {
    // Convert CSS filter to FFmpeg equivalent
    const ffmpegFilter = cssFilterToFFmpeg(filter);
    if (ffmpegFilter) {
      videoFilters.push(ffmpegFilter);
    }
  }

  if (videoFilters.length > 0) {
    args.push("-vf", videoFilters.join(","));
  }

  // Audio handling
  if (musicPath && fs.existsSync(musicPath)) {
    // Mix original audio with music
    const origVol = originalVolume / 100;
    const musicVol = musicVolume / 100;
    args.push("-filter_complex", `[0:a]volume=${origVol}[a0];[1:a]volume=${musicVol}[a1];[a0][a1]amix=inputs=2:duration=first[aout]`);
    args.push("-map", "0:v");
    args.push("-map", "[aout]");
  }

  // Quality settings
  const qualitySettings = {
    low: { crf: "28", preset: "fast" },
    medium: { crf: "23", preset: "medium" },
    high: { crf: "18", preset: "slow" }
  };
  const { crf, preset } = qualitySettings[quality];

  // Output settings
  args.push(
    "-c:v", "libx264",
    "-crf", crf,
    "-preset", preset,
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    outputPath
  );

  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", args);
    let errorOutput = "";

    ffmpeg.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on("error", (error) => {
      resolve({ success: false, error: error.message });
    });

    ffmpeg.on("close", async (code) => {
      if (code !== 0) {
        console.error("FFmpeg error:", errorOutput);
        resolve({ success: false, error: "Video processing failed" });
        return;
      }

      // Generate thumbnail
      await generateThumbnail(outputPath, thumbnailPath, trimStart);

      // Get output duration
      const metadata = await getVideoMetadata(outputPath);

      resolve({
        success: true,
        outputPath,
        outputUrl: `/uploads/processed/${outputFilename}`,
        thumbnailPath,
        thumbnailUrl: `/uploads/processed/${thumbnailFilename}`,
        duration: metadata.duration
      });
    });
  });
}

/**
 * Convert CSS filter string to FFmpeg filter
 */
function cssFilterToFFmpeg(cssFilter: string): string | null {
  const filters: string[] = [];

  // Parse CSS filter functions
  const brightnessMatch = cssFilter.match(/brightness\(([\d.]+)\)/);
  if (brightnessMatch) {
    const value = parseFloat(brightnessMatch[1]);
    filters.push(`eq=brightness=${(value - 1) * 0.5}`);
  }

  const contrastMatch = cssFilter.match(/contrast\(([\d.]+)\)/);
  if (contrastMatch) {
    const value = parseFloat(contrastMatch[1]);
    filters.push(`eq=contrast=${value}`);
  }

  const saturateMatch = cssFilter.match(/saturate\(([\d.]+)\)/);
  if (saturateMatch) {
    const value = parseFloat(saturateMatch[1]);
    filters.push(`eq=saturation=${value}`);
  }

  const grayscaleMatch = cssFilter.match(/grayscale\(([\d.]+)\)/);
  if (grayscaleMatch) {
    const value = parseFloat(grayscaleMatch[1]);
    if (value > 0) {
      filters.push(`hue=s=${1 - value}`);
    }
  }

  const sepiaMatch = cssFilter.match(/sepia\(([\d.]+)\)/);
  if (sepiaMatch) {
    const value = parseFloat(sepiaMatch[1]);
    if (value > 0) {
      filters.push(`colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`);
    }
  }

  const hueRotateMatch = cssFilter.match(/hue-rotate\(([\d.]+)deg\)/);
  if (hueRotateMatch) {
    const value = parseFloat(hueRotateMatch[1]);
    filters.push(`hue=h=${value}`);
  }

  return filters.length > 0 ? filters.join(",") : null;
}

/**
 * Queue video for async processing
 */
export function queueVideoProcessing(
  inputPath: string,
  options: ProcessingOptions
): string {
  const jobId = uuidv4();
  
  processingQueue.set(jobId, {
    id: jobId,
    status: "queued",
    progress: 0
  });

  // Process async
  setImmediate(async () => {
    processingQueue.set(jobId, { ...processingQueue.get(jobId)!, status: "processing", progress: 10 });
    
    const result = await processVideo(inputPath, options);
    
    if (result.success) {
      processingQueue.set(jobId, {
        id: jobId,
        status: "completed",
        progress: 100,
        outputUrl: result.outputUrl
      });
    } else {
      processingQueue.set(jobId, {
        id: jobId,
        status: "failed",
        progress: 0,
        error: result.error
      });
    }
  });

  return jobId;
}

/**
 * Get processing status
 */
export function getProcessingStatus(jobId: string): ProcessingStatus | null {
  return processingQueue.get(jobId) || null;
}

/**
 * Clean up old processed files (run periodically)
 */
export async function cleanupOldFiles(maxAgeHours: number = 24): Promise<number> {
  let deletedCount = 0;
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();

  for (const dir of [PROCESSED_DIR, TEMP_DIR]) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  }

  return deletedCount;
}

export default {
  checkFFmpeg,
  getVideoMetadata,
  generateThumbnail,
  processVideo,
  queueVideoProcessing,
  getProcessingStatus,
  cleanupOldFiles
};
