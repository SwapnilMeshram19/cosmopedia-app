import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { isExpoGo } from './env';

// Real AdMob in a development/production build. In Expo Go the native module is missing, so
// ad calls fall back to the simulated countdown and banners show placement placeholders.
let GMA = null;
if (!isExpoGo) { try { GMA = require('react-native-google-mobile-ads'); } catch (e) { GMA = null; } }

// Your AdMob IDs. App ID (ca-app-pub-1294432140413899~2920845178) is set in app.json.
// Add an interstitial unit in AdMob and paste it below to turn on real interstitials.
export const ADMOB_UNITS = {
  banner: 'ca-app-pub-1294432140413899/7378045065',
  reward: 'ca-app-pub-1294432140413899/5243845473',
  interstitial: '',
};

// Test ads: dev builds and builds with EXPO_PUBLIC_ADS_TEST=1. Real units otherwise.
export const USE_TEST_ADS = __DEV__ || process.env.EXPO_PUBLIC_ADS_TEST === '1';
// Ad debug panel (More tab) + on-screen errors: dev builds and builds with EXPO_PUBLIC_AD_DEBUG=1.
export const AD_DEBUG = __DEV__ || USE_TEST_ADS || process.env.EXPO_PUBLIC_AD_DEBUG === '1';

// Can be switched at runtime from the debug panel to check placements with Google test ads.
let forceTest = false;
export const setForceTestAds = (on) => { forceTest = !!on; log('switched to ' + (on ? 'Google TEST ads' : 'REAL ad units')); };
export const usingTestAds = () => USE_TEST_ADS || forceTest;

const unit = (k) => {
  if (!GMA) return null;
  if (usingTestAds()) return { banner: GMA.TestIds.ADAPTIVE_BANNER, reward: GMA.TestIds.REWARDED, interstitial: GMA.TestIds.INTERSTITIAL }[k];
  return ADMOB_UNITS[k] || null;
};

/* ---------- ad event log (shown in the debug panel) ---------- */
const LOG = [];
const listeners = new Set();
function log(...a) {
  const msg = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  LOG.unshift(new Date().toLocaleTimeString() + '  ' + msg);
  if (LOG.length > 40) LOG.pop();
  listeners.forEach((f) => f(LOG.slice()));
  if (__DEV__) console.log('[AdMob]', msg);
}
export function useAdLog() {
  const [l, setL] = useState(LOG.slice());
  useEffect(() => { listeners.add(setL); return () => listeners.delete(setL); }, []);
  return l;
}
const errText = (e) => (e && (e.code ? e.code + ': ' : '') + (e.message || String(e))) || 'unknown error';

export const adsAvailable = () => !!GMA;

