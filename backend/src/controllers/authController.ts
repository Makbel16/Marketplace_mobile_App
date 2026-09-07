import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess } from '../utils/apiResponse';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return sendSuccess(res, 'Account registered successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return sendSuccess(res, 'Logged in successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      return sendSuccess(res, 'User profile fetched successfully', user, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedUser = await AuthService.updateProfile(req.user!.id, req.body);
      return sendSuccess(res, 'Profile updated successfully', updatedUser, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getSellerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerProfile = await AuthService.getSellerProfile(req.user!.id);
      return sendSuccess(res, 'Seller profile fetched successfully', sellerProfile, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateSellerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedProfile = await AuthService.updateSellerProfile(req.user!.id, req.body);
      return sendSuccess(res, 'Seller shop profile updated successfully', updatedProfile, 200);
    } catch (error) {
      next(error);
    }
  }
}
