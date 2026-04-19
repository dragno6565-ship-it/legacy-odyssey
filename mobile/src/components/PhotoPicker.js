import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import client, { BASE_URL } from '../api/client';
import PhotoEditor from './PhotoEditor';

/**
 * Extract the Supabase Storage path from a full public URL.
 * e.g., "https://xxx.supabase.co/storage/v1/object/public/photos/familyId/section/file.jpg"
 *   -> "familyId/section/file.jpg"
 */
function extractStoragePath(photoUrl) {
  if (!photoUrl) return null;
  if (!photoUrl.startsWith('http')) return photoUrl;
  const marker = '/photos/';
  const idx = photoUrl.indexOf(marker);
  if (idx !== -1) return photoUrl.substring(idx + marker.length);
  return null;
}

export default function PhotoPicker({ currentPhoto, onPhotoSelected }) {
  const [uploading, setUploading] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  // Current focal point for the displayed photo (percentages 0-100)
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });

  // Load saved focal point when the photo URL changes
  useEffect(() => {
    setFocalPoint({ x: 50, y: 50 });
  }, [currentPhoto]);

  function getPhotoUri(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to choose photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0]);
    }
  }

  async function uploadPhoto(asset) {
    setUploading(true);
    try {
      const formData = new FormData();
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', { uri, name: filename, type });

      const res = await client.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const photoUrl = res.data.url || res.data.path || res.data.storagePath;
      if (photoUrl) {
        onPhotoSelected(photoUrl);
        setFocalPoint({ x: 50, y: 50 });
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  }

  /**
   * Called when user saves from PhotoEditor.
   * If they rotated the photo, we re-upload the rotated file.
   * Then we save the focal point via the API.
   */
  async function handleEditorSave({ uri, rotated, x, y }) {
    setEditorVisible(false);
    setUploading(true);
    try {
      let finalPhotoUrl = currentPhoto;

      // If rotated, re-upload the rotated image
      if (rotated) {
        const filename = uri.split('/').pop() || 'photo.jpg';
        const formData = new FormData();
        formData.append('file', { uri, name: filename, type: 'image/jpeg' });

        const res = await client.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalPhotoUrl = res.data.url || res.data.path || res.data.storagePath || currentPhoto;

        // Notify parent of the new URL
        if (finalPhotoUrl !== currentPhoto) {
          onPhotoSelected(finalPhotoUrl);
        }
      }

      // Save focal point
      const storagePath = extractStoragePath(finalPhotoUrl);
      if (storagePath) {
        await client.put('/api/books/mine/photo-position', { storagePath, x, y });
      }

      setFocalPoint({ x, y });
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save photo adjustments.');
    } finally {
      setUploading(false);
    }
  }

  function confirmRemovePhoto() {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: removePhoto },
      ]
    );
  }

  async function removePhoto() {
    setUploading(true);
    try {
      const storagePath = extractStoragePath(currentPhoto);
      if (storagePath) {
        try {
          await client.delete(`/api/photos/${encodeURIComponent(storagePath)}`);
        } catch (err) {
          console.warn('Photo storage delete error:', err.message);
        }
      }
      onPhotoSelected(null);
    } catch (err) {
      Alert.alert('Error', 'Could not remove photo.');
    } finally {
      setUploading(false);
    }
  }

  function showOptions() {
    const options = [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
    ];

    if (currentPhoto) {
      options.push({
        text: 'Adjust Photo (Rotate / Reposition)',
        onPress: () => setEditorVisible(true),
      });
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: confirmRemovePhoto,
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Photo', 'Select an option', options);
  }

  const photoUri = getPhotoUri(currentPhoto);

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: photoUri }}
            style={styles.preview}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>{'\u{1F4F7}'}</Text>
          <Text style={styles.placeholderText}>No photo yet</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={showOptions}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {currentPhoto ? 'Change / Edit Photo' : 'Choose Photo'}
          </Text>
        )}
      </TouchableOpacity>

      <PhotoEditor
        visible={editorVisible}
        photoUri={photoUri}
        initialPos={focalPoint}
        onSave={handleEditorSave}
        onCancel={() => setEditorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  previewWrap: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  button: {
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadingText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});
