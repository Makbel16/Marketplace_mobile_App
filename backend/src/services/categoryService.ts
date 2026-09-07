import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  image?: string;
}

export class CategoryService {
  /**
   * Helper to generate a URL-friendly slug
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * List all categories with product counts
   */
  static async getAllCategories() {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      productCount: cat._count.products,
      createdAt: cat.createdAt,
    }));
  }

  /**
   * Get single category by ID or Slug with active products
   */
  static async getCategoryByIdOrSlug(identifier: string) {
    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      productCount: category._count.products,
      createdAt: category.createdAt,
    };
  }

  /**
   * Admin: Create a new category
   */
  static async createCategory(dto: CreateCategoryDTO) {
    const slug = this.generateSlug(dto.name);

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: { equals: dto.name, mode: 'insensitive' } }, { slug }],
      },
    });

    if (existingCategory) {
      throw new AppError('A category with this name or slug already exists.', 409);
    }

    const category = await prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
      },
    });

    return category;
  }

  /**
   * Admin: Update category
   */
  static async updateCategory(id: string, dto: UpdateCategoryDTO) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    let slug = category.slug;
    if (dto.name && dto.name !== category.name) {
      slug = this.generateSlug(dto.name);
      const existing = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { OR: [{ name: { equals: dto.name, mode: 'insensitive' } }, { slug }] },
          ],
        },
      });
      if (existing) {
        throw new AppError('Another category with this name already exists.', 409);
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(slug !== category.slug && { slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image !== undefined && { image: dto.image }),
      },
    });

    return updated;
  }

  /**
   * Admin: Delete category
   */
  static async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    if (category._count.products > 0) {
      throw new AppError(
        `Cannot delete category "${category.name}" because it has ${category._count.products} associated product(s). Reassign products before deleting.`,
        400
      );
    }

    await prisma.category.delete({ where: { id } });
    return { id, message: `Category "${category.name}" deleted successfully.` };
  }
}
