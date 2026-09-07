import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export class ReviewService {
  /**
   * Get reviews for a specific product with pagination
   */
  static async getProductReviews(productId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { productId } }),
      prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true },
          },
        },
      }),
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      rating: r.rating,
      comment: r.comment,
      author: {
        id: r.user.id,
        name: r.user.name,
        profileImage: r.user.profileImage,
      },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a review (One review per product per customer)
   */
  static async addReview(userId: string, productId: string, rating: number, comment?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    // A seller should not review their own products
    if (product.seller.userId === userId) {
      throw new AppError('You cannot review your own handcrafted products.', 400);
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new AppError(
        'You have already reviewed this product. You can edit your existing review instead.',
        400
      );
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
      },
    });

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      author: {
        id: review.user.id,
        name: review.user.name,
        profileImage: review.user.profileImage,
      },
      createdAt: review.createdAt,
    };
  }

  /**
   * Update an existing review (Owner only)
   */
  static async updateReview(user: AuthenticatedUser, reviewId: string, rating?: number, comment?: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError('Review not found.', 404);
    }

    if (review.userId !== user.id) {
      throw new AppError('Unauthorized: You can only edit your own reviews.', 403);
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
      },
    });

    return {
      id: updated.id,
      productId: updated.productId,
      rating: updated.rating,
      comment: updated.comment,
      author: {
        id: updated.user.id,
        name: updated.user.name,
        profileImage: updated.user.profileImage,
      },
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete review (Owner or Admin)
   */
  static async deleteReview(user: AuthenticatedUser, reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError('Review not found.', 404);
    }

    const isOwner = review.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new AppError('Unauthorized: You can only delete your own reviews.', 403);
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return { id: reviewId, message: 'Review deleted successfully.' };
  }
}
