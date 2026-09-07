import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { sendSuccess } from '../utils/apiResponse';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.createOrder(req.user!.id, req.body);
      return sendSuccess(res, 'Order placed successfully', order, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.getUserOrders(req.user!.id, req.query as any);
      return sendSuccess(res, 'Orders retrieved successfully', result.orders, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const order = await OrderService.getOrderDetails(req.user!.id, id);
      return sendSuccess(res, 'Order details retrieved successfully', order);
    } catch (error) {
      next(error);
    }
  }

  static async getSellerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.getSellerOrders(req.user!.id, req.query as any);
      return sendSuccess(res, 'Seller orders retrieved successfully', result.orders, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const result = await OrderService.updateOrderStatus(req.user!, id, status);
      return sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}
