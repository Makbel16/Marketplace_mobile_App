import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { OrderController } from '../controllers/orderController';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createOrderValidator, updateOrderStatusValidator } from '../validators/orderValidators';

const router = Router();

// All order operations require authentication
router.use(authenticateUser);

// Customer endpoints
router.post('/', createOrderValidator, validateRequest, OrderController.createOrder);
router.get('/', OrderController.getUserOrders);

// Seller & Admin orders endpoint (placed before :id route)
router.get('/seller', requireRoles(UserRole.SELLER, UserRole.ADMIN), OrderController.getSellerOrders);

// Order details endpoint
router.get('/:id', OrderController.getOrderDetails);

// Status update (Seller or Admin)
router.patch(
  '/:id/status',
  requireRoles(UserRole.SELLER, UserRole.ADMIN),
  updateOrderStatusValidator,
  validateRequest,
  OrderController.updateOrderStatus
);

export default router;
