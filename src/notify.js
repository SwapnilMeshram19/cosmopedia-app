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

let ready = null;
async function ensure() {
  const Notifications = mod();
  if (!Notifications) return false;
  if (ready !== null) return ready;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Cosmopedia alerts', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const cur = await Notifications.getPermissionsAsync();
    let ok = cur.granted;
    if (!ok) ok = (await Notifications.requestPermissionsAsync()).granted;
    ready = ok;
  } catch (e) { ready = false; }
  return ready;
}

// Real OS notification 1 hour before a launch
export async function scheduleLaunch(launch) {
  if (!(await ensure())) return null;
  const Notifications = mod();
  const at = new Date(new Date(launch.net).getTime() - 3600e3);
  if (at.getTime() <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: launch.name + ' launches in 1 hour', body: 'Open Cosmopedia to follow the countdown.', data: { tab: 'today' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  } catch (e) { return null; }
}

export async function cancel(id) {
  const Notifications = mod();
  if (id && Notifications) { try { await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {} }
}

export async function notifyNow(title, body, data) {
  if (!(await ensure())) return;
  const Notifications = mod();
  try { await Notifications.scheduleNotificationAsync({ content: { title, body, data: data || {} }, trigger: null }); } catch (e) {}
}

export const askPermission = ensure;
