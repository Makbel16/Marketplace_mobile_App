import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart, CartItem, Product } from '../types';
import { ApiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  totalItems: number;
  total: number;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      fetchServerCart();
    } else {
      loadLocalCart();
    }
  }, [token]);

  const loadLocalCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('local_cart');
      if (stored) {
        setCart(JSON.parse(stored));
      } else {
        setCart({ id: 'local', userId: 'guest', items: [], totalItems: 0, total: 0 });
      }
    } catch {
      setCart({ id: 'local', userId: 'guest', items: [], totalItems: 0, total: 0 });
    }
  };

  const saveLocalCart = async (newItems: CartItem[]) => {
    const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = parseFloat(
      newItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
    );
    const newCart: Cart = {
      id: 'local',
      userId: 'guest',
      items: newItems,
      totalItems,
      total,
    };
    setCart(newCart);
    await AsyncStorage.setItem('local_cart', JSON.stringify(newCart));
  };

  const fetchServerCart = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<{ success: boolean; data: Cart }>('/cart');
      if (res.data) {
        setCart(res.data);
      }
    } catch {
      // Fallback to local cart if network error
      loadLocalCart();
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (token) {
      setIsLoading(true);
      try {
        const res = await ApiClient.post<{ success: boolean; data: Cart }>('/cart/items', {
          productId: product.id,
          quantity,
        });
        if (res.data) {
          setCart(res.data);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local guest cart
      const currentItems = cart?.items || [];
      const existingIdx = currentItems.findIndex((i) => i.productId === product.id);

      let updatedItems: CartItem[];
      if (existingIdx > -1) {
        updatedItems = currentItems.map((item, idx) => {
          if (idx === existingIdx) {
            const newQty = item.quantity + quantity;
            return {
              ...item,
              quantity: newQty,
              subtotal: parseFloat((item.price * newQty).toFixed(2)),
            };
          }
          return item;
        });
      } else {
        const newItem: CartItem = {
          id: `local-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity,
          subtotal: parseFloat((product.price * quantity).toFixed(2)),
          imageUrl: product.primaryImage || product.images?.[0]?.imageUrl || null,
          seller: product.seller
            ? { id: product.seller.id, shopName: product.seller.shopName }
            : undefined,
        };
        updatedItems = [...currentItems, newItem];
      }

      await saveLocalCart(updatedItems);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (token) {
      setIsLoading(true);
      try {
        const res = await ApiClient.put<{ success: boolean; data: Cart }>(
          `/cart/items/${cartItemId}`,
          { quantity }
        );
        if (res.data) {
          setCart(res.data);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      const currentItems = cart?.items || [];
      let updatedItems: CartItem[];
      if (quantity <= 0) {
        updatedItems = currentItems.filter((i) => i.id !== cartItemId);
      } else {
        updatedItems = currentItems.map((item) => {
          if (item.id === cartItemId) {
            return {
              ...item,
              quantity,
              subtotal: parseFloat((item.price * quantity).toFixed(2)),
            };
          }
          return item;
        });
      }
      await saveLocalCart(updatedItems);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (token) {
      setIsLoading(true);
      try {
        const res = await ApiClient.delete<{ success: boolean; data: Cart }>(
          `/cart/items/${cartItemId}`
        );
        if (res.data) {
          setCart(res.data);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      const currentItems = cart?.items || [];
      const updated = currentItems.filter((i) => i.id !== cartItemId);
      await saveLocalCart(updated);
    }
  };

  const clearCart = async () => {
    if (token) {
      try {
        const res = await ApiClient.delete<{ success: boolean; data: Cart }>('/cart');
        if (res.data) {
          setCart(res.data);
        }
      } catch {
        // Fallback
      }
    }
    setCart({ id: 'local', userId: user?.id || 'guest', items: [], totalItems: 0, total: 0 });
    await AsyncStorage.removeItem('local_cart');
  };

  const totalItems = cart?.totalItems ?? cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const total = cart?.total ?? cart?.items?.reduce((sum, i) => sum + i.subtotal, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        total,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchServerCart,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
