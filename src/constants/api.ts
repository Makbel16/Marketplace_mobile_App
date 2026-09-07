import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend API base URL.
 * 1. Uses EXPO_PUBLIC_API_URL environment variable if set.
 * 2. In Expo Go development on a physical device, dynamically detects the PC's host IP (e.g. 192.168.x.x:5000/api).
 * 3. Fallback to localhost for Web or emulators.
 */
export const getApiBaseUrl = (): string => {
  // If explicitly specified in .env, prioritize it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // Auto-detect host IP in Expo development for seamless physical phone testing
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    return `http://${hostIp}:5000/api`;
  }

  // Fallback for web or emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
