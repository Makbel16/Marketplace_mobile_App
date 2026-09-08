import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { ArtisanColors } from '../../constants/colors';

interface LanguageSwitcherProps {
  style?: ViewStyle;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      {/* English Option */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setLanguage('en')}
        style={[styles.segment, language === 'en' && styles.segmentActive]}>
        <Text style={styles.flag}>🇬🇧</Text>
        <Text style={[styles.label, language === 'en' && styles.labelActive]}>EN</Text>
      </TouchableOpacity>

      {/* Amharic Option */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setLanguage('am')}
        style={[styles.segment, language === 'am' && styles.segmentActive]}>
        <Text style={styles.flag}>🇪🇹</Text>
        <Text style={[styles.label, language === 'am' && styles.labelActive]}>አማ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: ArtisanColors.border,
    padding: 3,
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 18,
    gap: 4,
  },
  segmentActive: {
    backgroundColor: ArtisanColors.primary,
    elevation: 2,
    shadowColor: ArtisanColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  flag: {
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.textSecondary,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
