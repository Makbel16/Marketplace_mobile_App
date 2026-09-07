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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Order, OrderStatus } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<{ success: boolean; data: Order[] }>('/orders');
      if (res.data) {
        setOrders(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
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

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign In to View Orders"
          message="Please sign in to track your past orders and deliveries."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/login' as any)}
        />
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading && !isRefreshing ? (
        <LoadingState message="Fetching your orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Orders Yet"
          message="You haven't placed any orders yet. Discover unique handmade items from local artisans."
          actionTitle="Browse Marketplace"
          onAction={() => router.push('/(tabs)' as any)}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadOrders();
              }}
              colors={[ArtisanColors.primary]}
            />
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusColor(item.status);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/orders/${item.id}` as any)}
                style={styles.orderCard}>
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Items preview */}
                {item.items.map((it) => (
                  <View key={it.id} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {it.quantity}x {it.productName}
                    </Text>
                    <Text style={styles.itemPrice}>${it.subtotal.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.cardFooter}>
                  <Text style={styles.totalItemsText}>
                    Total ({item.items.reduce((s, i) => s + i.quantity, 0)} items)
                  </Text>
                  <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: ArtisanColors.borderLight,
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  totalItemsText: {
    fontSize: 13,
    color: ArtisanColors.textMuted,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.primary,
  },
});
