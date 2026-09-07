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

        {/* Favorite Icon Button */}
        <TouchableOpacity
          onPress={() => toggleFavorite(product)}
          style={styles.favoriteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={20}
            color={favorited ? ArtisanColors.danger : ArtisanColors.textSecondary}
          />
        </TouchableOpacity>

        {/* Stock Badge */}
        {product.stock === 0 ? (
          <View style={[styles.badge, styles.outOfStockBadge]}>
            <Text style={styles.badgeText}>Sold Out</Text>
          </View>
        ) : product.stock <= 5 ? (
          <View style={[styles.badge, styles.lowStockBadge]}>
            <Text style={styles.badgeText}>Only {product.stock} left</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {product.seller?.shopName && (
          <Text style={styles.shopName} numberOfLines={1}>
            {product.seller.shopName}
          </Text>
        )}

        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <RatingStars rating={product.rating || 0} reviewCount={product.reviewCount} size={12} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(198, 61, 47, 0.9)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.9)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 10,
  },
  shopName: {
    fontSize: 11,
    fontWeight: '600',
    color: ArtisanColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    marginTop: 4,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.primary,
  },
});
