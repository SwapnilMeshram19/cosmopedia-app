import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, useT, Header, Chip, ChipRow, Stripes, Img } from '../components/ui';
import { FONTS } from '../theme';
import { AdSlot } from '../ads';

export function ObjCard({ o, imgH = 118, nameSize = 16 }) {
  const th = useT();
  return (
    <Pressable onPress={o.open} style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
      <View style={{ height: imgH }}>
        <Stripes />
        {o.hasImg && <Img src={o.img} />}
      </View>
      <View style={{ paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, gap: 2 }}>
        <T mono w={500} size={9.5} ls={0.12} upper color={th.muted} lines={1}>{o.catLabel}</T>
        <T size={nameSize} w={600} lines={1}>{o.name}</T>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen({ v }) {
  const th = useT(), tx = v.tx, f = v.featured;
  // Build 2-column rows; ads span the full width like grid-column:1/-1
  const rows = []; let buf = [];
  v.exploreFeed.forEach((o) => {
    if (o.isAd) { if (buf.length) rows.push(buf); buf = []; rows.push(o); }
    else { buf.push(o); if (buf.length === 2) { rows.push(buf); buf = []; } }
  });
  if (buf.length) rows.push(buf);

  return (
    <View style={{ gap: 18 }}>
      <Header kicker={tx.enc} title="Cosmopedia"
        right={<T mono w={500} size={11} color={th.muted}>{v.objCount} {tx.entries}</T>} />

      <TextInput value={v.q} onChangeText={v.onSearch} placeholder={tx.search} placeholderTextColor="#6b7180"
        style={{ height: 46, borderRadius: 14, borderWidth: 1, borderColor: th.ink(0.08), backgroundColor: th.surface, color: th.text, paddingHorizontal: 16, fontFamily: FONTS.sans[400], fontSize: 15 }} />

      <ChipRow>{v.cats.map((c) => <Chip key={c.key} label={c.label} active={c.active} onPress={c.pick} />)}</ChipRow>

      {v.showAds && <AdSlot kind="horizontal" />}

      {v.showFeatured && !!f.name && (
        <Pressable onPress={f.open} style={{ height: 220, borderRadius: 22, overflow: 'hidden' }}>
          <Stripes />
          {f.hasImg && <Img src={f.img} />}
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.85)']} locations={[0, 0.35, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 16, gap: 4 }}>
            <T mono w={500} size={10} ls={0.14} upper color="#f0b46a">{tx.ootd} · {f.catLabel}</T>
            <T size={26} w={700} ls={-0.01} color="#fff">{f.name}</T>
            <T size={13} color="rgba(255,255,255,.85)">{f.tagline}</T>
          </View>
        </Pressable>
      )}

      <View style={{ gap: 12 }}>
        {rows.map((r, i) => Array.isArray(r) ? (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            {r.map((o) => <View key={o.id} style={{ flex: 1 }}><ObjCard o={o} /></View>)}
            {r.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ) : (
          <AdSlot key={r.id} kind="rectangle" />
        ))}
      </View>
      {v.noResults && <T size={14} color={th.muted} align="center" style={{ paddingVertical: 30 }}>{tx.nothing}</T>}
    </View>
  );
}
