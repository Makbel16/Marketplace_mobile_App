import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/reviewService';
import { sendSuccess } from '../utils/apiResponse';

export class ReviewController {
  static async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const result = await ReviewService.getProductReviews(productId, req.query as any);
      return sendSuccess(res, 'Reviews fetched successfully', result.reviews, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const { rating, comment } = req.body;
      const review = await ReviewService.addReview(
        req.user!.id,
        productId,
        parseInt(rating, 10),
        comment
      );
      return sendSuccess(res, 'Review posted successfully', review, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { rating, comment } = req.body;
      const updated = await ReviewService.updateReview(
        req.user!,
        id,
        rating ? parseInt(rating, 10) : undefined,
        comment
      );
      return sendSuccess(res, 'Review updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await ReviewService.deleteReview(req.user!, id);
      return sendSuccess(res, result.message, { id: result.id });
    } catch (error) {
      next(error);
    }
  }
}
