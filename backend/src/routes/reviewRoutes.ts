import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createReviewValidator, updateReviewValidator } from '../validators/reviewValidators';

const router = Router();

// Public route to view reviews for a product
router.get('/product/:productId', ReviewController.getProductReviews);

// Protected routes
router.post(
  '/product/:productId',
  authenticateUser,
  createReviewValidator,
  validateRequest,
  ReviewController.addReview
);

router.put(
  '/:id',
  authenticateUser,
  updateReviewValidator,
  validateRequest,
  ReviewController.updateReview
);

router.delete('/:id', authenticateUser, ReviewController.deleteReview);

export default router;
