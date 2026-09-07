import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { SearchBar } from '../../components/marketplace/SearchBar';
import { CategoryCard } from '../../components/marketplace/CategoryCard';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { ArtisanCard } from '../../components/marketplace/ArtisanCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Product, Category } from '../../types';
import { ApiClient } from '../../services/apiClient';

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    setError(null);

    try {
      // Fetch categories
      const catRes = await ApiClient.get<{ success: boolean; data: Category[] }>('/categories');
      if (catRes.data) {
        setCategories(catRes.data);
      }

      // Fetch products with search and category filters
      const params: Record<string, any> = { limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      const prodRes = await ApiClient.get<{ success: boolean; data: Product[] }>('/products', params);
      if (prodRes.data) {
        setProducts(prodRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace products');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 350);
    return () => clearTimeout(debounceTimer);
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleCategoryPress = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categorySlug);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ArtisanColors.background} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ArtisanColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Marketplace Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>ARTISAN MARKETPLACE</Text>
            <Text style={styles.tagline}>
              Discover unique handmade products from local artisans.
            </Text>
          </View>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onSubmit={() => loadData()}
            onClear={() => setSearch('')}
          />
        </View>

        {/* Featured Categories Carousel */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Categories</Text>
              {selectedCategory && (
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.clearFilterText}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.allPill,
                  !selectedCategory && styles.allPillActive,
                ]}>
                <Text
                  style={[
                    styles.allPillText,
                    !selectedCategory && styles.allPillTextActive,
                  ]}>
                  All
                </Text>
              </TouchableOpacity>

              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategory === cat.slug}
                  onPress={() => handleCategoryPress(cat.slug)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content States */}
        {isLoading && !isRefreshing ? (
          <LoadingState message="Discovering handmade crafts..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadData()} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No Products Found"
            message={
              search
                ? `No handcrafted items matched "${search}". Try another keyword or clear filters.`
                : 'No products are currently available in this category.'
            }
            actionTitle="Reset Filters"
            onAction={() => {
              setSearch('');
              setSelectedCategory(null);
            }}
          />
        ) : (
          <>
            {/* Products Grid Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory
                    ? `${categories.find((c) => c.slug === selectedCategory)?.name || 'Filtered'} Creations`
                    : search
                    ? `Results for "${search}"`
                    : 'Artisan Creations'}
                </Text>
                <Text style={styles.resultsCount}>
                  {products.length} item{products.length === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.productsGrid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  />
                ))}
              </View>
            </View>

            {/* Featured Artisans Highlight Section */}
            {!selectedCategory && !search && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Artisans</Text>
                </View>

                <ArtisanCard
                  shopName="Elena Clay Studio"
                  location="Portland, OR"
                  description="Hand-thrown stoneware and pottery crafted with natural, lead-free glazes."
                  profileImage="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=400&q=80"
                  onPress={() => {
                    setSearch('Elena');
                  }}
                />

                <ArtisanCard
                  shopName="Heritage Leather & Textiles"
                  location="Addis Ababa / Global Collective"
                  description="Authentic handmade full-grain leather bags and woven traditional cotton textiles."
                  profileImage="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
                  onPress={() => {
                    setSearch('Heritage');
                  }}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ArtisanColors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: ArtisanColors.primary,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: ArtisanColors.primary,
  },
  resultsCount: {
    fontSize: 13,
    color: ArtisanColors.textMuted,
  },
  categoriesScroll: {
    paddingBottom: 4,
  },
  allPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ArtisanColors.border,
    marginRight: 10,
    justifyContent: 'center',
  },
  allPillActive: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  allPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  allPillTextActive: {
    color: '#FFFFFF',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
