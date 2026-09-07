import React from 'react';
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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isSeller, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const avatarUrl =
    user?.profileImage ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ArtisanColors.background} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Luxury Branded Header */}
        <View style={styles.header}>
          <View style={styles.eyebrowBadge}>
            <Ionicons name="person-circle-outline" size={12} color={ArtisanColors.gold} />
            <Text style={styles.eyebrowText}>ARTISAN COMMUNITY</Text>
          </View>
          <Text style={styles.headerTitle}>Account & Guild</Text>
        </View>

        {/* User Card */}
        {user ? (
          <View style={styles.userCard}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    isSeller ? styles.sellerBadge : styles.customerBadge,
                  ]}>
                  <Text
                    style={[
                      styles.roleText,
                      isSeller ? styles.sellerRoleText : styles.customerRoleText,
                    ]}>
                    {user.role}
                  </Text>
                </View>
              </View>

              <Text style={styles.userEmail}>{user.email}</Text>
              {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="person-outline" size={32} color={ArtisanColors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome, Craft Enthusiast!</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to manage your orders, save items to your wishlist, or sell your own artisan creations.
            </Text>
            <View style={styles.guestButtons}>
              <PrimaryButton
                title="Sign In"
                onPress={() => router.push('/(auth)/login' as any)}
                style={styles.guestButton}
              />
              <PrimaryButton
                title="Create Account"
                onPress={() => router.push('/(auth)/register' as any)}
                variant="outline"
                style={styles.guestButton}
              />
            </View>
          </View>
        )}

        {/* Seller Studio Banner (if SELLER) */}
        {isSeller && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/seller/dashboard' as any)}
            style={styles.sellerBanner}>
            <View style={styles.sellerBannerContent}>
              <View style={styles.sellerIconCircle}>
                <Ionicons name="hammer-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.sellerTextContainer}>
                <Text style={styles.sellerBannerTitle}>Artisan Studio</Text>
                <Text style={styles.sellerBannerSubtitle}>
                  Manage {user?.sellerProfile?.shopName || 'your shop'}, inventory, & orders
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Customer Account Actions */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>My Marketplace</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/orders' as any)}>
            <View style={styles.menuIconCircle}>
              <Ionicons name="receipt-outline" size={20} color={ArtisanColors.primary} />
            </View>
            <Text style={styles.menuText}>Order History</Text>
            <Ionicons name="chevron-forward" size={18} color={ArtisanColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/favorites' as any)}>
            <View style={styles.menuIconCircle}>
              <Ionicons name="heart-outline" size={20} color={ArtisanColors.primary} />
            </View>
            <Text style={styles.menuText}>Wishlist</Text>
            <Ionicons name="chevron-forward" size={18} color={ArtisanColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/cart' as any)}>
            <View style={styles.menuIconCircle}>
              <Ionicons name="bag-handle-outline" size={20} color={ArtisanColors.primary} />
            </View>
            <Text style={styles.menuText}>Shopping Cart</Text>
            <Ionicons name="chevron-forward" size={18} color={ArtisanColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Become an Artisan CTA (if CUSTOMER) */}
        {user && !isSeller && (
          <View style={styles.becomeSellerCard}>
            <Ionicons name="sparkles" size={24} color={ArtisanColors.accent} />
            <View style={styles.becomeSellerText}>
              <Text style={styles.becomeSellerTitle}>Sell Your Creations</Text>
              <Text style={styles.becomeSellerSubtitle}>
                Join our collective of local craftsmen, potters, and weavers.
              </Text>
            </View>
            <PrimaryButton
              title="Open Shop"
              size="small"
              onPress={() => router.push('/(auth)/register?role=SELLER' as any)}
            />
          </View>
        )}

        {/* Sign Out Action */}
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={ArtisanColors.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ArtisanColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 154, 69, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: ArtisanColors.gold,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: ArtisanColors.text,
    letterSpacing: 0.3,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customerBadge: {
    backgroundColor: ArtisanColors.primaryLight,
  },
  sellerBadge: {
    backgroundColor: ArtisanColors.secondaryLight,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customerRoleText: {
    color: ArtisanColors.primary,
  },
  sellerRoleText: {
    color: ArtisanColors.secondary,
  },
  userEmail: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 2,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    marginBottom: 16,
    elevation: 2,
  },
  guestIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ArtisanColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  guestSubtitle: {
    fontSize: 13,
    color: ArtisanColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  guestButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  guestButton: {
    flex: 1,
  },
  sellerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ArtisanColors.secondary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    elevation: 4,
    shadowColor: ArtisanColors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  sellerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  sellerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerTextContainer: {
    flex: 1,
  },
  sellerBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sellerBannerSubtitle: {
    fontSize: 12,
    color: '#E0EAE2',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: ArtisanColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ArtisanColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  becomeSellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArtisanColors.accentLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
    marginBottom: 18,
    gap: 12,
  },
  becomeSellerText: {
    flex: 1,
  },
  becomeSellerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  becomeSellerSubtitle: {
    fontSize: 12,
    color: ArtisanColors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ArtisanColors.dangerLight,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: ArtisanColors.danger,
  },
});
