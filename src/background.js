import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notify from './notify';

// Checks Spaceflight News for a new story while the app is in the background and posts a
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

TaskManager.defineTask(NEWS_TASK, async () => {
  const OK = BackgroundTask.BackgroundTaskResult.Success;
  try {
    if (!(await read('cosmo_newsalerts', false))) return OK;
    const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=1');
    if (!res.ok) return OK; // rate limit / server error: just try on the next run
    const j = await res.json();
    const a = j && Array.isArray(j.results) ? j.results[0] : null;
    if (!a || typeof a.id !== 'number' || typeof a.title !== 'string') return OK;
    const last = await read('cosmo_lastseen', 0);
    if (a.id > last) {
      await AsyncStorage.setItem('cosmo_lastseen', JSON.stringify(a.id));
      // `last` is 0 on the very first check: record the id without notifying about an old story.
      if (last) await Notify.notifyNow('Breaking · ' + (a.news_site || 'Space news'), a.title, { tab: 'news', articleId: a.id });
    }
    return OK;
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