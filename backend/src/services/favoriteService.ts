import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class FavoriteService {
  /**
   * Get all favorite products for the authenticated user
   */
  static async getUserFavorites(userId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 12));
    const skip = (page - 1) * limit;

    const [total, favorites] = await Promise.all([
      prisma.favorite.count({ where: { userId } }),
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              seller: { select: { id: true, shopName: true } },
              images: { select: { imageUrl: true, isPrimary: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
      }),
    ]);

    const formatted = favorites.map((fav) => {
      const prod = fav.product;
      const reviews = prod.reviews || [];
      const avgRating =
        reviews.length > 0
          ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
          : 0;

      const primaryImage =
        prod.images?.find((img) => img.isPrimary)?.imageUrl || prod.images?.[0]?.imageUrl || null;

      return {
        id: prod.id,
        favoriteId: fav.id,
        name: prod.name,
        price: parseFloat(prod.price.toString()),
        stock: prod.stock,
        status: prod.status,
        imageUrl: primaryImage,
        category: prod.category,
        seller: prod.seller,
        rating: avgRating,
        reviewCount: reviews.length,
        favoritedAt: fav.createdAt,
      };
    });

    return {
      favorites: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add a product to favorites
   */
  static async addFavorite(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      return { message: 'Product is already in your favorites.', isFavorite: true };
    }

    await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });

    return { message: 'Product added to favorites.', isFavorite: true };
  }

  /**
   * Remove a product from favorites
   */
  static async removeFavorite(userId: string, productId: string) {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
    }

    return { message: 'Product removed from favorites.', isFavorite: false };
  }
}
