import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticateUser } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Upload a single image (e.g. shop logo, profile photo)
router.post('/single', authenticateUser, upload.single('image'), UploadController.uploadSingle);

// Upload image using base64 payload (for mobile React Native / Expo clients)
router.post('/base64', authenticateUser, UploadController.uploadBase64);

export default router;
