import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/environment';

export class CloudinaryService {
  /**
   * Upload an in-memory buffer directly to Cloudinary via upload_stream
   */
  static async uploadBuffer(
    buffer: Buffer,
    folder: string = 'artisan_marketplace'
  ): Promise<{ imageUrl: string; publicId: string }> {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
      throw new AppError(
        'Cloudinary service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
        500
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(new AppError(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`, 500));
          }
          resolve({
            imageUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete an image from Cloudinary by its public ID
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    if (!config.cloudinary.cloudName) return true;

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch {
      console.warn(`Failed to delete Cloudinary asset: ${publicId}`);
      return false;
    }
  }
}
