import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { rng } from '../constants';
import { FONTS } from '../theme';

// Same 1080×1350 card the web app drew on a <canvas>, laid out at 1/3 scale and captured at 3×.
const S = 1 / 3;
const W = 1080 * S, H = 1350 * S;

export const ShareCard = forwardRef(function ShareCard({ card }, ref) {
  const stars = useMemo(() => {
    const g = rng(7), out = [];
    for (let i = 0; i < 140; i++) { const a = 0.15 + g() * 0.5, x = g() * 1080, y = g() * 1350, r = g() * 2 + 0.4; out.push({ a, x, y, r }); }
    return out;
  }, []);
  if (!card) return null;
  return (
    <View ref={ref} collapsable={false} style={{ position: 'absolute', left: -5000, top: 0, width: W, height: H, backgroundColor: '#07080c' }}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        {stars.map((s, i) => <Circle key={i} cx={s.x * S} cy={s.y * S} r={s.r * S} fill={`rgba(255,255,255,${s.a})`} />)}
        <Rect x={(110 - 12) * S} y={(190 - 12) * S} width={24 * S} height={24 * S} fill="#f0b46a" transform={`rotate(45 ${110 * S} ${190 * S})`} />
      </Svg>
      <Text numberOfLines={1} style={{ position: 'absolute', left: 150 * S, top: (202 - 28) * S, fontFamily: FONTS.mono[500], fontSize: 32 * S, color: '#f0b46a' }}>
        {String(card.kicker).toUpperCase().slice(0, 52)}
      </Text>
      <View style={{ position: 'absolute', left: 110 * S, top: (380 - 76) * S, width: 860 * S }}>
        <Text numberOfLines={6} style={{ fontFamily: FONTS.sans[700], fontSize: 84 * S, lineHeight: 98 * S, color: '#eceef3' }}>{card.title}</Text>
        <Text numberOfLines={5} style={{ marginTop: 30 * S, fontFamily: FONTS.sans[400], fontSize: 42 * S, lineHeight: 58 * S, color: '#c9ccd4' }}>{card.sub}</Text>
      </View>
      <Text style={{ position: 'absolute', left: 110 * S, top: (1250 - 26) * S, fontFamily: FONTS.mono[500], fontSize: 30 * S, color: '#8a90a0' }}>
        COSMOPEDIA · space in your pocket
      </Text>
    </View>
  );
});
