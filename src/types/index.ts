export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type SellerStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED';
export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT' | 'ARCHIVED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  profileImage?: string | null;
  createdAt?: string;
  sellerProfile?: SellerProfile | null;
}

export interface SellerProfile {
  id: string;
  shopName: string;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
  status?: SellerStatus;
  createdAt?: string;
  _count?: {
    products?: number;
    orderItems?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
}

export interface ProductImage {
  id?: string;
  imageUrl: string;
  publicId?: string | null;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  primaryImage?: string | null;
  images?: ProductImage[];
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  seller?: {
    id: string;
    shopName: string;
    location?: string | null;
    profileImage?: string | null;
  };
  rating?: number;
  reviewCount?: number;
  isFavorite?: boolean;
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string | null;
  seller?: {
    id: string;
    shopName: string;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  total: number;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string | null;
  sellerShop?: string;
  seller?: {
    id: string;
    shopName: string;
    phone?: string | null;
    location?: string | null;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  phone: string;
  notes?: string | null;
  totalItems?: number;
  items: OrderItem[];
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment?: string | null;
  author: {
    id: string;
    name: string;
    profileImage?: string | null;
  };
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
