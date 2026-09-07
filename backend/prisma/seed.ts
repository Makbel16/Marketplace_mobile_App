import { PrismaClient, UserRole, SellerStatus, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing tables in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@artisan.com',
      phone: '+1234567890',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const seller1User = await prisma.user.create({
    data: {
      name: 'Elena Vance',
      email: 'elena@artisan.com',
      phone: '+1234567891',
      passwordHash: defaultPasswordHash,
      role: UserRole.SELLER,
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    },
  });

  const seller2User = await prisma.user.create({
    data: {
      name: 'Tewodros Kassahun',
      email: 'tewodros@artisan.com',
      phone: '+1234567892',
      passwordHash: defaultPasswordHash,
      role: UserRole.SELLER,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'customer@artisan.com',
      phone: '+1234567893',
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
  });

  // 3. Create Seller Profiles
  const shop1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1User.id,
      shopName: 'Elena Clay Studio',
      description: 'Hand-thrown stoneware and earthenware ceramics crafted with sustainable natural glazes.',
      location: 'Portland, OR',
      phone: '+1234567891',
      profileImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=400&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
      status: SellerStatus.APPROVED,
    },
  });

  const shop2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2User.id,
      shopName: 'Heritage Leather & Textiles',
      description: 'Authentic handmade full-grain leather goods and woven cultural textiles.',
      location: 'Addis Ababa / Global Artisan Collective',
      phone: '+1234567892',
      profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      status: SellerStatus.APPROVED,
    },
  });

  // 4. Create Categories
  const categoriesData = [
    {
      name: 'Traditional Crafts',
      slug: 'traditional-crafts',
      description: 'Authentic hand-carved, sculpted, and artisanal heritage crafts.',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Handmade Clothing',
      slug: 'handmade-clothing',
      description: 'Ethically made garments, hand-loomed fabrics, and embroidery.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Jewelry & Accessories',
      slug: 'jewelry-accessories',
      description: 'Handcrafted rings, brass necklaces, beaded pieces, and earrings.',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Leather Bags',
      slug: 'leather-bags',
      description: 'Durable vegetable-tanned leather totes, backpacks, and messenger bags.',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Handmade Shoes',
      slug: 'handmade-shoes',
      description: 'Custom stitched leather boots, loafers, and artisanal sandals.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Home & Living Decor',
      slug: 'home-living-decor',
      description: 'Pottery, woven wall tapestries, hand-poured candles, and woodcraft.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) => prisma.category.create({ data: cat }))
  );

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  // 5. Create Products
  const products = [
    {
      sellerId: shop1.id,
      categoryId: catMap.get('home-living-decor')!,
      name: 'Rustic Terracotta Vase',
      description: 'Hand-thrown vase with natural textured finish. Perfect for dried florals or decorative centerpieces.',
      price: 48.0,
      stock: 12,
      status: ProductStatus.ACTIVE,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    {
      sellerId: shop1.id,
      categoryId: catMap.get('home-living-decor')!,
      name: 'Handcrafted Ceramic Coffee Mug',
      description: 'Comfortable ergonomic handle with glazed rim. Dishwasher and microwave safe. Holds 350ml.',
      price: 28.5,
      stock: 25,
      status: ProductStatus.ACTIVE,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', isPrimary: true },
      ],
    },
    {
      sellerId: shop2.id,
      categoryId: catMap.get('leather-bags')!,
      name: 'Vintage Full-Grain Leather Tote',
      description: 'Hand-stitched full-grain leather tote with interior canvas organizer and brass hardware. Ages beautifully.',
      price: 135.0,
      stock: 8,
      status: ProductStatus.ACTIVE,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', isPrimary: true },
      ],
    },
    {
      sellerId: shop2.id,
      categoryId: catMap.get('jewelry-accessories')!,
      name: 'Artisan Hammered Brass Cuff',
      description: 'Individually forged brass bracelet with polished edge. Adjustable fit for all wrist sizes.',
      price: 34.0,
      stock: 18,
      status: ProductStatus.ACTIVE,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1611591475879-15892e622b3f?auto=format&fit=crop&w=800&q=80', isPrimary: true },
      ],
    },
    {
      sellerId: shop2.id,
      categoryId: catMap.get('handmade-clothing')!,
      name: 'Handwoven Cotton Shawl',
      description: 'Ethically loomed from 100% organic cotton featuring traditional Ethiopian geometric embroidery border.',
      price: 65.0,
      stock: 15,
      status: ProductStatus.ACTIVE,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80', isPrimary: true },
      ],
    },
    {
      sellerId: shop2.id,
      categoryId: catMap.get('traditional-crafts')!,
      name: 'Carved Olive Wood Serving Bowl',
      description: 'Sculpted from sustainably harvested wild olive wood. Finished with food-safe organic oil.',
      price: 52.0,
      stock: 10,
      status: ProductStatus.ACTIVE,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1584282479901-52cf66217438?auto=format&fit=crop&w=800&q=80', isPrimary: true },
      ],
    },
  ];

  for (const prod of products) {
    const { images, ...prodData } = prod;
    const createdProduct = await prisma.product.create({
      data: prodData,
    });

    for (const img of images) {
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
        },
      });
    }

    // Add initial review for the rustic vase
    if (prod.name === 'Rustic Terracotta Vase') {
      await prisma.review.create({
        data: {
          userId: customerUser.id,
          productId: createdProduct.id,
          rating: 5,
          comment: 'Absolutely stunning craftsmanship! It feels so earthy and grounded in our living room.',
        },
      });

      // Add to customer favorites
      await prisma.favorite.create({
        data: {
          userId: customerUser.id,
          productId: createdProduct.id,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log(`- Admin: admin@artisan.com (Password: Password123!)`);
  console.log(`- Sellers: elena@artisan.com, tewodros@artisan.com (Password: Password123!)`);
  console.log(`- Customer: customer@artisan.com (Password: Password123!)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
