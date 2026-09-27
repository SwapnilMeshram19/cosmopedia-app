import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { httpsify } from './constants';

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

// Downloads a remote image into the app cache and returns { uri, mime, file }.
async function download(url) {
  url = httpsify(url);
  const ext = (url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i) || [, 'jpg'])[1].toLowerCase();
  const dir = new Directory(Paths.cache, 'cosmo-images');
  try { dir.create({ idempotent: true, intermediates: true }); } catch (e) {}
  const file = new File(dir, 'cosmopedia-' + Date.now() + '.' + ext);
  const out = await File.downloadFileAsync(url, file, { idempotent: true });
  return { uri: out.uri, mime: MIME[ext] || 'image/jpeg', file: out };
}

// Removes the temporary cache copy once it has been saved or shared.
function cleanup(file) { try { if (file && file.exists) file.delete(); } catch (e) {} }

// Saves to the phone's gallery (write-only access, no read permission needed).
// If gallery access isn't available (denied, or limited in Expo Go), falls back to the
// share sheet, where the user can pick "Save image" / Files / Drive.
// Returns 'gallery' or 'share'. Throws if the download itself fails.
// NASA image library links end in ~thumb / ~small / ~medium. Try the HD versions first,
// falling back step by step so a missing ~orig file never breaks the save.
function hdCandidates(url) {
  url = httpsify(url);
  const m = url.match(/^(https:\/\/images-assets\.nasa\.gov\/image\/.+?)~(thumb|small|medium|large|orig)(\.[a-z]+)$/i);
  if (!m) return [url];
  const [, base, , ext] = m;
  return [...new Set([base + '~orig' + ext, base + '~large' + ext, url])];
}

async function downloadHd(url) {
  let lastErr;
  for (const u of hdCandidates(url)) {
    try { return await download(u); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function doSave(url) {
  const { uri, mime, file } = await downloadHd(url);
  try {
    const ML = require('expo-media-library/legacy');
    const perm = await ML.requestPermissionsAsync(true, Platform.OS === 'android' ? ['photo'] : undefined);
    if (!perm.granted) throw new Error('no permission');
    await ML.saveToLibraryAsync(uri);
    cleanup(file);
    return 'gallery';
  } catch (e) {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Save image' });
      return 'share';
    }
    cleanup(file);
    throw e;
  }
}

export async function shareImage(url) {
  const { uri, mime } = await download(url);
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Share image' });
}

// Single-flight: while a save is running, extra calls get the same promise (no duplicate downloads).
let inflight = null;
export function saveImage(url) {
  if (inflight) return inflight;
  inflight = doSave(url).finally(() => { inflight = null; });
  return inflight;
}
export const isSaving = () => !!inflight;