import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ArtisanColors } from '../../constants/colors';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading handcrafted items...',
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={ArtisanColors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    color: ArtisanColors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
