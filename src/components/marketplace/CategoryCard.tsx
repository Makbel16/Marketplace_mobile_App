import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Category } from '../../types';
import { ArtisanColors } from '../../constants/colors';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onPress: () => void;
  variant?: 'pill' | 'grid';
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onPress,
  variant = 'pill',
}) => {
  if (variant === 'grid') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.gridContainer, isSelected && styles.gridSelected]}>
        {category.image ? (
          <Image
            source={{ uri: category.image }}
            style={styles.gridImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.gridImage, styles.imagePlaceholder]} />
        )}
        <View style={styles.gridOverlay}>
          <Text style={styles.gridTitle} numberOfLines={1}>
            {category.name}
          </Text>
          {category.productCount !== undefined && (
            <Text style={styles.gridCount}>
              {category.productCount} item{category.productCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Pill variant (for horizontal carousels)
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.pillContainer, isSelected && styles.pillSelected]}>
      {category.image ? (
        <Image
          source={{ uri: category.image }}
          style={styles.pillImage}
          contentFit="cover"
          transition={200}
        />
      ) : null}
      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Pill styles
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: ArtisanColors.border,
    marginRight: 10,
    elevation: 1,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  pillSelected: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  pillImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },

  // Grid styles
  gridContainer: {
    flex: 1,
    margin: 6,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  gridSelected: {
    borderWidth: 2,
    borderColor: ArtisanColors.primary,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imagePlaceholder: {
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(36, 29, 25, 0.45)',
    padding: 12,
    justifyContent: 'flex-end',
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridCount: {
    fontSize: 12,
    color: '#F0ECE6',
    marginTop: 2,
  },
});
