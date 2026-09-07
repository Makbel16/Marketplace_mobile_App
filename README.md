# Artisan Marketplace 🏺✨

> A production-ready mobile e-commerce platform built for local artisans, potters, weavers, and craftspeople to showcase and sell handmade products directly to customers.

---

## 📱 Features

### Customer Experience
- **Discover & Search**: Multi-faceted search across craft titles, descriptions, and artisan studios with live debounce.
- **Category Browsing**: Explore traditional crafts, handwoven clothing, jewelry, leather bags, handmade shoes, and home decor.
- **Product Details & Gallery**: High-resolution image galleries, artisan workshop details, stock indicators, and customer reviews.
- **Wishlist / Favorites**: Save products locally or across sessions with instant optimistic feedback.
- **Smart Cart**: Real-time stock validation, server-computed subtotals, and persistent guest/offline cart.
- **Cash-on-Delivery Checkout**: Simple address checkout with order summary and instant confirmation.
- **Live Order Tracking**: Visual 5-step fulfillment status tracker (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`).
- **Ratings & Reviews**: 1–5 star reviews with comments and single-review-per-product integrity.

### Artisan / Seller Studio
- **Shop Onboarding**: Register an artisan shop with studio name, location, and craft bio.
- **Studio Dashboard**: Real-time shop metrics (active inventory, low stock alerts, incoming customer orders).
- **Product Management**: Add new handcrafted items with category selection, stock, pricing, and images.
- **Order Fulfillment**: Track customer purchases and update fulfillment status directly from the mobile app.
- **Strict Ownership Isolation**: Sellers can only manage, edit, or delete their own handcrafted products.

---

## 🏗️ Architecture & Technology Stack

```
                     ┌───────────────────────────┐
                     │     Physical Android      │
                     │   React Native (Expo 57)  │
                     └─────────────┬─────────────┘
                                   │ HTTPS / LAN IP
                                   ▼
                     ┌───────────────────────────┐
                     │   Node.js + Express API   │
                     │    TypeScript + Helmet    │
                     └──────┬─────────────┬──────┘
                            │             │
                    Prisma  │             │ Cloudinary SDK
                            ▼             ▼
                     ┌────────────┐ ┌────────────┐
                     │    Neon    │ │ Cloudinary │
                     │ PostgreSQL │ │   Media    │
                     └────────────┘ └────────────┘
```

- **Mobile App**: React Native (`0.86.3`), Expo (`~57.0.20`), Expo Router (`~57.0.19`), TypeScript, Safe Area Context, Vector Icons, Expo Image, AsyncStorage.
- **Backend API**: Node.js, Express (`4.21`), TypeScript, Prisma ORM (`5.20`), Helmet, CORS, Morgan, Express-Validator, Express-Rate-Limit.
- **Database**: Neon Serverless PostgreSQL.
- **Authentication**: JWT access tokens, bcryptjs password hashing, role-based authorization (`CUSTOMER`, `SELLER`, `ADMIN`).
- **Media Storage**: Multer memory streaming to Cloudinary.

---

## 📁 Repository Structure

```
artisan-marketplace/
├── assets/                       # App icons, splash screens, adaptive icons
├── backend/                      # Express + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma         # Relational database schema
│   │   ├── migrations/           # Versioned Prisma migrations
│   │   └── seed.ts               # Database seeder (categories, products, reviews)
│   ├── src/
│   │   ├── config/               # DB, Cloudinary, Environment variables
│   │   ├── controllers/          # Auth, Products, Categories, Cart, Orders, Reviews
│   │   ├── middleware/           # Auth, Roles, Rate Limiter, Error Handler, Upload
│   │   ├── routes/               # Express REST routes
│   │   ├── services/             # Business logic & DB transactions
│   │   ├── utils/                # API responses, JWT utilities
│   │   ├── validators/           # Express-validator schemas
│   │   ├── app.ts                # Express app configuration
│   │   └── server.ts             # Server entry point (0.0.0.0 binding)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── src/                          # Expo Mobile Application
│   ├── app/                      # Expo Router screens
│   │   ├── (tabs)/               # Bottom tab navigation
│   │   │   ├── index.tsx         # Home screen
│   │   │   ├── categories.tsx    # Category explorer
│   │   │   ├── favorites.tsx     # Wishlist
│   │   │   ├── cart.tsx          # Shopping cart
│   │   │   ├── profile.tsx       # User profile & settings
│   │   │   └── _layout.tsx       # Tab bar configuration
│   │   ├── (auth)/               # Authentication flow
│   │   │   ├── login.tsx         # Sign in
│   │   │   └── register.tsx      # Customer & Seller registration
│   │   ├── product/[id].tsx      # Product details & reviews
│   │   ├── checkout/index.tsx    # Address input & order placement
│   │   ├── orders/               # Customer order history & tracking
│   │   ├── seller/               # Artisan studio dashboard & management
│   │   └── _layout.tsx           # Root navigation stack & providers
│   ├── components/               # Reusable UI & marketplace components
│   ├── constants/                # Colors, API configuration, spacing
│   ├── context/                  # AuthContext, CartContext, FavoritesContext
│   ├── services/                 # Centralized API client
│   └── types/                    # TypeScript interfaces
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm
- Expo Go app on your physical Android device

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` based on `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="YOUR_NEON_DATABASE_URL"
JWT_SECRET="artisan_dev_secret_key_change_in_production_min32chars"
JWT_EXPIRES_IN="7d"
CLIENT_URL="*"
CLOUDINARY_CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME"
CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY"
CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET"
```

Apply database migrations and seed sample data:
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

Start the backend server:
```bash
npm run dev
# Or production build:
npm run build
npm start
```
Verify the health endpoint: `http://localhost:5000/api/health`

### 3. Mobile App Setup
From the repository root:
```bash
npm install
npx expo start
```
Scan the QR code with your Android phone using the **Expo Go** app. The mobile client automatically detects your computer's local network IP to communicate with the backend.

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
cd backend

# Test Authentication & Role Authorization
npx ts-node src/test-auth.ts

# Test Categories, Product Search, and Seller Ownership Isolation
npx ts-node src/test-products.ts

# Test Full E-Commerce Flow (Cart, Atomic Order Checkout, Stock Decrement, Reviews)
npx ts-node src/test-ecommerce.ts
```

### TypeScript Validation
```bash
# Mobile type check
npx tsc --noEmit

# Backend build check
cd backend && npm run build
```

---

## 🚢 Deployment

### 1. Neon PostgreSQL
1. Create a project at [neon.tech](https://neon.tech).
2. Copy the pooled connection string into `DATABASE_URL`.

### 2. Render Backend
1. Connect your repository to Render as a **Web Service**.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install && npx prisma generate && npm run build`
4. **Start Command**: `npm start`
5. Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=10000`).

### 3. Mobile Production Build (EAS)
Configure production API endpoint:
```env
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```
Build Android APK for direct device distribution:
```bash
npx eas build -p android --profile preview
```

---

## 🔒 Security Practices
- Passwords hashed using `bcryptjs` with salt rounds.
- JWT tokens signed with server secret and expiration.
- Price calculations and stock decrements are strictly computed on the backend inside database transactions.
- Express-rate-limit protects login and registration against brute-force attacks.
- Helmet security headers and CORS whitelisting enabled.
- All `.env` files and secrets are ignored in `.gitignore`.
