import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  isFilterActive?: boolean;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onClear,
  onFilterPress,
  isFilterActive = false,
  placeholder = 'Search pottery, leather bags, jewelry...',
  style,
}) => {
  return (
    <View style={[styles.outerRow, style]}>
      <View style={styles.container}>
        <Ionicons
          name="search-outline"
          size={20}
          color={ArtisanColors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ArtisanColors.textMuted}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              if (onClear) onClear();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={ArtisanColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {onFilterPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onFilterPress}
          style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}>
          <Ionicons
            name="options-outline"
            size={20}
            color={isFilterActive ? '#FFFFFF' : ArtisanColors.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: ArtisanColors.border,
    paddingHorizontal: 16,
    height: 50,
    elevation: 3,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: ArtisanColors.text,
    paddingVertical: 10,
    fontWeight: '500',
  },
  clearButton: {
    padding: 2,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ArtisanColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
});
