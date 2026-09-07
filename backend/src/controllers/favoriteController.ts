import { Request, Response, NextFunction } from 'express';
import { FavoriteService } from '../services/favoriteService';
import { sendSuccess } from '../utils/apiResponse';

export class FavoriteController {
  static async getUserFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FavoriteService.getUserFavorites(req.user!.id, req.query as any);
      return sendSuccess(res, 'Favorites retrieved successfully', result.favorites, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async addFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const result = await FavoriteService.addFavorite(req.user!.id, productId);
      return sendSuccess(res, result.message, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async removeFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const result = await FavoriteService.removeFavorite(req.user!.id, productId);
      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}
