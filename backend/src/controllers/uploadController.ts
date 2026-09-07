import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '../services/cloudinaryService';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';

export class UploadController {
  static async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided.', 400);
      }

      const folder = (req.query.folder as string) || 'artisan_marketplace/products';
      const result = await CloudinaryService.uploadBuffer(req.file.buffer, folder);

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

      const folder = (req.query.folder as string) || 'artisan_marketplace/products';

      const uploadPromises = files.map((file) =>
        CloudinaryService.uploadBuffer(file.buffer, folder)
      );

      const results = await Promise.all(uploadPromises);

      return sendSuccess(res, 'Images uploaded successfully', results, 201);
    } catch (error) {
      next(error);
    }
  }
}
