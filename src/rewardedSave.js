import { useEffect, useState } from 'react';
import { adsAvailable, showRewarded } from './ads';
import { saveImage } from './imageSave';

// ONE app-wide lock for "watch ad → save HD image".
// Shared by every Save button (wallpaper screen, lightbox, detail page), so the user can
// never start a second ad or download until the current one has fully finished.
let busy = false;
const listeners = new Set();
const setBusy = (v) => { busy = v; listeners.forEach((f) => f(v)); };
export const isSaveBusy = () => busy;

// Resolves true if the reward was earned (or no ad could be shown), false if closed early.
function watchAd() {
  return new Promise((resolve) => {
    if (!adsAvailable()) return resolve(true);
    const started = showRewarded(() => resolve(true), () => resolve(true), () => resolve(false));
    if (started === false) resolve(false); // no-op if onFail already resolved it
  });
}

// Returns 'gallery' | 'share' | 'cancelled' | 'busy' | 'error'.
// options.skipAd: true to save without an ad (e.g. already unlocked).
export async function rewardedSave(url, options = {}) {
  if (busy) return 'busy';
  setBusy(true);
  try {
    if (!options.skipAd) {
      const ok = await watchAd();
      if (!ok) return 'cancelled';
    }
    return await saveImage(url);
  } catch (e) {
    return 'error';
  } finally {
    setBusy(false);
  }
}

// Hook for Save buttons: const { saving, save } = useRewardedSave();
// <Pressable disabled={saving} onPress={() => save(url)} />
export function useRewardedSave() {
  const [saving, setSaving] = useState(busy);
  useEffect(() => { listeners.add(setSaving); return () => listeners.delete(setSaving); }, []);
  return { saving, save: rewardedSave };
}