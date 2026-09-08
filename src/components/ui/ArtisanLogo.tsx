import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';

interface ArtisanLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  style?: ViewStyle;
}

export const ArtisanLogo: React.FC<ArtisanLogoProps> = ({
  size = 'medium',
  showTagline = true,
  style,
}) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const emblemSize = isSmall ? 36 : isLarge ? 52 : 44;
  const iconSize = isSmall ? 18 : isLarge ? 26 : 22;
  const titleFontSize = isSmall ? 17 : isLarge ? 24 : 20;

  return (
    <View style={[styles.container, style]}>
      {/* Authentic Maker's Mark Guild Seal */}
      <View
        style={[
          styles.emblemContainer,
          { width: emblemSize, height: emblemSize, borderRadius: emblemSize * 0.32 },
        ]}>
        {/* Concentric Gold Hairline Ring */}
        <View
          style={[
            styles.innerRing,
            { borderRadius: (emblemSize - 6) * 0.32 },
          ]}>
          {/* Craftsman Hammer & Anvil Mark */}
          <Ionicons name="hammer" size={iconSize} color="#FFF8F0" />
        </View>

        {/* Hallmark Gold Maker Dots */}
        <View style={[styles.hallmarkDot, styles.dotLeft]} />
        <View style={[styles.hallmarkDot, styles.dotRight]} />
      </View>

      {/* Brand Typography */}
      <View style={styles.textContainer}>
        {showTagline && (
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowText}>ORIGINAL CRAFTS</Text>
            <View style={styles.eyebrowDivider} />
            <Text style={styles.eyebrowText}>EST. 2026</Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={[styles.titleArtisan, { fontSize: titleFontSize }]}>ARTISAN </Text>
          <Text style={[styles.titleMarketplace, { fontSize: titleFontSize }]}>MARKETPLACE</Text>
        </View>

        {showTagline && !isSmall && (
          <View style={styles.guildBadgeRow}>
            <Ionicons name="shield-checkmark" size={11} color={ArtisanColors.secondary} />
            <Text style={styles.guildBadgeText}>Certified Guild of Independent Makers</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemContainer: {
    backgroundColor: ArtisanColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(216, 168, 86, 0.55)',
    elevation: 4,
    shadowColor: ArtisanColors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    position: 'relative',
  },
  innerRing: {
    width: '84%',
    height: '84%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  hallmarkDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: ArtisanColors.gold,
  },
  dotLeft: {
    left: 2,
    top: '50%',
    marginTop: -1.5,
  },
  dotRight: {
    right: 2,
    top: '50%',
    marginTop: -1.5,
  },
  textContainer: {
    justifyContent: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: '800',
    color: ArtisanColors.gold,
    letterSpacing: 1.8,
  },
  eyebrowDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: ArtisanColors.gold,
    marginHorizontal: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleArtisan: {
    fontWeight: '900',
    color: ArtisanColors.text,
    letterSpacing: 1.0,
  },
  titleMarketplace: {
    fontWeight: '900',
    color: ArtisanColors.primary,
    letterSpacing: 1.0,
  },
  guildBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  guildBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: ArtisanColors.textSecondary,
    letterSpacing: 0.2,
  },
});
