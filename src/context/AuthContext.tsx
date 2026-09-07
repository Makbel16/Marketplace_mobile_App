import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SellerProfile, UserRole } from '../types';
import { ApiClient } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    shopName?: string;
    description?: string;
    location?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateSellerProfile: (data: Partial<SellerProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token with backend
        try {
          const res = await ApiClient.get<{ success: boolean; data: User }>('/auth/me');
          if (res.data) {
            setUser(res.data);
            await AsyncStorage.setItem('auth_user', JSON.stringify(res.data));
          }
        } catch {
          // Keep stored user if offline
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.post<{
        success: boolean;
        data: { user: User; token: string; sellerProfile?: SellerProfile };
      }>('/auth/login', { email, password });

      const loggedUser = {
        ...res.data.user,
        sellerProfile: res.data.sellerProfile || res.data.user.sellerProfile,
      };

      setToken(res.data.token);
      setUser(loggedUser);

      await AsyncStorage.setItem('auth_token', res.data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(loggedUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.post<{
        success: boolean;
        data: { user: User; token: string; sellerProfile?: SellerProfile };
      }>('/auth/register', data);

      const registeredUser = {
        ...res.data.user,
        sellerProfile: res.data.sellerProfile,
      };

      setToken(res.data.token);
      setUser(registeredUser);

      await AsyncStorage.setItem('auth_token', res.data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(registeredUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await ApiClient.get<{ success: boolean; data: User }>('/auth/me');
      if (res.data) {
        setUser(res.data);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.data));
      }
    } catch {
      // Ignored if offline
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await ApiClient.put<{ success: boolean; data: User }>('/auth/profile', data);
    if (res.data) {
      const updated = { ...user, ...res.data };
      setUser(updated as User);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const updateSellerProfile = async (data: Partial<SellerProfile>) => {
    const res = await ApiClient.put<{ success: boolean; data: SellerProfile }>(
      '/auth/seller-profile',
      data
    );
    if (res.data && user) {
      const updated = { ...user, sellerProfile: res.data };
      setUser(updated);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const isSeller = user?.role === 'SELLER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isSeller,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        updateSellerProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
