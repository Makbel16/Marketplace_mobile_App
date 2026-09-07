import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService';
import { sendSuccess } from '../utils/apiResponse';

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getAllCategories();
      return sendSuccess(res, 'Categories fetched successfully', categories);
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const category = await CategoryService.getCategoryByIdOrSlug(id);
      return sendSuccess(res, 'Category fetched successfully', category);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const newCategory = await CategoryService.createCategory(req.body);
      return sendSuccess(res, 'Category created successfully', newCategory, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updatedCategory = await CategoryService.updateCategory(id, req.body);
      return sendSuccess(res, 'Category updated successfully', updatedCategory);
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await CategoryService.deleteCategory(id);
      return sendSuccess(res, result.message, { id: result.id });
    } catch (error) {
      next(error);
    }
  }
}
