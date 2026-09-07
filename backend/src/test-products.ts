import { CategoryService } from './services/categoryService';
import { ProductService } from './services/productService';
import { AuthService } from './services/authService';
import { prisma } from './config/prisma';
import { UserRole } from '@prisma/client';

async function runProductTests() {
  console.log('🧪 Starting Categories & Products API Integration Tests...');

  try {
    // 1. Categories
    console.log('\n[Test 1] Fetching categories with product counts...');
    const categories = await CategoryService.getAllCategories();
    if (categories.length === 0) throw new Error('No categories found');
    console.log(`✅ Found ${categories.length} categories.`);
    console.log(`   First category: "${categories[0].name}" with ${categories[0].productCount} products.`);

    // 2. Product list with pagination
    console.log('\n[Test 2] Fetching paginated products (page: 1, limit: 3)...');
    const page1 = await ProductService.getProducts({ page: 1, limit: 3 });
    if (page1.products.length !== 3) throw new Error(`Expected 3 products, got ${page1.products.length}`);
    if (page1.pagination.total < 3) throw new Error('Total product count lower than page limit');
    console.log(`✅ Retrieved 3 products. Total available: ${page1.pagination.total}. Total pages: ${page1.pagination.totalPages}`);

    // 3. Search products by term
    console.log('\n[Test 3] Searching products by keyword ("Leather")...');
    const searchResult = await ProductService.getProducts({ search: 'Leather' });
    if (searchResult.products.length === 0) throw new Error('Search for "Leather" returned no results');
    console.log(`✅ Search returned ${searchResult.products.length} product(s) matching "Leather".`);

    // 4. Product Details
    const firstProduct = page1.products[0];
    console.log(`\n[Test 4] Fetching single product details for ID: ${firstProduct.id}...`);
    const details = await ProductService.getProductById(firstProduct.id);
    if (!details.seller || !details.category) throw new Error('Product missing seller or category details');
    console.log(`✅ Product "${details.name}" by "${details.seller.shopName}" loaded with rating: ${details.rating} (${details.reviewCount} reviews).`);

    // 5. Seller Login and Product Creation
    console.log('\n[Test 5] Authenticating seller Elena (elena@artisan.com)...');
    const sellerLogin = await AuthService.login('elena@artisan.com', 'Password123!');
    const elenaUser = {
      id: sellerLogin.user.id,
      email: sellerLogin.user.email,
      name: sellerLogin.user.name,
      role: sellerLogin.user.role,
      phone: sellerLogin.user.phone,
      profileImage: sellerLogin.user.profileImage,
      sellerProfile: sellerLogin.sellerProfile,
    };

    console.log('   Creating new artisan product...');
    const createdProduct = await ProductService.createProduct(elenaUser.id, {
      name: 'Elena Special Ceramic Teapot',
      description: 'Hand-thrown teapot with bamboo handle and porcelain strainer.',
      price: 64.5,
      stock: 5,
      categoryId: categories[0].id,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80', isPrimary: true },
      ],
    });
    if (!createdProduct.id) throw new Error('Product creation failed');
    console.log(`✅ Created product "${createdProduct.name}" (ID: ${createdProduct.id})`);

    // 6. Strict Ownership Check: Seller 2 cannot modify Elena's product
    console.log('\n[Test 6] Testing strict seller isolation (Seller 2 modifying Elena\'s product)...');
    const seller2Login = await AuthService.login('tewodros@artisan.com', 'Password123!');
    const tewodrosUser = {
      id: seller2Login.user.id,
      email: seller2Login.user.email,
      name: seller2Login.user.name,
      role: seller2Login.user.role,
      phone: seller2Login.user.phone,
      profileImage: seller2Login.user.profileImage,
      sellerProfile: seller2Login.sellerProfile,
    };

    try {
      await ProductService.updateProduct(tewodrosUser, createdProduct.id, {
        price: 999.0,
      });
      throw new Error('Unauthorized seller modification should have failed');
    } catch (err: any) {
      if (err.statusCode === 403) {
        console.log('✅ Forbidden: Seller 2 was blocked from modifying Elena\'s product with 403 Forbidden.');
      } else {
        throw err;
      }
    }

    // 7. Legitimate update by owner seller
    console.log('\n[Test 7] Updating product stock and price by owner Elena...');
    const updatedProduct = await ProductService.updateProduct(elenaUser, createdProduct.id, {
      price: 59.99,
      stock: 8,
    });
    if (updatedProduct.price !== 59.99 || updatedProduct.stock !== 8) {
      throw new Error('Product update values did not persist');
    }
    console.log(`✅ Updated product price to $${updatedProduct.price} and stock to ${updatedProduct.stock}.`);

    // 8. Delete product by owner seller
    console.log('\n[Test 8] Deleting test product by owner Elena...');
    await ProductService.deleteProduct(elenaUser, createdProduct.id);
    console.log('✅ Product deleted successfully.');

    console.log('\n🎉 ALL CATEGORIES & PRODUCTS API TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('\n❌ Product test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runProductTests();
