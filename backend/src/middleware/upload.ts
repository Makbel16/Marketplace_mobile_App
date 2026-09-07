import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Use in-memory storage so binary buffers are streamed directly to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`,
        400
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
    files: 5, // Maximum 5 files per upload request
  },
});
