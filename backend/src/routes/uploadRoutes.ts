import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticateUser } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Upload a single image (e.g. shop logo, profile photo)
router.post('/single', authenticateUser, upload.single('image'), UploadController.uploadSingle);

// Upload up to 5 images for a product gallery
router.post('/multiple', authenticateUser, upload.array('images', 5), UploadController.uploadMultiple);

export default router;
