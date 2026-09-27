import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { T, useT } from '../components/ui';

function Icon({ id, c }) {
  if (id === 'explore') return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" /><Path d="M15 9l-4.2 2.8L9 16l4.2-2.8L15 9z" fill={c} /></Svg>
  );
  if (id === 'news') return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none"><Rect x="3.5" y="5" width="17" height="14" rx="1.5" stroke={c} strokeWidth="1.8" /><Path d="M7.5 9h9M7.5 12.5h9M7.5 16h5" stroke={c} strokeWidth="1.6" strokeLinecap="round" /></Svg>
  );
  if (id === 'today') return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="4.3" stroke={c} strokeWidth="1.8" /><Path d="M12 3v2.4M12 18.6V21M4.5 12H6.9M17.1 12h2.4M6.3 6.3l1.7 1.7M16 16l1.7 1.7M6.3 17.7L8 16M16 8l1.7-1.7" stroke={c} strokeWidth="1.6" strokeLinecap="round" /></Svg>
  );
  if (id === 'sky') return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none"><Path d="M15.5 13.5A6.5 6.5 0 0 1 9 5.2a7 7 0 1 0 8.4 10.2 6.4 6.4 0 0 1-1.9-1.9z" fill={c} /><Path d="M18.5 5l.8 1.7L21 7.5l-1.7.8-.8 1.7-.8-1.7L16 7.5l1.7-.8.8-1.7z" fill={c} /></Svg>
  );
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none"><Circle cx="6" cy="12" r="1.8" fill={c} /><Circle cx="12" cy="12" r="1.8" fill={c} /><Circle cx="18" cy="12" r="1.8" fill={c} /></Svg>
  );
}

export default function TabBar({ v, bottom }) {
  const th = useT();
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: th.ink(0.07), backgroundColor: th.nav, paddingTop: 8, paddingBottom: Math.max(12, bottom), height: 66 + Math.max(12, bottom) }}>
      {v.tabs.map((t) => (
        <Pressable key={t.id} onPress={t.go} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.active ? 'rgba(240,180,106,.14)' : 'transparent' }}>
            <Icon id={t.id} c={t.active ? th.amber : th.muted} />
          </View>
          <T size={11.5} w={t.active ? 600 : 500} color={t.active ? th.text : th.muted}>{t.label}</T>
        </Pressable>
      ))}
    </View>
  );
}
