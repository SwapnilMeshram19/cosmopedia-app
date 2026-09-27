import React, { createContext, useContext, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Pattern, Rect, Circle, ClipPath, G, Ellipse } from 'react-native-svg';
import { FONTS } from '../theme';
import { httpsify } from '../constants';

export const ThemeCtx = createContext(null);
export const useT = () => useContext(ThemeCtx);

/* ---------- Text ---------- */
// size, w (weight), mono, color, ls (letter-spacing in em, like the CSS), upper, lh (line-height multiplier)
export function T({ size = 15, w = 400, mono, color, ls, upper, lh, lines, style, children, onPress, align }) {
  const th = useT();
  const s = {
    fontFamily: (mono ? FONTS.mono : FONTS.sans)[w] || (mono ? FONTS.mono[400] : FONTS.sans[400]),
    fontSize: size,
    color: color || th.text,
  };
  if (ls) s.letterSpacing = ls * size;
  if (upper) s.textTransform = 'uppercase';
  if (lh) s.lineHeight = Math.round(lh * size);
  if (align) s.textAlign = align;
  return (
    <Text style={[s, style]} numberOfLines={lines} onPress={onPress} suppressHighlighting>
      {children}
    </Text>
  );
}

/* ---------- Striped placeholder: repeating-linear-gradient(135deg, stripe1 0 8px, surface 8px 16px) ---------- */
let _pid = 0;
export function Stripes({ a, b, step = 8, style, radius }) {
  const th = useT();
  const [id] = useState(() => 'stp' + (_pid++));
  const c1 = a || th.stripe1, c2 = b || th.surface;
  const period = step * 2 * Math.SQRT2;
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: radius }, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={period} height={period} patternTransform="rotate(45)">
            <Rect x="0" y="0" width={period} height={period} fill={c2} />
            <Rect x="0" y="0" width={period / 2} height={period} fill={c1} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/* ---------- Image with fallback (web used a global onerror -> "IMAGE UNAVAILABLE" svg) ---------- */
export function Img({ src, style, contentFit = 'cover' }) {
  const th = useT();
  const [bad, setBad] = useState(false);
  if (!src) return null;
  if (bad) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#11131a', alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={44} height={44} viewBox="0 0 44 44">
          <Circle cx="22" cy="22" r="18" fill="none" stroke="#3a3f4c" strokeWidth="2.5" />
          <Circle cx="22" cy="22" r="4" fill="#f0b46a" />
        </Svg>
        <T mono w={400} size={8} color="#6b7180" ls={0.15} style={{ marginTop: 6 }}>IMAGE UNAVAILABLE</T>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: httpsify(src) }}
      style={[StyleSheet.absoluteFill, style]}
      contentFit={contentFit}
      transition={150}
      cachePolicy="memory-disk"
      onError={() => setBad(true)}
    />
  );
}

/* ---------- Header: kicker + big title ---------- */
export function Header({ kicker, title, right }) {
  const th = useT();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <View style={{ flex: 1 }}>
        <Kicker>{kicker}</Kicker>
        <T size={30} w={700} ls={-0.02}>{title}</T>
      </View>
      {right}
    </View>
  );
}

export function Kicker({ children, color, style }) {
  const th = useT();
  return <T mono w={500} size={11} ls={0.14} upper color={color || th.muted} style={style}>{children}</T>;
}

/* ---------- Pills / chips ---------- */
export function Chip({ label, active, onPress, accent = 'amber' }) {
  const th = useT();
  const bg = accent === 'blue' ? th.blue : th.amber;
  const fg = accent === 'blue' ? th.onBlue : th.onAccent;
  return (
    <Pressable onPress={onPress} style={{
      height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center',
      backgroundColor: active ? bg : 'transparent', borderWidth: active ? 0 : 1, borderColor: th.ink(0.1),
    }}>
      <T size={13} w={active ? 600 : 500} color={active ? fg : th.text2}>{label}</T>
    </Pressable>
  );
}

export function ChipRow({ children }) {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {children}
    </ScrollView>
  );
}

export function BackBtn({ label, onPress }) {
  const th = useT();
  return (
    <Pressable onPress={onPress} style={{ alignSelf: 'flex-start', height: 34, paddingLeft: 10, paddingRight: 14, borderRadius: 17, borderWidth: 1, borderColor: th.ink(0.1), justifyContent: 'center' }}>
      <T size={13} w={500} color={th.text2}>{label}</T>
    </Pressable>
  );
}

