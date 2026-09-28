import AsyncStorage from '@react-native-async-storage/async-storage';

// Same keys as the web app's localStorage. Loaded once at startup so reads stay synchronous.
const KEYS = ['cosmo_theme', 'cosmo_quiz2', 'cosmo_newsalerts', 'cosmo_issalerts', 'cosmo_saved', 'cosmo_remind',
  'cosmo_streak', 'cosmo_stats', 'cosmo_lastseen', 'cosmo_loc', 'cosmo_lang', 'cosmo_kg', 'cosmo_notif_ids', 'cosmo_adtest'];
const cache = {};

export const LS = {
  async init() {
    try {
      const pairs = await AsyncStorage.multiGet(KEYS);
      pairs.forEach(([k, v]) => { if (v != null) { try { cache[k] = JSON.parse(v); } catch (e) {} } });
    } catch (e) {}
  },
  get(k, d) { return k in cache ? cache[k] : d; },
  set(k, v) { cache[k] = v; AsyncStorage.setItem(k, JSON.stringify(v)).catch(() => {}); },
  // Re-reads one key from disk (e.g. after the background task changed it).
  async reload(k) {
    try { const v = await AsyncStorage.getItem(k); if (v != null) cache[k] = JSON.parse(v); } catch (e) {}
    return cache[k];
  },
};