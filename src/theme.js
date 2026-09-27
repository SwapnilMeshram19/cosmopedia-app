import { THEMES } from './constants';

// Turns the web app's CSS custom properties (--bg, --surface, ...) into a JS theme object.
const camel = (k) => k.replace(/^--/, '').replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

export function makeTheme(mode) {
  const src = THEMES[mode] || THEMES.dark;
  const t = { mode };
  Object.entries(src).forEach(([k, v]) => { t[camel(k)] = v; });
  // rgba(var(--ink), a)
  t.ink = (a) => `rgba(${src['--ink']},${a})`;
  t.bgA = (a) => `rgba(${src['--bg-rgb']},${a})`;
  return t;
}

// Font families per weight (Android ignores fontWeight on custom fonts, so pick the file).
export const FONTS = {
  sans: { 400: 'SpaceGrotesk_400Regular', 500: 'SpaceGrotesk_500Medium', 600: 'SpaceGrotesk_600SemiBold', 700: 'SpaceGrotesk_700Bold' },
  mono: { 400: 'IBMPlexMono_400Regular', 500: 'IBMPlexMono_500Medium', 600: 'IBMPlexMono_600SemiBold', 700: 'IBMPlexMono_600SemiBold' },
};
