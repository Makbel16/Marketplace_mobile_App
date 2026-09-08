import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { ArtisanLogo } from '../../components/ui';
import { SearchBar } from '../../components/marketplace/SearchBar';
import { CategoryCard } from '../../components/marketplace/CategoryCard';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { ArtisanCard } from '../../components/marketplace/ArtisanCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Product, Category } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

export default function HomeScreen() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
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

      // Fetch products with search, category, and sort parameters
      const params: Record<string, any> = { limit: 30 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      if (sortBy === 'price_asc') {
        params.sortBy = 'price';
        params.sortOrder = 'asc';
      } else if (sortBy === 'price_desc') {
        params.sortBy = 'price';
        params.sortOrder = 'desc';
      } else if (sortBy === 'rating') {
        params.sortBy = 'rating';
        params.sortOrder = 'desc';
      } else {
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
      }

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
  }, [search, selectedCategory, sortBy]);

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
        
        {/* ============================================================ */}
        {/* LUXURY ARTISAN BRAND HEADER                                  */}
        {/* ============================================================ */}
        <View style={styles.headerContainer}>
          <View style={styles.topBar}>
            {/* Authentic Artisan Maker's Guild Logo */}
            <ArtisanLogo style={styles.logoFlex} />

            {/* Boutique Quick Action Buttons (Wishlist & Cart) */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/favorites' as any)}>
                <Ionicons
                  name={favorites.length > 0 ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favorites.length > 0 ? ArtisanColors.primary : ArtisanColors.text}
                />
                {favorites.length > 0 && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>
                      {favorites.length > 99 ? '99+' : favorites.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cartButton]}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/cart' as any)}>
                <Ionicons
                  name={totalItems > 0 ? 'bag-handle' : 'bag-handle-outline'}
                  size={20}
                  color={totalItems > 0 ? ArtisanColors.primary : ArtisanColors.text}
                />
                {totalItems > 0 && (
                  <View style={[styles.actionBadge, styles.cartBadge]}>
                    <Text style={styles.actionBadgeText}>
                      {totalItems > 99 ? '99+' : totalItems}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* SEARCH BAR SECTION                                           */}
        {/* ============================================================ */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onSubmit={() => loadData()}
            onClear={() => setSearch('')}
          />
        </View>

        {/* ============================================================ */}
        {/* EDITORIAL HERO STORY BANNER                                   */}
        {/* ============================================================ */}
        {!search && !selectedCategory && (
          <View style={styles.heroBanner}>
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Ionicons name="ribbon-outline" size={12} color={ArtisanColors.gold} />
                <Text style={styles.heroBadgeText}>HANDMADE HERITAGE</Text>
              </View>

              <Text style={styles.heroHeading}>
                Masterpieces with Soul, Direct from the Maker.
              </Text>

              <Text style={styles.heroSubheading}>
                Every purchase sustains master potters, weavers, and leatherworkers worldwide.
              </Text>

              {/* Trust Badges - Clean Vector Icons */}
              <View style={styles.heroTrustRow}>
                <View style={styles.trustChip}>
                  <Ionicons name="hammer-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.trustChipText}>100% Handcrafted</Text>
                </View>
                <View style={styles.trustChip}>
                  <Ionicons name="leaf-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.trustChipText}>Eco-Conscious</Text>
                </View>
                <View style={styles.trustChip}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.trustChipText}>Fair Trade Verified</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* CRAFT CATEGORIES CAROUSEL                                    */}
        {/* ============================================================ */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="color-palette-outline" size={18} color={ArtisanColors.primary} />
                <Text style={styles.sectionTitle}>Explore by Craft</Text>
              </View>

              {selectedCategory ? (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(null)}
                  style={styles.clearFilterBtn}>
                  <Text style={styles.clearFilterText}>Reset Filter</Text>
                  <Ionicons name="close-circle" size={14} color={ArtisanColors.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push('/(tabs)/categories' as any)}>
                  <Text style={styles.viewAllText}>View All ({categories.length}) →</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.allPill,
                  !selectedCategory && styles.allPillActive,
                ]}>
                <Ionicons
                  name="apps-outline"
                  size={15}
                  color={!selectedCategory ? '#FFFFFF' : ArtisanColors.text}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.allPillText,
                    !selectedCategory && styles.allPillTextActive,
                  ]}>
                  All Crafts
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

        {/* ============================================================ */}
        {/* CONTENT STATES (LOADING / ERROR / EMPTY / PRODUCTS)          */}
        {/* ============================================================ */}
        {isLoading && !isRefreshing ? (
          <LoadingState message="Discovering authentic artisan crafts..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadData()} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No Creations Found"
            message={
              search
                ? `No handcrafted items matched "${search}". Try searching for pottery, leather, jewelry, or textiles.`
                : 'No products are currently listed under this category.'
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
                <View>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="cube-outline" size={17} color={ArtisanColors.primary} />
                    <Text style={styles.sectionTitle}>
                      {selectedCategory
                        ? `${categories.find((c) => c.slug === selectedCategory)?.name || 'Craft'} Vault`
                        : search
                        ? `Matches for "${search}"`
                        : 'Artisan Creations'}
                    </Text>
                  </View>
                  <Text style={styles.resultsCount}>
                    {products.length} unique handmade item{products.length === 1 ? '' : 's'}
                  </Text>
                </View>

                {/* Sort Chips */}
                <View style={styles.sortChipsRow}>
                  <TouchableOpacity
                    onPress={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
                    style={[
                      styles.sortChip,
                      (sortBy === 'price_asc' || sortBy === 'price_desc') && styles.sortChipActive,
                    ]}>
                    <Ionicons
                      name={sortBy === 'price_desc' ? 'arrow-down' : 'arrow-up'}
                      size={12}
                      color={
                        sortBy === 'price_asc' || sortBy === 'price_desc'
                          ? '#FFFFFF'
                          : ArtisanColors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.sortChipText,
                        (sortBy === 'price_asc' || sortBy === 'price_desc') && styles.sortChipTextActive,
                      ]}>
                      Price
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortBy(sortBy === 'rating' ? 'newest' : 'rating')}
                    style={[
                      styles.sortChip,
                      sortBy === 'rating' && styles.sortChipActive,
                    ]}>
                    <Ionicons
                      name="star"
                      size={11}
                      color={sortBy === 'rating' ? '#FFFFFF' : ArtisanColors.star}
                    />
                    <Text
                      style={[
                        styles.sortChipText,
                        sortBy === 'rating' && styles.sortChipTextActive,
                      ]}>
                      Top Rated
                    </Text>
                  </TouchableOpacity>
                </View>
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
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="people-outline" size={18} color={ArtisanColors.primary} />
                    <Text style={styles.sectionTitle}>Featured Guild Artisans</Text>
                  </View>
                </View>

                <ArtisanCard
                  shopName="Elena Clay Studio"
                  location="Portland, OR • Master Potter"
                  description="Hand-thrown stoneware, textured vases, and porcelain tableware with natural mineral glazes."
                  profileImage="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=400&q=80"
                  onPress={() => {
                    setSearch('Elena');
                  }}
                />

                <ArtisanCard
                  shopName="Heritage Leather & Textiles"
                  location="Addis Ababa • Guild Collective"
                  description="Authentic vegetable-tanned leather goods, messenger bags, and heritage handwoven cotton."
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
    paddingBottom: 32,
  },

  /* Header Styles */
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoFlex: {
    flex: 1,
    marginRight: 10,
  },

  /* Action Buttons (Wishlist & Cart) */
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ArtisanColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    position: 'relative',
  },
  cartButton: {
    backgroundColor: '#FFFFFF',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ArtisanColors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadge: {
    backgroundColor: ArtisanColors.primary,
  },
  actionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  /* Search Section */
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },

  /* Hero Banner */
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 20,
    backgroundColor: ArtisanColors.darkCard,
    padding: 18,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 154, 69, 0.25)',
  },
  heroContent: {},
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 154, 69, 0.18)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(197, 154, 69, 0.35)',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ArtisanColors.gold,
    letterSpacing: 1.2,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  heroSubheading: {
    fontSize: 12.5,
    color: '#D4CDC5',
    lineHeight: 18,
    marginBottom: 14,
  },
  heroTrustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
  },
  trustChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Section Styles */
  section: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
    letterSpacing: 0.2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: ArtisanColors.primary,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: ArtisanColors.primary,
  },
  resultsCount: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 2,
    marginLeft: 23,
  },
  sortChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ArtisanColors.border,
    gap: 4,
  },
  sortChipActive: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  sortChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: ArtisanColors.textSecondary,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },

  /* Categories Scroll */
  categoriesScroll: {
    paddingBottom: 4,
  },
  allPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ArtisanColors.border,
    marginRight: 10,
    justifyContent: 'center',
    elevation: 1,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  allPillActive: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  allPillText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  allPillTextActive: {
    color: '#FFFFFF',
  },

  /* Products Grid */
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
