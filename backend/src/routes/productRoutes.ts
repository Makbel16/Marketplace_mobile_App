import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ProductController } from '../controllers/productController';
import { authenticateUser, optionalAuth, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import {
  createProductValidator,
  updateProductValidator,
  productQueryValidator,
} from '../validators/productValidators';

const router = Router();

// Public routes (with optional user context for favorites state)
router.get('/', optionalAuth, productQueryValidator, validateRequest, ProductController.getProducts);

// Seller inventory route (Placed before :id route so 'seller' is not interpreted as an ID)
router.get(
  '/seller/inventory',
  authenticateUser,
  requireRoles(UserRole.SELLER),
  ProductController.getSellerInventory
);

router.get('/:id', optionalAuth, ProductController.getProductById);

// Protected routes: Create product (Seller only)
router.post(
  '/',
  authenticateUser,
  requireRoles(UserRole.SELLER),
  createProductValidator,
  validateRequest,
  ProductController.createProduct
);

// Protected routes: Update product (Seller owner or Admin)
router.put(
  '/:id',
  authenticateUser,
  requireRoles(UserRole.SELLER, UserRole.ADMIN),
  updateProductValidator,
  validateRequest,
  ProductController.updateProduct
);

// Protected routes: Delete product (Seller owner or Admin)
router.delete(
  '/:id',
  authenticateUser,
  requireRoles(UserRole.SELLER, UserRole.ADMIN),
  ProductController.deleteProduct
);

export default router;
