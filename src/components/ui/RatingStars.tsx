import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showScore?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 14,
  showScore = true,
}) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((star) => {
          let iconName: 'star' | 'star-half' | 'star-outline' = 'star';
          if (rating >= star) {
            iconName = 'star';
          } else if (rating >= star - 0.5) {
            iconName = 'star-half';
          } else {
            iconName = 'star-outline';
          }

          return (
            <Ionicons
              key={star}
              name={iconName}
              size={size}
              color={ArtisanColors.star}
              style={styles.star}
            />
          );
        })}
      </View>

      {showScore && (
        <Text style={[styles.scoreText, { fontSize: size - 1 }]}>
          {rating > 0 ? rating.toFixed(1) : 'New'}
        </Text>
      )}

      {reviewCount !== undefined && reviewCount > 0 && (
        <Text style={[styles.countText, { fontSize: size - 2 }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 1,
  },
  scoreText: {
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  countText: {
    color: ArtisanColors.textSecondary,
  },
});
