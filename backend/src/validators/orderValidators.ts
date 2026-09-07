import { body } from 'express-validator';
import { OrderStatus } from '@prisma/client';

export const createOrderValidator = [
  body('shippingAddress')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Shipping address must be between 10 and 500 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone number is required')
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone number must be between 7 and 20 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Delivery notes cannot exceed 500 characters'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array of order items'),
  body('items.*.productId')
    .optional()
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
];

export const updateOrderStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn([
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ])
    .withMessage('Invalid order status'),
];