/* ---------- Buttons ---------- */
export function Btn({ label, onPress, variant = 'surface', height = 44, style, textStyle, size = 14, radius = 14, disabled = false }) {
  const th = useT();
  const V = {
    surface: { bg: th.surface, border: th.ink(0.1), fg: th.text, w: 500 },
    amber: { bg: th.amber, border: null, fg: th.onAccent, w: 600 },
    blue: { bg: th.blue, border: null, fg: th.onBlue, w: 600 },
    outlineBlue: { bg: 'transparent', border: 'rgba(143,184,255,.5)', fg: th.blue, w: 500 },
    ghost: { bg: 'transparent', border: th.ink(0.1), fg: th.text2, w: 500 },
  }[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[{
      height, borderRadius: radius, backgroundColor: V.bg, borderWidth: V.border ? 1 : 0, borderColor: V.border,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, opacity: disabled ? 0.55 : 1,
    }, style]}>
      <T size={size} w={V.w} color={V.fg} style={textStyle}>{label}</T>
    </Pressable>
  );
}

export function Toggle({ on, onPress }) {
  const th = useT();
  return (
    <Pressable onPress={onPress} style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: on ? th.blue : th.toggleOff }}>
      <View style={{ position: 'absolute', top: 3, [on ? 'right' : 'left']: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: on ? th.bg : th.muted }} />
    </Pressable>
  );
}

export function Diamond({ size = 8, color, outline }) {
  return (
    <View style={{
      width: size, height: size, transform: [{ rotate: '45deg' }],
      backgroundColor: outline ? 'transparent' : color, borderWidth: outline ? 1.5 : 0, borderColor: outline || undefined,
    }} />
  );
}

/* ---------- Card ---------- */
export function Card({ children, style, onPress, border }) {
  const th = useT();
  const s = [{ borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: border || th.ink(0.06) }, style];
  if (onPress) return <Pressable onPress={onPress} style={s}>{children}</Pressable>;
  return <View style={s}>{children}</View>;
}

/* ---------- Grid (CSS grid-template-columns: repeat(n,1fr)) ---------- */
export function Grid({ cols = 2, gap = 12, rowGap, children, style, lineColor, radius }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const rows = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={[{ gap: rowGap ?? gap }, lineColor && { backgroundColor: lineColor, borderRadius: radius, overflow: 'hidden' }, style]}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {r.map((c, j) => <View key={j} style={{ flex: 1 }}>{c}</View>)}
          {Array.from({ length: cols - r.length }).map((_, k) => <View key={'p' + k} style={{ flex: 1 }} />)}
        </View>
      ))}
    </View>
  );
}

// The 1px-gap stat grids (label + value cells)
export function StatGrid({ cols = 3, cells, valueSize = 17, valueWeight = 600, upper }) {
  const th = useT();
  return (
    <Grid cols={cols} gap={1} lineColor={th.ink(0.07)} radius={16}>
      {cells.map((c, i) => (
        <View key={i} style={{ backgroundColor: th.cell, paddingVertical: 12, paddingHorizontal: 14, gap: 2, flex: 1 }}>
          <T mono w={500} size={9.5} ls={0.12} upper={upper} color={th.muted}>{c.k}</T>
          {c.node || <T size={valueSize} w={valueWeight} color={c.color}>{c.v}</T>}
        </View>
      ))}
    </Grid>
  );
}

/* ---------- Moon disc (half-disc + ellipse terminator, as in the web version) ---------- */
let _mid = 0;
export function MoonDisc({ size, m }) {
  const th = useT();
  const [id] = useState(() => 'moon' + (_mid++));
  const ellC = m.ellC === 'var(--moon-dark)' ? th.moonDark : m.ellC;
  const r = size / 2;
  const rx = (parseFloat(m.ellW) / 100) * size / 2;
  const halfX = m.halfLeft === '50%' ? r : 0;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id={id}><Circle cx={r} cy={r} r={r} /></ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <Rect x={0} y={0} width={size} height={size} fill={th.moonDark} />
        <Rect x={halfX} y={0} width={r} height={size} fill="#e9e4d6" />
        <Ellipse cx={r} cy={r} rx={rx} ry={r} fill={ellC} />
      </G>
    </Svg>
  );
}

export const Row = ({ style, children, gap }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
export const Col = ({ style, children, gap }) => <View style={[{ gap }, style]}>{children}</View>;