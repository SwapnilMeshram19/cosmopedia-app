import { Platform, PermissionsAndroid } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { httpsify } from './constants';
import CosmoGallery from '../modules/cosmo-gallery';

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

// Saves to the phone's gallery through the local CosmoGallery module (MediaStore).
// Needs no media-read permission; Android 9 and below ask for WRITE_EXTERNAL_STORAGE.
// Returns 'gallery'. Throws on any failure: Save never falls back to the share sheet.
async function doSave(url) {
  if (!CosmoGallery) throw new Error('Gallery saving needs a development/production build (not Expo Go)');
  if (Platform.OS === 'android' && Platform.Version < 29) {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (r !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Storage permission denied');
  }
  const { uri, mime, file } = await downloadHd(url);
  try {
    await CosmoGallery.saveImage(uri, mime, uri.split('/').pop());
    return 'gallery';
  } finally {
    cleanup(file);
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