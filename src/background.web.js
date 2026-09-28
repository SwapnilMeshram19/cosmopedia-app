// Web: no background tasks. The in-app polling in CosmoApp still runs while the page is open.
export const NEWS_TASK = 'cosmo-news-check';
export async function setNewsTask() {}
export async function runNewsTaskNow() { return false; }