import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { sendSuccess } from '../utils/apiResponse';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.getCart(req.user!.id);
      return sendSuccess(res, 'Cart fetched successfully', cart);
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity = 1 } = req.body;
      const cart = await CartService.addItem(req.user!.id, productId, parseInt(quantity, 10));
      return sendSuccess(res, 'Item added to cart', cart, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { quantity } = req.body;
      const cart = await CartService.updateItem(req.user!.id, id, parseInt(quantity, 10));
      return sendSuccess(res, 'Cart item updated', cart);
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const cart = await CartService.removeItem(req.user!.id, id);
      return sendSuccess(res, 'Item removed from cart', cart);
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.clearCart(req.user!.id);
      return sendSuccess(res, 'Cart cleared successfully', cart);
    } catch (error) {
      next(error);
    }
  }
}
