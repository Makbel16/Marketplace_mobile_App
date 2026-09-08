import { Prisma, ProductStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  sortBy?: 'createdAt' | 'price' | 'name' | 'stock' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: Array<{ imageUrl: string; publicId?: string; isPrimary?: boolean }>;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  status?: ProductStatus;
  images?: Array<{ imageUrl: string; publicId?: string; isPrimary?: boolean }>;
}

export class ProductService {
  /**
   * Helper to format and augment a product with average rating and favorite state
   */
  private static formatProduct(product: any, userFavoritesSet?: Set<string>) {
    const reviews = product.reviews || [];
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? parseFloat((reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    const primaryImage =
      product.images?.find((img: any) => img.isPrimary)?.imageUrl ||
      product.images?.[0]?.imageUrl ||
      null;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      stock: product.stock,
      status: product.status,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : undefined,
      seller: product.seller
        ? {
            id: product.seller.id,
            shopName: product.seller.shopName,
            location: product.seller.location,
            profileImage: product.seller.profileImage,
          }
        : undefined,
      primaryImage,
      images: product.images || [],
      rating: avgRating,
      reviewCount: totalReviews,
      isFavorite: userFavoritesSet ? userFavoritesSet.has(product.id) : false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * List products with multi-faceted search, filters, and pagination
   */
  static async getProducts(options: ProductQueryOptions, currentUserId?: string) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      // Default to only ACTIVE products for marketplace catalog
      status: options.status || ProductStatus.ACTIVE,
    };

    // Category filter by ID or slug
    if (options.category) {
      where.category = {
        OR: [{ id: options.category }, { slug: options.category }],
      };
    }

    // Seller filter
    if (options.sellerId) {
      where.sellerId = options.sellerId;
    }

    // Price range filters
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      where.price = {};
      if (options.minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(options.minPrice);
      }
      if (options.maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(options.maxPrice);
      }
    }

    // Full-text / partial search on product name, description, or seller shop name
    if (options.search && options.search.trim()) {
      const searchTerm = options.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { seller: { shopName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Sorting options
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

    if (options.sortBy === 'price') {
      orderBy = { price: sortOrder };
    } else if (options.sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (options.sortBy === 'stock') {
      orderBy = { stock: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    // Execute queries in parallel
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, shopName: true, location: true, profileImage: true } },
          images: { select: { id: true, imageUrl: true, isPrimary: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    // If user is authenticated, query their favorites in a batch
    let userFavoritesSet: Set<string> | undefined;
    if (currentUserId && products.length > 0) {
      const productIds = products.map((p) => p.id);
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: currentUserId,
          productId: { in: productIds },
        },
        select: { productId: true },
      });
      userFavoritesSet = new Set(favorites.map((f) => f.productId));
    }

    const formattedProducts = products.map((p) => this.formatProduct(p, userFavoritesSet));

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single product by ID with full details, reviews, and artisan shop info
   */
  static async getProductById(id: string, currentUserId?: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, description: true } },
        seller: {
          select: {
            id: true,
            shopName: true,
            description: true,
            location: true,
            phone: true,
            profileImage: true,
            bannerImage: true,
          },
        },
        images: {
          select: { id: true, imageUrl: true, isPrimary: true, publicId: true },
          orderBy: { isPrimary: 'desc' },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, profileImage: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    let isFavorite = false;
    if (currentUserId) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: currentUserId,
            productId: id,
          },
        },
      });
      isFavorite = !!fav;
    }

    const totalReviews = product.reviews.length;
    const avgRating =
      totalReviews > 0
        ? parseFloat((product.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      stock: product.stock,
      status: product.status,
      category: product.category,
      seller: product.seller,
      images: product.images,
      rating: avgRating,
      reviewCount: totalReviews,
      reviews: product.reviews,
      isFavorite,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Create a new product (Artisan / Seller only)
   */
  static async createProduct(sellerUserId: string, dto: CreateProductDTO) {
    let seller = await prisma.sellerProfile.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      const user = await prisma.user.findUnique({ where: { id: sellerUserId } });
      if (user?.role === UserRole.ADMIN) {
        seller = await prisma.sellerProfile.findFirst({ where: { status: 'APPROVED' } });
      }
    }

    if (!seller) {
      throw new AppError('Seller profile not found. You must be a registered seller or admin to add products.', 403);
    }

    if (seller.status !== 'APPROVED') {
      throw new AppError('Your seller shop is currently pending or suspended. Cannot publish products.', 403);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new AppError('Specified category does not exist.', 400);
    }

    // Create product and associated images in a transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sellerId: seller.id,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          price: new Prisma.Decimal(dto.price),
          stock: dto.stock,
          status: dto.stock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK,
        },
      });

      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, idx) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
            publicId: img.publicId,
            isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
          })),
        });
      }

      return product;
    });

    return this.getProductById(newProduct.id);
  }

  /**
   * Update a product (Strict seller ownership check or Admin)
   */
  static async updateProduct(user: AuthenticatedUser, productId: string, dto: UpdateProductDTO) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    // Authorization: User must be product's seller or an ADMIN
    const isOwner = product.seller.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new AppError('Unauthorized: You can only edit products from your own shop.', 403);
    }

    if (dto.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new AppError('Specified category does not exist.', 400);
    }

    // Determine updated status
    let status = dto.status;
    if (dto.stock !== undefined && !dto.status) {
      if (dto.stock === 0 && product.status === ProductStatus.ACTIVE) {
        status = ProductStatus.OUT_OF_STOCK;
      } else if (dto.stock > 0 && product.status === ProductStatus.OUT_OF_STOCK) {
        status = ProductStatus.ACTIVE;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(status !== undefined && { status }),
        },
      });

      if (dto.images) {
        // Replace images if a new image array is provided
        await tx.productImage.deleteMany({ where: { productId } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img, idx) => ({
              productId,
              imageUrl: img.imageUrl,
              publicId: img.publicId,
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
            })),
          });
        }
      }
    });

    return this.getProductById(productId);
  }

  /**
   * Delete a product (Strict seller ownership check or Admin)
   */
  static async deleteProduct(user: AuthenticatedUser, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const isOwner = product.seller.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new AppError('Unauthorized: You can only delete products from your own shop.', 403);
    }

    // Cascade delete or archive product
    await prisma.product.delete({ where: { id: productId } });

    return { id: productId, message: 'Product deleted successfully.' };
  }

  /**
   * Seller: Get all products belonging to the seller's shop
   */
  static async getSellerProducts(sellerUserId: string, options: { page?: number; limit?: number }) {
    const user = await prisma.user.findUnique({ where: { id: sellerUserId } });
    let whereClause: any = {};

    if (user?.role !== UserRole.ADMIN) {
      const seller = await prisma.sellerProfile.findUnique({ where: { userId: sellerUserId } });
      if (!seller) {
        throw new AppError('Seller profile not found.', 404);
      }
      whereClause = { sellerId: seller.id };
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          images: { select: { id: true, imageUrl: true, isPrimary: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    const formattedProducts = products.map((p) => this.formatProduct(p));

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
