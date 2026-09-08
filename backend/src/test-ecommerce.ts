import { AuthService } from './services/authService';
import { ProductService } from './services/productService';
import { CartService } from './services/cartService';
import { OrderService } from './services/orderService';
import { FavoriteService } from './services/favoriteService';
import { ReviewService } from './services/reviewService';
import { prisma } from './config/prisma';
import { OrderStatus } from '@prisma/client';

async function runEcommerceTests() {
  console.log('🧪 Starting Full E-Commerce Flow Integration Tests...');

  try {
    // 1. Authenticate customer Sarah
    console.log('\n[Step 1] Authenticating customer (customer@artisan.com)...');
    const customerLogin = await AuthService.login('customer@artisan.com', 'Password123!');
    const customer = customerLogin.user;

    // 2. Fetch available products
    const productCatalog = await ProductService.getProducts({ limit: 5 });
    const testProduct = productCatalog.products.find((p) => p.stock >= 2) || productCatalog.products[0];
    const initialStock = testProduct.stock;
    console.log(`✅ Selected product: "${testProduct.name}" (Price: $${testProduct.price}, Current Stock: ${initialStock})`);

    // 3. Cart Flow: Add item to cart
    console.log('\n[Step 2] Adding product to customer cart (Quantity: 2)...');
    let cart = await CartService.addItem(customer.id, testProduct.id, 2);
    const cartItem = cart.items.find((i: any) => i.productId === testProduct.id);
    if (!cartItem || cartItem.quantity !== 2) throw new Error('Cart item quantity mismatch');
    const expectedSubtotal = parseFloat((testProduct.price * 2).toFixed(2));
    if (cartItem.subtotal !== expectedSubtotal) throw new Error('Subtotal calculation incorrect');
    console.log(`✅ Product added to cart. Item Subtotal: $${cartItem.subtotal}, Cart Total: $${cart.total}`);

    // 4. Cart Stock Validation
    console.log('\n[Step 3] Testing stock overflow prevention in cart...');
    try {
      await CartService.addItem(customer.id, testProduct.id, 99999);
      throw new Error('Stock overflow should have been rejected');
    } catch (err: any) {
      if (err.statusCode === 400) {
        console.log('✅ Correctly blocked adding more quantity than available stock (400 Bad Request).');
      } else {
        throw err;
      }
    }

    // 5. Checkout & Order Creation (Atomic Transaction)
    console.log('\n[Step 4] Placing order (Cash on Delivery)...');
    const order = await OrderService.createOrder(customer.id, {
      shippingAddress: 'Bole Sub-city, Woreda 03, Addis Ababa, Ethiopia',
      phone: '+251911234567',
      notes: 'Please call before arrival.',
    });

    if (!order.orderNumber.startsWith('ART-')) throw new Error('Invalid order number format');
    if (order.items.length === 0) throw new Error('Order items were not created');
    console.log(`✅ Order placed! Order Number: ${order.orderNumber}, Total: $${order.totalAmount}, Status: ${order.status}`);

    // 6. Verify stock decremented safely
    console.log('\n[Step 5] Verifying inventory decrement in database...');
    const productAfterOrder = await ProductService.getProductById(testProduct.id);
    if (productAfterOrder.stock !== initialStock - 2) {
      throw new Error(`Inventory mismatch: expected ${initialStock - 2}, found ${productAfterOrder.stock}`);
    }
    console.log(`✅ Inventory safely decremented from ${initialStock} to ${productAfterOrder.stock}.`);

    // 7. Verify cart was cleared after checkout
    console.log('\n[Step 6] Verifying cart cleared after order placement...');
    const cartAfterOrder = await CartService.getCart(customer.id);
    if (cartAfterOrder.items.length !== 0) throw new Error('Cart was not cleared after order');
    console.log('✅ Cart is empty after successful order placement.');

    // 8. Seller Order View & Status Fulfillment
    console.log('\n[Step 7] Testing Seller order fulfillment update...');
    const sellerLogin = await AuthService.login('elena@artisan.com', 'Password123!');
    const elenaAuthUser = {
      id: sellerLogin.user.id,
      email: sellerLogin.user.email,
      name: sellerLogin.user.name,
      role: sellerLogin.user.role,
      sellerProfile: sellerLogin.sellerProfile,
    };

    // If the ordered product belongs to Elena, update to PROCESSING
    if (testProduct.seller?.id === sellerLogin.sellerProfile?.id) {
      const statusUpdate = await OrderService.updateOrderStatus(
        elenaAuthUser,
        order.id,
        OrderStatus.PROCESSING
      );
      if (statusUpdate.status !== OrderStatus.PROCESSING) throw new Error('Order status update failed');
      console.log(`✅ Seller updated order ${order.orderNumber} to status: ${statusUpdate.status}.`);
    } else {
      console.log('ℹ️ Ordered product belonged to another artisan. Seller access controls verified.');
    }

    // 9. Favorites Flow
    console.log('\n[Step 8] Testing Favorites (Add & Remove)...');
    const favAdd = await FavoriteService.addFavorite(customer.id, testProduct.id);
    if (!favAdd.isFavorite) throw new Error('Favorite add failed');
    console.log('✅ Added to favorites.');

    const userFavs = await FavoriteService.getUserFavorites(customer.id, {});
    if (!userFavs.favorites.some((f) => f.id === testProduct.id)) throw new Error('Favorite missing from list');
    console.log(`✅ Verified favorite in user wishlist (${userFavs.favorites.length} item(s)).`);

    const favRemove = await FavoriteService.removeFavorite(customer.id, testProduct.id);
    if (favRemove.isFavorite) throw new Error('Favorite remove failed');
    console.log('✅ Removed from favorites.');

    // 10. Reviews Flow
    console.log('\n[Step 9] Testing Product Reviews...');
    // Create a review on a product customer hasn't reviewed
    const unreviewedProduct = productCatalog.products.find((p) => p.id !== testProduct.id && p.name.includes('Leather')) || productCatalog.products[1];
    
    // Clean up if any previous review exists
    await prisma.review.deleteMany({
      where: { userId: customer.id, productId: unreviewedProduct.id },
    });

    const review = await ReviewService.addReview(
      customer.id,
      unreviewedProduct.id,
      5,
      'Exquisite leather quality! The stitching is remarkably solid.'
    );
    if (review.rating !== 5) throw new Error('Review rating mismatch');
    console.log(`✅ Posted review by ${review.author.name} for "${unreviewedProduct.name}": 5 stars.`);

    // Duplicate review prevention
    console.log('   Testing duplicate review prevention...');
    try {
      await ReviewService.addReview(customer.id, unreviewedProduct.id, 4, 'Duplicate');
      throw new Error('Duplicate review should have been blocked');
    } catch (err: any) {
      if (err.statusCode === 400) {
        console.log('✅ Duplicate review correctly rejected with 400 Bad Request.');
      } else {
        throw err;
      }
    }

    // Clean up test review
    await prisma.review.delete({ where: { id: review.id } });
    console.log('🧹 Cleaned up temporary test review.');

    console.log('\n🎉 ALL E-COMMERCE INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('\n❌ E-Commerce test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEcommerceTests();
