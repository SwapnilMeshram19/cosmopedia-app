import { Platform } from 'react-native';
import { isExpoGo } from './env';

// expo-notifications crashes on import inside Expo Go on Android (SDK 53+), so it is loaded lazily
// and only in a development/production build. In Expo Go the app still shows its in-app alert banner.
let N = null;
function mod() {
  if (N !== null) return N;
  if (isExpoGo && Platform.OS === 'android') { N = false; return N; }
  try {
    N = require('expo-notifications');
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
  } catch (e) { N = false; }
  return N;
}

// True when real OS notifications can work in this binary (false in Expo Go / web).
export const available = () => !!mod();

let channelReady = false;
// prompt = true: show the system permission dialog if needed (only from a user tap).
// prompt = false: just check (startup re-sync, background task). Never caches a "no",
// so enabling notifications later in system Settings takes effect without a restart.
async function ensure(prompt = true) {
  const Notifications = mod();
  if (!Notifications) return false;
  try {
    // Separate channels, so people can mute one kind in phone Settings and keep the others.
    if (Platform.OS === 'android' && !channelReady) {
      await Notifications.setNotificationChannelAsync('news', { name: 'Space news', description: 'New stories from the space news feed', importance: Notifications.AndroidImportance.HIGH });
      await Notifications.setNotificationChannelAsync('reminders', { name: 'Launch reminders', description: 'Alerts before launches you asked to be reminded about', importance: Notifications.AndroidImportance.HIGH });
      await Notifications.setNotificationChannelAsync('default', { name: 'Other alerts', importance: Notifications.AndroidImportance.DEFAULT });
      channelReady = true;
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!prompt || cur.canAskAgain === false) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch (e) { return false; }
}

// Real OS notification 1 hour before a launch. If liftoff is already less than an hour away,
// it fires in a few seconds with the actual minutes left. Returns the notification id or null.
export async function scheduleLaunch(launch, { prompt = true } = {}) {
  if (!launch || !launch.net) return null;
  const net = new Date(launch.net).getTime();
  if (!Number.isFinite(net) || net <= Date.now() + 60e3) return null; // unknown date or already launching
  if (!(await ensure(prompt))) return null;
  const Notifications = mod();
  const oneHourBefore = net - 3600e3;
  const at = Math.max(oneHourBefore, Date.now() + 5e3);
  const mins = Math.round((net - at) / 60e3);
  const title = mins >= 55 ? launch.name + ' launches in 1 hour' : launch.name + ' launches in ' + mins + ' min';
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body: 'Open Cosmopedia to follow the countdown.', data: { tab: 'launches', launchId: launch.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: 'reminders' },
    });
  } catch (e) { return null; }
}

export async function cancel(id) {
  const Notifications = mod();
  if (id && Notifications) { try { await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {} }
}

// Immediate notification. Never shows a permission dialog (it can run from the background task).
// channel: 'news' | 'reminders' | 'default' (Android notification channel).
export async function notifyNow(title, body, data, channel = 'default') {
  if (!(await ensure(false))) return;
  const Notifications = mod();
  const trigger = Platform.OS === 'android' ? { channelId: channel } : null;
  try { await Notifications.scheduleNotificationAsync({ content: { title, body, data: data || {} }, trigger }); } catch (e) {}
}

// Calls cb(data) when the user taps one of our notifications: while the app is running, and once
// for the notification that cold-started the app. Returns an unsubscribe function.
export function onTap(cb) {
  const Notifications = mod();
  if (!Notifications) return () => {};
  const handle = (resp) => {
    const data = resp && resp.notification && resp.notification.request && resp.notification.request.content && resp.notification.request.content.data;
    if (data && typeof data === 'object') cb(data);
  };
  let sub = null;
  try {
    const last = Notifications.getLastNotificationResponse();
    if (last) { handle(last); Notifications.clearLastNotificationResponse(); }
    sub = Notifications.addNotificationResponseReceivedListener((r) => { handle(r); try { Notifications.clearLastNotificationResponse(); } catch (e) {} });
  } catch (e) {}
  return () => { try { sub && sub.remove(); } catch (e) {} };
}

// true = allowed (asks if needed). Use from user actions only.
export const askPermission = () => ensure(true);