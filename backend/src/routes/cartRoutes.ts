import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { addToCartValidator, updateCartItemValidator } from '../validators/cartValidators';

const router = Router();

// All cart endpoints require authentication
router.use(authenticateUser);

router.get('/', CartController.getCart);
router.post('/items', addToCartValidator, validateRequest, CartController.addItem);
router.put('/items/:id', updateCartItemValidator, validateRequest, CartController.updateItem);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;
