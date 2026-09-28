// Web: OS notifications are skipped; the in-app banner still shows.
export const available = () => false;
export async function scheduleLaunch() { return null; }
export async function cancel() {}
export async function notifyNow() {}
export function onTap() { return () => {}; }
export async function askPermission() { return false; }