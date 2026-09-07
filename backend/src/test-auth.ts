import { AuthService } from './services/authService';
import { prisma } from './config/prisma';
import { verifyToken } from './utils/token';
import { UserRole } from '@prisma/client';

async function runAuthTests() {
  console.log('🧪 Starting Authentication Unit & Integration Tests...');

  try {
    // Test 1: Seeded user login
    console.log('\n[Test 1] Logging in seeded customer (customer@artisan.com)...');
    const loginResult = await AuthService.login('customer@artisan.com', 'Password123!');
    if (!loginResult.token) throw new Error('Token was not generated');
    if (loginResult.user.role !== UserRole.CUSTOMER) throw new Error('Incorrect role returned');
    console.log('✅ Customer login succeeded. Token generated.');

    // Test 2: Verify Token payload
    console.log('\n[Test 2] Verifying token payload integrity...');
    const decoded = verifyToken(loginResult.token);
    if (decoded.userId !== loginResult.user.id) throw new Error('Decoded user ID mismatch');
    if (decoded.role !== UserRole.CUSTOMER) throw new Error('Decoded role mismatch');
    console.log('✅ Token decoded successfully and matched user data.');

    // Test 3: Get current user profile
    console.log('\n[Test 3] Fetching profile for authenticated user...');
    const profile = await AuthService.getMe(loginResult.user.id);
    if (profile.email !== 'customer@artisan.com') throw new Error('Incorrect profile email');
    console.log('✅ Profile retrieved successfully.');

    // Test 4: Seller login and shop profile
    console.log('\n[Test 4] Logging in seeded seller (elena@artisan.com)...');
    const sellerLogin = await AuthService.login('elena@artisan.com', 'Password123!');
    if (sellerLogin.user.role !== UserRole.SELLER) throw new Error('User is not SELLER');
    const sellerShop = await AuthService.getSellerProfile(sellerLogin.user.id);
    if (sellerShop.shopName !== 'Elena Clay Studio') throw new Error('Incorrect shop profile');
    console.log(`✅ Seller login succeeded. Shop: "${sellerShop.shopName}" retrieved.`);

    // Test 5: Registering a new customer
    const testEmail = `test_customer_${Date.now()}@example.com`;
    console.log(`\n[Test 5] Registering new customer (${testEmail})...`);
    const regResult = await AuthService.register({
      name: 'Test Customer',
      email: testEmail,
      password: 'SecurePassword123!',
      phone: '+15551234567',
      role: UserRole.CUSTOMER,
    });
    if (!regResult.token) throw new Error('Token not returned on registration');
    console.log('✅ New customer registered and token generated.');

    // Test 6: Reject duplicate email registration
    console.log('\n[Test 6] Testing duplicate email rejection...');
    try {
      await AuthService.register({
        name: 'Duplicate Test',
        email: testEmail,
        password: 'SecurePassword123!',
      });
      throw new Error('Duplicate registration should have failed');
    } catch (err: any) {
      if (err.statusCode === 409) {
        console.log('✅ Duplicate email correctly rejected with 409 Conflict.');
      } else {
        throw err;
      }
    }

    // Clean up test customer
    await prisma.cart.deleteMany({ where: { userId: regResult.user.id } });
    await prisma.user.delete({ where: { id: regResult.user.id } });
    console.log('🧹 Cleaned up temporary test user.');

    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('\n❌ Auth test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthTests();
