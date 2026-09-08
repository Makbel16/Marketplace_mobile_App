import { OrderStatus, Prisma, ProductStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export interface CreateOrderDTO {
  shippingAddress: string;
  phone: string;
  notes?: string;
  items?: Array<{ productId: string; quantity: number }>;
}

export class OrderService {
  /**
   * Generates a unique, professional human-readable order number
   */
  private static generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `ART-${dateStr}-${randomHex}`;
  }

  private static normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    const match = cleaned.match(/^(?:\+251|00251|251|0)?([97]\d{8})$/);
    if (match) {
      const num = match[1];
      return `+251 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
    }
    return phone.trim();
  }

  /**
   * Create an order via atomic database transaction:
   * 1. Validates stock
   * 2. Calculates real unit prices & total on backend
   * 3. Creates Order and OrderItems
   * 4. Decrements product inventory safely
   * 5. Clears user's cart
   */
  static async createOrder(userId: string, dto: CreateOrderDTO) {
    let checkoutItems: Array<{ productId: string; quantity: number }> = [];

    if (dto.items && dto.items.length > 0) {
      checkoutItems = dto.items;
    } else {
      // Load items from user's current cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new AppError('Your cart is empty. Add products before checking out.', 400);
      }

      checkoutItems = cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
    }

    // Load actual products from the database
    const productIds = checkoutItems.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        seller: true,
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Validate availability and calculate totals safely on backend
    let calculatedTotal = new Prisma.Decimal(0);
    const orderItemsData: Array<{
      productId: string;
      sellerId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }> = [];

    for (const item of checkoutItems) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      if (dbProduct.status !== ProductStatus.ACTIVE) {
        throw new AppError(`"${dbProduct.name}" is no longer available for purchase.`, 400);
      }

      if (dbProduct.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} item(s) available.`,
          400
        );
      }

      const unitPrice = dbProduct.price;
      const subtotal = unitPrice.mul(item.quantity);
      calculatedTotal = calculatedTotal.add(subtotal);

      orderItemsData.push({
        productId: dbProduct.id,
        sellerId: dbProduct.sellerId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    // Execute atomic transaction
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = this.generateOrderNumber();

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount: calculatedTotal,
          status: OrderStatus.PENDING,
          shippingAddress: dto.shippingAddress,
          phone: OrderService.normalizePhone(dto.phone),
          notes: dto.notes,
        },
      });

      for (const item of orderItemsData) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            sellerId: item.sellerId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          },
        });

        // Decrement stock safely
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // If stock hits 0, mark as OUT_OF_STOCK
        if (updatedProduct.stock <= 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { status: ProductStatus.OUT_OF_STOCK },
          });
        }
      }

      // Clear the user's cart after successful order creation
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return createdOrder;
    });

    return this.getOrderDetails(userId, order.id);
  }

  /**
   * Get user's order history
   */
  static async getUserOrders(userId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: { select: { imageUrl: true, isPrimary: true }, take: 1 },
                },
              },
              seller: {
                select: { id: true, shopName: true },
              },
            },
          },
        },
      }),
    ]);

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: parseFloat(o.totalAmount.toString()),
      status: o.status,
      shippingAddress: o.shippingAddress,
      phone: o.phone,
      notes: o.notes,
      totalItems: o.items.reduce((sum, item) => sum + item.quantity, 0),
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        imageUrl: i.product.images[0]?.imageUrl || null,
        sellerShop: i.seller.shopName,
        quantity: i.quantity,
        unitPrice: parseFloat(i.unitPrice.toString()),
        subtotal: parseFloat(i.subtotal.toString()),
      })),
      createdAt: o.createdAt,
    }));

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order details by ID (With authorization check)
   */
  static async getOrderDetails(currentUserId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: { select: { imageUrl: true, isPrimary: true } },
              },
            },
            seller: {
              select: { id: true, userId: true, shopName: true, phone: true, location: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    // Verify user is customer, seller of an item, or admin
    const isCustomer = order.userId === currentUserId;
    const isSeller = order.items.some((i) => i.seller.userId === currentUserId);
    const userRecord = await prisma.user.findUnique({ where: { id: currentUserId } });
    const isAdmin = userRecord?.role === UserRole.ADMIN;

    if (!isCustomer && !isSeller && !isAdmin) {
      throw new AppError('Unauthorized: You cannot access this order.', 403);
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.phone,
      },
      totalAmount: parseFloat(order.totalAmount.toString()),
      status: order.status,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        imageUrl: i.product.images[0]?.imageUrl || null,
        seller: {
          id: i.seller.id,
          shopName: i.seller.shopName,
          phone: i.seller.phone,
          location: i.seller.location,
        },
        quantity: i.quantity,
        unitPrice: parseFloat(i.unitPrice.toString()),
        subtotal: parseFloat(i.subtotal.toString()),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Seller & Admin: Get all orders containing products made by the seller (or all orders if Admin)
   */
  static async getSellerOrders(userId: string, options: { page?: number; limit?: number }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let whereClause: any = {};

    if (user?.role !== UserRole.ADMIN) {
      const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
      if (!seller) {
        throw new AppError('Seller profile not found.', 404);
      }
      whereClause = { sellerId: seller.id };
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, orderItems] = await Promise.all([
      prisma.orderItem.count({ where: whereClause }),
      prisma.orderItem.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { order: { createdAt: 'desc' } },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              images: { select: { imageUrl: true, isPrimary: true }, take: 1 },
            },
          },
        },
      }),
    ]);

    const formatted = orderItems.map((item) => ({
      orderItemId: item.id,
      orderId: item.order.id,
      orderNumber: item.order.orderNumber,
      orderStatus: item.order.status,
      customerName: item.order.user.name,
      shippingAddress: item.order.shippingAddress,
      phone: item.order.phone,
      productName: item.product.name,
      imageUrl: item.product.images[0]?.imageUrl || null,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice.toString()),
      subtotal: parseFloat(item.subtotal.toString()),
      createdAt: item.order.createdAt,
    }));

    return {
      orders: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status (Seller or Admin)
   */
  static async updateOrderStatus(user: AuthenticatedUser, orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { seller: true },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    const isSellerOfItem = order.items.some((i) => i.seller.userId === user.id);
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isSellerOfItem && !isAdmin) {
      throw new AppError('Unauthorized: You cannot update this order status.', 403);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      message: `Order status updated to ${status}.`,
    };
  }
}
