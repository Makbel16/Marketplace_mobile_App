import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();

  const [role, setRole] = useState<UserRole>(
    params.role === 'SELLER' ? 'SELLER' : 'CUSTOMER'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing Required Fields', 'Please provide your full name, email, and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (role === 'SELLER' && !shopName.trim()) {
      Alert.alert('Shop Name Required', 'Please provide a name for your artisan shop or studio.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
        shopName: role === 'SELLER' ? shopName.trim() : undefined,
        description: role === 'SELLER' && description.trim() ? description.trim() : undefined,
        location: role === 'SELLER' && location.trim() ? location.trim() : undefined,
      });

      Alert.alert(
        'Account Created! 🎉',
        role === 'SELLER'
          ? `Welcome to the collective, ${shopName}! Your shop is now live.`
          : `Welcome to Artisan Marketplace, ${name}!`,
        [
          {
            text: 'Get Started',
            onPress: () => router.replace(role === 'SELLER' ? '/seller/dashboard' as any : '/(tabs)' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          <Text style={styles.title}>Join the Marketplace</Text>
          <Text style={styles.subtitle}>
            Choose your account type to buy handcrafted treasures or sell your authentic crafts.
          </Text>
        </View>

        {/* Role Segment Tabs */}
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'CUSTOMER' && styles.roleTabActive]}
            onPress={() => setRole('CUSTOMER')}>
            <Ionicons
              name="person-outline"
              size={18}
              color={role === 'CUSTOMER' ? '#FFFFFF' : ArtisanColors.textSecondary}
            />
            <Text style={[styles.roleTabText, role === 'CUSTOMER' && styles.roleTabTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'SELLER' && styles.roleTabActive]}
            onPress={() => setRole('SELLER')}>
            <Ionicons
              name="hammer-outline"
              size={18}
              color={role === 'SELLER' ? '#FFFFFF' : ArtisanColors.textSecondary}
            />
            <Text style={[styles.roleTabText, role === 'SELLER' && styles.roleTabTextActive]}>
              Artisan / Seller
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Sarah Jenkins"
            icon="person-outline"
          />

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
            label="Password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            isPassword
            icon="lock-closed-outline"
          />

          <InputField
            label="Phone Number (Optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          {/* Seller Specific Fields */}
          {role === 'SELLER' && (
            <View style={styles.sellerFieldsCard}>
              <Text style={styles.sellerSectionTitle}>Your Artisan Shop Details</Text>

              <InputField
                label="Shop / Studio Name"
                value={shopName}
                onChangeText={setShopName}
                placeholder="e.g. Elena Clay Studio"
                icon="business-outline"
              />

              <InputField
                label="Location / Region"
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Portland, OR or Addis Ababa"
                icon="location-outline"
              />

              <InputField
                label="Shop Bio & Craft Specialty"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your craft, materials used, and heritage..."
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />
            </View>
          )}

          <PrimaryButton
            title={role === 'SELLER' ? 'Create Artisan Shop' : 'Create Account'}
            onPress={handleRegister}
            loading={isLoading}
            size="large"
            style={styles.submitButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.signInLink}>Sign In</Text>
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
    paddingBottom: 60,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
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
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: ArtisanColors.surfaceSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: ArtisanColors.primary,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    marginBottom: 20,
  },
  sellerFieldsCard: {
    backgroundColor: ArtisanColors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
    marginBottom: 16,
  },
  sellerSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ArtisanColors.text,
    marginBottom: 14,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 10,
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
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.primary,
  },
});
