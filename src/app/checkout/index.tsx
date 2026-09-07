import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanColors } from '../../constants/colors';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ApiClient } from '../../services/apiClient';
import { Order } from '../../types';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { cart, total, clearCart } = useCart();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in or create an account to place your order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login' as any) },
      ]);
      return;
    }

    if (!shippingAddress.trim() || shippingAddress.trim().length < 10) {
      Alert.alert('Invalid Address', 'Please provide a complete shipping address (at least 10 characters).');
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      Alert.alert('Invalid Phone', 'Please provide a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiClient.post<{ success: boolean; data: Order }>('/orders', {
        shippingAddress: shippingAddress.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });

      if (res.data) {
        await clearCart();
        Alert.alert(
          'Order Placed Successfully! 🎉',
          `Your order #${res.data.orderNumber} has been received. Our local artisans will begin preparing your handmade items.`,
          [
            {
              text: 'View My Orders',
              onPress: () => router.replace('/orders' as any),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = cart?.items || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={ArtisanColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shipping Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={ArtisanColors.primary} />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>

          <InputField
            label="Recipient Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Sarah Jenkins"
            icon="person-outline"
          />

          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <InputField
            label="Complete Shipping Address"
            value={shippingAddress}
            onChangeText={setShippingAddress}
            placeholder="Street address, apartment or suite, city, state, postal code"
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />

          <InputField
            label="Delivery Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Leave package on the front porch"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={20} color={ArtisanColors.primary} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentOption}>
            <Ionicons name="checkmark-circle" size={22} color={ArtisanColors.primary} />
            <View style={styles.paymentOptionText}>
              <Text style={styles.paymentTitle}>Cash on Delivery / Direct Artisan Settlement</Text>
              <Text style={styles.paymentSubtitle}>
                Pay safely when your handmade goods arrive at your doorstep.
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color={ArtisanColors.primary} />
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={styles.summaryItemPrice}>${item.subtotal.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={[styles.totalValue, styles.freeShipping]}>Free</Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Place Order Button */}
        <PrimaryButton
          title={`Place Order • $${total.toFixed(2)}`}
          onPress={handlePlaceOrder}
          loading={isSubmitting}
          size="large"
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ArtisanColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    marginBottom: 16,
    elevation: 2,
    shadowColor: ArtisanColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArtisanColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ArtisanColors.primary,
    gap: 12,
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: ArtisanColors.textSecondary,
    marginTop: 2,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 14,
    color: ArtisanColors.textSecondary,
    marginRight: 10,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  divider: {
    height: 1,
    backgroundColor: ArtisanColors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: ArtisanColors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  freeShipping: {
    color: ArtisanColors.success,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderColor: ArtisanColors.borderLight,
    paddingTop: 10,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: ArtisanColors.primary,
  },
  submitButton: {
    marginTop: 8,
  },
});
