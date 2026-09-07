import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { ApiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: any[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      fetchServerFavorites();
    } else {
      loadLocalFavorites();
    }
  }, [token]);

  const loadLocalFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('local_favorites');
      if (stored) {
        const items = JSON.parse(stored);
        setFavorites(items);
        setFavoriteIds(new Set(items.map((i: any) => i.id)));
      }
    } catch {
      // Ignored
    }
  };

  const fetchServerFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<{ success: boolean; data: any[] }>('/favorites');
      if (res.data) {
        setFavorites(res.data);
        setFavoriteIds(new Set(res.data.map((i) => i.id)));
      }
    } catch {
      loadLocalFavorites();
    } finally {
      setIsLoading(false);
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favoriteIds.has(productId);
  };

  const toggleFavorite = async (product: Product) => {
    const currentlyFav = favoriteIds.has(product.id);
    const newIds = new Set(favoriteIds);

    if (currentlyFav) {
      newIds.delete(product.id);
      setFavoriteIds(newIds);
      setFavorites(favorites.filter((f) => f.id !== product.id));

      if (token) {
        try {
          await ApiClient.delete(`/favorites/${product.id}`);
        } catch {
          // Revert on error
          newIds.add(product.id);
          setFavoriteIds(new Set(newIds));
        }
      } else {
        await AsyncStorage.setItem(
          'local_favorites',
          JSON.stringify(favorites.filter((f) => f.id !== product.id))
        );
      }
    } else {
      newIds.add(product.id);
      setFavoriteIds(newIds);
      const newFavItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.primaryImage || product.images?.[0]?.imageUrl || null,
        category: product.category,
        seller: product.seller,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
      };
      const updatedList = [newFavItem, ...favorites];
      setFavorites(updatedList);

      if (token) {
        try {
          await ApiClient.post(`/favorites/${product.id}`);
        } catch {
          // Revert on error
          newIds.delete(product.id);
          setFavoriteIds(new Set(newIds));
        }
      } else {
        await AsyncStorage.setItem('local_favorites', JSON.stringify(updatedList));
      }
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites: fetchServerFavorites,
      }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
