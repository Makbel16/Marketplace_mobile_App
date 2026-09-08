import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Product } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user, isSeller } = useAuth();
  const { formatPrice, isAmharic } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);

  const [orderCount, setOrderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isSeller) {
      loadSellerData();
    }
  }, [isSeller]);

  const loadSellerData = async () => {
    setIsLoading(true);
    try {
      // Load inventory
      const prodRes = await ApiClient.get<{ success: boolean; data: Product[] }>(
        '/products/seller/inventory'
      );
      if (prodRes.data) {
        setProducts(prodRes.data);
      }

      // Load orders count
      const ordRes = await ApiClient.get<{ success: boolean; data: any[] }>('/orders/seller');
      if (ordRes.data) {
        setOrderCount(ordRes.data.length);
      }
    } catch (err: any) {
      console.warn('Failed to load seller metrics', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${productName}" from your shop catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.delete(`/products/${productId}`);
              setProducts(products.filter((p) => p.id !== productId));
              Alert.alert('Deleted', 'Product was removed successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete product');
            }
          },
        },
      ]
    );
  };

  if (!isSeller) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.nonSellerContainer}>
          <Text style={styles.nonSellerTitle}>Artisan Access Only</Text>
          <Text style={styles.nonSellerSubtitle}>
            This portal is reserved for approved sellers and artisans.
          </Text>
          <PrimaryButton
            title="Create Seller Account"
            onPress={() => router.push('/(auth)/register?role=SELLER' as any)}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const activeProducts = products.filter((p) => p.stock > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={ArtisanColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artisan Studio</Text>
        <TouchableOpacity
          onPress={() => router.push('/seller/add-product' as any)}
          style={styles.headerAddBtn}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadSellerData();
            }}
            colors={[ArtisanColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Shop Overview Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopTopRow}>
            <View>
              <Text style={styles.shopName}>{user?.sellerProfile?.shopName}</Text>
              <Text style={styles.shopLocation}>{user?.sellerProfile?.location || 'Artisan Workshop'}</Text>
            </View>
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>APPROVED</Text>
            </View>
          </View>
          {user?.sellerProfile?.description && (
            <Text style={styles.shopBio} numberOfLines={2}>
              {user.sellerProfile.description}
            </Text>
          )}
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{products.length}</Text>
            <Text style={styles.metricLabel}>Total Products</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricNumber, { color: ArtisanColors.success }]}>{activeProducts}</Text>
            <Text style={styles.metricLabel}>In Stock</Text>
          </View>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => router.push('/seller/orders' as any)}>
            <Text style={[styles.metricNumber, { color: ArtisanColors.primary }]}>{orderCount}</Text>
            <Text style={styles.metricLabel}>Orders Placed</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionButtonsRow}>
          <PrimaryButton
            title="Add New Product"
            icon={<Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
            onPress={() => router.push('/seller/add-product' as any)}
            style={styles.actionBtn}
          />
          <PrimaryButton
            title="Shop Orders"
            variant="outline"
            icon={<Ionicons name="receipt-outline" size={18} color={ArtisanColors.primary} />}
            onPress={() => router.push('/seller/orders' as any)}
            style={styles.actionBtn}
          />
        </View>

        {/* Inventory Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop Catalog & Inventory</Text>
            <Text style={styles.itemCountText}>{products.length} craft(s)</Text>
          </View>

          {isLoading && !isRefreshing ? (
            <LoadingState message="Loading catalog..." size="small" />
          ) : products.length === 0 ? (
            <View style={styles.emptyInventory}>
              <Text style={styles.emptyTitle}>No Products Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first handmade product to start selling to customers.
              </Text>
              <PrimaryButton
                title="Add First Product"
                size="small"
                onPress={() => router.push('/seller/add-product' as any)}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            products.map((item) => (
              <View key={item.id} style={styles.inventoryCard}>
                <Image
                  source={{
                    uri:
                      item.primaryImage ||
                      item.images?.[0]?.imageUrl ||
                      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=200&q=80',
                  }}
                  style={styles.productThumbnail}
                  contentFit="cover"
                />

                <View style={styles.productMeta}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  <View style={styles.stockRow}>

                    <Text
                      style={[
                        styles.stockIndicator,
                        item.stock === 0 ? styles.stockZero : styles.stockNormal,
                      ]}>
                      Stock: {item.stock}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => handleDeleteProduct(item.id, item.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={ArtisanColors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ArtisanColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  headerAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ArtisanColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    marginBottom: 16,
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  shopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopName: {
    fontSize: 18,
    fontWeight: '900',
    color: ArtisanColors.text,
  },
  shopLocation: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 2,
  },
  approvedBadge: {
    backgroundColor: ArtisanColors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  approvedText: {
    fontSize: 10,
    fontWeight: '800',
    color: ArtisanColors.secondary,
    letterSpacing: 0.5,
  },
  shopBio: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 1,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: ArtisanColors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: ArtisanColors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  itemCountText: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
  },
  emptyInventory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ArtisanColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  productThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  productMeta: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: ArtisanColors.primary,
    marginTop: 2,
  },
  stockRow: {
    marginTop: 3,
  },
  stockIndicator: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockNormal: {
    color: ArtisanColors.success,
  },
  stockZero: {
    color: ArtisanColors.danger,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
  },
  nonSellerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  nonSellerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  nonSellerSubtitle: {
    fontSize: 14,
    color: ArtisanColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backButton: {
    minWidth: 180,
  },
});
