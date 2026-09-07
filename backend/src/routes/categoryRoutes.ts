import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { CategoryController } from '../controllers/categoryController';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createCategoryValidator, updateCategoryValidator } from '../validators/categoryValidators';

const router = Router();

// Public routes
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getOne);

// Admin-only routes
router.post(
  '/',
  authenticateUser,
  requireRoles(UserRole.ADMIN),
  createCategoryValidator,
  validateRequest,
  CategoryController.create
);

router.put(
  '/:id',
  authenticateUser,
  requireRoles(UserRole.ADMIN),
  updateCategoryValidator,
  validateRequest,
  CategoryController.update
);

router.delete(
  '/:id',
  authenticateUser,
  requireRoles(UserRole.ADMIN),
  CategoryController.remove
);

export default router;
