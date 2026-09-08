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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArtisanColors } from '../../constants/colors';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ApiClient } from '../../services/apiClient';
import { API_BASE_URL } from '../../constants/api';
import { Category, Product } from '../../types';

const CRAFT_PRESETS = [
  {
    id: 'pottery',
    name: '🏺 Pottery Vase',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'leather',
    name: '👜 Leather Bag',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'jewelry',
    name: '💍 Silver Ring',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'textile',
    name: '🧣 Woven Scarf',
    url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
  },
];

export default function AddProductScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState(CRAFT_PRESETS[0].url);
  const [previewUri, setPreviewUri] = useState<string | null>(CRAFT_PRESETS[0].url);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

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

  /**
   * Pick image from phone gallery
   */
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Permission Needed',
          'Please allow access to your device photos to upload your artisan crafts.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        await uploadImageBase64(asset);
      }
    } catch (err: any) {
      Alert.alert('Image Selection Error', err.message || 'Could not choose image');
    }
  };

  /**
   * Take photo using camera
   */
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Please allow camera access to take a photo of your craft creation.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        await uploadImageBase64(asset);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not capture photo');
    }
  };

  /**
   * Upload image to backend via /api/upload/base64 using pure JSON (immune to FormData bugs)
   */
  const uploadImageBase64 = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingImage(true);
    try {
      if (!asset.base64) {
        throw new Error('Image data could not be read.');
      }

      const filename = asset.fileName || `craft-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';

      const token = await AsyncStorage.getItem('auth_token');
      const uploadUrl = `${API_BASE_URL}/upload/base64`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          base64: asset.base64,
          filename,
          mimeType,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.data) {
        throw new Error(json.message || 'Upload failed');
      }

      const uploadedUrl = json.data.imageUrl;
      setImageUrl(uploadedUrl);
      setPreviewUri(uploadedUrl);
      Alert.alert('Upload Complete! 📸', 'Craft image uploaded and ready for publishing.');
    } catch (err: any) {
      Alert.alert(
        'Upload Error',
        `${err.message || 'Could not upload image'}. You can still use a preset craft photo.`
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setImageUrl(url);
    setPreviewUri(url);
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
      const finalImage = imageUrl.trim() || CRAFT_PRESETS[0].url;

      await ApiClient.post<{ success: boolean; data: Product }>('/products', {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        categoryId,
        images: [{ imageUrl: finalImage, isPrimary: true }],
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

        {/* ============================================================ */}
        {/* IMAGE UPLOAD SECTION                                          */}
        {/* ============================================================ */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Craft Photo</Text>

          {/* Photo Preview & Upload Card */}
          <View style={styles.uploadCard}>
            {previewUri ? (
              <View style={styles.previewRow}>
                <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="cover" />
                <View style={styles.previewMeta}>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {isUploadingImage ? 'Uploading photo...' : 'Photo Selected'}
                  </Text>
                  <Text style={styles.previewSubtitle}>
                    {isUploadingImage ? 'Streaming to server...' : 'Ready for publishing'}
                  </Text>
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color={ArtisanColors.primary} style={{ marginTop: 6, alignSelf: 'flex-start' }} />
                  ) : (
                    <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoBtn}>
                      <Ionicons name="camera-outline" size={14} color={ArtisanColors.primary} />
                      <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.emptyUploadBox} onPress={handlePickImage}>
                <Ionicons name="cloud-upload-outline" size={32} color={ArtisanColors.primary} />
                <Text style={styles.uploadPromptTitle}>Upload Craft Photo</Text>
                <Text style={styles.uploadPromptSubtitle}>Tap to browse photos on your device</Text>
              </TouchableOpacity>
            )}

            {/* Quick Action Buttons: Gallery & Camera */}
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handlePickImage}
                disabled={isUploadingImage}>
                <Ionicons name="images-outline" size={16} color={ArtisanColors.primary} />
                <Text style={styles.photoActionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handleTakePhoto}
                disabled={isUploadingImage}>
                <Ionicons name="camera-outline" size={16} color={ArtisanColors.secondary} />
                <Text style={styles.photoActionText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Curated Craft Photo Presets */}
            <View style={styles.presetsSection}>
              <Text style={styles.presetsLabel}>Or choose a sample craft photo:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {CRAFT_PRESETS.map((preset) => {
                  const isCurrent = imageUrl === preset.url;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => handleSelectPreset(preset.url)}
                      style={[styles.presetChip, isCurrent && styles.presetChipActive]}>
                      <Text style={[styles.presetChipText, isCurrent && styles.presetChipTextActive]}>
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Optional Manual URL toggle */}
            <TouchableOpacity
              onPress={() => setShowManualUrl(!showManualUrl)}
              style={styles.manualUrlToggle}>
              <Text style={styles.manualUrlToggleText}>
                {showManualUrl ? '▲ Hide URL input' : '▼ Or enter custom web image URL'}
              </Text>
            </TouchableOpacity>

            {showManualUrl && (
              <InputField
                label="Custom Image URL"
                value={imageUrl}
                onChangeText={(val) => {
                  setImageUrl(val);
                  setPreviewUri(val);
                }}
                placeholder="https://images.unsplash.com/..."
              />
            )}
          </View>
        </View>

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
          disabled={isUploadingImage}
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
  uploadCard: {
    backgroundColor: ArtisanColors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ArtisanColors.border,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: ArtisanColors.surfaceSecondary,
  },
  previewMeta: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  previewSubtitle: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 2,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.primary,
  },
  emptyUploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: ArtisanColors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  uploadPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ArtisanColors.text,
    marginTop: 8,
  },
  uploadPromptSubtitle: {
    fontSize: 12,
    color: ArtisanColors.textMuted,
    marginTop: 2,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ArtisanColors.borderLight,
    gap: 6,
  },
  photoActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ArtisanColors.text,
  },
  presetsSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ArtisanColors.borderLight,
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ArtisanColors.textSecondary,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ArtisanColors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  presetChipActive: {
    backgroundColor: ArtisanColors.primary,
    borderColor: ArtisanColors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ArtisanColors.text,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  manualUrlToggle: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  manualUrlToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ArtisanColors.textMuted,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  publishBtn: {
    marginTop: 14,
  },
});
