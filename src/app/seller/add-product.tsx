import React, { useState, useEffect } from 'react';
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
import { ApiClient } from '../../services/apiClient';
import { Category, Product } from '../../types';

export default function AddProductScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await ApiClient.get<{ success: boolean; data: Category[] }>('/categories');
      if (res.data && res.data.length > 0) {
        setCategories(res.data);
        setCategoryId(res.data[0].id);
      }
    } catch {
      // Ignored
    }
  };

  const handleCreateProduct = async () => {
    if (!name.trim() || !description.trim() || !price || !stock || !categoryId) {
      Alert.alert('Missing Fields', 'Please complete all required product details.');
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Price must be a positive number.');
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Invalid Stock', 'Stock must be an integer (0 or greater).');
      return;
    }

    setIsSubmitting(true);
    try {
      const imagesPayload = imageUrl.trim()
        ? [{ imageUrl: imageUrl.trim(), isPrimary: true }]
        : [
            {
              imageUrl:
                'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
            },
          ];

      await ApiClient.post<{ success: boolean; data: Product }>('/products', {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        categoryId,
        images: imagesPayload,
      });

      Alert.alert('Product Published! ✨', `"${name}" is now live in your artisan catalog.`, [
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Publication Error', err.message || 'Could not publish product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={ArtisanColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Handcrafted Product</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InputField
          label="Product Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Hand-Thrown Earthenware Vase"
        />

        {/* Category Picker */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Craft Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}>
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            <InputField
              label="Price ($ USD)"
              value={price}
              onChangeText={setPrice}
              placeholder="48.50"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.halfField}>
            <InputField
              label="Available Stock"
              value={stock}
              onChangeText={setStock}
              placeholder="10"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <InputField
          label="Primary Image URL"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://images.unsplash.com/..."
        />

        <InputField
          label="Craft Story & Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Share how this product was crafted, the natural materials used, and care instructions..."
          multiline
          numberOfLines={4}
          style={styles.multilineInput}
        />

        <PrimaryButton
          title="Publish Product"
          onPress={handleCreateProduct}
          loading={isSubmitting}
          size="large"
          style={styles.publishBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ArtisanColors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ArtisanColors.text,
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    backgroundColor: ArtisanColors.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
    marginRight: 8,
  },
  categoryPillSelected: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: ArtisanColors.textSecondary,
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  publishBtn: {
    marginTop: 10,
  },
});
