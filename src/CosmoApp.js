import React from 'react';
import { View, ScrollView, Appearance, AppState, BackHandler, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { captureRef } from 'react-native-view-shot';
import { StatusBar } from 'expo-status-bar';

import Astro from './astro';
import COSMOS from './data/cosmos.json';
import COSMOS_QUIZ from './data/quiz.json';
import COSMO_TX from './data/ui-strings.json';
import COSMOS_I18N from './data/content-i18n.json';
import COSMOS_QUIZ_I18N from './data/quiz-i18n.json';
import {
  CATS, NF, ago, F, DAY, rng, pickLevel, LETTERS, LEVELS, RANKS, BADGES, PLANETS, PCOL, GRAV, ECLIPSES, WALL_THEMES,
  OTD_FALLBACK, SPACE_RE, DEF_LOC, LANGS, TX, hav, moonDisc, httpsify,
} from './constants';
import { LS } from './storage';
import { makeTheme } from './theme';
import { ThemeCtx } from './components/ui';
import { rewardedSave, isSaveBusy, lastSaveError } from './rewardedSave';
import { shareImage } from './imageSave';
import { adsAvailable, showRewarded, showInterstitial, openAdInspector, AD_DEBUG, setForceTestAds, usingTestAds } from './ads';
import ErrorBoundary from './components/ErrorBoundary';
import * as Notify from './notify';
import { setNewsTask, runNewsTaskNow } from './background';
import { ShareCard } from './components/ShareCard';
import Overlays from './screens/Overlays';
import TabBar from './screens/TabBar';
import ExploreScreen from './screens/ExploreScreen';
import NewsScreen from './screens/NewsScreen';
import TodayScreen from './screens/TodayScreen';
import QuizScreen from './screens/QuizScreen';
import SkyScreen from './screens/SkyScreen';
import MoreScreens from './screens/MoreScreens';

// Your free key from https://api.nasa.gov, supplied at build time (EAS environment variable
// EXPO_PUBLIC_NASA_KEY). DEMO_KEY is only a fallback for local runs (~30 requests/hour per IP).
export const NASA_API_KEY = process.env.EXPO_PUBLIC_NASA_KEY || 'DEMO_KEY';
// Mirrors the web component's props
const PROPS = { showAds: true, interstitialEvery: 4 };

const OBJ = COSMOS.map((o) => ({ ...o, facts: o.facts.map(([k, v]) => ({ k, v })) }));
const QUIZ = COSMOS_QUIZ;

let LOCALE = 'en';
const fmt = (d) => new Date(d).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' });
const fmtD = (d) => new Date(d).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
const fmtT = (d) => new Date(d).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });

function locObj(o, lang) {
  if (lang === 'en') return o;
  const t = ((COSMOS_I18N || {})[lang] || {})[o.id];
  if (!t) return o;
  return { ...o, name: t.name || o.name, tagline: t.tagline || o.tagline, facts: t.facts ? t.facts.map(([k, v]) => ({ k, v })) : o.facts, sections: t.sections || o.sections, dyk: t.dyk || o.dyk };
}
function locQuiz(q, i, lang) {
  if (lang === 'en') return q;
  const t = ((COSMOS_QUIZ_I18N || {})[lang] || [])[i];
  if (!t) return q;
  return [t[0], t[1], q[2], t[2], q[4], q[5]];
}
// Throws on HTTP errors (rate limits, 5xx) so callers fall into their catch/error state
// instead of rendering an error body as data.
const getJSON = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  return r.json();
};

export default class CosmoApp extends React.Component {
  state = {
    tab: 'explore', sub: null, cat: 'All', q: '', imgs: {}, detail: null, lightbox: null, news: [], newsNext: null, newsLoading: false, newsErr: false, nf: 'Latest', article: null,
    apod: null, apodErr: false, launches: [], launchErr: false, launchFilter: 'all', isroLaunches: null, isroLaunchErr: false, opens: 0, inter: false, interN: 0, reward: null,
    saved: { topics: [], articles: [] }, reminders: {}, qs: { day: 0, levels: {} }, qLevel: 1, streak: { count: 0, best: 0, last: null },
    stats: { xp: 0, quizzes: 0, perfect: 0, hard: 0, read: [], shares: 0, sky: 0, iss: 0 },
    toast: null, push: null, alerts: false, lastSeen: 0, isroAlerts: false, lastSeenIsro: 0, loc: null, iss: null, issAlerts: false, issNear: false, otd: null, otdFallback: false,
    walls: {}, wallTheme: 'Nebulae', wall: null, dlBusy: false, wallMsg: null, unlocked: {}, kg: 70, lang: 'en', solarView: 'orbits', solarOff: 0, solarSel: 'earth',
    astroReady: true, theme: 'system', sysDark: Appearance.getColorScheme() !== 'light', shareCard: null,
  };
  detailRef = React.createRef();
  mainRef = React.createRef();
  shareRef = React.createRef();

  componentDidMount() {
    this.appearanceSub = Appearance.addChangeListener(({ colorScheme }) => this.setState({ sysDark: colorScheme !== 'light' }));
    this.backSub = BackHandler.addEventListener('hardwareBackPress', () => this.onBack());
    this.appStateSub = AppState.addEventListener('change', (s) => {
      this.appState = s;
      // The background news task may have advanced lastSeen while the app was away.
      if (s === 'active') {
        LS.reload('cosmo_lastseen').then((v) => { if (typeof v === 'number' && v > this.state.lastSeen) this.setState({ lastSeen: v }); });
        LS.reload('cosmo_lastseen_isro').then((v) => { if (typeof v === 'number' && v > this.state.lastSeenIsro) this.setState({ lastSeenIsro: v }); });
      }
    });
    const today = DAY();
    let qs = LS.get('cosmo_quiz2', null);
    if (!qs || qs.day !== today || !qs.levels) qs = { day: today, levels: {} };
    const alerts = LS.get('cosmo_newsalerts', false), issAlerts = LS.get('cosmo_issalerts', false), isroAlerts = LS.get('cosmo_isroalerts', false);
    this.setState({
      theme: LS.get('cosmo_theme', 'system'),
      saved: LS.get('cosmo_saved', { topics: [], articles: [] }), reminders: LS.get('cosmo_remind', {}), qs,
      streak: LS.get('cosmo_streak', { count: 0, best: 0, last: null }),
      stats: { ...this.state.stats, ...LS.get('cosmo_stats', {}) }, alerts, issAlerts, isroAlerts, lastSeen: LS.get('cosmo_lastseen', 0), lastSeenIsro: LS.get('cosmo_lastseen_isro', 0),
      loc: LS.get('cosmo_loc', null), lang: LS.get('cosmo_lang', 'en'), kg: LS.get('cosmo_kg', 70),
    });
    if (LS.get('cosmo_adtest', false)) setForceTestAds(true);
    if (alerts || isroAlerts) { this.startPolling(); setNewsTask(true); }
    // Tapping an OS notification (also the one that cold-started the app) opens the right screen.
    this.tapSub = Notify.onTap((d) => this.onNotifTap(d));
    OBJ.forEach((o) => this.loadImgs(o));
    this.loadNews(true); this.loadApod(); this.loadLaunches(); this.loadOtd();
    this.pollIss(); this.issTimer = setInterval(() => this.pollIss(), 10000);
  }
  componentWillUnmount() {
    try { this.appearanceSub.remove(); this.backSub.remove(); this.appStateSub.remove(); this.tapSub && this.tapSub(); } catch (e) { }
    [this.timer, this.poll, this.issTimer].forEach(clearInterval);
    [this.tt, this.pt, this.pt2].forEach(clearTimeout);
  }

