import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';

/**
 * Launch the system photo picker in multi-select mode and upload each chosen
 * image to /api/upload. Returns the uploaded photo URLs/paths in pick order.
 *
 * No media-library permission is requested on purpose: launchImageLibraryAsync
 * uses the out-of-process system picker (Android Photo Picker / iOS picker),
 * which needs no permission and keeps "Search" enabled. See PhotoPicker.js.
 *
 * @param {object}   opts
 * @param {number}   opts.limit       max images per pick (default 20)
 * @param {function} opts.onProgress  (done, total) => void, called per upload
 * @returns {Promise<{ canceled: boolean, paths: string[] }>}
 */
export async function pickAndUploadPhotos({ limit = 20, onProgress } = {}) {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.85,
  });
  if (picked.canceled || !picked.assets || picked.assets.length === 0) {
    return { canceled: true, paths: [] };
  }

  const assets = picked.assets;
  const paths = [];
  for (let i = 0; i < assets.length; i++) {
    if (onProgress) onProgress(i, assets.length);
    const asset = assets[i];
    const formData = new FormData();
    const filename = asset.uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('file', { uri: asset.uri, name: filename, type });
    const upRes = await client.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const photoPath = upRes.data.url || upRes.data.path || upRes.data.storagePath;
    if (photoPath) paths.push(photoPath);
  }
  if (onProgress) onProgress(assets.length, assets.length);
  return { canceled: false, paths };
}
