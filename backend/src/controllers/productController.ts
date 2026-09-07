import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { sendSuccess } from '../utils/apiResponse';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.id;
      const result = await ProductService.getProducts(req.query as any, currentUserId);
      return sendSuccess(res, 'Products fetched successfully', result.products, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user?.id;
      const product = await ProductService.getProductById(id, currentUserId);
      return sendSuccess(res, 'Product details fetched successfully', product);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const newProduct = await ProductService.createProduct(req.user!.id, req.body);
      return sendSuccess(res, 'Product published successfully', newProduct, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await ProductService.updateProduct(req.user!, id, req.body);
      return sendSuccess(res, 'Product updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await ProductService.deleteProduct(req.user!, id);
      return sendSuccess(res, result.message, { id: result.id });
    } catch (error) {
      next(error);
    }
  }

  static async getSellerInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getSellerProducts(req.user!.id, req.query as any);
      return sendSuccess(res, 'Seller inventory fetched successfully', result.products, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}
