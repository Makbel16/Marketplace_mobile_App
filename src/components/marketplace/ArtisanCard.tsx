import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';

interface ArtisanCardProps {
  shopName: string;
  description?: string | null;
  location?: string | null;
  profileImage?: string | null;
  onPress: () => void;
}

export const ArtisanCard: React.FC<ArtisanCardProps> = ({
  shopName,
  description,
  location,
  profileImage,
  onPress,
}) => {
  const avatarUrl =
    profileImage ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.shopName} numberOfLines={1}>
          {shopName}
        </Text>
        {location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={ArtisanColors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={ArtisanColors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    marginBottom: 12,
    elevation: 1,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
  },
  description: {
    fontSize: 12,
    color: ArtisanColors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
});
