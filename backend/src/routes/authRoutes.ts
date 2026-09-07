import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AuthController } from '../controllers/authController';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  updateSellerProfileValidator,
} from '../validators/authValidators';

const router = Router();

// Public routes (Rate limited to prevent brute force)
router.post('/register', authLimiter, registerValidator, validateRequest, AuthController.register);
router.post('/login', authLimiter, loginValidator, validateRequest, AuthController.login);

// Protected routes (Requires valid JWT)
router.get('/me', authenticateUser, AuthController.getMe);
router.put('/profile', authenticateUser, updateProfileValidator, validateRequest, AuthController.updateProfile);

// Seller profile routes
router.get('/seller-profile', authenticateUser, requireRoles(UserRole.SELLER), AuthController.getSellerProfile);
router.put(
  '/seller-profile',
  authenticateUser,
  requireRoles(UserRole.SELLER),
  updateSellerProfileValidator,
  validateRequest,
  AuthController.updateSellerProfile
);

export default router;
