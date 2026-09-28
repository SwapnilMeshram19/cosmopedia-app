import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notify from './notify';

// Checks Spaceflight News (all news and/or ISRO news) for a new story while the app is in the background and posts a
// local notification. Runs through WorkManager: roughly every 30 min, never exact, and
// aggressive OEM battery savers (Xiaomi, Oppo, Vivo, Realme) may skip it for swiped-away apps.
//
// This file must be imported at module scope from index.js so the task is defined even when
// Android starts the app headless to run it.

export const NEWS_TASK = 'cosmo-news-check';

// The task can run without the UI, so it reads AsyncStorage directly (the LS cache may be empty).
async function read(key, fallback) {
  try { const v = await AsyncStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}

// Latest article for a search term ('' = all news). Returns null on any error or bad response.
async function latest(search) {
  try {
    const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=1' + (search ? '&search=' + encodeURIComponent(search) : ''));
    if (!res.ok) return null; // rate limit / server error: try on the next run
    const j = await res.json();
    const a = j && Array.isArray(j.results) ? j.results[0] : null;
    return a && typeof a.id === 'number' && typeof a.title === 'string' ? a : null;
  } catch (e) { return null; }
}

// Notifies once per new article. The first check for a feed only records the id (no alert
// about an old story). Returns the id it notified about, or null.
async function checkFeed(search, key, prefix, skipId) {
  const a = await latest(search);
  if (!a) return null;
  const last = await read(key, 0);
  if (a.id <= last) return null;
  await AsyncStorage.setItem(key, JSON.stringify(a.id));
  if (!last || a.id === skipId) return null;
  await Notify.notifyNow(prefix + (a.news_site || 'Space news'), a.title, { tab: 'news', articleId: a.id });
  return a.id;
}

TaskManager.defineTask(NEWS_TASK, async () => {
  try {
    const all = await read('cosmo_newsalerts', false), isro = await read('cosmo_isroalerts', false);
    const sent = all ? await checkFeed('', 'cosmo_lastseen', 'Breaking · ', null) : null;
    // Skip the ISRO alert if the same story was just sent as a general alert.
    if (isro) await checkFeed('isro', 'cosmo_lastseen_isro', 'ISRO · ', sent);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Turns the background check on or off. Safe to call repeatedly.
export async function setNewsTask(on) {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(NEWS_TASK);
    if (on && !registered) await BackgroundTask.registerTaskAsync(NEWS_TASK, { minimumInterval: 30 }); // minutes (Android minimum is 15)
    if (!on && registered) await BackgroundTask.unregisterTaskAsync(NEWS_TASK);
  } catch (e) {}
}

// Debug only: runs the task immediately (use from the ad-debug panel to test).
export async function runNewsTaskNow() {
  try { await BackgroundTask.triggerTaskWorkerForTestingAsync(); return true; } catch (e) { return false; }
}