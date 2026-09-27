import { useEffect, useState } from 'react';
import { adsAvailable, showRewarded } from './ads';
import { saveImage } from './imageSave';

// ONE app-wide lock for "watch ad → save HD image", shared by every Save button
// (wallpaper screen, image viewer). While it runs, every Save button is disabled and shows
// a loader, and extra taps are ignored until the ad AND the save have fully finished.
//
// phase: null (idle) | 'ad' (rewarded ad loading / showing) | 'saving' (HD download + save)
let phase = null;
const listeners = new Set();
const setPhase = (p) => { phase = p; listeners.forEach((f) => f(p)); };
export const isSaveBusy = () => phase !== null;

// Resolves true if the reward was earned (or no ad could be shown), false if closed early.
function watchAd() {
  return new Promise((resolve) => {
    if (!adsAvailable()) return resolve(true);
    const started = showRewarded(() => resolve(true), () => resolve(true), () => resolve(false));
    if (started === false) resolve(false); // no-op if onFail already resolved it
  });
}

// url: the image URL, or an async function returning it (resolved after the ad).
// options.skipAd: true to save without an ad (e.g. already unlocked).
// Returns 'gallery' | 'share' | 'cancelled' | 'busy' | 'error'.
export async function rewardedSave(url, options = {}) {
  if (phase !== null) return 'busy';
  try {
    if (!options.skipAd) {
      setPhase('ad');
      const ok = await watchAd();
      if (!ok) return 'cancelled';
    }
    setPhase('saving');
    const u = typeof url === 'function' ? await url() : url;
    return await saveImage(u);
  } catch (e) {
    return 'error';
  } finally {
    setPhase(null);
  }
}

// For Save buttons:
//   const { saving, phase, save } = useRewardedSave();
//   saving → disable the button; phase 'ad' → "Loading ad…", 'saving' → "Saving HD…"
export function useRewardedSave() {
  const [p, setP] = useState(phase);
  useEffect(() => { listeners.add(setP); setP(phase); return () => listeners.delete(setP); }, []);
  return { saving: p !== null, phase: p, save: rewardedSave };
}