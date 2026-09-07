import React, { useState, useEffect } from 'react';
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
import { CategoryCard } from '../../components/marketplace/CategoryCard';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Category, Product } from '../../types';
import { ApiClient } from '../../services/apiClient';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory.slug);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.get<{ success: boolean; data: Category[] }>('/categories');
      if (res.data) {
        setCategories(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadProducts = async (slug: string) => {
    setIsProductsLoading(true);
    try {
      const res = await ApiClient.get<{ success: boolean; data: Product[] }>('/products', {
        category: slug,
        limit: 20,
      });
      if (res.data) {
        setProducts(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsProductsLoading(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCategories();
    if (selectedCategory) {
      loadProducts(selectedCategory.slug);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Loading craft categories..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={loadCategories} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ArtisanColors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Craft Categories</Text>
        <Text style={styles.subtitle}>
          Browse by handmade discipline and cultural heritage
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ArtisanColors.primary]}
          />
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            variant="grid"
            isSelected={selectedCategory?.id === item.id}
            onPress={() => setSelectedCategory(selectedCategory?.id === item.id ? null : item)}
          />
        )}
        ListFooterComponent={
          selectedCategory ? (
            <View style={styles.categoryProductsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory.name} ({products.length})
                </Text>
              </View>

              {isProductsLoading ? (
                <LoadingState message={`Fetching ${selectedCategory.name}...`} size="small" />
              ) : products.length === 0 ? (
                <EmptyState
                  icon="cube-outline"
                  title="No Items Yet"
                  message={`No products have been added to ${selectedCategory.name} yet.`}
                />
              ) : (
                <View style={styles.productsGrid}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null
        }
      />
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
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  categoryProductsSection: {
    marginTop: 24,
    paddingHorizontal: 6,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
