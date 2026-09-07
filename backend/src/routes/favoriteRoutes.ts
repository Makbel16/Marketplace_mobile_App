import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All favorites endpoints require authentication
router.use(authenticateUser);

router.get('/', FavoriteController.getUserFavorites);
router.post('/:productId', FavoriteController.addFavorite);
router.delete('/:productId', FavoriteController.removeFavorite);

export default router;
