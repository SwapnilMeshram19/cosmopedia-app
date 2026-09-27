// Web: no AdMob. Returning "unavailable" makes the app use the simulated ad countdown, like the original PWA.
export const ADMOB_UNITS = { banner: '', reward: '', interstitial: '' };
export const adsAvailable = () => false;
export async function initAds() {}
export function showRewarded(onReward, onFail) { onFail && onFail(); }
export function showInterstitial() { return false; }
export function AdSlot() { return null; }
export const USE_TEST_ADS = false;
export function openAdInspector() {}
export const bannerEnabled = () => false;
export function withReward(action) { return action(); }
export function BottomBanner() { return null; }
export const AD_DEBUG = false;
export const setForceTestAds = () => {};
export const usingTestAds = () => false;
export function useAdLog() { return []; }

export const isRewardedBusy = () => false;