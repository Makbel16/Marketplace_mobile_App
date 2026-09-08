import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { OrderStatus } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { useLanguage } from '../../context/LanguageContext';

interface SellerOrderItem {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  customerName: string;
  shippingAddress: string;
  phone: string;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export default function SellerOrdersScreen() {
  const router = useRouter();
  const { formatPrice, isAmharic } = useLanguage();
  const [orders, setOrders] = useState<SellerOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);


  useEffect(() => {
    loadSellerOrders();
  }, []);

  const loadSellerOrders = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<{ success: boolean; data: SellerOrderItem[] }>('/orders/seller');
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load seller orders', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = (orderId: string, currentStatus: OrderStatus) => {
    const statuses: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    Alert.alert(
      'Update Fulfillment Status',
      `Current: ${currentStatus}\nSelect new status for this order:`,
      [
        ...statuses.map((s) => ({
          text: s,
          onPress: async () => {
            try {
              await ApiClient.patch(`/orders/${orderId}/status`, { status: s });
              setOrders((prev) =>
                prev.map((o) => (o.orderId === orderId ? { ...o, orderStatus: s } : o))
              );
              Alert.alert('Status Updated', `Order status marked as ${s}.`);
            } catch (err: any) {
              Alert.alert('Update Failed', err.message || 'Could not update status');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: ArtisanColors.successLight, text: ArtisanColors.success };
      case 'SHIPPED':
      case 'PROCESSING':
        return { bg: ArtisanColors.accentLight, text: ArtisanColors.accent };
      case 'CANCELLED':
        return { bg: ArtisanColors.dangerLight, text: ArtisanColors.danger };
      default:
        return { bg: ArtisanColors.primaryLight, text: ArtisanColors.primary };
    }
  };

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
        <Text style={styles.headerTitle}>Shop Orders ({orders.length})</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading && !isRefreshing ? (
        <LoadingState message="Loading your shop orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Shop Orders Yet"
          message="When customers purchase your handcrafted items, orders will appear here for packing and shipping."
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderItemId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadSellerOrders();
              }}
              colors={[ArtisanColors.primary]}
            />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.orderStatus);

            return (
              <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item.orderId, item.orderStatus)}
                    style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {item.orderStatus} ▾
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.productRow}>
                  {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} contentFit="cover" />
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text style={styles.productPrice}>
                      {formatPrice(item.unitPrice)} x {item.quantity} = {formatPrice(item.subtotal)}
                    </Text>
                  </View>

                </View>

                <View style={styles.divider} />

                {/* Customer Info */}
                <View style={styles.customerBlock}>
                  <Text style={styles.customerLabel}>Customer & Shipping:</Text>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.customerAddress}>{item.shippingAddress}</Text>
                  <Text style={styles.customerPhone}>Phone: {item.phone}</Text>
                </View>
              </View>
            );
          }}
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
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  orderDate: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  productInfo: {
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
  divider: {
    height: 1,
    backgroundColor: ArtisanColors.borderLight,
    marginVertical: 12,
  },
  customerBlock: {
    backgroundColor: ArtisanColors.background,
    borderRadius: 10,
    padding: 10,
  },
  customerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ArtisanColors.textMuted,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: ArtisanColors.text,
    marginTop: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: ArtisanColors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  customerPhone: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 4,
  },
});
