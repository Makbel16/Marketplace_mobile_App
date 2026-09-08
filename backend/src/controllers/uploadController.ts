import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { CloudinaryService } from '../services/cloudinaryService';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/environment';

async function saveLocally(req: Request, file: Express.Multer.File): Promise<{ imageUrl: string; publicId: string }> {
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `craft-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.promises.writeFile(filePath, file.buffer);

  const host = req.get('host') || `localhost:${config.port}`;
  const protocol = req.protocol;
  const imageUrl = `${protocol}://${host}/uploads/${filename}`;

  return {
    imageUrl,
    publicId: filename,
  };
}

export class UploadController {
  static async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided.', 400);
      }

      let result: { imageUrl: string; publicId: string };

      const isCloudinaryConfigured =
        config.cloudinary.cloudName &&
        config.cloudinary.cloudName !== 'YOUR_CLOUDINARY_CLOUD_NAME' &&
        config.cloudinary.apiKey &&
        config.cloudinary.apiKey !== 'YOUR_CLOUDINARY_API_KEY';

      if (isCloudinaryConfigured) {
        try {
          const folder = (req.query.folder as string) || 'artisan_marketplace/products';
          result = await CloudinaryService.uploadBuffer(req.file.buffer, folder);
        } catch (cloudErr) {
          console.warn('Cloudinary upload error, falling back to local server storage:', cloudErr);
          result = await saveLocally(req, req.file);
        }
      } else {
        result = await saveLocally(req, req.file);
      }

      return sendSuccess(res, 'Image uploaded successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No image files provided.', 400);
      }

      const results = await Promise.all(
        files.map((file) => {
          const isCloudinaryConfigured =
            config.cloudinary.cloudName &&
            config.cloudinary.cloudName !== 'YOUR_CLOUDINARY_CLOUD_NAME' &&
            config.cloudinary.apiKey &&
            config.cloudinary.apiKey !== 'YOUR_CLOUDINARY_API_KEY';

          if (isCloudinaryConfigured) {
            const folder = (req.query.folder as string) || 'artisan_marketplace/products';
            return CloudinaryService.uploadBuffer(file.buffer, folder).catch(() =>
              saveLocally(req, file)
            );
          }
          return saveLocally(req, file);
        })
      );

      return sendSuccess(res, 'Images uploaded successfully', results, 201);
    } catch (error) {
      next(error);
    }
  }
}
