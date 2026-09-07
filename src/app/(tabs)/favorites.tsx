import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArtisanColors } from '../../constants/colors';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useFavorites } from '../../context/FavoritesContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, isLoading, refreshFavorites } = useFavorites();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ArtisanColors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Your Wishlist</Text>
        <Text style={styles.subtitle}>
          Handmade treasures you&apos;ve saved for later ({favorites.length})
        </Text>
      </View>

      {isLoading && favorites.length === 0 ? (
        <LoadingState message="Loading your saved treasures..." />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your Wishlist is Empty"
          message="Explore unique pottery, woven clothing, and handcrafted jewelry, then tap the heart icon to save them here."
          actionTitle="Explore Marketplace"
          onAction={() => router.push('/(tabs)' as any)}
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshFavorites}
              colors={[ArtisanColors.primary]}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}` as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ArtisanColors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  subtitle: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
