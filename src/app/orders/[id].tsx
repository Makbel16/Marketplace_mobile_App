import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Order, OrderStatus } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { useLanguage } from '../../context/LanguageContext';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { formatPrice, isAmharic } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadOrderDetails(id);
  }, [id]);

  const loadOrderDetails = async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
      if (res.data) {
        setOrder(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const steps: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

  const getStepIndex = (status: OrderStatus) => {
    return steps.indexOf(status);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LoadingState message="Retrieving order details..." />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState message={error || 'Order not found'} onRetry={() => loadOrderDetails(id)} />
      </SafeAreaView>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={ArtisanColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fulfillment Status</Text>

          {order.status === 'CANCELLED' ? (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={24} color={ArtisanColors.danger} />
              <Text style={styles.cancelledText}>This order was cancelled.</Text>
            </View>
          ) : (
            <View style={styles.trackerContainer}>
              {steps.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;

                return (
                  <View key={step} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        isPassed && styles.stepDotPassed,
                        isCurrent && styles.stepDotCurrent,
                      ]}>
                      {isPassed ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <View style={styles.innerDot} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isPassed && styles.stepLabelPassed,
                        isCurrent && styles.stepLabelCurrent,
                      ]}>
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Ordered Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered</Text>

          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                {item.seller?.shopName && (
                  <Text style={styles.shopName}>By {item.seller.shopName}</Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.unitPrice}>
                    {formatPrice(item.unitPrice)} x {item.quantity}
                  </Text>
                  <Text style={styles.subtotal}>{formatPrice(item.subtotal)}</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{isAmharic ? 'የሚከፈል አጠቃላይ ድምር' : 'Total Amount Due'}</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>


        {/* Shipping & Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={ArtisanColors.textMuted} />
            <Text style={styles.detailText}>{order.shippingAddress}</Text>
          </View>

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => {
              const dialNumber = order.phone.replace(/[\s\-\(\)]/g, '');
              Linking.openURL(`tel:${dialNumber}`).catch(() => {});
            }}>
            <Ionicons name="call-outline" size={18} color="#0284C7" />
            <Text style={[styles.detailText, { color: '#0284C7', fontWeight: '600' }]}>
              {order.phone} ({isAmharic ? 'ለመደወል ይጫኑ' : 'Tap to call'})
            </Text>
          </TouchableOpacity>

          {order.notes ? (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={18} color={ArtisanColors.textMuted} />
              <Text style={styles.detailText}>{order.notes}</Text>
            </View>
          ) : null}
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
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 70,
  },
  card: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
    marginBottom: 16,
  },
  trackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ArtisanColors.surfaceSecondary,
    borderWidth: 2,
    borderColor: ArtisanColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotPassed: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  stepDotCurrent: {
    borderColor: ArtisanColors.primaryDark,
    transform: [{ scale: 1.15 }],
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ArtisanColors.textMuted,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: ArtisanColors.textMuted,
    textAlign: 'center',
  },
  stepLabelPassed: {
    color: ArtisanColors.primary,
  },
  stepLabelCurrent: {
    color: ArtisanColors.text,
    fontWeight: '900',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ArtisanColors.dangerLight,
    padding: 12,
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.danger,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  shopName: {
    fontSize: 11,
    color: ArtisanColors.textMuted,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  unitPrice: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '800',
    color: ArtisanColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: ArtisanColors.borderLight,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: ArtisanColors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: ArtisanColors.textSecondary,
    lineHeight: 20,
  },
});
