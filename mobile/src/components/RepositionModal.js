import React from 'react';
import { Alert } from 'react-native';
import PhotoEditor from './PhotoEditor';
import client from '../api/client';

/**
 * Reposition (focal point) a gallery photo so faces aren't cropped on the
 * website. Reuses PhotoEditor; saves the focal point to books.photo_positions
 * (keyed by the photo's storage path — the viewer honors it via photoPos()).
 *
 * Note: PhotoEditor also offers rotate, but rotating re-uploads to a NEW path
 * which a gallery row wouldn't pick up — so for gallery photos this modal is for
 * REPOSITION. (Rotating a gallery photo isn't persisted here; reposition is.)
 */
// Match the viewer's photoPos() key: strip a full URL down to the storage path,
// otherwise use the path as-is.
function toStorageKey(p) {
  if (!p) return null;
  if (p.startsWith('http')) {
    const i = p.indexOf('/photos/');
    return i !== -1 ? p.substring(i + '/photos/'.length) : p;
  }
  return p;
}

export default function RepositionModal({ visible, photoUri, photoPath, onClose }) {
  async function onSave({ x, y }) {
    try {
      const sp = toStorageKey(photoPath || photoUri);
      if (sp) await client.put('/api/books/mine/photo-position', { storagePath: sp, x, y });
    } catch (e) {
      Alert.alert('Could not save', 'Please try again.');
    }
    if (onClose) onClose();
  }
  if (!visible || !photoUri) return null;
  return (
    <PhotoEditor
      visible={visible}
      photoUri={photoUri}
      initialPos={{ x: 50, y: 50 }}
      onSave={onSave}
      onCancel={onClose}
    />
  );
}