export async function initAds() {
  if (!GMA) { log('AdMob not available here (Expo Go or web)'); return; }
  try { await GMA.AdsConsent.gatherConsent(); log('consent ok'); } catch (e) { log('consent error', errText(e)); }
  try {
    const devices = (process.env.EXPO_PUBLIC_ADMOB_TEST_DEVICES || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (devices.length) await GMA.default().setRequestConfiguration({ testDeviceIdentifiers: ['EMULATOR', ...devices] });
    await GMA.default().initialize();
    log('initialized · ' + (usingTestAds() ? 'Google TEST ads' : 'REAL ad units'));
  } catch (e) { log('init failed', errText(e)); }
}

// Google's Ad Inspector: every ad request, fill status and error on the device.
export function openAdInspector() { if (GMA) GMA.default().openAdInspector().catch((e) => log('inspector', errText(e))); }

// Shows a rewarded ad. onReward runs only if the user earned it; onFail lets the caller fall back.
export function showRewarded(onReward, onFail) {
  const id = unit('reward');
  if (!GMA || !id) return onFail && onFail();
  let earned = false, done = false;
  const ad = GMA.RewardedAd.createForAdRequest(id);
  const subs = [];
  const finish = (ok) => { if (done) return; done = true; subs.forEach((u) => u && u()); clearTimeout(to); ok ? onReward() : (onFail && onFail()); };
  const to = setTimeout(() => { log('rewarded timeout (no ad in 10s)'); finish(false); }, 10000);
  subs.push(ad.addAdEventListener(GMA.RewardedAdEventType.LOADED, () => { log('rewarded loaded'); clearTimeout(to); ad.show().catch((e) => { log('rewarded show error', errText(e)); finish(false); }); }));
  subs.push(ad.addAdEventListener(GMA.RewardedAdEventType.EARNED_REWARD, () => { log('reward earned'); earned = true; }));
  subs.push(ad.addAdEventListener(GMA.AdEventType.CLOSED, () => { if (earned) finish(true); else { log('rewarded closed early'); done = true; subs.forEach((u) => u && u()); } }));
  subs.push(ad.addAdEventListener(GMA.AdEventType.ERROR, (e) => { log('rewarded error', errText(e)); finish(false); }));
  log('rewarded requested');
  ad.load();
}

// Returns true if a real interstitial is being loaded/shown.
export function showInterstitial() {
  const id = unit('interstitial');
  if (!GMA || !id) return false;
  const ad = GMA.InterstitialAd.createForAdRequest(id);
  const subs = [];
  const off = () => subs.forEach((u) => u && u());
  subs.push(ad.addAdEventListener(GMA.AdEventType.LOADED, () => { log('interstitial loaded'); ad.show().catch(() => {}); }));
  subs.push(ad.addAdEventListener(GMA.AdEventType.ERROR, (e) => { log('interstitial error', errText(e)); off(); }));
  subs.push(ad.addAdEventListener(GMA.AdEventType.CLOSED, off));
  ad.load();
  return true;
}

export const bannerEnabled = () => !!GMA && !!unit('banner');

// Shows a rewarded ad, then runs `action`. If ads aren't available or no ad loads,
// the action still runs so users are never blocked. Closing the ad early cancels it.
export function withReward(action) {
  if (!GMA || !unit('reward')) return action();
  showRewarded(action, action);
}

// Placeholder only while developing in Expo Go (where AdMob can't run).
function Placeholder({ label, height }) {
  if (!__DEV__) return null;
  return (
    <View style={{ height, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(127,214,160,.6)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(127,214,160,.06)' }}>
      <Text style={{ color: '#7fd6a0', fontSize: 11, fontFamily: 'IBMPlexMono_500Medium' }}>AD · {label} (real ad in installed build)</Text>
    </View>
  );
}

// In debug builds a failed banner shows a one-line reason instead of empty space.
function FailNote({ error }) {
  if (!AD_DEBUG) return null;
  return <Text style={{ color: '#ff9b9b', fontSize: 10, fontFamily: 'IBMPlexMono_400Regular', textAlign: 'center', paddingVertical: 4 }}>ad failed · {error}</Text>;
}

// One banner. Takes no space until it loads; collapses if AdMob has no ad for it.
function Banner({ size, maxHeight, where, label, labelColor, frameStyle }) {
  const id = unit('banner');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  if (status === 'failed') return <FailNote error={error} />;
  const loaded = status === 'loaded';
  return (
    <View style={[{ alignItems: 'center' }, loaded && frameStyle]}>
      {loaded && !!label && <Text style={{ alignSelf: 'flex-start', color: labelColor || '#f0b46a', fontSize: 9.5, letterSpacing: 1.1, fontFamily: 'IBMPlexMono_500Medium', marginBottom: 8 }}>{label}</Text>}
      <GMA.BannerAd
        key={id}
        unitId={id}
        size={size}
        maxHeight={maxHeight}
        onAdLoaded={() => { setStatus('loaded'); log('banner loaded · ' + where); }}
        onAdFailedToLoad={(e) => { setStatus('failed'); setError(errText(e)); log('banner failed · ' + where, errText(e)); }}
      />
    </View>
  );
}

// Anchored banner pinned to the bottom of a screen (above the tab bar / inside overlays).
export function BottomBanner({ padBottom = 0, bg = 'transparent', line }) {
  if (!GMA || !unit('banner')) {
    return __DEV__ ? <View style={{ padding: 4, paddingBottom: padBottom + 4, backgroundColor: bg }}><Placeholder label="bottom banner" height={50} /></View> : null;
  }
  return (
    <View style={{ backgroundColor: bg, paddingBottom: padBottom, borderTopWidth: line ? 1 : 0, borderTopColor: line }}>
      <Banner size={GMA.BannerAdSize.ANCHORED_ADAPTIVE_BANNER} where="bottom" />
    </View>
  );
}

// In-page banner between sections.
// kind: 'horizontal' (inline adaptive) | 'rectangle' (300×250) | 'native' (320×50 in a "Sponsored" card)
export function AdSlot({ kind = 'horizontal', label, frameStyle, labelColor }) {
  if (!GMA || !unit('banner')) {
    return <Placeholder label={kind === 'rectangle' ? 'rectangle banner' : 'banner'} height={kind === 'rectangle' ? 250 : 60} />;
  }
  const size = kind === 'rectangle' ? GMA.BannerAdSize.MEDIUM_RECTANGLE
    : kind === 'native' ? GMA.BannerAdSize.BANNER : GMA.BannerAdSize.INLINE_ADAPTIVE_BANNER;
  return <Banner size={size} maxHeight={kind === 'horizontal' ? 120 : undefined} where={kind} label={label} labelColor={labelColor} frameStyle={frameStyle} />;
}
