import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, isLoading, refreshFavorites } = useFavorites();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={ArtisanColors.background} />

      {/* Luxury Branded Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.eyebrowBadge}>
            <Ionicons name="heart" size={11} color={ArtisanColors.primary} />
            <Text style={styles.eyebrowText}>{t('favoritesBadge')}</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{t('savedCount', { count: favorites.length })}</Text>
          </View>
        </View>

        <Text style={styles.title}>{t('favoritesTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('favoritesSubtitle')}
        </Text>
      </View>

      {isLoading && favorites.length === 0 ? (
        <LoadingState message={t('loadingMessage')} />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={t('emptyFavoritesTitle')}
          message={t('emptyFavoritesMessage')}
          actionTitle={t('exploreMarketplace')}
          onAction={() => router.push('/(tabs)' as any)}
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshFavorites}
              colors={[ArtisanColors.primary]}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}` as any)}
            />
          )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
