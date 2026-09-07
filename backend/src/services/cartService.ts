import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class CartService {
  /**
   * Helper to format cart items and compute secure totals
   */
  private static formatCart(cart: any) {
    const items = (cart.items || []).map((item: any) => {
      const unitPrice = parseFloat(item.product.price.toString());
      const subtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
      const primaryImage =
        item.product.images?.find((img: any) => img.isPrimary)?.imageUrl ||
        item.product.images?.[0]?.imageUrl ||
        null;

      return {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: unitPrice,
        stock: item.product.stock,
        quantity: item.quantity,
        subtotal,
        imageUrl: primaryImage,
        seller: {
          id: item.product.seller.id,
          shopName: item.product.seller.shopName,
        },
      };
    });

    const total = parseFloat(
      items.reduce((acc: number, item: any) => acc + item.subtotal, 0).toFixed(2)
    );
    const totalItems = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalItems,
      total,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Retrieve or create cart for user
   */
  static async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { select: { imageUrl: true, isPrimary: true } },
                seller: { select: { id: true, shopName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { select: { imageUrl: true, isPrimary: true } },
                  seller: { select: { id: true, shopName: true } },
                },
              },
            },
          },
        },
      });
    }

    return this.formatCart(cart);
  }

  /**
   * Add a product to the user's cart
   */
  static async addItem(userId: string, productId: string, quantity: number = 1) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    if (product.status !== 'ACTIVE') {
      throw new AppError('This product is not currently available for purchase.', 400);
    }

    if (product.stock < 1) {
      throw new AppError('Sorry, this product is out of stock.', 400);
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if product is already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (newQuantity > product.stock) {
      throw new AppError(
        `Cannot add ${quantity} item(s). Only ${product.stock} item(s) are in stock (You already have ${
          existingItem?.quantity || 0
        } in your cart).`,
        400
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: newQuantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update quantity of a specific cart item
   */
  static async updateItem(userId: string, cartItemId: string, quantity: number) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new AppError('Cart item not found in your cart.', 404);
    }

    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return this.getCart(userId);
    }

    if (quantity > cartItem.product.stock) {
      throw new AppError(
        `Cannot set quantity to ${quantity}. Only ${cartItem.product.stock} item(s) available in stock.`,
        400
      );
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId: string, cartItemId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new AppError('Cart item not found in your cart.', 404);
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return this.getCart(userId);
  }

  /**
   * Clear all items in user's cart
   */
  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return this.getCart(userId);
  }
}
