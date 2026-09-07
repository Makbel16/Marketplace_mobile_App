import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { ArtisanColors } from '../../constants/colors';
import { RatingStars } from '../ui';
import { useFavorites } from '../../context/FavoritesContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2; // 2-column layout with 16px margins + 12px gap

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.id);

  const imageUrl =
    product.primaryImage ||
    product.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { width: CARD_WIDTH }]}>
      {/* Image Container */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />

        {/* Handmade Tag / Stock Badge */}
        {product.stock === 0 ? (
          <View style={[styles.statusBadge, styles.outOfStockBadge]}>
            <Text style={styles.statusBadgeText}>Sold Out</Text>
          </View>
        ) : product.stock <= 5 ? (
          <View style={[styles.statusBadge, styles.lowStockBadge]}>
            <Text style={styles.statusBadgeText}>{product.stock} Left</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.handmadeBadge]}>
            <Text style={styles.handmadeBadgeText}>Handcrafted</Text>
          </View>
        )}

        {/* Favorite Icon Button */}
        <TouchableOpacity
          onPress={() => toggleFavorite(product)}
          style={[styles.favoriteButton, favorited && styles.favoriteButtonActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={19}
            color={favorited ? ArtisanColors.danger : ArtisanColors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {product.seller?.shopName && (
          <View style={styles.shopRow}>
            <Ionicons name="storefront-outline" size={11} color={ArtisanColors.primary} />
            <Text style={styles.shopName} numberOfLines={1}>
              {product.seller.shopName}
            </Text>
          </View>
        )}

        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <RatingStars rating={product.rating || 0} reviewCount={product.reviewCount} size={12} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <View style={styles.viewCircle}>
            <Ionicons name="arrow-forward" size={13} color={ArtisanColors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 3,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  favoriteButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  handmadeBadge: {
    backgroundColor: 'rgba(34, 28, 24, 0.72)',
  },
  handmadeBadgeText: {
    color: '#FAF7F2',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(198, 61, 47, 0.92)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.92)',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    padding: 12,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  shopName: {
    fontSize: 11,
    fontWeight: '700',
    color: ArtisanColors.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
    lineHeight: 19,
    minHeight: 38,
  },
  ratingRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: ArtisanColors.text,
  },
  viewCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ArtisanColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
