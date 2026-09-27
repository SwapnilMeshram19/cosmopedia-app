import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { httpsify } from './constants';

// Downloads a remote image into the app cache and returns the local file URI.
async function download(url) {
  url = httpsify(url);
  const ext = (url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i) || [, 'jpg'])[1].toLowerCase();
  const dir = new Directory(Paths.cache, 'cosmo-images');
  try { dir.create({ idempotent: true, intermediates: true }); } catch (e) {}
  const file = new File(dir, 'cosmopedia-' + Date.now() + '.' + ext);
  const out = await File.downloadFileAsync(url, file, { idempotent: true });
  return out.uri;
}

// Saves to the phone's gallery. If gallery access isn't available (e.g. limited in Expo Go),
// falls back to the share sheet, where the user can pick "Save image" / Files / Drive.
export async function saveImage(url) {
  const uri = await download(url);
  try {
    const ML = require('expo-media-library/legacy');
    const perm = await ML.requestPermissionsAsync(true, Platform.OS === 'android' ? ['photo'] : undefined);
    if (!perm.granted) throw new Error('no permission');
    await ML.saveToLibraryAsync(uri);
    return 'gallery';
  } catch (e) {
    if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Save image' }); return 'share'; }
    throw e;
  }
}

export async function shareImage(url) {
  const uri = await download(url);
  await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Share image' });
}
