import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after initialization
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FAF7F2' },
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
              <Stack.Screen name="orders/index" options={{ headerShown: false }} />
              <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
              <Stack.Screen name="seller/dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="seller/add-product" options={{ headerShown: false }} />
              <Stack.Screen name="seller/orders" options={{ headerShown: false }} />
            </Stack>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

