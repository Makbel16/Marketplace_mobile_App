import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { CartItem } from '../../types';

export default function CartScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { cart, total, totalItems, updateQuantity, removeFromCart, clearCart, isLoading } =
    useCart();
  const { t, formatPrice, isAmharic } = useLanguage();


  const renderCartItem = ({ item }: { item: CartItem }) => {
    const imageUrl =
      item.imageUrl ||
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80';

    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: imageUrl }} style={styles.itemImage} contentFit="cover" />

        <View style={styles.itemDetails}>
          {item.seller?.shopName && (
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.seller.shopName}
            </Text>
          )}

          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>

          <View style={styles.actionRow}>
            {/* Quantity Controls */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                style={styles.qtyButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="remove" size={16} color={ArtisanColors.text} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                style={styles.qtyButton}
                disabled={item.quantity >= item.stock}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons
                  name="add"
                  size={16}
                  color={item.quantity >= item.stock ? ArtisanColors.textMuted : ArtisanColors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Subtotal & Delete */}
            <View style={styles.subtotalGroup}>
              <Text style={styles.subtotalText}>{formatPrice(item.subtotal)}</Text>
              <TouchableOpacity
                onPress={() => removeFromCart(item.id)}
                style={styles.deleteButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={ArtisanColors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const items = cart?.items || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={ArtisanColors.background} />

      {/* Luxury Branded Header */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.headerTopRow}>
            <View style={styles.eyebrowBadge}>
              <Ionicons name="bag-check" size={11} color={ArtisanColors.primary} />
              <Text style={styles.eyebrowText}>{t('cartBadge')}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{t('cartItemsCount', { count: totalItems })}</Text>
            </View>
          </View>

          <Text style={styles.title}>{t('cartTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('cartSubtitle')}
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearCartButton}>
            <Ionicons name="trash-outline" size={15} color={ArtisanColors.danger} />
            <Text style={styles.clearCartText}>{t('clearCart')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Assurance Ribbon */}
      {items.length > 0 && (
        <View style={styles.assuranceRibbon}>
          <Text style={styles.assuranceText}>
            {t('assuranceText')}
          </Text>
        </View>
      )}

      {!token ? (
        <EmptyState
          icon="lock-closed-outline"
          title={isAmharic ? 'መግባት ያስፈልጋል' : 'Sign In to Access Cart'}
          message={
            isAmharic
              ? 'ምርቶችን ወደ ጋሪዎ ለማከል እና ትዕዛዝ ለማጠናቀቅ እባክዎ መጀመሪያ ወደ መለያዎ ይግቡ ወይም ይመዝገቡ።'
              : 'Please sign in or create an account to view your cart, add artisan creations, and complete checkout.'
          }
          actionTitle={isAmharic ? 'ግባ / ተመዝገብ' : 'Sign In / Register'}
          onAction={() => router.push('/(auth)/login' as any)}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="bag-handle-outline"
          title={t('emptyCartTitle')}
          message={t('emptyCartMessage')}
          actionTitle={t('startShopping')}
          onAction={() => router.push('/(tabs)' as any)}
        />
      ) : (

        <View style={styles.content}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Checkout Bottom Sheet / Bar */}
          <View style={styles.checkoutBar}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('subtotal', { count: totalItems })}</Text>
              <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('shipping')}</Text>
              <Text style={[styles.summaryValue, styles.freeShipping]}>{t('freeShipping')}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('total')}</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>

            <PrimaryButton
              title={t('checkoutBtn')}
              onPress={() => router.push('/checkout' as any)}
              size="large"
              loading={isLoading}
              style={styles.checkoutButton}
            />
          </View>
        </View>
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
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerMain: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184, 93, 56, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: ArtisanColors.primary,
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ArtisanColors.textSecondary,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: ArtisanColors.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  clearCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    gap: 4,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.danger,
  },
  assuranceRibbon: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(78, 110, 88, 0.08)',
    borderRadius: 12,
    alignItems: 'center',
  },
  assuranceText: {
    fontSize: 11,
    fontWeight: '600',
    color: ArtisanColors.secondary,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 1,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  sellerName: {
    fontSize: 11,
    fontWeight: '600',
    color: ArtisanColors.textMuted,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
    lineHeight: 18,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.primary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArtisanColors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: ArtisanColors.text,
    paddingHorizontal: 8,
  },
  subtotalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  deleteButton: {
    padding: 4,
  },
  checkoutBar: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 12,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  freeShipping: {
    color: ArtisanColors.success,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: ArtisanColors.borderLight,
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: ArtisanColors.primary,
  },
  checkoutButton: {
    width: '100%',
  },
});