  // Android back button: close the top-most layer first, like a native app.
  onBack() {
    const s = this.state;
    if (s.inter) return true;
    if (s.lightbox) { this.setState({ lightbox: null }); return true; }
    if (s.wall) { this.setState({ wall: null }); return true; }
    if (s.article) { this.setState({ article: null }); return true; }
    if (s.detail) { this.setState({ detail: null }); return true; }
    if (s.tab === 'quiz') { this.setState({ tab: 'more', sub: null }); return true; }
    if (s.sub) { this.setState({ sub: null }); return true; }
    if (s.tab !== 'explore') { this.setState({ tab: 'explore' }); return true; }
    return false;
  }

  async loadImgs(o) {
    try {
      const j = await getJSON('https://images-api.nasa.gov/search?media_type=image&q=' + encodeURIComponent(o.q));
      const arr = (j.collection.items || []).filter((i) => i.links && i.links[0]).slice(0, 12).map((i) => ({ src: httpsify(i.links[0].href), title: (i.data && i.data[0] && i.data[0].title) || '' }));
      this.setState((s) => ({ imgs: { ...s.imgs, [o.id]: arr } }));
    } catch (e) { }
  }
  async loadNews(reset) {
    const term = (NF.find((f) => f[0] === this.state.nf) || NF[0])[1];
    const url = reset ? 'https://api.spaceflightnewsapi.net/v4/articles/?limit=12' + (term ? '&search=' + encodeURIComponent(term) : '') : this.state.newsNext;
    if (!url) return;
    this.setState({ newsLoading: true, newsErr: false, ...(reset ? { news: [] } : {}) });
    try {
      const j = await getJSON(url);
      if (!j || !Array.isArray(j.results)) throw new Error('Bad news response');
      this.setState((s) => ({ news: reset ? j.results : [...s.news, ...j.results], newsNext: typeof j.next === 'string' ? j.next : null, newsLoading: false }));
    }
    catch (e) { this.setState({ newsLoading: false, newsErr: true }); }
  }
  // Cached for 3 hours: one NASA key is shared by every install (1,000 requests/hour), so each
  // phone should ask at most a few times a day. The cached copy is also shown when offline.
  async loadApod() {
    const c = LS.get('cosmo_apod', null);
    const cached = c && c.data && typeof c.data.title === 'string' ? c.data : null;
    if (cached && Date.now() - (c.at || 0) < 3 * 3600e3) { this.setState({ apod: cached }); return; }
    try {
      const j = await getJSON('https://api.nasa.gov/planetary/apod?api_key=' + NASA_API_KEY);
      if (!j || j.error || j.code || typeof j.title !== 'string') throw 0;
      this.setState({ apod: j }); LS.set('cosmo_apod', { at: Date.now(), data: j });
    }
    catch (e) { if (cached) this.setState({ apod: cached }); else this.setState({ apodErr: true }); }
  }
  async loadLaunches() {
    try {
      // mode=normal (still one request) adds mission, rocket and pad details for the details view.
      const j = await getJSON('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=6&mode=normal');
      if (!j || !Array.isArray(j.results)) throw 0;
      const list = j.results.filter((l) => l && l.id && l.name && l.net);
      this.setState({ launches: list }, () => this.syncReminders(list));
    }
    catch (e) { this.setState({ launchErr: true }); }
  }
  // ISRO launches (Launch Library agency id 31). Loaded only when the ISRO chip is first tapped,
  // to stay inside the free API limit (15 requests/hour per IP).
  async loadIsroLaunches() {
    this.setState({ isroLaunchErr: false });
    try {
      const j = await getJSON('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=6&mode=normal&lsp__id=31');
      if (!j || !Array.isArray(j.results)) throw 0;
      const list = j.results.filter((l) => l && l.id && l.name && l.net);
      this.setState({ isroLaunches: list }, () => this.syncReminders(list));
    }
    catch (e) { this.setState({ isroLaunches: [], isroLaunchErr: true }); }
  }
  setLaunchFilter(f) {
    this.setState({ launchFilter: f });
    if (f === 'isro' && (this.state.isroLaunches === null || this.state.isroLaunchErr)) this.loadIsroLaunches();
  }
  async loadOtd() {
    const d = new Date(), mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    try {
      const j = await getJSON('https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/' + mm + '/' + dd);
      const events = j && Array.isArray(j.events) ? j.events : [];
      const ev = events.filter((e) => e && typeof e.text === 'string' && SPACE_RE.test(e.text)).slice(0, 5).map((e) => {
        const pages = Array.isArray(e.pages) ? e.pages.filter(Boolean) : [];
        const pg = pages.find((p) => p.thumbnail) || pages[0] || {};
        return {
          year: e.year, text: e.text,
          img: pg.thumbnail && pg.thumbnail.source,
          big: pg.originalimage && pg.originalimage.source,
          title: (pg.titles && pg.titles.normalized) || pg.normalizedtitle || '',
          extract: typeof pg.extract === 'string' ? pg.extract : '',
          url: pg.content_urls && pg.content_urls.mobile && pg.content_urls.mobile.page,
        };
      });
      if (ev.length) this.setState({ otd: ev }); else this.setState({ otd: OTD_FALLBACK, otdFallback: true });
    } catch (e) { this.setState({ otd: OTD_FALLBACK, otdFallback: true }); }
  }
  async pollIss() {
    try {
      const j = await getJSON('https://api.wheretheiss.at/v1/satellites/25544'); if (j.latitude == null) return;
      this.setState({ iss: j });
      if (this.state.issAlerts) {
        const L = this.state.loc || DEF_LOC; const dist = hav(L.lat, L.lon, j.latitude, j.longitude);
        if (dist < 2000 && !this.state.issNear) { this.setState({ issNear: true }); this.pushNow({ title: 'The ISS is passing near you', body: 'It’s about ' + Math.round(dist).toLocaleString() + ' km away right now. Look up if it’s dark!', tab: 'sky' }); }
        else if (dist > 2500 && this.state.issNear) this.setState({ issNear: false });
      }
    } catch (e) { }
  }
  async loadWalls(theme) {
    if (this.state.walls[theme]) return; const q = (WALL_THEMES.find((t) => t[0] === theme) || WALL_THEMES[0])[1];
    try {
      const j = await getJSON('https://images-api.nasa.gov/search?media_type=image&q=' + encodeURIComponent(q));
      const arr = (j.collection.items || []).filter((i) => i.links && i.links[0] && i.data && i.data[0]).slice(0, 16).map((i) => ({ src: httpsify(i.links[0].href), title: i.data[0].title, nasa_id: i.data[0].nasa_id }));
      this.setState((s) => ({ walls: { ...s.walls, [theme]: arr } }));
    } catch (e) { this.setState((s) => ({ walls: { ...s.walls, [theme]: [] } })); }
  }
  // Resolves the best HD file for the open wallpaper (cached on the wallpaper object).
  async resolveHd(w) {
    if (w.hd) return w.hd;
    try {
      const j = await getJSON('https://images-api.nasa.gov/asset/' + encodeURIComponent(w.nasa_id));
      const hs = (j.collection.items || []).map((i) => i.href).filter((u) => /\.(jpe?g|png)$/i.test(u));
      const hd = hs.find((u) => /~orig/.test(u)) || hs.find((u) => /~large/.test(u)) || hs[0] || w.src;
      return hd.replace(/^http:/, 'https:');
    } catch (e) { return w.src; }
  }
  // Save button on the wallpaper screen: ONE tap → rewarded ad → HD image saved to the gallery.
  // The app-wide lock in rewardedSave.js ignores every tap until the ad AND the save are done.
  // One ad per wallpaper per session; saving the same one again is free.
  async downloadWall() {
    const w = this.state.wall; if (!w || isSaveBusy()) return;
    const X = this.txt(), key = w.nasa_id || w.src, ads = PROPS.showAds ?? true;
    this.setState({ dlBusy: true, wallMsg: null });
    try {
      const res = await rewardedSave(() => this.resolveHd(w), { skipAd: !ads || !!this.state.unlocked[key] });
      if (res === 'gallery' || res === 'share') this.setState((st) => ({ unlocked: { ...st.unlocked, [key]: true } }));
      if (res === 'gallery') this.setState({ wallMsg: X.tDlDone });
      if (res === 'error') { this.setState({ wallMsg: X.tDlFail }); if (AD_DEBUG && lastSaveError()) this.showToast(lastSaveError()); }
    } finally { this.setState({ dlBusy: false }); }
  }
  async shareWall() {
    const w = this.state.wall; if (!w || isSaveBusy() || this.state.dlBusy) return;
    this.setState({ dlBusy: true });
    try { await shareImage(await this.resolveHd(w)); } catch (e) {}
    finally { this.setState({ dlBusy: false }); }
  }
  bump(d) { const st = { ...this.state.stats }; Object.entries(d).forEach(([k, v]) => { st[k] = (st[k] || 0) + v; }); this.setState({ stats: st }); LS.set('cosmo_stats', st); }
  showToast(msg) { clearTimeout(this.tt); this.setState({ toast: msg }); this.tt = setTimeout(() => this.setState({ toast: null }), 2600); }
  // Where a tapped notification leads: news story → article, launch → Today, ISS → Sky.
  async onNotifTap(d) {
    const tabs = ['explore', 'news', 'today', 'sky', 'more'];
    this.setState({ push: null, lightbox: null, wall: null, detail: null, article: null });
    if (typeof d.articleId === 'number') {
      this.setTab('news');
      const known = this.state.news.find((a) => a.id === d.articleId);
      if (known) { this.setState({ article: known }); return; }
      try {
        const a = await getJSON('https://api.spaceflightnewsapi.net/v4/articles/' + d.articleId + '/');
        if (a && a.id === d.articleId && typeof a.title === 'string') this.setState({ article: a });
      } catch (e) { }
      return;
    }
    if (tabs.includes(d.tab)) this.setTab(d.tab);
  }
  pushNow(p) {
    clearTimeout(this.pt2); this.setState({ push: p }); this.pt2 = setTimeout(() => this.setState({ push: null }), 6000);
    if (this.appState && this.appState !== 'active') Notify.notifyNow(p.title, p.body, { tab: p.tab || (p.article ? 'news' : undefined), articleId: p.article ? p.article.id : undefined });
  }
  startInter(n, reward) {
    clearInterval(this.timer); this.setState({ inter: true, interN: n, reward });
    this.timer = setInterval(() => this.setState((s) => { if (s.interN <= 1) clearInterval(this.timer); return { interN: Math.max(0, s.interN - 1) }; }), 1000);
  }
  // Generic details page for Today content (APOD, On this day, launches). Reuses the article overlay.
  openInfo(o) { this.setState({ article: { kind: 'info', ...o } }); }
  launchInfo(l) {
    const m = l.mission || {}, rc = (l.rocket && l.rocket.configuration) || {}, pad = l.pad || {};
    const lines = [
      m.description,
      rc.full_name && 'Rocket: ' + rc.full_name,
      m.orbit && m.orbit.name && 'Orbit: ' + m.orbit.name,
      pad.name && 'Pad: ' + pad.name + (pad.location && pad.location.name ? ', ' + pad.location.name : ''),
      'NET: ' + new Date(l.net).toLocaleString(LOCALE, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      l.status && l.status.description,
    ].filter((x) => typeof x === 'string' && x);
    const provider = (l.launch_service_provider && l.launch_service_provider.name) || l.lsp_name || 'Launch';
    const img = typeof l.image === 'string' ? l.image : (l.image && (l.image.image_url || l.image.thumbnail_url));
    this.openInfo({ title: l.name, image_url: img, news_site: provider, published_at: l.net, summary: lines.join('\n\n'), url: null });
  }
  // Re-arms every launch reminder against fresh data: follows NET changes (scrubs/slips),
  // restores alarms after an Android backup restore, and drops reminders for past launches.
  async syncReminders(list) {
    const r = { ...this.state.reminders }; let changed = false;
    for (const id of Object.keys(r)) {
      const rem = r[id], live = list.find((l) => l.id === id);
      if (live) {
        await Notify.cancel(rem.notifId);
        r[id] = { ...rem, name: live.name, net: live.net, notifId: await Notify.scheduleLaunch(live, { prompt: false }) };
        changed = true;
      } else if (new Date(rem.net).getTime() < Date.now() - 6 * 3600e3) {
        await Notify.cancel(rem.notifId); delete r[id]; changed = true;
      }
    }
    if (changed) { this.setState({ reminders: r }); LS.set('cosmo_remind', r); }
  }
  openDetail(id) {
    const every = PROPS.interstitialEvery ?? 4, ads = PROPS.showAds ?? true;
    const opens = this.state.opens + 1;
    this.setState({ detail: id, opens });
    const st = this.state.stats; if (!(st.read || []).includes(id)) { const n = { ...st, read: [...(st.read || []), id] }; this.setState({ stats: n }); LS.set('cosmo_stats', n); }
    if (this.detailRef.current) this.detailRef.current.scrollTo({ y: 0, animated: false });
    if (ads && every > 0 && opens % every === 0) {
      if (adsAvailable()) showInterstitial(); else this.startInter(3, null);
    }
  }
  lv() { return this.state.qs.levels[this.state.qLevel] || { tries: {}, cur: 0, hints: {} }; }
  setLv(l) { const qs = { ...this.state.qs, levels: { ...this.state.qs.levels, [this.state.qLevel]: l } }; this.setState({ qs }); LS.set('cosmo_quiz2', qs); }
  curQ() { const ids = pickLevel(QUIZ, this.state.qs.day, this.state.qLevel); return QUIZ[ids[this.lv().cur]]; }
  finishLevel(tries) {
    const s = this.state, ids = pickLevel(QUIZ, s.qs.day, s.qLevel), d = s.qs.day, st = s.streak;
    const score = ids.filter((id, k) => (tries[k] || [])[0] === QUIZ[id][2]).length;
    const count = st.last === d ? st.count : (st.last === d - 1 ? st.count + 1 : 1); const ns = { count, best: Math.max(st.best || 0, count), last: d };
    this.setState({ streak: ns }); LS.set('cosmo_streak', ns);
    this.bump({ xp: 2, quizzes: 1, perfect: score === 5 ? 1 : 0, hard: s.qLevel === 3 ? 1 : 0 });
  }
  answer(i) {
    const l = this.lv(), q = this.curQ(); if (!q) return;
    const t = l.tries[l.cur] || []; if (t.includes(q[2]) || t.includes(i)) return;
    const tries = { ...l.tries, [l.cur]: [...t, i] }; this.setLv({ ...l, tries });
    if (i === q[2]) { if (!t.length) this.bump({ xp: this.state.qLevel }); if (l.cur === 4) this.finishLevel(tries); }
  }
  closeInter() {
    const s = this.state; if (!s.inter || (s.reward && s.interN > 0)) return; // ignore double taps / early taps
    const r = s.reward, res = this.interResolve; this.interResolve = null;
    this.setState({ inter: false, reward: null });
    if (res) res(true); else this.applyReward(r);
  }
  applyReward(r) {
    const s = this.state;
    if (r === 'hint') { const l = this.lv(), q = this.curQ(); if (q) { const tried = l.tries[l.cur] || []; const wrong = [0, 1, 2, 3].filter((x) => x !== q[2] && !tried.includes(x)); const g = rng(s.qs.day * 7 + l.cur); wrong.sort(() => g() - 0.5); this.setLv({ ...l, hints: { ...(l.hints || {}), [l.cur]: wrong.slice(0, 2) } }); } }
    if (r === 'skip') { const l = this.lv(), q = this.curQ(); if (q) { const tries = { ...l.tries, [l.cur]: [-1, q[2]] }; this.setLv({ ...l, tries, cur: l.cur + 1 }); if (l.cur === 4) this.finishLevel(tries); } }
  }
  triggerReward(kind) {
    // Real rewarded video in a dev/production build; simulated countdown only in Expo Go / web.
    // If no ad fills, the reward is simply given: never show a fake "ad" screen in a real build.
    if (adsAvailable()) {
      showRewarded(() => this.applyReward(kind), () => this.applyReward(kind));
      return;
    }
    this.startInter(5, kind); // Expo Go / web only: simulated placeholder
  }
  toggleTopic(id) { const X = this.txt(); const sv = this.state.saved; const has = sv.topics.includes(id); const n = { ...sv, topics: has ? sv.topics.filter((x) => x !== id) : [id, ...sv.topics] }; this.setState({ saved: n }); LS.set('cosmo_saved', n); this.showToast(has ? X.tRemoved : X.tSaved); }
  toggleArticle(a) { const X = this.txt(); const sv = this.state.saved; const has = sv.articles.some((x) => x.id === a.id); const slim = { id: a.id, title: a.title, image_url: a.image_url, news_site: a.news_site, published_at: a.published_at, summary: a.summary, url: a.url }; const n = { ...sv, articles: has ? sv.articles.filter((x) => x.id !== a.id) : [slim, ...sv.articles] }; this.setState({ saved: n }); LS.set('cosmo_saved', n); this.showToast(has ? X.tRemoved : X.tStory); }
  async toggleRemind(l) {
    const X = this.txt();
    const r = { ...this.state.reminders };
    if (r[l.id]) { Notify.cancel(r[l.id].notifId); delete r[l.id]; this.showToast(X.tRemOff); this.setState({ reminders: r }); LS.set('cosmo_remind', r); return; }
    // Saved first so it shows under More → Saved even if the OS alert can't be scheduled yet;
    // syncReminders re-tries on every app start (e.g. after notifications are allowed in Settings).
    r[l.id] = { id: l.id, name: l.name, net: l.net }; this.setState({ reminders: r }); LS.set('cosmo_remind', r);
    const notifId = await Notify.scheduleLaunch(l);
    if (notifId) {
      const r2 = { ...this.state.reminders };
      if (r2[l.id]) { r2[l.id] = { ...r2[l.id], notifId }; this.setState({ reminders: r2 }); LS.set('cosmo_remind', r2); }
      const soon = new Date(l.net).getTime() - Date.now() < 3600e3;
      this.showToast(soon ? X.tRemSoon : X.tRemSet);
    } else {
      this.showToast(!Notify.available() ? X.tNotifApp : X.tNotifOff);
    }
  }
  async checkLatest(force) {
    try {
      const j = await getJSON('https://api.spaceflightnewsapi.net/v4/articles/?limit=1'); const a = j && Array.isArray(j.results) ? j.results[0] : null; if (!a || typeof a.id !== 'number') return;
      if (force || a.id > this.state.lastSeen) {
        const had = this.state.lastSeen; this.setState({ lastSeen: a.id }); LS.set('cosmo_lastseen', a.id);
        if (force || had) { this.lastPushedId = a.id; this.pushNow({ title: 'Breaking · ' + a.news_site, body: a.title, article: a }); }
      }
    } catch (e) { }
  }
  // Same as checkLatest, for ISRO stories only. Skips a story that was just shown as a general alert.
  async checkIsro() {
    try {
      const j = await getJSON('https://api.spaceflightnewsapi.net/v4/articles/?limit=1&search=isro');
      const a = j && Array.isArray(j.results) ? j.results[0] : null; if (!a || typeof a.id !== 'number' || typeof a.title !== 'string') return;
      if (a.id > this.state.lastSeenIsro) {
        const had = this.state.lastSeenIsro; this.setState({ lastSeenIsro: a.id }); LS.set('cosmo_lastseen_isro', a.id);
        if (had && a.id !== this.lastPushedId) this.pushNow({ title: 'ISRO · ' + (a.news_site || 'Space news'), body: a.title, article: a });
      }
    } catch (e) { }
  }
  async pollAlerts() {
    if (this.state.alerts) await this.checkLatest(false);
    if (this.state.isroAlerts) await this.checkIsro();
  }
  startPolling() { clearInterval(this.poll); this.poll = setInterval(() => this.pollAlerts(), 120000); }
  // Stops polling / the background task only when neither news nor ISRO alerts are on.
  syncAlertJobs() {
    const any = this.state.alerts || this.state.isroAlerts;
    setNewsTask(any);
    if (any) this.startPolling(); else clearInterval(this.poll);
  }
  toggleIsroAlerts() {
    const X = this.txt();
    const on = !this.state.isroAlerts;
    this.setState({ isroAlerts: on }, () => this.syncAlertJobs()); LS.set('cosmo_isroalerts', on);
    if (!on) { this.showToast(X.tIsroOff); return; }
    this.checkIsro();
    Notify.askPermission().then((ok) => this.showToast(ok ? X.tIsroOn : !Notify.available() ? X.tNotifApp : X.tNotifOff));
  }
  toggleAlerts() {
    const X = this.txt();
    const on = !this.state.alerts; this.setState({ alerts: on }, () => this.syncAlertJobs()); LS.set('cosmo_newsalerts', on);
    if (on) {
      this.checkLatest(false);
      Notify.askPermission().then((ok) => this.showToast(ok ? X.tNewsOn : !Notify.available() ? X.tNotifApp : X.tNotifOff));
    }
    else this.showToast(X.tNewsOff);
  }
  toggleIssAlerts() {
    const X = this.txt(); const on = !this.state.issAlerts;
    this.setState({ issAlerts: on, issNear: false }); LS.set('cosmo_issalerts', on);
    if (!on) { this.showToast(X.tIssOff); return; }
    Notify.askPermission().then((ok) => this.showToast(ok ? X.tIssOn : !Notify.available() ? X.tNotifApp : X.tNotifOff));
  }
  async locate() {
    const X = this.txt();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return this.showToast(X.tNoLoc);
      const p = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ]);
      const loc = { lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' };
      this.setState({ loc }); LS.set('cosmo_loc', loc); this.showToast(X.tLoc);
    } catch (e) { this.showToast(X.tNoLoc); }
  }
  // Web version drew a canvas and used navigator.share. Here: render ShareCard offscreen → PNG → share sheet.
  async share(kicker, title, sub) {
    if (Platform.OS === 'web') {
      try { if (navigator.share) await navigator.share({ title: 'Cosmopedia', text: title + ' — ' + sub }); else { await navigator.clipboard.writeText(title + ' — ' + sub); this.showToast('Copied to clipboard'); } this.bump({ shares: 1 }); } catch (e) { }
      return;
    }
    this.setState({ shareCard: { kicker, title, sub } });
    await new Promise((r) => setTimeout(r, 120));
    try {
      const uri = await captureRef(this.shareRef, { format: 'png', quality: 1, width: 1080, height: 1350, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title, UTI: 'public.png' });
      this.bump({ shares: 1 });
    } catch (e) { }
    this.setState({ shareCard: null });
  }
  openUrl(url) { if (!url) return; WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url)); }
  goSub(sub) { this.setState({ tab: 'more', sub, detail: null }); if (sub === 'walls') this.loadWalls(this.state.wallTheme); if (this.mainRef.current) this.mainRef.current.scrollTo({ y: 0, animated: false }); }
  objs() { const k = this.state.lang; if (this._objK !== k) { this._objK = k; this._objs = OBJ.map((o) => locObj(o, this.state.lang)); this._qz = QUIZ.map((q, i) => locQuiz(q, i, this.state.lang)); } return this._objs; }
  qz() { this.objs(); return this._qz; }
  txt() { const lang = this.state.lang, X = COSMO_TX || {}; return Object.assign({}, TX.en, X.en || {}, TX[lang] || {}, X[lang] || {}); }
  obj(o) { o = locObj(o, this.state.lang); const im = this.state.imgs[o.id]; const img = im && im[0] && im[0].src; const X = this.txt(); return { ...o, catLabel: (X.cats || {})[o.cat] || o.cat, img, hasImg: !!img, open: () => this.openDetail(o.id) }; }
  skyCalc(loc) {
    const k = loc.lat.toFixed(2) + ',' + loc.lon.toFixed(2) + ',' + new Date().getHours();
    if (this._skyK !== k) { this._skyK = k; this._sky = Astro.tonight(loc.lat, loc.lon, new Date()); }
    return this._sky;
  }
  setTab(tab, extra) { this.setState({ tab, sub: null, ...(extra || {}) }); if (this.mainRef.current) this.mainRef.current.scrollTo({ y: 0, animated: false }); }

  renderVals() {
    const s = this.state, ads = PROPS.showAds ?? true, tx = this.txt(), A_ = Astro;
    LOCALE = tx.locale || 'en';
    const OB = this.objs(), QZ = this.qz(), CL = (c) => (tx.cats || {})[c] || c;
    const ql = s.q.trim().toLowerCase();
    const list = OB.filter((o) => (s.cat === 'All' || o.cat === s.cat) && (!ql || (o.name + ' ' + o.tagline + ' ' + o.cat).toLowerCase().includes(ql))).map((o) => this.obj(o));
    const day = Math.floor(Date.now() / 864e5);
    const featured = OB.length ? this.obj(OB[day % OB.length]) : {};
    const newsItems = [];
    s.news.forEach((a, i) => {
      if (ads && i > 0 && i % 5 === 0) newsItems.push({ isAd: true, key: 'ad' + i });
      newsItems.push({ isAd: false, key: 'n' + a.id, title: a.title, img: a.image_url, hasImg: !!a.image_url, site: a.news_site, ago: ago(a.published_at), open: () => this.setState({ article: a }) });
    });
    let detail = null;
    if (s.detail) {
      const o = OB.find((x) => x.id === s.detail);
      if (o) {
        const im = s.imgs[o.id] || []; const sv = s.saved.topics.includes(o.id);
        detail = {
          ...o, catLabel: CL(o.cat), saved: sv, toggleSave: () => this.toggleTopic(o.id), share: () => this.share(CL(o.cat) + ' · ' + o.name, (o.dyk || [])[0] || o.tagline, o.tagline),
          sections: (o.sections || []).map(([hh, p], i) => ({ h: hh, p, num: String(i + 1).padStart(2, '0') })), dyk: (o.dyk || []), hasDyk: !!(o.dyk && o.dyk.length),
          related: OB.filter((x) => x.cat === o.cat && x.id !== o.id).map((x) => this.obj(x)),
          hero: im[0] && im[0].src,
          openHero: () => { if (im.length) this.setState({ lightbox: { items: im.slice(0, 10).map((g) => ({ src: g.src, title: g.title })), index: 0 } }); },
          gallery: im.slice(1, 10).map((g, i) => ({ src: g.src, open: () => this.setState({ lightbox: { items: im.slice(0, 10).map((x) => ({ src: x.src, title: x.title })), index: i + 1 } }) })),
        };
      }
    }
    const Ar = s.article; const aSaved = !!Ar && s.saved.articles.some((x) => x.id === Ar.id);
    const ap = s.apod;
    const apod = ap
      ? { details: () => this.openInfo({ title: ap.title, image_url: ap.media_type === 'image' ? ap.url : ap.thumbnail_url, news_site: 'NASA APOD' + (ap.copyright ? ' · © ' + String(ap.copyright).trim() : ''), published_at: ap.date, summary: ap.explanation || '', url: typeof ap.date === 'string' && ap.date.length >= 10 ? 'https://apod.nasa.gov/apod/ap' + ap.date.slice(2, 10).replace(/-/g, '') + '.html' : null }),
          title: ap.title, text: ap.explanation, img: ap.media_type === 'image' ? ap.url : null, hasImg: ap.media_type === 'image', isVideo: ap.media_type !== 'image', url: ap.url, open: () => this.setState({ lightbox: { items: [{ src: ap.hdurl || ap.url, fallback: ap.url, title: ap.title }], index: 0 } }), openVideo: () => this.openUrl(ap.url) }
      : { title: s.apodErr ? 'Picture unavailable' : 'Loading today’s picture…', text: s.apodErr ? 'NASA’s free demo key has hit its hourly limit. Add your own free key from api.nasa.gov before you publish.' : '', hasImg: false, isVideo: false };

    // quiz
    const lvl = s.qLevel, L = s.qs.levels[lvl] || { tries: {}, cur: 0, hints: {} }, qday = s.qs.day || DAY();
    const ids = QZ.length ? pickLevel(QZ, qday, lvl) : [];
    const cur = Math.min(L.cur, 4), q = ids.length ? QZ[ids[cur]] : null, tries = L.tries || {}, tr = tries[L.cur] || [];
    const answered = !!q && tr.includes(q[2]), finished = L.cur >= 5, playing = !finished && !!q, removed = (L.hints || {})[L.cur] || [];
    const done = Object.keys(tries).filter((k) => ids[k] != null && tries[k].includes(QZ[ids[k]][2]));
    const score = done.filter((k) => tries[k][0] === QZ[ids[k]][2]).length;
    const tName = (id) => (OB.find((o) => o.id === id) || {}).name || '';
    const mid = new Date(); mid.setHours(24, 0, 0, 0); const ms = mid - Date.now();
    const st = s.streak, streakNow = (st.last === qday || st.last === qday - 1) ? st.count : 0;
    const quiz = {
      streak: streakNow, best: st.best || 0, scoreLabel: done.length ? score + '/' + done.length : '–', playing, finished, qnum: cur + 1, pct: (done.length / 5 * 100) + '%',
      question: q ? q[0] : '', topicCat: q ? CL((OB.find((o) => o.id === q[4]) || {}).cat || '') : '',
      levels: LEVELS.map(([n]) => { const label = [tx.lvEasy, tx.lvMedium, tx.lvHard][n - 1]; const l2 = s.qs.levels[n]; const fin = l2 && l2.cur >= 5; return { label, active: n === lvl, status: fin ? tx.done : F(tx.xpEach, { n }), pick: () => this.setState({ qLevel: n }) }; }),
      answers: q ? q[1].map((t, i) => { let k = 'normal'; if (answered) k = i === q[2] ? 'correct' : 'dim'; else if (tr.includes(i)) k = 'wrong'; else if (removed.includes(i)) k = 'dim'; return { t, letter: LETTERS[i], kind: k, pick: () => { if (k === 'normal') this.answer(i); } }; }) : [],
      canHint: playing && !answered && !removed.length && ads && tr.length < 2, canSkip: playing && !answered && ads,
      answered: playing && answered, retrying: playing && !answered && tr.length > 0,
      solvedLabel: tr.length <= 1 ? F(tx.correctXp, { n: lvl }) : F(tx.gotOnTry, { n: tr.length }),
      why: q ? q[3] : '', nextLabel: L.cur >= 4 ? tx.results : tx.next, next: () => this.setLv({ ...L, cur: L.cur + 1 }), hint: () => this.triggerReward('hint'), skip: () => this.triggerReward('skip'),
      score, msg: score === 5 ? tx.msgPerfect : score >= 3 ? tx.msgGood : tx.msgTry,
      nextIn: Math.floor(ms / 36e5) + 'h ' + Math.floor(ms % 36e5 / 6e4) + 'm',
      share: () => this.share('Daily space quiz · ' + LEVELS[lvl - 1][1], 'I scored ' + score + '/5 today', (streakNow > 1 ? streakNow + '-day streak. ' : '') + 'Can you beat me?'),
      review: finished ? ids.map((id, i) => { const qq = QZ[id]; const ok = (tries[i] || [])[0] === qq[2]; const tn = tName(qq[4]); return { q: qq[0], correct: qq[1][qq[2]], ok, topic: tn, hasTopic: !!tn, open: () => this.openDetail(qq[4]) }; }) : [],
    };

    // rank & badges
    const xp = s.stats.xp || 0; let ri = 0; RANKS.forEach((r, i) => { if (xp >= r[1]) ri = i; });
    const nextR = RANKS[ri + 1];
    const savedCount = s.saved.topics.length + s.saved.articles.length;
    const earned = { first: s.stats.quizzes >= 1, perfect: s.stats.perfect >= 1, hard: s.stats.hard >= 1, streak3: (st.best || 0) >= 3, streak7: (st.best || 0) >= 7, reader: (s.stats.read || []).length >= 10, collector: savedCount >= 5, sky: s.stats.sky >= 1, iss: s.stats.iss >= 1, share: s.stats.shares >= 1 };
    const badgeCount = Object.values(earned).filter(Boolean).length;
    const RN = tx.ranks || RANKS.map((r) => r[0]);
    const rank = { name: RN[ri], xp, badgeCount: badgeCount + '/' + BADGES.length, pct: nextR ? Math.round((xp - RANKS[ri][1]) / (nextR[1] - RANKS[ri][1]) * 100) + '%' : '100%', toNext: nextR ? F(tx.toNext, { n: nextR[1] - xp, r: RN[ri + 1] }) : tx.topRank };

    // sky
    const loc = s.loc || DEF_LOC;
    let sky = { place: loc.name, coords: loc.lat.toFixed(2) + '°, ' + loc.lon.toFixed(2) + '°', lat: loc.lat.toFixed(3), lon: loc.lon.toFixed(3), locate: () => this.locate(), noDark: false, hasDark: false, planets: [], none: false };
    let moonNow = { name: '', illum: '', halfLeft: '50%', ellW: '0%', ellC: '#232733', nextFull: '', age: '' }, moonNext = [], moonDays = [];
    if (A_) {
      const t = this.skyCalc(loc);
      const mp = A_.moonPhase(new Date());
      moonNow = { ...moonDisc(mp.frac), name: (tx.phases || {})[mp.name] || mp.name, illum: Math.round(mp.illum * 100) + '%', age: mp.age.toFixed(1), dayOf: F(tx.dayOf, { n: mp.age.toFixed(1) }), nextFull: fmtD(A_.nextPhase(new Date(), 14.77)) };
      moonNext = [[tx.newMoon, 0], [tx.firstQ, 7.38], [tx.fullMoonCap, 14.77], [tx.lastQ, 22.15]].map(([label, ag]) => ({ label, t: A_.nextPhase(new Date(), ag) })).sort((a, b) => a.t - b.t).map((n) => ({ label: n.label, date: n.t.toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' }) }));
      for (let i = 0; i < 30; i++) { const d = new Date(Date.now() + i * 864e5); const p = A_.moonPhase(d); moonDays.push({ ...moonDisc(p.frac), label: i === 0 ? tx.todayWord : d.toLocaleDateString(LOCALE, { month: 'numeric', day: 'numeric' }) }); }
      const vis = t.bodies.filter((b) => b.id !== 'moon' && b.first).sort((a, b) => b.best - a.best);
      const whenOf = (b) => b.span > 0.75 ? tx.allNight : (b.first - t.darkStart < 36e5 ? tx.evening + ' ' + fmtT(b.first) + '–' + fmtT(b.last) : (t.darkEnd - b.last < 36e5 ? tx.beforeDawn + ' ' + fmtT(b.first) + '–' + fmtT(b.last) : fmtT(b.first) + '–' + fmtT(b.last)));
      sky = {
        ...sky, noDark: t.noDark, hasDark: !t.noDark, darkStart: t.noDark ? '' : fmtT(t.darkStart), darkEnd: t.noDark ? '' : fmtT(t.darkEnd), moonIllum: Math.round(mp.illum * 100) + '%',
        planets: vis.map((b) => ({ id: b.id, name: tName(b.id) || b.id, color: PCOL[b.id], when: whenOf(b), dir: A_.compass(b.az), alt: Math.round(b.best), eye: (b.id === 'uranus' || b.id === 'neptune') ? tx.telescope : tx.nakedEye, open: () => this.openDetail(b.id) })),
        none: !t.noDark && !vis.length,
        share: () => this.share('Tonight’s sky · ' + loc.name.replace(' (default)', ''), vis.length ? vis.slice(0, 4).map((b) => tName(b.id)).join(', ') + (vis.length > 1 ? ' are' : ' is') + ' up tonight' : 'Clear skies tonight', 'Moon ' + Math.round(mp.illum * 100) + '% lit · ' + mp.name),
      };
    }
    const I = s.iss;
    const iss = I ? { pos: I.latitude.toFixed(1) + '°, ' + I.longitude.toFixed(1) + '°', alt: Math.round(I.altitude) + ' km', speed: Math.round(I.velocity).toLocaleString() + ' km/h', dist: Math.round(hav(loc.lat, loc.lon, I.latitude, I.longitude)).toLocaleString() + ' km', status: I.visibility === 'daylight' ? tx.issSun : tx.issShadow }
      : { pos: '—', alt: '—', speed: '—', dist: '—', status: tx.issConnecting };

    // solar
    let solar = { orbits: s.solarView === 'orbits', sizes: s.solarView === 'sizes', rings: [], planets: [], sel: {}, offset: s.solarOff, onOffset: (v) => this.setState({ solarOff: Math.round(v) }), dateLabel: '', sizeList: [] };
    if (A_) {
      const date = new Date(Date.now() + s.solarOff * 864e5), J = A_.jd(date), E = A_.helio('earth', J);
      const ps = PLANETS.map(([id, name, color, rad, yr], i) => {
        const hp = A_.helio(id, J), lon = Math.atan2(hp.y, hp.x), r = 26 + i * 19, sel = id === s.solarSel;
        return { id, name: (OB.find((o) => o.id === id) || {}).name || name, color, yr, hp, isSel: sel, x: 165 + r * Math.cos(lon), y: 165 - r * Math.sin(lon), s: sel ? 16 : (i >= 4 ? 13 : 10), pick: () => this.setState({ solarSel: id }) };
      });
      const sp = ps.find((p) => p.isSel) || ps[2];
      const fe = sp.id === 'earth' ? '—' : (Math.hypot(sp.hp.x - E.x, sp.hp.y - E.y, sp.hp.z - E.z) * 149.6).toFixed(0) + 'M km';
      solar = {
        ...solar, rings: PLANETS.map((_, i) => (26 + i * 19) * 2), planets: ps,
        sel: { name: sp.name, color: sp.color, au: Math.hypot(sp.hp.x, sp.hp.y, sp.hp.z).toFixed(2) + ' AU', fromEarth: fe, year: sp.yr < 1 ? Math.round(sp.yr * 365.25) + ' days' : sp.yr + ' yrs', open: () => this.openDetail(sp.id) },
        dateLabel: date.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }) + (s.solarOff ? '' : ' · ' + tx.todayWord),
        sizeList: PLANETS.map(([id, name, color, rad]) => ({ id, name: (OB.find((o) => o.id === id) || {}).name || name, color, px: Math.max(4, rad / 69911 * 150), km: (rad * 2).toLocaleString() + ' km', open: () => this.openDetail(id) })),
      };
    }

    const savedTopics = s.saved.topics.map((id) => OB.find((o) => o.id === id)).filter(Boolean).map((o) => this.obj(o));
    const savedArticles = s.saved.articles.map((a) => ({ id: a.id, title: a.title, img: a.image_url, hasImg: !!a.image_url, site: a.news_site, ago: ago(a.published_at), open: () => this.setState({ article: a }) }));
    const reminders = Object.values(s.reminders).map((r) => ({ id: r.id, name: r.name, when: new Date(r.net).toLocaleString(LOCALE, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), remove: () => this.toggleRemind(r) }));
    const W = s.wall;
    const kg = +s.kg || 0;
    const nowISO = new Date().toISOString().slice(0, 10);
    const sub = s.sub, more = s.tab === 'more';
    const RNm = RN;

    return {
      tx,
      isExplore: s.tab === 'explore', isNews: s.tab === 'news', isToday: s.tab === 'today', isQuiz: s.tab === 'quiz', isSky: s.tab === 'sky',
      isMoreHome: more && !sub, sub: more ? sub : null,
      themes: [['system', tx.themeSystem, tx.themeSystemSub], ['light', tx.themeLight, tx.themeLightSub], ['dark', tx.themeDark, tx.themeDarkSub]].map(([id, name, sub3]) => ({ id, name, sub: sub3, active: s.theme === id, pick: () => { this.setState({ theme: id }); LS.set('cosmo_theme', id); } })),
      back: () => this.setState(s.tab === 'quiz' ? { tab: 'more', sub: null } : { sub: null }),
      tabs: ['explore', 'news', 'today', 'sky', 'more'].map((id) => {
        const active = s.tab === id;
        return {
          id, active, label: { explore: tx.explore, news: tx.news, today: tx.today, sky: tx.sky, more: tx.more }[id],
          go: () => { this.setTab(id); if (id === 'sky') { this.bump({ sky: 1, iss: s.iss ? 1 : 0 }); if (!s.loc && !this.askedLoc) { this.askedLoc = true; this.locate(); } } },
        };
      }),
      cats: CATS.map((c) => ({ key: c, label: CL(c), active: s.cat === c, pick: () => this.setState({ cat: c }) })),
      q: s.q, onSearch: (t) => this.setState({ q: t }),
      objCount: OB.length, exploreFeed: list.flatMap((o, i) => (ads && i > 0 && i % 6 === 0) ? [{ isAd: true, id: 'ad' + i }, o] : [o]), noResults: OB.length > 0 && list.length === 0,
      showFeatured: s.cat === 'All' && !ql, featured,
      newsFilters: NF.map(([l]) => ({ key: l, label: l, active: s.nf === l, pick: () => this.setState({ nf: l }, () => this.loadNews(true)) })),
      newsItems, newsLoading: s.newsLoading, newsErr: s.newsErr, canLoadMore: !!s.newsNext && !s.newsLoading,
      loadMore: () => this.loadNews(false), refreshNews: () => this.loadNews(true),
      article: Ar ? {
        title: Ar.title, img: Ar.image_url, site: Ar.news_site, date: Ar.published_at ? fmt(Ar.published_at) : '', summary: Ar.summary, url: Ar.url, saved: aSaved,
        toggleSave: Ar.kind === 'info' ? null : () => this.toggleArticle(Ar),   // Today details can't be saved
        openFull: Ar.url ? () => this.openUrl(Ar.url) : null,
      } : null,
      closeArticle: () => this.setState({ article: null }),
      detail, closeDetail: () => this.setState({ detail: null }), detailRef: this.detailRef,
      lightbox: s.lightbox, closeLightbox: () => this.setState({ lightbox: null }),
      todayLabel: new Date().toLocaleDateString(LOCALE, { weekday: 'long', month: 'long', day: 'numeric' }),
      apod, launchErr: s.launchFilter === 'all' && s.launchErr,
      launchFilters: [['all', tx.lAll], ['isro', 'ISRO']].map(([key, label]) => ({ key, label, active: s.launchFilter === key, pick: () => this.setLaunchFilter(key) })),
      launchIsro: s.launchFilter === 'isro',
      isroLaunchLoading: s.launchFilter === 'isro' && s.isroLaunches === null,
      isroLaunchErr: s.launchFilter === 'isro' && s.isroLaunchErr,
      isroLaunchEmpty: s.launchFilter === 'isro' && Array.isArray(s.isroLaunches) && !s.isroLaunches.length && !s.isroLaunchErr,
      launches: (s.launchFilter === 'isro' ? (s.isroLaunches || []) : s.launches).map((l) => { const im = typeof l.image === 'string' ? l.image : (l.image && l.image.thumbnail_url); const rm = !!s.reminders[l.id]; return { id: l.id, name: l.name, provider: (l.lsp_name || (l.launch_service_provider && l.launch_service_provider.name) || ''), pad: (l.location || (l.pad && l.pad.location && l.pad.location.name) || '').split(',')[0], when: new Date(l.net).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), status: (l.status && (l.status.abbrev || l.status.name)) || '', img: im, reminded: rm, remind: () => this.toggleRemind(l), open: () => this.launchInfo(l) }; }),
      moonNow, moonNext, moonDays, openMoon: () => this.goSub('moon'),
      eclipses: ECLIPSES.filter((e) => e[0] >= nowISO).slice(0, 5).map(([d, type, where]) => { const dt = new Date(d + 'T12:00:00'); return { key: d, type, where, day: dt.getDate(), mon: dt.toLocaleDateString(LOCALE, { month: 'short' }).toUpperCase(), year: dt.getFullYear() }; }),
      otd: (s.otd || []).map((e) => ({
        year: e.year, text: e.text, img: e.img, ago: (new Date().getFullYear() - e.year) + ' ' + tx.yearsAgo,
        open: () => this.openInfo({
          title: e.title || String(e.year), image_url: e.big || e.img, news_site: 'On this day · ' + e.year,
          summary: e.extract ? e.text + '\n\n' + e.extract : e.text,
          url: e.url || 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(e.text),
        }),
      })), otdLoading: !s.otd, otdFallback: s.otdFallback,
      quiz, rank, openBadges: () => this.goSub('badges'),
      ranks: RANKS.map(([n0, x2], i) => ({ name: RNm[i] || n0, xp: x2, reached: xp >= x2 })),
      badges: BADGES.map(([id, name, desc], i) => { const tb = (tx.badges || [])[i]; return { id, name: tb ? tb[0] : name, desc: tb ? tb[1] : desc, earned: !!earned[id] }; }),
      sky, iss,
      solar, solarViews: [['orbits', tx.liveOrbits], ['sizes', tx.sizeCmp]].map(([id, label]) => ({ key: id, label, active: s.solarView === id, pick: () => this.setState({ solarView: id }) })),
      wallThemes: WALL_THEMES.map(([l]) => ({ key: l, label: l, active: s.wallTheme === l, pick: () => { this.setState({ wallTheme: l }); this.loadWalls(l); } })),
      walls: (s.walls[s.wallTheme] || []).map((w) => ({ src: w.src, key: w.nasa_id || w.src, open: () => this.setState({ wall: w, wallMsg: null }) })), wallsLoading: !s.walls[s.wallTheme],
      wall: W ? {
        src: W.src, title: W.title, busy: s.dlBusy, msg: s.wallMsg,
        dlLabel: s.dlBusy ? tx.dlBusy : (ads && !s.unlocked[W.nasa_id || W.src] ? tx.dlAd : tx.dl),
        download: () => this.downloadWall(), share: () => this.shareWall(),
        openHd: async () => this.openUrl(await this.resolveHd(W)),
        view: () => this.setState({ lightbox: { items: [{ src: W.src, fallback: W.src, title: W.title }], index: 0 } }),
      } : null,
      closeWall: () => this.setState({ wall: null }),
      weight: {
        kg: String(s.kg), onKg: (t) => { this.setState({ kg: t }); LS.set('cosmo_kg', t); },
        rows: GRAV.map(([name, gv, id]) => ({ name, val: (kg * gv).toFixed(1) + ' kg', pct: Math.min(100, gv / 2.6 * 100), open: () => this.openDetail(id) })),
        share: () => this.share('Weight on other worlds', 'On Mars I’d weigh just ' + (kg * 0.379).toFixed(1) + ' kg', 'On Jupiter: ' + (kg * 2.528).toFixed(1) + ' kg · On the Moon: ' + (kg * 0.166).toFixed(1) + ' kg'),
      },
      langs: LANGS.map(([id, name, native]) => ({ id, name, native, active: s.lang === id, pick: () => { this.setState({ lang: id }); LS.set('cosmo_lang', id); } })),
      moreItems: [['quiz', tx.quizTitle, tx.mQuizSub], ['saved', tx.mSaved, tx.mSavedSub], ['solar', tx.mSolar, tx.mSolarSub], ['moon', tx.mMoon, tx.mMoonSub], ['walls', tx.mWalls, tx.mWallsSub], ['weight', tx.mWeight, tx.mWeightSub], ['badges', tx.mBadges, tx.mBadgesSub]].map(([id, label, sub2]) => ({ id, label, sub: sub2, go: () => id === 'quiz' ? this.setTab('quiz') : this.goSub(id) })),
      settingsItems: [['theme', tx.appearance, s.theme === 'system' ? tx.themeSystem : s.theme === 'light' ? tx.themeLight : tx.themeDark], ['lang', tx.mLang, (LANGS.find((l) => l[0] === s.lang) || LANGS[0])[2]]].map(([id, label, sub2]) => ({ id, label, sub: sub2, go: () => this.goSub(id) })),
      savedTopics, savedArticles, reminders,
      savedEmpty: !savedTopics.length && !savedArticles.length && !reminders.length,
      showAds: ads,
      adTest: AD_DEBUG && adsAvailable() ? {
        testAds: usingTestAds(),
        toggleTestAds: () => { const on = !usingTestAds(); setForceTestAds(on); LS.set('cosmo_adtest', on); this.setState({ adKey: (s.adKey || 0) + 1 }); },
        rewarded: () => showRewarded(() => this.showToast('Reward earned ✓'), () => this.showToast('Rewarded ad failed — see log')),
        interstitial: () => { if (!showInterstitial()) this.showToast('No interstitial unit set'); },
        inspector: openAdInspector,
        // Debug: pretend an older story was last seen, then run the background task now.
        testNewsTask: async () => {
          LS.set('cosmo_lastseen', Math.max(1, (this.state.lastSeen || 2) - 1));
          const ok = await runNewsTaskNow();
          this.showToast(ok ? 'News task triggered · the alert should arrive in a few seconds' : 'Background task not available here');
        },
      } : null,
      interActive: s.inter, interDone: s.inter && s.interN === 0, interN: s.interN, interCloseIn: F(tx.closeIn, { n: s.interN }),
      interLabel: s.reward ? 'REWARDED AD' : 'INTERSTITIAL AD',
      interText: s.reward === 'hint' ? 'rewarded video ad · hint unlocks when it ends' : s.reward === 'skip' ? 'rewarded video ad · skip unlocks when it ends' : s.reward === 'wall' ? 'rewarded video ad · HD download unlocks when it ends' : 'full-screen AdMob interstitial',
      interCloseLabel: s.reward === 'hint' ? 'Claim hint ✓' : s.reward === 'skip' ? 'Skip question ✓' : s.reward === 'wall' ? 'Get HD image ✓' : 'Close ✕',
      closeInter: () => this.closeInter(),
      toast: s.toast, push: s.push,
      pushTap: () => { const p = s.push || {}; this.setState({ push: null, ...(p.article ? { article: p.article, tab: 'news', sub: null } : {}), ...(p.tab ? { tab: p.tab, sub: null } : {}) }); },
      alertsOn: s.alerts, toggleAlerts: () => this.toggleAlerts(),
      showIsroAlerts: s.nf === 'ISRO', isroAlertsOn: s.isroAlerts, toggleIsroAlerts: () => this.toggleIsroAlerts(),
      issAlertsOn: s.issAlerts, toggleIssAlerts: () => this.toggleIssAlerts(),
    };
  }

  render() {
    const s = this.state;
    const mode = s.theme === 'system' ? (s.sysDark ? 'dark' : 'light') : s.theme;
    if (this._mode !== mode) { this._mode = mode; this._theme = makeTheme(mode); }
    const th = this._theme;
    const v = this.renderVals();
    const { insets } = this.props;
    // A full-screen page (details, article, wallpaper, ad countdown) is open.
    // The main list is HIDDEN (display: 'none') instead of relying on zIndex: on Android the
    // overlay could be drawn behind the list, so only its bottom banner ad was visible.
    // display: 'none' keeps the list mounted, so its scroll position is kept when you go back.
    const fullPage = !!(v.detail || v.article || v.wall || v.interActive);
    return (
      <ThemeCtx.Provider value={th}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1, backgroundColor: th.bg }}>
          <ScrollView ref={this.mainRef} style={{ flex: 1, display: fullPage ? 'none' : 'flex' }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View key={'ads' + (s.adKey || 0)}>
              {v.isExplore && <ExploreScreen v={v} />}
              {v.isNews && <NewsScreen v={v} />}
              {v.isToday && <TodayScreen v={v} />}
              {v.isQuiz && <QuizScreen v={v} />}
              {v.isSky && <SkyScreen v={v} />}
              {(v.isMoreHome || v.sub) && <MoreScreens v={v} />}
            </View>
          </ScrollView>
          {/* Hide the tab bar while a full-screen page is open (Android ignores zIndex for overlays) */}
          {!fullPage && (<>
            <TabBar v={v} bottom={insets.bottom} />
          </>)}
          <ErrorBoundary onReset={() => this.setState({ detail: null, article: null, wall: null, lightbox: null })}>
            <Overlays v={v} insets={insets} />
          </ErrorBoundary>
          <ShareCard ref={this.shareRef} card={s.shareCard} />
        </View>
      </ThemeCtx.Provider>
    );
  }
}