import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/profile' as any);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={ArtisanColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to discover local artisan crafts, track orders, or manage your shop.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@artisan.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            isPassword
            icon="lock-closed-outline"
          />

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            size="large"
            style={styles.signInButton}
          />
        </View>

        {/* Demo Credentials Helper for user testing */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Quick Demo Logins (Password: Password123!)</Text>
          <View style={styles.demoPills}>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => {
                setEmail('customer@artisan.com');
                setPassword('Password123!');
              }}>
              <Text style={styles.demoPillText}>Customer (Sarah)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => {
                setEmail('elena@artisan.com');
                setPassword('Password123!');
              }}>
              <Text style={styles.demoPillText}>Artisan (Elena)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account yet? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={styles.signUpLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: ArtisanColors.text,
  },
  subtitle: {
    fontSize: 14,
    color: ArtisanColors.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  form: {
    marginBottom: 24,
  },
  signInButton: {
    marginTop: 12,
  },
  demoCard: {
    backgroundColor: ArtisanColors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  demoPills: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: ArtisanColors.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.primary,
  },
});
