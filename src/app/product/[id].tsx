import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { RatingStars } from '../../components/ui/RatingStars';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Product } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadProductDetails(id);
  }, [id]);

  const loadProductDetails = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.get<{ success: boolean; data: Product }>(`/products/${productId}`);
      if (res.data) {
        setProduct(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
      Alert.alert(
        'Added to Cart',
        `${quantity} x "${product.name}" added to your shopping cart.`,
        [
          { text: 'Keep Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart' as any) },
        ]
      );
    } catch (err: any) {
      Alert.alert('Cart Error', err.message || 'Could not add product to cart');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Loading craft details..." />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error || 'Product not found'} onRetry={() => loadProductDetails(id)} />
      </SafeAreaView>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ imageUrl: product.primaryImage || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80' }];

  const favorited = isFavorite(product.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Floating Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={ArtisanColors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleFavorite(product)}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={22}
            color={favorited ? ArtisanColors.danger : ArtisanColors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <Image
            source={{ uri: images[selectedImageIndex]?.imageUrl }}
            style={styles.mainImage}
            contentFit="cover"
            transition={300}
          />

          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImageIndex(idx)}
                  style={[
                    styles.thumbnailWrapper,
                    selectedImageIndex === idx && styles.thumbnailActive,
                  ]}>
                  <Image source={{ uri: img.imageUrl }} style={styles.thumbnail} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.infoSection}>
          {/* Artisan & Category Header */}
          <View style={styles.categoryRow}>
            {product.category && (
              <Text style={styles.categoryTag}>{product.category.name}</Text>
            )}
            <View
              style={[
                styles.stockBadge,
                product.stock === 0 ? styles.outOfStockBadge : styles.inStockBadge,
              ]}>
              <Text
                style={[
                  styles.stockBadgeText,
                  product.stock === 0 ? styles.outOfStockText : styles.inStockText,
                ]}>
                {product.stock === 0
                  ? 'Out of Stock'
                  : product.stock <= 5
                  ? `Only ${product.stock} available`
                  : 'In Stock'}
              </Text>
            </View>
          </View>

          {/* Product Title */}
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Rating & Price */}
          <View style={styles.priceRatingRow}>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            <RatingStars
              rating={product.rating || 0}
              reviewCount={product.reviewCount}
              size={16}
            />
          </View>

          {/* Artisan Shop Card */}
          {product.seller && (
            <View style={styles.artisanCard}>
              <Image
                source={{
                  uri:
                    product.seller.profileImage ||
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.artisanAvatar}
                contentFit="cover"
              />
              <View style={styles.artisanInfo}>
                <Text style={styles.artisanLabel}>Crafted by</Text>
                <Text style={styles.artisanName}>{product.seller.shopName}</Text>
                {product.seller.location && (
                  <Text style={styles.artisanLocation}>{product.seller.location}</Text>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>About This Craft</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Customer Reviews */}
          <View style={styles.sectionBlock}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={styles.sectionHeader}>Customer Reviews</Text>
              <Text style={styles.reviewsSummary}>
                {product.rating ? `${product.rating.toFixed(1)} ★` : 'No reviews yet'} ({product.reviewCount || 0})
              </Text>
            </View>

            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewAuthorRow}>
                    <Text style={styles.reviewAuthor}>{rev.author.name}</Text>
                    <RatingStars rating={rev.rating} size={12} showScore={false} />
                  </View>
                  {rev.comment ? (
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                  ) : null}
                  <Text style={styles.reviewDate}>
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>
                No customer reviews yet. Be the first to order and review this artisan craft!
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Cart Bar */}
      <View style={styles.bottomBar}>
        {/* Quantity Selector */}
        {product.stock > 0 && (
          <View style={styles.quantityPicker}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.qtyPickerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="remove" size={16} color={ArtisanColors.text} />
            </TouchableOpacity>

            <Text style={styles.qtyPickerText}>{quantity}</Text>

            <TouchableOpacity
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              style={styles.qtyPickerButton}
              disabled={quantity >= product.stock}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name="add"
                size={16}
                color={quantity >= product.stock ? ArtisanColors.textMuted : ArtisanColors.text}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Add to Cart Button */}
        <PrimaryButton
          title={product.stock === 0 ? 'Out of Stock' : `Add to Cart • $${(product.price * quantity).toFixed(2)}`}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
          loading={isAdding}
          size="large"
          style={styles.addToCartButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  galleryContainer: {
    width: '100%',
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  mainImage: {
    width: width,
    height: width,
  },
  thumbnailRow: {
    padding: 12,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: ArtisanColors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inStockBadge: {
    backgroundColor: ArtisanColors.successLight,
  },
  outOfStockBadge: {
    backgroundColor: ArtisanColors.dangerLight,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inStockText: {
    color: ArtisanColors.success,
  },
  outOfStockText: {
    color: ArtisanColors.danger,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ArtisanColors.text,
    lineHeight: 28,
  },
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: ArtisanColors.primary,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArtisanColors.background,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  artisanAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  artisanInfo: {
    marginLeft: 12,
  },
  artisanLabel: {
    fontSize: 11,
    color: ArtisanColors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  artisanName: {
    fontSize: 15,
    fontWeight: '800',
    color: ArtisanColors.text,
    marginTop: 1,
  },
  artisanLocation: {
    fontSize: 12,
    color: ArtisanColors.textSecondary,
    marginTop: 1,
  },
  sectionBlock: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: ArtisanColors.textSecondary,
    lineHeight: 22,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewsSummary: {
    fontSize: 13,
    fontWeight: '700',
    color: ArtisanColors.textSecondary,
  },
  reviewItem: {
    backgroundColor: ArtisanColors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  reviewComment: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 11,
    color: ArtisanColors.textMuted,
    marginTop: 6,
  },
  noReviewsText: {
    fontSize: 13,
    color: ArtisanColors.textMuted,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: ArtisanColors.borderLight,
    gap: 12,
    elevation: 8,
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArtisanColors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
    height: 48,
  },
  qtyPickerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPickerText: {
    fontSize: 15,
    fontWeight: '700',
    color: ArtisanColors.text,
    paddingHorizontal: 8,
  },
  addToCartButton: {
    flex: 1,
  },
});
